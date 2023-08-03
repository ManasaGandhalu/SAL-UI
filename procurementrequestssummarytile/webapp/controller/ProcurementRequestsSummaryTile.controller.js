sap.ui.define([
    "sap/ui/core/mvc/Controller"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller) {
        "use strict";

        return Controller.extend("com.sal.summarytiles.procurementrequestssummarytile.controller.ProcurementRequestsSummaryTile", {
            onInit: function () {
                this._bindView();
            },

            _bindView: function () {
                this.getView().bindElement({
                    path: "/MasterModules(2)"
                });
            }
        });
    });
