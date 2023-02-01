sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "com/sal/salhr/model/formatter",
    "sap/m/MessageBox"
],
    function (BaseController, JSONModel, formatter, MessageBox) {
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

                if (sLayout === "ThreeColumnsMidExpanded") {
                    this.getView().getModel("LocalViewModel").setProperty("/EditMode", false);
                    this.byId("idFullScreenBTN").setIcon("sap-icon://full-screen");
                    this._getTicketData(this.sChildID);
                }
                if (sLayout === "EndColumnFullScreen" && this.byId("idFullScreenBTN").getIcon() == "sap-icon://full-screen") {
                    this.getView().getModel("LocalViewModel").setProperty("/EditMode", false);
                    this.byId("idFullScreenBTN").setIcon("sap-icon://exit-full-screen");
                    this._getTicketData(this.sChildID);
                }
            },

            _bindView: function (data) {
                var object = data.results[0];
                this.object = data.results[0];
                var oHeaderModel = new JSONModel(data.results[0]);
                this.getView().setModel(oHeaderModel, "headerModel");
            
                this.getView().setBusy(true);
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
                var bIsUserManager = this.getOwnerComponent().getModel("EmpInfoModel").getProperty("/IsUserManager").toString();

              
               


                this.getView().getModel().read(`/EmpInfo('${object.externalCode}')`, {
                    urlParameters: {
                        "moreInfo": "true"
                    },
                    success: function (oData) {
                        this.onCallHistoryData(object.ticketCode);
                        this.getView().setBusy(false);
                        var oIdCardDetailModel = new JSONModel(oData);
                        this.getView().setModel(oIdCardDetailModel, "cust_idReplacementDetailsModel");
                        // debugger;
                      
                    }.bind(this),
                    error: function (oError) {
                        this.getView().setBusy(false);
                    }.bind(this),
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

                this.getView().setBusy(true);
                this.getOwnerComponent().getModel().read("/TicketHistory", {
                    filters: [filter],
                    success: function (oData) {
                        this.getView().setBusy(false);
                        var oHistoryData = new JSONModel(oData.results);
                        this.getView().setModel(oHistoryData, "HistoryData");
                    }.bind(this),
                    error: function (oError) {
                        this.getView().setBusy(false);
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

            handleClose: function () {
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

            onWithdrawPress: function () {
                this.fnDeleteIDReplacement();
            },

            fnDeleteIDReplacement: function () {
                this.mainModel = this.getOwnerComponent().getModel();
                if (this.object.status === "PENDING" || this.object.status === "REJECTED") {
                    var swfID = this.object.workflowRequestId;
                
                    this.onWithdrawRequest(swfID);
                }
                else {
                    this.onDeleteServiceCall();
                }
            },

            onDeleteServiceCall: function () {
                this.getView().setBusy(true);
                var sUserID = this.object.externalCode,
                    sEffectiveStartDate = new Date(this.object.effectiveStartDate),
                    sPath = this.getComponentModel().createKey("/SF_IDReplacement", {
                        User: sUserID,
                        effectiveStartDate: sEffectiveStartDate
                    });
                this.getView().getModel().remove(sPath, {
                    urlParameters: {
                        ticketId: this.sChildID
                    },
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