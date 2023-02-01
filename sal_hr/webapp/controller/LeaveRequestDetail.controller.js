sap.ui.define([
    "./BaseController",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "com/sal/salhr/model/formatter"

],

    function (BaseController, Controller, JSONModel, formatter) {
        "use strict";
        return BaseController.extend("com.sal.salhr.controller.LeaveRequestDetail", {
            formatter: formatter,
            onInit: function () {
                var oLocalViewModel = new JSONModel({
                    EditMode: false,
                    LeaveModule: false,
                    BusineesTripModule: false,
                    HealthModule: false,
                    PageTitle: null,
                    IDCardModule: false,
                    meetingType: false
                });

                this.getView().setModel(oLocalViewModel, "LocalViewModel");

                this.oRouter = this.getRouter();
                this.oRouter.getRoute("LeaveRequestDetail").attachPatternMatched(this._onObjectMatched, this);
                // debugger;

            },


            _onObjectMatched: function (oEvent) {
               
                this.sParentID = oEvent.getParameter("arguments").parentMaterial;
                this.sChildID = oEvent.getParameter("arguments").childModule;
                var sLayout = oEvent.getParameter("arguments").layout;
                this.getView().getModel("layoutModel").setProperty("/layout", sLayout);

                if (sLayout === "ThreeColumnsMidExpanded") {
                    this.getView().getModel("LocalViewModel").setProperty("/EditMode", false);
                    this.byId("idFullScreenBTN").setIcon("sap-icon://full-screen");
                    this.getView().setBusy(true);
                    this._getTicketData(this.sChildID);
                }
                if (sLayout === "EndColumnFullScreen" && this.byId("idFullScreenBTN").getIcon() == "sap-icon://full-screen") {
                    this.getView().getModel("LocalViewModel").setProperty("/EditMode", false);
                    this.byId("idFullScreenBTN").setIcon("sap-icon://exit-full-screen");
                    this.getView().setBusy(true);
                    this._getTicketData(this.sChildID);
                }
                
                this.getView().byId("idEditUploadSet").destroyItems();
                var sUploadAttachment = this.getView().byId("UploadSet").getVisible();
                if (!sUploadAttachment) {
                    this.attachReq = false;
                    this.isAttachment === false;
                } else {
                    this.attachReq = true;
                    this.isAttachment === true;
                   
                }
            },

            _bindView: function (data) {
                var object = data.results[0];
                this.object = data.results[0];

                var oHeaderModel = new JSONModel(data.results[0]);
                this.getView().setModel(oHeaderModel, "headerModel");

                var oUploadSet = this.byId("idEditUploadSet");

                var oComponentModel = this.getComponentModel(),
                    sKey = null;
                var that = this;
                var sTicketCode = this.object.ticketCode;
                var oAttachModel = new JSONModel();
                that.getView().setModel(oAttachModel, "attachmentModel");

                sKey = oComponentModel.createKey("/SF_Leave", {
                    externalCode: object.externalCode
                });
                var sTicketCode = this.object.ticketCode;
                var bIsUserManager = this.getOwnerComponent().getModel("EmpInfoModel").getProperty("/IsUserManager").toString();

                this.getView().setBusy(true);
                this.getView().getModel().read("/SF_Leave('" + object.externalCode + "')", {
                    urlParameters: {
                        "$expand": "cust_attachmentNav, timeTypeNav,userIdNav",
                        "recordStatus": object.status,
                        "IsUserManager": bIsUserManager
                    },
                    success: function (oData) {
                        var oAttachModel = new JSONModel(oData.cust_attachmentNav),
                            oTimeTypeModel = new JSONModel(oData.timeTypeNav),
                            oLeaveModel = new JSONModel(oData);
                        that.getView().setModel(oAttachModel, "attachmentModel");
                        that.getView().setModel(oTimeTypeModel, "timeTypeModel");
                        that.getView().setModel(oLeaveModel, "leaveModel");

                        switch (oData.timeType) {
                            // Leave Module
                            case "S110":
                                that.getView().getModel("LocalViewModel").setProperty('/uploadAttachment', false);

                                that.getView().getModel("LocalViewModel").setProperty('/meetingType', false);

                                that.getView().byId("idEditUploadSet").destroyItems();
                                
                                oUploadSet.getDefaultFileUploader().setEnabled(true);

                                break;
                            case "500":
                                that.getView().getModel("LocalViewModel").setProperty('/uploadAttachment', false);

                                that.getView().getModel("LocalViewModel").setProperty('/meetingType', false);

                                that.getView().byId("idEditUploadSet").destroyItems();

                                oUploadSet.getDefaultFileUploader().setEnabled(true);

                                break;
                            case "460":
                                that.getView().getModel("LocalViewModel").setProperty('/uploadAttachment', false);

                                that.getView().getModel("LocalViewModel").setProperty('/meetingType', true);

                                that.getView().byId("idEditUploadSet").destroyItems();

                                oUploadSet.getDefaultFileUploader().setEnabled(true);
                                break;

                            case "450":
                                that.getView().getModel("LocalViewModel").setProperty('/uploadAttachment', true);

                                that.getView().getModel("LocalViewModel").setProperty('/meetingType', true);
                                
                                break;
                            case "480":
                                that.getView().getModel("LocalViewModel").setProperty('/uploadAttachment', true);

                                that.getView().getModel("LocalViewModel").setProperty('/meetingType', true);

                                break;
                            case "440":
                                that.getView().getModel("LocalViewModel").setProperty('/uploadAttachment', true);

                                that.getView().getModel("LocalViewModel").setProperty('/meetingType', true);

                                break;
                            default:
                                that.getView().getModel("LocalViewModel").setProperty('/uploadAttachment', true);

                                that.getView().getModel("LocalViewModel").setProperty('/meetingType', false);
                        }

                        that.onCallHistoryData(object.ticketCode);

                        that.getView().setBusy(false);
                        
                    },
                    error: function (oError) {
                        if (JSON.parse(oError.responseText).error.message.value.indexOf("{") === 0)
                            sap.m.MessageBox.error(JSON.parse(JSON.parse(oError.responseText).error.message.value).error.message.value.split("]")[1]);
                        else {
                            sap.m.MessageBox.error(JSON.parse(oError.responseText).error.message.value);
                        }
                        that.getView().setBusy(false);
                    }
                });

                this.getView().getModel("LocalViewModel").setProperty("/LeaveModule", true);
               
                this.getView().getModel("LocalViewModel").setProperty("/PageTitle", "Leave Request");

                this.getView().getModel("LocalViewModel").refresh();
                this.getView().setBusy(false);

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
                    success: function (oData) {
                        var oHistoryData = new JSONModel(oData.results);
                        this.getView().setModel(oHistoryData, "HistoryData");
                    }.bind(this),
                    error: function (oError) {
                        if (JSON.parse(oError.responseText).error.message.value.indexOf("{") === 0)
                            sap.m.MessageBox.error(JSON.parse(JSON.parse(oError.responseText).error.message.value).error.message.value.split("]")[1]);
                        else {
                            sap.m.MessageBox.error(JSON.parse(oError.responseText).error.message.value);
                        }
                    }
                });
            },

            onEditPress: function () {
                var oItem = this.byId("idEditUploadSet").getItems()[0];
                var oModel = this.getView().getModel("attachmentModel").getData();
                // debugger;
                if(!oItem) {
                    this.byId("idEditUploadSet").addItem(new sap.m.upload.UploadSetItem(
                        {
                            fileName:oModel.fileName,
                            mediaType:oModel.mimeType
                        }));
                }
                this.getView().getModel("LocalViewModel").setProperty("/EditMode", true);
                var sItem = this.getView().byId("idEditUploadSet").getItems()[0];
                  

                // this.getView().getModel("attachmentModel").refresh();
            },

            onCancelPress: function () {
                // debugger;
                this.getView().getModel("LocalViewModel").setProperty("/EditMode", false);
                this.getView().byId("idEditUploadSet").destroyItems();
                this.getView().getModel().refresh(true);
            },

            onWithdrawPress: function () {
                this.getView().setBusy(true);
                this.fnDeleteLeaveRequest();
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
                this.oRouter.navTo("LeaveRequestDetail", {
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
                var sEntityPath = "/SF_Leave('" + this.object.externalCode + "')",
                    oPayloadObj = this.fnGetLeaveRequestPayload();




                if (this.bValid != false) {
                    this.getView().setBusy(true);
                    this.getView().getModel().update(sEntityPath, oPayloadObj, {
                        urlParameters: {
                            ticketId: this.sChildID
                        },
                        success: function (oResponse) {
                            this.getView().setBusy(false);
                            sap.m.MessageBox.success("Request Submitted successfully.");
                            this.getView().getModel().refresh();
                          
                            this.oRouter.navTo("detail", {
                                parentMaterial: this.sParentID,
                                layout: "TwoColumnsMidExpanded"
                            });
                        }.bind(this),
                        error: function (oError) {
                            this.getView().setBusy(false);
                            if (JSON.parse(oError.responseText).error.message.value.indexOf("{") === 0)
                                sap.m.MessageBox.error(JSON.parse(JSON.parse(oError.responseText).error.message.value).error.message.value.split("]")[1]);
                            else {
                                sap.m.MessageBox.error(JSON.parse(oError.responseText).error.message.value);
                            }
                            this.getView().getModel().refresh();
                        }.bind(this)
                    });
                }
            },
            onTimeTyeChange: function (oEvent) {
                var sType = oEvent.getSource().getSelectedKey();
                var that = this;

                switch (sType) {
                    case "S110":
                        that.getView().getModel("LocalViewModel").setProperty('/uploadAttachment', false);
                        this.attachReq = false;
                        that.getView().getModel("LocalViewModel").setProperty('/meetingType', false);
                        that.getView().getModel("LocalViewModel").setProperty('/availBal', true);
                        that.getView().getModel("LocalViewModel").setProperty('/halfDayType', false);
                        break;

                    case "500":
                        that.getView().getModel("LocalViewModel").setProperty('/uploadAttachment', false);
                        this.attachReq = false;
                        that.getView().getModel("LocalViewModel").setProperty('/meetingType', false);
                        that.getView().getModel("LocalViewModel").setProperty('/availBal', false);
                        that.getView().getModel("LocalViewModel").setProperty('/halfDayType', false);
                        break;

                    case "460":
                        that.getView().getModel("LocalViewModel").setProperty('/uploadAttachment', false);
                        this.attachReq = false;
                        that.getView().getModel("LocalViewModel").setProperty('/meetingType', true);
                        that.getView().getModel("LocalViewModel").setProperty('/availBal', false);
                        that.getView().getModel("LocalViewModel").setProperty('/halfDayType', false);
                        break;
                    case "450":
                        that.getView().getModel("LocalViewModel").setProperty('/uploadAttachment', true);
                        this.attachReq = true;
                        that.getView().getModel("LocalViewModel").setProperty('/meetingType', true);
                        that.getView().getModel("LocalViewModel").setProperty('/availBal', false);
                        that.getView().getModel("LocalViewModel").setProperty('/halfDayType', false);

                        break;
                    case "480":
                        that.getView().getModel("LocalViewModel").setProperty('/uploadAttachment', true);
                        this.attachReq = true;
                        that.getView().getModel("LocalViewModel").setProperty('/meetingType', true);
                        that.getView().getModel("LocalViewModel").setProperty('/availBal', false);
                        that.getView().getModel("LocalViewModel").setProperty('/halfDayType', false);

                        break;
                    case "440":
                        that.getView().getModel("LocalViewModel").setProperty('/uploadAttachment', true);
                        this.attachReq = true;
                        that.getView().getModel("LocalViewModel").setProperty('/meetingType', true);
                        that.getView().getModel("LocalViewModel").setProperty('/availBal', false);
                        that.getView().getModel("LocalViewModel").setProperty('/halfDayType', false);

                        break;

                    case "HD1":
                        that.getView().getModel("LocalViewModel").setProperty('/uploadAttachment', false);
                        this.attachReq = false;
                        that.getView().getModel("LocalViewModel").setProperty('/meetingType', false);
                        that.getView().getModel("LocalViewModel").setProperty('/availBal', true);
                        that.getView().getModel("LocalViewModel").setProperty('/halfDayType', true);
                        break;

                    default:
                        this.attachReq = true;
                        that.getView().getModel("LocalViewModel").setProperty('/uploadAttachment', true);
                        that.getView().getModel("LocalViewModel").setProperty('/meetingType', false);
                        that.getView().getModel("LocalViewModel").setProperty('/availBal', false);
                        that.getView().getModel("LocalViewModel").setProperty('/halfDayType', false);
                }
            },

            fnGetLeaveRequestPayload: function () {
                if (this.attachReq === true && this.isAttachment === false) {
                    sap.m.MessageBox.error("Please upload the attachments.");
                    this.bValid = false;
                } else {
                    this.bValid = true;

                    var sUserID = this.getOwnerComponent().getModel("EmpInfoModel").getData().userId;
                    var sType = this.getView().byId("idEditTimeType").getSelectedKey();
                    var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" });
                    var sQtyHrs;


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
                        isAttachmentNew = false;
                    }
                    
                   if(this.isAttachmentRenamed === true){
                    isAttachmentNew = true;
                    sattachmentFileID = null;
                   }


                    var sEndDate = this.getView().byId("idEditLeaveEndDatePicker").getDateValue();
                    var oEndDate = dateFormat.format(new Date(sEndDate));
                    sEndDate = oEndDate + "T00:00:00";


                    var sStartDate = this.getView().byId("idStartLDatePicker").getDateValue();
                    var oStartDate = dateFormat.format(new Date(sStartDate));
                    sStartDate = oStartDate + "T00:00:00";




                   

                    if(sType === "460" || sType === "450" || sType === "480" || sType === "440"){
                        sQtyHrs = this.getView().byId("idEditRequestHrs").getDOMValue();
                        if(sQtyHrs){
                            sQtyHrs = sQtyHrs.split(":")[0] + "." + sQtyHrs.split(":")[1];
                        }else {
                            sap.m.MessageBox.error("Please enter requesting hours.");
                            this.bValid = false;
                            return;
                        }
                            
                    }else if(sType === "HD1"){
                        sQtyHrs = "0.5";
                    }else {
                        sQtyHrs = "0.0";
                    }


                    return {
                        "endDate": sEndDate,
                        "loaActualReturnDate": null,
                        "timeType": sType,
                        "loaExpectedReturnDate": null,
                        "loaStartJobInfoId": null,
                        "startDate": sStartDate,
                        "cust_KronosPayCodeEditID": null,
                        "startTime": null,
                        "loaEndJobInfoId": null,
                        "approvalStatus": null,
                        "undeterminedEndDate": false,
                        "userId": sUserID,
                        "recurrenceGroup": null,
                        "fractionQuantity": sQtyHrs,
                        "endTime": null,
                        "isAttachmentNew": isAttachmentNew,
                        "attachmentId": sattachmentFileID,
                        "attachmentFileContent": sattachmentFileContent,
                        "attachmentFileName": sattachmentFileName,
                        "attachmentUserId": sUserID
                    }
                }
            },

            handleTimeChange: function (oEvent) {
                var oTimePicker = this.byId("idEditRequestHrs"),
                    oTP = oEvent.getSource(),
                    sValue = oEvent.getParameter("value");


                if (sValue > "08:00") {
                    oTimePicker.setValueState("Error");
                    // oTimePicker.setValueText("Please enter a booking quantity that is greater than 0 and smaller than or equal to 8:00");
                    this.getView().byId("idSaveBTN").setEnabled(false);
                    sap.m.MessageBox.error("Please enter a booking quantity that is greater than 0 and smaller than or equal to 8:00");
                } else {
                    oTimePicker.setValueState();

                    this.getView().byId("idSaveBTN").setEnabled(true);
                }
            },

            onDownLoadPress: function () {
                var fContent = this.getView().getModel("attachmentModel").getData().fileContent;
                var fileext = this.getView().getModel("attachmentModel").getData().fileExtension;
                var mimeType = this.getView().getModel("attachmentModel").getData().mimeType;
                var fName = this.getView().getModel("attachmentModel").getData().fileName;
                fName = fName.split(".")[0];
                // debugger;
                this.fnDownloadAttachment(fContent,mimeType,fName,fileext);

                
            },

            onFileDeleted: function (oEvent) {
                // debugger;
                var oUploadSet = this.byId("idEditUploadSet");
                oUploadSet.getDefaultFileUploader().setEnabled(true);
                this.isAttachment = false;
            },

            onFileAdded: function (oEvent) {
                // debugger;
                var that = this;
                var file = oEvent.getParameter("item");
                var Filename = file.getFileName(),
                    Filetype = file.getMediaType(),
                    Filesize = file.getFileObject().size,
                    Filedata = oEvent.getParameter("item").getFileObject();

                //code for base64/binary array 
                this._getImageData((Filedata), function (Filecontent) {
                    that._addData(Filecontent, Filename, Filetype, Filesize);
                });
                var oUploadSet = this.byId("idEditUploadSet");
                oUploadSet.getDefaultFileUploader().setEnabled(false);

            

                this.isAttachment = true;
            },

            _getImageData: function (url, callback, fileName) {
                var reader = new FileReader();

                reader.onloadend = function (evt) {
                    if (evt.target.readyState === FileReader.DONE) {
                        var binaryString = evt.target.result,
                            base64file = btoa(binaryString);
                        callback(base64file);
                    }
                };
                reader.readAsBinaryString(url);
            },

            _addData: function (Filecontent, Filename, Filetype, Filesize) {
                this.getViewModel("LocalViewModel").setProperty("/busy", true);
                this.fileContent = Filecontent;
                this.fileName = Filename;
                this.isAttachmentNew = true;
            },
            onFileRenamed: function (oEvent) {
                // debugger;
                this.isAttachmentRenamed = true;
                this.oFileAdded(oEvent);
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
            },

            onLeaveStartDatChange: function (oEvent) {

                var sStartDate = oEvent.getSource().getValue();
                this.getView().byId("idEditLeaveEndDatePicker").setValue(sStartDate);

            },
            onLeaveEndDateChange: function (oEvent) {
               
                var sStartDate = this.getView().byId("idStartLDatePicker").getDateValue();
                var sEndDate = oEvent.getSource().getDateValue();

                // if (sEndDate <= sStartDate) {
                if (new Date(sEndDate).getTime() < new Date(sStartDate).getTime()) {
                    oEvent.getSource().setValueState("Error");
                    oEvent.getSource().setValueStateText("End Date should be later than Start Date");
                    
                } else {
                    oEvent.getSource().setValueState();
                    oEvent.getSource().setValueStateText("");
                    this.getView().byId("idStartLDatePicker").setValueState();
                    this.getView().byId("idStartLDatePicker").setValueStateText("");
                    
                }
            },
        });
    });