sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    'sap/ui/model/Sorter'
    
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, Fragment, Sorter, formatter) {
        "use strict";

        return Controller.extend("com.sal.donerequestcardtile.donerequestcardtile.controller.DoneRequestCard", {
           
            onInit: function () {
                var oCardData = {
                    "donut": {
                        "sap.app": {
                            "id": "com.sal.donerequestcardtile.donerequestcardtile",
                            "type": "card"
                        },
                        "sap.card": {
                            "type": "Analytical",
                            "header": {
                                "type": "Numeric",
                                "title": "My Approved Requests",
                                "subTitle": "Total requests that are Approved",
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
                                    "text": "Approved requests by Type",
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
                                        "tooltip":"{name}"
                                    }
                                ],
                                "measures": [
                                    {
                                        "label": "Value",
                                        "value": "{totalApproved}",
                                        "tooltip":"{name}"
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
                         oCardData.donut["sap.card"].header.data.json.NumberCount = oData.results[0].totalApproved + oData.results[1].totalApproved + oData.results[2].totalApproved ;
                        // oCardData.donut["sap.card"].content.data.json.NumberCount =  "0";
                        // oCardData.donut["sap.card"].content.data.json.Unit = "";
                        // oCardData.donut["sap.card"].content.data.json.Trend= "";
                        // oCardData.donut["sap.card"].content.data.json.TrendColor= "Good";

                        oData.results[0].name = "HR";
                        oData.results[1].name = "Procurement";
                        oData.results[2].name = "ITSM";
                        //oData.results[3].name = "ITSM";

                        cardManifests.setData(oCardData);
                        this.getView().setModel(cardManifests, "manifests");
                    }.bind(this),
                    error: function () {
                    }
                });
            },


            onConfirmDoneRequest : function(oEvent)
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
                        semanticObject: this.semanticObject,
                        action:  this.action
                    },
                    params: {

                        "submoduleId" : sSubModuleID, 
                        "ticketId" : sTicketID,
                        "externalCode": sExternalCode

                    }
                })) || "";

                if(this.semanticObject === 'itsm_semantic') {
                    hash+=`&/detail/${sSubModuleID}/detailDetail/${sExternalCode}/${sTicketID}/EndColumnFullScreen`;
                }
                
                oCrossAppNavigator.toExternal({
                    target: {
                        shellHash: hash
                    }
                });
            },

            onAction: function (oEvent) {
                var selectedSlice = oEvent.getParameters().manifestParameters.text;
                var that = this;
               
                if (!this._oDoneAPIialog) {
                    this._oDoneAPIialog = sap.ui.xmlfragment("idDoneDialog", "com.sal.donerequestcardtile.donerequestcardtile.Fragments.QuickView", this);
                    that.getView().addDependent(this._oDoneAPIialog);
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
                        value1: "APPROVED"
                    });
                    var sModuleFilter = new sap.ui.model.Filter({
                        path: "moduleId",
                        operator: sap.ui.model.FilterOperator.EQ,
                        value1: "1"
                    });
                    var filter = [];
                    filter.push(sStatusFilter,sModuleFilter);
                    // this.getOwnerComponent().getModel().read("/Tickets",
                    this.getOwnerComponent().getModel().read(`/Tickets`,
                    {
                        urlParameters: {
                            $expand: "subModule"
                            
                        },
                    
                        sorters: [ new Sorter("createdAt", true)],
                        filters: [filter],
                        success:function(oData){
                            var oFragmetModel = new JSONModel(oData.results);
                            this._oDoneAPIialog.setModel(oFragmetModel, "FragmetModel");
                            this._oDoneAPIialog.getModel("FragmetModel").setProperty("/titleName",selectedSlice);
                            this._oDoneAPIialog.open();
                        }.bind(this),
                        error:function(){
    
                        }
                    });
                }

              else  if(selectedSlice === "ITSM"){
                this.semanticObject = "itsm_semantic";
                this.action = "display";
                var sStatusFilter = new sap.ui.model.Filter({
                    path: "status",
                    operator: sap.ui.model.FilterOperator.EQ,
                    value1: "APPROVED"
                });
                var sModuleFilter = new sap.ui.model.Filter({
                    path: "moduleId",
                    operator: sap.ui.model.FilterOperator.EQ,
                    value1: "4"
                });
                var filter = [];
                filter.push(sStatusFilter,sModuleFilter);
                    // this.getOwnerComponent().getModel().read("/tickets",
                    this.getOwnerComponent().getModel().read(`/Tickets`,
                    {
                        
                            urlParameters: {
                                $expand: "subModule"
                                
                            },
                        sorters: [ new Sorter("createdAt", true)],
                        filters: [filter],
                        success:function(oData){
                            var oFragmetModel = new JSONModel(oData.results);
                            this._oDoneAPIialog.setModel(oFragmetModel, "FragmetModel");
                            this._oDoneAPIialog.getModel("FragmetModel").setProperty("/titleName",selectedSlice);
                            this._oDoneAPIialog.open();
                        }.bind(this),
                        error:function(){
    
                        }
                    })
                }else if(selectedSlice === "Procurement"){
                    this.semanticObject = "procurement_semantic";
                    this.action = "display";
                    var sStatusFilter = new sap.ui.model.Filter({
                        path: "status",
                        operator: sap.ui.model.FilterOperator.EQ,
                        value1: "APPROVED"
                    });
                    var sModuleFilter = new sap.ui.model.Filter({
                        path: "moduleId",
                        operator: sap.ui.model.FilterOperator.EQ,
                        value1: "2"
                    });
                    var filter = [];
                    filter.push(sStatusFilter,sModuleFilter);
                        // this.getOwnerComponent().getModel().read("/tickets",
                        this.getOwnerComponent().getModel().read(`/Tickets`,
                        {
                            urlParameters: {
                                $expand: "subModule"
                                
                            },
                            sorters: [ new Sorter("createdAt", true)],
                            filters: [filter],
                            success:function(oData){
                                var oFragmetModel = new JSONModel(oData.results);
                                this._oDoneAPIialog.setModel(oFragmetModel, "FragmetModel");
                                this._oDoneAPIialog.getModel("FragmetModel").setProperty("/titleName",selectedSlice);
                                this._oDoneAPIialog.open();
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


