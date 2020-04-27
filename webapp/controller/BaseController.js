sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/m/library",
    "sap/ui/model/json/JSONModel"
], function (Controller, UIComponent, mobileLibrary, JSONModel) {
    "use strict";
    return Controller.extend("infopulse.cv.infopulse-cvapp-ui.controller.BaseController", {
        onInit: function () {
            this._createViewModel();
        },
        /**
         * Convenience method for generating the view model
         */
        _createViewModel: function () {
            var dtOutdateDate = new Date().setMonth(new Date().getMonth() - 6);

            this.setModel(new JSONModel({
                listLength: 0,
                outdateDate: new Date(dtOutdateDate),
                busy: false
            }), "viewModel");
        },
        /**
         * Convenience method for accessing the router.
         * @public
         * @returns {sap.ui.core.routing.Router} the router for this component
         */
        getRouter: function () {
            return this.getOwnerComponent().getRouter();
        },
        /**
         * Convenience method for getting the view model by name.
         * @public
         * @param {string} [sName] the model name
         * @returns {sap.ui.model.Model} the model instance
         */
        getModel: function (sName) {
            return this.getView().getModel(sName);
        },
        /**
         * Getter for the resource bundle.
         * @public
         * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
         */
        getResourceBundle: function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },
        /**
         * Getter for the resource bundle.
         * @public
         * @param {string} sResourseText the of the component
         * @param {array} aArgs array of items
         * @returns {string} the resourceText from resourceModel of the component and number of items from array
         */
        getResourceBundleText: function (sResourseText, aArgs) {
            return aArgs ? this.getResourceBundle().getText(sResourseText, aArgs)
                : this.getResourceBundle().getText(sResourseText);
        },
        /**
         * Convenience method for setting the view model.
         * @public
         * @param {sap.ui.model.Model} oModel the model instance
         * @param {string} sName the model name
         * @returns {sap.ui.mvc.View} the view instance
         */
        setModel: function (oModel, sName) {
            return this.getView().setModel(oModel, sName);
        },
        /**
         * Adds a history entry in the FLP page history
         * @public
         * @param {object} oEntry An entry object to add to the hierachy array as expected from the ShellUIService.setHierarchy method
         * @param {boolean} bReset If true resets the history before the new entry is added
         */
        addHistoryEntry: (function () {
            var aHistoryEntries = [];
            return function (oEntry, bReset) {
                if (bReset) {
                    aHistoryEntries = [];
                }
                var bInHistory = aHistoryEntries.some(function (entry) {
                    return entry.intent === oEntry.intent;
                });
                if (!bInHistory) {
                    aHistoryEntries.push(oEntry);
                    this.getOwnerComponent().getService("ShellUIService").then(function (oService) {
                        oService.setHierarchy(aHistoryEntries);
                    });
                }
            };
        })()
    });
});
