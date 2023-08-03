sap.ui.define([
    "./BaseController",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "com/sal/salhr/model/formatter"

],

    function (BaseController, Controller, JSONModel, formatter) {
        "use strict";
        return BaseController.extend("com.sal.salhr.controller.BankAccChangeDetail", {
            formatter: formatter,
            onInit: function () {
                var oLocalViewModel = new JSONModel({
                    EditMode: false,
                    PageTitle: null,
                    Modify: true
                });

                this.getView().setModel(oLocalViewModel, "LocalViewModel");

                this.oRouter = this.getRouter();
                this.oRouter.getRoute("BankAccChangeDetail").attachPatternMatched(this._onObjectMatched, this);
          
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
                // debugger;
                var object = data.results[0];
                this.object = data.results[0];

                var oHeaderModel = new JSONModel(data.results[0]);
                this.getView().setModel(oHeaderModel, "headerModel");


        
                var oComponentModel = this.getComponentModel(),
                    sKey = null;
                var that = this;
                var sTicketCode = this.object.ticketCode;
                var bIsUserManager = this.getOwnerComponent().getModel("EmpInfoModel").getProperty("/IsUserManager").toString();
                var oAttachModel = new JSONModel();
                that.getView().setModel(oAttachModel, "attachmentModel");
                switch (this.sParentID) {


                    //  Bank Request Module 
                    case "13":

                        // debugger;
                        sKey = oComponentModel.createKey("/SF_BankDetails", {
                            effectiveStartDate: object.effectiveStartDate,
                            externalCode: object.externalCode


                        });
                        this.getView().getModel("LocalViewModel").setProperty("/BankRequestModel", true);
                        this.getView().getModel("LocalViewModel").setProperty("/BusineesTripModule", false);
                        this.getView().getModel("LocalViewModel").setProperty("/LeaveModule", false);
                        this.getView().getModel("LocalViewModel").setProperty("/HealthModule", false);
                        this.getView().getModel("LocalViewModel").setProperty("/BankRequestModel", false);
                        this.getView().getModel("LocalViewModel").setProperty("/IDCardModule", false);
                        this.getView().getModel("LocalViewModel").setProperty("/PageTitle", "Bank Change Request");
                        break;
                }

                this.getView().getModel("LocalViewModel").refresh();
                if (this.sParentID !== "7") {
                    this.getView().bindElement({
                        path: sKey,
                        parameters: {
                            expand: "externalCodeNav",
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
                }
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

            onChangeInpIBAN: function (oEve) {
                var sValue = oEve.getSource().getValue();

                if (!sValue.match(/^[0-9A-Za-z]+$/)) {
                    sap.ui.core.Fragment.byId("idBankChangerequestFragment", "idIBANINP").setValueState("Error");
                    sap.ui.core.Fragment.byId("idBankChangerequestFragment", "idIBANINP").setValueStateText("Please enter only alpha-numeric characters");
                }

                else {
                    sap.ui.core.Fragment.byId("idBankChangerequestFragment", "idIBANINP").setValueState("None");

                }

            },


            onChangeInpBankName: function (oEve) {
                var sValue = oEve.getSource().getValue();

                if (!sValue.match(/^[a-zA-Z0-9\s]*$/)) {


                    sap.ui.core.Fragment.byId("idBankChangerequestFragment", "idBankNameINP").setValueState("Error");
                    sap.ui.core.Fragment.byId("idBankChangerequestFragment", "idBankNameINP").setValueStateText("Please enter only alpha-numeric characters");
                }

                else {
                    sap.ui.core.Fragment.byId("idBankChangerequestFragment", "idBankNameINP").setValueState("None");

                }

            },


            onWithdrawPress  : function()
            {
                this.mainModel = this.getOwnerComponent().getModel();
                if(this.object.status === "PENDING" || this.object.status === "REJECTED" ) 
                {
                    var swfID =   this.object.workflowRequestId;
                    this.onWithdrawRequest(swfID);
                }
                else{
                    this.onDeleteServiceCall();
                }
            },

            onDeleteServiceCall: function () {
                // var sKey = "038718668910415eb3f3773a68fee340";
                var sKey = this.sChildID;
                if (sKey === "" || sKey === undefined) {
                    MessageBox.error("Please enter sKey ID to delete the record.");
                    return;
                }
                this.getView().setBusy(true);
                switch (this.sParentID) {
                    // Leave Module
                    case "1":
                        this.fnDeleteLeaveRequest();

                        break;
                    // Business Trip Module
                    case "2":

                        break;
                    // Health Module
                    case "13":
                        this.fnDeleteBankAccount();
                        break;
                    //  Bank Request Module 
                    case "7":
                        this.fnDeleteIDReplacement();
                        break;
                }


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

              
                this.oRouter.navTo("BankAccChangeDetail", {
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

            onSavePress: function () {
                var oPayloadObj = {},
                    sEntityPath = null;

                switch (this.sParentID) {
                    // Leave Module
                    case "1":
                        sEntityPath = "/SF_Leave('" + this.object.externalCode + "')";
                        oPayloadObj = this.fnGetLeaveRequestPayload();
                        break;

                    // Business Trip Module
                    case "2":
                     
                        break;

                    // Health Module
                    case "3":
                     
                        break;
                    // Bankrequest change Module
                    case "13":

                        var oComponentModel = this.getComponentModel(),
                            sKey = oComponentModel.createKey("/SF_BankDetails", {
                                effectiveStartDate: this.object.effectiveStartDate,
                                externalCode: this.object.externalCode


                            });
                        sEntityPath = sKey;
                        oPayloadObj = this.fnBankRequestChangePayload();
                        break;
                }
                this.getView().setBusy(true);
                this.getView().getModel().update(sEntityPath, oPayloadObj, {
                    urlParameters: {
                        ticketId: this.sChildID
                    },
                    success: function (oResponse) {
                        this.getView().setBusy(false);
                        sap.m.MessageBox.success("Request Submitted successfully.");
                        this.getView().getModel().refresh();
                    }.bind(this),
                    error: function (oError) {
                        this.getView().setBusy(false);
                        sap.m.MessageBox.error(JSON.parse(JSON.parse(oError.responseText).error.message.value).error.message.value.split("]")[1]);
                        this.getView().getModel().refresh();
                    }.bind(this)
                });
            },

            fnGetLeaveRequestPayload: function () {
            
                if (this.isAttachmentNew === true) {
                    var sattachmentFileName = this.fileName;
                    var sattachmentFileContent = this.fileContent;
                    var sattachmentFileID = this.getView().getModel("attachmentModel").getData().attachmentId;
                    var isAttachmentNew = true;

                } else {
                    sattachmentFileName = this.getView().getModel("attachmentModel").getData().fileName;
                    sattachmentFileContent = this.getView().getModel("attachmentModel").getData().fileContent;
                    sattachmentFileID = sattachmentFileName = this.getView().getModel("attachmentModel").getData().fileName;
                    sattachmentFileContent = this.getView().getModel("attachmentModel").getData().fileContent;
                    sattachmentFileID = this.getView().getModel("attachmentModel").getData().attachmentId;
                }


                var sEndDate = this.getView().byId("idEditLeaveEndDatePicker").getValue();
                sEndDate = Date.parse(sEndDate);
                var sStartDate = this.getView().byId("idStartLDatePicker").getValue();
                sStartDate = Date.parse(sStartDate);
                isAttachmentNew = false;

                return {
                    "endDate": "/Date(" + sEndDate + ")/",
                    "loaActualReturnDate": null,
                    "timeType": "S110",
                    "loaExpectedReturnDate": null,
                    "loaStartJobInfoId": null,
                    "startDate": "/Date(" + sStartDate + ")/",
                    "cust_KronosPayCodeEditID": null,
                    "startTime": null,
                    "loaEndJobInfoId": null,
                    "approvalStatus": null,
                    "undeterminedEndDate": false,
                    "userId": "12002024",
                    "recurrenceGroup": null,
                    "fractionQuantity": "1",
                    "endTime": null,
                    "isAttachmentNew": isAttachmentNew,
                    "attachmentId": sattachmentFileID,
                    "attachmentFileContent": sattachmentFileContent,
                    "attachmentFileName": sattachmentFileName,
                    "attachmentUserId": "Extentia"

                }

            },

            fnGetBusinessTripPayload: function () {
                return {
                };
            },

            fnGetHealthInsurancePayload: function () {
                return {
                };
            },
            fnBankRequestChangePayload: function () {
                var sUserID = this.getOwnerComponent().getModel("EmpInfoModel").getData().userId;
                return {
                    "externalCode": sUserID,
                    "effectiveStartDate": this.getView().byId("idEditFromDatePicker").getDateValue(),
                    "cust_bankName": this.getView().byId("idEditBankNameINP").getValue(),
                    "cust_iban": this.getView().byId("idEditIBANINP").getValue()
                };
            },
        
       
            fnDeleteLeaveRequest: function () {
                this.getView().getModel().remove("/SF_Leave('" + this.object.externalCode + "')", {
                    urlParameters: {
                        ticketId: this.sChildID
                    },
                    success: function (oData) {
                        if (oData !== "" || oData !== undefined) {
                            this.getView().setBusy(false);
                            sap.m.MessageBox.success("Record Deleted successfully.");
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
                    }.bind(this),

                });
            },
            fnDeleteBankAccount: function () {

                var oComponentModel = this.getComponentModel(),
                    sPath = oComponentModel.createKey("/SF_BankDetails", {
                        effectiveStartDate: this.object.effectiveStartDate,
                        externalCode: this.object.externalCode
                    });
                this.getView().getModel().remove(`${sPath}`, {
                    urlParameters: {
                        ticketId: this.sChildID
                    },
                    success: function (oData) {
                        this.getView().setBusy(false);
                        if (oData !== "" || oData !== undefined) {
                            sap.m.MessageBox.success("Record Deleted successfully.");
                            this.getRouter().navTo("detail", {
                                parentMaterial: this.sParentID,
                                layout: "TwoColumnsMidExpanded"

                            });
                        } else {
                            sap.m.MessageBox.error("Record Not able to delete.");
                        }
                    }.bind(this),
                    error: function (oError) {
                        this.getView().setBusy(false);
                    }.bind(this),

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
                    urlParameters: {
                        ticketId: this.sChildID
                    },
                    success: function (oData) {
                        if (oData !== "" || oData !== undefined) {
                            this.getView().setBusy(false);
                            sap.m.MessageBox.success("Record Deleted successfully.");
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