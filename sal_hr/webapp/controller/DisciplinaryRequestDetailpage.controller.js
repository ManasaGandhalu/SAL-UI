sap.ui.define([
    "./BaseController",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
],
    function (BaseController, Controller, JSONModel) {
        "use strict";
        return BaseController.extend("com.sal.salhr.controller.DisciplinaryRequestDetailpage", {
            onInit: function () {
                var oLocalViewModel = new JSONModel({
                    EditMode: false,
                    LeaveModule: false,
                    BusineesTripModule: false,
                    HealthModule: false,
                    PageTitle: null
                });
                this.getView().setModel(oLocalViewModel, "LocalViewModel");
                this.oRouter = this.getRouter();
                this.oRouter.getRoute("DisciplinaryRequestDetail").attachPatternMatched(this._onObjectMatched, this);
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
                var object = data.results[0];
                this.object = data.results[0];
                var oComponentModel = this.getComponentModel(),
                    sKey = null;
                    this.effectiveStartDate = object.effectiveStartDate;
                    this.externalCode = object.externalCode;
                sKey = oComponentModel.createKey("/SF_Disciplinary_Action", {
                    effectiveStartDate:object.effectiveStartDate,
                    externalCode: object.externalCode
                });
                this.getView().getModel().read(sKey, {
                    urlParameters: {
                        "$expand": "cust_attachmentNav"
                    },
                    success: function (oData) {
                        var oAttachModel = new JSONModel(oData.cust_attachmentNav);
                        this.getView().setModel(oAttachModel,"attachmentModel");
                    }.bind(this),
                    error: function (oError) {
                    }.bind(this),
                });
                this.getView().getModel("LocalViewModel").setProperty("/PageTitle", "Disciplinary Request");
                this.getView().getModel("LocalViewModel").refresh();
                this.getView().bindElement({
                    path: sKey,
                    parameters: {
                        expand: "cust_IncidentStatusNav,cust_ReasonNav,cust_SeverityNav,cust_warningTypeNav",
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
                        }.bind(this)
                    }
                });
            },
            onEditPress: function () {
                this.getView().getModel("LocalViewModel").setProperty("/EditMode", true);
            },
            onCancelPress: function () {
                this.getView().getModel("LocalViewModel").setProperty("/EditMode", false);
            },
            onWithdrawPress: function () {
                // if (sKey === "" || sKey === undefined) {
                //     MessageBox.error("Please enter sKey ID to delete the record.");
                //     return;
                // }
               var oComponentModel = this.getComponentModel(),
               sKey = oComponentModel.createKey("/SF_Disciplinary_Action", {
                    effectiveStartDate:this.effectiveStartDate,
                    externalCode: this.externalCode
                });
                this.getView().getModel().remove(sKey, {
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
                this.oRouter.navTo("DisciplinaryRequestDetail", {
                    parentMaterial: this.sParentID,
                    childModule:this.sChildID,
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
                // if(this.isAttachment !== true)
                // {
                //     sap.m.MessageBox.error("Please upload attachments.");
                //     bValid = false;
                // }
                return bValid;
            },
            onAttachmentChange:function(oEvent){
                var that= this;
              //   var file = sap.ui.core.Fragment.byId("idLeaveFragment", "UploadCollection").getFocusDomRef().files[0];
                   var file = oEvent.getParameters().files[0];
                //Input = "458076",
                var Filename = file.name,
                    Filetype = file.type,
                    Filesize = file.size;
                //code for base64/binary array 
                this._getImageData((file), function (Filecontent) {
                    that._addData(Filecontent, Filename, Filetype, Filesize);
                });
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
              this.isAttachment = true;
          },
            onSavePress: function () {
                if (!this._validateMandatoryFields()) {
                    return;
                }
                var oPayloadObj = {},
                sEntityPath = null,
                oComponentModel = this.getComponentModel(),
                    sKey = null,
                sKey = oComponentModel.createKey("/SF_Disciplinary_Action", {
                    effectiveStartDate:this.effectiveStartDate,
                    externalCode: this.externalCode
                });
                    sEntityPath = sKey;
                    oPayloadObj = this.fnGetDisciplinaryRequestPayload();
                    this.getView().setBusy(true);
                this.getView().getModel().update(sEntityPath, oPayloadObj, {
                    success: function (oResponse) {
                        this.getView().setBusy(false);
                        sap.m.MessageBox.success("Request Submitted successfully.");
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
            fnGetDisciplinaryRequestPayload: function () {
                var sattachmentFileName = this.fileName;
                var sattachmentFileContent= this.fileContent;
                var sattachmentFileID= this.getView().getModel("attachmentModel").getData().attachmentId;
                var sWarningType = this.getView().byId("idEditWarningType").getSelectedKey(),
                sSeverity = this.getView().byId("idEditSeverity").getSelectedKey(),
                sIncidentStatus = this.getView().byId("idEditIncidentStatus").getSelectedKey(),
                sIncidentCategory = this.getView().byId("idEditIncidenCategiory").getSelectedKey(),
                sIncidentDetails = this.getView().byId("idIncidentDescription").getValue(),
                sIncidentDate = this.getView().byId("idIncidentStartDate").getValue(),
                sIncidentDate = Date.parse(sIncidentDate);
                return {
                    "cust_DateofIncident": `/Date(${sIncidentDate})/`,
                    "cust_IncidentStatus": sIncidentStatus,
                    "cust_IncidentDetails": sIncidentDetails,
                    "cust_Reason": sIncidentCategory,
                    "cust_Severity": sSeverity,
                    "cust_warningType": sWarningType,
                    "effectiveStartDate": "/Date(1648233000000)/",
                    "externalCode": "12002291",
                    "externalName": null,
                    "attachmentFileContent": sattachmentFileContent,
                    "attachmentFileName": sattachmentFileName,
                    "isAttachmentNew": true,
                    "attachmentUserId": "Extentia",
                    "cust_letterIssued": "Y",
                    "attachmentId": sattachmentFileID 
                }
            },
            onDownLoadPress:function(){
                var fContent = this.getView().getModel("attachmentModel").getData().fileContent;
               var fileext =  this.getView().getModel("attachmentModel").getData().fileExtension;
               var mimeType =  this.getView().getModel("attachmentModel").getData().mimeType;
                var fName = this.getView().getModel("attachmentModel").getData().fileName;
                 fName = fName.split(".")[0];
                                debugger;
                              if(fileext === "pdf" || fileext === "png")
                              {
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
                              else{
                                sap.ui.core.util.File.save(fContent, fName,fileext, mimeType);
                              }
            }
        });
    });