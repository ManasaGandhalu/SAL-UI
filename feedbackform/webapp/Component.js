sap.ui.define([
        "sap/ui/core/UIComponent",
        "sap/ui/Device",
        "com/sal/feedbackform/model/models",
        'sap/ui/model/json/JSONModel'
    ],
    function (UIComponent, Device, models, JSONModel) {
        "use strict";

        return UIComponent.extend("com.sal.feedbackform.Component", {
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

                this.setModel(new JSONModel(), "RoleInfoModel");

                // Set the user model
                this.fnGetLoggedInEmpInfo(bIsUserManager);
            },
            fnGetLoggedInEmpInfo: function (bIsUserManager) {
            
                
              
                this.getModel().read("/EmpInfo", {
                    urlParameters: {
                        "moreInfo": "true",
                        // "$filter": "userId eq '12000843'"
                    },
                    success: function (oData) {        
                        this.getRouter().navTo("master");       
                        this.setModel(new JSONModel(oData.results[0]), "EmpInfoModel");
                        this.getModel("EmpInfoModel").setProperty("/IsUserManager", bIsUserManager);
                       
                    }.bind(this),
                    error: function (oError) {   
                         
                        sap.m.MessageBox.error(JSON.stringify(oError));
                    }.bind(this),
                });
            }
        });
    }
);