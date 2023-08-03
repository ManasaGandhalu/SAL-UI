sap.ui.define([
    "./BaseController",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/upload/Uploader",
    "sap/m/UploadCollectionParameter",
    "sap/ui/core/Fragment",
    "sap/ui/Device",
    "sap/ui/model/Filter"
],

    function (BaseController, Controller, JSONModel, MessageBox, Uploader, UploadCollectionParameter,Fragment,Device,Filter) {
        "use strict";
        return BaseController.extend("com.sal.salhr.controller.CreateEmployeeTerminateRequest", {
            onInit: function () {
                this.oRouter = this.getRouter();
                this.oRouter.getRoute("EmployeeTerminateRequest").attachPatternMatched(this._onObjectMatched, this);
             
                this.mainModel = this.getOwnerComponent().getModel();
                this.mainModel.setSizeLimit(1000);

                var that = this;

               
                var oLocalViewModel = new JSONModel({
                    busy: false,
                    uploadAttachment: true,
                    currentDate: new Date(),
                    managerId: "12345"
                });

                this.getView().setModel(oLocalViewModel, "LocalViewModel");




            },

            _onObjectMatched: function (oEvent) {
                this.onResetPress();
                this.sParentID = oEvent.getParameter("arguments").parentMaterial;
                var sLayout = oEvent.getParameter("arguments").layout;

                this.getView().getModel("layoutModel").setProperty("/layout", sLayout);

                this._bindView("/MasterSubModules" + this.sParentID);

                this.EmpInfoObj = this.getOwnerComponent().getModel("EmpInfoModel").getData();
                this.managerID = this.EmpInfoObj.userId;
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


            onRaiseRequestPress: function () {
                if (!this._validateMandatoryFields()) {

                    return;
                }
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
                        sap.m.MessageBox.error(this.parseResponseError(oError.responseText));
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
                var bValid = true;
                // validate leave application for other user Field
                var sValidationErrorMsg = "";
                var oEmployeeNameINP = this.getView().byId("idEmployeeNameTerrminateRequestINP");
                if (this.getOwnerComponent().getModel("EmpInfoModel").getProperty("/IsUserManager") === true) {
                    if (!oEmployeeNameINP.getValue()) {
                        oEmployeeNameINP.setValueState("Error");
                        oEmployeeNameINP.setValueStateText("Please select the employee to terminate.");
                        sValidationErrorMsg = "Please fill the all required fields.";
                        bValid = false;
                    } else {
                        oEmployeeNameINP.setValueState("None");
                    }
                }

                var sEndDate = this.getView().byId("idTerminationDate");
                // Validate Effective Start Date
                if (!sEndDate.getValue()) {
                    sEndDate.setValueState("Error");
                    sEndDate.setValueStateText(
                        "Please select termination date."
                    );
                    sValidationErrorMsg = "Please fill the all required fields.";
                    bValid = false;
                } else {
                    sEndDate.setValueState("None");
                }

                if (this.byId("idTerminationReasonINP").getValue() === "") {
                    this.byId("idTerminationReasonINP").setValueState("Error");
                    this.byId("idTerminationReasonINP").setValueStateText(
                        "Please select termination reason."
                    );
                    bValid = false;
                } else {
                    this.byId("idTerminationReasonINP").setValueState("None");
                    this.byId("idTerminationReasonINP").setValueStateText(null);
                }

                return bValid;
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
                    var userId = this.managerID;
                    var sUserIDFilter = new sap.ui.model.Filter({
                        path: "manager/userId",
                        operator: sap.ui.model.FilterOperator.EQ,
                        value1: userId
                    });

                    oList.getBinding("items").filter([sUserIDFilter]);
                    oDialog.open();
                }.bind(this));
            },

            onValueHelpSearch: function (oEvent) {
                var sValue = oEvent.getParameter("value");
                if (sValue) {
                    var oFilter = new Filter(
                        [
                            new Filter({
                                path: "manager/userId",
                                operator: "EQ",
                                value1: this.managerID
                            }),

                            new Filter([
                                new Filter({
                                    path: "userId",
                                    operator: "Contains",
                                    caseSensitive: false,
                                    value1: sValue.trim()
                                }),
                                new Filter({
                                    path: "firstName",
                                    operator: "Contains",
                                    value1: sValue.trim(),
                                    caseSensitive: false
                                }),
                                new Filter({
                                    path: "lastName",
                                    operator: "Contains",
                                    value1: sValue.trim(),
                                    caseSensitive: false
                                })
                            ], false),
                        ],
                        true
                    );
                    oEvent.getSource().getBinding("items").filter(oFilter);
                }
                else {
                    var userId = this.managerID;
                    var sUserIDFilter = new sap.ui.model.Filter({
                        path: "manager/userId",
                        operator: sap.ui.model.FilterOperator.EQ,
                        value1: userId
                    });

                    oEvent.getSource().getBinding("items").filter([sUserIDFilter]);
                }
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
