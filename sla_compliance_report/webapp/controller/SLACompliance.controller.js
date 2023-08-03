sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/viz/ui5/format/ChartFormatter",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, ChartFormatter, JSONModel,Filter,FilterOperator) {
        "use strict";

        return Controller.extend("com.sal.reports.slacompliancereport.controller.SLACompliance", {
            onInit: function () {
              
                var oCurrentDate = new Date(),
                oFromDate = oCurrentDate.getDate() - 7;

            oFromDate = new Date(oCurrentDate.setDate(oFromDate));

            var oLocalViewModel = new JSONModel({
                
                FromDate: oFromDate,
                ToDate: new Date(),
                SelectedModuleID: 1,
                SelectedPortletID: "",
                SelectedStatus: ""
            });
            this.getView().setModel(oLocalViewModel, "LocalViewModel");
            var requestForTeamReports = "false";
            this.fnReadTickitsSummaryData(requestForTeamReports);
            },

            fnInitializeChart: function () {
                var oVizFrame = this.getView().byId("idVizFrame");
                oVizFrame.setVizProperties({
                    title: {
                        visible: false
                    },
                    valueAxis: {
                        title: {
                            visible: true
                        }
                    },
                    categoryAxis: {
                        title: {
                            visible: false
                        }
                    },
                    plotArea: {
                        
                        dataPointStyle: {
                            "rules":
                            [
                                {
                                    "dataContext": {"SLA Compliance Score": {"min": 98} },
                                    "properties": {
                                        "color":"sapUiChartPaletteSemanticGood"
                                    },
                                    "displayName": "SLA Compliance Score >= 98"
                                   
                                },
                                {
                                    "dataContext": {"SLA Compliance Score": {"min": 95,"max": 98} },
                                    "properties": {
                                        "color":"sapUiChartPaletteSemanticCritical"
                                    },
                                    "displayName": "SLA Compliance Score >=95 & < 98"
                                   
                                }
                            ],
                            "others":
                            {
                                "properties": {
                                     "color": "sapUiChartPaletteSemanticBad"
                                },
                                "displayName": "SLA Compliance Score < 95"
                                
                            }
                        },
                      
                        dataLabel: {
                            visible: true
                        }
                    },
                    legendGroup: {
                        layout: {
                            position: "bottom",
                            alignment: "center"
                        }
                    }
                });
            },

            onFilterDateChange: function (oEvent) {
                this.getView().getModel("LocalViewModel").setProperty("/FromDate", oEvent.getSource().getDateValue());
                this.getView().getModel("LocalViewModel").setProperty("/ToDate", oEvent.getSource().getSecondDateValue());
                this.getView().getModel("LocalViewModel").refresh();

                
                var requestForTeamReports = "false";
     
             
                this.fnReadTickitsSummaryData(requestForTeamReports);
              
            },

            fnReadTickitsSummaryData: function (requestForTeamReports) {
                var oFromDate = this.getView().getModel("LocalViewModel").getProperty("/FromDate"),
                oToDate = this.getView().getModel("LocalViewModel").getProperty("/ToDate"),
                dateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" }),
                oStartDate = dateFormat.format(new Date(oFromDate)),
                oEndDate = dateFormat.format(new Date(oToDate)),
                sStartDate = oStartDate + "T00:00:00.000Z",
                // sEndDate = oEndDate + "T00:00:00.000Z";

                sEndDate =   oStartDate === oEndDate ? oEndDate + "T23:59:59.000Z" : oEndDate + "T00:00:00.000Z"; 

                this.getView().setBusy(true);
                var oFilter = new Filter("isHidden", FilterOperator.EQ, false);
                this.getView().getModel().read("/MasterModules", {
                    filters: [oFilter],
                    urlParameters: {
                        "IsUserManager": requestForTeamReports,
                        "from": sStartDate,
                        "to": sEndDate
                    },
                    success: function (oData) {
                        this.getView().setBusy(false);
                        var oSLAComplianceDataModel = new JSONModel(oData.results);
                        // var oSLAComplianceDataModel = new JSONModel(this.fnGetSampleData());
                        for(var i=0;i<oData.results.length;i++){
                            if(oData.results[i].displayPercentage === "-1"){
                                oData.results[i].displayPercentage = "NA";
                            }
                        }
                        this.getView().setModel(oSLAComplianceDataModel, "SLAComplianceDataModel");
                        this.fnInitializeChart();
                        this.getView().getModel("SLAComplianceDataModel").refresh();
                    }.bind(this),
                    error: function () {
                        this.getView().setBusy(false);
                    }.bind(this)
                });
            },

            fnSLAItemsFactory: function (sId, oContext) {
                var idisplayPercentage = oContext.getProperty("displayPercentage"),
                    sRatingText = this.fnFormatRatingText(idisplayPercentage),
                    sRatingState = this.fnFormatRatingState(idisplayPercentage),
                    sCssClassNames = this.fnGetEmojiCSSNames(sRatingState),
                    oObjectStatus = new sap.m.ObjectStatus({
                        text: sRatingText,
                        state: sRatingState
                    }).addStyleClass(sCssClassNames);

                return new sap.m.ColumnListItem({
                    cells: [
                        new sap.m.Label({
                            design: "Bold",
                            text: "{SLAComplianceDataModel>name}"
                        }),

                        new sap.m.Text({
                            text: "{SLAComplianceDataModel>displayPercentage}"
                        }),

                        oObjectStatus
                    ]
                });
            },

            fnGetEmojiCSSNames: function (sRatingState) {
                if (sRatingState === "Success") {
                    return "ExcellentEmoji sapUiTinyMarginEnd";
                }
                else if (sRatingState === "Warning") {
                    return "GoodEmoji sapUiTinyMarginEnd";
                } else if (sRatingState === "None") {
                    return "NAEmoji sapUiTinyMarginEnd";
                } else if (sRatingState === "Error") {
                    return "BadEmoji sapUiTinyMarginEnd";
                }
            },

            fnFormatRatingText: function (iComplianceScore) {
                var iSLAComplianceScore = Number(iComplianceScore),
                    sRatingText = "";
                if (iSLAComplianceScore >= 98) {
                    sRatingText = "Excellent";
                } else if (iSLAComplianceScore >= 95) {
                    sRatingText = "Good";
                } else if (iSLAComplianceScore < 95 ) {
                    sRatingText = "Bad";
                }else {
                    sRatingText = "No Data Available";
                }
                return sRatingText;
            },

            fnFormatRatingState: function (iComplianceScore) {
                var iSLAComplianceScore = Number(iComplianceScore),
                    sStateValue = "";
                if (iSLAComplianceScore >= 98) {
                    sStateValue = "Success";
                } else if (iSLAComplianceScore >= 95) {
                    sStateValue = "Warning";
                } else if (iSLAComplianceScore < 95) {
                    sStateValue = "Error";
                }else {
                    sStateValue = "None";
                }
                return sStateValue;
            },

            onSelectionChange:function(){
                var requestForTeamReports = "";
                var requestFor = this.getView().byId("idRequestType").getSelectedKey();
                if(requestFor === "Myself"){
                    requestForTeamReports = "false";
                }else {
                    requestForTeamReports = "true";
                }

                this.fnReadTickitsSummaryData(requestForTeamReports);
                
            },
            fnGetSampleData: function () {
                return [{
                    "ID": 1,
                    "name": "Human Resource",
                    "totalRequests": 105,
                    "completed": 100,
                    "Rating": "Excellent",
                    state: "Success"
                },
                {
                    "ID": 2,
                    "name": "Procurement",
                    "totalRequests": 50,
                    "completed": 73,
                    "Rating": "Good",
                    state: "Error"
                },
                {
                    "ID": 3,
                    "name": "Plant Maintenance",
                    "totalRequests": 80,
                    "completed": 50,
                    "Rating": "Average",
                    state: "Warning"
                },
                {
                    "ID": 4,
                    "name": "IT Service Management",
                    "totalRequests": 30,
                    "completed": 35,
                    "Rating": "Average",
                    state: "Warning"
                },
                {
                    "ID": 5,
                    "name": "Center of Excellence",
                    "totalRequests": 40,
                    "completed": 10,
                    "Rating": "Poor",
                    state: "Success"
                },
                {
                    "ID": 6,
                    "name": "Overall Shared Services",
                    "totalRequests": 60,
                    "completed": 40,
                    "Rating": "Average",
                    state: "Success"
                }];
            }
        });
    });
