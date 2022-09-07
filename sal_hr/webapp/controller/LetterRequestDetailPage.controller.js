sap.ui.define([
    "./BaseController",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "com/sal/salhr/model/formatter"

],

    function (BaseController, Controller, JSONModel, formatter) {
        "use strict";
        return BaseController.extend("com.sal.salhr.controller.LetterRequestDetailPage", {
            formatter: formatter,
            onInit: function () {
                var oLocalViewModel = new JSONModel({
                    EditMode: false,
                    PageTitle: null,
                    Modify: true
                });

                this.getView().setModel(oLocalViewModel, "LocalViewModel");

                this.oRouter = this.getRouter();
                this.oRouter.getRoute("LetterRequestDetail").attachPatternMatched(this._onObjectMatched, this);

            },

            _onObjectMatched: function (oEvent) {

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
                this.getView().setBusy(true);
                var oHeaderModel = new JSONModel(data.results[0]);
                this.getView().setModel(oHeaderModel, "headerModel");

                var oComponentModel = this.getComponentModel(),
                    sKey = null;
                var bIsUserManager = this.getOwnerComponent().getModel("EmpInfoModel").getProperty("/IsUserManager").toString();

                sKey = `Tickets`;

                

                this.getView().getModel().read(`/Tickets(guid'${this.object.ID}')/letterRequests`, {
                    urlParameters: {
                        "IsUserManager": bIsUserManager
                    
                    },
                    success: function (oData) {
                       
                         this.fnSetDisplayLetterRequestModel(oData);
                    }.bind(this),
                    error: function () {
                        this.getView().setBusy(false);
                        this.getView().getModel("DisplayLetterModel").setProperty("/", null);
                    }.bind(this)
                });





            },

            fnSetDisplayLetterRequestModel: function (oData) {
                this.getView().setBusy(true);


                var aDetails = oData,
                    oDisplayLetterObj = {
                        
                        "cust_LetterDetails": aDetails
                    },
                    oDisplayLetterModel = new JSONModel(oDisplayLetterObj);


                this.getView().setModel(oDisplayLetterModel, "DisplayLetterModel");

                this.getView().setBusy(false);
            },

            onEditPress: function () {
                this.getView().getModel("LocalViewModel").setProperty("/EditMode", true);
            },

            onCancelPress: function () {
                this.getView().getModel("LocalViewModel").setProperty("/EditMode", false);
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
                this.oRouter.navTo("LetterRequestDetail", {
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
                var sUserID = this.getOwnerComponent().getModel("EmpInfoModel").getData().userId;

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
                    "userId": sUserID,
                    "recurrenceGroup": null,
                    "fractionQuantity": "1",
                    "endTime": null,
                    "isAttachmentNew": isAttachmentNew,
                    "attachmentId": sattachmentFileID,
                    "attachmentFileContent": sattachmentFileContent,
                    "attachmentFileName": sattachmentFileName,
                    "attachmentUserId": sUserID

                }

            },


            onDownLoadPress: function () {

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
                    var decodedContent = atob(fContent);
                    sap.ui.core.util.File.save(decodedContent, fName, fileext, mimeType);
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