sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/ui/Device",
    "sap/ui/model/Filter"
],

    function (BaseController, JSONModel, Fragment, Device, Filter) {
        "use strict";
        return BaseController.extend("com.sal.salhr.controller.CreateAdditionalPaymentRequest", {
            onInit: function () {

                this.oRouter = this.getRouter();
                this.oRouter.getRoute("AdditionalPaymentRequest").attachPatternMatched(this._onObjectMatched, this);
                this.mainModel = this.getOwnerComponent().getModel();
                this.mainModel.setSizeLimit(1000);


                var oLocalViewModel = new JSONModel({
                    busy: false,
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
                this.EmpInfoObj = this.getOwnerComponent().getModel("EmpInfoModel").getData();
                this.managerID = this.EmpInfoObj.userId;
            },


            onRaiseRequestPress: function () {
                if (!this._validateMandatoryFields()) {

                    return;
                }
                var oPayloadObj = this.fnGetAdditionalPaymentPayload(),
                    sEntityPath = "/SF_Pay";



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

            fnGetAdditionalPaymentPayload: function () {
                var sUserID = null;
                var oEmployeeNameINP = this.getView().byId("idEmployeeNameINP");
                if (this.getOwnerComponent().getModel("EmpInfoModel").getProperty("/IsUserManager") === true) {
                    sUserID = oEmployeeNameINP.getValue();
                } else {
                    sUserID = this.getOwnerComponent().getModel("EmpInfoModel").getData().userId;
                }

                var sEffectiveStartDate =  this.getFormattedDateValue("idIssueDate");

               
                var sCurrency = this.getView().byId("idInpCurrencyCode").getSelectedKey();
                var sType = this.getView().byId("idInpType").getSelectedKey();
                // var saltCostCenter = this.getView().byId("idInpAltCostCenter").getSelectedKey();
                var sValue = this.getView().byId("idValueINP").getValue();
              
                return {
                    "payComponentCode": sType,
                    "userId": sUserID,
                    "payDate": sEffectiveStartDate,
                    "notes": null,
                    "alternativeCostCenter": "",
                    "currencyCode": sCurrency,
                    "value": sValue
                };
            },

            _validateMandatoryFields: function () {

                // validate leave application for other user Field
                var oEmployeeNameINP = this.getView().byId("idEmployeeNameINP");
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


                this.getView().byId("idValueINP").setValue("");
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
                // sValue =   sValue.replace(/\s+/g, '');
                if (sValue && sValue.length > 0 && sValue.indexOf(" ") > 0) {
                  sValue = sValue.trim().split(" ");
                } else if (sValue && sValue.length > 0) {
                  sValue = [sValue.trim()];
                }
      
                var onameFilter = [];
      
                for (var i = 0; i < sValue.length; i++) {
                  var keyWord = sValue[i];
                  onameFilter.push(
                    new Filter({
                      path: "userId",
                      operator: "Contains",
                      caseSensitive: false,
                      value1: keyWord.trim(),
                    })
                  );
      
                  onameFilter.push(
                    new Filter({
                      path: "firstName",
                      operator: "Contains",
                      value1: keyWord.trim(),
                      caseSensitive: false,
                    })
                  );
      
                  onameFilter.push(
                    new Filter({
                      path: "lastName",
                      operator: "Contains",
                      value1: keyWord.trim(),
                      caseSensitive: false,
                    })
                  );
                }
      
                var commonFilter = [
                  new Filter({
                    path: "manager/userId",
                    operator: "EQ",
                    value1: this.managerID,
                  }),
                ];
      
                if (onameFilter.length > 0) {
                  commonFilter.push(new Filter(onameFilter, false));
                }
      
                var oFilter = new Filter(commonFilter, true);
      
                oEvent.getSource().getBinding("items").filter([oFilter]);
              },
            onValueHelpClose: function (oEvent) {
                var oSelectedItem = oEvent.getParameter("selectedItem");
                oEvent.getSource().getBinding("items").filter([]);
                if (!oSelectedItem) {
                    return;
                }
                this.byId("idEmployeeNameINP").setValue(oSelectedItem.getBindingContext().getObject().userId);
            }
        });
    });      
