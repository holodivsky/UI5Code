sap.ui.define([
    "infopulse/cv/infopulse-cvapp-ui/controller/BaseController",
    "infopulse/cv/infopulse-cvapp-ui/model/formatter",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
    "sap/ui/model/Sorter"
], function (BaseController, formatter, JSONModel, MessageBox, MessageToast, Fragment, Sorter) {
    "use strict";

    return BaseController.extend("infopulse.cv.infopulse-cvapp-ui.controller.EmployeePage", {

        formatter: formatter,

        onInit: function () {
            BaseController.prototype.onInit.apply(this, arguments);
            this.getOwnerComponent().getService("ShellUIService").then(this._setNavToEmployeeList.bind(this)).catch(function () {
                this.getRouter().navTo("notFound");
            });
            this.getRouter().getRoute("employeePage").attachPatternMatched(this._onPersonMatched, this);
        },

        _setNavToEmployeeList: function (oShellService) {
            oShellService.setBackNavigation(function () {
                this.getRouter().navTo("employeeList", null, true);
            }.bind(this));
        },

        _onPersonMatched: function (oEvent) {
            var iEmployeeId = oEvent.getParameter("arguments").employeeId;

            this.getView().bindElement({
                path: "/CVData(" + iEmployeeId + ")/",
                events: {
                    dataRequested: function () {
                        this.getModel("viewModel").setProperty("/busy", true);
                    },
                    dataReceived: function (oData) {
                        var oError = oData.getParameter("error");

                        if (oError === undefined) {
                            this.getRouter().navTo("notFound", null, true);
                        } else {
                            this.getModel("viewModel").setProperty("/busy", false);
                        }
                    }.bind(this)
                }
            });
        },

        getEmployeeListItemsBinding: function () {
            return this.byId("listOfResume").getBinding("items");
        },

        handleFileUploaderChange: function (oEvent) {
            var sEmployeeName = this.getView().byId("employeePageHeader").getObjectTitle();
            var sFileType = oEvent.getParameters().files[0].type;
            var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
            var sFileName = oEvent.getParameters().files[0].name;

            if (sFileName.search(name.replace(" ", ".")) !== -1) {
                this.gsFileType = sFileType;
                this.gsFileName = sFileName;
            } else {
                MessageBox.warning(
                    "File name should be '" + sEmployeeName.replace(" ", ".") + "'", {
                        actions: [ sap.m.MessageBox.Action.OK ],
                        styleClass: bCompact ? "sapUiSizeCompact" : "",
                        onClose: function (sAction) {
                            if (sAction !== "OK") {
                                this.byId("fileUploader").destroyHeaderParameters();
                                this.byId("fileUploader").setValue("");
                            }
                        }
                    }
                );
            }
        },

        onUploadPDFComplete: function (oEvent) {
            var dtCurrentDate = new Date();
            var oTable = this.byId("listOfResume");
            var oModel = this.getModel();
            var oEntry = {};
            var iEmployeeId = oEvent.getSource().getBindingContext().getProperty("ID");

            MessageToast.show("Upload finish");
            this.getView().setBusy(false);
            oEntry.CVSTATUS = "ForApproval";
            oEntry.UPLOAD = dtCurrentDate;
            oModel.update("/CVData(" + iEmployeeId + ")", oEntry, null);
            this.byId("fileUploader").destroyHeaderParameters();
            this.byId("fileUploader").setValue("");
            oTable.getBinding("items").refresh();
        },

        handleUploadPress: function (oEvent) {
            var oFileUploader = this.getView().byId("fileUploader");
            var sFileFromUloaderText = oFileUploader.getValue();
            var iEmployeeId = oEvent.getSource().getBindingContext().getProperty("ID");

            if (sFileFromUloaderText) {
                MessageToast.show("Upload start");
                this.getView().setBusy(true);
                oFileUploader.setUploadUrl("/fiori/xs/cv_file.xsjs?cmd=put&ID=" + iEmployeeId + "&fname=" + this.gsFileName + "&mType=" + this.gsFileType);
                oFileUploader.upload();
            } else {
                MessageToast.show("Choose file");
            }
        },

        onOpenViewSettings: function (oEvent) {
            var sDialogTab = "sort";

            if (!this._oFragment) {
                Fragment.load({
                    name: "infopulse.cv.infopulse-cvapp-ui.view.SortGroupResume",
                    controller: this
                }).then(function (oPopover) {
                    this._oFragment = oPopover;
                    this.getView().addDependent(this._oFragment);
                    this._oFragment.open(sDialogTab);
                }.bind(this));
            } else {
                this._oFragment.open(sDialogTab);
            }
        },

        onConfirmViewSettingsDialog: function (oEvent) {
            var mParams = oEvent.getParameters();
            var sPath;
            var bDescending;
            var aSorters = [];

            sPath = mParams.sortItem.getKey();
            bDescending = mParams.sortDescending;
            aSorters.push(new Sorter(sPath, bDescending));

            this.getEmployeeListItemsBinding().sort(aSorters);
        }
    });
});
