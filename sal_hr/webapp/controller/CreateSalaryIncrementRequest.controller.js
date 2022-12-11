sap.ui.define(
    [
        "./BaseController",
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/json/JSONModel",
        "sap/m/MessageBox",
        "sap/m/upload/Uploader",
        "sap/m/UploadCollectionParameter",
        "sap/ui/core/Fragment",
        "sap/ui/Device",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "com/sal/salhr/model/formatter"
    ],
    function (
        BaseController,
        Controller,
        JSONModel,
        MessageBox,
        Uploader,
        UploadCollectionParameter,
        Fragment,
        Device,
        Filter,
        FilterOperator,
        formatter
    ) {
        "use strict";
        return BaseController.extend(
            "com.sal.salhr.controller.CreateSalaryIncrementRequest",
            {
                formatter: formatter,
                onInit: function () {
                    this.oRouter = this.getRouter();
                    this.oRouter
                        .getRoute("SalaryIncrementRequest")
                        .attachPatternMatched(this._onObjectMatched, this);
                    this.mainModel = this.getOwnerComponent().getModel();
                    this.mainModel.setSizeLimit(1000);
                    var oLocalViewModel = new JSONModel({
                        busy: false,
                        currentDate: new Date(),
                        minDate: new Date(),
                        jobInfoVisible: false,
                        componesationInfoVisible: false,
                        checkBoxVisible: false
                    });
                    this.getView().setModel(oLocalViewModel, "LocalViewModel");
                    var oTimezonesModel = this.getOwnerComponent().getModel("timezonesData");
                    oTimezonesModel.setSizeLimit(500);
                    this.getView().setModel(oTimezonesModel, "TimezonesModel");
                    this.initDropdowns();
                },
                _onObjectMatched: function (oEvent) {
                    this.sParentID = oEvent.getParameter("arguments").parentMaterial;
                    this.sChildID = oEvent.getParameter("arguments").childModule;
                    var sLayout = oEvent.getParameter("arguments").layout;
                    this.getView()
                        .getModel("layoutModel")
                        .setProperty("/layout", sLayout);
                    
                    this.EmpInfoObj = this.getOwnerComponent()
                        .getModel("EmpInfoModel")
                        .getData();
                    
                    // this.EmpInfoObj.IsUserManager = true;
                    if(!this.EmpInfoObj.IsUserManager) {
                        // not authorized
                        if(!this.PRNFlag) {
                            MessageBox.error("You do not have permission to perform this action");
                            this.oRouter.navTo("detail", {
                                parentMaterial: this.sParentID,
                                layout: "TwoColumnsMidExpanded",
                            });
                            return;
                        }
                    }
                    
                    this.onResetPress();
                    this.managerID = this.EmpInfoObj.userId;
                    // this.managerID = '12000843';
                },
                onSelectCompensation: function (oEve) {
                    if (oEve.getSource().getSelected()) {
                        this.getView()
                            .getModel("LocalViewModel")
                            .setProperty("/componesationInfoVisible", true);
                        this.setCompensationModel(this.oCompensationModel);
                    } else {
                        this.getView()
                            .getModel("LocalViewModel")
                            .setProperty("/componesationInfoVisible", false);
                    }
                },
                onSelectJobInfo: function (oEve) {
                    if (oEve.getSource().getSelected()) {
                        this.getView()
                            .getModel("LocalViewModel")
                            .setProperty("/jobInfoVisible", true);
                        this.setJobModel(this.oJobModel);
                    } else {
                        this.getView()
                            .getModel("LocalViewModel")
                            .setProperty("/jobInfoVisible", false);
                    }
                },
                _bindView: function (data) {
                    var sUserID;
                    this.getView().setBusy(true);
                    this.EmpInfoObj = this.getOwnerComponent()
                        .getModel("EmpInfoModel")
                        .getData();

                    if (this.PRNFlag) {
                        sUserID = this.prnID;
                    } else {
                        sUserID = this.EmpInfoObj.userId;
                    }
                    this.getUserJobInfo(sUserID);
                    this.getUserCompInfo(sUserID);
                },

                getUserJobInfo: function(userId) {
                    this.getView().setBusy(true);
                    var oComponentModel = this.getComponentModel(),
                        that = this;
                    
                    var sJobKey = "/SF_EmpJob";

                    var oFilter = new Filter(
                        [
                            new Filter(
                            "userId",
                            FilterOperator.EQ,
                            userId
                        ), new Filter(
                            "effectiveLatestChange",
                            FilterOperator.EQ,
                            true
                        )], true 
                    );

                    this.getView()
                        .getModel()
                        .read(sJobKey, {
                            filters: [oFilter],
                            urlParameters: {
                                $top: 1,
                                $expand: "positionNav, costCenterNav, jobCodeNav, managerUserNav",
                                $orderby: "startDate desc"
                            },
                            success: function (oData) {
                                that.getView().setBusy(false);
                                var oJobModel = new JSONModel(oData.results[0]);
                                that.oJobModel = oJobModel;
                                // ******************** New *****************************
                                that.getView().getModel("LocalViewModel").setProperty("/checkBoxVisible", true);
                                // ************************************************************
                            },
                            error: function (oError) {
                                that.getView().setBusy(false);
                                // initialize new model
                                that.oJobModel = new JSONModel({
                                    countryOfCompany: "SAU"
                                });
                                // sap.m.MessageBox.error(that.parseResponseError(oError.responseText));
                            },
                        });
                },

                getUserCompInfo: function(userId) {
                    var oComponentModel = this.getComponentModel(),
                    that = this;

                    var sCompKey = "/SF_EmpCompensation";

                    var oFilter = new Filter(
                        [
                            new Filter(
                            "userId",
                            FilterOperator.EQ,
                            userId
                        )], true 
                    );

                    this.getView()
                        .getModel()
                        .read(sCompKey, {
                            filters: [oFilter],
                            urlParameters: {
                                $top: 1,
                                $orderby: "startDate desc"
                            },
                            success: function (oData) {
                                that.getView().setBusy(false);
                                var oCompensationModel = new JSONModel(oData.results[0]);
                                that.oCompensationModel = oCompensationModel;
                            },
                            error: function (oError) {
                                that.getView().setBusy(false);
                                // initialize new model
                                that.oCompensationModel = new JSONModel({
                                    customString2: "SAU"
                                });
                              
                            },
                        });
                },
                onRaiseRequestPress: function () {
                    var sjobInfo = this.getView().byId("idJobInfo").getSelected(),
                        sCompensationInfo = this.getView()
                            .byId("idCompensationInfo")
                            .getSelected();
                    var oJobPayload = null,
                        oCompPayload = null,
                        sEntityPath = null;

                    if (sjobInfo === true) {
                        sEntityPath = "/SF_EmpJob",
                        oJobPayload = this.fnGetJobRequestPayload();
                        this.raiseRequest(sEntityPath, oJobPayload, function(oData1, oResponse1) {
                            // jobInfo saved now saving compInfo
                            if (sCompensationInfo === true) {
                                sEntityPath = "/SF_EmpCompensation",
                                oCompPayload = this.fnGetCompensationRequestPayload();
                                this.raiseRequest(sEntityPath, oCompPayload, this.redirectToListPage);
                            } else {
                                // compInfo not required to be saved
                                // redirect to list page
                                this.redirectToListPage(oData1, oResponse1);
                            }
                        });
                    } else {
                        if (sCompensationInfo === true) {
                            sEntityPath = "/SF_EmpCompensation",
                            oCompPayload = this.fnGetCompensationRequestPayload();
                            this.raiseRequest(sEntityPath, oCompPayload, this.redirectToListPage);
                        }
                    }
                },

                redirectToListPage: function(oData, oResponse) {
                    sap.m.MessageBox.success("Request Submitted Successfully.");
                    this.getView().setBusy(false);
                    this.getView().getModel().refresh();
                    this.oRouter.navTo("detail", {
                        parentMaterial: this.sParentID,
                        layout: "TwoColumnsMidExpanded",
                    });
                },

                raiseRequest: function(sEntityPath, oPayload, resolve) {
                    var sValidationErrorMsg = this.fnValidateSalaryIncPayload();
                    var sErrMsg;
                    if (sValidationErrorMsg === "") {
                        var newKey = sEntityPath + `(seqNumber=${oPayload.seqNumber}L,startDate=datetime'${oPayload.startDate}',userId='${oPayload.userId}')`;
                        newKey = newKey.replace(/:/g, "%3A");
                        var oldKey = sEntityPath;
                        if(oPayload.__metadata) {
                            oldKey = sEntityPath + oPayload.__metadata.uri.split(sEntityPath)[1];
                        }
                        if(oldKey == newKey) {
                            // update scenario
                            this.mainModel.update(oldKey, oPayload, {
                                success: resolve.bind(this),
                                error: function (oError) {
                                    this.getView().setBusy(false);
                                    // sap.m.MessageBox.error(this.parseResponseError(oError.responseText));
                                    sErrMsg = this.parseResponseError(oError.responseText);
                                    sap.m.MessageBox.error(sErrMsg.split("???")[1]);
                                    this.getView().getModel().refresh();
                                }.bind(this),
                            });
                        } else {
                            // create scenario
                            this.mainModel.create(sEntityPath, oPayload, {
                                success: resolve.bind(this),
                                error: function (oError) {
                                    this.getView().setBusy(false);
                                    sErrMsg = this.parseResponseError(oError.responseText);
                                    sap.m.MessageBox.error(sErrMsg.split("???")[1]);
                                    this.getView().getModel().refresh();
                                }.bind(this),
                            });
                        }
                    } else {
                        this.getView().setBusy(false);
                        sap.m.MessageBox.error(sValidationErrorMsg);
                    }
                },

                fnGetJobRequestPayload: function () {
                    var sJobData = this.getView().getModel("jobModel").getData() ? this.getView().getModel("jobModel").getData() : {},
                        sNewPayload = $.extend(true, {}, sJobData);
                        
                    sNewPayload.startDate = this.getFormattedDateValue("idStartDate");

                    if (sNewPayload.workingDaysPerWeek == undefined || sNewPayload.workingDaysPerWeek == null) {
                        sNewPayload.workingDaysPerWeek = 5;
                    } else if (sNewPayload.workingDaysPerWeek > 7) {
                        sNewPayload.workingDaysPerWeek = 7;
                    }

                    delete sNewPayload.assessmentStatusNav;
                    delete sNewPayload.businessUnitNav;
                    delete sNewPayload.codeOfJobForEldpNav;
                    delete sNewPayload.commitmentIndicatorNav;
                    delete sNewPayload.companyNav;
                    delete sNewPayload.continuedSicknessPayMeasureNav;
                    delete sNewPayload.costCenterNav;
                    delete sNewPayload.customString1Nav;
                    delete sNewPayload.customString2Nav;
                    delete sNewPayload.customString3Nav;
                    delete sNewPayload.customString4Nav;
                    delete sNewPayload.customString5Nav;
                    delete sNewPayload.customString6Nav;
                    delete sNewPayload.customString7Nav;
                    delete sNewPayload.customString9Nav;
                    delete sNewPayload.customString10Nav;
                    delete sNewPayload.customString11Nav;
                    delete sNewPayload.customString12Nav;
                    delete sNewPayload.customString13Nav;
                    delete sNewPayload.departmentNav;
                    delete sNewPayload.dismissalsNoticePeriodForEmployerNav;
                    delete sNewPayload.divisionNav;
                    delete sNewPayload.eeo1JobCategoryNav;
                    delete sNewPayload.eeoClass;
                    delete sNewPayload.electoralCollegeForLaborCourtNav;
                    delete sNewPayload.electoralCollegeForWorkersRepresentativesNav;
                    delete sNewPayload.electoralCollegeForWorksCouncilNav;
                    delete sNewPayload.empRelationshipNav;
                    delete sNewPayload.emplStatusNav;
                    delete sNewPayload.employeeClassNav;
                    delete sNewPayload.employeeNoticePeriodNav;
                    delete sNewPayload.employeeTypeNav;
                    delete sNewPayload.employmentNav;
                    delete sNewPayload.employmentTypeNav;
                    delete sNewPayload.eventNav;
                    delete sNewPayload.eventReasonNav;
                    delete sNewPayload.familyRelationshipWithEmployerNav;
                    delete sNewPayload.flsaStatusNav;
                    delete sNewPayload.fromCurrencyNav;
                    delete sNewPayload.harmfulAgentExposureNav;
                    delete sNewPayload.jobCodeNav;
                    delete sNewPayload.laborCourtSectorNav;
                    delete sNewPayload.locationNav;
                    delete sNewPayload.managerEmploymentNav;
                    delete sNewPayload.managerUserNav;
                    delete sNewPayload.occupationalLevelsNav;
                    delete sNewPayload.operation;
                    delete sNewPayload.payGradeNav;
                    delete sNewPayload.payGroupNav;
                    delete sNewPayload.payScaleAreaNav;
                    delete sNewPayload.payScaleGroupNav;
                    delete sNewPayload.payScaleLevelNav;
                    delete sNewPayload.payScaleTypeNav;
                    delete sNewPayload.periodIndicatorNav;
                    delete sNewPayload.positionNav;
                    delete sNewPayload.probationaryPeriodMeasureNav;
                    delete sNewPayload.regularTempNav;
                    delete sNewPayload.toCurrencyNav;
                    delete sNewPayload.userNav;
                    delete sNewPayload.wfRequestNav;
                    delete sNewPayload.workerCategoryNav;
                    return sNewPayload;
                },
                fnGetCompensationRequestPayload: function () {
                    var sCompData = this.getView()
                        .getModel("compensationModel")
                        .getData(),
                        sNewPayload = $.extend(true, {}, sCompData);
               

                    sNewPayload.startDate = this.getFormattedDateValue("idStartDate");
                    sNewPayload.customDate1 = this.getFormattedDateValue("idSchemeChangeDate");

                    delete sNewPayload.customString4;
                    delete sNewPayload.createdBy;
                    delete sNewPayload.createdDateTime;
                    delete sNewPayload.createdOn;
                    delete sNewPayload.customString2Nav;
                    delete sNewPayload.employmentNav;
                    delete sNewPayload.event;
                    delete sNewPayload.eventNav;
                    delete sNewPayload.eventReason;
                    delete sNewPayload.eventReasonNav;
                    delete sNewPayload.lastModifiedBy;
                    delete sNewPayload.lastModifiedDateTime;
                    delete sNewPayload.lastModifiedOn;
                    delete sNewPayload.operation;
                    delete sNewPayload.payGroupNav;
                    delete sNewPayload.userNav;
                    delete sNewPayload.wfRequestNav;
                    delete sNewPayload.empPayCompRecurringNav;
                    delete sNewPayload.payTypeNav;
                    sNewPayload.isEligibleForCar = JSON.parse(
                        sNewPayload.isEligibleForCar
                    );
                    return sNewPayload;
                },
                fnValidateSalaryIncPayload: function () {
                    this.getView().setBusy(true);
                    var sjobInfo = this.getView().byId("idJobInfo").getSelected(),
                        sCompensationInfo = this.getView()
                            .byId("idCompensationInfo")
                            .getSelected();
                    var sValidationErrorMsg = "",
                        oStartDatePicker = this.byId("idStartDate"),
                       
                        oCompany = this.byId("idCompany"),
                        oLocation = this.byId("idLocation"),
                      
                        sPayScaleType = this.byId("idPayScaleType"),
                        sPayScaleArea = this.byId("idPayScaleArea"),
                        sContractType = this.byId("idContractType"),
                        sCompCountry = this.byId("idCompCountry"),
                        sCommision = this.byId("idCommision"),
                        sCompanyPayGroup = this.byId("idCompPayGroup"),
                        oPRNId = this.byId("idSalIncPRN");
                    if (sjobInfo === true) {
                        
                        if (!oCompany.getSelectedKey()) {
                            oCompany.setValueState("Error");
                            oCompany.setValueStateText("Please select Company.");
                            sValidationErrorMsg = "Please fill the all required fields.";
                        } else {
                            oCompany.setValueState("None");
                        }
                        // validate Location Field
                        if (!oLocation.getSelectedKey()) {
                            oLocation.setValueState("Error");
                            oLocation.setValueStateText("Please select Location.");
                            sValidationErrorMsg = "Please fill the all required fields.";
                        } else {
                            oLocation.setValueState("None");
                        }

                      


                        // validate Pay Scale Type
                        if (!sPayScaleType.getSelectedKey()) {
                            sPayScaleType.setValueState("Error");
                            sPayScaleType.setValueStateText("Please select Pay Scale Type.");
                            sValidationErrorMsg = "Please fill the all required fields.";
                        } else {
                            sPayScaleType.setValueState("None");
                        }
                        // validate Pay Scale Area
                        if (!sPayScaleArea.getSelectedKey()) {
                            sPayScaleArea.setValueState("Error");
                            sPayScaleArea.setValueStateText("Please select Pay Scale Area.");
                            sValidationErrorMsg = "Please fill the all required fields.";
                        } else {
                            sPayScaleArea.setValueState("None");
                        }
                        // validate Contract Type
                        if (!sContractType.getSelectedKey()) {
                            sContractType.setValueState("Error");
                            sContractType.setValueStateText("Please select Contract Type.");
                            sValidationErrorMsg = "Please fill the all required fields.";
                        } else {
                            sContractType.setValueState("None");
                        }

                    } 
                    
                    if (sCompensationInfo === true) {
                        // validate Comp Pay Group
                        if (!sCompanyPayGroup.getSelectedKey()) {
                            sCompanyPayGroup.setValueState("Error");
                            sCompanyPayGroup.setValueStateText("Please select Company.");
                            sValidationErrorMsg = "Please fill the all required fields.";
                        } else {
                            sCompanyPayGroup.setValueState("None");
                        }
                        // Validate Comp Country
                        if (!sCompCountry.getSelectedKey()) {
                            sCompCountry.setValueState("Error");
                            sCompCountry.setValueStateText("Please enter Country");
                            sValidationErrorMsg = "Please fill the all required fields.";
                        } else {
                            sCompCountry.setValueState("None");
                        }
                        // Validate Commision
                        if (!sCommision.getValue()) {
                            sCommision.setValueState("Error");
                            sCommision.setValueStateText("Please enter Country");
                            sValidationErrorMsg = "Please fill the all required fields.";
                        } else {
                            sCommision.setValueState("None");
                        }
                    }
                    // Validate Effective Start Date
                    if (!oStartDatePicker.getValue()) {
                        oStartDatePicker.setValueState("Error");
                        oStartDatePicker.setValueStateText(
                            "Please select Efective Start date"
                        );
                        sValidationErrorMsg = "Please fill the all required fields.";
                    } else {
                        oStartDatePicker.setValueState("None");
                    }
                    // Validate PRN Value
                    if (!oPRNId.getValue() && this.getOwnerComponent().getModel("EmpInfoModel").getProperty("/IsUserManager") === true) {
                        oPRNId.setValueState("Error");
                        oPRNId.setValueStateText("Please select PRN value");
                        sValidationErrorMsg = "Please fill the all required fields.";
                    } else {
                        oPRNId.setValueState("None");
                    }
                    return sValidationErrorMsg;
                },
                onCreateCancelPress: function () {
                    this.oRouter.navTo("detail", {
                        parentMaterial: this.sParentID,
                        layout: "TwoColumnsMidExpanded",
                    });
                    this.mainModel.refresh();
                },
                onResetPress: function () {
                    this.getView()
                        .getModel("LocalViewModel")
                        .setProperty("/checkBoxVisible", false);
                    this.getView()
                        .getModel("LocalViewModel")
                        .setProperty("/componesationInfoVisible", false);
                    this.getView()
                        .getModel("LocalViewModel")
                        .setProperty("/jobInfoVisible", false);
                    this.getView().byId("idJobInfo").setSelected(false);
                    this.getView().byId("idCompensationInfo").setSelected(false);
                    this.oJobModel = null;
                    this.oCompensationModel = null;
                    this.PRNFlag = false;
                    this.prnID = null;
                    this.byId("idSalIncPRN").setValue(null);
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
                        uploadAttachment: true,
                    };
                    this.getView().byId("idRecCheckbox").setSelected(false);
                    this.getView().getModel("LocalViewModel").setData(dataReset);
                    this.getView().getModel("LocalViewModel").refresh();
                },
                onDirectMngrValueHelpRequest: function () {
                    var oView = this.getView();
                    if (!this._directMngrDialog) {
                        this._directMngrDialog = Fragment.load({
                            id: oView.getId(),
                            name:
                                "com.sal.salhr.Fragments.SalaryIncrementModule.DirectManagerValuehelp",
                            controller: this,
                        }).then(function (oDialog) {
                            oView.addDependent(oDialog);
                            if (Device.system.desktop) {
                                oDialog.addStyleClass("sapUiSizeCompact");
                            }
                            return oDialog;
                        });
                    }
                    this._directMngrDialog.then(function (oDialog) {

                        oDialog.open();
                    }.bind(this));

                },

                onDirectMngrConfirm: function (oEvent) {
                    var oSelectedItem = oEvent.getParameter("selectedItem");
                    oEvent.getSource().getBinding("items").filter([]);
                    if (!oSelectedItem) {
                        return;
                    }
                    var obj = oSelectedItem.getBindingContext().getObject();

                    this.getView().getModel("jobModel").setProperty("/managerId", obj["userId"]);
                    this.getView().getModel("jobModel").setProperty("/managerUserNav", obj);

                },

                onDirectMngrSearch: function (oEvent) {

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

                    var commonFilter = [];

                    if (onameFilter.length > 0) {
                        commonFilter.push(new Filter(onameFilter, false));
                    }

                    var oFilter = new Filter(commonFilter, true);

                    oEvent.getSource().getBinding("items").filter([oFilter]);
                },

                onJobClasssificationValueHelpRequest: function () {
                    var oView = this.getView();
                    if (!this._JobClassificationDialog) {
                        this._JobClassificationDialog = Fragment.load({
                            id: oView.getId(),
                            name:
                                "com.sal.salhr.Fragments.SalaryIncrementModule.JobClassification",
                            controller: this,
                        }).then(function (oDialog) {
                            oView.addDependent(oDialog);
                            if (Device.system.desktop) {
                                oDialog.addStyleClass("sapUiSizeCompact");
                            }
                            return oDialog;
                        });
                    }
                    this._JobClassificationDialog.then(function (oDialog) {

                        oDialog.open();
                    }.bind(this));
                },

                onJobClassificationConfirm: function (oEvent) {
                    var oSelectedItem = oEvent.getParameter("selectedItem");
                    oEvent.getSource().getBinding("items").filter([]);
                    if (!oSelectedItem) {
                        return;
                    }
                    var obj = oSelectedItem.getBindingContext().getObject();

                    this.getView().getModel("jobModel").setProperty("/jobCode", obj["externalCode"]);
                    this.getView().getModel("jobModel").setProperty("/jobCodeNav", obj);
                },


                onCostCenterRequest: function () {
                    var oView = this.getView();
                    if (!this._costCenterDialog) {
                        this._costCenterDialog = Fragment.load({
                            id: oView.getId(),
                            name:
                                "com.sal.salhr.Fragments.SalaryIncrementModule.CostCenterValuehelp",
                            controller: this,
                        }).then(function (oDialog) {
                            oView.addDependent(oDialog);
                            if (Device.system.desktop) {
                                oDialog.addStyleClass("sapUiSizeCompact");
                            }
                            return oDialog;
                        });
                    }
                    this._costCenterDialog.then(function (oDialog) {

                        oDialog.open();
                    }.bind(this));

                },

                onCostCenterConfirm: function (oEvent) {
                    var oSelectedItem = oEvent.getParameter("selectedItem");
                    oEvent.getSource().getBinding("items").filter([]);
                    if (!oSelectedItem) {
                        return;
                    }
                    var obj = oSelectedItem.getBindingContext().getObject();

                    this.getView().getModel("jobModel").setProperty("/costCenter", obj["externalCode"]);
                    this.getView().getModel("jobModel").setProperty("/costCenterNav", obj);

                },

                onCostCenterValueHelpSearch: function (oEvent) {
                    var sValue = oEvent.getParameter("value").trim();
                    var oFilter = new Filter(
                        [
                            new Filter({
                                path: "externalCode",
                                operator: "Contains",
                                caseSensitive: false,
                                value1: sValue.trim()
                            }),
                            new Filter({
                                path: "name",
                                operator: "Contains",
                                caseSensitive: false,
                                value1: sValue.trim()
                            })
                        ],
                        false
                    );

                    oEvent.getSource().getBinding("items").filter([oFilter]);
                },
                onPositionRequest: function (oEvent) {
                    var oView = this.getView();
                    if (!this._positionDialog) {
                        this._positionDialog = Fragment.load({
                            id: oView.getId(),
                            name:
                                "com.sal.salhr.Fragments.SalaryIncrementModule.PositionValuehelp",
                            controller: this,
                        }).then(function (oDialog) {
                            oView.addDependent(oDialog);
                            if (Device.system.desktop) {
                                oDialog.addStyleClass("sapUiSizeCompact");
                            }
                            return oDialog;
                        });
                    }
                    this._positionDialog.then(function (oDialog) {

                        oDialog.open();
                    }.bind(this));
                },


                onPositionConfirm: function (oEvent) {
                    var oSelectedItem = oEvent.getParameter("selectedItem");
                    oEvent.getSource().getBinding("items").filter([]);
                    if (!oSelectedItem) {
                        return;
                    }
                    var obj = oSelectedItem.getBindingContext().getObject();

                    this.setJobOrgInfoModel(obj);

                    this.getView().getModel("jobModel").setProperty("/positionNav", obj);
                    this.getView().getModel("jobModel").setProperty("/position", obj["code"]);

                },

                onPositionValueHelpSearch: function (oEvent) {
                    var sValue = oEvent.getParameter("value").trim();
                    var oFilter = [];
                    if(sValue && sValue.length > 0) {
                        oFilter = [new Filter(
                            [
                                new Filter({
                                    path: "externalName_defaultValue",
                                    operator: "Contains",
                                    caseSensitive: false,
                                    value1: sValue.trim()
                                }),
                                new Filter({
                                    path: "code",
                                    operator: "Contains",
                                    caseSensitive: false,
                                    value1: sValue.trim()
                                })
                            ],
                            false
                        )];
                    }
                    oEvent.getSource().getBinding("items").filter(oFilter);
                },

                onJobClassificationValueHelpSearch: function (oEvent) {
                    var sValue = oEvent.getParameter("value").trim();
                    var oFilter = [];
                    if(sValue && sValue.length > 0) {
                        oFilter = [new Filter(
                            [
                                new Filter({
                                    path: "name",
                                    operator: "Contains",
                                    caseSensitive: false,
                                    value1: sValue.trim()
                                }),
                                new Filter({
                                    path: "externalCode",
                                    operator: "Contains",
                                    caseSensitive: false,
                                    value1: sValue.trim()
                                })
                            ],
                            false
                        )];
                    }
                    oEvent.getSource().getBinding("items").filter(oFilter);
                },

                onValueHelpRequest: function (oEvent) {
                    var oView = this.getView();
                    if (!this._pDialog) {
                        this._pDialog = Fragment.load({
                            id: oView.getId(),
                            name: "com.sal.salhr.Fragments.PRNValueHelp",
                            controller: this,
                        }).then(function (oDialog) {
                            oView.addDependent(oDialog);
                            if (Device.system.desktop) {
                                oDialog.addStyleClass("sapUiSizeCompact");
                            }
                            return oDialog;
                        });
                    }
                    this._pDialog.then(
                        function (oDialog) {
                            var oList = oDialog
                                .getAggregation("_dialog")
                                .getAggregation("content")[1];
                            var userId = this.managerID;
                            var sUserIDFilter = new sap.ui.model.Filter({
                                path: "manager/userId",
                                operator: sap.ui.model.FilterOperator.EQ,
                                value1: userId
                            });
                            oList.getBinding("items").filter([sUserIDFilter]);
                            oDialog.open();
                        }.bind(this)
                    );
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
                    // ************* old ****************************
                    // this.getView()
                    //     .getModel("LocalViewModel")
                    //     .setProperty("/checkBoxVisible", true);
                    // *******************************************************    
                    var obj = oSelectedItem.getBindingContext().getObject();
                    this.byId("idSalIncPRN").setValue(`${obj["defaultFullName"]} (${obj["userId"]})`);
                    this.byId("idSalIncPRN").setValueState("None");
                    this.PRNFlag = true;
                    this.prnID = obj["userId"];
                    this.getView()
                        .getModel("LocalViewModel")
                        .setProperty("/componesationInfoVisible", false);
                    this.getView()
                        .getModel("LocalViewModel")
                        .setProperty("/jobInfoVisible", false);
                    this.getView().byId("idJobInfo").setSelected(false);
                    this.getView().byId("idCompensationInfo").setSelected(false);
                    this._bindView();

                },

                onBusinessUnitChange: function (oEvent) {
                    var selectedItem = oEvent.oSource.getSelectedItem();
                    var oLocalViewModel = this.getView().getModel("LocalViewModel");
                    this.getView().byId("idDivision").setSelectedKey(null);
                    this.getView().byId("idDivision").fireChange();
                    if(!selectedItem) {
                        oLocalViewModel.setProperty("/divisionEnabled", false);
                        return;
                    }
                    var businessUnit = selectedItem.getKey();
                    this.onSelectBusinessUnit(businessUnit, null);
                },

                onSelectBusinessUnit: function(businessUnit, callback) {
                    var oLocalViewModel = this.getView().getModel("LocalViewModel");
                    this.getView().byId("idDivision").setBusy(true);
                    // load division dropdown
                    var oFilter = new Filter(
                        [
                            new Filter(
                            "status",
                            FilterOperator.EQ,
                            'A'
                        ), new Filter(
                            "cust_toBusinessUnit/externalCode",
                            FilterOperator.EQ,
                            businessUnit
                        )], true 
                    );
                    this.getView()
                    .getModel()
                    .read("/SF_Division", {
                        filters: [oFilter],
                        urlParameters: {
                            $orderby: "name"
                        },
                        success: function (oData) {
                            var oModel = new JSONModel(oData.results);
                            this.getView().setModel(oModel, "DivisionModel");
                            oLocalViewModel.setProperty("/divisionEnabled", true);
                            this.getView().byId("idDivision").setBusy(false);
                            if(callback) {
                                callback();
                            }
                        }.bind(this),
                        error: function (oError) {
                            this.getView().byId("idDivision").setBusy(false);
                            sap.m.MessageBox.error(
                                JSON.parse(oError.responseText).error.message.value
                            );
                        }.bind(this),
                    });
                },

                onDivisionChange: function (oEvent) {
                    var selectedItem = oEvent.oSource.getSelectedItem();
                    var oLocalViewModel = this.getView().getModel("LocalViewModel");
                    this.getView().byId("idDepartment").setSelectedKey(null);
                    this.getView().byId("idDepartment").fireChange();
                    if(!selectedItem) {
                        oLocalViewModel.setProperty("/departmentEnabled", false);
                        return;
                    }
                    var division = selectedItem.getKey();
                    this.onSelectDivision(division, null);
                },

                onSelectDivision(division, callback) {
                    var oLocalViewModel = this.getView().getModel("LocalViewModel");
                    this.getView().byId("idDepartment").setBusy(true);
                    // load department dropdown
                    var oFilter = new Filter(
                        [
                            new Filter(
                            "status",
                            FilterOperator.EQ,
                            'A'
                        ), new Filter(
                            "cust_toDivision/externalCode",
                            FilterOperator.EQ,
                            division
                        )], true 
                    );
                    this.getView()
                        .getModel()
                        .read("/SF_Department", {
                            filters: [oFilter],
                            urlParameters: {
                                $orderby: "name"
                            },
                            success: function (oData) {
                                var oModel = new JSONModel(oData.results);
                                this.getView().setModel(oModel, "DepartmentModel");
                                oLocalViewModel.setProperty("/departmentEnabled", true);
                                this.getView().byId("idDepartment").setBusy(false);
                                if(callback) {
                                    callback();
                                }
                            }.bind(this),
                            error: function (oError) {
                                this.getView().byId("idDepartment").setBusy(false);
                                sap.m.MessageBox.error(
                                    JSON.parse(oError.responseText).error.message.value
                                );
                            }.bind(this),
                        });
                },

                onDepartmentChange: function (oEvent) {
                    var selectedItem = oEvent.oSource.getSelectedItem();
                    var oLocalViewModel = this.getView().getModel("LocalViewModel");
                    this.getView().byId("idSection").setSelectedKey(null);
                    this.getView().byId("idSection").fireChange();
                    if(!selectedItem) {
                        oLocalViewModel.setProperty("/sectionEnabled", false);
                        return;
                    }
                    var department = selectedItem.getKey();
                    this.onSelectDepartment(department, null);
                },

                onSelectDepartment: function(department, callback) {
                    var oLocalViewModel = this.getView().getModel("LocalViewModel");
                    this.getView().byId("idSection").setBusy(true);
                    // load section dropdown
                    var oFilter = new Filter(
                        [
                            new Filter(
                            "mdfSystemStatus",
                            FilterOperator.EQ,
                            'A'
                        ), new Filter(
                            "cust_toDepartment/externalCode",
                            FilterOperator.EQ,
                            department
                        )], true 
                    );
                    
                    this.getView()
                        .getModel()
                        .read("/SF_Section", {
                            filters: [oFilter],
                            urlParameters: {
                                $orderby: "externalName"
                            },
                            success: function (oData) {
                                var oModel = new JSONModel(oData.results);
                                this.getView().setModel(oModel, "SectionModel");
                                oLocalViewModel.setProperty("/sectionEnabled", true);
                                this.getView().byId("idSection").setBusy(false);
                                if(callback) {
                                    callback();
                                }
                            }.bind(this),
                            error: function (oError) {
                                this.getView().byId("idSection").setBusy(false);
                                sap.m.MessageBox.error(
                                    JSON.parse(oError.responseText).error.message.value
                                );
                            }.bind(this),
                        });
                },
                onPayScaleTypeChange: function (oEvent) {
                    var selectedItem = oEvent.oSource.getSelectedItem();
                    var oLocalViewModel = this.getView().getModel("LocalViewModel");
                    this.getView().byId("idPayScaleGroup").setSelectedKey(null);
                    this.getView().byId("idPayScaleGroup").fireChange();
                    if(!selectedItem) {
                        oLocalViewModel.setProperty("/payGroupEnabled", false);
                        return;
                    }
                    var sPayScaleType = selectedItem.getKey();
                    this.onSelectPayScaleType(sPayScaleType, null);
                },

                onSelectPayScaleType: function(sPayScaleType, callback) {
                    var oLocalViewModel = this.getView().getModel("LocalViewModel");
                    this.getView().byId("idPayScaleGroup").setBusy(true);
                    // load location dropdown
                    var oFilter = new Filter(
                        [
                           new Filter(
                            "payScaleType",
                            FilterOperator.EQ,
                            sPayScaleType
                        )], true 
                    );
                    
                
                    this.getView()
                        .getModel()
                        .read("/SF_PayScaleGroup", {
                            filters: [oFilter],
                            // urlParameters: {
                            //     $orderby: "name"
                            // },
                            success: function (oData) {
                                var oModel = new JSONModel(oData.results);
                                this.getView().setModel(oModel, "PayScaleGroupModel");
                                oLocalViewModel.setProperty("/payGroupEnabled", true);
                                this.getView().byId("idPayScaleGroup").setBusy(false);
                                if(callback) {
                                    callback();
                                }
                            }.bind(this),
                            error: function (oError) {
                                this.getView().byId("idPayScaleGroup").setBusy(false);
                                sap.m.MessageBox.error(
                                    JSON.parse(oError.responseText).error.message.value
                                );
                            }.bind(this),
                        });
                },

                onPayGroupChange: function (oEvent) {
                    var selectedItem = oEvent.oSource.getSelectedItem();
                    var oLocalViewModel = this.getView().getModel("LocalViewModel");
                    this.getView().byId("idPayScaleLevel").setSelectedKey(null);
                    this.getView().byId("idPayScaleLevel").fireChange();
                    if(!selectedItem) {
                        oLocalViewModel.setProperty("/payScaleLevelEnabled", false);
                        return;
                    }
                    var sPayGroup = selectedItem.getKey();
                    this.onSelectPayGroup(sPayGroup, null);
                },

                onSelectPayGroup: function(sPayGroup, callback) {
                    var oLocalViewModel = this.getView().getModel("LocalViewModel");
                    this.getView().byId("idPayScaleLevel").setBusy(true);
                    // load location dropdown
                    var oFilter = new Filter(
                        [
                           new Filter(
                            "payScaleGroup/code",
                            FilterOperator.EQ,
                            sPayGroup
                        )], true 
                    );
                    
                
                    this.getView()
                        .getModel()
                        .read("/SF_PayScaleLevel", {
                            filters: [oFilter],
                            // urlParameters: {
                            //     $orderby: "name"
                            // },
                            success: function (oData) {
                                var oModel = new JSONModel(oData.results);
                                this.getView().setModel(oModel, "PayScaleLevelModel");
                                oLocalViewModel.setProperty("/payScaleLevelEnabled", true);
                                this.getView().byId("idPayScaleLevel").setBusy(false);
                                if(callback) {
                                    callback();
                                }
                            }.bind(this),
                            error: function (oError) {
                                this.getView().byId("idPayScaleLevel").setBusy(false);
                                sap.m.MessageBox.error(
                                    JSON.parse(oError.responseText).error.message.value
                                );
                            }.bind(this),
                        });
                },
            

                onEmployeeClassChange: function (oEvent) {
                    var selectedItem = oEvent.oSource.getSelectedItem();
                    var oLocalViewModel = this.getView().getModel("LocalViewModel");
                    this.getView().byId("idEmployeeType").setSelectedKey(null);
                    this.getView().byId("idEmployeeType").fireChange();
                    if(!selectedItem) {
                        oLocalViewModel.setProperty("/empTypeEnabled", false);
                        return;
                    }
                    var sEmployeeClass = selectedItem.getKey();
                    this.onSelectEmployeeClass(sEmployeeClass, null);
                },

                onSelectEmployeeClass: function(sEmployeeClass, callback) {
                    var oLocalViewModel = this.getView().getModel("LocalViewModel");
                    this.getView().byId("idEmployeeType").setBusy(true);
                    // load location dropdown
                    var oFilter = new Filter(
                        [
                            new Filter(
                            "parentPicklistOption/id",
                            FilterOperator.EQ,
                            sEmployeeClass
                        )], true 
                    );

                    
                    this.getView()
                        .getModel()
                        .read("/SF_PicklistOption", {
                            filters: [oFilter],
                            // urlParameters: {
                            //     $orderby: "name"
                            // },
                            success: function (oData) {
                                var oModel = new JSONModel(oData.results);
                                this.getView().setModel(oModel, "EmployeeTypeModel");
                                oLocalViewModel.setProperty("/empTypeEnabled", true);
                                this.getView().byId("idEmployeeType").setBusy(false);
                                if(callback) {
                                    callback();
                                }
                            }.bind(this),
                            error: function (oError) {
                                this.getView().byId("idEmployeeType").setBusy(false);
                                sap.m.MessageBox.error(
                                    JSON.parse(oError.responseText).error.message.value
                                );
                            }.bind(this),
                        });
                },

                onPayGradeChange: function (oEvent) {
                    var selectedItem = oEvent.oSource.getSelectedItem();
                    var oLocalViewModel = this.getView().getModel("LocalViewModel");
                    this.getView().byId("idPayRange").setSelectedKey(null);
                    this.getView().byId("idPayRange").fireChange();
                    if(!selectedItem) {
                        oLocalViewModel.setProperty("/payRangeEnabled", false);
                        return;
                    }
                    var sPayGrade = selectedItem.getKey();
                    this.onSelectPayGrade(sPayGrade, null);
                },

                onSelectPayGrade: function(sPayGrade, callback) {
                    var oLocalViewModel = this.getView().getModel("LocalViewModel");
                    this.getView().byId("idPayRange").setBusy(true);
                    // load location dropdown
                    var oFilter = new Filter(
                        [
                            new Filter(
                            "status",
                            FilterOperator.EQ,
                            'A'
                        ), new Filter(
                            "payGradeFlxNav/externalCode",
                            FilterOperator.EQ,
                            sPayGrade
                        )], true 
                    );

               


                    this.getView()
                        .getModel()
                        .read("/SF_PayRange", {
                            filters: [oFilter],
                            urlParameters: {
                                $orderby: "name"
                            },
                            success: function (oData) {
                                var oModel = new JSONModel(oData.results);
                                this.getView().setModel(oModel, "PayRangeModel");
                                oLocalViewModel.setProperty("/payRangeEnabled", true);
                                this.getView().byId("idPayRange").setBusy(false);
                                if(callback) {
                                    callback();
                                }
                            }.bind(this),
                            error: function (oError) {
                                this.getView().byId("idPayRange").setBusy(false);
                                sap.m.MessageBox.error(
                                    JSON.parse(oError.responseText).error.message.value
                                );
                            }.bind(this),
                        });
                },

                onLocationGroupChange: function (oEvent) {
                    var selectedItem = oEvent.oSource.getSelectedItem();
                    var oLocalViewModel = this.getView().getModel("LocalViewModel");
                    this.getView().byId("idLocation").setSelectedKey(null);
                    this.getView().byId("idLocation").fireChange();
                    if(!selectedItem) {
                        oLocalViewModel.setProperty("/locationEnabled", false);
                        return;
                    }
                    var locationGroup = selectedItem.getKey();
                    this.onSelectLocationGroup(locationGroup, null);
                },

                onSelectLocationGroup: function(locationGroup, callback) {
                    var oLocalViewModel = this.getView().getModel("LocalViewModel");
                    this.getView().byId("idLocation").setBusy(true);
                    // load location dropdown
                    var oFilter = new Filter(
                        [
                            new Filter(
                            "status",
                            FilterOperator.EQ,
                            'A'
                        ), new Filter(
                            "locationGroupFlxNav/externalCode",
                            FilterOperator.EQ,
                            locationGroup
                        )], true 
                    );
                    this.getView()
                        .getModel()
                        .read("/SF_Location", {
                            filters: [oFilter],
                            urlParameters: {
                                $orderby: "name"
                            },
                            success: function (oData) {
                                var oModel = new JSONModel(oData.results);
                                this.getView().setModel(oModel, "LocationModel");
                                oLocalViewModel.setProperty("/locationEnabled", true);
                                this.getView().byId("idLocation").setBusy(false);
                                if(callback) {
                                    callback();
                                }
                            }.bind(this),
                            error: function (oError) {
                                this.getView().byId("idLocation").setBusy(false);
                                sap.m.MessageBox.error(
                                    JSON.parse(oError.responseText).error.message.value
                                );
                            }.bind(this),
                        });
                },

                onLocationChange: function(oEvent) {
                    var selectedItem = oEvent.oSource.getSelectedItem();
                    if(!selectedItem) {
                        return;
                    }
                    var location = selectedItem.getBindingContext("LocationModel").getObject();
                    this.getView().getModel("jobModel").setProperty("/timezone", location.timezone);
                },

                onCompanyChange: function(oEvent) {
                    var selectedItem = oEvent.oSource.getSelectedItem();
                    var oLocalViewModel = this.getView().getModel("LocalViewModel");
                    this.getView().byId("idPayGroup").setSelectedKey(null);
                    this.getView().byId("idCompPayGroup").setSelectedKey(null);
                    if(!selectedItem) {
                        oLocalViewModel.setProperty("/payGroupEnabled", false);
                        return;
                    }
                    var company = selectedItem.getKey();
                    this.onSelectCompany(company, null);
                },

                onSelectCompany: function(company, callback) {
                    var oLocalViewModel = this.getView().getModel("LocalViewModel");
                    this.getView().byId("idPayGroup").setBusy(true);
                    this.getView().byId("idCompPayGroup").setBusy(true);
                    // load paygroup dropdown
                    var oFilter = new Filter(
                        [
                            new Filter(
                            "status",
                            FilterOperator.EQ,
                            'A'
                        ), new Filter(
                            "cust_toLegalEntity/externalCode",
                            FilterOperator.EQ,
                            company
                        )], true 
                    );
                    this.getView()
                        .getModel()
                        .read("/SF_FOPayGroup", {
                            filters: [oFilter],
                            urlParameters: {
                                $orderby: "name"
                            },
                            success: function (oData) {
                                var oModel = new JSONModel(oData.results);
                                this.getView().setModel(oModel, "PayGroupModel");
                                oLocalViewModel.setProperty("/payGroupEnabled", true);
                                this.getView().byId("idPayGroup").setBusy(false);
                                this.getView().byId("idCompPayGroup").setBusy(false);
                                if(callback) {
                                    callback();
                                }
                            }.bind(this),
                            error: function (oError) {
                                this.getView().byId("idPayGroup").setBusy(false);
                                this.getView().byId("idCompPayGroup").setBusy(false);
                                sap.m.MessageBox.error(
                                    JSON.parse(oError.responseText).error.message.value
                                );
                            }.bind(this),
                        });
                },

                initDropdowns: function() {
                    function filter(sTerm, oItem) {
                        // A case-insensitive 'string contains' filter
                        return oItem.getText().match(new RegExp(sTerm, "i")) || oItem.getKey().match(new RegExp(sTerm, "i"));
                    }

                    this.getView().byId("idCompany").setFilterFunction(filter);
                    this.getView().byId("idBU").setFilterFunction(filter);
                    this.getView().byId("idDivision").setFilterFunction(filter);
                    this.getView().byId("idDepartment").setFilterFunction(filter);
                    this.getView().byId("idSection").setFilterFunction(filter);
                    this.getView().byId("idLocationGroup").setFilterFunction(filter);
                    this.getView().byId("idLocation").setFilterFunction(filter);
                    this.getView().byId("idTimezone").setFilterFunction(filter);
                    this.getView().byId("idJobLevel").setFilterFunction(filter);
                    this.getView().byId("idPayGrade").setFilterFunction(filter);
                    this.getView().byId("idPayRange").setFilterFunction(filter);
                    this.getView().byId("idIKOOK").setFilterFunction(filter);
                    this.getView().byId("idFullTimeEmp").setFilterFunction(filter);
                    this.getView().byId("idEmploymentType").setFilterFunction(filter);
                    this.getView().byId("idPayGroup").setFilterFunction(filter);
                    this.getView().byId("idEmployeeClass").setFilterFunction(filter);
                    this.getView().byId("idEmployeeType").setFilterFunction(filter);
                    this.getView().byId("idPayScaleType").setFilterFunction(filter);
                    this.getView().byId("idPayScaleArea").setFilterFunction(filter);
                    this.getView().byId("idPayScaleGroup").setFilterFunction(filter);
                    this.getView().byId("idPayScaleLevel").setFilterFunction(filter);
                    this.getView().byId("idEmployeeNoticePeriod").setFilterFunction(filter);
                    this.getView().byId("idContractType").setFilterFunction(filter);
                    this.getView().byId("idDuration").setFilterFunction(filter);
                    this.getView().byId("idAutoRenewal").setFilterFunction(filter);
                    this.getView().byId("idCompPayGroup").setFilterFunction(filter);
                    this.getView().byId("idEligibleForCar").setFilterFunction(filter);
                    this.getView().byId("idCompCountry").setFilterFunction(filter);
                },

                setJobModel: function(oJobModel) {
                    this.getView().setModel(oJobModel, "jobModel");

                    var businessUnit = oJobModel.getProperty("/businessUnit");
                    var division = oJobModel.getProperty("/division");
                    var department = oJobModel.getProperty("/department");
                    var section = oJobModel.getProperty("/customString10");
                    var locationGroup = oJobModel.getProperty("/customString12");
                    var location = oJobModel.getProperty("/location");
                    var company = oJobModel.getProperty("/company");
                    var payGroup = oJobModel.getProperty("/payGroup");

                 //   ----------
                 var sPayGrade = oJobModel.getProperty("/payGrade"); 
                 var sPayRange = oJobModel.getProperty("/customString9"); 

                  //  ---------------
                  var sEmployeeClass = oJobModel.getProperty("/employeeClass"); 
                  var sEmpType= oJobModel.getProperty("/employmentType"); 


                  //---------------------------------------
                  var spayScaleType = oJobModel.getProperty("/payScaleType"); 
                  var sPayScaleGroup = oJobModel.getProperty("/payScaleGroup"); 
                  var sPayScaleLevel = oJobModel.getProperty("/payScaleLevel"); 


                    if(businessUnit) {
                        //select BU
                        this.getView().byId("idBU").setSelectedKey(businessUnit);
                        this.onSelectBusinessUnit(businessUnit, function() {
                            if(division) {
                                //select division
                                this.getView().byId("idDivision").setSelectedKey(division);
                                this.onSelectDivision(division, function() {
                                    if(department) {
                                        //select department
                                        this.getView().byId("idDepartment").setSelectedKey(department);
                                        this.onSelectDepartment(department, function() {
                                            if(section) {
                                                //select section
                                                this.getView().byId("idSection").setSelectedKey(section);
                                            }
                                        }.bind(this));
                                    }
                                }.bind(this));
                            }
                        }.bind(this));
                    }
                    if(locationGroup) {
                        this.getView().byId("idLocationGroup").setSelectedKey(locationGroup);
                        this.onSelectLocationGroup(locationGroup, function(){
                            if(location) {
                                this.getView().byId("idLocation").setSelectedKey(location);
                            }
                        }.bind(this));
                    }
                    

                    if(sPayGrade) {
                        this.getView().byId("idPayGrade").setSelectedKey(sPayGrade);
                        this.onSelectPayGrade(sPayGrade, function(){
                            if(sPayRange) {
                                this.getView().byId("idPayRange").setSelectedKey(sPayRange);
                            }
                        }.bind(this));
                    }

                    if(sEmployeeClass) {
                        this.getView().byId("idEmployeeClass").setSelectedKey(sEmployeeClass);
                        this.onSelectEmployeeClass(sEmployeeClass, function(){
                            if(sEmpType) {
                                this.getView().byId("idEmploymentType").setSelectedKey(sEmpType);
                            }
                        }.bind(this));
                    }







                    if(spayScaleType) {
                        //select PayScaleType
                        this.getView().byId("idPayScaleType").setSelectedKey(spayScaleType);
                        this.onSelectPayScaleType(spayScaleType, function() {
                            if(sPayScaleGroup) {
                                //select PayGroup
                                this.getView().byId("idPayScaleGroup").setSelectedKey(sPayScaleGroup);
                                this.onSelectPayGroup(sPayScaleGroup, function() {
                                    if(sPayScaleLevel) {
                                        //select Pay Scale level
                                        this.getView().byId("idPayScaleLevel").setSelectedKey(sPayScaleLevel);
                                       
                                    }
                                }.bind(this));
                            }
                        }.bind(this));
                    }

                  

                    this.getView().byId("idCompany").setSelectedKey(company);
                    this.onSelectCompany(company, function() {
                        if(payGroup) {
                            this.getView().byId("idPayGroup").setSelectedKey(payGroup);
                        }
                    }.bind(this));
                    
                },

                setJobOrgInfoModel:function(obj){
                    var oJobModel =  this.getView().getModel("jobModel");
                    
                //************ Set Organization Panel ******************************
                    oJobModel.setProperty("/company", obj.company);
                    oJobModel.setProperty("/businessUnit", obj.businessUnit);
                    oJobModel.setProperty("/division", obj.division);
                    oJobModel.setProperty("/department", obj.department);
                    oJobModel.setProperty("/location", obj.location);
                    oJobModel.setProperty("/cust_locationGroup", obj.cust_locationGroup);
                    oJobModel.setProperty("/costCenter", obj.costCenter);
                    oJobModel.setProperty("/cust_section", obj.cust_section);
                  
                // ************** Set Job Information Panel ******************************    
                    oJobModel.setProperty("/managerId",this.oJobModel.managerId);
                    oJobModel.setProperty("/jobCode", obj.jobCode);
                    oJobModel.setProperty("/jobLevel", obj.jobLevel);
                    oJobModel.setProperty("/jobTitle", obj.jobTitle);
                    oJobModel.setProperty("/payGrade", obj.payGrade);
                    oJobModel.setProperty("/jobTitle", obj.jobTitle);
                    oJobModel.setProperty("/employeeClass", obj.employeeClass);
                  
                    oJobModel.refresh(true);

                },

                setCompensationModel: function(oCompensationModel) {
                    this.getView().setModel(oCompensationModel, "compensationModel");

                    var payGroup = oCompensationModel.getProperty("/payGroup");
                    oCompensationModel.setProperty("/customDate1", new Date());
                    
                    var company = this.oJobModel.getProperty("/company");
                    if(!company) {
                        company = "3000";
                    }

                    if(company) {
                        this.getView().byId("idCompany").setSelectedKey(company);
                        this.onSelectCompany(company, function() {
                            if(payGroup) {
                                this.getView().byId("idCompPayGroup").setSelectedKey(payGroup); 
                            }
                        }.bind(this));
                    }
                }

            }
        );
    }
);
