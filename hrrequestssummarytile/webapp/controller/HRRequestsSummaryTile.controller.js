sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    'sap/ui/model/Sorter'
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, Sorter) {
        "use strict";

        return Controller.extend("com.sal.summarytiles.hrrequestssummarytile.controller.HRRequestsSummaryTile", {
            onInit: function () {
                this._bindView();
            },

            _bindView: function () {

                this.getView().bindElement({
                    path: "/MasterModules(1)",
                    parameters: {
                        custom: {
                            "IsUserManager": "flase"
                        }
                    }
                });
            },
            onConfirmHrsRequest: function (oEvent) {
                // debugger;
                var oSelectedItem = oEvent.getParameter("selectedItem");
                var obj = oSelectedItem.getBindingContext("FragmetModel").getObject();

                if(obj.externalStatus === "REJECTED" || obj.externalStatus === "CANCELLED"){
                    sap.m.MessageToast.show("The record is removed from the source system.");
                }else{
                this.triggerCrossApp(obj.subModuleId, obj.ID, obj.externalCode);
                } 
            
            },

            triggerCrossApp: function (sSubModuleID, sTicketID, sExternalCode) {
                // debugger;

                var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation"); // get a handle on the global XAppNav service
                var hash = (oCrossAppNavigator && oCrossAppNavigator.hrefForExternal({
                    target: {
                        semanticObject: "HR_semantic",
                        action: "display"
                    },
                    params: {

                        "submoduleId": sSubModuleID,
                        "ticketId": sTicketID,
                        "externalCode": sExternalCode,
                        "IsUserManager": false

                    }
                })) || "";
                oCrossAppNavigator.toExternal({
                    target: {
                        shellHash: hash
                    }
                });
            },
            pressBar: function (oEvent) {
                // debugger;
                var selectedSlice = oEvent.getSource().getProperty("title").toUpperCase();
                var that = this;
              

                if (!this._oDoneHrDialog) {
                    this._oDoneHrDialog = sap.ui.xmlfragment("idDoneHrDialog", "com.sal.summarytiles.hrrequestssummarytile.Fragments.QuickView", this);
                    that.getView().addDependent(this._oDoneHrDialog);
                }

                var sStatusFilter = new sap.ui.model.Filter({
                    path: "status",
                    operator: sap.ui.model.FilterOperator.EQ,
                    value1: selectedSlice
                });
                var sModuleFilter = new sap.ui.model.Filter({
                    path: "moduleId",
                    operator: sap.ui.model.FilterOperator.EQ,
                    value1: "1"
                });

              

                

                var filter = [];
                filter.push(sStatusFilter, sModuleFilter);
                this.getOwnerComponent().getModel().read("/Tickets",
                    {
                        sorters: [ new Sorter("createdAt", true)],
                        filters: [filter],
                        urlParameters :{"IsUserManager": false},
                        success: function (oData) {
                            var oFragmetModel = new JSONModel(oData.results);
                            this._oDoneHrDialog.setModel(oFragmetModel, "FragmetModel");
                            this._oDoneHrDialog.getModel("FragmetModel").setProperty("/titleName", selectedSlice);
                            this._oDoneHrDialog.open();
                        }.bind(this),
                        error: function () {

                        }
                    });
            }
        });
    });
