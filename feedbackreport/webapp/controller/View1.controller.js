sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    'sap/viz/ui5/format/ChartFormatter',
    'sap/viz/ui5/api/env/Format'
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, ChartFormatter, Format) {
        "use strict";
        return Controller.extend("com.sal.feedbackreport.controller.View1", {
            onInit: function () {
                var oCurrentDate = new Date(),
                oFromDate = oCurrentDate.getDate() - 7;
               oFromDate = new Date(oCurrentDate.setDate(oFromDate));
               var oLocalViewModel = new JSONModel({
                FromDate: oFromDate,
                ToDate: new Date()
            });
            var oVizFrame = this.oVizFrame = this.getView().byId("idVizFrame");
            var oPopOver = this.getView().byId("idPopOver");
            oPopOver.connect(oVizFrame.getVizUid());
            oPopOver.setFormatString(ChartFormatter.DefaultPattern);
                this.getView().setModel(oLocalViewModel, "LocalViewModel");
                this.onCallChartData();
            },
            onFilterDateChange: function (oEvent) {
                this.getView().getModel("LocalViewModel").setProperty("/FromDate", oEvent.getSource().getDateValue());
                this.getView().getModel("LocalViewModel").setProperty("/ToDate", oEvent.getSource().getSecondDateValue());
                this.getView().getModel("LocalViewModel").refresh();
                var oFromDate = this.getView().getModel("LocalViewModel").getProperty("/FromDate"),
                oToDate = this.getView().getModel("LocalViewModel").getProperty("/ToDate"),


                dateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" }),
                oStartDate = dateFormat.format(new Date(oFromDate)),
                oEndDate = dateFormat.format(new Date(oToDate)),
                sStartDate = oStartDate + "T00:00:00.000Z",
                // sEndDate = oEndDate + "T00:00:00.000Z";

                // sEndateHrsMinsSeonds = `${oToDate.getHours()}:${oToDate.getMinutes()}:${oToDate.getSeconds()}`;

                sEndDate =   oStartDate === oEndDate ? oEndDate + "T23:59:59.000Z" : oEndDate + "T00:00:00.000Z"; 
                this.onCallChartData(sStartDate, sEndDate);
            },
            onCallChartData: function (sStartDate, sEndDate ) {
                this.getView().setBusy(true);
                this.getOwnerComponent().getModel().read("/HrAvgRatings", {
                    urlParameters: {
                        "$expand": "ratings",
                        "from": sStartDate ? sStartDate : "",
                        "to": sEndDate ? sEndDate : "" 
                     
                    },
                    success: function (oData, oResponse) {
                        this.getView().setBusy(false);
                    var oResponseData = oData.results.length === 0 ? [] : oData.results[0].ratings.results;
                        
                        var oRatingDataModel = new JSONModel(oResponseData);
                        this.getView().setModel(oRatingDataModel, "RatingDataModel");
                    }.bind(this),
                    error: function (oError) {
                        this.getView().setBusy(false);
                        sap.m.MessageBox.error(JSON.stringify(oError));
                    }.bind(this),
                });
            },

            onAfterRendering: function () {
                var vizchart = this.getView().byId("idVizFrame");
			vizchart.setVizProperties({
				plotArea: {
					adjustScale: true,
					dataLabel: {
						showTotal: true

					}
                },
                legend: {
					
					visible: true,
					showFullLabel: true
				}}
            );
            }

        });
    });
