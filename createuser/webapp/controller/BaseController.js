sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/BusyIndicator",
    "sap/m/MessageBox"
], function (Controller, BusyIndicator, MessageBox) {
    "use strict";

    return Controller.extend("com.sal.salhr.createuser.controller.BaseController", {
        /**
         * Convenience method for accessing the router.
         * @public
         * @returns {sap.ui.core.routing.Router} the router for this component
         */
        getRouter: function () {
            return sap.ui.core.UIComponent.getRouterFor(this);
        },

        addContentDensityClass: function () {
            return this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
        },
        /**
         * Convenience method for getting the view model by name.
         * @public
         * @param {string} [sName] the model name
         * @returns {sap.ui.model.Model} the model instance
         */
        getViewModel: function (sName) {
            return this.getView().getModel(sName);
        },

        getComponentModel: function () {
            return this.getOwnerComponent().getModel();
        },

        /**
         * Convenience method for setting the view model.
         * @public
         * @param {sap.ui.model.Model} oModel the model instance
         * @param {string} sName the model name
         */
        setModel: function (oModel, sName) {
            return this.getView().setModel(oModel, sName);
        },

        /**
         * Getter for the resource bundle.
         * @public
         * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
         */
        getResourceBundle: function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        //for controlling global busy indicator        
        presentBusyDialog: function () {
            BusyIndicator.show();
        },

        dismissBusyDialog: function () {
            BusyIndicator.hide();
        },

        _getTicketData: function (sId) {
            var idFILTER = new sap.ui.model.Filter({
                path: "ID",
                operator: sap.ui.model.FilterOperator.EQ,
                value1: sId
            });

            var filter = [];

            filter.push(idFILTER);
            var bIsUserManager = this.getOwnerComponent().getModel("EmpInfoModel").getProperty("/IsUserManager").toString();
            var oComponentModel = this.getComponentModel();
            oComponentModel.read("/Tickets", {
                filters: [filter],
                urlParameters: {
                    "IsUserManager": bIsUserManager
                },
                success: function (oData) {
                    this._bindView(oData);
                }.bind(this),
                error: function (oError) {
                    if (JSON.parse(oError.responseText).error.message.value.indexOf("{") === 0)
                        MessageBox.error(JSON.parse(JSON.parse(oError.responseText).error.message.value).error.message.value.split("]")[1]);
                    else {
                        MessageBox.error(JSON.parse(oError.responseText).error.message.value);
                    }
                }
            });
        },

        /**
        * Adds a history entry in the FLP page history
        * @public
        * @param {object} oEntry An entry object to add to the hierachy array as expected from the ShellUIService.setHierarchy method
        * @param {boolean} bReset If true resets the history before the new entry is added
        */
        addHistoryEntry: (function () {
            var aHistoryEntries = [];

            return function (oEntry, bReset) {
                if (bReset) {
                    aHistoryEntries = [];
                }

                var bInHistory = aHistoryEntries.some(function (entry) {
                    return entry.intent === oEntry.intent;
                });

                if (!bInHistory) {
                    aHistoryEntries.push(oEntry);
                    this.getOwnerComponent().getService("ShellUIService").then(function (oService) {
                        oService.setHierarchy(aHistoryEntries);
                    });
                }
            };
        }),

        fnGetEmpInfo: function (sExternalCode, sParentID) {
            this.mainModel = this.getOwnerComponent().getModel();
            var sKey = this.getView().getModel().createKey("/EmpInfo", {
                userId: sExternalCode
            });
            this.sParentID = sParentID;
            this.getView().setBusy(true);
            this.mainModel.read(sKey, {
                success: function (oData) {
                    this.getView().setBusy(false);
                    switch (this.sParentID) {
                        case "2":
                            this.fnSetCreateBusinessTripModel(oData);
                            break;

                        // Airport Travel Pass Request Module
                        case "6":
                            this.fnSetCreateAirpassLocalModel(oData);
                            break;

                        // Business Card Request Module
                        case "5":
                            this.fnSetCreateBusinessCardLocalModel(oData);
                            break;
                    }
                }.bind(this),
                error: function (oError) {
                    this.getView().setBusy(false);
                    if (JSON.parse(oError.responseText).error.message.value.indexOf("{") === 0)
                        MessageBox.error(JSON.parse(JSON.parse(oError.responseText).error.message.value).error.message.value.split("]")[1]);
                    else {
                        MessageBox.error(JSON.parse(oError.responseText).error.message.value);
                    }
                }.bind(this)
            })
        },

        fnValidateDateValue: function (oEvent) {
            if (oEvent.getParameter("valid")) {
                oEvent.getSource().setValueState("None");
            } else {
                oEvent.getSource().setValueState("Error");
                oEvent.getSource().setValueStateText("Please enter a valid date value");
            }
        },

        fnCalculateUserAge: function (oDateofbirth) {
            var iBirthYear = oDateofbirth.getFullYear(),
                iBirthMonth = oDateofbirth.getMonth(),
                iBirthDay = oDateofbirth.getDate(),
                oTtodayDate = new Date(),
                iTodayYear = oTtodayDate.getFullYear(),
                iTodayMonth = oTtodayDate.getMonth(),
                iTodayDay = oTtodayDate.getDate(),
                iAge = iTodayYear - iBirthYear;

            if (iTodayMonth < (iBirthMonth - 1)) {
                iAge--;
            }
            if (((iBirthMonth - 1) == iTodayMonth) && (iTodayDay < iBirthDay)) {
                iAge--;
            }

            return iAge;
        },

        onApproveRequest: function (sWFRequestId) {
            this.getView().setBusy(true);

            // var sEntityPath = "/approveWfRequest?wfRequestId=" + sWFRequestId + "L";

            this.getView().getModel().create("/approveWfRequest", null, {
                urlParameters: {
                    "wfRequestId": sWFRequestId + "L"
                },
                success: function (oData) {
                    this.getView().setBusy(false);
                    MessageBox.success("Request Approved Successfully.");
                    this.getView().getModel().refresh();
                    this.oRouter.navTo("detail", {
                        parentMaterial: this.sParentID,
                        layout: "TwoColumnsMidExpanded"
                    });
                }.bind(this),
                error: function (oError) {
                    this.getView().setBusy(false);
                    if (JSON.parse(oError.responseText).error.message.value.indexOf("{") === 0)
                        MessageBox.error(JSON.parse(JSON.parse(oError.responseText).error.message.value).error.message.value.split("]")[1]);
                    else {
                        MessageBox.error(JSON.parse(oError.responseText).error.message.value);
                    }
                    this.getView().getModel().refresh();
                }.bind(this)
            });
        },

        onRejectRequest: function (sWFRequestId) {
            this.getView().setBusy(true);

            // var sEntityPath = "/rejectWfRequest?wfRequestId=" + sWFRequestId + "L";

            this.getView().getModel().create("/rejectWfRequest", null, {
                urlParameters: {
                    "wfRequestId": sWFRequestId + "L"
                },
                success: function (oData) {
                    MessageBox.success("Request Rejected Successfully.");
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
                        MessageBox.error(JSON.parse(JSON.parse(oError.responseText).error.message.value).error.message.value.split("]")[1]);
                    else {
                        MessageBox.error(JSON.parse(oError.responseText).error.message.value);
                    }
                    this.getView().getModel().refresh();
                }.bind(this)
            });
        },
        onSendBackRequest: function (sWFRequestId) {
            this.getView().setBusy(true);

            // var sEntityPath = "/rejectWfRequest?wfRequestId=" + sWFRequestId + "L";

            this.getView().getModel().create("/sendbackWfRequest", null, {
                urlParameters: {
                    "wfRequestId": sWFRequestId + "L"
                },
                success: function (oData) {
                    MessageBox.success("Request Rejected Successfully.");
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
                        MessageBox.error(JSON.parse(JSON.parse(oError.responseText).error.message.value).error.message.value.split("]")[1]);
                    else {
                        MessageBox.error(JSON.parse(oError.responseText).error.message.value);
                    }
                    this.getView().getModel().refresh();
                }.bind(this)
            });
        }
    });
});