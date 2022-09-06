sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel"
],
    function (BaseController, JSONModel) {
        "use strict";
        return BaseController.extend("com.sal.salhr.controller.CreateRequest", {
            onInit: function () {
                this.oRouter = this.getRouter();
                this.oRouter.getRoute("IDCardRequest").attachPatternMatched(this._onObjectMatched, this);
                this.mainModel = this.getOwnerComponent().getModel();
               

               

                var oLocalViewModel = new JSONModel({
                    busy: false,
                    currentDate: new Date()
                });

                this.getView().setModel(oLocalViewModel, "LocalViewModel");
            },

            _onObjectMatched: function (oEvent) {
                this.sParentID = oEvent.getParameter("arguments").parentMaterial;
                var sLayout = oEvent.getParameter("arguments").layout;
                this.getView().getModel("layoutModel").setProperty("/layout", sLayout);

                this._bindView();
            },

            _bindView: function () {
                var sUserID = this.getOwnerComponent().getModel("EmpInfoModel").getData().userId;
                var sKey = this.getComponentModel().createKey("/EmpInfo", {
                    userId: sUserID
                });
                this.getView().setBusy(true);

                this.getView().bindElement({
                    path: sKey,
                    parameters: {
                        custom: {
                            "moreInfo": "true"
                        }
                    },
                    events: {
                        change: function (oEvent) {
                            var oContextBinding = oEvent.getSource();
                            oContextBinding.refresh(false);
                        }.bind(this),
                        dataRequested: function () {
                        }.bind(this),
                        dataReceived: function () {
                            this.getView().setBusy(false);
                        }.bind(this)
                    }
                });
            },

            onRaiseRequestPress: function () {
                var sEntityPath = "/SF_IDReplacement",
                    oPayloadObj = this.fnGetIDReplacementRequestPayload();

                this.getView().setBusy(true);
                this.mainModel.create(sEntityPath, oPayloadObj, {
                    success: function () {
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
                        if (JSON.parse(oError.responseText).error.message.value.indexOf("{") === 0)
                            sap.m.MessageBox.error(JSON.parse(JSON.parse(oError.responseText).error.message.value).error.message.value.split("]")[1]);
                        else {
                            sap.m.MessageBox.error(JSON.parse(oError.responseText).error.message.value);
                        }
                        this.getView().getModel().refresh();
                    }.bind(this)
                })
            },
            getFormattedDateValue:  function(idDate) {
                if(!idDate) {
                    return null;
                }
                var date = this.getView().byId(idDate).getText();
                var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" }),
                date = dateFormat.format(new Date(date));
                date += "T00:00:00";
                return date;
            },

            fnGetIDReplacementRequestPayload: function () {
                var oDataObj = this.getView().getBindingContext().getObject(),
                    sEffectiveStartDate = this.getFormattedDateValue("idEffectDatePicker");

                return {
                    "User": oDataObj.userId,
                    "effectiveStartDate": sEffectiveStartDate,
                    "cust_idReplacementDetails": {
                        "cust_bloodGroup": oDataObj.bloodGroup,
                        "cust_idReplacement_effectiveStartDate": sEffectiveStartDate,

                        "externalCode": "46986",
                        "cust_idReplacement_User": oDataObj.userId,
                        "cust_lname": oDataObj.lastName,
                        "cust_jobTitle": oDataObj.jobTitle,
                        "cust_payGrade": oDataObj.payGrade,
                        "cust_emergencyPhone": oDataObj.emergencyNumber,
                        "cust_fname": oDataObj.firstName,
                        "cust_nationality": oDataObj.nationality,
                        "cust_sname": oDataObj.middleName,
                        "cust_prn": oDataObj.userId,
                        "cust_seniorityDate": new Date(oDataObj.seniorityDate)
                    }
                };
            },

            onCreateCancelPress: function () {
                debugger;
                this.oRouter.navTo("detail", {
                    parentMaterial: this.sParentID,
                    layout: "TwoColumnsMidExpanded"
                });
                this.mainModel.refresh();
            }
        });
    });      
