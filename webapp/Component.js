sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "infopulse/cv/infopulse-cvapp-ui/model/models",
    "infopulse/cv/infopulse-cvapp-ui/controller/ErrorHandler"
], function (UIComponent, Device, models, ErrorHandler) {
    "use strict";
    return UIComponent.extend("infopulse.cv.infopulse-cvapp-ui.Component", {
        metadata: {
            manifest: "json"
        },
        /**
         * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
         * In this function, the FLP and device models are set and the router is initialized.
         * @public
         * @override
         */
        init: function () {
            UIComponent.prototype.init.apply(this, arguments);
            this._oErrorHandler = new ErrorHandler(this);
            this.setModel(models.createDeviceModel(), "device");
            this.getRouter().initialize();
        },
        /**
         * The component is destroyed by UI5 automatically.
         * In this method, the ErrorHandler is destroyed.
         * @public
         * @override
         */
        destroy: function () {
            this._oErrorHandler.destroy();
            UIComponent.prototype.destroy.apply(this, arguments);
        },
        /**
         * This method can be called to determine whether the sapUiSizeCompact or sapUiSizeCozy
         * design mode class should be set, which influences the size appearance of some controls.
         * @public
         * @return {string} css class, either 'sapUiSizeCompact' or 'sapUiSizeCozy' - or an empty string if no css class should be set
         */
        getContentDensityClass: function () {
            if (this._sContentDensityClass === undefined) {
                if (jQuery(document.body).hasClass("sapUiSizeCozy") || jQuery(document.body).hasClass("sapUiSizeCompact")) {
                    this._sContentDensityClass = "";
                } else if (!Device.support.touch) {
                    this._sContentDensityClass = "sapUiSizeCompact";
                } else {
                    this._sContentDensityClass = "sapUiSizeCozy";
                }
            }
            return this._sContentDensityClass;
        }
    });
});
