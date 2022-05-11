sap.ui.define([
    "./BaseController",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/upload/Uploader",
    "sap/m/UploadCollectionParameter",
    "sap/ui/core/Fragment",
    "sap/ui/Device"
],

    function (BaseController, Controller, JSONModel, MessageBox, Uploader, UploadCollectionParameter,Fragment,Device) {
        "use strict";
        return BaseController.extend("com.sal.salhr.controller.CreateEmployeeTerminateRequest", {
            onInit: function () {
                debugger;
                this.oRouter = this.getRouter();
                this.oRouter.getRoute("EmployeeTerminateRequest").attachPatternMatched(this._onObjectMatched, this);
                // this.oRouter.attachRouteMatched(this.onRouteMatched, this);
                this.mainModel = this.getOwnerComponent().getModel();
                this.mainModel.setSizeLimit(1000);

                var that = this;

                this.sReturnDate = new Date();
                this.sRequesting = 1;
                this.sReturnDate.setDate(new Date().getDate() + 1);
                if (this.sReturnDate.getDay() === 5) {
                    this.sReturnDate.setDate(this.sReturnDate.getDate() + 2);

                } else if (this.sReturnDate.getDay() === 6) {
                    this.sReturnDate.setDate(this.sReturnDate.getDate() + 1);

                } else {
                    this.sRequesting = 1;
                }
                var oLocalViewModel = new JSONModel({
                    startDate: new Date(),
                    endDate: new Date(),
                    returnDate: this.sReturnDate,
                    requestDay: this.sRequesting,
                    availBal: false,
                    recurringAbs: false,
                    busy: false,
                    uploadAttachment: true,
                    currentDate: new Date()
                });

                this.getView().setModel(oLocalViewModel, "LocalViewModel");




            },

            _onObjectMatched: function (oEvent) {
                this.onResetPress();
                this.sParentID = oEvent.getParameter("arguments").parentMaterial;
                var sLayout = oEvent.getParameter("arguments").layout;

                this.getView().getModel("layoutModel").setProperty("/layout", sLayout);

                this._bindView("/MasterSubModules" + this.sParentID);


            },
            _bindView: function () {

                var oComponentModel = this.getComponentModel();
                //    var sTickets = sObjectPath + "/tickets";
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


            onRaiseRequestPress: function () {
                // if (!this._validateMandatoryFields()) {

                //     return;
                // }
                var oPayloadObj = this.fnGetEmployeeTerminatePayload(),
                    sEntityPath = "/SF_EmpEmploymentTermination";



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
                        sap.m.MessageBox.error(JSON.parse(JSON.parse(oError.responseText).error.message.value).error.message.value.split("]")[1]);
                        this.getView().getModel().refresh();


                    }.bind(this)
                })
            },

            fnGetEmployeeTerminatePayload: function () {

                var sUserID = null;
                var oEmployeeNameINP = this.getView().byId("idEmployeeNameTerrminateRequestINP");
                if (this.getOwnerComponent().getModel("EmpInfoModel").getProperty("/IsUserManager") === true) {
                    sUserID = oEmployeeNameINP.getValue();
                } else {
                    sUserID = this.getOwnerComponent().getModel("EmpInfoModel").getData().userId;
                }

                var scustomDate6 = this.getView().byId("idResignationDate").getDateValue();
                var sBonusDate = this.getView().byId("idBonusExpDateDate").getDateValue();
                var sEndDate = this.getView().byId("idTerminationDate").getDateValue();
                var sNotes = this.getView().byId("idNotes").getValue();
                var sOKToRetire = this.getView().byId("idOKToRetire").getSelectedIndex();
                var sEOSBenefit = this.getView().byId("idEOSBenefit").getSelectedIndex();
                sOKToRetire = sOKToRetire === 0 ? true : false;
                sEOSBenefit = sEOSBenefit === 0 ? true : false;
                var sTerminationReason = this.getView().byId("idTerminationReasonINP").getSelectedKey();
                var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" }),
                    scustomDate6 = dateFormat.format(new Date(scustomDate6));
                scustomDate6 = scustomDate6 + "T00:00:00";
                sEndDate = dateFormat.format(new Date(sEndDate));
                sEndDate = sEndDate + "T00:00:00";
                sBonusDate = dateFormat.format(new Date(sBonusDate));
                sBonusDate = sBonusDate + "T00:00:00";
                return {
                    "userId": sUserID,
                    "personIdExternal": sUserID,
                    "customDate6": scustomDate6,
                    "endDate": sEndDate,
                    "eventReason": sTerminationReason,
                    "okToRehire": sOKToRetire,
                    "eligibleForSalContinuation": sEOSBenefit,
                    "bonusPayExpirationDate": sBonusDate,
                    "notes": sNotes,
                    "customString19": "TERSR04"
                };
            },

            _validateMandatoryFields: function () {

                // validate leave application for other user Field
                var oEmployeeNameINP = this.getView().byId("idEmployeeNameTerrminateRequestINP");
                if (this.getOwnerComponent().getModel("EmpInfoModel").getProperty("/IsUserManager") === true) {
                    if (!oEmployeeNameINP.getValue()) {
                        oEmployeeNameINP.setValueState("Error");
                        oEmployeeNameINP.setValueStateText("Please select user for which leave application will be created.");
                        sValidationErrorMsg = "Please fill the all required fields.";
                        return;
                    } else {
                        oEmployeeNameINP.setValueState("None");
                    }
                }

                var bValid = true;
                if (this.byId("idValueINP").getValue() === "") {
                    this.byId("idValueINP").setValueState("Error");
                    this.byId("idValueINP").setValueStateText(
                        "Please enter Value"
                    );
                    bValid = false;
                } else {
                    this.byId("idValueINP").setValueState("None");
                    this.byId("idValueINP").setValueStateText(null);
                }

                return bValid;
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

                this.onAdditionalPymntResetPress();




            },
            onAdditionalPymntResetPress: function () {


                this.getView().byId("idTerminationReasonINP").setSelectedKey("");
                this.getView().byId("idEOSBenefit").setSelectedIndex(null);
                this.getView().byId("idOKToRetire").setSelectedIndex(null);
                this.getView().getModel("LocalViewModel").setProperty("/currentDate", new Date());
                this.getView().getModel("LocalViewModel").refresh();

            },

            onValueHelpRequest: function () {
                var oView = this.getView();

                if (!this._oEmpF4Dialog) {
                    this._oEmpF4Dialog = Fragment.load({
                        id: oView.getId(),
                        name: "com.sal.salhr.Fragments.PRNValueHelp",
                        controller: this
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        if (Device.system.desktop) {
                            oDialog.addStyleClass("sapUiSizeCompact");
                        }
                        return oDialog;
                    });
                }

                this._oEmpF4Dialog.then(function (oDialog) {
                    var oList = oDialog.getAggregation("_dialog").getAggregation("content")[1];
                    oDialog.open();
                }.bind(this));
            },

            onValueHelpSearch: function (oEvent) {
                var sValue = oEvent.getParameter("value");
                var suserIdFilter = new Filter({
                    path: "userId",
                    operator: FilterOperator.EQ,
                    value1: sValue.trim()
                });
                var sfirstNameFilter = new Filter({
                    path: "firstName",
                    operator: FilterOperator.EQ,
                    value1: sValue.trim()
                });
                var aFilter = [];
                aFilter.push(suserIdFilter, sfirstNameFilter);
                oEvent.getSource().getBinding("items").filter(aFilter);
            },

            onValueHelpClose: function (oEvent) {
                var oSelectedItem = oEvent.getParameter("selectedItem");
                oEvent.getSource().getBinding("items").filter([]);
                if (!oSelectedItem) {
                    return;
                }
                this.byId("idEmployeeNameTerrminateRequestINP").setValue(oSelectedItem.getBindingContext().getObject().userId);
            }

        });
    });      
