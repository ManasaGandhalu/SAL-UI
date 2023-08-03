sap.ui.define([
    "./BaseController",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "com/sal/salhr/model/formatter"

],

    function (BaseController, Controller, JSONModel, formatter) {
        "use strict";
        return BaseController.extend(
          "com.sal.salhr.controller.SalaryIncrementDetailPage",
          {
            formatter: formatter,
            onInit: function () {
              var oLocalViewModel = new JSONModel({
                EditMode: false,
                PageTitle: null,
                Modify: true,
              });

              this.getView().setModel(oLocalViewModel, "LocalViewModel");

              this.oRouter = this.getRouter();
              this.oRouter
                .getRoute("SalaryIncRequestDetail")
                .attachPatternMatched(this._onObjectMatched, this);
              var oTimezonesModel = this.getOwnerComponent().getModel(
                "timezonesData"
              );
              oTimezonesModel.setSizeLimit(500);
              this.getView().setModel(oTimezonesModel, "TimezonesModel");
              //  this.initDropdowns();
            },

            initDropdowns: function () {
              function filter(sTerm, oItem) {
                // A case-insensitive 'string contains' filter
                return (
                  oItem.getText().match(new RegExp(sTerm, "i")) ||
                  oItem.getKey().match(new RegExp(sTerm, "i"))
                );
              }
              this.getView()
                .byId("idDisplayTimezone")
                .setFilterFunction(filter);
            },

            _onObjectMatched: function (oEvent) {
              // this.initDropdowns();
              this.sParentID = oEvent.getParameter("arguments").parentMaterial;
              this.sChildID = oEvent.getParameter("arguments").childModule;
              var sLayout = oEvent.getParameter("arguments").layout;

              this.getView()
                .getModel("layoutModel")
                .setProperty("/layout", sLayout);
              if (sLayout === "ThreeColumnsMidExpanded") {
                this.getView()
                  .getModel("LocalViewModel")
                  .setProperty("/EditMode", false);
                this.byId("idFullScreenBTN").setIcon("sap-icon://full-screen");
                this._getTicketData(this.sChildID);
              }
              if (
                sLayout === "EndColumnFullScreen" &&
                this.byId("idFullScreenBTN").getIcon() ==
                  "sap-icon://full-screen"
              ) {
                this.getView()
                  .getModel("LocalViewModel")
                  .setProperty("/EditMode", false);
                this.byId("idFullScreenBTN").setIcon(
                  "sap-icon://exit-full-screen"
                );
                this._getTicketData(this.sChildID);
              }
            },

            _bindView: function (data) {
              var object = data.results[0];
              this.object = data.results[0];
              var oHeaderModel = new JSONModel(data.results[0]);
              this.getView().setModel(oHeaderModel, "headerModel");

              if (object.category === "JOB_INFO") {
                this.getView()
                  .getModel("LocalViewModel")
                  .setProperty("/PageTitle", "Job Information Request");
                this.getView()
                  .getModel("LocalViewModel")
                  .setProperty("/jobInfoVisible", true);
                this.getView()
                  .getModel("LocalViewModel")
                  .setProperty("/componesationInfoVisible", false);

             

                this.callWorkflowPendindDataService(object.workflowRequestId);

                // var oComponentModel = this.getComponentModel();
                // var sKey = oComponentModel.createKey("/SF_EmpJob", {
                //   seqNumber: object.externalCode,
                //   startDate: object.effectiveStartDate,
                //   userId: object.employeeId,
                // });
                // var bIsUserManager = this.getOwnerComponent()
                //   .getModel("EmpInfoModel")
                //   .getProperty("/IsUserManager")
                //   .toString();

                // this.getView()
                //   .getModel()
                //   .read(sKey, {
                //     urlParameters: {
                //       $expand: "payGradeNav,positionNav",
                //       IsUserManager: bIsUserManager,
                //       recordStatus: object.status,
                //     },
                //     success: function (oData) {
                //       this.getView().setBusy(false);
                //       this.fnSetDisplaySalryJobInfoModel(oData);
                //     }.bind(this),
                //     error: function () {
                //       this.getView().setBusy(false);
                //       this.fnSetDisplaySalryJobInfoModel(null);
                //     }.bind(this),
                //   });
              } else if (object.category === "COMP_INFO") {
                this.getView()
                  .getModel("LocalViewModel")
                  .setProperty(
                    "/PageTitle",
                    "Compensation Information Request"
                  );
                this.getView()
                  .getModel("LocalViewModel")
                  .setProperty("/componesationInfoVisible", true);
                this.getView()
                  .getModel("LocalViewModel")
                  .setProperty("/jobInfoVisible", false);

               
                this.callWorkflowPendindDataService(object.workflowRequestId);
                // var oComponentModel = this.getComponentModel();
                // var sKey = oComponentModel.createKey("/SF_EmpCompensation", {
                //   seqNumber: object.externalCode,
                //   startDate: object.effectiveStartDate,
                //   userId: object.employeeId,
                // });
                // var bIsUserManager = this.getOwnerComponent()
                //   .getModel("EmpInfoModel")
                //   .getProperty("/IsUserManager")
                //   .toString();

                // this.getView()
                //   .getModel()
                //   .read(sKey, {
                //     urlParameters: {
                //       $expand:
                //         "customString2Nav,empPayCompRecurringNav,employmentNav,eventReasonNav,payGroupNav,payTypeNav/picklistLabels,userNav,wfRequestNav",
                //       IsUserManager: bIsUserManager,
                //       recordStatus: object.status,
                //     },
                //     success: function (oData) {
                //       this.getView().setBusy(false);
                //       this.fnSetDisplaySalryCompInfoModel(oData);
                //     }.bind(this),
                //     error: function () {
                //       this.getView().setBusy(false);
                //       this.fnSetDisplaySalryCompInfoModel(null);
                //     }.bind(this),
                //   });
              }
              this.onCallHistoryData(object.ticketCode);

              this.getView().getModel("LocalViewModel").refresh();
            },

            callWorkflowPendindDataService: function (wfID) {
                if (!wfID) {
                    var oWorkflowPendingDataModel = new JSONModel({
                        items: []
                    });
                    this.getView().setModel(oWorkflowPendingDataModel, "WorkflowPendingDataModel");
                    return false;
                }

                //    var sWFRequestId = "62422";
                this.getView().setBusy(true);

                var oModel = this.getOwnerComponent().getModel("sfsfModel");
                var url = oModel.sServiceUrl + `/getWorkflowPendingData?wfRequestId=${wfID}L`;
                $.ajax({
                    url: url,
                    method: "POST",
                    headers: {
                        "Accept": "application/json"
                    },
                    success: function (oData) {
                        //console.log(oData);
                        this.getView().setBusy(false);
                        if (oData && oData.d.length !== 0) {
                            var items = this.convertResponseToGridItems(oData);
                            var oWorkflowPendingDataModel = new JSONModel({
                                items: items
                            });
                            this.getView().setModel(oWorkflowPendingDataModel, "WorkflowPendingDataModel");
                        }
                    }
                    .bind(this),
                    error: function (err) {
                        console.log(err);
                        this.getView().setBusy(false);
                    }
                    .bind(this),
                });
            },

            convertResponseToGridItems: function (oData) {
                var items = [];
                oData.d[0].workflowAttributeGroups.results.forEach((group) => {
                    group.changeSet.results.forEach((item) => {
                        item.group = group.title ? group.title : "Request Details";
                        items.push(item);
                    });
                });
                items = items.sort(function(a, b){
                    if(a.label < b.label) { return -1; }
                    if(a.label > b.label) { return 1; }
                    return 0;
                });
                return items;
            },

            onCallHistoryData: function (sticketCode) {
              var ticketCodeFilter = new sap.ui.model.Filter({
                path: "ticketCode",
                operator: sap.ui.model.FilterOperator.EQ,
                value1: sticketCode,
              });
              var filter = [];
              filter.push(ticketCodeFilter);
              this.getOwnerComponent()
                .getModel()
                .read("/TicketHistory", {
                  filters: [filter],

                  success: function (oData, oResponse) {
                    var oHistoryData = new JSONModel(oData.results);
                    this.getView().setModel(oHistoryData, "HistoryData");
                  }.bind(this),
                  error: function (oError) {
                    sap.m.MessageBox.error(JSON.stringify(oError));
                  },
                });
            },

            fnSetDisplaySalryJobInfoModel: function (oData) {
              this.getView().setBusy(true);
              var oDisplayJobInfoModel = new JSONModel();
              if (oData != null) {
                var oDisplayJobInfoObj = {
                  Jobposition: oData.positionNav.externalName_defaultValue,
                  assedicCertInitialStateNum: oData.assedicCertInitialStateNum,
                  assedicCertObjectNum: oData.assedicCertObjectNum,
                  assessmentStatus: oData.assessmentStatus,
                  businessUnit: oData.businessUnit,
                  codeOfJobForEldp: oData.codeOfJobForEldp,
                  commitmentIndicator: oData.commitmentIndicator,
                  company: oData.company,
                  continuedSicknessPayMeasure:
                    oData.continuedSicknessPayMeasure,
                  continuedSicknessPayPeriod: oData.continuedSicknessPayPeriod,
                  contractEndDate: oData.contractEndDate,
                  contractId: oData.contractId,
                  contractNumber: oData.contractNumber,
                  contractReferenceForAed: oData.contractReferenceForAed,
                  contractType: oData.contractType,
                  corporation: oData.corporation,
                  costCenter: oData.costCenter,
                  creditForPreviousService: oData.creditForPreviousService,
                  currentWageLevel: oData.currentWageLevel,
                  customString1: oData.customString1,
                  customString10: oData.customString10,
                  customString11: oData.customString11,
                  customString12: oData.customString12,
                  customString13: oData.customString13,
                  customString2: oData.customString2,
                  customString3: oData.customString3,
                  customString4: oData.customString4,
                  customString5: oData.customString5,
                  customString6: oData.customString6,
                  customString7: oData.customString7,
                  customString8: oData.customString8,
                  customString9: oData.customString9,
                  degreeOfProductivity: oData.degreeOfProductivity,
                  department: oData.department,
                  dismissalsNoticePeriodForEmployer:
                    oData.dismissalsNoticePeriodForEmployer,
                  division: oData.division,
                  eeo1JobCategory: oData.eeo1JobCategory,
                  eeo4JobCategory: oData.eeo4JobCategory,
                  eeo5JobCategory: oData.eeo5JobCategory,
                  eeo6JobCategory: oData.assedicCertInitialStateNum,
                  eeoClass: oData.eeoClass,
                  electoralCollegeForLaborCourt:
                    oData.electoralCollegeForLaborCourt,
                  electoralCollegeForWorkersRepresentatives:
                    oData.electoralCollegeForWorkersRepresentatives,
                  electoralCollegeForWorksCouncil:
                    oData.electoralCollegeForWorksCouncil,
                  employeeClass: oData.employeeClass,
                  employeeNoticePeriod: oData.employeeNoticePeriod,
                  employeeType: oData.employeeType,
                  employmentType: oData.employmentType,
                  empRelationship: oData.empRelationship,
                  endDate: oData.endDate,
                  entryIntoGroup: oData.entryIntoGroup,
                  eventReason: oData.eventReason,
                  exchangeRate: oData.exchangeRate,
                  familyRelationshipWithEmployer:
                    oData.familyRelationshipWithEmployer,
                  flsaStatus: oData.flsaStatus,
                  fromCurrency: oData.fromCurrency,
                  guaranteedPayment: oData.guaranteedPayment,
                  harmfulAgentExposure: oData.harmfulAgentExposure,
                  holidayCalendarCode: oData.holidayCalendarCode,
                  initialEntryDate: oData.initialEntryDate,
                  isFulltimeEmployee: oData.isFulltimeEmployee,
                  jobCode: oData.jobCode,
                  jobGroup: oData.jobGroup,
                  jobTitle: oData.jobTitle,
                  laborCourtSector: oData.laborCourtSector,
                  localJobTitle: oData.localJobTitle,
                  location: oData.location,
                  managerId: oData.managerId,
                  notes: oData.notes,
                  noticePeriod: oData.noticePeriod,
                  noticePeriodStartDate: oData.noticePeriodStartDate,
                  occupationalLevels: oData.occupationalLevels,
                  payGrade: oData.payGrade,
                  payGroup: oData.payGroup,
                  payScaleArea: oData.payScaleArea,
                  payScaleGroup: oData.payScaleGroup,
                  payScaleLevel: oData.payScaleLevel,
                  payScaleType: oData.payScaleType,
                  periodIndicator: oData.periodIndicator,
                  position: oData.assedicCertInitialStateNum,
                  probationaryPeriod: oData.probationaryPeriod,
                  probationaryPeriodMeasure: oData.probationaryPeriodMeasure,
                  probationPeriodEndDate: oData.probationPeriodEndDate,
                  regularTemp: oData.regularTemp,
                  seqNumber: oData.seqNumber,
                  sickPaySupplement: oData.sickPaySupplement,
                  sickPaySupplementMeasure: oData.sickPaySupplementMeasure,
                  sickPaySupplementPeriod: oData.sickPaySupplementPeriod,
                  standardHours: oData.standardHours,
                  startDate: oData.startDate,
                  timeRecordingAdmissibilityCode:
                    oData.timeRecordingAdmissibilityCode,
                  timeRecordingProfileCode: oData.timeRecordingProfileCode,
                  timeRecordingVariant: oData.timeRecordingVariant,
                  timeTypeProfileCode: oData.timeTypeProfileCode,
                  timezone: oData.timezone,
                  toCurrency: oData.toCurrency,
                  travelDistance: oData.travelDistance,
                  tupeOrgNumber: oData.tupeOrgNumber,
                  userId: oData.userId,
                  validFrom: oData.validFrom,
                  workerCategory: oData.workerCategory,
                  workingDaysPerWeek: oData.workingDaysPerWeek,
                  workLocation: oData.workLocation,
                  workPermitExpiry: oData.workPermitExpiry,
                  workscheduleCode: oData.workscheduleCode,
                  wtdHoursLimit: oData.wtdHoursLimit,
                };
                oDisplayJobInfoModel = new JSONModel(oDisplayJobInfoObj);
              }

              this.getView().setModel(
                oDisplayJobInfoModel,
                "DisplayJobInfoModel"
              );
              this.getView().setBusy(false);
            },

            fnSetDisplaySalryCompInfoModel: function (oData) {
              this.getView().setBusy(true);
              var oDisplayCompInfoModel = new JSONModel();

              if (oData != null) {
                var oDisplayCompInfoObj = {
                  payGroup: oData.payGroupNav
                    ? `${oData.payGroupNav.name} (${oData.payGroupNav.externalCode})`
                    : oData.payGroup,
                  isEligibleForCar: oData.isEligibleForCar,
                  customDouble1: oData.customDouble1,
                  customString2: oData.customString2,
                  payType: oData.payTypeNav
                    ? `${oData?.payTypeNav.picklistLabels.results[0].label} (${oData.payTypeNav.id})`
                    : oData.payType,
                  customDate1: oData.customDate1,
                  customString3: oData.customString3,
                  country: oData.userNav.country,
                  componesationDetails: oData.empPayCompRecurringNav.results,
                  startDate: oData.startDate,
                };

                oDisplayCompInfoModel = new JSONModel(oDisplayCompInfoObj);
              }

              this.getView().setModel(
                oDisplayCompInfoModel,
                "DisplayCompInfoModel"
              );
              this.getView().getModel("DisplayCompInfoModel").refresh();
              this.getView().setBusy(false);
            },

            onEditPress: function () {
              this.getView()
                .getModel("LocalViewModel")
                .setProperty("/EditMode", true);
            },

            onCancelPress: function () {
              this.getView()
                .getModel("LocalViewModel")
                .setProperty("/EditMode", false);
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
                layout: sLayout,
              });
            },

            onSavePress: function () {
              // if (!this._validateMandatoryFields()) {
              //     return;
              // }
              var oPayloadObj = {},
                sEntityPath = null,
                oComponentModel = this.getComponentModel(),
                sKey = null,
                sKey = oComponentModel.createKey("/SF_EmpCompensation", {
                  seqNumber: this.object.externalCode,
                  startDate: this.object.effectiveStartDate,
                  userId: this.object.employeeId,
                });
              sEntityPath = sKey;
              oPayloadObj = this.fnGetCompensationRequestPayload();
              this.getView().setBusy(true);
              this.getView()
                .getModel()
                .update(sEntityPath, oPayloadObj, {
                  urlParameters: {
                    ticketId: this.sChildID,
                  },
                  success: function (oResponse) {
                    this.getView().setBusy(false);
                    sap.m.MessageBox.success("Request Submitted successfully.");
                    this.getView().getModel().refresh();
                    this.getView()
                      .getModel("LocalViewModel")
                      .setProperty("/EditMode", false);
                  }.bind(this),
                  error: function (oError) {
                    this.getView().setBusy(false);
                    sap.m.MessageBox.error(
                      JSON.parse(
                        JSON.parse(oError.responseText).error.message.value
                      ).error.message.value.split("]")[1]
                    );
                    this.getView().getModel().refresh();
                  }.bind(this),
                });
            },

            fnGetCompensationRequestPayload: function () {
              var sUserID = this.getOwnerComponent()
                .getModel("EmpInfoModel")
                .getData().userId;

              var sMonthlyBasic = this.getView()
                  .byId("idEditMonthlyBasic")
                  .getValue(),
                sEffectiveStartDateDate = this.getView()
                  .byId("idEditSchemeDate")
                  .getDateValue(),
                dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                  pattern: "yyyy-MM-dd",
                });
              sEffectiveStartDateDate = dateFormat.format(
                new Date(sEffectiveStartDateDate)
              );
              sEffectiveStartDateDate = sEffectiveStartDateDate + "T00:00:00";
              sEffectiveStartDateDate = dateFormat.format(
                new Date(sEffectiveStartDateDate)
              );
              sEffectiveStartDateDate = sEffectiveStartDateDate + "T00:00:00";
              return {
                seqNumber: this.object.externalCode,
                userId: sUserID,
                startDate: sEffectiveStartDateDate,
                customDouble1: parseInt(sMonthlyBasic),
              };
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
                layout: sLayout,
              });
            },

            onApprovePress: function () {
              var swfRequestId = this.getView()
                .getModel("headerModel")
                .getProperty("/workflowRequestId");
              this.onApproveRequest(swfRequestId);
            },

            onRejectPress: function () {
              var swfRequestId = this.getView()
                .getModel("headerModel")
                .getProperty("/workflowRequestId");
              this.onRejectRequest(swfRequestId);
            },
          }
        );
    });