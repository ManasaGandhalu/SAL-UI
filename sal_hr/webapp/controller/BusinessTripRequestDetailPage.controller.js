sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "com/sal/salhr/model/formatter",
    "sap/m/MessageBox"
],
    function (BaseController, JSONModel, formatter, MessageBox) {
        "use strict";

        return BaseController.extend("com.sal.salhr.controller.BusinessTripRequestDetailPage", {
            formatter: formatter,
            onInit: function () {
                this.oRouter = this.getRouter();
                this.oRouter.getRoute("BusinessTripRequestDetailPage").attachPatternMatched(this._onObjectMatched, this);
                this.mainModel = this.getOwnerComponent().getModel();
             
                var oLocalViewModel = new JSONModel({
                    startDate: new Date(),
                    endDate: new Date(),
                    availBal: false,
                    recurringAbs: false,
                    busy: false,
                    uploadAttachment: true,
                    currentDate: new Date(),
                    EditMode: false,
                    PageTitle: null,
                    businessTravel: false,
                    trainingTravel: false,
                    cityVisible: false,
                    otherCityVisible: false,
                    cityOtherCountry: true,
                    ExpenseTypeBusinessTravelVisible: false
                });

                this.getView().setModel(oLocalViewModel, "LocalViewModel");
            },

            _onObjectMatched: function (oEvent) {
                this.sParentID = oEvent.getParameter("arguments").parentMaterial;
                this.sChildID = oEvent.getParameter("arguments").childModule;
                var sLayout = oEvent.getParameter("arguments").layout;

                this.getView().getModel("layoutModel").setProperty("/layout", sLayout);

                if (sLayout === "ThreeColumnsMidExpanded") {
                    this.getView().getModel("LocalViewModel").setProperty("/EditMode", false);
                    this.byId("idBusinessTripetailsFullScreenBTN").setIcon("sap-icon://full-screen");
                    this._getTicketData(this.sChildID);
                }
                if (sLayout === "EndColumnFullScreen" && this.byId("idBusinessTripetailsFullScreenBTN").getIcon() == "sap-icon://full-screen") {
                    this.getView().getModel("LocalViewModel").setProperty("/EditMode", false);
                    this.byId("idBusinessTripetailsFullScreenBTN").setIcon("sap-icon://exit-full-screen");
                    this._getTicketData(this.sChildID);
                }
                this.onReqTypeChange();
            },

            _bindView: function (data) {
                this.getView().setBusy(true);

                var object = data.results[0];
                this.object = data.results[0];
                var oHeaderModel = new JSONModel(data.results[0]);
                this.getView().setModel(oHeaderModel, "headerModel");
                this.onCallHistoryData(object.ticketCode);

                var bIsUserManager = this.getOwnerComponent().getModel("EmpInfoModel").getProperty("/IsUserManager").toString();
                var oComponentModel = this.getComponentModel();
                var sKey = oComponentModel.createKey("/SF_DutyTravelMain", {
                    effectiveStartDate: object.effectiveStartDate,
                    externalCode: object.externalCode
                });

                this.getView().getModel().read(sKey, {
                    urlParameters: {
                        $expand: "createdByNav,cust_toDutyTravelItem,cust_toDutyTravelItem/cust_businessTravelAttachNav, cust_toDutyTravelItem/cust_trainingTravelAttachNav, cust_toDutyTravelItem/cust_receiptEmbassyNav ,cust_toDutyTravelItem/cust_visaCopyNav",
                        "IsUserManager": bIsUserManager,
                        "recordStatus": object.status
                    },
                    success: function (oData) {
                        this.getView().setBusy(false);
                        this._fnSetUserName(oData);
                        this._fnSetDisplayEditBusinessTripModel(oData);
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

                this.getView().getModel("LocalViewModel").setProperty("/PageTitle", "Business Trip Request");
            },

            onCallHistoryData: function (sticketCode) {
                var ticketCodeFilter = new sap.ui.model.Filter({
                    path: "ticketCode",
                    operator: sap.ui.model.FilterOperator.EQ,
                    value1: sticketCode
                });

                var filter = [];
                filter.push(ticketCodeFilter);

                this.getView().setBusy(true);
                this.getOwnerComponent().getModel().read("/TicketHistory", {
                    filters: [filter],
                    success: function (oData) {
                        this.getView().setBusy(false);
                        var oHistoryData = new JSONModel(oData.results);
                        this.getView().setModel(oHistoryData, "HistoryData");
                    }.bind(this),
                    error: function (oError) {
                        this.getView().setBusy(false);
                        if (JSON.parse(oError.responseText).error.message.value.indexOf("{") === 0)
                            sap.m.MessageBox.error(JSON.parse(JSON.parse(oError.responseText).error.message.value).error.message.value.split("]")[1]);
                        else {
                            sap.m.MessageBox.error(JSON.parse(oError.responseText).error.message.value);
                        }
                    }
                });
            },

            _fnSetUserName: function (oData) {
                var sUserName = "";
                if (oData.createdByNav.defaultFullName) {
                    sUserName = oData.createdByNav.defaultFullName;
                }
                else {
                    if (oData.createdByNav.firstName)
                        sUserName += oData.createdByNav.firstName + " ";
                    if (oData.createdByNav.middleName)
                        sUserName += oData.createdByNav.middleName + " ";
                    if (oData.createdByNav.lastName)
                        sUserName += oData.createdByNav.lastName;
                }
                this.getView().getModel("headerModel").setProperty("/UserName", sUserName);
            },

            _fnSetDisplayEditBusinessTripModel: function (oData) {
                this.getView().setBusy(true);

                var sBussinessTypeCheck =  oData.cust_toDutyTravelItem.results[0].cust_tripCategory;
                if(sBussinessTypeCheck === "B")
                {
                    this.getView().getModel("LocalViewModel").setProperty("/trainingCategory", false);
                    this.getView().getModel("LocalViewModel").setProperty("/businessCategory", true);
                }
                else{
                    this.getView().getModel("LocalViewModel").setProperty("/businessCategory", false);
                    this.getView().getModel("LocalViewModel").setProperty("/trainingCategory", true);
                }
                this.EmpInfoObj = this.getOwnerComponent().getModel("EmpInfoModel").getData();

                var oTravelItemDetailsObj = oData.cust_toDutyTravelItem.results[0],
                    oDisplayEditBusinessTripObj = {
                        "externalCode": oData.externalCode,
                        "effectiveStartDate": oData.effectiveStartDate,
                        "cust_toDutyTravelItem": [
                            {
                                "cust_userId": oTravelItemDetailsObj.cust_userId,
                                "cust_dutyTravelMain_externalCode": oTravelItemDetailsObj.cust_dutyTravelMain_externalCode,
                                "cust_dutyTravelMain_effectiveStartDate": oTravelItemDetailsObj.cust_dutyTravelMain_effectiveStartDate,
                                "externalCode": oTravelItemDetailsObj.externalCode,
                                "externalName": oTravelItemDetailsObj.externalName,
                                "cust_requestType": oTravelItemDetailsObj.cust_requestType,
                                "cust_perDiemPayComp": oTravelItemDetailsObj.cust_perDiemPayComp,
                                "cust_totalAmount": oTravelItemDetailsObj.cust_totalAmount,
                                "cust_tripCategory": oTravelItemDetailsObj.cust_tripCategory,
                                "cust_isCompany": oTravelItemDetailsObj.cust_isCompany,
                                "cust_hotelBooking": oTravelItemDetailsObj.cust_hotelBooking,
                                "cust_assignJustification": oTravelItemDetailsObj.cust_assignJustification,
                                "cust_expenseTypeBusinessTravel": oTravelItemDetailsObj.cust_expenseTypeBusinessTravel,
                                "cust_expenseTypeTrainingTravel": oTravelItemDetailsObj.cust_expenseTypeTrainingTravel,
                                "cust_businessTicketAmount": oTravelItemDetailsObj.cust_businessTicketAmount,
                                "cust_trainingExpenseAmount": oTravelItemDetailsObj.cust_trainingExpenseAmount,

                                "cust_empName": this.EmpInfoObj.firstName + " " + this.EmpInfoObj.middleName + " " + this.EmpInfoObj.lastName,
                                "cust_payGrade": this.EmpInfoObj.payGrade,
                                "cust_costCenter": this.EmpInfoObj.costCentre,
                                "cust_emerPhoneNum": oTravelItemDetailsObj.cust_emerPhoneNum ? oTravelItemDetailsObj.cust_emerPhoneNum : this.EmpInfoObj.emergencyNumber,

                                "cust_assignStartDate": oTravelItemDetailsObj.cust_assignStartDate,
                                "cust_assignEndDate": oTravelItemDetailsObj.cust_assignEndDate,
                                "cust_travelTime": oTravelItemDetailsObj.cust_travelTime,
                                "cust_destination": oTravelItemDetailsObj.cust_destination,
                                "cust_city": oTravelItemDetailsObj.cust_city,
                                "cust_SAUotherCity": oTravelItemDetailsObj.cust_SAUotherCity,
                                "cust_cityAll": oTravelItemDetailsObj.cust_cityAll,
                                "cust_inOutKingdom": oTravelItemDetailsObj.cust_inOutKingdom,
                                "cust_perDiem": oTravelItemDetailsObj.cust_perDiem,
                                "cust_totalPerDiem": oTravelItemDetailsObj.cust_totalPerDiem,
                                "cust_businessTravelDate": oTravelItemDetailsObj.cust_businessTravelDate,
                                "cust_businessTravelFrom": oTravelItemDetailsObj.cust_businessTravelFrom,
                                "cust_businessTravelTo": oTravelItemDetailsObj.cust_businessTravelTo,
                                "cust_businessTravelFlightNum": oTravelItemDetailsObj.cust_businessTravelFlightNum,
                                "cust_businessTravelDepTime": oTravelItemDetailsObj.cust_businessTravelDepTime,
                                "cust_businessTravelArrTime": oTravelItemDetailsObj.cust_businessTravelArrTime,
                                "cust_businessTravelPayComp": oTravelItemDetailsObj.cust_businessTravelPayComp,
                                "cust_trainingTravelDate": oTravelItemDetailsObj.cust_trainingTravelDate,
                                "cust_trainingTravelFrom": oTravelItemDetailsObj.cust_trainingTravelFrom,
                                "cust_trainingTravelTo": oTravelItemDetailsObj.cust_trainingTravelTo,
                                "cust_trainingTravelFlightNum": oTravelItemDetailsObj.cust_trainingTravelFlightNum,
                                "cust_trainingTravelDepTime": oTravelItemDetailsObj.cust_trainingTravelDepTime,
                                "cust_trainingTravelArrTime": oTravelItemDetailsObj.cust_trainingTravelArrTime,
                                "cust_trainingTravelPayComp": oTravelItemDetailsObj.cust_trainingTravelPayComp,
                                "cust_ticketAmount": oTravelItemDetailsObj.cust_ticketAmount,
                                "cust_expenseTypeVisaFee": oTravelItemDetailsObj.cust_expenseTypeVisaFee,
                                "cust_visaFeePayComp": oTravelItemDetailsObj.cust_visaFeePayComp,
                                "cust_visaFeeExpenseAmount": oTravelItemDetailsObj.cust_visaFeeExpenseAmount,

                                "cust_travelSDate1": oTravelItemDetailsObj.cust_travelSDate1,
                                "cust_travelEDate1": oTravelItemDetailsObj.cust_travelEDate1,
                                "cust_travelTime1": oTravelItemDetailsObj.cust_travelTime1,
                                "cust_desti1": oTravelItemDetailsObj.cust_desti1,
                                "cust_citySau1": oTravelItemDetailsObj.cust_citySau1,
                                "cust_SAUotherCity2": oTravelItemDetailsObj.cust_SAUotherCity2,
                                "cust_city1": oTravelItemDetailsObj.cust_city1,
                                "cust_inOutKingdom1": oTravelItemDetailsObj.cust_inOutKingdom1,
                                "cust_perDiem1": oTravelItemDetailsObj.cust_perDiem1,
                                "cust_totalPerDiem1": oTravelItemDetailsObj.cust_totalPerDiem1,
                                "cust_TravelDate1": oTravelItemDetailsObj.cust_TravelDate1,
                                "cust_TravelFrom1": oTravelItemDetailsObj.cust_TravelFrom1,
                                "cust_TravelTo1": oTravelItemDetailsObj.cust_TravelTo1,
                                "cust_TravelFlightNum1": oTravelItemDetailsObj.cust_TravelFlightNum1,
                                "cust_TravelDepTime1": oTravelItemDetailsObj.cust_TravelDepTime1,
                                "cust_TravelArrTime1": oTravelItemDetailsObj.cust_TravelArrTime1,
                                "cust_TravelPayComp1": oTravelItemDetailsObj.cust_TravelPayComp1,
                                "cust_ticketAmount1": oTravelItemDetailsObj.cust_ticketAmount1,
                                "cust_expenseTypeVisaFee1": oTravelItemDetailsObj.cust_expenseTypeVisaFee1,
                                "cust_visaFeePayComp1": oTravelItemDetailsObj.cust_visaFeePayComp1,
                                "cust_visaFeeExpenseAmount1": oTravelItemDetailsObj.cust_visaFeeExpenseAmount1,

                                "cust_travelSDate2": oTravelItemDetailsObj.cust_travelSDate2,
                                "cust_travelEDate2": oTravelItemDetailsObj.cust_travelEDate2,
                                "cust_travelTime2": oTravelItemDetailsObj.cust_travelTime2,
                                "cust_desti2": oTravelItemDetailsObj.cust_desti2,
                                "cust_citySau2": oTravelItemDetailsObj.cust_citySau2,
                                "cust_SAUotherCity3": oTravelItemDetailsObj.cust_SAUotherCity3,
                                "cust_city2": oTravelItemDetailsObj.cust_city2,
                                "cust_inOutKingdom2": oTravelItemDetailsObj.cust_inOutKingdom2,
                                "cust_perDiem2": oTravelItemDetailsObj.cust_perDiem2,
                                "cust_totalPerDiem2": oTravelItemDetailsObj.cust_totalPerDiem2,
                                "cust_TravelDate2": oTravelItemDetailsObj.cust_TravelDate2,
                                "cust_TravelFrom2": oTravelItemDetailsObj.cust_TravelFrom2,
                                "cust_TravelTo2": oTravelItemDetailsObj.cust_TravelTo2,
                                "cust_TravelFlightNum2": oTravelItemDetailsObj.cust_TravelFlightNum2,
                                "cust_TravelDepTime2": oTravelItemDetailsObj.cust_TravelDepTime2,
                                "cust_TravelArrTime2": oTravelItemDetailsObj.cust_TravelArrTime2,
                                "cust_TravelPayComp2": oTravelItemDetailsObj.cust_TravelPayComp2,
                                "cust_ticketAmount2": oTravelItemDetailsObj.cust_ticketAmount2,
                                "cust_expenseTypeVisaFee2": oTravelItemDetailsObj.cust_expenseTypeVisaFee2,
                                "cust_visaFeePayComp2": oTravelItemDetailsObj.cust_visaFeePayComp2,
                                "cust_visaFeeExpenseAmount2": oTravelItemDetailsObj.cust_visaFeeExpenseAmount2,

                                "cust_status": oTravelItemDetailsObj.cust_status,
                                "cust_returnDate": oTravelItemDetailsObj.cust_returnDate,
                                "cust_paymentType": oTravelItemDetailsObj.cust_paymentType,
                                "mdfSystemRecordStatus": oTravelItemDetailsObj.mdfSystemRecordStatus,

                                // Attachment Sections fields
                                "travelattachment1FileContent": "create travel attache",
                                "travelattachment1FileName": "tr1.txt",
                                "isTravelAttach1New": false,
                                "travelattachment1UserId": "Extentia",

                                "businessTravelattachmentFileContent": "btravle create",
                                "businessTravelattachmentFileName": "btravel.txt",
                                "isbusinessTravelAttachNew": false,
                                "businessTravelattachmentUserId": "Extentia",

                                "trainingTravelattachmentFileContent": "btravle2create",
                                "trainingTravelattachmentFileName": "btrave2.txt",
                                "istrainingTravelAttachNew": false,
                                "trainingTravelattachmentUserId": "Extentia",

                                "receiptEmbassyattachmentFileContent": "btravle 3create",
                                "receiptEmbassyattachmentFileName": "btrave3.txt",
                                "isreceiptEmbassyAttachNew": false,
                                "receiptEmbassyattachmentUserId": "Extentia",

                                "visaCopyattachmentFileContent": "btravle 6 create",
                                "visaCopyattachmentFileName": "btrave6.txt",
                                "isvisaCopyAttachNew": false,
                                "visaCopyattachmentUserId": "Extentia",

                                "travelAttachment1Id": "34908",
                                "businessTravelAttachmentId": "34910",
                                "trainingTravelAttachmentId": "34911",
                                "receiptEmbassyAttachmentId": "34912",
                                "visaCopyAttachmentId": "34915"
                            }
                        ]
                    };


                    
                    var oDisplayEditBusinessTripModel = new JSONModel(oDisplayEditBusinessTripObj),
                    oBusinessTripAttachmentModel = new JSONModel({
                        trainingTravelAttachment: oTravelItemDetailsObj.cust_trainingTravelAttachNav,
                        businessTravelAttachment: oTravelItemDetailsObj.cust_businessTravelAttachNav,
                        receiptEmbassyAttachment: oTravelItemDetailsObj.cust_receiptEmbassyNav,
                        visaCopyAttachment: oTravelItemDetailsObj.cust_visaCopyNav
                    });

                this.getView().setModel(oDisplayEditBusinessTripModel, "DisplayEditBusinessTripModel");
                
                this.getView().setModel(oBusinessTripAttachmentModel, "BusinessTripAttachmentModel");
                
                var bIsUserManager = this.getOwnerComponent().getModel("EmpInfoModel").getProperty("/IsUserManager").toString();

                if(bIsUserManager) {
                    debugger;
                    this.fnGetBusinessTripEmpInfo(oTravelItemDetailsObj.externalCode);
                }

                this.getView().setBusy(false);

                this.getView().getModel("BusinessTripAttachmentModel").getProperty("/businessTravelAttachment") ? null: this.getView().byId("idEditAttachBoardingPassBusiness").removeAllItems();

                this.getView().getModel("BusinessTripAttachmentModel").getProperty("/receiptEmbassyAttachment") ? null: this.getView().byId("idEditAttachEmbassyReceipt").removeAllItems();


                this.getView().getModel("BusinessTripAttachmentModel").getProperty("/trainingTravelAttachment") ? null: this.getView().byId("idEditAttachBoardingPassTraining").removeAllItems();

                this.getView().getModel("BusinessTripAttachmentModel").getProperty("/visaCopyAttachment") ? null: this.getView().byId("idEditAttachVisaCopy").removeAllItems();

                this.onDestCountryChange();

                this._fnSetDesiredAirlineTicketTravelTimeValues();
            },

            fnSetEmployeeBusinessTripModel: function(oData) {
                this.getView().getModel("DisplayEditBusinessTripModel").setProperty("/cust_toDutyTravelItem/0/payGrade", oData.payGrade);
                this.getView().getModel("DisplayEditBusinessTripModel").setProperty("/cust_toDutyTravelItem/0/costCentre", oData.costCentre);
                this.getView().getModel("DisplayEditBusinessTripModel").setProperty("/cust_toDutyTravelItem/0/emergencyNumber", oData.emergencyNumber);
                this.getView().getModel("DisplayEditBusinessTripModel").setProperty("/cust_toDutyTravelItem/0/cust_empName", (oData.firstName + " " + ((!oData.middleName)?"":oData.middleName+" ")+ oData.lastName));
                this.empRequested = oData.payGrade;
            },

            _fnSetDesiredAirlineTicketTravelTimeValues: function () {
                var duration = this.getView().getModel("DisplayEditBusinessTripModel").getProperty("/cust_toDutyTravelItem/0/cust_travelTime") ? this.getView().getModel("DisplayEditBusinessTripModel").getProperty("/cust_toDutyTravelItem/0/cust_travelTime").ms : 0;
                if (duration > 0) {
                    var minutes = Math.floor((duration / (1000 * 60)) % 60),
                        hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

                    hours = (hours < 10) ? "0" + hours : hours;
                    minutes = (minutes < 10) ? "0" + minutes : minutes;

                    this.getView().getModel("DisplayEditBusinessTripModel").setProperty("/cust_toDutyTravelItem/0/cust_travelTime", (hours + ":" + minutes));
                }
            },

            onHotelBookChange: function (evt) {
                debugger;

                var sValue = JSON.parse(evt.getSource().getSelectedKey());
                this.getView().getModel("DisplayEditBusinessTripModel").setProperty("/cust_toDutyTravelItem/0/cust_hotelBooking", sValue);


            },
            onDestCountryChange: function (oEvent) {

                var sDestCountry = oEvent ? oEvent.getSource().getSelectedKey() : this.getView().byId("idEditDestCountry").getSelectedKey() ,
                    // sPayGrade = this.EmpInfoObj.payGrade;
                    sPayGrade = this.empRequested ? this.empRequested : this.EmpInfoObj.payGrade;
                var sCountryVisibleSet = sDestCountry === "SAU" ? this.getView().getModel("LocalViewModel").setProperty("/cityVisible", true) : this.getView().getModel("LocalViewModel").setProperty("/cityVisible", false);

                var sOtherCityCountrySet = sDestCountry === "SAU" ? this.getView().getModel("LocalViewModel").setProperty("/cityOtherCountry", false) : this.getView().getModel("LocalViewModel").setProperty("/cityOtherCountry", true);

                var sCitySaudiVisibleSet = sDestCountry === "SAU" ? this.getView().getModel("LocalViewModel").setProperty("/otherCityVisible", true) : this.getView().getModel("LocalViewModel").setProperty("/otherCityVisible", false);

                var sIOKValueSet = sDestCountry === "SAU" ? this.byId("idEditInsOutKingdom").setSelectedKey("IN") : this.byId("idEditInsOutKingdom").setSelectedKey("OUT");

                this.getView().getModel().read("/SF_DutyTravel_PerDiem",
                    {
                        urlParameters: {
                            "$filter": "(cust_country eq '" + sDestCountry + "' and cust_salaryGrade eq '" + sPayGrade + "')"
                        },
                        success: function (oData) {
                            this.getView().byId("idEditPerDiem").setValue(oData.results[0].cust_amount);
                            this.fnCalculateTotalPerDiem();
                        }.bind(this),
                        error: function (oError) {
                            sap.m.MessageBox.error(JSON.stringify(oError));
                        }.bind(this),
                    });


            },

            onCitySaudiChange: function (oEvent) {
                debugger;
                var sCitySaudi = oEvent.getSource().getSelectedKey();


                var sCitySaudiVisibleSet = sCitySaudi === "OTH" ? this.getView().getModel("LocalViewModel").setProperty("/otherCityVisible", true) : this.getView().getModel("LocalViewModel").setProperty("/otherCityVisible", false);

            },
            onEditPress: function () {
                var sVisaType = this.getView().getModel("DisplayEditBusinessTripModel").getProperty("/cust_toDutyTravelItem/0/cust_expenseTypeVisaFee");
                this.getView().getModel("DisplayEditBusinessTripModel").setProperty("/cust_toDutyTravelItem/0/cust_expenseTypeVisaFee", (sVisaType ? sVisaType : "N"));
                this.getView().getModel("LocalViewModel").setProperty("/EditMode", true);
            },

            onCancelPress: function () {
                this.getView().getModel("LocalViewModel").setProperty("/EditMode", false);
            },

            onWithdrawPress: function () {

                if (this.object.status === "PENDING" || this.object.status === "REJECTED") {
                    var swfID = this.object.workflowRequestId;
                    this.onWithdrawRequest(swfID);
                }
                else {
                    this.onDeleteAPICall();
                }




            },


            onDeleteAPICall: function () {
                this.getView().setBusy(true);
                var oComponentModel = this.getComponentModel(),
                    sKey = oComponentModel.createKey("/SF_DutyTravelMain", {
                        effectiveStartDate: this.object.effectiveStartDate,
                        externalCode: this.object.externalCode
                    });
                oComponentModel.remove(sKey, {
                    urlParameters: {
                        ticketId: this.sChildID
                    },
                    success: function (oData) {
                        this.getView().setBusy(false);
                        if (oData !== "" || oData !== undefined) {
                            MessageBox.success("Record Deleted successfully.");
                            oComponentModel.refresh();
                            this.oRouter.navTo("detail", {
                                parentMaterial: this.sParentID,
                                layout: "TwoColumnsMidExpanded"
                            });
                        } else {
                            MessageBox.error("Record Not able to delete.");
                        }
                    }.bind(this),
                    error: function (oError) {
                        this.getView().setBusy(false);
                        if (JSON.parse(oError.responseText).error.message.value.indexOf("{") === 0)
                            sap.m.MessageBox.error(JSON.parse(JSON.parse(oError.responseText).error.message.value).error.message.value.split("]")[1]);
                        else {
                            sap.m.MessageBox.error(JSON.parse(oError.responseText).error.message.value);
                        }
                    }.bind(this),
                });
            },

            onSavePress: function () {
                var sValidationErrorMsg = this.fnValidateBusinessTripPayload(),
                    sKey = this.getView().getModel().createKey("/SF_DutyTravelMain", {
                        effectiveStartDate: this.object.effectiveStartDate,
                        externalCode: this.object.externalCode
                    });

                if (sValidationErrorMsg === "") {
                    this.getView().setBusy(true);

                    var oPayloadObj = this.getView().getModel("DisplayEditBusinessTripModel").getProperty("/");
                    delete oPayloadObj.payGrade;
                    delete oPayloadObj.costCentre;
                    delete oPayloadObj.emergencyNumber;
                    
                    oPayloadObj.cust_toDutyTravelItem[0].cust_isCompany = (oPayloadObj.cust_toDutyTravelItem[0].cust_isCompany === "Yes" ? true : false);
                    oPayloadObj.cust_toDutyTravelItem[0].cust_hotelBooking = oPayloadObj.cust_toDutyTravelItem[0].cust_hotelBooking === "Yes" ? true : false;
                    oPayloadObj.cust_toDutyTravelItem[0].cust_expenseTypeVisaFee = this.getView().byId("idEditVisaType").getSelectedKey();

                    // Convert selcted time to specific time format as "PT0H31M30S"
                    if (oPayloadObj.cust_toDutyTravelItem[0].cust_travelTime) {
                        oPayloadObj.cust_toDutyTravelItem[0].cust_travelTime = "PT" + oPayloadObj.cust_toDutyTravelItem[0].cust_travelTime.split(":")[0] + "H" + oPayloadObj.cust_toDutyTravelItem[0].cust_travelTime.split(":")[1] + "M00S";
                    }

                    this.getView().getModel().update(sKey, oPayloadObj, {
                        urlParameters: {
                            ticketId: this.sChildID
                        },
                        success: function (oResponse) {
                            this.getView().setBusy(false);
                            MessageBox.success("Requested changes updated successfully.");
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
                    MessageBox.error(sValidationErrorMsg);
                }
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
                this.getView().getModel("DisplayEditBusinessTripModel").setProperty("/cust_toDutyTravelItem/0/" + oUploadPropertyObj.AttachmentNew, true);
                this.getView().getModel("DisplayEditBusinessTripModel").setProperty("/cust_toDutyTravelItem/0/" + oUploadPropertyObj.AttachmentFileContent, Filecontent);
                this.getView().getModel("DisplayEditBusinessTripModel").setProperty("/cust_toDutyTravelItem/0/" + oUploadPropertyObj.AttachmentFileName, Filename);
                this.getView().getModel("DisplayEditBusinessTripModel").refresh();
            },

            onFileDeleted: function (oEvent) {
                var sUploaderName = oEvent.getSource().getId().split("--")[1],
                    oUploadPropertyObj = this._fnGetSelectedUploadSetPropoerties(sUploaderName);

                this.getView().getModel("DisplayEditBusinessTripModel").setProperty("/cust_toDutyTravelItem/0/" + oUploadPropertyObj.AttachmentNew, false);
                this.getView().getModel("DisplayEditBusinessTripModel").refresh();
            },

            _fnGetSelectedUploadSetPropoerties: function (sUploaderName) {
                var oUploadPropertyObj = {};
                switch (sUploaderName) {
                    case "idEditAttachBoardingPassBusiness":
                        oUploadPropertyObj = {
                            AttachmentNew: "isbusinessTravelAttachNew",
                            AttachmentFileContent: "businessTravelattachmentFileContent",
                            AttachmentFileName: "businessTravelattachmentFileName"
                        };
                        break;

                    case "idEditAttachBoardingPassTraining":
                        oUploadPropertyObj = {
                            AttachmentNew: "istrainingTravelAttachNew",
                            AttachmentFileContent: "trainingTravelattachmentFileContent",
                            AttachmentFileName: "trainingTravelattachmentFileName"
                        };
                        break;

                    case "idEditAttachVisaCopy":
                        oUploadPropertyObj = {
                            AttachmentNew: "isvisaCopyAttachNew",
                            AttachmentFileContent: "visaCopyattachmentFileContent",
                            AttachmentFileName: "visaCopyattachmentFileName"
                        };
                        break;

                    case "idEditAttachEmbassyReceipt":
                        oUploadPropertyObj = {
                            AttachmentNew: "isreceiptEmbassyAttachNew",
                            AttachmentFileContent: "receiptEmbassyattachmentFileContent",
                            AttachmentFileName: "receiptEmbassyattachmentFileName"
                        };
                        break;
                }

                return oUploadPropertyObj;
            },


            onDownLoadPress: function (oEvent) {
                var sUploaderName = oEvent.getSource().getParent().getParent().getParent().getId().split("--")[1],
                    oAttachmentData = this.getView().getModel("BusinessTripAttachmentModel").getProperty("/"),
                    sFileContent = null, sFileName = null, sFileext = null, sMimeType = null;

                switch (sUploaderName) {
                    case "idDisplayAttachBoardingPassBusiness":
                        sFileContent = oAttachmentData.businessTravelAttachment.fileContent;
                        sFileName = oAttachmentData.businessTravelAttachment.fileName.split(".")[0];
                        sFileext = oAttachmentData.businessTravelAttachment.fileExtension;
                        sMimeType = oAttachmentData.businessTravelAttachment.mimeType;
                        break;

                    case "idDisplayAttachBoardingPassTraining":
                        sFileContent = oAttachmentData.trainingTravelAttachment.fileContent;
                        sFileName = oAttachmentData.trainingTravelAttachment.fileName.split(".")[0];
                        sFileext = oAttachmentData.trainingTravelAttachment.fileExtension;
                        sMimeType = oAttachmentData.trainingTravelAttachment.mimeType;
                        break;

                    case "idDisplayAttachVisaCopy":
                        sFileContent = oAttachmentData.visaCopyAttachment.fileContent;
                        sFileName = oAttachmentData.visaCopyAttachment.fileName.split(".")[0];
                        sFileext = oAttachmentData.visaCopyAttachment.fileExtension;
                        sMimeType = oAttachmentData.visaCopyAttachment.mimeType;
                        break;

                    case "idDisplayAttachEmbassyReceipt":
                        sFileContent = oAttachmentData.receiptEmbassyAttachment.fileContent;
                        sFileName = oAttachmentData.receiptEmbassyAttachment.fileName.split(".")[0];
                        sFileext = oAttachmentData.receiptEmbassyAttachment.fileExtension;
                        sMimeType = oAttachmentData.receiptEmbassyAttachment.mimeType;
                        break;
                }

                if (sFileext === "pdf" || sFileext === "png") {
                    var decodedPdfContent = atob(sFileContent);
                    var byteArray = new Uint8Array(decodedPdfContent.length)
                    for (var i = 0; i < decodedPdfContent.length; i++) {
                        byteArray[i] = decodedPdfContent.charCodeAt(i);
                    }
                    var blob = new Blob([byteArray.buffer], { type: sMimeType });
                    var _pdfurl = URL.createObjectURL(blob);
                    var a = document.createElement('a');
                    a.href = _pdfurl;
                    a.download = sFileName;
                    a.dispatchEvent(new MouseEvent('click'));
                }
                else {
                    var decodedContent = atob(fContent);
                    sap.ui.core.util.File.save(decodedContent, sFileName, sFileext, sMimeType);
                }
            },

            handleFullScreen: function (oEvent) {
                var sLayout = "";
                if (oEvent.getSource().getIcon() === "sap-icon://full-screen") {
                    sLayout = "EndColumnFullScreen";
                    oEvent.getSource().setIcon("sap-icon://exit-full-screen");
                } else {
                    sLayout = "ThreeColumnsMidExpanded";
                    oEvent.getSource().setIcon("sap-icon://full-screen");
                }
                this.oRouter.navTo("BusinessTripRequestDetailPage", {
                    parentMaterial: this.sParentID,
                    childModule: this.sChildID,
                    layout: sLayout
                });
            },

            handleClose: function () {
                var sLayout = "",
                    sIcon = this.byId("idBusinessTripetailsFullScreenBTN").getIcon();
                if (sIcon === "sap-icon://full-screen") {
                    sLayout = "TwoColumnsMidExpanded";
                } else {
                    sLayout = "ThreeColumnsMidExpanded";
                    this.byId("idBusinessTripetailsFullScreenBTN").setIcon("sap-icon://full-screen");
                }
                this.oRouter.navTo("detail", {
                    parentMaterial: this.sParentID,
                    layout: sLayout
                });
            },

            onBreadCrumbNavPress: function () {
                this.oRouter.navTo("detail", {
                    parentMaterial: this.sParentID,
                    layout: "TwoColumnsMidExpanded"
                });
            },

            onTripCategoryChange: function (oEvent) {
                if (oEvent.getSource().getSelectedKey() === "B") {
                    this.getView().getModel("LocalViewModel").setProperty("/businessTravel", true);
                    this.getView().getModel("LocalViewModel").setProperty("/trainingTravel", false);
                } else {
                    this.getView().getModel("LocalViewModel").setProperty("/businessTravel", false);
                    this.getView().getModel("LocalViewModel").setProperty("/trainingTravel", true);
                }
            },

            _fnUpdateAttachmentData: function () {
                var oData = this.getView().getModel("DisplayEditBusinessTripModel").getProperty("/");

                if (oData.isPersonalIdAttachmentNew === false) {
                    var oPersonalIdAttachmentObj = this.getView().getModel("AttachmentModel").getProperty("/PersonalIdAttachment");
                    this.getView().getModel("DisplayEditBusinessTripModel").setProperty("/isPersonalIdAttachmentNew", true);
                    this.getView().getModel("DisplayEditBusinessTripModel").setProperty("/personalIdAttachmentFileContent", oPersonalIdAttachmentObj.fileContent);
                    this.getView().getModel("DisplayEditBusinessTripModel").setProperty("/personalIdAttachmentFileName", oPersonalIdAttachmentObj.fileName);
                    this.getView().getModel("DisplayEditBusinessTripModel").refresh();
                }

                if (oData.isPersonalPhotoAttachmentNew === false) {
                    var oPersonalPhotoAttachmentObj = this.getView().getModel("AttachmentModel").getProperty("/PersonalPhotoAttachment");
                    this.getView().getModel("DisplayEditBusinessTripModel").setProperty("/isPersonalPhotoAttachmentNew", true);
                    this.getView().getModel("DisplayEditBusinessTripModel").setProperty("/personalPhotoAttachmentFileContent", oPersonalPhotoAttachmentObj.fileContent);
                    this.getView().getModel("DisplayEditBusinessTripModel").setProperty("/personalPhotoAttachmentFileName", oPersonalPhotoAttachmentObj.fileName);
                    this.getView().getModel("DisplayEditBusinessTripModel").refresh();
                }

                if (oData.isPassportAttachmentNew === false) {
                    var oPassportAttachmentObj = this.getView().getModel("AttachmentModel").getProperty("/PassportAttachment");
                    this.getView().getModel("DisplayEditBusinessTripModel").setProperty("/isPassportAttachmentNew", true);
                    this.getView().getModel("DisplayEditBusinessTripModel").setProperty("/passportAttachmentFileContent", oPassportAttachmentObj.fileContent);
                    this.getView().getModel("DisplayEditBusinessTripModel").setProperty("/passportAttachmentFileName", oPassportAttachmentObj.fileName);
                    this.getView().getModel("DisplayEditBusinessTripModel").refresh();
                }

                if (oData.isCompanyIdAttachmentNew === false) {
                    var oCompanyIdAttachmentObj = this.getView().getModel("AttachmentModel").getProperty("/CompanyIdAttachment");
                    this.getView().getModel("DisplayEditBusinessTripModel").setProperty("/isCompanyIdAttachmentNew", true);
                    this.getView().getModel("DisplayEditBusinessTripModel").setProperty("/companyIdAttachmentFileContent", oCompanyIdAttachmentObj.fileContent);
                    this.getView().getModel("DisplayEditBusinessTripModel").setProperty("/companyIdAttachmentFileName", oCompanyIdAttachmentObj.fileName);
                    this.getView().getModel("DisplayEditBusinessTripModel").refresh();
                }
            },

            fnValidateBusinessTripPayload: function () {
                this.getView().setBusy(true);

                var sValidationErrorMsg = "",
                    oEffectStartDatePicker = this.getView().byId("idEditEffectDatePicker");

                // validate effective start date Field
                if (!oEffectStartDatePicker.getValue()) {
                    oEffectStartDatePicker.setValueState("Error");
                    oEffectStartDatePicker.setValueStateText("Please select Efective Start date.");
                    sValidationErrorMsg = "Please fill the all required fields.";
                } else {
                    oEffectStartDatePicker.setValueState("None");
                }

                // validate Request Type Field
                var oRequestType = this.getView().byId("idEditReqType");
                if (!oRequestType.getSelectedKey()) {
                    oRequestType.setValueState("Error");
                    oRequestType.setValueStateText("Please select atleast one value for Request Type.");
                    sValidationErrorMsg = "Please fill the all required fields.";
                } else {
                    oRequestType.setValueState("None");
                }

                // validate Per Diem Pay Component Field
                var oPerDiemPayComponent = this.getView().byId("idEditPayComp");
                if (!oPerDiemPayComponent.getValue()) {
                    oPerDiemPayComponent.setValueState("Error");
                    oPerDiemPayComponent.setValueStateText("Please enter valid Per Diem Pay Component.");
                    sValidationErrorMsg = "Please fill the all required fields.";
                } else {
                    oPerDiemPayComponent.setValueState("None");
                }

                // validate Total Travel Amount Field
                var oTotalTravelAmount = this.getView().byId("idEditTravelAmt");
                if (!oTotalTravelAmount.getValue()) {
                    oTotalTravelAmount.setValueState("Error");
                    oTotalTravelAmount.setValueStateText("Please enter valid Total Travel Amount.");
                    sValidationErrorMsg = "Please fill the all required fields.";
                } else {
                    oTotalTravelAmount.setValueState("None");
                }

                // validate Trip Category Field
                var oTripCategory = this.getView().byId("idEditTripCategory");
                if (!oTripCategory.getSelectedKey()) {
                    oTripCategory.setValueState("Error");
                    oTripCategory.setValueStateText("Please select atleast one value for Trip Category field.");
                    sValidationErrorMsg = "Please fill the all required fields.";
                } else {
                    oTripCategory.setValueState("None");
                }

                // validate Airline Ticket to be booked By HR Field
                var oAirlineTicketByHR = this.getView().byId("idEditHRBook");
                if (!oAirlineTicketByHR.getSelectedKey()) {
                    oAirlineTicketByHR.setValueState("Error");
                    oAirlineTicketByHR.setValueStateText("Please select atleast one value for Airline ticket to be booked by HR field.");
                    sValidationErrorMsg = "Please fill the all required fields.";
                } else {
                    oAirlineTicketByHR.setValueState("None");
                }

                // validate Travel Justification Field
                var oTravelJustification = this.getView().byId("idEditTravelJustification");
                if (!oTravelJustification.getValue()) {
                    oTravelJustification.setValueState("Error");
                    oTravelJustification.setValueStateText("Please enter value for Travel Justification Field.");
                    sValidationErrorMsg = "Please fill the all required fields.";
                } else {
                    oTravelJustification.setValueState("None");
                }

                // validate Travel Date Field
                var oTravelDate = this.getView().byId("idEditTravelDate");
                if (!oTravelDate.getValue()) {
                    oTravelDate.setValueState("Error");
                    oTravelDate.setValueStateText("Please select Travel Date.");
                    sValidationErrorMsg = "Please fill the all required fields.";
                } else {
                    oTravelDate.setValueState("None");
                }

                // validate Return Date Field
                var oReturnDate = this.getView().byId("idEditReturnDate");
                if (!oReturnDate.getValue()) {
                    oReturnDate.setValueState("Error");
                    oReturnDate.setValueStateText("Please select Return Date.");
                    sValidationErrorMsg = "Please fill the all required fields.";
                } else {
                    oReturnDate.setValueState("None");
                }

                // validate Inside or Out Kingdom Field
                var oInsOutKingdom = this.getView().byId("idEditInsOutKingdom");
                if (!oInsOutKingdom.getSelectedKey()) {
                    oInsOutKingdom.setValueState("Error");
                    oInsOutKingdom.setValueStateText("Please enter Inside or Out Kingdom.");
                    sValidationErrorMsg = "Please fill the all required fields.";
                } else {
                    oInsOutKingdom.setValueState("None");
                }

                // validate Visa Type Field
                var oVisaType = this.getView().byId("idEditVisaType");
                if (oVisaType.getSelectedKey() === "Select") {
                    oVisaType.setValueState("Error");
                    oVisaType.setValueStateText("Please select value for Visa Type.");
                    sValidationErrorMsg = "Please fill the all required fields.";
                } else {
                    oVisaType.setValueState("None");
                }

                // Validate Boarding Pass attachment sections
                // if (this.getView().getModel("DisplayEditBusinessTripModel").getProperty("/cust_toDutyTravelItem/0/cust_tripCategory") === "B") {
                //     if (this.getView().byId("idEditAttachBoardingPassBusiness").getItems().length <= 0) {
                //         sValidationErrorMsg = "Please upload Boarding Pass.";
                //         this.getView().setBusy(false);
                //         return sValidationErrorMsg;
                //     }
                // } else {
                //     if (this.getView().byId("idEditAttachBoardingPassTraining").getItems().length <= 0) {
                //         sValidationErrorMsg = "Please upload Boarding Pass.";
                //         this.getView().setBusy(false);
                //         return sValidationErrorMsg;
                //     }
                // }

                // Validate embasy attachment sections
                if (this.byId("idEditVisaType").getSelectedKey() === "V") {
                    // validate Pay Component Visa Field
                    var oPayCompVisa = this.getView().byId("idEditPayCompVisa");
                    if (!oPayCompVisa.getValue()) {
                        oPayCompVisa.setValueState("Error");
                        oPayCompVisa.setValueStateText("Please enter Pay Component Visa.");
                        sValidationErrorMsg = "Please fill the all required fields.";
                    } else {
                        oPayCompVisa.setValueState("None");
                    }

                    // validate Visa Amount Field
                    var oVisaAmt = this.getView().byId("idEditVisaAmt");
                    if (!oVisaAmt.getValue()) {
                        oVisaAmt.setValueState("Error");
                        oVisaAmt.setValueStateText("Please enter Visa Amount Field.");
                        sValidationErrorMsg = "Please fill the all required fields.";
                    } else {
                        oVisaAmt.setValueState("None");
                    }

                    if (this.getView().byId("idEditAttachVisaCopy").getItems().length <= 0) {
                        sValidationErrorMsg = "Please upload files for Visa Copy.";
                        this.getView().setBusy(false);
                        return sValidationErrorMsg;
                    }
                    if (this.getView().byId("idEditAttachEmbassyReceipt").getItems().length <= 0) {
                        sValidationErrorMsg = "Please upload files for Embassy Receipt.";
                        this.getView().setBusy(false);
                        return sValidationErrorMsg;
                    }
                }

                this.getView().setBusy(false);
                return sValidationErrorMsg;
            },

            onReqTypeChange: function () {
                if (this.getView().byId("idEditReqType").getSelectedKey() === "1") {
                    this.getView().getModel("LocalViewModel").setProperty("/ExpenseTypeBusinessTravelVisible", false);
                    this.byId("idEditHRBook").setEnabled(true);
                    this.byId("idEditHRBook").setValue("Yes");
                    this.byId("idEditTravelDate").setEnabled(true);
                    this.byId("idEditTripCategory").setEnabled(true);
                    this.byId("idEditDestCountry").setEnabled(true);
                    this.byId("idEditCityCountry").setEnabled(true);
                    this.byId("idEditCity").setEnabled(true);
                    this.byId("idEditPayCompVisa").setEnabled(true);
                    this.getView().getModel("LocalViewModel").setProperty("/businessTravel", false);
                    this.getView().getModel("LocalViewModel").setProperty("/trainingTravel", false);
                } else {
                    
                    this.getView().getModel("LocalViewModel").setProperty("/ExpenseTypeBusinessTravelVisible", true);
                    this.byId("idEditHRBook").setEnabled(false);
                    this.byId("idEditTravelDate").setEnabled(false);
                    this.byId("idEditTripCategory").setEnabled(false);
                    this.byId("idEditDestCountry").setEnabled(false);
                    this.byId("idEditCityCountry").setEnabled(false);
                    this.byId("idEditCity").setEnabled(false);
                    this.byId("idEditPayCompVisa").setEnabled(false);
                    this.getView().getModel("LocalViewModel").setProperty("/businessTravel", true);
                    this.getView().getModel("LocalViewModel").setProperty("/trainingTravel", false);
                }
            },
            fnCalculateTotalPerDiem: function () {
                
                var sTotalPerDiem = Number(this.byId("idEditPerDiem").getValue()) + Number(this.getView().getModel("DisplayEditBusinessTripModel").getProperty("/cust_toDutyTravelItem/0/cust_ticketAmount")) + Number(this.byId("idEditVisaAmt").getValue());
                //    sTotalPerDiem = String(sTotalPerDiem);
                this.getView().getModel("DisplayEditBusinessTripModel").setProperty("/cust_toDutyTravelItem/0/cust_totalPerDiem", sTotalPerDiem);
                this.getView().getModel("DisplayEditBusinessTripModel").setProperty("/cust_toDutyTravelItem/0/cust_totalAmount", sTotalPerDiem);


            },
            onApprovePress: function () {
                var swfRequestId = this.getView().getModel("headerModel").getProperty("/workflowRequestId");
                this.onApproveRequest(swfRequestId);
            },

            onRejectPress: function () {
                var swfRequestId = this.getView().getModel("headerModel").getProperty("/workflowRequestId");
                this.onRejectRequest(swfRequestId);
            }
        });
    });

