sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/json/JSONModel",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/ui/core/Fragment"
    ],
    function (Controller, JSONModel, Filter, FilterOperator, Fragment) {
        "use strict";

        return Controller.extend("com.sal.chatbotsummaryreport.controller.controller.App", {
            onInit: function () {
                var oCurrentDate = new Date(),
                    oFromDate = oCurrentDate.getDate() - 7;

                oFromDate = new Date(oCurrentDate.setDate(oFromDate));

                // var oLocalViewModel = new JSONModel({
                //     FromDate: oFromDate,
                //     ToDate: new Date()
                // });

                var oLocalViewModel = new JSONModel({
                    FromDate: null,
                    ToDate: null
                });

                this.getView().setModel(oLocalViewModel, "LocalViewModel");

                this.fnGetChatBotData();
            },

            fnGetChatBotData: function () {
                var urlParameters = {
                    "IsUserManager": "true"
                };
                var oFromDate = this.getView().getModel("LocalViewModel").getProperty("/FromDate"),
                    oToDate = this.getView().getModel("LocalViewModel").getProperty("/ToDate");
                    if(oFromDate) {
                        var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" }),
                        oStartDate = dateFormat.format(new Date(oFromDate)),
                        oEndDate = dateFormat.format(new Date(oToDate)),
                        sStartDate = oStartDate + "T00:00:00.000Z",
                        sEndDate = oEndDate + "T23:59:59.000Z";

                        //set from and to date filters.
                        urlParameters.from = sStartDate;
                        urlParameters.to = sEndDate;
                    }

                this.getView().setBusy(true);
                this.getOwnerComponent().getModel().read("/chatBotUsageSummary", {
                    urlParameters: urlParameters,
                    success: function (oData) {
                        if (oData.chatBotUsageSummary.length > 2) {
                            var oSummaryData = JSON.parse(oData.chatBotUsageSummary);
                            oSummaryData = this.fnGetSummaryDataFormatted(oSummaryData);

                            var oChatbotSummaryModel = new JSONModel(oSummaryData);
                            this.getView().setModel(oChatbotSummaryModel, "ChatbotSummaryModel");
                            this.getView().setBusy(false);
                        }
                    }.bind(this),
                    error: function () {
                        this.getView().setBusy(false);
                    }.bind(this)
                });
            },

            fnGetSummaryDataFormatted: function (oSummaryData) {
                // Format and set Mostly used and Never Used Skills Intents Data
                var summary = Object.assign({}, oSummaryData);
                summary.MostUsedSkills = oSummaryData.skills.slice(0, 5);
                summary.MostUsedIntents = oSummaryData.intents.slice(0, 10);
                summary.NeverUsedSkills = this.fnGetNeverUsedItems(oSummaryData.skills);
                summary.NeverUsedIntents = this.fnGetNeverUsedItems(oSummaryData.intents);

                // Format and Set values for Overview fields
                summary.conversations = oSummaryData.conversations > 999 ? ((oSummaryData.conversations / 1000).toFixed(2)) + "k" : oSummaryData.conversations;
                summary.participants = oSummaryData.participants > 999 ? ((oSummaryData.participants / 1000).toFixed(2)) + "k" : oSummaryData.participants;
                summary.messagesReceived = oSummaryData.messagesReceived > 999 ? ((oSummaryData.messagesReceived / 1000).toFixed(2)) + "k" : oSummaryData.messagesReceived;
                summary.MessagesPerConversation = oSummaryData.messagesPerConversation.toFixed(2);

                // Set overview fields counts and Status indicators
                summary.conversationIndicator = this.formatDiffData(oSummaryData.conversationsDiff);
                summary.participantsIndicator = this.formatDiffData(oSummaryData.participantsDiff);
                summary.messagesReceivedIndicator = this.formatDiffData(oSummaryData.messagesReceivedDiff);
                summary.MessagesPerConversationIndicator = this.formatDiffData(oSummaryData.messagesPerConversationDiff);

                for(var i = 0; i < summary.items.length; i++) {
                    var item = summary.items[i];
                    var date = new Date(item.date);
                    var month = date.getMonth() + 1;
                    var day = date.getDate();
                    var year = date.getFullYear();
                    item.displayDate = `${month}/${day}/${year}`; 
                }
                
                return summary;
            },

            formatDiffData: function(number) {
                if(number > 0) {
                    return "+" + (number % 1 == 0 ? number.toFixed(0) : number.toFixed(2));
                } else if(number < 0) {
                    return (number % 1 == 0 ? number.toFixed(0) : number.toFixed(2));
                } else {
                    return null;
                }
            },

            fnGetNeverUsedItems: function (aData) {
                return aData.filter(function (oItem) {
                    return oItem.count <= 2;
                });
            },

            fnSetIndicatorsState: function (iCount) {
                iCount = Number(iCount);
                return iCount > 0 ? "Success" : "Warning";
            },

            handleFiltersPress: function (oEvent) {
                var oButton = oEvent.getSource(),
                    oView = this.getView();

                // create popover
                if (!this.oDateRangeFilterDialog) {
                    this.oDateRangeFilterDialog = Fragment.load({
                        id: oView.getId(),
                        name: "com.sal.chatbotsummaryreport.view.FiltersDialog",
                        controller: this
                    }).then(function (oPopover) {
                        var i18nModel = new sap.ui.model.resource.ResourceModel({
                            bundleUrl : "./i18n/i18n.properties"
                        });
                        oPopover.setModel(i18nModel, "i18n"); 
                        return oPopover;
                    });
                    
                }

                this.oDateRangeFilterDialog.then(function (oPopover) {
                    oPopover.openBy(oButton);
                });
            },

            handleFiltersOkPress: function (oEvent) {
                var oFromDate = this.getView().byId("idDateRangeSelector").getDateValue(),
                    oToDate = this.getView().byId("idDateRangeSelector").getSecondDateValue();

                this.getView().getModel("LocalViewModel").setProperty("/FromDate", oFromDate);
                this.getView().getModel("LocalViewModel").setProperty("/ToDate", oToDate);
                this.getView().getModel("LocalViewModel").refresh();

                this.fnGetChatBotData();
            },

            handleFiltersResetPress: function (oEvent) {
                // debugger;
                this.getView().byId("idDateRangeSelector").setValue(null);
                this.getView().getModel("LocalViewModel").setProperty("/FromDate", null);
                this.getView().getModel("LocalViewModel").setProperty("/ToDate", null);
                this.getView().getModel("LocalViewModel").refresh();

                this.fnGetChatBotData();
            },

            // Function is used to set the items in Ascending or Descending Order
            fnSortSkillsIntents: function (oEvent) {
                var sSectionName = oEvent.getSource().getParent().getProperty("title"),
                    sPropertyName = null;
                if (sSectionName === "Skills Usage")
                    sPropertyName = "/skills";
                else
                    sPropertyName = "/intents";

                var aSkills = this.getView().getModel("ChatbotSummaryModel").getProperty(sPropertyName),
                    sIcon = oEvent.getSource().getProperty("src"),
                    aCountAscending = aSkills.sort(function (oItem1, oItem2) {
                        if (oItem1.count < oItem2.count) {
                            return -1; //oItem1 comes first
                        }
                        if (oItem1.count > oItem2.count) {
                            return 1; // oItem2 comes first
                        }
                        return 0;  // oItem1 and oItem2 must be equal
                    });

                if (sIcon === "sap-icon://sort-ascending") {
                    this.getView().getModel("ChatbotSummaryModel").setProperty(sPropertyName, aCountAscending);
                    this.getView().getModel("ChatbotSummaryModel").refresh();
                    return;
                }
                if (sIcon === "sap-icon://sort-descending") {
                    this.getView().getModel("ChatbotSummaryModel").setProperty(sPropertyName, aCountAscending.reverse());
                    this.getView().getModel("ChatbotSummaryModel").refresh();
                    return;
                }
                if (sIcon === "sap-icon://alphabetical-order") {
                    var aAlphaAscending = aSkills.sort(function (oItem1, oItem2) {
                        if (oItem1.name.toUpperCase() < oItem2.name.toUpperCase()) {
                            return -1; //oItem1 comes first
                        }
                        if (oItem1.name.toUpperCase() > oItem2.name.toUpperCase()) {
                            return 1; // oItem2 comes first
                        }
                        return 0;  // oItem1 and oItem2 must be equal
                    });
                    this.getView().getModel("ChatbotSummaryModel").setProperty(sPropertyName, aAlphaAscending);
                    this.getView().getModel("ChatbotSummaryModel").refresh();
                }
            }
        });
    })