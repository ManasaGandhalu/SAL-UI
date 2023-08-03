sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, Fragment) {
        "use strict";

        return Controller.extend("com.sal.report.chatbotsummaryreport.controller.ChatbotSummary", {
            onInit: function () {
                var oDonutCard = {
                    "donut": {
                        "sap.card": {
                            "type": "Analytical",
                            "header": {
                                "type": "Numeric",
                                "title": "Most Used Skills",
                                "subTitle": "",
                                "data": {
                                    "json": {
                                        "NumberCount": "0",
                                        "Unit": "",
                                        "Trend": "",
                                        "TrendColor": "Good"
                                    }
                                }
                            },
                            "content": {
                                "chartType": "Donut",
                                "legend": {
                                    "visible": false,
                                    "position": "top",
                                    "alignment": "Right"
                                },
                                "plotArea": {
                                    "dataLabel": {
                                        "visible": true,
                                        type: "label",
                                        "showTotal": false
                                    }
                                },
                                "title": {
                                    "text": "Most Used Skills",
                                    "visible": false
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
                                        "value": "{ProductName}"
                                    }
                                ],
                                "measures": [
                                    {
                                        "label": "Value",
                                        "value": "{UnitsInStock}"
                                    }
                                ]
                            }
                        }
                    }
                };

                this.sBearerToken = this.fnGetBearerToken();

                if (this.sBearerToken) {
                    $.ajax({
                        type: 'GET',
                        url: "/sal_cai_dev/public/api/usage-metrics/v2/summary",
                        contentType: 'application/json',
                        headers: {
                            "X-Token": "12bf59e7e3763bd9b109083e7407e8aa",
                            "Authorization": "Bearer " + this.sBearerToken
                        },
                        success: function (oData) {
                            var oChatbotSummaryModel = new JSONModel(oData.results);
                            oDonutCard.donut["sap.card"].content.data.json.measures = oData.results.skills;
                            oDonutCard.donut["sap.card"].content.data.path = "/measures";

                            this.getView().setModel(oChatbotSummaryModel, "ChatbotSummaryModel");
                        }.bind(this),
                        error: function () {
                        }
                    });
                }

                // this.getOwnerComponent().getModel().read("/summary", {
                //     success: function (oData) {
                //         var oChatbotSummaryModel = new JSONModel(oData.results);
                //         oDonutCard.donut["sap.card"].content.data.json.measures = oData.results.skills;
                //         oDonutCard.donut["sap.card"].content.data.path = "/measures";

                //         this.getView().setModel(oChatbotSummaryModel, "ChatbotSummaryModel");
                //     }.bind(this),
                //     error: function () {
                //     }
                // });
            },

            fnGetBearerToken: function () {
                $.ajax({
                    type: 'GET',
                    url: "/sal_cai_auth/oauth/token?grant_type=client_credentials",
                    contentType: 'application/json',
                    success: function (oData) {
                        this.sBearerToken = oData;
                        return this.sBearerToken;
                    }.bind(this),
                    error: function () {
                    }
                });
            },

            handleFiltersPress: function (oEvent) {
                var oButton = oEvent.getSource(),
                    oView = this.getView();

                // create popover
                if (!this._pPopover) {
                    this._pPopover = Fragment.load({
                        id: oView.getId(),
                        name: "com.sal.report.chatbotsummaryreport.view.FiltersDialog",
                        controller: this
                    }).then(function (oPopover) {
                        return oPopover;
                    });
                }

                this._pPopover.then(function (oPopover) {
                    oPopover.openBy(oButton);
                });
            }
        });
    });