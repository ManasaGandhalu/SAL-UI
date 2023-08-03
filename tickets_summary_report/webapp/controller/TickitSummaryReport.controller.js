sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel,Filter,FilterOperator) {
        "use strict";

        return Controller.extend("com.sal.reports.ticketssummaryreport.controller.TickitSummaryReport", {
            onInit: function () {
                var isManager = "false";
                this.fnReadTickitsSummaryData(isManager);
            },

            fnInitializeChart: function () {
                var oVizFrame = this.getView().byId("idTaskVizFrame");
                oVizFrame.setVizProperties({
                    title: {
                        visible: false
                    },
                    valueAxis: {
                        title: {
                            visible: false
                        }
                    },
                    categoryAxis: {
                        title: {
                            visible: false
                        }
                    },
                    plotArea: {
                        colorPalette: ["#4472C4", "#A5A5A5", "#FFC000", "#264478"],
                        gap: {
                            innerGroupSpacing: 0,
                            groupSpacing: 1.5
                        },
                        dataShape: {
                            primaryAxis: ['bar', 'bar', 'bar', 'line']
                        },
                    },
                    legendGroup: {
                        layout: {
                            position: "bottom",
                            alignment: "center"
                        }
                    }
                });
            },

            fnReadTickitsSummaryData: function (isManager) {
                this.getView().setBusy(true);
                // var isManager = this.getOwnerComponent().getModel("EmpInfoModel").getData().IsUserManager.toString();
                var oFilter = new Filter("isHidden", FilterOperator.EQ, false);
                this.getView().getModel().read("/MasterModules", {
                    filters: [oFilter],
                    urlParameters: {
                        "IsUserManager": isManager
                    },
                    success: function (oData) {
                        this.getView().setBusy(false);
                        var oTicketsSummaryData = new JSONModel(oData.results);
                        this.getView().setModel(oTicketsSummaryData, "TicketsSummaryDataModel");
                        this.fnInitializeChart();
                    }.bind(this),
                    error: function () {
                        this.getView().setBusy(false);
                    }.bind(this)
                });
            },

            onSelectionChange:function(oEvent){
                var isManager = "";
                var requestFor = oEvent.getSource().getSelectedKey();
                if(requestFor === "Myself"){
                     isManager = "false";
                }else {
                    isManager = "true";
                }
                this.fnReadTickitsSummaryData(isManager);
            }
            // onMenuAction:function(oEvent){
             
            //     var isManager = "";
            //     var requestFor = oEvent.getParameters("item").item.getProperty("text");
            //     if(requestFor === "Myself"){
            //          isManager = "false";
            //     }else {
            //         isManager = "true";
            //     }
            //     this.fnReadTickitsSummaryData(isManager);
               
            // }
        });
    });
