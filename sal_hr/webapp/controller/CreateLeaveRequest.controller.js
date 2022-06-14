sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/ui/Device",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
],

    function (BaseController, JSONModel, Fragment, Device, Filter, FilterOperator) {
        "use strict";
        return BaseController.extend("com.sal.salhr.controller.CreateLeaveRequest", {
            onInit: function () {
                this.oRouter = this.getRouter();
                this.oRouter.getRoute("LeaveRequest").attachPatternMatched(this._onObjectMatched, this);

                this.mainModel = this.getOwnerComponent().getModel();
                var that = this;
                this.attachReq = true;
                this.isAttachment = false

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
                    currentDate: new Date(),
                    meetingType: false,
                    availBal: false,
                    halfDayType: false,
                    managerId: "12345"
                });

                this.getView().setModel(oLocalViewModel, "LocalViewModel");
                // this.byId("CoreToolTip").setToolTip("dded");

            },

            _onObjectMatched: function (oEvent) {
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

                this.fnGetLeaveBalance();


            },

            onRaiseRequestPress: function () {
                var sEntityPath = "/SF_Leave",
                    oPayloadObj = this.fnGetLeaveRequestPayload();


                if (this.bValid != false) {
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
                }

            },
            fnGetLeaveRequestPayload: function () {
                var sQtyHrs;
                // validate leave application for other user Field
                var oLeaveApplicationForINP = this.getView().byId("idLeaveApplicationForINP");
                if (this.getOwnerComponent().getModel("EmpInfoModel").getProperty("/IsUserManager") === true) {
                    if (!oLeaveApplicationForINP.getValue()) {
                        oLeaveApplicationForINP.setValueState("Error");
                        oLeaveApplicationForINP.setValueStateText("Please select user for which leave application will be created.");
                        sValidationErrorMsg = "Please fill the all required fields.";
                        return;
                    } else {
                        oLeaveApplicationForINP.setValueState("None");
                    }
                }

                var sUserID = null;
                if (this.getOwnerComponent().getModel("EmpInfoModel").getProperty("/IsUserManager") === true) {
                    sUserID = oLeaveApplicationForINP.getValue();
                } else {
                    sUserID = this.getOwnerComponent().getModel("EmpInfoModel").getData().userId;
                }
                var sLoginID = this.getOwnerComponent().getModel("EmpInfoModel").getData().userId;
                

                                

                if (this.attachReq === true && this.isAttachment === false) {
                    sap.m.MessageBox.error("Please upload the attachments.");
                    this.bValid = false;
                } else {
                    this.bValid = true;
                    var sAttachmentFileContent, sAttahmentFileName;

                    var sStartDate = this.getView().byId("idStartDate").getDateValue();

                    var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" }),
                        oStartDate = dateFormat.format(new Date(sStartDate));
                    sStartDate = oStartDate + "T00:00:00";

                    var sEndDate = this.getView().byId("idEndDate").getDateValue();




                    var oEndDate = dateFormat.format(new Date(sEndDate));
                    sEndDate = oEndDate + "T00:00:00";
                    var sTimeType = this.getView().byId("idTimeType").getSelectedKey();

                    // if(sTimeType === "460"){
                    //     var sQtyHrs = this.getView().byId("TP1").getValue();
                    //     sQtyHrs = sQtyHrs.split(":")[0] + "." + sQtyHrs.split(":")[1];
                    // }else{

                    // }

                    switch (sTimeType) {
                        case "460":
                            sQtyHrs = this.getView().byId("TP1").getValue();
                            sQtyHrs = sQtyHrs.split(":")[0] + "." + sQtyHrs.split(":")[1];

                            break;
                        case "450":
                            sQtyHrs = this.getView().byId("TP1").getValue();
                            sQtyHrs = sQtyHrs.split(":")[0] + "." + sQtyHrs.split(":")[1];

                            break;
                        case "480":
                            sQtyHrs = this.getView().byId("TP1").getValue();
                            sQtyHrs = sQtyHrs.split(":")[0] + "." + sQtyHrs.split(":")[1];
                        case "440":
                            sQtyHrs = this.getView().byId("TP1").getValue();
                            sQtyHrs = sQtyHrs.split(":")[0] + "." + sQtyHrs.split(":")[1];

                            break;
                        case "HD1":
                            sQtyHrs = "0.5";
                            break;
                        default:
                            sQtyHrs = "0.0";
                    }

                    if (this.isAttachment === true) {
                        sAttachmentFileContent = this.fileContent;
                        sAttahmentFileName = this.fileName;
                    } else {


                        sAttachmentFileContent = "on Leave";
                        sAttahmentFileName = "Leave.txt";


                    }

                    return {
                        // "endDate": "/Date(" + sEndDate + ")/",
                        "endDate": sEndDate,
                        "loaActualReturnDate": null,
                        "timeType": sTimeType,
                        "loaExpectedReturnDate": null,
                        "loaStartJobInfoId": null,
                        // "startDate": "/Date(" + sStartDate + ")/",
                        "startDate": sStartDate,
                        "cust_KronosPayCodeEditID": null,
                        "startTime": null,
                        "loaEndJobInfoId": null,
                        "approvalStatus": null,
                        "undeterminedEndDate": false,
                        "userId": sUserID,
                        "recurrenceGroup": null,

                        "endTime": null,
                        "isAttachmentNew": this.isAttachment,
                        "attachmentFileContent": sAttachmentFileContent,
                        "attachmentFileName": sAttahmentFileName,
                        "attachmentUserId": sLoginID,
                        "fractionQuantity": sQtyHrs

                    };
                }
            },

            onLeaveStartDatChange: function (oEvent) {
                var oneDay = 24 * 60 * 60 * 1000;

                var sStartDate = oEvent.getSource().getValue();
                this.getView().byId("idEndDate").setValue(sStartDate);




                // if (new Date(sEndDate).getTime() < new Date(sStartDate).getTime()) {
                //     oEvent.getSource().setValueState("Error");
                //     oEvent.getSource().setValueStateText("Start Date must not be later than End Date");
                //     // sap.ui.core.Fragment.byId("idLeaveFragment", "idRequestDay").setValue("");
                // } else {
                //     oEvent.getSource().setValueState();
                //     oEvent.getSource().setValueStateText("");
                //     this.getView().byId("idEndDate").setValueState();
                //     this.getView().byId("idEndDate").setValueStateText("");

                // }
            },
            onLeaveEndDateChange: function (oEvent) {
                var oneDay = 24 * 60 * 60 * 1000;
                var sStartDate = this.getView().byId("idStartDate").getDateValue();
                var sEndDate = oEvent.getSource().getDateValue();

                // if (sEndDate <= sStartDate) {
                if (new Date(sEndDate).getTime() < new Date(sStartDate).getTime()) {
                    oEvent.getSource().setValueState("Error");
                    oEvent.getSource().setValueStateText("End Date should be later than Start Date");
                    // sap.ui.core.Fragment.byId("idLeaveFragment", "idRequestDay").setValue("");
                } else {
                    oEvent.getSource().setValueState();
                    oEvent.getSource().setValueStateText("");
                    this.getView().byId("idStartDate").setValueState();
                    this.getView().byId("idStartDate").setValueStateText("");
                    // this.sRequestDay = Math.round(Math.abs((sEndDate - new Date(sStartDate)) / oneDay)) + 1 ;
                    // this.sRequestDay = this.dateDifference(sStartDate, sEndDate, oEvent);
                    // sap.ui.core.Fragment.byId("idLeaveFragment", "idRequestDay").setValue(this.sRequestDay);
                    // this.getView().getModel("LocalViewModel").setProperty("/requestDay", this.sRequestDay);
                }
            },
            onSelectRecurringAbsc: function (oEvent) {
                if (oEvent.getParameters().selected === true) {
                    this.getView().getModel("LocalViewModel").setProperty("/recurringAbs", true);
                } else {
                    this.getView().getModel("LocalViewModel").setProperty("/recurringAbs", false);
                }
            },
            dateDifference: function (startDate, endDate) {

                startDate.setHours(12, 0, 0, 0);
                endDate.setHours(12, 0, 0, 0);

                var totalDays = Math.round((endDate - startDate) / 8.64e7);


                var wholeWeeks = totalDays / 7 | 0;


                var days = wholeWeeks * 5;


                if (totalDays % 7) {
                    startDate.setDate(startDate.getDate() + wholeWeeks * 7);

                    while (startDate < endDate) {

                        startDate.setDate(startDate.getDate() + 1);


                        if (startDate.getDay() != 5 && startDate.getDay() != 6) {
                            ++days;
                        }
                    }
                    startDate.setDate(this.getView().getModel("LocalViewModel").getProperty("/startDate").getDate());
                }


                var sReturnDate = sap.ui.core.Fragment.byId("idLeaveFragment", "idEndDate").getDateValue();



                sReturnDate.setDate(sReturnDate.getDate() + 1);

                if (sReturnDate.getDay() === 5) {
                    sReturnDate.setDate(sReturnDate.getDate() + 2);
                    // sap.ui.core.Fragment.byId("idLeaveFragment", "idReturning").setValue(sReturnDate);
                    this.getView().getModel("LocalViewModel").setProperty("/returnDate", sReturnDate);
                } else if (sReturnDate.getDay() === 6) {
                    sReturnDate.setDate(sReturnDate.getDate() + 1);
                    this.getView().getModel("LocalViewModel").setProperty("/returnDate", sReturnDate);
                    // sap.ui.core.Fragment.byId("idLeaveFragment", "idReturning").setValue(sReturnDate);
                } else {
                    sReturnDate.setDate(sReturnDate.getDate() + 1);
                    this.getView().getModel("LocalViewModel").setProperty("/returnDate", sReturnDate);
                    // sap.ui.core.Fragment.byId("idLeaveFragment", "idReturning").setValue(sReturnDate);
                }
                endDate.setDate(this.getView().getModel("LocalViewModel").getProperty("/endDate").getDate());
                return days + 1;
            },
            onFileAdded: function (oEvent) {
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
                var oUploadSet = this.getView().byId("UploadSet");
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
                var oUploadSet = this.getView().byId("UploadSet");
                oUploadSet.getDefaultFileUploader().setEnabled(true);
                this.isAttachment = false;

            },
            onTimeTyeChange: function (oEvent) {
                var sType = oEvent.getSource().getSelectedKey();
                var that = this;


                switch (sType) {
                    case "S110":
                        that.getView().getModel("LocalViewModel").setProperty('/uploadAttachment', false);
                        this.attachReq = false;
                        that.getView().getModel("LocalViewModel").setProperty('/meetingType', false);
                        that.getView().getModel("LocalViewModel").setProperty('/availBal', true);
                        that.getView().getModel("LocalViewModel").setProperty('/halfDayType', false);

                        break;
                    case "500":
                        that.getView().getModel("LocalViewModel").setProperty('/uploadAttachment', false);
                        this.attachReq = false;
                        that.getView().getModel("LocalViewModel").setProperty('/meetingType', false);
                        that.getView().getModel("LocalViewModel").setProperty('/availBal', false);
                        that.getView().getModel("LocalViewModel").setProperty('/halfDayType', false);

                        break;
                    case "460":
                        that.getView().getModel("LocalViewModel").setProperty('/uploadAttachment', false);
                        this.attachReq = false;
                        that.getView().getModel("LocalViewModel").setProperty('/meetingType', true);
                        that.getView().getModel("LocalViewModel").setProperty('/availBal', false);
                        that.getView().getModel("LocalViewModel").setProperty('/halfDayType', false);

                        break;
                    case "450":
                        that.getView().getModel("LocalViewModel").setProperty('/uploadAttachment', true);
                        this.attachReq = true;
                        that.getView().getModel("LocalViewModel").setProperty('/meetingType', true);
                        that.getView().getModel("LocalViewModel").setProperty('/availBal', false);
                        that.getView().getModel("LocalViewModel").setProperty('/halfDayType', false);

                        break;
                    case "480":
                        that.getView().getModel("LocalViewModel").setProperty('/uploadAttachment', true);
                        this.attachReq = true;
                        that.getView().getModel("LocalViewModel").setProperty('/meetingType', true);
                        that.getView().getModel("LocalViewModel").setProperty('/availBal', false);
                        that.getView().getModel("LocalViewModel").setProperty('/halfDayType', false);

                        break;
                    case "440":
                        that.getView().getModel("LocalViewModel").setProperty('/uploadAttachment', true);
                        this.attachReq = true;
                        that.getView().getModel("LocalViewModel").setProperty('/meetingType', true);
                        that.getView().getModel("LocalViewModel").setProperty('/availBal', false);
                        that.getView().getModel("LocalViewModel").setProperty('/halfDayType', false);

                        break;
                    case "HD1":
                        that.getView().getModel("LocalViewModel").setProperty('/uploadAttachment', true);
                        this.attachReq = true;
                        that.getView().getModel("LocalViewModel").setProperty('/meetingType', false);
                        that.getView().getModel("LocalViewModel").setProperty('/availBal', true);
                        that.getView().getModel("LocalViewModel").setProperty('/halfDayType', true);

                        break;
                    default:
                        this.attachReq = true;
                        that.getView().getModel("LocalViewModel").setProperty('/uploadAttachment', true);
                        that.getView().getModel("LocalViewModel").setProperty('/meetingType', false);
                        that.getView().getModel("LocalViewModel").setProperty('/availBal', false);
                        that.getView().getModel("LocalViewModel").setProperty('/halfDayType', false);

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
                    startDate: new Date(),
                    endDate: new Date(),
                    returnDate: this.sReturnDate,
                    requestDay: this.sRequesting,
                    availBal: false,
                    recurringAbs: false,
                    busy: false,
                    uploadAttachment: true
                };
                this.getView().byId("idRecCheckbox").setSelected(false);
                this.getView().getModel("LocalViewModel").setData(dataReset);
                this.getView().getModel("LocalViewModel").refresh();
            },

            fnGetLeaveBalance: function () {
                var that = this,
                    sUserID = null,
                    oLeaveApplicationForINP = this.getView().byId("idLeaveApplicationForINP");
                if (this.getOwnerComponent().getModel("EmpInfoModel").getProperty("/IsUserManager") === true) {
                    sUserID = oLeaveApplicationForINP.getValue();
                } else {
                    sUserID = this.getOwnerComponent().getModel("EmpInfoModel").getData().userId;
                }

                this.getView().getModel().read("/SF_Leave_AccountBalance", {
                    urlParameters: {
                        "$filter": "(userId eq '" + sUserID + "' and timeAccountType eq 'Annual_vacation')"
                    },
                    success: function (oData) {
                        var oLeaveBalModel = new JSONModel(oData.results[0]);
                        that.getView().setModel(oLeaveBalModel, "LeaveBalModel");
                    },
                    error: function () {

                    }
                })

            },
            handleTimeChange: function (oEvent) {
                var oTimePicker = this.byId("TP1"),
                    oTP = oEvent.getSource(),
                    sValue = oEvent.getParameter("value");


                if (sValue > "08:00") {
                    oTimePicker.setValueState("Error");
                    // oTimePicker.setValueText("Please enter a booking quantity that is greater than 0 and smaller than or equal to 8:00");
                    this.getView().byId("idRaiseRequestBTN").setEnabled(false);
                    sap.m.MessageBox.error("Please enter a booking quantity that is greater than 0 and smaller than or equal to 8:00");
                } else {
                    oTimePicker.setValueState();

                    this.getView().byId("idRaiseRequestBTN").setEnabled(true);
                }
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
                                    path: "middleName",
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
                this.byId("idLeaveApplicationForINP").setValue(oSelectedItem.getBindingContext().getObject().userId);

                // To show Available Leave Balance of Selected employee
                this.fnGetLeaveBalance();
            }
        });
    });      
