sap.ui.define([
    "infopulse/cv/infopulse-cvapp-ui/controller/BaseController"
], function (BaseController) {
    "use strict";

    return BaseController.extend("infopulse.cv.infopulse-cvapp-ui.controller.NotFoundPage", {

        onNavToListLinkPressed: function () {
            this.getRouter().navTo("employeeList");
        }
    });
});
