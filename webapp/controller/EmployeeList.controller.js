sap.ui.define([
    "infopulse/cv/infopulse-cvapp-ui/controller/BaseController",
    "infopulse/cv/infopulse-cvapp-ui/model/formatter",
    "sap/ui/model/json/JSONModel",
    "sap/m/GroupHeaderListItem",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Filter",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
    "sap/ui/core/util/Export",
    "sap/ui/core/util/ExportTypeCSV",
    "sap/ui/export/Spreadsheet",
    "sap/ui/model/Sorter"
], function (BaseController, formatter, JSONModel, GroupHeaderListItem, FilterOperator, Filter, MessageBox, MessageToast, Fragment, Export, ExportTypeCSV, Spreadsheet, Sorter) {
    "use strict";
    return BaseController.extend("infopulse.cv.infopulse-cvapp-ui.controller.EmployeeList", {
        formatter: formatter,
        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */
        /**
         * Called when the EmployeeList controller is instantiated.
         * @public
         */
        onInit: function () {
            BaseController.prototype.onInit.apply(this, arguments);
            this._initializeFilterModel();
        },

        _initializeFilterModel: function () {
            this.setModel(new JSONModel({
                departmentFilter: "ALL",
                statusFilter: "ALL",
                searchFilter: ""
            }), "filterModel");
        },

        onSelectDepartmentChange: function (oEvent) {
            var sDepartmentKey = oEvent.getSource().getSelectedKey();
            this.setFilterModelProprety("departmentFilter", sDepartmentKey);
        },

        onSelectStatusChange: function (oEvent) {
            var sStatusKey = oEvent.getSource().getSelectedKey();
            this.setFilterModelProprety("statusFilter", sStatusKey);
        },

        onSearchByName: function (oEvent) {
            var sSearchByNameKey = oEvent.getSource().getValue();
            this.setFilterModelProprety("searchFilter", sSearchByNameKey);
        },

        setFilterModelProprety: function (sProperty, sFilterKey) {
            this.getModel("filterModel").setProperty("/" + sProperty, sFilterKey);
            this.onFilterSearch();
        },

        onFilterSearch: function () {
            var aFilters = [
                this.createFilterFromFilterBar("DEPARTMENT", this.getModel("filterModel").getProperty("/departmentFilter"), false),
                this.createFilterFromFilterBar("CVSTATUS", this.getModel("filterModel").getProperty("/statusFilter"), false),
                this.createFilterFromFilterBar("NAME", this.getModel("filterModel").getProperty("/searchFilter"), true)
            ];
            this.getEmployeeListItemsBinding().filter(aFilters);
        },

        getEmployeeListItemsBinding: function () {
            return this.byId("employeeListTable").getBinding("items");
        },

        createFilterFromFilterBar: function (sKey, sFilterValue, bSearchField) {
            var sFilterOperator = bSearchField || sFilterValue === "ALL" ? FilterOperator.Contains : FilterOperator.EQ;
            var sAllValue = sFilterValue === "ALL" ? "" : sFilterValue;
            return new Filter({
                path: sKey,
                operator: sFilterOperator,
                value1: sAllValue,
                caseSensitive: false
            });
        },

        onCompletedFromDateChange: function (oEvent) {
            var sDateForCompare = oEvent.getSource().getDateValue();
            this.getEmployeeListItemsBinding().filter();
            this.getEmployeeListItemsBinding().attachEventOnce("dataReceived", this.getModel(), function () {
                this._changeEmployeeStatus(sDateForCompare);
            }.bind(this));
        },

        _changeEmployeeStatus: function (sDateForCompare) {
            this.onRefresh();
            var oEmployeeList = this.getView().byId("employeeListTable");
            var iDateForCompare = sDateForCompare.valueOf();
            var aEmloyeeListItems = oEmployeeList.getItems();

            this.getModel("viewModel").setProperty("/outdateDate", sDateForCompare);
            aEmloyeeListItems.forEach(function (oItem) {
                var oItemBindingContext = oItem.getBindingContext();
                var sCvStatusId = oItemBindingContext ? oItemBindingContext.getProperty("CVSTATUS") : null;
                var bIsStatusChangeable = sCvStatusId === "NeedToUpdate" || sCvStatusId === "Complete";

                if (bIsStatusChangeable) {
                    var sStatus = oItemBindingContext.getProperty("UPDATED").valueOf() > iDateForCompare ? "Complete" : "NeedToUpdate";
                    var ID = oItemBindingContext.getProperty("ID");
                    var oEntry = {
                        CVSTATUS: sStatus
                    };

                    this.getModel().update("/CVData(" + ID + ")", oEntry);
                }
            }.bind(this));
            this.onFilterSearch();
            this.onRefresh();
        },

        _processPressedButton: function (oItemBindingContext) {
            var sMessageBoxText;
            var sButton;
            var sName = oItemBindingContext.getProperty("NAME");
            var sLink = this.getModel("employeeURL").getProperty("/employeeUrl");
            var oActionParameters = {};
            var sEmailText;

            switch (oItemBindingContext.getProperty("CVSTATUS")) {
            case "ForApproval":
                oActionParameters.sEmployeeID = oItemBindingContext.getProperty("ID");
                oActionParameters.sStatus = "InProgress";
                sEmailText = "manageResumes.rejectCv.emailText";
                sMessageBoxText = "confirm.rejectNewCV.msg";
                sButton = "manageResumes.employeeTable.actionButton.reject";
                break;
            case "InProgress":
                sEmailText = "manageResumes.repeatNotice.emailText";
                sMessageBoxText = "confirm.sendEmailAndAskForUpdate.msg";
                sButton = "manageResumes.employeeTable.actionButton.repeatNotice";
                break;
            default :
                oActionParameters.sEmployeeID = oItemBindingContext.getProperty("ID");
                oActionParameters.sStatus = "InProgress";
                oActionParameters.isRequestedForUpdateDate = true;
                sEmailText = "manageResumes.requestForUpdate.emailText";
                sMessageBoxText = "confirm.sendEmailAndAskForUpdate.msg";
                sButton = "manageResumes.employeeTable.actionButton.sendEmail";
                break;
            }
            oActionParameters.sEmailSubject = this.getResourceBundleText("manageResumes.requestForUpdate.subject.message");
            oActionParameters.sEmailText = this.getResourceBundleText(sEmailText, [sName, sLink]);
            oActionParameters.sPersonEmail = oItemBindingContext.getProperty("EMAIL");

            sMessageBoxText = this.getResourceBundleText(sMessageBoxText);
            sButton = this.getResourceBundleText(sButton);
            this._showConfirmationMessageBox(sMessageBoxText, sButton, oActionParameters);
            this.onRefresh();
        },

        onRepeatNoticePress: function (oEvent) {
            var oItemBindingContext = oEvent.getSource().getBindingContext();
            this._processPressedButton(oItemBindingContext);
        },

        onSendRequestForUpdatePress: function (oEvent) {
            var oItemBindingContext = oEvent.getSource().getBindingContext();
            this._processPressedButton(oItemBindingContext);
        },

        onRejectEmployeeCvPress: function (oEvent) {
            var oItemBindingContext = oEvent.getSource().getBindingContext();
            this._processPressedButton(oItemBindingContext);
        },

        onConfirmEmployeeCvPress: function (oEvent) {
            var oItemBindingContext = oEvent.getSource().getBindingContext();
            var sMessageBoxText = this.getResourceBundleText("confirm.acceptNewCV.msg");
            var sButton = this.getResourceBundleText("manageResumes.employeeTable.actionButton.accept");
            var oActionParameters = {
                sEmployeeID: oItemBindingContext.getProperty("ID"),
                sStatus: "Complete",
                isDateUpdateable: true
            };
            this._showConfirmationMessageBox(sMessageBoxText, sButton, oActionParameters);
            this.onRefresh();
        },

        _showConfirmationMessageBox: function (sMessageBoxText, sButton, oActionParameters) {
            MessageBox.warning(
                sMessageBoxText, {
                    actions: [sButton, sap.m.MessageBox.Action.CANCEL],
                    onClose: function (sAction) {
                        if (sAction === sButton) this._onHandleAcceptAction(oActionParameters);
                    }.bind(this)
                }
            );
        },

        _onHandleAcceptAction: function (oActionParameters) {
            if (oActionParameters.sPersonEmail) {
                sap.m.URLHelper.triggerEmail(
                    oActionParameters.sPersonEmail,
                    oActionParameters.sEmailSubject,
                    oActionParameters.sEmailText
                );
            }
            if (oActionParameters.sEmployeeID) {
                this._chageForSendRequestForUpdate(
                    oActionParameters.sEmployeeID,
                    oActionParameters.sStatus,
                    oActionParameters.isRequestedForUpdateDate,
                    oActionParameters.isDateUpdateable
                );
            }
        },

        _chageForSendRequestForUpdate: function (iEmployeeID, sCvStatus, dtRequestForUpdateDate, dtLastUpdate) {
            var oModel = this.getModel();
            var oEntry = {};
            var sPath = "/CVData(" + iEmployeeID + ")";

            if (sCvStatus) oEntry.CVSTATUS = sCvStatus;
            if (dtRequestForUpdateDate) oEntry.REQUEST = new Date();
            if (dtLastUpdate) oEntry.UPDATED = new Date();

            oModel.update(
                sPath,
                oEntry,
                null,
                function () { MessageToast.show(this.getResourceBundle("confirm.done.msg")); }
            );
        },

        onEmployeeInfoPopover: function (oEvent) {
            var iEmployeeId = oEvent.getSource().getBindingContext().getProperty("ID");
            var oButton = oEvent.getSource();

            if (!this._oPopover) {
                Fragment.load({
                    name: "infopulse.cv.infopulse-cvapp-ui.view.EmployeeInfo",
                    controller: this
                }).then(function (oPopover) {
                    this._oPopover = oPopover;
                    this.getView().addDependent(this._oPopover);
                    this._oPopover.bindElement({
                        path: "/CVDataAcc(" + iEmployeeId + ")",
                        dataRequested: function () {
                            this.getModel("viewModel").setProperty("/busy", true);
                        },
                        dataReceived: function () {
                            this.getModel("viewModel").setProperty("/busy", false);
                        }
                    });
                    this._oPopover.openBy(oButton);
                }.bind(this));
            } else {
                this._oPopover.openBy(oButton);
            }
        },

        onExport: function () {
            var listBinding = this.getEmployeeListItemsBinding();
            var dtDateOfExport = new Date().toLocaleDateString();
            this.exportSpreadsheet({
                workbook: {
                    columns: this.createColumnConfig()
                },
                dataSource: {
                    type: "OData",
                    useBatch: true,
                    serviceUrl: listBinding.getModel().sServiceUrl,
                    headers: listBinding.getModel().getHeaders(),
                    dataUrl: listBinding.getDownloadUrl(),
                    count: listBinding.getLength()
                },
                fileName: this.getResourceBundleText("manageResumes.export.fileName", [ dtDateOfExport ]),
                worker: true
            });
        },

        exportSpreadsheet: function (settings, fnSuccess, fnFail) {
            return new Spreadsheet(settings).
                build().
                catch(fnFail ? fnFail.bind(this) : null).
                then(fnSuccess ? fnSuccess.bind(this) : null);
        },

        createColumnConfig: function () {
            var aCols = [];

            aCols.push(
                {
                    label: this.getResourceBundleText("manageResumes.employeeTable.employeeName.col"),
                    type: "string",
                    property: "NAME",
                    width: 25
                },
                {
                    label: this.getResourceBundleText("manageResumes.employeeTable.employeeDepartment.col"),
                    type: "string",
                    property: "DEPARTMENT"
                },
                {
                    label: this.getResourceBundleText("manageResumes.employeeTable.employeeDeliveryManager.col"),
                    type: "string",
                    property: "MANAGER"
                },
                {
                    label: this.getResourceBundleText("manageResumes.employeeTable.employeeUpdateDate.col"),
                    type: "date",
                    property: "UPDATED"
                },
                {
                    label: this.getResourceBundleText("manageResumes.employeeTable.employeeRequestDate.col"),
                    type: "date",
                    property: "REQUEST"
                },
                {
                    label: this.getResourceBundleText("manageResumes.employeeTable.employeeLastUploadDate.col"),
                    type: "date",
                    property: "UPLOAD"
                }
            );
            return aCols;
        },

        onOpenViewSettings: function (oEvent) {
            var sDialogTab = "sort";

            if (!this._oFragment) {
                Fragment.load({
                    name: "infopulse.cv.infopulse-cvapp-ui.view.SortGroup",
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

            if (mParams.groupItem) {
                sPath = mParams.groupItem.getKey();
                bDescending = mParams.groupDescending;
                aSorters.push(new Sorter(sPath, bDescending, true));
            }
            if (mParams.sortItem) {
                sPath = mParams.sortItem.getKey();
                bDescending = mParams.sortDescending;
                aSorters.push(new Sorter(sPath, bDescending));
            }

            this.getEmployeeListItemsBinding().sort(aSorters);
        },

        onShowEmployeePage: function (oEvent) {
            var iItemId = oEvent.getSource().getBindingContext().getProperty("ID");
            this.getRouter().navTo("employeePage", { employeeId: iItemId }, true);
        },

        onRefresh: function () {
            var oTable = this.byId("employeeListTable");
            oTable.getBinding("items").refresh();
        },

        onUpdateFinished: function (oEvent) {
            var iEmployeeListBindingLength = oEvent.getParameter("total");
            this.getModel("viewModel").setProperty("/listLength", iEmployeeListBindingLength);
        }
    });
});
