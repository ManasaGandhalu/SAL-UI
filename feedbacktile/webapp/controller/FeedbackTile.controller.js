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

        return Controller.extend("com.sal.feedbacktile.controller.FeedbackTile", {
            onInit: function () {
                this._bindView();
            },

            _bindView: function () {
                var that = this;
                this.getOwnerComponent().getModel().read("/Rating",
                {
                    success: function (oData) {
                        // debugger;
                        that.fnSetRatingModels(oData.results);
                    },
                    error: function () {

                    }
                });
            },
            fnSetRatingModels:function(oData){
                var feedbackData = {
                    totalFeedback: 0,
                    totalHappy: 0, 
                    totalNeutral: 0, 
                    totalUnhappy: 0
                };
                // var oData = {};
                oData.filter(function(value) {
                    feedbackData.totalFeedback++;

                    if(value.rating == 1) {
                        feedbackData.totalHappy++;
                    } else if(value.rating == 2) {
                        feedbackData.totalNeutral++;
                    } else if(value.rating == 3) {
                        feedbackData.totalUnhappy++;
                    }
                });
                
                var oFeedbackData = new JSONModel(feedbackData);
                this.getView().setModel(oFeedbackData, "FeedbackModel");
            }
        });
    });
