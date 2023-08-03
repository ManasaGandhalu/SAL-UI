sap.ui.define([
    "./BaseController",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "com/sal/salhr/model/formatter"
],
    function (BaseController, Controller, JSONModel, formatter) {
        "use strict";
        return BaseController.extend("com.sal.salhr.controller.BusinessCardRequestDetailpage", {
            formatter: formatter,
            onInit: function () {
                var oLocalViewModel = new JSONModel({
                    EditMode: false,
                    BusineesTripModule: false,
                    HealthModule: false,
                    PageTitle: null
                });
                this.getView().setModel(oLocalViewModel, "LocalViewModel");
                this.oRouter = this.getRouter();
                this.oRouter.getRoute("BusinessRequestDetail").attachPatternMatched(this._onObjectMatched, this);
                this.mainModel = this.getOwnerComponent().getModel();
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


                var bIsUserManager = this.getOwnerComponent().getModel("EmpInfoModel").getProperty("/IsUserManager").toString();
                var oComponentModel = this.getComponentModel(),
                    sKey = null;
                this.effectiveStartDate = object.effectiveStartDate;
                this.User = object.externalCode;
                sKey = oComponentModel.createKey("/SF_BusinessCard", {
                    effectiveStartDate: object.effectiveStartDate,
                    User: object.externalCode
                });

                this.getView().getModel("LocalViewModel").setProperty("/PageTitle", "Business Card Request");
                this.getView().getModel("LocalViewModel").refresh();
                this.getView().bindElement({
                    path: sKey,
                    parameters: {
                        expand: "UserNav",
                        custom: {
                            "recordStatus": object.status,
                            "IsUserManager": bIsUserManager
                        }
                    },
                    events: {
                        
                        dataRequested: function () {
                            this.getView().setBusy(true);
                        }.bind(this),
                        dataReceived: function () {
                            this.getView().setBusy(false);
                            this.fnSetCreateBusinessCardLocalModel();
                            this.onCallHistoryData(object.ticketCode);
                        }.bind(this)
                    }
                });
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


            fnSetCreateBusinessCardLocalModel: function () {

                this.EmpInfoObj = this.getOwnerComponent().getModel("EmpInfoModel").getData();


                var sExternalCode = this.EmpInfoObj.userId,
                    sNationalID = this.EmpInfoObj.nationalId,
                    sNationality = this.EmpInfoObj.nationality,
                    sMobileNumber = this.EmpInfoObj.mobile,
                    sDateOfBirth = this.EmpInfoObj.dateOfBirth,

                    oCreateBusinessCardObj = {
                        "externalCode": sExternalCode,
                        "externalName": null,
                        "sJobTitle": this.EmpInfoObj.jobTitle,
                        "sdivision": this.EmpInfoObj.division,
                        "sLocation": "",
                        "sEmail": this.EmpInfoObj.email,
                        "sMobile": this.EmpInfoObj.mobile,
                        "sOfficeNo": this.EmpInfoObj.officeNumber,
                        "effectiveStartDate": new Date()


                    },
                    oCreateBusinessCardModel = new JSONModel(oCreateBusinessCardObj);

                this.getView().setModel(oCreateBusinessCardModel, "CreateBusinessCardModel");


            },


            onEditPress: function () {
                this.getView().getModel("LocalViewModel").setProperty("/EditMode", true);
            },
            onCancelPress: function () {
                this.getView().getModel("LocalViewModel").setProperty("/EditMode", false);
            },
            onWithdrawPress: function () {

                if (this.object.status === "PENDING" || this.object.status === "REJECTED") {
                    var swfID = this.object.workflowRequestId;
                  
                    this.onWithdrawRequest(swfID);
                 
                }
                else {
                    this.onDeleteAPICall();
                }




            },


            onDeleteAPICall: function () {
                var oComponentModel = this.getComponentModel(),
                    sKey = null,
                    sKey = oComponentModel.createKey("/SF_BusinessCard", {
                        User: this.User,
                        effectiveStartDate: this.effectiveStartDate,

                    });
                this.getView().getModel().remove(sKey, {
                    urlParameters: {
                        ticketId: this.sChildID
                    },
                    success: function (oData) {
                        if (oData !== "" || oData !== undefined) {
                            sap.m.MessageBox.success("Record Deleted successfully.");
                            this.oRouter.navTo("detail", {
                                parentMaterial: this.sParentID,
                                layout: "TwoColumnsMidExpanded"
                            });
                            this.getView().getModel().refresh();
                        } else {
                            MessageBox.error("Record Not able to delete.");
                        }
                    }.bind(this),
                    error: function (oError) {
                    }.bind(this)
                });
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
                this.oRouter.navTo("BusinessRequestDetail", {
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
            _validateMandatoryFields: function () {
                var bValid = true;
                if (this.byId("idIncidentDescription").getValue() === "") {
                    this.byId("idIncidentDescription").setValueState("Error");
                    this.byId("idIncidentDescription").setValueStateText(
                        "Please enter incident description details"
                    );
                    bValid = false;
                } else {
                    this.byId("idIncidentDescription").setValueState("None");
                    this.byId("idIncidentDescription").setValueStateText(null);
                }
              
                return bValid;
            },

            onSavePress: function () {
                // if (!this._validateMandatoryFields()) {
                //     return;
                // }
                var oPayloadObj = {},
                    sEntityPath = null,
                    oComponentModel = this.getComponentModel(),
                    sKey = null,
                    sKey = oComponentModel.createKey("/SF_BusinessCard", {
                        effectiveStartDate: this.effectiveStartDate,
                        User: this.User
                    });
                sEntityPath = sKey;
                oPayloadObj = this.fnGetBusinessCardRequestPayload();
                this.getView().setBusy(true);
                this.getView().getModel().update(sEntityPath, oPayloadObj, {
                    urlParameters: {
                        ticketId: this.sChildID
                    },
                    success: function (oResponse) {
                        this.getView().setBusy(false);

                        sap.m.MessageBox.success("Request Modified successfully.");
                        this.getView().getModel().refresh();
                        this.getView().getModel("LocalViewModel").setProperty("/EditMode", false);
                    }.bind(this),
                    error: function (oError) {
                        this.getView().setBusy(false);
                        sap.m.MessageBox.error(JSON.parse(JSON.parse(oError.responseText).error.message.value).error.message.value.split("]")[1]);
                        this.getView().getModel().refresh();
                    }.bind(this)
                });
            },
            fnGetBusinessCardRequestPayload: function () {
                var sUserID = this.getOwnerComponent().getModel("EmpInfoModel").getData().userId;

                var scust_email = this.getView().byId("idEditEmail").getValue(),
                    scust_mobile = this.getView().byId("idEditMobile").getValue(),
                    scust_poBox = this.getView().byId("idEditPOBOX").getValue(),
                    scust_jobTitle = this.getView().byId("idEditJobTitle").getValue(),
                    scust_location = this.getView().byId("idEditLocation").getValue(),
                    scust_officeNumber = this.getView().byId("idEditOfficeNo").getValue(),
                    seffectiveStartDate = this.getView().byId("idEditIncidentStartDate").getDateValue(),
                    dateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" });
                seffectiveStartDate = dateFormat.format(new Date(seffectiveStartDate));
                seffectiveStartDate = seffectiveStartDate + "T00:00:00";
                return {

                    "User": sUserID,
                    "cust_email": scust_email,
                    "cust_mobile": scust_mobile,
                    "cust_poBox": scust_poBox,
                    "cust_location": scust_location,
                    "cust_officeNumber": scust_officeNumber,
                    "effectiveStartDate": seffectiveStartDate,
                    "cust_jobTitle": scust_jobTitle

                }
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