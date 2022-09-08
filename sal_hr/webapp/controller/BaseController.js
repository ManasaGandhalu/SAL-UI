sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/BusyIndicator",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel"
], function (Controller, BusyIndicator, MessageBox, Fragment, JSONModel) {
    "use strict";

    return Controller.extend("com.sal.salhr.controller.BaseController", {
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
            this.getView().setBusy(true);
            oComponentModel.read("/Tickets", {
                filters: [filter],
                urlParameters: {
                    "IsUserManager": bIsUserManager
                },
                success: function (oData) {
                    // this.getView().setBusy(false);
                    this._getTicketWorkflowParticipant(oData);
                    
                }.bind(this),
                error: function (oError) {
                    this.getView().setBusy(false);
                    if (JSON.parse(oError.responseText).error.message.value.indexOf("{") === 0)
                        MessageBox.error(JSON.parse(JSON.parse(oError.responseText).error.message.value).error.message.value.split("]")[1]);
                    else {
                        MessageBox.error(JSON.parse(oError.responseText).error.message.value);
                    }
                }.bind(this),
            });
        },

        _getTicketWorkflowParticipant:function(oData) {
            var workflowReqId = oData.results[0].workflowRequestId;
            var ticketId = oData.results[0].ID;
            var oComponentModel = this.getComponentModel();
            oComponentModel.read("/TicketWorkflowParticipant", {
                urlParameters: {
                    // "IsUserManager": bIsUserManager
                    $filter:`ticketId eq guid'${ticketId}' and workflowRequestId eq '${workflowReqId}'`,
                    $orderby:'stepNumber'
                },
                success: function (oTicketWorkflowParticipantData) {
                    // setting status for SKIPPED workflow steps
                    var pIndex = oTicketWorkflowParticipantData.results.findIndex(o => o.status = "PENDING");
                    var nIndex = oTicketWorkflowParticipantData.results.findIndex(o => o.status != "PENDING");
                    if(pIndex >= 0 && pIndex < nIndex) {
                        for (let i = pIndex; i < nIndex; i++) {
                            oTicketWorkflowParticipantData.results[i].status = 'SKIPPED';
                        }
                    }

                    oData.results[0].ticketWorkflowParticipants = oTicketWorkflowParticipantData;
                    this.getView().setBusy(false);
                    this._bindView(oData);
                    window.setTimeout(this.setTimelineSteps.bind(this), 200);
                }.bind(this),
                error: function (oError) {
                    debugger;
                    this.getView().setBusy(false);
                    if (JSON.parse(oError.responseText).error.message.value.indexOf("{") === 0)
                        MessageBox.error(JSON.parse(JSON.parse(oError.responseText).error.message.value).error.message.value.split("]")[1]);
                    else {
                        MessageBox.error(JSON.parse(oError.responseText).error.message.value);
                    }
                }
            });

        },
        setTimelineSteps: function() {
            var processFlows = $(".ticketProcessFlow span[data-sap-ui-icon-content]");
            $.each(processFlows, function(index, elem) {
                elem.setAttribute("data-sap-ui-icon-content", elem.parentElement.ariaPosInSet);
            });
        },
        _getSFUser: function (sId) {
            var idFILTER = new sap.ui.model.Filter({
                path: "userId",
                operator: sap.ui.model.FilterOperator.EQ,
                value1: sId
            });

            var filter = [];

            filter.push(idFILTER);
         
            var oComponentModel = this.getComponentModel();
            this.getView().setBusy(true);
            oComponentModel.read("/SF_User('"+sId+"')", {
                urlParameters: {
                    "$select": "userId,firstName,lastName,defaultFullName"
                },
                // filters: [filter],
                success: function (oData) {
                    this.getView().setBusy(false);
                    this.getOwnerComponent().getModel("EmpInfoModel").setProperty("/EmpFullName", oData.results[0].defaultFullName)
                }.bind(this),
                error: function (oError) {
                    this.getView().setBusy(false);
                    if (JSON.parse(oError.responseText).error.message.value.indexOf("{") === 0)
                        MessageBox.error(JSON.parse(JSON.parse(oError.responseText).error.message.value).error.message.value.split("]")[1]);
                    else {
                        MessageBox.error(JSON.parse(oError.responseText).error.message.value);
                    }
                }.bind(this)
            });
        },

        fnDownloadAttachment:function(fileContent,mimeType,fName,fileext){

            var decodedContent = atob(fileContent);
            var byteArray = new Uint8Array(decodedContent.length)
            for (var i = 0; i < decodedContent.length; i++) {
                byteArray[i] = decodedContent.charCodeAt(i);
            }
            var blob = new Blob([byteArray.buffer], { type: mimeType });
            var _url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = _url;
            a.download = fName + "." + fileext;
            a.dispatchEvent(new MouseEvent('click'));

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
        fnGetBusinessTripEmpInfo: function(sExternalCode) {
            debugger;
            this.empModel = this.getOwnerComponent().getModel();
            var sKey = this.getView().getModel().createKey("/EmpInfo", {
                userId: sExternalCode
            });
            this.getView().setBusy(true);
            this.empModel.read(sKey, {
                urlParameters: {
                    "moreInfo": true
                },
                success: function (oData) {
                    this.fnSetEmployeeBusinessTripModel(oData);
                }.bind(this),
                error: function (oError) {
                    this.getView().setBusy(false);
                    if (JSON.parse(oError.responseText).error.message.value.indexOf("{") === 0)
                        MessageBox.error(JSON.parse(JSON.parse(oError.responseText).error.message.value).error.message.value.split("]")[1]);
                    else {
                        MessageBox.error(JSON.parse(oError.responseText).error.message.value);
                    }
                }.bind(this)
            });
        },
                                   

        fnGetEmpInfo: function (sExternalCode, sParentID) {
            this.mainModel = this.getOwnerComponent().getModel();
            var sKey = this.getView().getModel().createKey("/EmpInfo", {
                userId: sExternalCode
            });
            this.sParentID = sParentID;
            this.getView().setBusy(true);
            this.mainModel.read(sKey+"?moreInfo=true", {
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

        onWithdrawRequest: function (sWFRequestId) {
            this.getView().setBusy(true);

            // var sEntityPath = "/rejectWfRequest?wfRequestId=" + sWFRequestId + "L";

            this.getView().getModel().create("/withdrawWfRequest", null, {
                urlParameters: {
                    "wfRequestId": sWFRequestId + "L"
                },
                success: function (oData) {
                    MessageBox.success("Record Deleted Successfully.");
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
                
                    this.oRouter.navTo("detail", {
                        parentMaterial: this.sParentID,
                        layout: "TwoColumnsMidExpanded"
                    });
                    this.getView().getModel().refresh();
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
        parseResponseError: function(responseText) {
            try {
                if(typeof responseText == 'object') {
                    responseText = responseText.error.message.value;
                    return this.parseResponseError(responseText);
                } else if(typeof responseText == 'string' && responseText.indexOf("{") == 0) {
                    responseText = JSON.parse(responseText).error.message.value;
                    return this.parseResponseError(responseText);
                }
                return responseText.replace(/\[([^\[\]]*)\]/,"");
            } catch (err) {
                console.log(err);
                return "Unknown error occured, Please try after sometime.";
            }
        },
        getFormattedDateValue:  function(idDate) {
            if(!idDate) {
                return null;
            }
            var date = this.getView().byId(idDate).getDateValue();
            var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" }),
            date = dateFormat.format(new Date(date));
            date += "T00:00:00";
            return date;
        },
        navToDetailDetail: function(parentId, childId, layout) {
               switch (parentId) {
           
                    
                // Leave Request Module
                case "1":
                    this.oRouter.navTo("LeaveRequestDetail", {
                        parentMaterial: parentId,
                        childModule: childId,
                        layout: layout? layout : "ThreeColumnsMidExpanded"
                    })
                    break;
                // Health Insurance Request Module
                case "3":
                    this.oRouter.navTo("HealthInsuranceRequestDetail", {
                        parentMaterial: parentId,
                        childModule: childId,
                        layout: layout? layout : "ThreeColumnsMidExpanded"
                    })
                    break;

                // Additional Payment Request Module
                case "10":
                    this.oRouter.navTo("AdditionalPaymentRequestDetail", {
                        parentMaterial: parentId,
                        childModule: childId,
                        layout: layout? layout : "ThreeColumnsMidExpanded"
                    })
                    break;

                // Business Card Module
                case "5":
                    this.oRouter.navTo("BusinessRequestDetail", {
                        parentMaterial: parentId,
                        childModule: childId,
                        layout: layout? layout : "ThreeColumnsMidExpanded"
                    })

                    break;

                // Business Trip Request Module
                case "2":
                    this.oRouter.navTo("BusinessTripRequestDetailPage", {
                        parentMaterial: parentId,
                        childModule: childId,
                        layout: layout? layout : "ThreeColumnsMidExpanded"
                    })
                    break;



                // Airport Travel Pass Request Module
                case "6":
                    this.oRouter.navTo("AirportPassRequestDetail", {
                        parentMaterial: parentId,
                        childModule: childId,
                        layout: layout? layout : "ThreeColumnsMidExpanded"
                    })
                    break;
                // ID Card Request Module
                case "7":
                    this.oRouter.navTo("IDCardRequestDetail", {
                        parentMaterial: parentId,
                        childModule: childId,
                        layout: layout? layout : "ThreeColumnsMidExpanded"
                    })
                    break;
                // Letter Request Module
                case "11":
                    this.oRouter.navTo("LetterRequestDetail", {
                        parentMaterial: parentId,
                        childModule: childId,
                        layout: layout? layout : "ThreeColumnsMidExpanded"
                    });
                    break;

                // Disciplinary Request Module
                case "12":
                    this.oRouter.navTo("DisciplinaryRequestDetail", {
                        parentMaterial: parentId,
                        childModule: childId,
                        layout: layout? layout : "ThreeColumnsMidExpanded"
                    });
                    break;

                //  Bank Account Change Request Module 
                case "13":
                    this.oRouter.navTo("BankAccChangeDetail", {
                        parentMaterial: parentId,
                        childModule: childId,
                        layout: layout? layout : "ThreeColumnsMidExpanded"
                    })
                    break;

                //  Employee Terminate Request Module 
                case "17":
                    this.oRouter.navTo("EmployeeTerminateDetail", {
                        parentMaterial: parentId,
                        childModule: childId,
                        layout: layout? layout : "ThreeColumnsMidExpanded"
                    })
                    break;

                      //  Salary Increment Request Module 
                case "15":
                    this.oRouter.navTo("SalaryIncRequestDetail", {
                        parentMaterial: parentId,
                        childModule: childId,
                        layout: layout? layout : "ThreeColumnsMidExpanded"
                    })
                    break;
            }
        },
        fillWorkflowParticipantDetails: function(oTicketWorkflowParticipantData) {
            if(oTicketWorkflowParticipantData) {
                var approver = "Unassigned";
                if(oTicketWorkflowParticipantData.workflowParticipantId) {
                    if(oTicketWorkflowParticipantData.workflowParticipantName) {
                        approver = `${oTicketWorkflowParticipantData.workflowParticipantName} (${oTicketWorkflowParticipantData.workflowParticipantId})`;
                    } else {
                        approver = oTicketWorkflowParticipantData.workflowParticipantId;
                    }
                }
                var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({pattern: "MM/dd/YYYY HH:mm:ss"});
                var targetDate = "Not Set";
                if(oTicketWorkflowParticipantData.slaTargetDate) {
                    targetDate = dateFormat.format(oTicketWorkflowParticipantData.slaTargetDate);
                }
                var actualDate = "Waiting for Approval";
                if(oTicketWorkflowParticipantData.slaActualDate) {
                    actualDate = dateFormat.format(oTicketWorkflowParticipantData.slaActualDate);
                }
                var violated = oTicketWorkflowParticipantData.slaViolated ? 'Yes' : 'No';
                oTicketWorkflowParticipantData.approver = approver;
                oTicketWorkflowParticipantData.targetDate = targetDate;
                oTicketWorkflowParticipantData.actualDate = actualDate;
                oTicketWorkflowParticipantData.violated = violated;
            }
        },
        itemPress: function(oEvent) {
            debugger;
            var oButton = oEvent.getSource(),
            oView = this.getView();
            var index = oEvent.getSource().sId.split('-')[2];
            var oTicketWorkflowParticipantData = oView.getModel("headerModel").getProperty(`/ticketWorkflowParticipants/results/${index}`);
            
            // setting approval and sla details
            this.fillWorkflowParticipantDetails(oTicketWorkflowParticipantData);
            if (!this._pPopover) {
                this._pPopover = Fragment.load({
                    id: oView.getId(),
                    name: "com.sal.salhr.Fragments.TimelineStatus",
                    controller: this
                }).then(function(oPopover) {
                    oView.addDependent(oPopover);
                    return oPopover;
                });
            }
            this._pPopover.then(function(oPopover) {
                var oTicketWorkflow = new JSONModel(oTicketWorkflowParticipantData);
                oView.setModel(oTicketWorkflow, "TicketWorkFlowParticipantModel");
                oPopover.openBy(oButton);
            });
        },
        handleCloseButton: function() {
            if (this._pPopover) {
                this.byId("idTimelinestatus").close();
            }
        }
    });
});