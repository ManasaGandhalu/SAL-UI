sap.ui.define([
    "./BaseController",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"

],

    function (BaseController, Controller, JSONModel) {
        "use strict";
        return BaseController.extend("com.sal.salhr.controller.DetailDetailPage", {
            onInit: function () {
                var oLocalViewModel = new JSONModel({
                    EditMode: false,
                    LeaveModule: false,
                    BusineesTripModule: false,
                    HealthModule: false,
                    PageTitle: null,
                    Modify: true,
                    IDCardModule: false
                });

                this.getView().setModel(oLocalViewModel, "LocalViewModel");

                this.oRouter = this.getRouter();
                this.oRouter.getRoute("detailDetail").attachPatternMatched(this._onObjectMatched, this);
                // var oUploadSet = this.byId("UploadSet"); 
                // oUploadSet.getDefaultFileUploader().setButtonOnly(false);
                // oUploadSet.getDefaultFileUploader().setTooltip("");

            },

            _onObjectMatched: function (oEvent) {
                // this.sParentID = JSON.parse(oEvent.getParameter("arguments").parentMaterial).ParentID;
                // this.sChildID = JSON.parse(oEvent.getParameter("arguments").parentMaterial).ChildID;
                this.sParentID = oEvent.getParameter("arguments").parentMaterial;
                this.sChildID = oEvent.getParameter("arguments").childModule;
                var sLayout = oEvent.getParameter("arguments").layout;
                this.getView().getModel("layoutModel").setProperty("/layout", sLayout);
                this.byId("idFullScreenBTN").setIcon("sap-icon://full-screen");
                // this._bindView();
                this._getTicketData(this.sChildID);
            },

            _bindView: function (data) {
                var object = data.results[0];
                this.object = data.results[0];
                var oHeaderModel = new JSONModel(data.results[0]);
                this.getView().setModel(oHeaderModel, "headerModel");


                if (object.status === "APPROVED") {
                    this.getView().getModel("LocalViewModel").setProperty("/Modify", false);
                } else {
                    this.getView().getModel("LocalViewModel").setProperty("/Modify", true);
                }
                var oComponentModel = this.getComponentModel(),
                    sKey = null;
                var that = this;
                var sTicketCode = this.object.ticketCode;
                var oAttachModel = new JSONModel();
                that.getView().setModel(oAttachModel, "attachmentModel");
                switch (this.sParentID) {
                    // Leave Module
                    case "1":
                        sKey = oComponentModel.createKey("/SF_Leave", {
                            externalCode: object.externalCode
                        });
                        var sTicketCode = this.object.ticketCode;
                        this.getView().getModel().read("/SF_Leave('" + object.externalCode + "')", {
                            urlParameters: {
                                "$expand": "cust_attachmentNav, timeTypeNav"
                            },
                            success: function (oData) {
                                oAttachModel = new JSONModel(oData.cust_attachmentNav);
                                var oTimeTypeModel = new JSONModel(oData.timeTypeNav);
                                that.getView().setModel(oAttachModel, "attachmentModel");
                                that.getView().setModel(oTimeTypeModel, "timeTypeModel");
                                // that.getView().getModel("attachmentModel").setProperty("/ticketCode", sTicketCode);
                                var sType = that.getView().getModel("timeTypeModel").getProperty("/externalCode");
                                if (sType === "S110" || sType === "500" || sType === "460") {
                                    that.getView().getModel("LocalViewModel").setProperty('/uploadAttachment', false);
                                } else {
                                    that.getView().getModel("LocalViewModel").setProperty('/uploadAttachment', true);
                                }
                            },
                            error: function (oError) {

                            }

                        });

                        this.getView().getModel("LocalViewModel").setProperty("/LeaveModule", true);
                        this.getView().getModel("LocalViewModel").setProperty("/BusineesTripModule", false);
                        this.getView().getModel("LocalViewModel").setProperty("/HealthModule", false);
                        this.getView().getModel("LocalViewModel").setProperty("/BankRequestModel", false);
                        this.getView().getModel("LocalViewModel").setProperty("/IDCardModule", false);
                        this.getView().getModel("LocalViewModel").setProperty("/PageTitle", "Leave Request");

                        break;





                    // Business Trip Module
                    case "2":
                        // sKey = oComponentModel.createKey("/BusinessTrip", {
                        //     externalCode: this.sChildID
                        // //     externalCode: "038bf80e30b745b0924f030e4e9b0556"
                        // });
                        this.getView().getModel("LocalViewModel").setProperty("/BusineesTripModule", true);
                        this.getView().getModel("LocalViewModel").setProperty("/LeaveModule", false);
                        this.getView().getModel("LocalViewModel").setProperty("/HealthModule", false);
                        this.getView().getModel("LocalViewModel").setProperty("/BankRequestModel", false);
                        this.getView().getModel("LocalViewModel").setProperty("/IDCardModule", false);
                        this.getView().getModel("LocalViewModel").setProperty("/PageTitle", "Business Trip Request");
                        break;

                    // Health Module
                    case "3":
                        // sKey = oComponentModel.createKey("/BusinessTrip", {
                        //     externalCode: this.sChildID
                        // //     externalCode: "038bf80e30b745b0924f030e4e9b0556"
                        // });
                        this.getView().getModel("LocalViewModel").setProperty("/HealthModule", true);
                        this.getView().getModel("LocalViewModel").setProperty("/BusineesTripModule", false);
                        this.getView().getModel("LocalViewModel").setProperty("/LeaveModule", false);
                        this.getView().getModel("LocalViewModel").setProperty("/BankRequestModel", false);
                        this.getView().getModel("LocalViewModel").setProperty("/IDCardModule", false);
                        this.getView().getModel("LocalViewModel").setProperty("/PageTitle", "Health Insurance");
                        break;
                    // ID Card Replacement
                    case "7":
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
                                dataRequested: function () {
                                    this.getView().setBusy(true);
                                }.bind(this),
                                dataReceived: function () {
                                    this.getView().setBusy(false);
                                }.bind(this)
                            }
                        });
                        that.getView().getModel("attachmentModel").setProperty("/ticketCode", sTicketCode);
                        this.getView().getModel("LocalViewModel").setProperty("/IDCardModule", true);
                        this.getView().getModel("LocalViewModel").setProperty("/HealthModule", false);
                        this.getView().getModel("LocalViewModel").setProperty("/BusineesTripModule", false);
                        this.getView().getModel("LocalViewModel").setProperty("/BankRequestModel", false);
                        this.getView().getModel("LocalViewModel").setProperty("/LeaveModule", false);
                        this.getView().getModel("LocalViewModel").setProperty("/PageTitle", "ID Replacement Changes");
                        break;

                    //  Bank Request Module 
                    case "13":
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
                            }.bind(this)
                        }
                    });
                }
            },

            onEditPress: function () {
                this.getView().getModel("LocalViewModel").setProperty("/EditMode", true);

            },

            onCancelPress: function () {
                this.getView().getModel("LocalViewModel").setProperty("/EditMode", false);
            },

            onChangeInpIBAN: function (oEve) {
                var sValue = oEve.getSource().getValue();

                if (!sValue.match(/^[a-z0-9\s]*$/)) {
              

                    sap.ui.core.Fragment.byId("idBankChangerequestFragment", "idIBANINP").setValueState("Error");
                    sap.ui.core.Fragment.byId("idBankChangerequestFragment", "idIBANINP").setValueStateText("Please enter only alpha-numeric characters");
                }

                else{
                    sap.ui.core.Fragment.byId("idBankChangerequestFragment", "idIBANINP").setValueState("None");

                }

            },

            
            onChangeInpBankName: function (oEve) {
                var sValue = oEve.getSource().getValue();

                if (!sValue.match(/^[a-z0-9\s]*$/)) {
              

                    sap.ui.core.Fragment.byId("idBankChangerequestFragment", "idBankNameINP").setValueState("Error");
                    sap.ui.core.Fragment.byId("idBankChangerequestFragment", "idBankNameINP").setValueStateText("Please enter only alpha-numeric characters");
                }

                else{
                    sap.ui.core.Fragment.byId("idBankChangerequestFragment", "idBankNameINP").setValueState("None");

                }

            },

            onWithdrawPress: function () {
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

                // this.oRouter.navTo("detail", {
                //     parentMaterial: this.sParentID,
                //     layout: sLayout
                // });
                this.oRouter.navTo("detailDetail", {
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
                        // sEntityPath="/Business_Trip";
                        // oPayloadObj = this.fnGetBusinessTripPayload();
                        break;

                    // Health Module
                    case "3":
                        // sEntityPath="/Health_Insurance";
                        // oPayloadObj = this.fnGetHealthInsurancePayload();
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
                // return {
                //     "endDate": this.getView().byId("idEditLeaveEndDatePicker").getValue(),
                //     "timeType": this.getView().byId("idEditTimeTypeINP").getValue(),
                //     "startDate": this.getView().byId("idStartLDatePicker").getValue(),
                //     "undeterminedEndDate": false,
                //     "userId": "12002024",
                //     "fractionQuantity": "1"
                // };
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
                return {
                    "externalCode": "12002425",
                    "effectiveStartDate": this.getView().byId("idEditFromDatePicker").getDateValue(),
                    "cust_bankName": this.getView().byId("idEditBankNameINP").getValue(),
                    "cust_iban": this.getView().byId("idEditIBANINP").getValue()
                };
            },
            onDownLoadPress: function () {
                // var fContent = this.getView().getModel("attachmentModel").getData().fileContent;
                // var fName = this.getView().getModel("attachmentModel").getData().fileName;
                // var sfileExtension = this.getView().getModel("attachmentModel").getData().fileExtension;
                // fName = fName.split(".")[0];
                // fContent = atob(fContent);
                // sap.ui.core.util.File.save(fContent, fName, sfileExtension);
                var fContent = this.getView().getModel("attachmentModel").getData().fileContent;
                var fileext = this.getView().getModel("attachmentModel").getData().fileExtension;
                var mimeType = this.getView().getModel("attachmentModel").getData().mimeType;
                var fName = this.getView().getModel("attachmentModel").getData().fileName;
                fName = fName.split(".")[0];

                if (fileext === "pdf" || fileext === "png") {
                    var decodedPdfContent = atob(fContent);
                    var byteArray = new Uint8Array(decodedPdfContent.length)
                    for (var i = 0; i < decodedPdfContent.length; i++) {
                        byteArray[i] = decodedPdfContent.charCodeAt(i);
                    }
                    var blob = new Blob([byteArray.buffer], { type: mimeType });
                    var _pdfurl = URL.createObjectURL(blob);
                    var a = document.createElement('a');
                    a.href = _pdfurl;
                    a.download = fName;
                    a.dispatchEvent(new MouseEvent('click'));
                }
                else {
                    sap.ui.core.util.File.save(fContent, fName, fileext, mimeType);
                }
            },
            onFileDeleted: function (oEvent) {
                var oUploadSet = this.byId("idEditUploadSet");
                oUploadSet.getDefaultFileUploader().setEnabled(true);
            },
            onFileAdded: function (oEvent) {
                var that = this;

                //  var file = oEvent.getParameters().files[0];
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

                this.getView().getModel("attachmentModel").setProperty("/fileName", Filename);
                this.getView().getModel("attachmentModel").setProperty("/mimeType", Filetype);
                this.getView().getModel("attachmentModel").refresh();



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
                this.getViewModel("LocalViewModel").setProperty(
                    "/busy",
                    true
                );
                this.fileContent = Filecontent;
                this.fileName = Filename;
                this.isAttachmentNew = true;

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
                        if (oData !== "" || oData !== undefined) {
                            sap.m.MessageBox.success("Record Deleted successfully.");
                            this.oRouter.navTo("detail", {
                                parentMaterial: this.sParentID,
                                layout: "TwoColumnsMidExpanded"

                            });
                        } else {
                            sap.m.MessageBox.error("Record Not able to delete.");
                        }
                    },
                    error: function (oError) {
                    }

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
            }



        });
    });