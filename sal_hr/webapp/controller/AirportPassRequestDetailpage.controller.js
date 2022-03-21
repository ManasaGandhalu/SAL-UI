sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "com/sal/salhr/model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/Device"
],

    function (BaseController, JSONModel, formatter, Filter, FilterOperator, Device) {
        "use strict";

        return BaseController.extend("com.sal.salhr.controller.AirportPassRequestDetailpage", {
            formatter: formatter,
            onInit: function () {
                this.oRouter = this.getRouter();
                this.oRouter.getRoute("AirportPassRequestDetail").attachPatternMatched(this._onObjectMatched, this);
                this.mainModel = this.getOwnerComponent().getModel();
                var oLocalViewModel = new JSONModel({
                    EditMode: false,
                    PageTitle: null,
                    Modify: true,
                    currentDate: new Date(),
                    AirPortLocatonId: null,
                    AirPortLocatoDesc: null,
                    TypeOfPassId: null,
                    TypeOfPassDesc: null
                });
                this.getView().setModel(oLocalViewModel, "LocalViewModel");
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
            },

            _bindView: function (data) {
                var object = data.results[0];
                this.object = data.results[0];
                var oHeaderModel = new JSONModel(data.results[0]);
                this.getView().setModel(oHeaderModel, "headerModel");

                // if (object.status === "APPROVED") {
                //     this.getView().getModel("LocalViewModel").setProperty("/Modify", false);
                // } else {
                //     this.getView().getModel("LocalViewModel").setProperty("/Modify", true);
                // }

                var oComponentModel = this.getComponentModel();
                var sKey = oComponentModel.createKey("/SF_AirportPassMain", {
                    effectiveStartDate: object.effectiveStartDate,
                    externalCode: object.externalCode
                });

                this.getView().setBusy(true);

                this.getView().getModel().read(sKey, {
                    urlParameters: {
                        $expand: "cust_toAirportPassItem,cust_toAirportPassItem/cust_typeOfPassNav,cust_toAirportPassItem/cust_airportLocNav,cust_toAirportPassItem/cust_companyIdNav,cust_toAirportPassItem/cust_passportCopyNav,cust_toAirportPassItem/cust_personalIdNav,cust_toAirportPassItem/cust_personalPhotoNav"
                    },
                    success: function (oData) {
                        this._fnSetDisplayEditAirpassModel(oData);
                    }.bind(this),
                    error: function () {
                        this.getView().setBusy(false);
                    }.bind(this)

                });
                this.getView().getModel("LocalViewModel").setProperty("/PageTitle", "Airport Travel Pass Request");
            },

            _fnSetDisplayEditAirpassModel: function (oData) {
                var oDisplayEditAirpassObj = {
                    "externalCode": oData.externalCode,
                    "externalName": oData.externalName,
                    "effectiveStartDate": new Date(oData.effectiveStartDate),
                    "cust_toAirportPassItem": {
                        "cust_mobileNumber": oData.cust_toAirportPassItem.cust_mobileNumber,
                        "cust_acknowledge2": oData.cust_toAirportPassItem.cust_acknowledge2,
                        "cust_acknowledge1": oData.cust_toAirportPassItem.cust_acknowledge1,
                        "cust_airportLoc": oData.cust_toAirportPassItem.cust_airportLoc,
                        "cust_airportPassMain_effectiveStartDate": new Date(oData.cust_toAirportPassItem.cust_airportPassMain_effectiveStartDate),
                        "cust_airportPassMain_externalCode": oData.cust_toAirportPassItem.cust_airportPassMain_externalCode,
                        "cust_domStationName": oData.cust_toAirportPassItem.cust_domStationName,
                        "cust_nationality": oData.cust_toAirportPassItem.cust_nationality,
                        "cust_permitDate": oData.cust_toAirportPassItem.cust_permitDate,
                        "cust_permitPurpose": oData.cust_toAirportPassItem.cust_permitPurpose,
                        "cust_nationalID": oData.cust_toAirportPassItem.cust_nationalID,
                        "cust_typeOfPass": oData.cust_toAirportPassItem.cust_typeOfPass,
                        "externalCode": oData.cust_toAirportPassItem.externalCode,
                        "externalName": oData.cust_toAirportPassItem.externalName,
                        "cust_dateOfBirth": oData.cust_toAirportPassItem.cust_dateOfBirth
                    },
                    "isPersonalIdAttachmentNew": false,
                    "personalIdAttachmentFileContent": "Personal ID",
                    "personalIdAttachmentFileName": "Personal ID.txt",
                    "personalIdAttachmentUserId": "Extentia",
                    "isPersonalPhotoAttachmentNew": false,
                    "personalPhotoAttachmentFileContent": "Personal photo",
                    "personalPhotoAttachmentFileName": "Personal Photo.txt",
                    "personalPhotoAttachmentUserId": "Extentia",
                    "isPassportAttachmentNew": false,
                    "passportAttachmentFileContent": "Passport",
                    "passportAttachmentFileName": "Passport.txt",
                    "passportAttachmentUserId": "Extentia",
                    "isCompanyIdAttachmentNew": false,
                    "companyIdAttachmentFileContent": "Company Id",
                    "companyIdAttachmentFileName": "Company Id.txt",
                    "companyIdAttachmentUserId": "Extentia"
                },
                    oAttachmentModel = new JSONModel({
                        PersonalIdAttachment: oData.cust_toAirportPassItem.cust_personalIdNav,
                        PersonalPhotoAttachment: oData.cust_toAirportPassItem.cust_personalPhotoNav,
                        PassportAttachment: oData.cust_toAirportPassItem.cust_passportCopyNav,
                        CompanyIdAttachment: oData.cust_toAirportPassItem.cust_companyIdNav,
                    }),
                    oDisplayEditAirpassModel = new JSONModel(oDisplayEditAirpassObj);

                this.getView().setModel(oAttachmentModel, "AttachmentModel");
                this.getView().setModel(oDisplayEditAirpassModel, "DisplayEditAirpassModel");

                this.getView().getModel("LocalViewModel").setProperty("/AirPortLocatonId", oData.cust_toAirportPassItem.cust_airportLoc);
                this.getView().getModel("LocalViewModel").setProperty("/AirPortLocatoDesc", oData.cust_toAirportPassItem.cust_airportLocNav.results[0].label_defaultValue);
                this.getView().getModel("LocalViewModel").setProperty("/TypeOfPassId", oData.cust_toAirportPassItem.cust_typeOfPass);
                this.getView().getModel("LocalViewModel").setProperty("/TypeOfPassDesc", oData.cust_toAirportPassItem.cust_typeOfPassNav.results[0].label_defaultValue);

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
                var oComponentModel = this.getComponentModel(),
                    sKey = oComponentModel.createKey("/SF_AirportPassMain", {
                        // effectiveStartDate: new Date("2022/03/19"),
                        effectiveStartDate: this.object.effectiveStartDate,
                        externalCode: this.object.externalCode
                    });
                oComponentModel.remove(sKey, {
                    success: function (oData) {
                        if (oData !== "" || oData !== undefined) {
                            sap.m.MessageBox.success("Record Deleted successfully.");
                            oComponentModel.refresh();
                            this.oRouter.navTo("detail", {
                                parentMaterial: this.sParentID,
                                layout: "TwoColumnsMidExpanded"
                            });
                        } else {
                            MessageBox.error("Record Not able to delete.");
                        }
                        this.getView().setBusy(false);
                    }.bind(this),
                    error: function (oError) {
                        this.getView().setBusy(false);
                        MessageBox.error("Record Not able to delete.");
                    }.bind(this),
                });
            },

            onSavePress: function () {
                var sValidationErrorMsg = this.fnValidateAirPassPayload(),

                    sKey = this.getView().getModel().createKey("/SF_AirportPassMain", {
                        effectiveStartDate: this.object.effectiveStartDate,
                        externalCode: this.object.externalCode
                    });

                if (sValidationErrorMsg === "") {
                    this.getView().setBusy(true);
                    
                    this._fnUpdateAttachmentData();

                    var oPayloadObj = this.getView().getModel("DisplayEditAirpassModel").getProperty("/");
                    oPayloadObj.cust_toAirportPassItem.cust_domStationName = oPayloadObj.cust_toAirportPassItem.cust_airportLoc === "Loc05" ?  oPayload.cust_toAirportPassItem.cust_domStationName : null;

                    this.getView().getModel().update(sKey, oPayloadObj, {
                        success: function (oResponse) {
                            this.getView().setBusy(false);
                            sap.m.MessageBox.success("Requested changes updated successfully.");
                            this.oRouter.navTo("detail", {
                                parentMaterial: this.sParentID,
                                layout: "TwoColumnsMidExpanded"
                            });
                        }.bind(this),
                        error: function (oError) {
                            this.getView().setBusy(false);
                            sap.m.MessageBox.error(JSON.parse(JSON.parse(oError.responseText).error.message.value).error.message.value.split("]")[1]);
                        }.bind(this)
                    });
                } else {
                    sap.m.MessageBox.error(sValidationErrorMsg);
                }
            },

            _fnUpdateAttachmentData: function () {
                var oData = this.getView().getModel("DisplayEditAirpassModel").getProperty("/");

                if (oData.isPersonalIdAttachmentNew === false) {
                    var oPersonalIdAttachmentObj = this.getView().getModel("AttachmentModel").getProperty("/PersonalIdAttachment");
                    this.getView().getModel("DisplayEditAirpassModel").setProperty("/isPersonalIdAttachmentNew", true);
                    this.getView().getModel("DisplayEditAirpassModel").setProperty("/personalIdAttachmentFileContent", oPersonalIdAttachmentObj.fileContent);
                    this.getView().getModel("DisplayEditAirpassModel").setProperty("/personalIdAttachmentFileName", oPersonalIdAttachmentObj.fileName);
                    this.getView().getModel("DisplayEditAirpassModel").refresh();
                }

                if (oData.isPersonalPhotoAttachmentNew === false) {
                    var oPersonalPhotoAttachmentObj = this.getView().getModel("AttachmentModel").getProperty("/PersonalPhotoAttachment");
                    this.getView().getModel("DisplayEditAirpassModel").setProperty("/isPersonalPhotoAttachmentNew", true);
                    this.getView().getModel("DisplayEditAirpassModel").setProperty("/personalPhotoAttachmentFileContent", oPersonalPhotoAttachmentObj.fileContent);
                    this.getView().getModel("DisplayEditAirpassModel").setProperty("/personalPhotoAttachmentFileName", oPersonalPhotoAttachmentObj.fileName);
                    this.getView().getModel("DisplayEditAirpassModel").refresh();
                }

                if (oData.isPassportAttachmentNew === false) {
                    var oPassportAttachmentObj = this.getView().getModel("AttachmentModel").getProperty("/PassportAttachment");
                    this.getView().getModel("DisplayEditAirpassModel").setProperty("/isPassportAttachmentNew", true);
                    this.getView().getModel("DisplayEditAirpassModel").setProperty("/passportAttachmentFileContent", oPassportAttachmentObj.fileContent);
                    this.getView().getModel("DisplayEditAirpassModel").setProperty("/passportAttachmentFileName", oPassportAttachmentObj.fileName);
                    this.getView().getModel("DisplayEditAirpassModel").refresh();
                }

                if (oData.isCompanyIdAttachmentNew === false) {
                    var oCompanyIdAttachmentObj = this.getView().getModel("AttachmentModel").getProperty("/CompanyIdAttachment");
                    this.getView().getModel("DisplayEditAirpassModel").setProperty("/isCompanyIdAttachmentNew", true);
                    this.getView().getModel("DisplayEditAirpassModel").setProperty("/companyIdAttachmentFileContent", oCompanyIdAttachmentObj.fileContent);
                    this.getView().getModel("DisplayEditAirpassModel").setProperty("/companyIdAttachmentFileName", oCompanyIdAttachmentObj.fileName);
                    this.getView().getModel("DisplayEditAirpassModel").refresh();
                }
            },

            fnValidateAirPassPayload: function () {
                this.getView().setBusy(true);

                var sValidationErrorMsg = "",
                    oEffectStartDatePicker = this.getView().byId("idEditAirportPassEffectDatePicker");

                // Validate AirportPass Effective Start Date
                if (!oEffectStartDatePicker.getValue()) {
                    oEffectStartDatePicker.setValueState("Error");
                    oEffectStartDatePicker.setValueStateText("Please select airport pass effective start date");
                    sValidationErrorMsg = "Please fill the all required fields.";
                } else {
                    oEffectStartDatePicker.setValueState("None");
                }

                // validate Type of Pass Field
                var oTypeofPass = this.getView().byId("idEditTypeOfPassSLT");
                if (!oTypeofPass.getSelectedKey()) {
                    oTypeofPass.setValueState("Error");
                    oTypeofPass.setValueStateText("Please select atleast one value for type of pass field.");
                    sValidationErrorMsg = "Please fill the all required fields.";
                } else {
                    oTypeofPass.setValueState("None");
                }

                // validate Age according to given user's Date of Birth
                var oDateofbirthatePicker = this.getView().byId("idEditDateofBithInp"),
                    oDateofbirth = new Date(oDateofbirthatePicker.getValue()),
                    iAge = this.fnCalculateUserAge(oDateofbirth);

                if (iAge < 18) {
                    oDateofbirthatePicker.setValueState("Error");
                    oDateofbirthatePicker.setValueStateText("Your age must be more than 18 years.");
                    sValidationErrorMsg = "Please fill the all required fields.";
                } else {
                    oDateofbirthatePicker.setValueState("None");
                }

                // validate Nationality Field
                var oNationality = this.getView().byId("idEditNationalityInp");
                if (!oNationality.getValue() || oNationality.getValue().length < 2) {
                    oNationality.setValueState("Error");
                    oNationality.setValueStateText("Please enter valid Nationality.");
                    sValidationErrorMsg = "Please fill the all required fields.";
                } else {
                    oNationality.setValueState("None");
                }

                // validate Airport Location Field
                var oAirPortLocaton = this.getView().byId("idEditAirPortLocatonSLT");
                if (!oAirPortLocaton.getSelectedKey()) {
                    oAirPortLocaton.setValueState("Error");
                    oAirPortLocaton.setValueStateText("Please select atleast one value for airport location field.");
                    sValidationErrorMsg = "Please fill the all required fields.";
                } else {
                    oAirPortLocaton.setValueState("None");
                }

                // validate Domestic staion field if Airport location is selected as "Loc05" i.e Domestic
                if (oAirPortLocaton.getSelectedKey() === "Loc05") {
                    var oDomasticStation = this.getView().byId("idEditDomasticStationInp");
                    if (!oDomasticStation.getValue()) {
                        oDomasticStation.setValueState("Error");
                        oDomasticStation.setValueStateText("Please enter domestic station name.");
                        sValidationErrorMsg = "Please fill the all required fields.";
                    } else {
                        oDomasticStation.setValueState("None");
                    }
                }

                // validate Permit Date Field
                var oPermitDate = this.getView().byId("idEditPermitDate");
                if (!oPermitDate.getValue()) {
                    oPermitDate.setValueState("Error");
                    oPermitDate.setValueStateText("Please enter Permit Date.");
                    sValidationErrorMsg = "Please fill the all required fields.";
                } else {
                    oPermitDate.setValueState("None");
                }

                // validate Purpose of Permit Field
                var oPurposeofPermit = this.getView().byId("idEditPurposeofPermitInp");
                if (!oPurposeofPermit.getValue() || oPurposeofPermit.getValue().length < 3) {
                    oPurposeofPermit.setValueState("Error");
                    oPurposeofPermit.setValueStateText("Please enter Purpose of Permit.");
                    sValidationErrorMsg = "Please fill the all required fields.";
                } else {
                    oPurposeofPermit.setValueState("None");
                }

                // validate Acknowledge First Field
                var oAcknowledgeTextFirst = this.getView().byId("idEditAcknowledgeTextFirstSLT");
                if (oAcknowledgeTextFirst.getSelectedKey() === "Select") {
                    oAcknowledgeTextFirst.setValueState("Error");
                    oAcknowledgeTextFirst.setValueStateText("Please select value for Acknowledgement 1.");
                    sValidationErrorMsg = "Please fill the all required fields.";
                } else {
                    oAcknowledgeTextFirst.setValueState("None");
                }

                // validate Acknowledge second Field
                var oAcknowledgeTextSecond = this.getView().byId("idEditAcknowledgeTextSecondSLT");
                if (oAcknowledgeTextSecond.getSelectedKey() === "Select") {
                    oAcknowledgeTextSecond.setValueState("Error");
                    oAcknowledgeTextSecond.setValueStateText("Please select value for Acknowledgement 2.");
                    sValidationErrorMsg = "Please fill the all required fields.";
                } else {
                    oAcknowledgeTextSecond.setValueState("None");
                }

                // Validate attachment sections
                if (this.getView().byId("idEditUploadSetPersonalID").getItems().length <= 0) {
                    sValidationErrorMsg = "Please upload files for Personal ID Copy.";
                    return sValidationErrorMsg;
                }
                if (this.getView().byId("idEditUploadSetPersonalPhoto").getItems().length <= 0) {
                    sValidationErrorMsg = "Please upload files for Personal Photo.";
                    return sValidationErrorMsg;
                }
                if (this.getView().byId("idEditUploadSetCompanyIDCopy").getItems().length <= 0) {
                    sValidationErrorMsg = "Please upload files for Company ID Copy.";
                    return sValidationErrorMsg;
                }
                
                this.getView().setBusy(false);
                return sValidationErrorMsg;
            },

            onFileAdded: function (oEvent) {
                var file = oEvent.getParameter("item"),
                    Filename = file.getFileName(),
                    Filedata = oEvent.getParameter("item").getFileObject(),
                    sUploaderName = oEvent.getSource().getId().split("--")[1],
                    oUploadPropertyObj = this._fnGetSelectedUploadSetPropoerties(sUploaderName);

                //code for base64/binary array 
                this._getImageData((Filedata), function (Filecontent) {
                    this._addData(Filecontent, Filename, oUploadPropertyObj);
                }.bind(this));

                this.byId(sUploaderName).getDefaultFileUploader().setEnabled(false);
            },

            _getImageData: function (url, callback) {
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

            _addData: function (Filecontent, Filename, oUploadPropertyObj) {
                this.getView().getModel("DisplayEditAirpassModel").setProperty("/" + oUploadPropertyObj.AttachmentNew, true);
                this.getView().getModel("DisplayEditAirpassModel").setProperty("/" + oUploadPropertyObj.AttachmentFileContent, Filecontent);
                this.getView().getModel("DisplayEditAirpassModel").setProperty("/" + oUploadPropertyObj.AttachmentFileName, Filename);
                this.getView().getModel("DisplayEditAirpassModel").refresh();
            },

            onFileDeleted: function (oEvent) {
                var sUploaderName = oEvent.getSource().getId().split("--")[1],
                    oUploadPropertyObj = this._fnGetSelectedUploadSetPropoerties(sUploaderName);

                this.getView().getModel("DisplayEditAirpassModel").setProperty("/" + oUploadPropertyObj.AttachmentNew, false);
                this.getView().getModel("DisplayEditAirpassModel").refresh();
            },

            _fnGetSelectedUploadSetPropoerties: function (sUploaderName) {
                var oUploadPropertyObj = {};
                switch (sUploaderName) {
                    case "idEditUploadSetPersonalID":
                        oUploadPropertyObj = {
                            AttachmentNew: "isPersonalIdAttachmentNew",
                            AttachmentFileContent: "personalIdAttachmentFileContent",
                            AttachmentFileName: "personalIdAttachmentFileName"
                        };
                        break;

                    case "idEditUploadSetPersonalPhoto":
                        oUploadPropertyObj = {
                            AttachmentNew: "isPersonalPhotoAttachmentNew",
                            AttachmentFileContent: "personalPhotoAttachmentFileContent",
                            AttachmentFileName: "personalPhotoAttachmentFileName"
                        };
                        break;

                    case "idEditUploadSetnonnationals":
                        oUploadPropertyObj = {
                            AttachmentNew: "isPassportAttachmentNew",
                            AttachmentFileContent: "passportAttachmentFileContent",
                            AttachmentFileName: "passportAttachmentFileName"
                        };
                        break;

                    case "idEditUploadSetCompanyIDCopy":
                        oUploadPropertyObj = {
                            AttachmentNew: "isCompanyIdAttachmentNew",
                            AttachmentFileContent: "companyIdAttachmentFileContent",
                            AttachmentFileName: "companyIdAttachmentFileName"
                        };
                        break;
                }

                return oUploadPropertyObj;
            },


            onDownLoadPress: function (oEvent) {
                var sUploaderName = oEvent.getSource().getParent().getParent().getParent().getId().split("--")[1],
                    oAttachmentData = this.getView().getModel("AttachmentModel").getProperty("/"),
                    sFileContent = null, sFileName = null, sFileext = null, sMimeType = null;

                switch (sUploaderName) {
                    case "idDisplayUploadSetPersonalIDCopy":
                        sFileContent = oAttachmentData.PersonalIdAttachment.fileContent;
                        sFileName = oAttachmentData.PersonalIdAttachment.fileName.split(".")[0];
                        sFileext = oAttachmentData.PersonalIdAttachment.fileExtension;
                        sMimeType = oAttachmentData.PersonalIdAttachment.mimeType;
                        break;

                    case "idDisplayUploadSetPersonalPhoto":
                        sFileContent = oAttachmentData.PersonalPhotoAttachment.fileContent;
                        sFileName = oAttachmentData.PersonalPhotoAttachment.fileName.split(".")[0];
                        sFileext = oAttachmentData.PersonalPhotoAttachment.fileExtension;
                        sMimeType = oAttachmentData.PersonalPhotoAttachment.mimeType;
                        break;

                    case "idDisplayUploadSetPassportcopy":
                        sFileContent = oAttachmentData.PassportAttachment.fileContent;
                        sFileName = oAttachmentData.PassportAttachment.fileName.split(".")[0];
                        sFileext = oAttachmentData.PassportAttachment.fileExtension;
                        sMimeType = oAttachmentData.PassportAttachment.mimeType;
                        break;

                    case "idDisplayUploadSetCompanyIDCopy":
                        sFileContent = oAttachmentData.CompanyIdAttachment.fileContent;
                        sFileName = oAttachmentData.CompanyIdAttachment.fileName.split(".")[0];
                        sFileext = oAttachmentData.CompanyIdAttachment.fileExtension;
                        sMimeType = oAttachmentData.CompanyIdAttachment.mimeType;
                        break;
                }

                if (sFileext === "pdf" || sFileext === "png") {
                    var decodedPdfContent = atob(sFileContent);
                    var byteArray = new Uint8Array(decodedPdfContent.length)
                    for (var i = 0; i < decodedPdfContent.length; i++) {
                        byteArray[i] = decodedPdfContent.charCodeAt(i);
                    }
                    var blob = new Blob([byteArray.buffer], { type: sMimeType });
                    var _pdfurl = URL.createObjectURL(blob);
                    var a = document.createElement('a');
                    a.href = _pdfurl;
                    a.download = sFileName;
                    a.dispatchEvent(new MouseEvent('click'));
                }
                else {
                    sap.ui.core.util.File.save(sFileContent, sFileName, sFileext, sMimeType);
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
                this.oRouter.navTo("AirportPassRequestDetail", {
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

            onBreadCrumbNavPress: function () {
                this.oRouter.navTo("detail", {
                    parentMaterial: this.sParentID,
                    layout: "TwoColumnsMidExpanded"
                });
            }
        });
    });        
