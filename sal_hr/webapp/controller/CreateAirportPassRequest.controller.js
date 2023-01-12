sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "com/sal/salhr/model/formatter"
],

    function (BaseController, JSONModel, formatter) {
        "use strict";

        return BaseController.extend("com.sal.salhr.controller.CreateAirportPassRequest", {
            formatter: formatter,
            onInit: function () {
                this.oRouter = this.getRouter();
                this.oRouter.getRoute("AirportPassRequest").attachPatternMatched(this._onObjectMatched, this);
                this.mainModel = this.getOwnerComponent().getModel();
                var oLocalViewModel = new JSONModel({
                    currentDate: new Date()
                });
                this.getView().setModel(oLocalViewModel, "LocalViewModel");
                this.mainModel.setSizeLimit(1000);
            },

            _onObjectMatched: function (oEvent) {
                this.sParentID = oEvent.getParameter("arguments").parentMaterial;
                var sLayout = oEvent.getParameter("arguments").layout;

                this.getView().getModel("layoutModel").setProperty("/layout", sLayout);

                this.fnSetCreateAirpassLocalModel();
            },

            fnSetCreateAirpassLocalModel: function () {
                this.EmpInfoObj = this.getOwnerComponent().getModel("EmpInfoModel").getData();

                var sExternalCode = this.EmpInfoObj.userId,
                    sNationalID = this.EmpInfoObj.nationalId,
                    sNationality = this.EmpInfoObj.nationality,
                    sMobileNumber = this.EmpInfoObj.mobile,
                    sDateOfBirth = this.EmpInfoObj.dateOfBirth,

                    oCreateAirpassObj = {
                        "externalCode": sExternalCode,
                        "externalName": null,
                        "effectiveStartDate": new Date(),
                        "cust_toAirportPassItem": {
                            "cust_mobileNumber": sMobileNumber,
                            "cust_acknowledge2": null,
                            "cust_acknowledge1": null,
                            "cust_airportLoc": null,
                            "cust_airportPassMain_effectiveStartDate": new Date(),
                            "cust_airportPassMain_externalCode": sExternalCode,
                            "cust_domStationName": null,
                            "cust_nationality": sNationality,
                            "cust_permitDate": null,
                            "cust_permitPurpose": null,
                            "cust_nationalID": sNationalID,
                            "cust_typeOfPass": null,
                            "externalCode": sExternalCode,
                            "externalName": null,
                            "cust_dateOfBirth": sDateOfBirth
                        },
                        "isPersonalIdAttachmentNew": false,
                        "personalIdAttachmentFileContent": "Personal ID",
                        "personalIdAttachmentFileName": "Personal ID.txt",
                        "personalIdAttachmentUserId": sExternalCode,
                        "isPersonalPhotoAttachmentNew": false,
                        "personalPhotoAttachmentFileContent": "Personal photo",
                        "personalPhotoAttachmentFileName": "Personal Photo.txt",
                        "personalPhotoAttachmentUserId": sExternalCode,
                        "isPassportAttachmentNew": false,
                        "passportAttachmentFileContent": "Passport",
                        "passportAttachmentFileName": "Passport.txt",
                        "passportAttachmentUserId": sExternalCode,
                        "isCompanyIdAttachmentNew": false,
                        "companyIdAttachmentFileContent": "Company Id",
                        "companyIdAttachmentFileName": "Company Id.txt",
                        "companyIdAttachmentUserId": sExternalCode
                    },
                    oCreateAirpoPassModel = new JSONModel(oCreateAirpassObj);

                this.getView().setModel(oCreateAirpoPassModel, "CreateAirpoPassModel");
                
                
                this._fnRemoveFileUploaderItems();
            },

            _fnRemoveFileUploaderItems: function () {
                this.getView().byId("UploadSetPersonalID").destroyItems();
                this.getView().byId("UploadSetPersonalID").getDefaultFileUploader().setEnabled(true);

                this.getView().byId("UploadSetPersonalPhoto").destroyItems();
                this.getView().byId("UploadSetPersonalPhoto").getDefaultFileUploader().setEnabled(true);

                this.getView().byId("UploadSetnonnationals").destroyItems();
                this.getView().byId("UploadSetnonnationals").getDefaultFileUploader().setEnabled(true);

                this.getView().byId("UploadSetCompanyIDCopy").destroyItems();
                this.getView().byId("UploadSetCompanyIDCopy").getDefaultFileUploader().setEnabled(true);
            },

            onRaiseRequestPress: function () {
                var sPath = "/SF_AirportPassMain",
                    sValidationErrorMsg = this.fnValidateCreateAirPassPayload(),
                    oPayload = this.getView().getModel("CreateAirpoPassModel").getData();

                if (sValidationErrorMsg === "") {
                    this.getView().setBusy(true);
                    oPayload.cust_toAirportPassItem.cust_typeOfPass = this.getView().byId("idTypeOfPassSLT").getSelectedKey();
                    oPayload.cust_toAirportPassItem.cust_airportLoc = this.getView().byId("idAirPortLocatonSLT").getSelectedKey();
                    oPayload.cust_toAirportPassItem.cust_acknowledge1 = this.getView().byId("idAcknowledgeTextFirstSLT").getSelectedKey() === "true" ? true : false;
                    oPayload.cust_toAirportPassItem.cust_acknowledge2 = this.getView().byId("idAcknowledgeTextSecondSLT").getSelectedKey() === "true" ? true : false;
                    oPayload.cust_toAirportPassItem.cust_domStationName = oPayload.cust_toAirportPassItem.cust_airportLoc === "Loc05" ? oPayload.cust_toAirportPassItem.cust_domStationName : null;

                    this.mainModel.create(sPath, oPayload, {
                        success: function () {
                            this.getView().setBusy(false);
                            sap.m.MessageBox.success("Request Submitted Successfully.");
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
                        }.bind(this)
                    });
                } else {
                    sap.m.MessageBox.error(sValidationErrorMsg);
                }
            },

            fnValidateCreateAirPassPayload: function () {
                this.getView().setBusy(true);

                var sValidationErrorMsg = "",
                    oEffectStartDatePicker = this.getView().byId("idAirportPassEffectDatePicker");

                // Validate AirportPass Effective Start Date
                if (!oEffectStartDatePicker.getValue()) {
                    oEffectStartDatePicker.setValueState("Error");
                    oEffectStartDatePicker.setValueStateText("Please select airport pass effective start date");
                    sValidationErrorMsg = "Please fill the all required fields.";
                } else {
                    oEffectStartDatePicker.setValueState("None");
                }

                // validate Type of Pass Field
                var oTypeofPass = this.getView().byId("idTypeOfPassSLT");
                if (!oTypeofPass.getSelectedKey()) {
                    oTypeofPass.setValueState("Error");
                    oTypeofPass.setValueStateText("Please select atleast one value for type of pass field.");
                    sValidationErrorMsg = "Please fill the all required fields.";
                } else {
                    oTypeofPass.setValueState("None");
                }

                // validate Age according to given user's Date of Birth
                var oDateofbirthatePicker = this.getView().byId("idDateofBithInp"),
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
                var oNationality = this.getView().byId("idNationalityInp");
                if (!oNationality.getSelectedKey()) {
                    oNationality.setValueState("Error");
                    oNationality.setValueStateText("Please enter valid Nationality.");
                    sValidationErrorMsg = "Please fill the all required fields.";
                } else {
                    oNationality.setValueState("None");
                    this.getView().getModel("CreateAirpoPassModel").setProperty("/cust_toAirportPassItem/cust_nationality", oNationality.getSelectedKey());
                }

                // validate Airport Location Field
                var oAirPortLocaton = this.getView().byId("idAirPortLocatonSLT");
                if (!oAirPortLocaton.getSelectedKey()) {
                    oAirPortLocaton.setValueState("Error");
                    oAirPortLocaton.setValueStateText("Please select atleast one value for airport location field.");
                    sValidationErrorMsg = "Please fill the all required fields.";
                } else {
                    oAirPortLocaton.setValueState("None");
                }

                // validate Domestic staion field if Airport location is selected as "Loc05" i.e Domestic
                if (oAirPortLocaton.getSelectedKey() === "Loc05") {
                    var oDomasticStation = this.getView().byId("idDomasticStationInp");
                    if (!oDomasticStation.getValue()) {
                        oDomasticStation.setValueState("Error");
                        oDomasticStation.setValueStateText("Please enter domestic station name.");
                        sValidationErrorMsg = "Please fill the all required fields.";
                    } else {
                        oDomasticStation.setValueState("None");
                    }
                }

                // validate Permit Date Field
                var oPermitDate = this.getView().byId("idPermitDate");
                if (!oPermitDate.getValue()) {
                    oPermitDate.setValueState("Error");
                    oPermitDate.setValueStateText("Please enter Permit Date.");
                    sValidationErrorMsg = "Please fill the all required fields.";
                } else {
                    oPermitDate.setValueState("None");
                }

                // validate Purpose of Permit Field
                var oPurposeofPermit = this.getView().byId("idPurposeofPermitInp");
                if (!oPurposeofPermit.getValue() || oPurposeofPermit.getValue().length < 3) {
                    oPurposeofPermit.setValueState("Error");
                    oPurposeofPermit.setValueStateText("Please enter Purpose of Permit.");
                    sValidationErrorMsg = "Please fill the all required fields.";
                } else {
                    oPurposeofPermit.setValueState("None");
                }

                // validate Acknowledge First Field
                var oAcknowledgeTextFirst = this.getView().byId("idAcknowledgeTextFirstSLT");
                if (oAcknowledgeTextFirst.getSelectedKey() === "Select") {
                    oAcknowledgeTextFirst.setValueState("Error");
                    oAcknowledgeTextFirst.setValueStateText("Please select value for Acknowledgement 1.");
                    sValidationErrorMsg = "Please fill the all required fields.";
                } else {
                    oAcknowledgeTextFirst.setValueState("None");
                }

                // validate Acknowledge Field
                var oAcknowledgeTextSecond = this.getView().byId("idAcknowledgeTextSecondSLT");
                if (oAcknowledgeTextSecond.getSelectedKey() === "Select") {
                    oAcknowledgeTextSecond.setValueState("Error");
                    oAcknowledgeTextSecond.setValueStateText("Please select value for Acknowledgement 2.");
                    sValidationErrorMsg = "Please fill the all required fields.";
                } else {
                    oAcknowledgeTextSecond.setValueState("None");
                }

                // Validate attachment sections
                if (!this.getView().getModel("CreateAirpoPassModel").getProperty("/isPersonalIdAttachmentNew")) {
                    sValidationErrorMsg = "Please upload files for Personal ID Copy.";
                    this.getView().setBusy(false);
                    return sValidationErrorMsg;
                }
                if (!this.getView().getModel("CreateAirpoPassModel").getProperty("/isPersonalPhotoAttachmentNew")) {
                    sValidationErrorMsg = "Please upload files for Personal Photo.";
                    this.getView().setBusy(false);
                    return sValidationErrorMsg;
                }
                if (!this.getView().getModel("CreateAirpoPassModel").getProperty("/isCompanyIdAttachmentNew")) {
                    sValidationErrorMsg = "Please upload files for Company ID Copy.";
                    this.getView().setBusy(false);
                    return sValidationErrorMsg;
                }

                this.getView().setBusy(false);
                return sValidationErrorMsg;
            },

            onCreateCancelPress: function () {
                this.oRouter.navTo("detail", {
                    parentMaterial: this.sParentID,
                    layout: "TwoColumnsMidExpanded"
                });
                this.mainModel.refresh();
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
                this.getView().getModel("CreateAirpoPassModel").setProperty("/" + oUploadPropertyObj.AttachmentNew, true);
                this.getView().getModel("CreateAirpoPassModel").setProperty("/" + oUploadPropertyObj.AttachmentFileContent, Filecontent);
                this.getView().getModel("CreateAirpoPassModel").setProperty("/" + oUploadPropertyObj.AttachmentFileName, Filename);
                this.getView().getModel("CreateAirpoPassModel").refresh();
            },

            onFileDeleted: function (oEvent) {
                var sUploaderName = oEvent.getSource().getId().split("--")[1],
                    oUploadPropertyObj = this._fnGetSelectedUploadSetPropoerties(sUploaderName);

                this.byId(sUploaderName).getDefaultFileUploader().setEnabled(true);

                this.getView().getModel("CreateAirpoPassModel").setProperty("/" + oUploadPropertyObj.AttachmentNew, false);
                this.getView().getModel("CreateAirpoPassModel").setProperty("/" + oUploadPropertyObj.AttachmentFileContent, "");
                this.getView().getModel("CreateAirpoPassModel").setProperty("/" + oUploadPropertyObj.AttachmentFileName, "");
                this.getView().getModel("CreateAirpoPassModel").refresh();
            },

            _fnGetSelectedUploadSetPropoerties: function (sUploaderName) {
                var oUploadPropertyObj = {};
                switch (sUploaderName) {
                    case "UploadSetPersonalID":
                        oUploadPropertyObj = {
                            AttachmentNew: "isPersonalIdAttachmentNew",
                            AttachmentFileContent: "personalIdAttachmentFileContent",
                            AttachmentFileName: "personalIdAttachmentFileName"
                        };
                        break;

                    case "UploadSetPersonalPhoto":
                        oUploadPropertyObj = {
                            AttachmentNew: "isPersonalPhotoAttachmentNew",
                            AttachmentFileContent: "personalPhotoAttachmentFileContent",
                            AttachmentFileName: "personalPhotoAttachmentFileName"
                        };
                        break;

                    case "UploadSetnonnationals":
                        oUploadPropertyObj = {
                            AttachmentNew: "isPassportAttachmentNew",
                            AttachmentFileContent: "passportAttachmentFileContent",
                            AttachmentFileName: "passportAttachmentFileName"
                        };
                        break;

                    case "UploadSetCompanyIDCopy":
                        oUploadPropertyObj = {
                            AttachmentNew: "isCompanyIdAttachmentNew",
                            AttachmentFileContent: "companyIdAttachmentFileContent",
                            AttachmentFileName: "companyIdAttachmentFileName"
                        };
                        break;
                }
                return oUploadPropertyObj;
            },

            handleDetailFullScreen: function (oEvent) {
                var sLayout = "";
                if (oEvent.getSource().getIcon() === "sap-icon://full-screen") {
                    sLayout = "MidColumnFullScreen";
                    oEvent.getSource().setIcon("sap-icon://exit-full-screen");
                } else {
                    sLayout = "TwoColumnsMidExpanded";
                    oEvent.getSource().setIcon("sap-icon://full-screen");
                }

                this.oRouter.navTo("detail", {
                    parentMaterial: this.sParentID,
                    layout: sLayout
                });
            },

            handleDetailClose: function (oEvent) {
                var sLayout = "",
                    sIcon = this.byId("idDetailFullScreenBTN").getIcon();
                if (sIcon === "sap-icon://full-screen") {
                    sLayout = "EndColumnFullScreen";
                } else {
                    sLayout = "TwoColumnsMidExpanded";
                    this.byId("idDetailFullScreenBTN").setIcon("sap-icon://full-screen");
                }
                this.oRouter.navTo("master");
            },

            onResetPress: function () {
                this.fnSetCreateAirpassLocalModel(this.EmpInfoObj);
            },

            onBreadCrumbNavPress: function () {
                this.oRouter.navTo("detail", {
                    parentMaterial: this.sParentID,
                    layout: "TwoColumnsMidExpanded"
                });
            },

            onFileRenamed: function (oEvent) {
                var sFileRenamedName = oEvent.getParameter("item").getProperty("fileName"),
                    sUploadSetId = oEvent.getSource().getId().split("--")[1],
                    sFileNameProperty = null;

                switch (sUploadSetId) {
                    case "UploadSetPersonalID":
                        sFileNameProperty = "/personalIdAttachmentFileName";
                        break;

                    case "UploadSetPersonalPhoto":
                        sFileNameProperty = "/personalPhotoAttachmentFileName";
                        break;

                    case "UploadSetnonnationals":
                        sFileNameProperty = "/passportAttachmentFileName";
                        break;

                    case "UploadSetCompanyIDCopy":
                        sFileNameProperty = "/companyIdAttachmentFileName";
                        break;
                }
                this.getView().getModel("CreateAirpoPassModel").setProperty(sFileNameProperty, sFileRenamedName);
                this.getView().getModel("CreateAirpoPassModel").refresh;
            }
        });
    });