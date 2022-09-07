sap.ui.define([
    "./BaseController",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "com/sal/salhr/model/formatter"

],

    function (BaseController, Controller, JSONModel, formatter) {
        "use strict";
        return BaseController.extend("com.sal.salhr.controller.EmployeeTerminateDetailPage", {
            formatter: formatter,
            onInit: function () {
                var oLocalViewModel = new JSONModel({
                    EditMode: false,
                    PageTitle: null,
                    Modify: true
                });

                this.getView().setModel(oLocalViewModel, "LocalViewModel");

                this.oRouter = this.getRouter();
                this.oRouter.getRoute("EmployeeTerminateDetail").attachPatternMatched(this._onObjectMatched, this);

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
                debugger;
                var object = data.results[0];
                var oHeaderModel = new JSONModel(data.results[0]);
                this.getView().setModel(oHeaderModel, "headerModel");


                var oComponentModel = this.getComponentModel(),
                    sKey = null;
                sKey = oComponentModel.createKey("/SF_EmpEmploymentTermination", {
                    endDate: object.endDate,
                    personIdExternal: object.externalCode,
                    userId: object.employeeId

                });
                this.getView().bindElement({
                    path: sKey,
                    parameters: {

                        expand: "jobInfoNav/eventReasonNav",
                        custom: {
                            "recordStatus": object.status,
                            "IsUserManager": bIsUserManager
                        }
                    },
                    events: {
                        change: function (oEvent) {
                            var oContextBinding = oEvent.getSource();
                            oContextBinding.refresh(false);
                        }.bind(this),
                        dataRequested: function () {
                            this.getView().setBusy(true);
                        }.bind(this),
                        dataReceived: function () {
                            this.getView().setBusy(false);
                            this.onCallHistoryData(object.ticketCode);
                        }.bind(this)
                    }
                });




                this.getView().getModel("LocalViewModel").setProperty("/PageTitle", "Additional Payment Request");
                this.getView().getModel("LocalViewModel").refresh();

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


            onEditPress: function () {
                this.getView().getModel("LocalViewModel").setProperty("/EditMode", true);

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


                this.oRouter.navTo("EmployeeTerminateDetail", {
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