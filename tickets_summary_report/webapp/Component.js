sap.ui.define([
        "sap/ui/core/UIComponent",
        "sap/ui/Device",
        "com/sal/reports/ticketssummaryreport/model/models",
        'sap/ui/model/json/JSONModel'
    ],
    function (UIComponent, Device, models,JSONModel) {
        "use strict";

        return UIComponent.extend("com.sal.reports.ticketssummaryreport.Component", {
            metadata: {
                manifest: "json"
            },

            /**
             * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
             * @public
             * @override
             */
            init: function () {
                // call the base component's init function
                UIComponent.prototype.init.apply(this, arguments);

                // enable routing
                this.getRouter().initialize();

                // set the device model
                this.setModel(models.createDeviceModel(), "device");


                  //this will return the semantic object and action alongwith the routing params
                  var oHashObjectPath = new sap.ui.core.routing.HashChanger().getHash(),
                  bIsUserManager = false;
                 if (oHashObjectPath.indexOf("Manage") > 5 && oHashObjectPath.indexOf("Manage") < 20) {
                  bIsUserManager = true;
                  }

              this.setModel(new JSONModel(), "EmpInfoModel");
              this.getModel("EmpInfoModel").setProperty("/IsUserManager", bIsUserManager);
            }
        });
    }
);