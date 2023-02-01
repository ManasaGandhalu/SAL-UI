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

        return Controller.extend("com.sal.summarytiles.hrrequestssummarymanagertile.controller.View1", {
            onInit: function () {
                this._bindView();
            },

            _bindView: function () {

                this.getView().bindElement({
                    path: "/MasterModules(1)",
                    parameters: {
                        custom: {
                            "IsUserManager": "true"
                        }
                    }
                });
            },
            onSelectionChange: function (oEvent) {
                var sSelect
            },
            onConfirmHrManagerRequest: function (oEvent) {
                // debugger;
                var oSelectedItem = oEvent.getParameter("selectedItem");
                var obj = oSelectedItem.getBindingContext("FragmetModel").getObject();
                this.triggerCrossApp(obj.subModuleId, obj.ID, obj.externalCode);
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
                        "externalCode": sExternalCode

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

                if (!this._oDoneHrMgrDialog) {
                    this._oDoneHrMgrDialog = sap.ui.xmlfragment("idDoneHrMgrDialog", "com.sal.summarytiles.hrrequestssummarymanagertile.Fragments.QuickView", this);
                    that.getView().addDependent(this._oDoneHrMgrDialog);
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
                        success: function (oData) {
                            var oFragmetModel = new JSONModel(oData.results);
                            this._oDoneHrMgrDialog.setModel(oFragmetModel, "FragmetModel");
                            this._oDoneHrMgrDialog.getModel("FragmetModel").setProperty("/titleName", selectedSlice);
                            this._oDoneHrMgrDialog.open();
                        }.bind(this),
                        error: function () {

                        }
                    });
            }
        });
    });
