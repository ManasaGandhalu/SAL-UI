sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
   "sap/ui/model/Sorter" 
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, Fragment, Sorter) {
        "use strict";

        return Controller.extend("com.sal.openrequestcardtile.openrequestcardtile.controller.OpenRequestCard", {
            onInit: function () {
                var oCardData = {
                    "donut": {
                        "sap.app": {
                            "id": "com.sal.openrequestcardtile.openrequestcardtile",
                            "type": "card"
                        },
                        "sap.card": {
                            "type": "Analytical",
                            "header": {
                                "type": "Numeric",
                                "title": "My Rejected Requests",
                                "subTitle": "Total requests that are Rejected",
                                "data": {
                                    "json": {
                                        "NumberCount": "0",
                                        "Unit": "",
                                        "Trend": "",
                                        "TrendColor": "Good"
                                    }
                                },
                                "mainIndicator": {
                                    "number": "{NumberCount}",
                                    "unit": "{Unit}",
                                    "trend": "{Trend}",
                                    "state": "{TrendColor}"
                                },
                                "actions": [
                                    {
                                        "type": "Navigation",
                                        "parameters": {},
                                        "enabled": false
                                    }
                                ]
                            },
                            "content": {
                                "chartType": "Donut",
                                "legend": {
                                    "visible": true,
                                    "position": "Bottom",
                                    "alignment": "Left"
                                },
                                "plotArea": {
                                    "dataLabel": {
                                        "visible": true,
                                        "type": "value"
                                    }
                                },
                                "title": {
                                    "text": "Rejected requests by Type",
                                    "visible": true
                                },
                                "measureAxis": "size",
                                "dimensionAxis": "color",
                                "data": {
                                    "json": {
                                        "measures": []
                                    },
                                    "path": "/measures"
                                },
                                "dimensions": [
                                    {
                                        "label": "Measure Name",
                                        "value": "{name}",
                                        "tootip":"{name}"
                                    }
                                ],
                                "measures": [
                                    {
                                        "label": "Value",
                                        "value": "{totalRejected}",
                                        "tootip":"{name}"
                                    }
                                ],
                                "actionableArea": "Chart",
                                "actions": [
                                    {
                                        "type": "Navigation",
                                        "parameters": {
                                           "text":"{name}"
                                        }
                                        
                                    }
                                ]
                            }
                        }
                    }
                };

                this.getOwnerComponent().getModel().read("/MasterModules", {
                    // urlParameters: {
                    //     "IsUserManager": "true"
                    // },
                    success: function (oData) {
                        var cardManifests = new JSONModel();
                        oCardData.donut["sap.card"].content.data.json.measures = oData.results;
                        oCardData.donut["sap.card"].content.data.path = "/measures";
                        
                         // Set Values for Header
                         oCardData.donut["sap.card"].header.data.json.NumberCount = oData.results[0].totalRejected + oData.results[1].totalRejected + oData.results[2].totalRejected;
                        // oCardData.donut["sap.card"].content.data.json.NumberCount =  "0";
                        // oCardData.donut["sap.card"].content.data.json.Unit = "";
                        // oCardData.donut["sap.card"].content.data.json.Trend= "";
                        // oCardData.donut["sap.card"].content.data.json.TrendColor= "Good";
                        oData.results[0].name = "HR";
                        oData.results[1].name = "Procurement";
                        oData.results[2].name = "ITSM";
                        // oData.results[3].name = "ITSM";    


                        cardManifests.setData(oCardData);
                        this.getView().setModel(cardManifests, "manifests");
                    }.bind(this),
                    error: function () {
                    }
                });
            },
            onConfirmOpenRequest : function(oEvent)
            {
                var oSelectedItem = oEvent.getParameter("selectedItem");
                var obj = oSelectedItem.getBindingContext("FragmetModel").getObject();
                this.triggerCrossApp(obj.subModuleId, obj.ID, obj.externalCode);
            },

            triggerCrossApp: function (sSubModuleID, sTicketID, sExternalCode) {
                debugger;
           
                var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation"); // get a handle on the global XAppNav service
                var hash = (oCrossAppNavigator && oCrossAppNavigator.hrefForExternal({
                    target: {
                        semanticObject:  this.semanticObject,
                        action:  this.action
                    },
                    params: {

                        "submoduleId" : sSubModuleID, 
                        "ticketId" : sTicketID,
                        "externalCode": sExternalCode

                    }
                })) || "";
                oCrossAppNavigator.toExternal({
                    target: {
                        shellHash: hash
                    }
                });
            },

            onAction: function (oEvent) {
                var selectedSlice = oEvent.getParameters().manifestParameters.text;
                var that = this;
               
                if (!this._oOpenAPDialog) {
                    this._oOpenAPDialog = sap.ui.xmlfragment("idOpenDialog", "com.sal.openrequestcardtile.openrequestcardtile.Fragments.QuickView", this);
                    that.getView().addDependent(this._oOpenAPDialog);
                }
                this.fnGetSelectedSliceData(selectedSlice);
                
    
            },
            fnGetSelectedSliceData:function(selectedSlice){
                if(selectedSlice === "HR"){
                    this.semanticObject = "HR_semantic";
                    this.action = "display";
                    var sStatusFilter = new sap.ui.model.Filter({
                        path: "status",
                        operator: sap.ui.model.FilterOperator.EQ,
                        value1: "REJECTED"
                    });
                    var sModuleFilter = new sap.ui.model.Filter({
                        path: "moduleId",
                        operator: sap.ui.model.FilterOperator.EQ,
                        value1: "1"
                    });
                    var filter = [];
                    filter.push(sStatusFilter,sModuleFilter);
                    this.getOwnerComponent().getModel().read("/Tickets",
                    {
                        sorters: [ new Sorter("createdAt", true)],
                        filters: [filter],
                        success:function(oData){
                            var oFragmetModel = new JSONModel(oData.results);
                            this._oOpenAPDialog.setModel(oFragmetModel, "FragmetModel");
                            this._oOpenAPDialog.getModel("FragmetModel").setProperty("/titleName",selectedSlice);
                            this._oOpenAPDialog.open();
                        }.bind(this),
                        error:function(){
    
                        }
                    })
                }
                else  if(selectedSlice === "ITSM"){
                    this.semanticObject = "itsm_semantic";
                    this.action = "display";
                    var sStatusFilter = new sap.ui.model.Filter({
                        path: "status",
                        operator: sap.ui.model.FilterOperator.EQ,
                        value1: "REJECTED"
                    });
                    var sModuleFilter = new sap.ui.model.Filter({
                        path: "moduleId",
                        operator: sap.ui.model.FilterOperator.EQ,
                        value1: "4"
                    });
                    var filter = [];
                    filter.push(sStatusFilter,sModuleFilter);
                    this.getOwnerComponent().getModel().read("/Tickets",
                    {
                        sorters: [ new Sorter("createdAt", true)],
                        filters: [filter],
                        success:function(oData){
                            var oFragmetModel = new JSONModel(oData.results);
                            this._oOpenAPDialog.setModel(oFragmetModel, "FragmetModel");
                            this._oOpenAPDialog.getModel("FragmetModel").setProperty("/titleName",selectedSlice);
                            this._oOpenAPDialog.open();
                        }.bind(this),
                        error:function(){
    
                        }
                    })
                }
            },
            getGroupHeader: function (oGroup){
                return new GroupHeaderListItem({
                    title: oGroup.key,
                    upperCase: false
                });
            }
        });
    });


