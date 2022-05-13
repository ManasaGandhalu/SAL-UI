sap.ui.define([
    "./BaseController",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "com/sal/salhr/model/formatter"

],

    function (BaseController, Controller, JSONModel, formatter) {
        "use strict";
        return BaseController.extend("com.sal.salhr.controller.SalaryIncrementDetailPage", {
            formatter: formatter,
            onInit: function () {
                var oLocalViewModel = new JSONModel({
                    EditMode: false,
                    LeaveModule: false,
                    PageTitle: null,
                    Modify: true,
                    IDCardModule: false
                });

                this.getView().setModel(oLocalViewModel, "LocalViewModel");

                this.oRouter = this.getRouter();
                this.oRouter.getRoute("SalaryIncRequestDetail").attachPatternMatched(this._onObjectMatched, this);

            },

            _onObjectMatched: function (oEvent) {

                this.sParentID = oEvent.getParameter("arguments").parentMaterial;
                this.sChildID = oEvent.getParameter("arguments").childModule;
                var sLayout = oEvent.getParameter("arguments").layout;
                this.getView().getModel("layoutModel").setProperty("/layout", sLayout);
                this.byId("idFullScreenBTN").setIcon("sap-icon://full-screen");
                // this._bindView();
                this._getTicketData(this.sChildID);
            },

            _bindView: function (data) {
                debugger;
                var object = data.results[0];
                var oHeaderModel = new JSONModel(data.results[0]);
                this.getView().setModel(oHeaderModel, "headerModel");

                if(object.category === "JOB_INFO")
                {
                    this.getView().getModel("LocalViewModel").setProperty("/jobInfoVisible", true);
                    this.getView().getModel("LocalViewModel").setProperty("/componesationInfoVisible", false);

                    this.getView().setBusy(true);

                    var oComponentModel = this.getComponentModel();
                    var sKey = oComponentModel.createKey("/SF_EmpJob", {
                        seqNumber:  object.externalCode,
                        startDate: object.effectiveStartDate,
                        userId: object.employeeId
                    });
                var bIsUserManager = this.getOwnerComponent().getModel("EmpInfoModel").getProperty("/IsUserManager").toString();
    
                    this.getView().getModel().read(sKey, {
                        urlParameters: {                  
                             $expand: "payGradeNav,positionNav",
                            "IsUserManager": bIsUserManager,
                            "recordStatus": object.status 
                        },
                        success: function (oData) {
                            this.getView().setBusy(false);
                            this.fnSetDisplaySalryJobInfoModel(oData);
                        }.bind(this),
                        error: function () {
                            this.getView().setBusy(false);
                        }.bind(this)
                    });
    



                }else if(object.category === "COMP_INFO"){
                    this.getView().getModel("LocalViewModel").setProperty("/componesationInfoVisible", true);
                    this.getView().getModel("LocalViewModel").setProperty("/jobInfoVisible", false);

                    this.getView().setBusy(true);

                    var oComponentModel = this.getComponentModel();
                    var sKey = oComponentModel.createKey("/SF_EmpCompensation", {
                        seqNumber:  object.externalCode,
                        startDate: object.effectiveStartDate,
                        userId: object.employeeId
                    });
                    var bIsUserManager = this.getOwnerComponent().getModel("EmpInfoModel").getProperty("/IsUserManager").toString();
    
                    this.getView().getModel().read(sKey, {
                        urlParameters: {                  
                            $expand: "customString2Nav,empPayCompRecurringNav,employmentNav,eventReasonNav,payGroupNav,payTypeNav,userNav,wfRequestNav",
                            "IsUserManager": bIsUserManager,
                            "recordStatus": object.status 
                        },
                        success: function (oData) {
                            this.getView().setBusy(false);
                            this.fnSetDisplaySalryCompInfoModel(oData);
                        }.bind(this),
                        error: function () {
                            this.getView().setBusy(false);
                        }.bind(this)
                    });
    
                }
                this.onCallHistoryData(object.ticketCode);

              
         



                this.getView().getModel("LocalViewModel").setProperty("/PageTitle", "Salary Increment Request");
                this.getView().getModel("LocalViewModel").refresh();

            },

            onCallHistoryData: function (sticketCode) {
                var ticketCodeFilter = new sap.ui.model.Filter({
                    path: "ticketCode",
                    operator: sap.ui.model.FilterOperator.EQ,
                    value1: sticketCode
                });
                var filter = [];
                filter.push(ticketCodeFilter);
                this.getOwnerComponent().getModel().read("/TicketHistory", {
                    filters: [filter],

                    success: function (oData, oResponse) {
                        var oHistoryData = new JSONModel(oData.results);
                        this.getView().setModel(oHistoryData, "HistoryData");


                    }.bind(this),
                    error: function (oError) {
                        sap.m.MessageBox.error(JSON.stringify(oError));
                    }
                });
            },

            fnSetDisplaySalryJobInfoModel: function (oData) {
                this.getView().setBusy(true);


             
                   var oDisplayJobInfoObj = 
               

                    {
                        "assedicCertInitialStateNum": oData.assedicCertInitialStateNum,
                        "assedicCertObjectNum": oData.assedicCertObjectNum,
                        "assessmentStatus": oData.assessmentStatus,
                        "businessUnit": oData.businessUnit,
                        "codeOfJobForEldp": oData.codeOfJobForEldp,
                        "commitmentIndicator": oData.commitmentIndicator,
                        "company": oData.company,
                        "continuedSicknessPayMeasure": oData.continuedSicknessPayMeasure,
                        "continuedSicknessPayPeriod": oData.continuedSicknessPayPeriod,
                        "contractEndDate": oData.contractEndDate,
                        "contractId": oData.contractId,
                        "contractNumber": oData.contractNumber,
                        "contractReferenceForAed": oData.contractReferenceForAed,
                        "contractType": oData.contractType,
                        "corporation": oData.corporation,
                        "costCenter": oData.costCenter,
                        "creditForPreviousService": oData.creditForPreviousService,
                        "currentWageLevel": oData.currentWageLevel,
                        "customString1": oData.customString1,
                        "customString10": oData.customString10,
                        "customString11": oData.customString11,
                        "customString12": oData.customString12,
                        "customString13": oData.customString13,
                        "customString2": oData.customString2,
                        "customString3": oData.customString3,
                        "customString4": oData.customString4,
                        "customString5": oData.customString5,
                        "customString6": oData.customString6,
                        "customString7": oData.customString7,
                        "customString8": oData.customString8,
                        "customString9": oData.customString9,
                        "degreeOfProductivity": oData.degreeOfProductivity,
                        "department": oData.department,
                        "dismissalsNoticePeriodForEmployer": oData.dismissalsNoticePeriodForEmployer,
                        "division": oData.division,
                        "eeo1JobCategory": oData.eeo1JobCategory,
                        "eeo4JobCategory": oData.eeo4JobCategory,
                        "eeo5JobCategory": oData.eeo5JobCategory,
                        "eeo6JobCategory": oData.assedicCertInitialStateNum,
                        "eeoClass": oData.eeoClass,
                        "electoralCollegeForLaborCourt": oData.electoralCollegeForLaborCourt,
                        "electoralCollegeForWorkersRepresentatives": oData.electoralCollegeForWorkersRepresentatives,
                        "electoralCollegeForWorksCouncil": oData.electoralCollegeForWorksCouncil,
                        "employeeClass": oData.employeeClass,
                        "employeeNoticePeriod": oData.employeeNoticePeriod,
                        "employeeType": oData.employeeType,
                        "employmentType": oData.employmentType,
                        "empRelationship": oData.empRelationship,
                        "endDate": oData.endDate,
                        "entryIntoGroup": oData.entryIntoGroup,
                        "eventReason": oData.eventReason,
                        "exchangeRate": oData.exchangeRate,
                        "familyRelationshipWithEmployer": oData.familyRelationshipWithEmployer,
                        "flsaStatus": oData.flsaStatus,
                        "fromCurrency": oData.fromCurrency,
                        "guaranteedPayment": oData.guaranteedPayment,
                        "harmfulAgentExposure": oData.harmfulAgentExposure,
                        "holidayCalendarCode": oData.holidayCalendarCode,
                        "initialEntryDate": oData.initialEntryDate,
                        "isFulltimeEmployee": oData.isFulltimeEmployee,
                        "jobCode": oData.jobCode,
                        "jobGroup": oData.jobGroup,
                        "jobTitle": oData.jobTitle,
                        "laborCourtSector": oData.laborCourtSector,
                        "localJobTitle":  oData.localJobTitle,
                       "location": oData.location,
                        "managerId": oData.managerId,
                        "notes": oData.notes,
                        "noticePeriod": oData.noticePeriod,
                        "noticePeriodStartDate": oData.noticePeriodStartDate,
                        "occupationalLevels": oData.occupationalLevels,
                        "payGrade": oData.payGrade,
                        "payGroup": oData.payGroup,
                        "payScaleArea": oData.payScaleArea,
                        "payScaleGroup": oData.payScaleGroup,
                        "payScaleLevel": oData.payScaleLevel,
                        "payScaleType": oData.payScaleType,
                        "periodIndicator": oData.periodIndicator,
                        "position": oData.assedicCertInitialStateNum,
                        "probationaryPeriod": oData.probationaryPeriod,
                        "probationaryPeriodMeasure": oData.probationaryPeriodMeasure,
                        "probationPeriodEndDate": oData.probationPeriodEndDate,
                        "regularTemp": oData.regularTemp,
                        "seqNumber": oData.seqNumber,
                        "sickPaySupplement": oData.sickPaySupplement,
                        "sickPaySupplementMeasure": oData.sickPaySupplementMeasure,
                        "sickPaySupplementPeriod": oData.sickPaySupplementPeriod,
                        "standardHours": oData.standardHours,
                        "startDate": oData.startDate,
                        "timeRecordingAdmissibilityCode": oData.timeRecordingAdmissibilityCode,
                        "timeRecordingProfileCode": oData.timeRecordingProfileCode,
                        "timeRecordingVariant": oData.timeRecordingVariant,
                        "timeTypeProfileCode": oData.timeTypeProfileCode,
                        "timezone": oData.timezone,
                        "toCurrency": oData.toCurrency,
                        "travelDistance": oData.travelDistance,
                        "tupeOrgNumber": oData.tupeOrgNumber,
                        "userId": oData.userId,
                        "validFrom": oData.validFrom,
                        "workerCategory": oData.workerCategory,
                        "workingDaysPerWeek": oData.workingDaysPerWeek,
                        "workLocation": oData.workLocation,
                        "workPermitExpiry": oData.workPermitExpiry,
                        "workscheduleCode": oData.workscheduleCode,
                        "wtdHoursLimit": oData.wtdHoursLimit,
                    },
                    oDisplayJobInfoModel = new JSONModel(oDisplayJobInfoObj);


                this.getView().setModel(oDisplayJobInfoModel, "DisplayJobInfoModel");

                this.getView().setBusy(false);
            },


            fnSetDisplaySalryCompInfoModel: function (oData) {
                this.getView().setBusy(true);


             
                   var oDisplayCompInfoObj = {
                       "payGroup": oData.payGroup,
                       "isEligibleForCar":oData.isEligibleForCar,
                       "customDouble1": oData.customDouble1,
                       "customString2": oData.customString2,
                       "payType": oData.payType,
                       "customDate1": oData.customDate1,
                       "customString3": oData.customString3,
                        "componesationDetails": oData.empPayCompRecurringNav.results
                    },
                    oDisplayCompInfoModel = new JSONModel(oDisplayCompInfoObj);


                this.getView().setModel(oDisplayCompInfoModel, "DisplayCompInfoModel");

                this.getView().setBusy(false);
            },


            onEditPress: function () {
                this.getView().getModel("LocalViewModel").setProperty("/EditMode", true);

            },

            onCancelPress: function () {
                this.getView().getModel("LocalViewModel").setProperty("/EditMode", false);
            },

            onDownLoadPress: function (oEvent) {
                var oItemRowObj = oEvent.getSource().getBindingContext("DisplayHealthInsuranceModel").getObject();
                var sLinkText = oEvent.getSource().getTooltip_Text().trim();

                var oFileObj = sLinkText === "Download(1)" ? oItemRowObj.cust_attachment1Nav : sLinkText === "Download(2)" ? oItemRowObj.cust_attachment2Nav : oItemRowObj.cust_attachment3Nav;

                //    var oFileObj =  oEvent.getSource().getBindingContext("DisplayHealthInsuranceModel").getObject().cust_attachment1Nav;
                var fContent = oFileObj.fileContent;
                var fileext = oFileObj.fileExtension;
                var mimeType = oFileObj.mimeType;
                var fName = oFileObj.fileName;
                fName = fName.split(".")[0];
                debugger;
                if (fileext === "pdf" || fileext === "png") {
                    var decodedPdfContent = atob(fContent);
                    var byteArray = new Uint8Array(decodedPdfContent.length)
                    for (var i = 0; i < decodedPdfContent.length; i++) {
                        byteArray[i] = decodedPdfContent.charCodeAt(i);
                    }
                    var blob = new Blob([byteArray.buffer], { type: mimeType });
                    var _pdfurl = URL.createObjectURL(blob);
                    var a = document.createElement('a');
                    a.href = _pdfurl;
                    a.download = fName;
                    a.dispatchEvent(new MouseEvent('click'));
                }
                else {
                    sap.ui.core.util.File.save(fContent, fName, fileext, mimeType);
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


                this.oRouter.navTo("SalaryIncRequestDetail", {
                    parentMaterial: this.sParentID,
                    childModule: this.sChildID,
                    layout: sLayout
                });

            },

            handleClose: function (oEvent) {
                var sLayout = "",
                    sIcon = this.byId("idFullScreenBTN").getIcon();
                if (sIcon === "sap-icon://full-screen") {
                    sLayout = "TwoColumnsMidExpanded";
                } else {
                    sLayout = "ThreeColumnsMidExpanded";
                    this.byId("idFullScreenBTN").setIcon("sap-icon://full-screen");
                }
                this.oRouter.navTo("detail", {
                    parentMaterial: this.sParentID,
                    layout: sLayout
                });
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