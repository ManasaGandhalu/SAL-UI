sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "com/sal/salhr/model/models",
    "sap/ui/model/json/JSONModel",
    "sap/f/library",
    "sap/ushell/services/Role"
   
],
    function (UIComponent, Device, models, JSONModel, fioriLibrary,Role) {
        "use strict";

        return UIComponent.extend("com.sal.salhr.Component", {
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
                this.setModel(models.createLayoutModel(), "layoutModel");

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

            //    ******************** delete this code *************************
            debugger;
            
            var oRoleService = new Role();

            var sRoleId = "EP_HR_MANAGER";

            oRoleService.getAssignedApps(sRoleId).done(function(aApps){

                console.log(aApps);
            });

            // *********************************************************





                
            },

         

           

            getContentDensityClass: function () {
                if (this._sContentDensityClass === undefined) {
                    // check whether FLP has already set the content density class; do nothing in this case
                    // eslint-disable-next-line sap-no-proprietary-browser-api
                    if (document.body.classList.contains("sapUiSizeCozy") || document.body.classList.contains("sapUiSizeCompact")) {
                        this._sContentDensityClass = "";
                    } else if (!Device.support.touch) { // apply "compact" mode if touch is not supported
                        this._sContentDensityClass = "sapUiSizeCompact";
                    } else {
                        // "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
                        this._sContentDensityClass = "sapUiSizeCozy";
                    }
                }
                return this._sContentDensityClass;
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
            },

        });
    }
);