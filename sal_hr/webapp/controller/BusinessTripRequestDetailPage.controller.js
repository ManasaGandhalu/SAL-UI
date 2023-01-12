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
                this.mainModel.setSizeLimit(1000);
             
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
                    ExpenseTypeBusinessTravelVisible: false,
                    TableEditStatus:false
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
                // this.onReqTypeChange();


                this.startTravelDate = new Date().toLocaleDateString();
                this.endTravelDate = new Date().toLocaleDateString();
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
                        this._fnSetBusinessTripTableModel(oData);
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
            _fnSetBusinessTripTableModel:function(oData) {

               var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" });
                this.getView().setBusy(true);
                this.EmpInfoObj = this.getOwnerComponent().getModel("EmpInfoModel").getData();

               for(var i =0;i<oData.cust_toDutyTravelItem.results.length;i++){

                oData.cust_toDutyTravelItem.results[i].cust_assignStartDate = dateFormat.format(oData.cust_toDutyTravelItem.results[i].cust_assignStartDate) + "T00:00:00";
                oData.cust_toDutyTravelItem.results[i].cust_assignEndDate = dateFormat.format(oData.cust_toDutyTravelItem.results[i].cust_assignEndDate) + "T00:00:00";

                oData.cust_toDutyTravelItem.results[i].cust_empName = this.getView().getModel("headerModel").getProperty("/UserName");
                oData.cust_toDutyTravelItem.results[i].cust_payGrade = this.EmpInfoObj.payGrade;
                oData.cust_toDutyTravelItem.results[i].cust_costCenter = this.EmpInfoObj.costCentre;
                oData.cust_toDutyTravelItem.results[i].cust_emerPhoneNum = this.EmpInfoObj.emergencyNumber;
               }

                var oBusinessTripDetailsObj = oData.cust_toDutyTravelItem.results,
                 oBusinessTripTableModel = new JSONModel(oBusinessTripDetailsObj);
                 this.getView().setModel(oBusinessTripTableModel, "BusinessTripTableModel");
                 this.getView().setBusy(false);
            },

            _fnSetDisplayEditBusinessTripModel: function (oEvent,sTicketId) {
                this.sPath = oEvent.getSource().getBindingContext("BusinessTripTableModel").getPath().slice("/".length);
                this.sSelectedItem = oEvent.getSource().getBindingContext("BusinessTripTableModel").getModel().getData();

                // var sBussinessTypeCheck =  oData.cust_toDutyTravelItem.results[0].cust_tripCategory;
                var sBussinessTypeCheck = this.sSelectedItem[this.sPath].cust_tripCategory
                if(sBussinessTypeCheck === "B")
                {
                    this.getView().getModel("LocalViewModel").setProperty("/trainingCategory", false);
                    this.getView().getModel("LocalViewModel").setProperty("/businessCategory", true);

                    this.getView().getModel("LocalViewModel").setProperty("/businessTravel", true);
                    this.getView().getModel("LocalViewModel").setProperty("/trainingTravel", false);
                }
                else{
                    this.getView().getModel("LocalViewModel").setProperty("/businessCategory", false);
                    this.getView().getModel("LocalViewModel").setProperty("/trainingCategory", true);

                    this.getView().getModel("LocalViewModel").setProperty("/businessTravel", false);
                    this.getView().getModel("LocalViewModel").setProperty("/trainingTravel", true);
                }
                this.EmpInfoObj = this.getOwnerComponent().getModel("EmpInfoModel").getData();
               
               var sAirTicketCheck =  this.sSelectedItem[this.sPath].cust_isCompany;
               if(sTicketId){
                if(sAirTicketCheck === true){
                    this.sSelectedItem[this.sPath].cust_expenseTypeTrainingTravel = "N";
                    this.sSelectedItem[this.sPath].cust_expenseTypeBusinessTravel = "N";
                    sTicketId.setEnabled(false);
                   }else {
                    this.sSelectedItem[this.sPath].cust_expenseTypeTrainingTravel = "T";
                    this.sSelectedItem[this.sPath].cust_expenseTypeBusinessTravel = "B";
                    sTicketId.setEnabled(true);
                   }
               }

               var sReqType = this.sSelectedItem[this.sPath].cust_requestType;
               if(sReqType === "1"){
                this.getView().getModel("LocalViewModel").setProperty("/businessTravel", false);
                this.getView().getModel("LocalViewModel").setProperty("/trainingTravel", false);
               }
              
              

                // var oTravelItemDetailsObj = oData.cust_toDutyTravelItem.results[0],
                var oTravelItemDetailsObj = this.sSelectedItem[this.sPath],
                    oDisplayEditBusinessTripObj = {
                        // "externalCode": sSelectedItem[sPath].externalCode,
                        "externalCode": this.object.externalCode,
                        "effectiveStartDate": new Date(),
                        "cust_toDutyTravelItem": [
                            {
                                "createdBy":oTravelItemDetailsObj.createdBy,
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

                                "cust_assignStartDate": new Date(oTravelItemDetailsObj.cust_assignStartDate),
                                "cust_assignEndDate": new Date(oTravelItemDetailsObj.cust_assignEndDate),
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

                                "businessTravelattachmentFileContent": oTravelItemDetailsObj.businessTravelattachmentFileContent,
                                "businessTravelattachmentFileName": oTravelItemDetailsObj.businessTravelattachmentFileName,
                                "isbusinessTravelAttachNew": oTravelItemDetailsObj.isbusinessTravelAttachNew,
                                "businessTravelattachmentUserId": "Extentia",

                                "trainingTravelattachmentFileContent": oTravelItemDetailsObj.trainingTravelattachmentFileContent,
                                "trainingTravelattachmentFileName": oTravelItemDetailsObj.trainingTravelattachmentFileName,
                                "istrainingTravelAttachNew": oTravelItemDetailsObj.istrainingTravelAttachNew,
                                "trainingTravelattachmentUserId": "Extentia",

                                "receiptEmbassyattachmentFileContent": oTravelItemDetailsObj.receiptEmbassyattachmentFileContent,
                                "receiptEmbassyattachmentFileName": oTravelItemDetailsObj.receiptEmbassyattachmentFileName,
                                "isreceiptEmbassyAttachNew": oTravelItemDetailsObj.isreceiptEmbassyAttachNew,
                                "receiptEmbassyattachmentUserId": "Extentia",

                                "visaCopyattachmentFileContent": oTravelItemDetailsObj.visaCopyattachmentFileContent,
                                "visaCopyattachmentFileName": oTravelItemDetailsObj.visaCopyattachmentFileName,
                                "isvisaCopyAttachNew":  oTravelItemDetailsObj.isvisaCopyAttachNew,
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
                    this.fnGetBusinessTripEmpInfo(this.object.externalCode,this.sPath);
                }

                this.getView().setBusy(false);

                // this.getView().getModel("BusinessTripAttachmentModel").getProperty("/businessTravelAttachment") ? null: this.getView().byId("idEditAttachBoardingPassBusiness").destroyItems();

                // this.getView().getModel("BusinessTripAttachmentModel").getProperty("/receiptEmbassyAttachment") ? null: this.getView().byId("idEditAttachEmbassyReceipt").destroyItems();


                // this.getView().getModel("BusinessTripAttachmentModel").getProperty("/trainingTravelAttachment") ? null: this.getView().byId("idEditAttachBoardingPassTraining").destroyItems();

                // this.getView().getModel("BusinessTripAttachmentModel").getProperty("/visaCopyAttachment") ? null: this.getView().byId("idEditAttachVisaCopy").destroyItems();

                // this.onDestCountryChange();

                this._fnSetDesiredAirlineTicketTravelTimeValues();
            },

            fnSetEmployeeBusinessTripModel: function(oData,sPath) {
                this.getView().getModel("DisplayEditBusinessTripModel").setProperty("/cust_toDutyTravelItem/"+sPath+"/payGrade", oData.payGrade);
                this.getView().getModel("DisplayEditBusinessTripModel").setProperty("/cust_toDutyTravelItem/"+sPath+"/costCentre", oData.costCentre);
                this.getView().getModel("DisplayEditBusinessTripModel").setProperty("/cust_toDutyTravelItem/"+sPath+"/emergencyNumber", oData.emergencyNumber);
                this.getView().getModel("DisplayEditBusinessTripModel").setProperty("/cust_toDutyTravelItem/"+sPath+"/cust_empName", (oData.firstName + " " + ((!oData.middleName)?"":oData.middleName+" ")+ oData.lastName));
                this.empRequested = oData.payGrade;
            },

            _fnSetDesiredAirlineTicketTravelTimeValues: function (sPath) {
                // var duration = this.getView().getModel("DisplayEditBusinessTripModel").getProperty("/cust_toDutyTravelItem/0/cust_travelTime") ? this.getView().getModel("DisplayEditBusinessTripModel").getProperty("/cust_toDutyTravelItem/0/cust_travelTime").ms : 0;
               var duration = this.getView().getModel("DisplayEditBusinessTripModel").getData().cust_toDutyTravelItem[sPath] ? this.getView().getModel("DisplayEditBusinessTripModel").getData().cust_toDutyTravelItem[sPath].ms : 0;
               
                if (duration > 0) {
                    var minutes = Math.floor((duration / (1000 * 60)) % 60),
                        hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

                    hours = (hours < 10) ? "0" + hours : hours;
                    minutes = (minutes < 10) ? "0" + minutes : minutes;

                
                    // this.getView().getModel("DisplayEditBusinessTripModel").setProperty("/cust_toDutyTravelItem/0/cust_travelTime", (hours + ":" + minutes));
                
                    this.getView().getModel("DisplayEditBusinessTripModel").getData().cust_toDutyTravelItem[sPath].cust_travelTime = (hours + ":" + minutes);
                   
                    this.getView().byId("idBusinessTripTable").getBinding("items").refresh(true);
                
                }
            },

            onHotelBookChange: function (evt) {
                debugger;

                var sValue = JSON.parse(evt.getSource().getSelectedKey());
                this.getView().getModel("DisplayEditBusinessTripModel").setProperty("/cust_toDutyTravelItem/0/cust_hotelBooking", sValue);


            },
            onDestCountryChange: function (oEvent,sDestinationCountry,sInOutKingdom,sPerDiem,sVisaAmt,sItem) {
                  debugger;
                // var sDestCountry = oEvent ? oEvent.getSource().getSelectedKey() : sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditDestCountry").getSelectedKey() ,
                    
                var sDestCountry = oEvent ? oEvent.getSource().getSelectedKey() : sDestinationCountry.getSelectedKey(),
                // sPayGrade = this.EmpInfoObj.payGrade;

                    sPayGrade = this.empRequested ? this.empRequested : this.EmpInfoObj.payGrade;
                var sCountryVisibleSet = sDestCountry === "SAU" ? this.getView().getModel("LocalViewModel").setProperty("/cityVisible", true) : this.getView().getModel("LocalViewModel").setProperty("/cityVisible", false);

                var sOtherCityCountrySet = sDestCountry === "SAU" ? this.getView().getModel("LocalViewModel").setProperty("/cityOtherCountry", false) : this.getView().getModel("LocalViewModel").setProperty("/cityOtherCountry", true);

                var sCitySaudiVisibleSet = sDestCountry === "SAU" ? this.getView().getModel("LocalViewModel").setProperty("/otherCityVisible", true) : this.getView().getModel("LocalViewModel").setProperty("/otherCityVisible", false);
                
                if(oEvent){
                    

                    if(oEvent.getParameter("id").split("--")[0] === "idCreateBusinessDetailDialog"){
                        
                        sPerDiem = sap.ui.core.Fragment.byId("idCreateBusinessDetailDialog","idPerDiem");
                        sInOutKingdom = sap.ui.core.Fragment.byId("idCreateBusinessDetailDialog","idInsOutKingdom");
                        sVisaAmt = sap.ui.core.Fragment.byId("idCreateBusinessDetailDialog","idVisaAmt");
                        sItem = "CreateItem";
                        var sIOKValueSet = sDestCountry === "SAU" ? sInOutKingdom.setSelectedKey("IN") : sInOutKingdom.setSelectedKey("OUT");
                    }else{
                        sPerDiem = sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditPerDiem")
                        sInOutKingdom = sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditInsOutKingdom");                    
                        sVisaAmt = sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditVisaAmt");
                        sIOKValueSet = sDestCountry === "SAU" ? sInOutKingdom.setSelectedKey("IN") : sInOutKingdom.setSelectedKey("OUT");
                        sItem = "EditItem";

                    }
                
                }else{
                     sIOKValueSet = sDestCountry === "SAU" ? sInOutKingdom.setSelectedKey("IN") : sInOutKingdom.setSelectedKey("OUT");
                }
                
                

                this.getView().getModel().read("/SF_DutyTravel_PerDiem",
                    {
                        urlParameters: {
                            "$filter": "(cust_country eq '" + sDestCountry + "' and cust_salaryGrade eq '" + sPayGrade + "')"
                        },
                        success: function (oData) {
                            sPerDiem.setValue(oData.results[0].cust_amount);
                            this.fnCalculateTotalPerDiem(sPerDiem,sVisaAmt,sItem);
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
                // var sVisaType = this.getView().getModel("DisplayEditBusinessTripModel").getProperty("/cust_toDutyTravelItem/0/cust_expenseTypeVisaFee");
                // this.getView().getModel("DisplayEditBusinessTripModel").setProperty("/cust_toDutyTravelItem/0/cust_expenseTypeVisaFee", (sVisaType ? sVisaType : "N"));
                this.getView().getModel("LocalViewModel").setProperty("/EditMode", true);

                this.getView().getModel("LocalViewModel").setProperty("/TableEditStatus", true);
            },

            onCancelPress: function () {
                this.getView().getModel("LocalViewModel").setProperty("/EditMode", false);
                this.getView().getModel("LocalViewModel").setProperty("/TableEditStatus", false);
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
                debugger;
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
                    oPayloadObj.cust_toDutyTravelItem[0].cust_expenseTypeVisaFee = sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditVisaType").getSelectedKey();

                    // Convert selcted time to specific time format as "PT0H31M30S"
                    if (oPayloadObj.cust_toDutyTravelItem[0].cust_travelTime) {
                        oPayloadObj.cust_toDutyTravelItem[0].cust_travelTime = "PT" + oPayloadObj.cust_toDutyTravelItem[0].cust_travelTime.split(":")[0] + "H" + oPayloadObj.cust_toDutyTravelItem[0].cust_travelTime.split(":")[1] + "M00S";
                    }

                    // this.getView().getModel().update(sKey, oPayloadObj, {
                    //     urlParameters: {
                    //         ticketId: this.sChildID
                    //     },
                    //     success: function (oResponse) {
                    //         this.getView().setBusy(false);
                    //         MessageBox.success("Requested changes updated successfully.");
                    //         this.oRouter.navTo("detail", {
                    //             parentMaterial: this.sParentID,
                    //             layout: "TwoColumnsMidExpanded"
                    //         });
                    //     }.bind(this),
                    //     error: function (oError) {
                    //         this.getView().setBusy(false);
                    //         if (JSON.parse(oError.responseText).error.message.value.indexOf("{") === 0)
                    //             sap.m.MessageBox.error(JSON.parse(JSON.parse(oError.responseText).error.message.value).error.message.value.split("]")[1]);
                    //         else {
                    //             sap.m.MessageBox.error(JSON.parse(oError.responseText).error.message.value);
                    //         }
                    //     }.bind(this)
                    // });

                    this.getView().getModel("BusinessTripTableModel").getData()[this.sPath] = oPayloadObj.cust_toDutyTravelItem[0];
                    this.getView().byId("idBusinessTripTable").getBinding("items").refresh(true);
                    this._oEditBusinessDialog.close();
                    this.getView().setBusy(false);
                    
                } else {
                    MessageBox.error(sValidationErrorMsg);
                }
            },

            onFileAdded: function (oEvent) {
                var file = oEvent.getParameter("item"),
                    Filename = file.getFileName(),
                    Filedata = oEvent.getParameter("item").getFileObject(),
                    sUploaderName = oEvent.getSource().getId().split("--")[1],
                    oUploadPropertyObj = this._fnGetSelectedUploadSetPropoerties(sUploaderName),
                    mimeType = Filedata.type;


                //code for base64/binary array 
                this._getImageData((Filedata), function (Filecontent) {
                    this._addData(Filecontent, Filename, oUploadPropertyObj, mimeType);
                }.bind(this));

                // this.byId(sUploaderName).getDefaultFileUploader().setEnabled(false);
                sap.ui.core.Fragment.byId("idEditBusinessDialog",sUploaderName).getDefaultFileUploader().setEnabled(false);
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

            _addData: function (Filecontent, Filename, oUploadPropertyObj, mimeType) {
                this.getView().getModel("DisplayEditBusinessTripModel").setProperty("/cust_toDutyTravelItem/0/" + oUploadPropertyObj.AttachmentNew, true);
                this.getView().getModel("DisplayEditBusinessTripModel").setProperty("/cust_toDutyTravelItem/0/" + oUploadPropertyObj.AttachmentFileContent, Filecontent);
                this.getView().getModel("DisplayEditBusinessTripModel").setProperty("/cust_toDutyTravelItem/0/" + oUploadPropertyObj.AttachmentFileName, Filename);
                this.getView().getModel("DisplayEditBusinessTripModel").setProperty("/cust_toDutyTravelItem/0/" + oUploadPropertyObj.mimeType, mimeType);
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
                            AttachmentFileName: "businessTravelattachmentFileName",
                            mimeType:"businessTravelattachmentMimeType"
                        };
                        break;

                    case "idEditAttachBoardingPassTraining":
                        oUploadPropertyObj = {
                            AttachmentNew: "istrainingTravelAttachNew",
                            AttachmentFileContent: "trainingTravelattachmentFileContent",
                            AttachmentFileName: "trainingTravelattachmentFileName",
                            mimeType:"trainingTravelattachmentMimeType"
                        };
                        break;

                    case "idEditAttachVisaCopy":
                        oUploadPropertyObj = {
                            AttachmentNew: "isvisaCopyAttachNew",
                            AttachmentFileContent: "visaCopyattachmentFileContent",
                            AttachmentFileName: "visaCopyattachmentFileName",
                            mimeType:"visaCopyattachmentMimeType"
                        };
                        break;

                    case "idEditAttachEmbassyReceipt":
                        oUploadPropertyObj = {
                            AttachmentNew: "isreceiptEmbassyAttachNew",
                            AttachmentFileContent: "receiptEmbassyattachmentFileContent",
                            AttachmentFileName: "receiptEmbassyattachmentFileName",
                            mimeType:"receiptEmbassyattachmentMimeType"
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

                this.onCancelPress();
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

                var sValidationErrorMsg = "";
                //     oEffectStartDatePicker = this.getView().byId("idEditEffectDatePicker");

                // // validate effective start date Field
                // if (!oEffectStartDatePicker.getValue()) {
                //     oEffectStartDatePicker.setValueState("Error");
                //     oEffectStartDatePicker.setValueStateText("Please select Efective Start date.");
                //     sValidationErrorMsg = "Please fill the all required fields.";
                // } else {
                //     oEffectStartDatePicker.setValueState("None");
                // }

                // validate Request Type Field
                var oRequestType = sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditReqType");
                if (!oRequestType.getSelectedKey()) {
                    oRequestType.setValueState("Error");
                    oRequestType.setValueStateText("Please select atleast one value for Request Type.");
                    sValidationErrorMsg = "Please fill the all required fields.";
                } else {
                    oRequestType.setValueState("None");
                }

                // validate Per Diem Pay Component Field
                var oPerDiemPayComponent = sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditPayComp");
                if (!oPerDiemPayComponent.getValue()) {
                    oPerDiemPayComponent.setValueState("Error");
                    oPerDiemPayComponent.setValueStateText("Please enter valid Per Diem Pay Component.");
                    sValidationErrorMsg = "Please fill the all required fields.";
                } else {
                    oPerDiemPayComponent.setValueState("None");
                }

                // validate Total Travel Amount Field
                var oTotalTravelAmount = sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditTravelAmt");
                if (!oTotalTravelAmount.getValue()) {
                    oTotalTravelAmount.setValueState("Error");
                    oTotalTravelAmount.setValueStateText("Please enter valid Total Travel Amount.");
                    sValidationErrorMsg = "Please fill the all required fields.";
                } else {
                    oTotalTravelAmount.setValueState("None");
                }

                // validate Trip Category Field
                var oTripCategory = sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditTripCategory");
                if (!oTripCategory.getSelectedKey()) {
                    oTripCategory.setValueState("Error");
                    oTripCategory.setValueStateText("Please select atleast one value for Trip Category field.");
                    sValidationErrorMsg = "Please fill the all required fields.";
                } else {
                    oTripCategory.setValueState("None");
                }

                // validate Airline Ticket to be booked By HR Field
                var oAirlineTicketByHR = sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditHRBook");
                if (!oAirlineTicketByHR.getSelectedKey()) {
                    oAirlineTicketByHR.setValueState("Error");
                    oAirlineTicketByHR.setValueStateText("Please select atleast one value for Airline ticket to be booked by HR field.");
                    sValidationErrorMsg = "Please fill the all required fields.";
                } else {
                    oAirlineTicketByHR.setValueState("None");
                }

                // validate Travel Justification Field
                var oTravelJustification = sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditTravelJustification");
                if (!oTravelJustification.getValue()) {
                    oTravelJustification.setValueState("Error");
                    oTravelJustification.setValueStateText("Please enter value for Travel Justification Field.");
                    sValidationErrorMsg = "Please fill the all required fields.";
                } else {
                    oTravelJustification.setValueState("None");
                }

                // validate Travel Date Field
                var oTravelDate = sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditTravelDate");
                if (!oTravelDate.getValue()) {
                    oTravelDate.setValueState("Error");
                    oTravelDate.setValueStateText("Please select Travel Date.");
                    sValidationErrorMsg = "Please fill the all required fields.";
                } else {
                    oTravelDate.setValueState("None");
                }

                // validate Return Date Field
                var oReturnDate = sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditReturnDate");
                if (!oReturnDate.getValue()) {
                    oReturnDate.setValueState("Error");
                    oReturnDate.setValueStateText("Please select Return Date.");
                    sValidationErrorMsg = "Please fill the all required fields.";
                } else {
                    oReturnDate.setValueState("None");
                }


                
                // Validte Return Date should not be greater than 15 days

                var Difference_In_Days = new Date(oReturnDate.getDateValue()).getTime() - new Date(oTravelDate.getDateValue()).getTime();
                if(Difference_In_Days/(1000 * 3600 * 24) > 15){
                    oReturnDate.setValueState("Error");
                    oReturnDate.setValueStateText("Travel request cannot be raised for more than 15 days for a single business trip");
                    sValidationErrorMsg = "Travel request cannot be raised for more than 15 days for a single business trip";
                } 

                // validate Inside or Out Kingdom Field
                var oInsOutKingdom = sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditInsOutKingdom");
                if (!oInsOutKingdom.getSelectedKey()) {
                    oInsOutKingdom.setValueState("Error");
                    oInsOutKingdom.setValueStateText("Please enter Inside or Out Kingdom.");
                    sValidationErrorMsg = "Please fill the all required fields.";
                } else {
                    oInsOutKingdom.setValueState("None");
                }

                // validate Visa Type Field
                var oVisaType = sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditVisaType");
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
                if (sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditVisaType").getSelectedKey() === "V") {
                    // validate Pay Component Visa Field
                    var oPayCompVisa = sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditPayCompVisa");
                    if (!oPayCompVisa.getValue()) {
                        oPayCompVisa.setValueState("Error");
                        oPayCompVisa.setValueStateText("Please enter Pay Component Visa.");
                        sValidationErrorMsg = "Please fill the all required fields.";
                    } else {
                        oPayCompVisa.setValueState("None");
                    }

                    // validate Visa Amount Field
                    var oVisaAmt = sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditVisaAmt");
                    if (!oVisaAmt.getValue()) {
                        oVisaAmt.setValueState("Error");
                        oVisaAmt.setValueStateText("Please enter Visa Amount Field.");
                        sValidationErrorMsg = "Please fill the all required fields.";
                    } else {
                        oVisaAmt.setValueState("None");
                    }

                    if (sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditAttachVisaCopy").getItems().length <= 0) {
                        sValidationErrorMsg = "Please upload files for Visa Copy.";
                        this.getView().setBusy(false);
                        return sValidationErrorMsg;
                    }
                    if (sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditAttachEmbassyReceipt").getItems().length <= 0) {
                        sValidationErrorMsg = "Please upload files for Embassy Receipt.";
                        this.getView().setBusy(false);
                        return sValidationErrorMsg;
                    }
                }

                this.getView().setBusy(false);
                return sValidationErrorMsg;
            },

            // onReqTypeChange: function () {
            //     if (this.getView().byId("idEditReqType").getSelectedKey() === "1") {
            //         this.getView().getModel("LocalViewModel").setProperty("/ExpenseTypeBusinessTravelVisible", false);
            //         this.byId("idEditHRBook").setEnabled(true);
            //         this.byId("idEditHRBook").setValue("Yes");
            //         this.byId("idEditTravelDate").setEnabled(true);
            //         this.byId("idEditTripCategory").setEnabled(true);
            //         this.byId("idEditDestCountry").setEnabled(true);
            //         this.byId("idEditCityCountry").setEnabled(true);
            //         this.byId("idEditCity").setEnabled(true);
            //         this.byId("idEditPayCompVisa").setEnabled(true);
            //         this.getView().getModel("LocalViewModel").setProperty("/businessTravel", false);
            //         this.getView().getModel("LocalViewModel").setProperty("/trainingTravel", false);
            //     } else {
                    
            //         this.getView().getModel("LocalViewModel").setProperty("/ExpenseTypeBusinessTravelVisible", true);
            //         this.byId("idEditHRBook").setEnabled(false);
            //         this.byId("idEditTravelDate").setEnabled(false);
            //         this.byId("idEditTripCategory").setEnabled(false);
            //         this.byId("idEditDestCountry").setEnabled(false);
            //         this.byId("idEditCityCountry").setEnabled(false);
            //         this.byId("idEditCity").setEnabled(false);
            //         this.byId("idEditPayCompVisa").setEnabled(false);
            //         this.getView().getModel("LocalViewModel").setProperty("/businessTravel", true);
            //         this.getView().getModel("LocalViewModel").setProperty("/trainingTravel", false);
            //     }
            // },
            onReqTypeChange: function () {
                if (sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditReqType").getSelectedKey() === "1") {
                    this.getView().getModel("LocalViewModel").setProperty("/ExpenseTypeBusinessTravelVisible", false);
                    sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditHRBook").setEnabled(true);
                    sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditHRBook").setValue("Yes");
                    sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditTravelDate").setEnabled(true);
                    sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditTripCategory").setEnabled(true);
                    sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditDestCountry").setEnabled(true);
                    sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditCityCountry").setEnabled(true);
                    sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditCity").setEnabled(true);
                    sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditPayCompVisa").setEnabled(true);
                    this.getView().getModel("LocalViewModel").setProperty("/businessTravel", false);
                    this.getView().getModel("LocalViewModel").setProperty("/trainingTravel", false);
                    this.getView().getModel("DisplayEditBusinessTripModel").getData().cust_toDutyTravelItem[0].cust_expenseTypeBusinessTravel = "B";
                    this.getView().getModel("DisplayEditBusinessTripModel").getData().cust_toDutyTravelItem[0].cust_expenseTypeTrainingTravel = "T";
                } else {
                    
                    this.getView().getModel("LocalViewModel").setProperty("/ExpenseTypeBusinessTravelVisible", true);
                    sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditHRBook").setEnabled(false);
                    sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditTravelDate").setEnabled(false);
                    sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditTripCategory").setEnabled(false);
                    sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditDestCountry").setEnabled(false);
                    sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditCityCountry").setEnabled(false);
                    sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditCity").setEnabled(false);
                    sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditPayCompVisa").setEnabled(false);
                    sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditHRBook").setValue("No");



                    if (sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditTripCategory").getSelectedKey() === "B") {
                        this.getView().getModel("LocalViewModel").setProperty("/businessTravel", true);
                        this.getView().getModel("LocalViewModel").setProperty("/trainingTravel", false);
                    } else {
                        this.getView().getModel("LocalViewModel").setProperty("/businessTravel", false);
                        this.getView().getModel("LocalViewModel").setProperty("/trainingTravel", true);
                    }

              
                    this.getView().getModel("DisplayEditBusinessTripModel").getData().cust_toDutyTravelItem[0].cust_expenseTypeBusinessTravel = "N";
                    this.getView().getModel("DisplayEditBusinessTripModel").getData().cust_toDutyTravelItem[0].cust_expenseTypeTrainingTravel = "N";
                }
            },
            fnCalculateTotalPerDiem: function (sPerDiem,sVisaAmt,sItem) {

                var sTravelDate = sap.ui.core.Fragment.byId("idCreateBusinessDialog", "idTravelDate").getValue();
                var sReturnDate = sap.ui.core.Fragment.byId("idCreateBusinessDialog", "idReturnDate").getValue();

                // var diffTime = Math.abs(new Date(this.endTravelDate) - new Date(this.startTravelDate));

                var diffTime = Math.abs(new Date(sReturnDate)) - new Date(sTravelDate);

                var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));  
                diffDays = (diffDays === 0) ? 1: diffDays;  
                
                if(sItem === "CreateItem"){
                    var sTotalPerDiem = Number(sPerDiem.getValue()*diffDays) + Number(this.getView().getModel("CreateBusinessTripModel").getProperty("/cust_toDutyTravelItem/0/cust_ticketAmount")) + Number(sVisaAmt.getValue());
                    //    sTotalPerDiem = String(sTotalPerDiem);
                    this.getView().getModel("CreateBusinessTripModel").setProperty("/cust_toDutyTravelItem/0/cust_totalPerDiem", sTotalPerDiem);
                    this.getView().getModel("CreateBusinessTripModel").setProperty("/cust_toDutyTravelItem/0/cust_totalAmount", sTotalPerDiem);
                }else {
                    var sTotalPerDiem = Number(sPerDiem.getValue()*diffDays) + Number(this.getView().getModel("DisplayEditBusinessTripModel").getProperty("/cust_toDutyTravelItem/0/cust_ticketAmount")) + Number(sVisaAmt.getValue());
                    //    sTotalPerDiem = String(sTotalPerDiem);
                    this.getView().getModel("DisplayEditBusinessTripModel").setProperty("/cust_toDutyTravelItem/0/cust_totalPerDiem", sTotalPerDiem);
                    this.getView().getModel("DisplayEditBusinessTripModel").setProperty("/cust_toDutyTravelItem/0/cust_totalAmount", sTotalPerDiem);
                }
              


            },
            onApprovePress: function () {
                var swfRequestId = this.getView().getModel("headerModel").getProperty("/workflowRequestId");
                this.onApproveRequest(swfRequestId);
            },

            onRejectPress: function () {
                var swfRequestId = this.getView().getModel("headerModel").getProperty("/workflowRequestId");
                this.onRejectRequest(swfRequestId);
            },
            onBusinessDetailPress:function(oEvent){

                if (!this._oDisplayBusinessDialog) {
                    this._oDisplayBusinessDialog = sap.ui.xmlfragment("idDisplayBusinessDialog", "com.sal.salhr.Fragments.BusinessTripModule.DisplayBusinessTripRequest", this);
                    this.getView().addDependent(this._oDisplayBusinessDialog);
                }
            //    var sTicketId = sap.ui.core.Fragment.byId("idDisplayBusinessDialog", "idDisplayTicketAmt");
                this._fnSetDisplayEditBusinessTripModel(oEvent);

                

              
                var oDisplayEditBusinessTripModel = this.getView().getModel("DisplayEditBusinessTripModel"),
                oBusinessTripAttachmentModel =  this.getView().getModel("BusinessTripAttachmentModel");

                this._oDisplayBusinessDialog.setModel(oDisplayEditBusinessTripModel, "DisplayEditBusinessTripModel");
                this._oDisplayBusinessDialog.setModel(oBusinessTripAttachmentModel, "BusinessTripAttachmentModel");

                this._oDisplayBusinessDialog.open();

                
            },
            onCloseBTDisplayForm:function(){
                this._oDisplayBusinessDialog.close();
            },
            onCloseBTEditForm:function(){
                this._oEditBusinessDialog.close();
            },
            onEditTableItemPress:function(oEvent){
                   var sItem = oEvent.getSource().getBindingContext("BusinessTripTableModel").getObject().createdBy; 
                    this.sPath = oEvent.getSource().getBindingContext("BusinessTripTableModel").getPath().slice("/".length);

                if(sItem){

                    if (!this._oEditBusinessDialog) {
                        this._oEditBusinessDialog = sap.ui.xmlfragment("idEditBusinessDialog", "com.sal.salhr.Fragments.BusinessTripModule.EditBusinessTripRequest", this);
                        this.getView().addDependent(this._oEditBusinessDialog);
                    }
                   var sTicketId = sap.ui.core.Fragment.byId("idEditBusinessDialog", "idEditTicketAmt");
                    this._fnSetDisplayEditBusinessTripModel(oEvent,sTicketId);
    
                    var oDisplayEditBusinessTripModel = this.getView().getModel("DisplayEditBusinessTripModel"),
                    oBusinessTripAttachmentModel =  this.getView().getModel("BusinessTripAttachmentModel");
    
                    this._oEditBusinessDialog.setModel(oDisplayEditBusinessTripModel, "DisplayEditBusinessTripModel");
                    this._oEditBusinessDialog.setModel(oBusinessTripAttachmentModel, "BusinessTripAttachmentModel");
    
                    this._oEditBusinessDialog.open();

                    this.getView().getModel("BusinessTripTableModel").getData()[this.sPath].businessTravelattachmentFileName ? null:  sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditAttachBoardingPassBusiness").destroyItems();
                    this.getView().getModel("BusinessTripTableModel").getData()[this.sPath].businessTravelattachmentFileName ? null:  sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditAttachBoardingPassBusiness").getDefaultFileUploader().setEnabled(true);
                    this.getView().getModel("BusinessTripTableModel").getData()[this.sPath].receiptEmbassyattachmentFileName ? null:  sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditAttachEmbassyReceipt").destroyItems();
                    this.getView().getModel("BusinessTripTableModel").getData()[this.sPath].receiptEmbassyattachmentFileName ? null:  sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditAttachEmbassyReceipt").getDefaultFileUploader().setEnabled(true);
                    this.getView().getModel("BusinessTripTableModel").getData()[this.sPath].trainingTravelattachmentFileName ? null:  sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditAttachBoardingPassTraining").destroyItems();
                    this.getView().getModel("BusinessTripTableModel").getData()[this.sPath].trainingTravelattachmentFileName ? null:  sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditAttachBoardingPassTraining").getDefaultFileUploader().setEnabled(true);
                    this.getView().getModel("BusinessTripTableModel").getData()[this.sPath].visaCopyattachmentFileName ? null:  sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditAttachVisaCopy").destroyItems();
                    this.getView().getModel("BusinessTripTableModel").getData()[this.sPath].visaCopyattachmentFileName ? null:  sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditAttachVisaCopy").getDefaultFileUploader().setEnabled(true);

    
                    // this.getView().getModel("BusinessTripAttachmentModel").getProperty("/businessTravelAttachment") ? null:  sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditAttachBoardingPassBusiness").destroyItems();   
                    // this.getView().getModel("BusinessTripAttachmentModel").getProperty("/receiptEmbassyAttachment") ? null:  sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditAttachEmbassyReceipt").destroyItems();
                    // this.getView().getModel("BusinessTripAttachmentModel").getProperty("/trainingTravelAttachment") ? null:  sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditAttachBoardingPassTraining").destroyItems();
                    // this.getView().getModel("BusinessTripAttachmentModel").getProperty("/visaCopyAttachment") ? null:  sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditAttachVisaCopy").destroyItems();
                  
                    // var sDestinationCountry = sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditDestCountry");
                    // var sInOutKingdom = sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditInsOutKingdom");
                    // var sPerDiem = sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditPerDiem");
                    // var sVisaAmt = sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditVisaAmt");
                   
                    // this.onDestCountryChange("",sDestinationCountry,sInOutKingdom,sPerDiem,sVisaAmt);

                }else {
                      
                    if (!this._oCreateBusinessDialog) {
                        this._oCreateBusinessDialog = sap.ui.xmlfragment("idCreateBusinessDetailDialog", "com.sal.salhr.Fragments.BusinessTripModule.CreateBusinessTripRequest", this);
                        this.getView().addDependent(this._oCreateBusinessDialog);
                    }

                    this.sSelectedItem = oEvent.getSource().getBindingContext("BusinessTripTableModel");
                    var sFields = this.sSelectedItem.getObject();
    
                    sFields.cust_assignEndDate = new Date(sFields.cust_assignEndDate);
                    sFields.cust_assignStartDate = new Date(sFields.cust_assignStartDate);
    
                    var sData = {
                        "externalCode": this.EmpInfoObj,
                        "effectiveStartDate": new Date(),
                        "cust_toDutyTravelItem": [sFields]
                    };
    
                    this.getView().getModel("CreateBusinessTripModel").setData(sData);
                    this.getView().getModel("CreateBusinessTripModel").refresh();
                    this._oCreateBusinessDialog.open();
                    this.newItem = false;

                }


              

            },
            onAddBusinessTripPress: function () {
                debugger;
                if (!this._oCreateBusinessDialog) {
                    this._oCreateBusinessDialog = sap.ui.xmlfragment("idCreateBusinessDetailDialog", "com.sal.salhr.Fragments.BusinessTripModule.CreateBusinessTripRequest", this);
                    this.getView().addDependent(this._oCreateBusinessDialog);
                }
                // this.oFragmetModel = new JSONModel(oContext.getObject());
                // this._oCreateBusinessDialog.setModel(this.oFragmetModel, "oFragmetModel");


                this.fnSetCreateBusinessTripModel();

                var sDestinationCountry = sap.ui.core.Fragment.byId("idCreateBusinessDetailDialog","idDestCountry");
                var sInOutKingdom = sap.ui.core.Fragment.byId("idCreateBusinessDetailDialog","idInsOutKingdom");
                var sPerDiem = sap.ui.core.Fragment.byId("idCreateBusinessDetailDialog","idPerDiem");
                var sVisaAmt = sap.ui.core.Fragment.byId("idCreateBusinessDetailDialog","idVisaAmt");
                var sItem = "CreateItem";

                this.onDestCountryChange("",sDestinationCountry,sInOutKingdom,sPerDiem,sVisaAmt,sItem);

                var oCreateBusinessTripModel = this.getView().getModel("CreateBusinessTripModel");
                this._oCreateBusinessDialog.setModel(oCreateBusinessTripModel, "CreateBusinessTripModel");
                this._oCreateBusinessDialog.open();
                this.newItem = true;
            },
            fnSetCreateBusinessTripModel: function () {
                debugger;

                this.EmpInfoObj = this.getOwnerComponent().getModel("EmpInfoModel").getData();


                var sExternalCode = this.EmpInfoObj.userId,
                    sFirstName = this.EmpInfoObj.firstName + " " + this.EmpInfoObj.middleName + " " + this.EmpInfoObj.lastName,
                    sPayGrade = this.EmpInfoObj.payGrade,
                    sCostCenter = this.EmpInfoObj.costCentre,
                    sPhnNum = this.EmpInfoObj.emergencyNumber;



                    var oCreateBusinessObj = {
                        "externalCode": sExternalCode,
                        "effectiveStartDate": new Date(),
                        "cust_toDutyTravelItem": [
                            {
                                "cust_userId": sExternalCode,
    
                                "cust_dutyTravelMain_externalCode": sExternalCode,
    
                                "cust_dutyTravelMain_effectiveStartDate": new Date(),
    
                                "externalCode": "0",
                                "externalName": null,
                                "cust_requestType": "1",
                                "cust_perDiemPayComp": "",
                                "cust_totalAmount": null,
                                "cust_tripCategory": "",
                                "cust_isCompany": null,
                                "cust_hotelBooking": null,
                                "cust_assignJustification": "",
                                "cust_expenseTypeBusinessTravel": null,
                                "cust_expenseTypeTrainingTravel": null,
                                "cust_businessTicketAmount": null,
                                "cust_trainingExpenseAmount": null,
    
                                "cust_empName": sFirstName,
                                "cust_payGrade": sPayGrade,
                                "cust_costCenter": sCostCenter,
                                "cust_emerPhoneNum": sPhnNum,
    
                                "cust_assignStartDate": new Date(),
                                "cust_assignEndDate": new Date(),
                                "cust_travelTime": null,
                                "cust_destination": "",
                                "cust_city": null,
                                "cust_SAUotherCity": null,
                                "cust_cityAll": null,
                                "cust_inOutKingdom": "",
                                "cust_perDiem": null,
                                "cust_totalPerDiem": null,
    
                                "cust_businessTravelDate": new Date(),
                                "cust_businessTravelFrom": null,
                                "cust_businessTravelTo": null,
                                "cust_businessTravelFlightNum": null,
                                "cust_businessTravelDepTime": null,
                                "cust_businessTravelArrTime": null,
                                "cust_businessTravelPayComp": null,
    
                                "cust_trainingTravelDate": new Date(),
                                "cust_trainingTravelFrom": null,
                                "cust_trainingTravelTo": null,
                                "cust_trainingTravelFlightNum": null,
                                "cust_trainingTravelDepTime": null,
                                "cust_trainingTravelArrTime": null,
                                "cust_trainingTravelPayComp": null,
    
                                "cust_ticketAmount": null,
                                "cust_expenseTypeVisaFee": null,
                                "cust_visaFeePayComp": null,
                                "cust_visaFeeExpenseAmount": null,
    
                                "cust_travelSDate1": new Date(),
                                "cust_travelEDate1": new Date(),
                                "cust_travelTime1": null,
                                "cust_desti1": null,
                                "cust_citySau1": null,
                                "cust_SAUotherCity2": null,
                                "cust_city1": null,
                                "cust_inOutKingdom1": null,
                                "cust_perDiem1": null,
                                "cust_totalPerDiem1": null,
                                "cust_TravelDate1": null,
                                "cust_TravelFrom1": null,
                                "cust_TravelTo1": null,
                                "cust_TravelFlightNum1": null,
                                "cust_TravelDepTime1": null,
                                "cust_TravelArrTime1": null,
                                "cust_TravelPayComp1": null,
                                "cust_ticketAmount1": null,
                                "cust_expenseTypeVisaFee1": null,
                                "cust_visaFeePayComp1": null,
                                "cust_visaFeeExpenseAmount1": null,
    
                                "cust_travelSDate2": new Date(),
                                "cust_travelEDate2": new Date(),
                                "cust_travelTime2": null,
                                "cust_desti2": null,
                                "cust_citySau2": null,
                                "cust_SAUotherCity3": null,
                                "cust_city2": null,
                                "cust_inOutKingdom2": null,
                                "cust_perDiem2": null,
                                "cust_totalPerDiem2": null,
                                "cust_TravelDate2": null,
                                "cust_TravelFrom2": null,
                                "cust_TravelTo2": null,
                                "cust_TravelFlightNum2": null,
                                "cust_TravelDepTime2": null,
                                "cust_TravelArrTime2": null,
                                "cust_TravelPayComp2": null,
                                "cust_ticketAmount2": null,
                                "cust_expenseTypeVisaFee2": null,
                                "cust_visaFeePayComp2": null,
                                "cust_visaFeeExpenseAmount2": null,
    
                                "cust_status": null,
                                "cust_returnDate": null,
                                "cust_paymentType": null,
                                "mdfSystemRecordStatus": "N",
                                "travelattachment1FileContent": "create travelattachment1 attache",
                                "travelattachment1FileName": "travelattachment1.txt",
                                "isTravelAttach1New": false,
                                "travelattachment1UserId": sExternalCode,
    
    
                                "businessTravelattachmentFileContent": "businessTravelattachment create",
                                "businessTravelattachmentFileName": "businessTravelAttachment.txt",
                                "isbusinessTravelAttachNew": false,
                                "businessTravelattachmentUserId": sExternalCode,
    
                                "trainingTravelattachmentFileContent": "trainingTravelattachment create",
                                "trainingTravelattachmentFileName": "trainingTravelattachment.txt",
                                "istrainingTravelAttachNew": false,
                                "trainingTravelattachmentUserId": sExternalCode,
    
                                "receiptEmbassyattachmentFileContent": "receiptEmbassy 3create",
                                "receiptEmbassyattachmentFileName": "receiptEmbassy.txt",
                                "isreceiptEmbassyAttachNew": false,
                                "receiptEmbassyattachmentUserId": sExternalCode,
    
                                "visaCopyattachmentFileContent": "visaCopy 6 create",
                                "visaCopyattachmentFileName": "visaCopy.txt",
                                "isvisaCopyAttachNew": false,
                                "visaCopyattachmentUserId": sExternalCode
    
    
    
                            }
                        ],
    
    
                    },
    


                    oCreateBusinessTripModel = new JSONModel(oCreateBusinessObj);

                this.getView().setModel(oCreateBusinessTripModel, "CreateBusinessTripModel");

                // this.getView().byId("idDestCountry").fireChange();

            },
            onPressSave: function (oEvent) {
                debugger;
                this.onAddBusinessRecords();
                this._oCreateBusinessDialog.close();
                this.getView().setBusy(false);

            },
            onAddBusinessRecords: function () {
                debugger;
                var sPath = "/SF_DutyTravelMain",
                    sValidationErrorMsg = this.fnValidateCreateBusinessTripPayload(),
                    oPayload = this.getView().getModel("CreateBusinessTripModel").getData(),
                    dateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" });

                debugger;

                if (sValidationErrorMsg === "") {
                    this.getView().setBusy(true);


                    // var sStartDate = this.getView().byId("idEffectDatePicker").getDateValue(),
                    var sStartDate = oPayload.effectiveStartDate,
                        oStartDate = dateFormat.format(new Date(sStartDate));
                    sStartDate = oStartDate + "T00:00:00";
                    oPayload.effectiveStartDate = sStartDate;

                    var sTravelDate = sap.ui.core.Fragment.byId("idCreateBusinessDetailDialog", "idTravelDate").getDateValue(),
                        oTravelDate = dateFormat.format(new Date(sTravelDate));
                    sTravelDate = oTravelDate + "T00:00:00";
                    oPayload.cust_toDutyTravelItem[0].cust_assignStartDate = sTravelDate;


                    var sReturnDate = sap.ui.core.Fragment.byId("idCreateBusinessDetailDialog", "idReturnDate").getDateValue(),
                        oReturnDate = dateFormat.format(new Date(sReturnDate));
                    sReturnDate = oReturnDate + "T00:00:00";
                    oPayload.cust_toDutyTravelItem[0].cust_assignEndDate = sReturnDate;


                    var sBusinessTravelDate = sap.ui.core.Fragment.byId("idCreateBusinessDetailDialog", "idFlightTravelDate").getDateValue(),
                        oBusinessTravelDate = dateFormat.format(new Date(sBusinessTravelDate));
                    sBusinessTravelDate = oBusinessTravelDate + "T00:00:00";
                    oPayload.cust_toDutyTravelItem[0].cust_businessTravelDate = sBusinessTravelDate;

                    var sTrainingTravelDate = sap.ui.core.Fragment.byId("idCreateBusinessDetailDialog", "idTrainingFlightTravelDate").getDateValue(),
                        oTrainingTravelDate = dateFormat.format(new Date(sTrainingTravelDate));
                    sTrainingTravelDate = oTrainingTravelDate + "T00:00:00";
                    oPayload.cust_toDutyTravelItem[0].cust_trainingTravelDate = sTrainingTravelDate;


                    // Convert selcted time to specific time format as "PT0H31M30S"
                    if (oPayload.cust_toDutyTravelItem[0].cust_travelTime) {
                        oPayload.cust_toDutyTravelItem[0].cust_travelTime = "PT" + oPayload.cust_toDutyTravelItem[0].cust_travelTime.split(":")[0] + "H" + oPayload.cust_toDutyTravelItem[0].cust_travelTime.split(":")[1] + "M00S";
                    }

                    if (this.newItem === true) {
                        var oModel = this.getViewModel("BusinessTripTableModel");
                        var aItems = oModel.getData().map(function (oItem) {
                            return Object.assign({}, oItem);
                        });
                        //    aItems.push(oPayload);
                        oPayload.cust_toDutyTravelItem[0].externalCode = aItems.length.toString();
                        aItems.push(oPayload.cust_toDutyTravelItem[0]);
                         

                        oModel.setData(aItems);
                    }else {
                        var sPath = this.sSelectedItem.getPath().slice("/".length);
                        oPayload.cust_toDutyTravelItem[0].externalCode = sPath;
                        this.sSelectedItem.getModel().getData()[sPath] = oPayload.cust_toDutyTravelItem[0];
                        // this.sSelectedItem.getModel().setData(oPayload.cust_toDutyTravelItem[0]);
                        this.getViewModel("BusinessTripTableModel").refresh();
                    }




                } else {
                    sap.m.MessageBox.error(sValidationErrorMsg);
                }
            },
            onCloseBTForm: function () {
                this._oCreateBusinessDialog.close();
            },
            fnValidateCreateBusinessTripPayload: function () {
                this.getView().setBusy(true);

                var sValidationErrorMsg = "",
                    // oEffectStartDatePicker = this.getView().byId("idEffectDatePicker"),
                    oTravelDatePicker = sap.ui.core.Fragment.byId("idCreateBusinessDetailDialog", "idTravelDate"),
                    oReturnDatePicker = sap.ui.core.Fragment.byId("idCreateBusinessDetailDialog", "idReturnDate"),
                    sDestinationCountry = sap.ui.core.Fragment.byId("idCreateBusinessDetailDialog", "idDestCountry"),

                    sTravelJustification = sap.ui.core.Fragment.byId("idCreateBusinessDetailDialog", "idTravelJustification");
                // if (!oEffectStartDatePicker.getValue()) {
                //     oEffectStartDatePicker.setValueState("Error");
                //     oEffectStartDatePicker.setValueStateText("Please select Efective Start date");
                //     sValidationErrorMsg = "Please fill the all required fields.";
                // } else {
                //     oEffectStartDatePicker.setValueState("None");
                // }

                // Validate Travel Date
                if (!oTravelDatePicker.getValue()) {
                    oTravelDatePicker.setValueState("Error");
                    oTravelDatePicker.setValueStateText("Please select Travel Date");
                    sValidationErrorMsg = "Please fill the all required fields.";
                } else {
                    oTravelDatePicker.setValueState("None");
                }

                // Validate Return Date
                if (!oReturnDatePicker.getValue()) {
                    oReturnDatePicker.setValueState("Error");
                    oReturnDatePicker.setValueStateText("Please select Return Date");
                    sValidationErrorMsg = "Please fill the all required fields.";
                } else {
                    if (oReturnDatePicker.getValue() < oTravelDatePicker.getValue()) {
                        oReturnDatePicker.setValueState("Error");
                        oReturnDatePicker.setValueStateText("Return Date should be later than Travel Date");
                        sValidationErrorMsg = "Please select Return Date later than Travel Date";
                    } else {
                        oReturnDatePicker.setValueState("None");
                    }
                }

                
                // Validte Return Date should not be greater than 15 days

                var Difference_In_Days = new Date(oReturnDatePicker.getDateValue()).getTime() - new Date(oTravelDatePicker.getDateValue()).getTime();
                if(Difference_In_Days/(1000 * 3600 * 24) > 15){
                    oReturnDatePicker.setValueState("Error");
                    oReturnDatePicker.setValueStateText("Travel request cannot be raised for more than 15 days for a single business trip");
                    sValidationErrorMsg = "Travel request cannot be raised for more than 15 days for a single business trip";
                } 


                // validate Destination Country Field

                if (!sDestinationCountry.getSelectedKey()) {
                    sDestinationCountry.setValueState("Error");
                    sDestinationCountry.setValueStateText("Please select Destination Country.");
                    sValidationErrorMsg = "Please fill the all required fields.";
                } else {
                    sDestinationCountry.setValueState("None");
                }



                // Validate Travel Justification
                if (!sTravelJustification.getValue()) {
                    sTravelJustification.setValueState("Error");
                    sTravelJustification.setValueStateText("Travel Business Justification is required");
                    sValidationErrorMsg = "Please fill the all required fields.";
                } else {
                    sTravelJustification.setValueState("None");
                }


                //   # Visa Copy Mandatory check
                if (sap.ui.core.Fragment.byId("idCreateBusinessDetailDialog", "idVisaType").getSelectedKey() === "V") {
                    // # Visa Copy Mandatory check
                    if (!this.getView().getModel("CreateBusinessTripModel").getProperty("/cust_toDutyTravelItem/0/isvisaCopyAttachNew")) {
                        sValidationErrorMsg = "Please upload Visa Copy.";
                        this.getView().setBusy(false);
                        return sValidationErrorMsg;
                    }

                    // # Embassy Receipt Mandatory check
                    if (!this.getView().getModel("CreateBusinessTripModel").getProperty("/cust_toDutyTravelItem/0/isreceiptEmbassyAttachNew")) {
                        sValidationErrorMsg = "Please upload Embassy Receipt.";
                        this.getView().setBusy(false);
                        return sValidationErrorMsg;
                    }
                }

                this.getView().setBusy(false);
                return sValidationErrorMsg;



            },
            onPressEditSave:function(oEvent){
            
                this.onSavePress();
                this._oEditBusinessDialog.close();
            },
            onBusinessTripsSavePress:function(){
                this.getView().setBusy(true);
                var oBusinessTripItems = this.getView().getModel("BusinessTripTableModel").getData(),
                sKey = this.getView().getModel().createKey("/SF_DutyTravelMain", {
                    effectiveStartDate: this.object.effectiveStartDate,
                    externalCode: this.object.externalCode
                });


                for(var i= 0;i < oBusinessTripItems.length;i++){
                    // oBusinessTripItems[i].externalCode = "0";
    
                  

                  
                   
                   oBusinessTripItems[i].cust_isCompany = (oBusinessTripItems[i].cust_isCompany === "Yes" ? true : false);
                   oBusinessTripItems[i].cust_hotelBooking = oBusinessTripItems[i].cust_hotelBooking === "Yes" ? true : false;
                  
                   if (oBusinessTripItems[i].cust_travelTime) {
                    oBusinessTripItems[i].cust_travelTime = "PT" + oBusinessTripItems[i].cust_travelTime.split(":")[0] + "H" + oBusinessTripItems[i].cust_travelTime.split(":")[1] + "M00S";
                }

                   delete oBusinessTripItems[i].cust_TravelPayComp2Nav;
                   delete oBusinessTripItems[i].cust_TravelPayComp1Nav;
                   delete oBusinessTripItems[i].cust_businessTravelPayCompNav;
                   delete oBusinessTripItems[i].cust_cityNav;
                   delete oBusinessTripItems[i].cust_citySau1Nav;
                   delete oBusinessTripItems[i].cust_citySau2Nav;
                   delete oBusinessTripItems[i].cust_costCenterNav;
                   delete oBusinessTripItems[i].cust_desti1Nav;
                   delete oBusinessTripItems[i].cust_desti2Nav;
                   delete oBusinessTripItems[i].cust_destinationNav;
                   delete oBusinessTripItems[i].cust_expenseTypeBusinessTravelNav;
                   delete oBusinessTripItems[i].cust_expenseTypeTrainingTravelNav;
                   delete oBusinessTripItems[i].cust_expenseTypeVisaFee1Nav;
                   delete oBusinessTripItems[i].cust_expenseTypeVisaFee2Nav;
                   delete oBusinessTripItems[i].cust_expenseTypeVisaFeeNav;
                   delete oBusinessTripItems[i].cust_inOutKingdom1Nav;
                   delete oBusinessTripItems[i].cust_inOutKingdom2Nav;
                   delete oBusinessTripItems[i].cust_inOutKingdomNav;
                   delete oBusinessTripItems[i].cust_payGradeNav;
                   delete oBusinessTripItems[i].cust_paymentTypeNav;
                   delete oBusinessTripItems[i].cust_perDiemPayCompNav;
                   delete oBusinessTripItems[i].cust_requestTypeNav;
                   delete oBusinessTripItems[i].cust_trainingTravelPayCompNav;
                   delete oBusinessTripItems[i].cust_tripCategoryNav;
                   delete oBusinessTripItems[i].cust_visaFeePayComp1Nav;
                   delete oBusinessTripItems[i].cust_visaFeePayComp2Nav;
                   delete oBusinessTripItems[i].cust_visaFeePayCompNav;
                   delete oBusinessTripItems[i].payGrade;
                   delete oBusinessTripItems[i].costCentre;
                   delete oBusinessTripItems[i].emergencyNumber;
                  
                   if(oBusinessTripItems[i].businessTravelattachmentMimeType){
                    delete oBusinessTripItems[i].businessTravelattachmentMimeType;
                   }

                   if(oBusinessTripItems[i].trainingTravelattachmentMimeType){
                    delete oBusinessTripItems[i].trainingTravelattachmentMimeType;
                   }

                   if(oBusinessTripItems[i].visaCopyattachmentMimeType){
                    delete oBusinessTripItems[i].visaCopyattachmentMimeType;
                   }
                   if(oBusinessTripItems[i].receiptEmbassyattachmentMimeType){
                    delete oBusinessTripItems[i].receiptEmbassyattachmentMimeType;
                   }


                  
                }

                var oPayloadObj = {
                   
                    "externalCode": this.object.externalCode,
                    "effectiveStartDate": new Date(),
                    "cust_toDutyTravelItem": oBusinessTripItems
                }

                 


                 this.getView().getModel().update(sKey, oPayloadObj, {
                        urlParameters: {
                            ticketId: this.sChildID
                        },
                        success: function (oResponse) {
                            this.getView().setBusy(false);
                            MessageBox.success("Requested changes updated successfully.");
                            this.onCancelPress();
                            this.getView().setBusy(false);
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


            },
            onDeleteItemPress: function (oEvent) {

                var iRowNumberToDelete = parseInt(oEvent.getSource().getBindingContext("BusinessTripTableModel").getPath().slice("/".length));
                var aTableData = this.getViewModel("BusinessTripTableModel").getProperty("/");
                aTableData.splice(iRowNumberToDelete, 1);
                this.getView().getModel("BusinessTripTableModel").refresh();
            },
            onAirLineTicketChange: function(oEvent){
                var sAitLineTicketCheck = oEvent.getSource().getSelectedKey();
                if(sAitLineTicketCheck === "true"){
                    sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditTicketAmt").setEnabled(false);
                    this.getView().getModel("DisplayEditBusinessTripModel").getData().cust_toDutyTravelItem[0].cust_expenseTypeBusinessTravel = "N";
                }else {
                    sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditTicketAmt").setEnabled(true);
                    this.getView().getModel("DisplayEditBusinessTripModel").getData().cust_toDutyTravelItem[0].cust_expenseTypeBusinessTravel = "B";
                }
            },
            onTravelDateChange: function (oEvent) {

                var sTravelDate = oEvent.getSource().getValue();
                var sPerDiem = sap.ui.core.Fragment.byId("idCreateBusinessDialog", "idPerDiem");
                var sVisaamt = sap.ui.core.Fragment.byId("idCreateBusinessDialog","idVisaAmt");
                var sItem = "CreateItem";

                sap.ui.core.Fragment.byId("idCreateBusinessDialog", "idReturnDate").setValue(sTravelDate);
                this.startTravelDate = oEvent.getParameter("newValue");

                if(this.getView().getModel("CreateBusinessTripModel").getProperty("/cust_toDutyTravelItem/0/cust_destination") !== '') {
                    this.fnCalculateTotalPerDiem(sPerDiem,sVisaamt,sItem);
                }

            },
            onReturnDateChange: function (oEvent) {
                var sTravelDate = sap.ui.core.Fragment.byId("idCreateBusinessDialog", "idTravelDate").getDateValue();
                var sReturnDate = oEvent.getSource().getDateValue();
                this.endTravelDate = oEvent.getParameter("newValue");
                var Difference_In_Days = new Date(sReturnDate).getTime() - new Date(sTravelDate).getTime();
                var sPerDiem = sap.ui.core.Fragment.byId("idCreateBusinessDialog", "idPerDiem");
                var sVisaamt = sap.ui.core.Fragment.byId("idCreateBusinessDialog","idVisaAmt");
                var sItem = "CreateItem";

                if (new Date(sReturnDate).getTime() < new Date(sTravelDate).getTime()) {
                    oEvent.getSource().setValueState("Error");
                    oEvent.getSource().setValueStateText("Return Date should be later than Travel Date");

                }else if(Difference_In_Days /(1000 * 3600 * 24) > 15){
                    oEvent.getSource().setValueState("Error");
                    oEvent.getSource().setValueStateText("Travel request cannot be raised for more than 15 days for a single business trip");
                } else {
                    oEvent.getSource().setValueState();
                    oEvent.getSource().setValueStateText("");
                    sap.ui.core.Fragment.byId("idCreateBusinessDialog", "idTravelDate").setValueState();
                    sap.ui.core.Fragment.byId("idCreateBusinessDialog", "idTravelDate").setValueStateText("");
                    // this.getView().byId("idTravelDate").setValueState();
                    // this.getView().byId("idTravelDate").setValueStateText("");

                }
                if(this.getView().getModel("CreateBusinessTripModel").getProperty("/cust_toDutyTravelItem/0/cust_destination") !== '') {
                    this.fnCalculateTotalPerDiem(sPerDiem,sVisaamt,sItem);
                }
            },
            onTravelDateEditChange: function (oEvent) {

                var sTravelDate = oEvent.getSource().getValue();
                var sPerDiem = sap.ui.core.Fragment.byId("idEditBusinessDialog", "idEditPerDiem");
                var sVisaamt = sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditVisaAmt");
                var sItem = "EditItem";

                sap.ui.core.Fragment.byId("idEditBusinessDialog", "idEditReturnDate").setValue(sTravelDate);
                this.startTravelDate = oEvent.getParameter("newValue");

                if(this.getView().getModel("DisplayEditBusinessTripModel").getProperty("/cust_toDutyTravelItem/0/cust_destination") !== '') {
                    this.fnCalculateTotalPerDiem(sPerDiem,sVisaamt,sItem);
                }

            },
            onReturnDateEditChange: function (oEvent) {
                var sTravelDate = sap.ui.core.Fragment.byId("idEditBusinessDialog", "idEditTravelDate").getDateValue();
                var sReturnDate = oEvent.getSource().getDateValue();
                this.endTravelDate = oEvent.getParameter("newValue");
                var Difference_In_Days = new Date(sReturnDate).getTime() - new Date(sTravelDate).getTime();
                var sPerDiem = sap.ui.core.Fragment.byId("idEditBusinessDialog", "idEditPerDiem");
                var sVisaamt = sap.ui.core.Fragment.byId("idEditBusinessDialog","idEditVisaAmt");
                var sItem = "EditItem";

                if (new Date(sReturnDate).getTime() < new Date(sTravelDate).getTime()) {
                    oEvent.getSource().setValueState("Error");
                    oEvent.getSource().setValueStateText("Return Date should be later than Travel Date");

                }else if(Difference_In_Days /(1000 * 3600 * 24) > 15){
                    oEvent.getSource().setValueState("Error");
                    oEvent.getSource().setValueStateText("Travel request cannot be raised for more than 15 days for a single business trip");
                } else {
                    oEvent.getSource().setValueState();
                    oEvent.getSource().setValueStateText("");
                    sap.ui.core.Fragment.byId("idEditBusinessDialog", "idEditTravelDate").setValueState();
                    sap.ui.core.Fragment.byId("idEditBusinessDialog", "idEditTravelDate").setValueStateText("");
                    // this.getView().byId("idTravelDate").setValueState();
                    // this.getView().byId("idTravelDate").setValueStateText("");

                }
                if(this.getView().getModel("DisplayEditBusinessTripModel").getProperty("/cust_toDutyTravelItem/0/cust_destination") !== '') {
                    this.fnCalculateTotalPerDiem(sPerDiem,sVisaamt,sItem);
                }
            }
        });
    });

