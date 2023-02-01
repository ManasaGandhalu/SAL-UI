sap.ui.define([
    "./BaseController",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/upload/Uploader",
    "sap/m/UploadCollectionParameter"
],
    function (BaseController, Controller, JSONModel, MessageBox, Uploader, UploadCollectionParameter) {
        "use strict";
        return BaseController.extend("com.sal.salhr.controller.CreateHealthInsuranceRequest", {
            onInit: function () {
                // debugger;
                this.oRouter = this.getRouter();
                this.oRouter.getRoute("HealthInsuranceRequest").attachPatternMatched(this._onObjectMatched, this);
                // this.oRouter.attachRouteMatched(this.onRouteMatched, this);
                this.mainModel = this.getOwnerComponent().getModel();
                this.mainModel.setSizeLimit(1000);
                var that = this;
                this._createItemDataModel();
                var oLocalViewModel = new JSONModel({
                    busy: false,
                    uploadAttachment: true,
                    currentDate: new Date()
                });
                this.getView().setModel(oLocalViewModel, "LocalViewModel");
            },
            _onObjectMatched: function (oEvent) {
            
                this._createItemDataModel();
                this.sParentID = oEvent.getParameter("arguments").parentMaterial;
                var sLayout = oEvent.getParameter("arguments").layout;
                this.getView().getModel("layoutModel").setProperty("/layout", sLayout);
                this._bindView("/MasterSubModules" + this.sParentID);
            },
            _bindView: function () {
                var oComponentModel = this.getComponentModel();
            
                var sKey = oComponentModel.createKey("/MasterSubModules", {
                    ID: this.sParentID
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
            _createItemDataModel: function () {
                var oModel = new JSONModel([]);
                this.getView().setModel(oModel, "HealthItemDetailsModel");
            },
            onAttach1FileSelectedForUpload: function (oEvent) {
                // keep a reference of the uploaded file
                var that = this;
                var iRowNumber = oEvent.getSource().getBindingContext("HealthItemDetailsModel").getPath();
                var oFiles = oEvent.getParameters().files;
                var fileName = oFiles[0].name;
                var fileType = oFiles[0].type;
                //code for base64/binary array 
                this._getImageData((oFiles[0]), function (base64) {
                    sap.m.MessageBox.success("Attachment Uploaded Successfully.");
                    that.getView().getModel("HealthItemDetailsModel").setProperty(iRowNumber + "/attachment1FileContent", base64);
                    that.getView().getModel("HealthItemDetailsModel").setProperty(iRowNumber + "/attachment1FileName", fileName);
                    that.getView().getModel("HealthItemDetailsModel").setProperty(iRowNumber + "/isAttach1New", true);
                });
            },
            onAttach2FileSelectedForUpload: function (oEvent) {
                var that = this;
                var iRowNumber = oEvent.getSource().getBindingContext("HealthItemDetailsModel").getPath();
                var oFiles = oEvent.getParameters().files;
                var fileName = oFiles[0].name;
                var fileType = oFiles[0].type;
                //code for base64/binary array 
                this._getImageData((oFiles[0]), function (base64) {
                    sap.m.MessageBox.success("Attachment Uploaded Successfully.");
                    that.getView().getModel("HealthItemDetailsModel").setProperty(iRowNumber + "/attachment2FileContent", base64);
                    that.getView().getModel("HealthItemDetailsModel").setProperty(iRowNumber + "/attachment2FileName", fileName);
                    that.getView().getModel("HealthItemDetailsModel").setProperty(iRowNumber + "/isAttach2New", true);
                });
            },
            onAttach3FileSelectedForUpload: function (oEvent) {
                var that = this;
                var iRowNumber = oEvent.getSource().getBindingContext("HealthItemDetailsModel").getPath();
                var oFiles = oEvent.getParameters().files;
                var fileName = oFiles[0].name;
                var fileType = oFiles[0].type;
                //code for base64/binary array 
                this._getImageData((oFiles[0]), function (base64) {
                    sap.m.MessageBox.success("Attachment Uploaded Successfully.");
                    that.getView().getModel("HealthItemDetailsModel").setProperty(iRowNumber + "/attachment3FileContent", base64);
                    that.getView().getModel("HealthItemDetailsModel").setProperty(iRowNumber + "/attachment3FileName", fileName);
                    that.getView().getModel("HealthItemDetailsModel").setProperty(iRowNumber + "/isAttach3New", true);
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
            onAddDetailsItemsPress: function (oEvent) {
                var aItemData = this.getView().getModel("HealthItemDetailsModel").getData();
                if (aItemData.length > 0) {
                    if (!this._validateMandatoryFields()) {
                        return;
                    }
                }

                var oModel = this.getViewModel("HealthItemDetailsModel");
                var oItems = oModel.getData().map(function (oItem) {
                    return Object.assign({}, oItem);
                });
                oItems.push({
                    Relationship: "",
                    DependentName: "",
                    DependentGender: "",
                    NationalID: "",
                    DependentNationalAddress: "",
                    DependentDOB: new Date(),
                    DeliveryLoc: "",
                    Scheme: "",
                    attachment1FileContent: null,
                    attachment1FileName: null,
                    attachment2FileContent: null,
                    attachment2FileName:null,
                    attachment3FileContent: null,
                    attachment3FileName:null,
                    isAttach1New: false,
                    isAttach2New: false,
                    isAttach3New: false
                });
                oModel.setData(oItems);
            },
            onDeleteItemPress: function (oEvent) {
                this.packingListObj = oEvent.getSource().getBindingContext("HealthItemDetailsModel").getObject();
                var iRowNumberToDelete = parseInt(oEvent.getSource().getBindingContext("HealthItemDetailsModel").getPath().slice("/".length));
                var aTableData = this.getViewModel("HealthItemDetailsModel").getProperty("/");
                aTableData.splice(iRowNumberToDelete, 1);
                this.getView().getModel("HealthItemDetailsModel").refresh();
            },
            onRaiseRequestPress: function () {
                if (!this._validateMandatoryFields()) {
                    return;
                }
                var oPayloadObj = this.fnGetHealthInsurancePayload(),
                    sEntityPath = "/SF_HealthInsurance";
                this.getView().setBusy(true);
                this.mainModel.create(sEntityPath, oPayloadObj, {
                    success: function (oData, oResponse) {
                        sap.m.MessageBox.success("Request Submitted Successfully.");
                        this.getView().setBusy(false);
                        this.getView().getModel().refresh();
                        this.oRouter.navTo("detail", {
                            parentMaterial: this.sParentID,
                            layout: "TwoColumnsMidExpanded"
                        });
                    }.bind(this),
                    error: function (oError) {
                        this.getView().setBusy(false);
                        // sap.m.MessageBox.error(oError.message.value);
                        sap.m.MessageBox.error(JSON.parse(oError.responseText).error.message.value);
                        this.getView().getModel().refresh();
                    }.bind(this)
                })
            },
            _validateMandatoryFields: function (itemData) {
                var bValid = true;
                var aItemData = this.getView().getModel("HealthItemDetailsModel").getData();
                if (aItemData.length > 0) {
                    for (let i = 0; i < aItemData.length; i++) {
                        if (!aItemData[i].Relationship) {
                            bValid = false;
                            sap.m.MessageBox.alert(
                                "Please select Relationship "
                            );
                            return;
                        }
                        if (!aItemData[i].DependentName) {
                            bValid = false;
                            sap.m.MessageBox.alert(
                                "Please select Dependent Name "
                            );
                            return;
                        }
                        if (!aItemData[i].DependentGender) {
                            bValid = false;
                            sap.m.MessageBox.alert(
                                "Please select Dependent Gender "
                            );
                            return;
                        }
                        if (!aItemData[i].NationalID) {
                            bValid = false;
                            sap.m.MessageBox.alert(
                                "Please select National ID "
                            );
                            return;
                        }
                        if (!aItemData[i].DependentNationalAddress) {
                            bValid = false;
                            sap.m.MessageBox.alert(
                                "Please select Dependent National Address "
                            );
                            return;
                        }

                        if (!aItemData[i].DeliveryLoc) {
                            bValid = false;
                            sap.m.MessageBox.alert(
                                "Please select Delivery Location"
                            );
                            return;
                        }

                    }
                }
                if (aItemData.length === 0) {
                    bValid = false;
                    sap.m.MessageBox.alert("Please add atleast one item");
                }
                return bValid;
            },
            fnGetHealthInsurancePayload: function () {
                var aData = this.getViewModel("HealthItemDetailsModel").getData();
                var sUserID = this.getOwnerComponent().getModel("EmpInfoModel").getData().userId;
                var sEffectiveStartDate = this.getView().byId("idEffectiveStartDateDate").getDateValue();
                var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" }),
                    sEffectiveStartDate = dateFormat.format(new Date(sEffectiveStartDate));
                sEffectiveStartDate = sEffectiveStartDate + "T00:00:00";
                var cust_healthInsuranceDetails = aData.map(function (item) {
                    return {
                        cust_address: item.DependentNationalAddress,
                        cust_dateOfBirth: new Date(item.DependentDOB),
                        cust_dependentName: item.DependentName,
                        cust_healthInsurance_User: sUserID,
                        cust_healthInsurance_effectiveStartDate: sEffectiveStartDate,
                        cust_location: item.DeliveryLoc,
                        cust_nationalID: item.NationalID,
                        cust_gender: item.DependentGender,
                        cust_relationship: item.Relationship,
                        cust_scheme: item.Scheme,
                        attachment1FileContent :item.attachment1FileContent,
                        attachment1FileName : item.attachment1FileName,
                        isAttach1New : item.isAttach1New,
                        attachment1UserId : sUserID,
                        attachment2FileContent : item.attachment2FileContent,
                        attachment2FileName :item.attachment2FileName,
                        isAttach2New : item.isAttach2New,
                        attachment2UserId : sUserID,
                        attachment3FileContent : item.attachment3FileContent,
                        attachment3FileName : item.attachment3FileName,
                        isAttach3New : item.isAttach3New,
                        attachment3UserId : sUserID
                    }

                   
                });
                return {
                    "User": sUserID,
                    "effectiveStartDate": sEffectiveStartDate,
                    "cust_healthInsuranceDetails": cust_healthInsuranceDetails
                };
            },
            OnLiveChangeValue: function (oEve) {
                var sValue = oEve.getSource().getValue();
                var bValid = true;
                if (sValue === "") {
                    this.byId("idValueINP").setValueState("Error");
                    this.byId("idValueINP").setValueStateText(
                        "Please enter Value"
                    );
                    bValid = false;
                } else {
                    this.byId("idValueINP").setValueState("None");
                    this.byId("idValueINP").setValueStateText(null);
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
                this.onHealthInsuranceResetPress();
            },
            onHealthInsuranceResetPress: function () {
                this._createItemDataModel();
                this.getView().getModel("LocalViewModel").setProperty("/currentDate", new Date());
                this.getView().getModel("LocalViewModel").refresh();
            }
        });
    });      
