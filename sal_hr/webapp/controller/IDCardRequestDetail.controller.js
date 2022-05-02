sap.ui.define([
    "./BaseController",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "com/sal/salhr/model/formatter",
    "sap/m/MessageBox"
],

    function (BaseController, Controller, JSONModel, formatter, MessageBox) {
        "use strict";
        return BaseController.extend("com.sal.salhr.controller.IDCardRequestDetail", {
            formatter: formatter,
            onInit: function () {
                var oLocalViewModel = new JSONModel({
                    EditMode: false,
                    PageTitle: null,
                    IDCardModule: false
                });

                this.getView().setModel(oLocalViewModel, "LocalViewModel");

                this.oRouter = this.getRouter();
                this.oRouter.getRoute("IDCardRequestDetail").attachPatternMatched(this._onObjectMatched, this);
            },

            _onObjectMatched: function (oEvent) {
                this.sParentID = oEvent.getParameter("arguments").parentMaterial;
                this.sChildID = oEvent.getParameter("arguments").childModule;
                var sLayout = oEvent.getParameter("arguments").layout;
                this.getView().getModel("layoutModel").setProperty("/layout", sLayout);
                this.byId("idFullScreenBTN").setIcon("sap-icon://full-screen");
                this._getTicketData(this.sChildID);
            },

            _bindView: function (data) {
                this.object = data.results[0];
                var oHeaderModel = new JSONModel(data.results[0]);
                this.getView().setModel(oHeaderModel, "headerModel");

                var oComponentModel = this.getComponentModel(),
                    sKey = null,
                    sTicketCode = this.object.ticketCode,
                    oAttachModel = new JSONModel();
                this.getView().setModel(oAttachModel, "attachmentModel");

                var sUserID = this.object.externalCode,
                    sEffectiveStartDate = this.object.effectiveStartDate,
                    sKey = oComponentModel.createKey("/SF_IDReplacement", {
                        User: sUserID,
                        effectiveStartDate: sEffectiveStartDate
                    });

                this.getView().bindElement({
                    path: sKey,
                    parameters: {
                        expand: "cust_idReplacementDetails, UserNav"
                    },
                    events: {
                        change: function (oEvent) {
                            oEvent.getSource().refresh(false);
                            this.getView().setBusy(false);
                        }.bind(this),
                        dataRequested: function () {
                            this.getView().setBusy(true);
                        }.bind(this),
                        dataReceived: function (oData) {
                            this._fnSetUserName(oData.getParameter("data"));
                            this.onCallHistoryData(object.ticketCode);
                            this.getView().setBusy(false);
                        }.bind(this)
                    }
                });
                this.getView().getModel("attachmentModel").setProperty("/ticketCode", sTicketCode);
                this.getView().getModel("LocalViewModel").setProperty("/IDCardModule", true);
                this.getView().getModel("LocalViewModel").setProperty("/PageTitle", "ID Replacement Changes");
            },

            onCallHistoryData: function (sticketCode) {
                var ticketCodeFilter = new sap.ui.model.Filter({
                    path: "ticketCode",
                    operator: sap.ui.model.FilterOperator.EQ,
                    value1: sticketCode
                });
                var filter = [];
                filter.push(ticketCodeFilter);
                this.getOwnerComponent().getModel().read("/TicketHistory", {
                    filters: [filter],
                    
                    success: function (oData, oResponse) {
                        var oHistoryData = new JSONModel(oData.results);
                        this.getView().setModel(oHistoryData, "HistoryData");
                    
                        
                    }.bind(this),
                    error: function (oError) {
                        sap.m.MessageBox.error(JSON.stringify(oError));
                    }
                });
            },


            _fnSetUserName: function (oData) {
                var sUserName = "";
                if (oData.UserNav.defaultFullName) {
                    sUserName = oData.UserNav.defaultFullName;
                }
                else {
                    if (oData.UserNav.firstName)
                        sUserName += oData.UserNav.firstName + " ";
                    if (oData.UserNav.middleName)
                        sUserName += oData.UserNav.middleName + " ";
                    if (oData.UserNav.lastName)
                        sUserName += oData.UserNav.lastName;
                }
                this.getView().getModel("headerModel").setProperty("/UserName", sUserName);
            },

            onCancelPress: function () {
                this.getView().getModel("LocalViewModel").setProperty("/EditMode", false);
            },

            handleFullScreen: function (oEvent) {
                var sLayout = "";
                if (oEvent.getSource().getIcon() === "sap-icon://full-screen") {
                    sLayout = "EndColumnFullScreen";
                    oEvent.getSource().setIcon("sap-icon://exit-full-screen");
                } else {
                    sLayout = "ThreeColumnsMidExpanded";
                    oEvent.getSource().setIcon("sap-icon://full-screen");
                }

                this.oRouter.navTo("IDCardRequestDetail", {
                    parentMaterial: this.sParentID,
                    childModule: this.sChildID,
                    layout: sLayout
                });

            },

            handleClose: function (oEvent) {
                var sLayout = "",
                    sIcon = this.byId("idFullScreenBTN").getIcon();
                if (sIcon === "sap-icon://full-screen") {
                    sLayout = "TwoColumnsMidExpanded";
                } else {
                    sLayout = "ThreeColumnsMidExpanded";
                    this.byId("idFullScreenBTN").setIcon("sap-icon://full-screen");
                }
                this.oRouter.navTo("detail", {
                    parentMaterial: this.sParentID,
                    layout: sLayout
                });
            },

            fnDeleteIDReplacement: function () {
                this.getView().setBusy(true);
                var sUserID = this.object.externalCode,
                    sEffectiveStartDate = new Date(this.object.effectiveStartDate),
                    sPath = this.getComponentModel().createKey("/SF_IDReplacement", {
                        User: sUserID,
                        effectiveStartDate: sEffectiveStartDate
                    });
                this.getView().getModel().remove(sPath, {
                    success: function (oData) {
                        if (oData !== "" || oData !== undefined) {
                            this.getView().setBusy(false);
                            MessageBox.success("Record Deleted successfully.");
                            this.getView().getModel().refresh();
                            this.oRouter.navTo("detail", {
                                parentMaterial: this.sParentID,
                                layout: "TwoColumnsMidExpanded"
                            });
                        } else {
                            this.getView().setBusy(false);
                            MessageBox.error("Record Not able to delete.");
                        }
                    }.bind(this),
                    error: function (oError) {
                        this.getView().setBusy(false);
                        if (JSON.parse(oError.responseText).error.message.value.indexOf("{") === 0)
                            sap.m.MessageBox.error(JSON.parse(JSON.parse(oError.responseText).error.message.value).error.message.value.split("]")[1]);
                        else {
                            sap.m.MessageBox.error(JSON.parse(oError.responseText).error.message.value);
                        }
                    }.bind(this)
                });
            },

            onApprovePress: function () {
                var swfRequestId = this.getView().getModel("headerModel").getProperty("/workflowRequestId");
                this.onApproveRequest(swfRequestId);
            },

            onRejectPress: function () {
                var swfRequestId = this.getView().getModel("headerModel").getProperty("/workflowRequestId");
                this.onRejectRequest(swfRequestId);
            }
        });
    });