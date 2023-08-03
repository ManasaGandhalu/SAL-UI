sap.ui.define([
    "./BaseController",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox"
],

    function (BaseController, Controller, JSONModel, MessageBox) {
        "use strict";
        return BaseController.extend("com.sal.salhr.controller.CreateBusinessCardRequest", {
            onInit: function () {


                this.oRouter = this.getRouter();
                this.oRouter.getRoute("BusinessCardRequest").attachPatternMatched(this._onObjectMatched, this);
                // this.oRouter.attachRouteMatched(this.onRouteMatched, this);
                this.mainModel = this.getOwnerComponent().getModel();
                this.mainModel.setSizeLimit(1000);
                var that = this;

                var oLocalViewModel = new JSONModel({
                    currentDate: new Date(),
                    busy: false,
                    uploadAttachment: true,
                    currentDate: new Date()
                });

                this.getView().setModel(oLocalViewModel, "LocalViewModel");





            },
            // onRouteMatched: function (oEvent) {
            //     this.sParentID = oEvent.getParameter("arguments").parentMaterial;
            //     this.loadFragment();

            // },
            _onObjectMatched: function (oEvent) {
                this.onResetPress();

                this.sParentID = oEvent.getParameter("arguments").parentMaterial;
                var sLayout = oEvent.getParameter("arguments").layout;

                this.getView().getModel("layoutModel").setProperty("/layout", sLayout);

               // this._bindView("/EmpInfo", "12002429");
                // this.fnGetEmployeeInfo("12002429");
                this.fnSetCreateBusinessCardLocalModel();
                


            },
           
            fnSetCreateBusinessCardLocalModel: function () {
                // this.EmpInfoObj = oEmpInfoObj;
               
                this.EmpInfoObj = this.getOwnerComponent().getModel("EmpInfoModel").getData();
              

                var sExternalCode = this.EmpInfoObj.userId,
                    sJobTitle = this.EmpInfoObj.jobTitle,
                    sEmail = this.EmpInfoObj.email,
                    sMobileNumber = this.EmpInfoObj.mobile,
                    sOfficeNum = this.EmpInfoObj.officeNumber,

                    oCreateBusinessCardObj = {
                        "externalCode": this.EmpInfoObj.sExternalCode,
                        "externalName": null,
                        "sJobTitle": this.EmpInfoObj.jobTitle,
                        "sLocation": "",
                        "sEmail":this.EmpInfoObj.email,
                        "sMobile":this.EmpInfoObj.mobile,
                        "sOfficeNo":this.EmpInfoObj.officeNumber,
                        "sDivison":this.EmpInfoObj.division,
                        "effectiveStartDate": new Date()
                      
                        
                    },
                    oCreateBusinessCardModel = new JSONModel(oCreateBusinessCardObj);

                this.getView().setModel(oCreateBusinessCardModel, "CreateBusinessCardModel");

              
            },
            _bindView: function (sObjectPath, sExternalCode) {
                var objectViewModel = this.getViewModel("objectViewModel");
                var that = this;
                var oComponentModel = this.getComponentModel();
                //    var sTickets = sObjectPath + "/tickets";
                var sKey = oComponentModel.createKey(sObjectPath, {
                    userId: sExternalCode
                });

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




            },
            _validateMandatoryFields: function () {
                var bValid = true;
                if (this.byId("idCreateJobTitle").getValue() === "") {
                    this.byId("idCreateJobTitle").setValueState("Error");
                    this.byId("idCreateJobTitle").setValueStateText(
                        "Please enter job title"
                    );
                    bValid = false;
                } else {
                    this.byId("idCreateJobTitle").setValueState("None");
                    this.byId("idCreateJobTitle").setValueStateText(null);
                }

               



                



                // if (this.byId("idCreateEmail").getValue() === "") {
                //     this.byId("idCreateEmail").setValueState("Error");
                //     this.byId("idCreateEmail").setValueStateText(
                //         "Please enter email"
                //     );
                //     bValid = false;
                // } else {
                //     this.byId("idCreateEmail").setValueState("None");
                //     this.byId("idCreateEmail").setValueStateText(null);
                // }

                
               

                // if (this.byId("idCreateMobile").getValue() === "") {
                //     this.byId("idCreateMobile").setValueState("Error");
                //     this.byId("idCreateMobile").setValueStateText(
                //         "Please enter Mobile Number"
                //     );
                //     bValid = false;
                // } else {
                //     this.byId("idCreateMobile").setValueState("None");
                //     this.byId("idCreateMobile").setValueStateText(null);
                // }





                return bValid;
            },


            onLiveChangeJobTitle : function(oEve)
            {
                var sValue = oEve.getSource().getValue();

               
                if (sValue === "") {
                    this.byId("idCreateJobTitle").setValueState("Error");
                    this.byId("idCreateJobTitle").setValueStateText(
                        "Please enter job title"
                    );
                
                } else {
                    this.byId("idCreateJobTitle").setValueState("None");
                    this.byId("idCreateJobTitle").setValueStateText(null);
                }
            },

            onChangeMobile : function(oEve)
            {
                var sValue = oEve.getSource().getValue();

               
                if (sValue === "") {
                    this.byId("idCreateMobile").setValueState("Error");
                    this.byId("idCreateMobile").setValueStateText(
                        "Please enter Mobile Number"
                    );
                
                } else {
                    this.byId("idCreateMobile").setValueState("None");
                    this.byId("idCreateMobile").setValueStateText(null);
                }
            },

     
            onEmailChange: function (oEve) {

                var sValue = oEve.getSource().getValue();

                var validRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

                if (!sValue.match(validRegex)) {

                    this.byId("idCreateEmail").setValueState("Error");
                    this.byId("idCreateEmail").setValueStateText(
                        "Please enter valid Email"
                    );
                }

                else {
                    this.getView().byId("idCreateEmail").setValueState("None");

                }

            },

            onRaiseRequestPress: function () {
                // if (!this._validateMandatoryFields()) {

                //     return;
                // }

                var oPayload, sPath;

                oPayload = this.getBusinessCardCreatePayload();
                sPath = "/SF_BusinessCard";


                this.getView().setBusy(true);

                this.mainModel.create(sPath, oPayload, {
                    success: function (oData, oResponse) {
                        sap.m.MessageBox.success("Request Submitted Successfully.");
                        this.getView().setBusy(false);
                        this.getView().getModel().refresh();
                        this.onResetPress();
                        this.oRouter.navTo("detail", {
                            parentMaterial: this.sParentID,
                            layout: "TwoColumnsMidExpanded"

                        });
                    }.bind(this),
                    error: function (oError) {
                        sap.m.MessageBox.error(JSON.parse(JSON.parse(oError.responseText).error.message.value).error.message.value.split("]")[1]);
                        this.getView().getModel().refresh();
                        this.getView().setBusy(false);

                    }.bind(this)
                })
            },

            onFileAdded: function (oEvent) {
                // debugger;
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
                var oUploadSet = this.byId("UploadSet");
                oUploadSet.getDefaultFileUploader().setEnabled(false);


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
            onFileDeleted: function (oEvent) {
                var oUploadSet = this.byId("UploadSet");
                oUploadSet.getDefaultFileUploader().setEnabled(true);
            },
            getBusinessCardCreatePayload: function () {
                var sUserID = this.getOwnerComponent().getModel("EmpInfoModel").getData().userId;

                var sIncidentStartDate = this.byId("idIncidentStartDate").getDateValue();
                var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" }),
                    sIncidentStartDate = dateFormat.format(new Date(sIncidentStartDate));
                sIncidentStartDate = sIncidentStartDate + "T00:00:00";


                var sCustOfficeNo = this.byId("idCreateOfficeNo").getValue();
                if(sCustOfficeNo === "" || sCustOfficeNo === null || sCustOfficeNo === undefined){
                    sCustOfficeNo = "NA";
                }

                var sCustEmail = this.byId("idCreateEmail").getValue();
                if(sCustEmail === "" || sCustEmail === null || sCustEmail === undefined ){
                    sCustEmail = "NA";
                }
                var sCustMobile = this.byId("idCreateMobile").getValue();
                if(sCustMobile === "" || sCustMobile === null || sCustMobile === undefined){
                    sCustMobile = "NA";
                }
                var sCustLocation = this.byId("idCreateLocation").getValue();
                
                var sCustPOBOX = this.byId("idCreatePOBOX").getValue();

                var sCustJobTitle = this.byId("idCreateJobTitle").getValue();
                if(sCustJobTitle === "" || sCustJobTitle === null || sCustJobTitle === undefined){
                    sCustJobTitle = "NA";
                }

                return {
                    "User": sUserID,
                    "cust_email": sCustEmail,
                    "cust_mobile": sCustMobile,
                    "cust_poBox": sCustPOBOX,
                    "cust_location": sCustLocation,
                    "cust_officeNumber": sCustOfficeNo,
                    "effectiveStartDate": sIncidentStartDate,
                    "cust_jobTitle": sCustJobTitle

                };
            },


            onLeaveEndDateChange: function (oEvent) {
                var oneDay = 24 * 60 * 60 * 1000;
                var sStartDate = sap.ui.core.Fragment.byId("idLeaveFragment", "idStartDate").getDateValue();
                var sEndDate = oEvent.getSource().getDateValue();

                if (sEndDate <= sStartDate) {
                    oEvent.getSource().setValueState("Error");
                    oEvent.getSource().setValueStateText("End Date should be later than Start Date");
                    sap.ui.core.Fragment.byId("idLeaveFragment", "idRequestDay").setValue("");
                } else {
                    oEvent.getSource().setValueState();
                    oEvent.getSource().setValueStateText("");
                    sap.ui.core.Fragment.byId("idLeaveFragment", "idStartDate").setValueState();
                    sap.ui.core.Fragment.byId("idLeaveFragment", "idStartDate").setValueStateText("");
                    // this.sRequestDay = Math.round(Math.abs((sEndDate - new Date(sStartDate)) / oneDay)) + 1 ;
                    this.sRequestDay = this.dateDifference(sStartDate, sEndDate, oEvent);
                    // sap.ui.core.Fragment.byId("idLeaveFragment", "idRequestDay").setValue(this.sRequestDay);
                    this.getView().getModel("LocalViewModel").setProperty("/requestDay", this.sRequestDay);
                }
            },





            onCreateCancelPress: function () {
                this.oRouter.navTo("detail", {
                    parentMaterial: this.sParentID,
                    layout: "TwoColumnsMidExpanded"

                });
                this.mainModel.refresh();
            },
            onResetPress: function () {
                this.onCreateResetPress();


            },
            onCreateResetPress: function () {
                var dataReset = {
                    currentDate: new Date(),
                    endDate: new Date(),
                    busy: false,
                    uploadAttachment: true
                };
                this.getView().getModel("LocalViewModel").setData(dataReset);
                this.getView().getModel("LocalViewModel").refresh();
                
           
                this.byId("idCreatePOBOX").setValue("");
                this.byId("idCreateLocation").setValue("");

                
             
            }



        });
    });      
