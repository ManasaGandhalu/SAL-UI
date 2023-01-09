sap.ui.define(
    [
        "./BaseController",
        "sap/ui/model/json/JSONModel",
        "com/sal/salhr/model/formatter",
    ],

    function (BaseController, JSONModel, formatter) {
        "use strict";
        return BaseController.extend(
            "com.sal.salhr.controller.AdditionalPaymentRequestDetailPage",
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
                        .getRoute("AdditionalPaymentRequestDetail")
                        .attachPatternMatched(this._onObjectMatched, this);
                },

                _onObjectMatched: function (oEvent) {
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
                        this.byId("idFullScreenBTN").getIcon() == "sap-icon://full-screen"
                    ) {
                        this.getView()
                            .getModel("LocalViewModel")
                            .setProperty("/EditMode", false);
                        this.byId("idFullScreenBTN").setIcon("sap-icon://exit-full-screen");
                        this._getTicketData(this.sChildID);
                    }
                },

                _bindView: function (data) {
                    debugger;
                    var object = data.results[0];
                    this.object = data.results[0];
                    var oHeaderModel = new JSONModel(data.results[0]);
                    this.getView().setModel(oHeaderModel, "headerModel");
                    this.callWorkflowPendindDataService(object.workflowRequestId);
                    this.onCallHistoryData(object.ticketCode);

                    // var oComponentModel = this.getComponentModel(),
                    //     sKey = null;
                    // var bIsUserManager = this.getOwnerComponent().getModel("EmpInfoModel").getProperty("/IsUserManager").toString();
                    // sKey = oComponentModel.createKey("/SF_Pay", {
                    //     payComponentCode: object.externalCode,
                    //     payDate: object.effectiveStartDate,
                    //     userId: object.employeeId
                    // });
                    // this.getView().bindElement({
                    //     path: sKey,
                    //     parameters: {
                    //         expand: "payComponentCodeNav,alternativeCostCenterNav,userNav",
                    //         custom: {
                    //             "recordStatus": object.status,
                    //             "IsUserManager": bIsUserManager
                    //         }
                    //     },
                    //     events: {
                    //         change: function (oEvent) {
                    //             var oContextBinding = oEvent.getSource();
                    //             oContextBinding.refresh(false);
                    //         }.bind(this),
                    //         dataRequested: function () {
                    //             this.getView().setBusy(true);
                    //         }.bind(this),
                    //         dataReceived: function () {
                    //             this.getView().setBusy(false);
                    //         }.bind(this)
                    //     }
                    // });

                    this.getView()
                        .getModel("LocalViewModel")
                        .setProperty("/PageTitle", "Additional Payment Request");
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
                        }.bind(this)
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

                onChangeInpIBAN: function (oEve) {
                    var sValue = oEve.getSource().getValue();

                    if (!sValue.match(/^[0-9A-Za-z]+$/)) {
                        sap.ui.core.Fragment.byId(
                            "idBankChangerequestFragment",
                            "idIBANINP"
                        ).setValueState("Error");
                        sap.ui.core.Fragment.byId(
                            "idBankChangerequestFragment",
                            "idIBANINP"
                        ).setValueStateText("Please enter only alpha-numeric characters");
                    } else {
                        sap.ui.core.Fragment.byId(
                            "idBankChangerequestFragment",
                            "idIBANINP"
                        ).setValueState("None");
                    }
                },

                onChangeInpBankName: function (oEve) {
                    var sValue = oEve.getSource().getValue();

                    if (!sValue.match(/^[a-zA-Z0-9\s]*$/)) {
                        sap.ui.core.Fragment.byId(
                            "idBankChangerequestFragment",
                            "idBankNameINP"
                        ).setValueState("Error");
                        sap.ui.core.Fragment.byId(
                            "idBankChangerequestFragment",
                            "idBankNameINP"
                        ).setValueStateText("Please enter only alpha-numeric characters");
                    } else {
                        sap.ui.core.Fragment.byId(
                            "idBankChangerequestFragment",
                            "idBankNameINP"
                        ).setValueState("None");
                    }
                },

                onWithdrawPress: function () {
                    this.mainModel = this.getOwnerComponent().getModel();
                    if (
                        this.object.status === "PENDING" ||
                        this.object.status === "REJECTED"
                    ) {
                        var swfID = this.object.workflowRequestId;

                        this.onWithdrawRequest(swfID);
                    } else {
                        this.onDeleteServiceCall();
                    }
                },

                onDeleteServiceCall: function () {
                    // var sKey = "038718668910415eb3f3773a68fee340";
                    var sKey = this.sChildID;
                    if (sKey === "" || sKey === undefined) {
                        MessageBox.error("Please enter sKey ID to delete the record.");
                        return;
                    }
                    this.getView().setBusy(true);
                    this.fnDeleteAdditionalPymnt();
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

                    this.oRouter.navTo("AdditionalPaymentRequestDetail", {
                        parentMaterial: this.sParentID,
                        childModule: this.sChildID,
                        layout: sLayout,
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
                        layout: sLayout,
                    });
                },

                onSavePress: function () {
                    var oPayloadObj = {},
                        sEntityPath = null;
                    var oComponentModel = this.getComponentModel(),
                        sKey = oComponentModel.createKey("/SF_Pay", {
                            payComponentCode: this.object.externalCode,
                            payDate: this.object.effectiveStartDate,
                            userId: this.object.employeeId,
                        });
                    sEntityPath = sKey;
                    oPayloadObj = this.fnAddPaymentRequestChangePayload();
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

                fnAddPaymentRequestChangePayload: function () {
                    var sUserID = this.getOwnerComponent()
                        .getModel("EmpInfoModel")
                        .getData().userId;
                    var sValue = this.byId("idEditValueINP").getValue();
                    var sCurrency = this.byId("idInpCurrencyCode").getSelectedKey();
                    // var sAltCostCenter = this.byId("idInpAltCostCenter").getSelectedKey();
                    var sPayDate = this.byId("idEditIssueDate").getDateValue(),
                        dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                            pattern: "yyyy-MM-dd",
                        });
                    sPayDate = dateFormat.format(new Date(sPayDate));
                    sPayDate = sPayDate + "T00:00:00";
                    return {
                        payComponentCode: "9244",
                        userId: sUserID,
                        payDate: sPayDate,
                        notes: null,
                        // alternativeCostCenter: sAltCostCenter,
                        currencyCode: sCurrency,
                        value: sValue,
                    };
                },
                onDownLoadPress: function () {
                    var fContent = this.getView().getModel("attachmentModel").getData()
                        .fileContent;
                    var fileext = this.getView().getModel("attachmentModel").getData()
                        .fileExtension;
                    var mimeType = this.getView().getModel("attachmentModel").getData()
                        .mimeType;
                    var fName = this.getView().getModel("attachmentModel").getData()
                        .fileName;
                    fName = fName.split(".")[0];
                    this.fnDownloadAttachment(fContent, mimeType, fName, fileext);
                },
                onFileDeleted: function (oEvent) {
                    var oUploadSet = this.byId("idEditUploadSet");
                    oUploadSet.getDefaultFileUploader().setEnabled(true);
                },
                onFileAdded: function (oEvent) {
                    debugger;
                    var that = this;

                    //  var file = oEvent.getParameters().files[0];
                    var file = oEvent.getParameter("item");
                    var Filename = file.getFileName(),
                        Filetype = file.getMediaType(),
                        Filesize = file.getFileObject().size,
                        Filedata = oEvent.getParameter("item").getFileObject();

                    //code for base64/binary array
                    this._getImageData(Filedata, function (Filecontent) {
                        that._addData(Filecontent, Filename, Filetype, Filesize);
                    });
                    var oUploadSet = this.byId("idEditUploadSet");
                    oUploadSet.getDefaultFileUploader().setEnabled(false);

                    this.getView()
                        .getModel("attachmentModel")
                        .setProperty("/fileName", Filename);
                    this.getView()
                        .getModel("attachmentModel")
                        .setProperty("/mimeType", Filetype);
                    this.getView().getModel("attachmentModel").refresh();
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
                    this.getViewModel("LocalViewModel").setProperty("/busy", true);
                    this.fileContent = Filecontent;
                    this.fileName = Filename;
                    this.isAttachmentNew = true;
                },
                fnDeleteLeaveRequest: function () {
                    this.getView()
                        .getModel()
                        .remove("/SF_Leave('" + this.object.externalCode + "')", {
                            urlParameters: {
                                ticketId: this.sChildID,
                            },
                            success: function (oData) {
                                if (oData !== "" || oData !== undefined) {
                                    this.getView().setBusy(false);
                                    sap.m.MessageBox.success("Record Deleted successfully.");
                                    this.getView().getModel().refresh();
                                    this.oRouter.navTo("detail", {
                                        parentMaterial: this.sParentID,
                                        layout: "TwoColumnsMidExpanded",
                                    });
                                } else {
                                    this.getView().setBusy(false);
                                    MessageBox.error("Record Not able to delete.");
                                }
                            }.bind(this),
                            error: function (oError) {
                                this.getView().setBusy(false);
                            }.bind(this),
                        });
                },
                fnDeleteBankAccount: function () {
                    var oComponentModel = this.getComponentModel(),
                        sPath = oComponentModel.createKey("/SF_BankDetails", {
                            effectiveStartDate: this.object.effectiveStartDate,
                            externalCode: this.object.externalCode,
                        });
                    this.getView()
                        .getModel()
                        .remove(`${sPath}`, {
                            urlParameters: {
                                ticketId: this.sChildID,
                            },
                            success: function (oData) {
                                if (oData !== "" || oData !== undefined) {
                                    sap.m.MessageBox.success("Record Deleted successfully.");
                                    this.oRouter.navTo("detail", {
                                        parentMaterial: this.sParentID,
                                        layout: "TwoColumnsMidExpanded",
                                    });
                                } else {
                                    sap.m.MessageBox.error("Record Not able to delete.");
                                }
                            },
                            error: function (oError) { },
                        });
                },

                fnDeleteAdditionalPymnt: function () {
                    this.getView().setBusy(true);
                    var sUserID = this.object.externalCode,
                        sEffectiveStartDate = new Date(this.object.effectiveStartDate),
                        sPath = this.getComponentModel().createKey(
                            "/EmpPayCompNonRecurring",
                            {
                                payComponentCode: this.object.externalCode,
                                payDate: sEffectiveStartDate,
                                userId: sUserID,
                            }
                        );
                    this.getView()
                        .getModel()
                        .remove(sPath, {
                            urlParameters: {
                                ticketId: this.sChildID,
                            },
                            success: function (oData) {
                                if (oData !== "" || oData !== undefined) {
                                    this.getView().setBusy(false);
                                    sap.m.MessageBox.success("Record Deleted successfully.");
                                    this.getView().getModel().refresh();
                                    this.oRouter.navTo("detail", {
                                        parentMaterial: this.sParentID,
                                        layout: "TwoColumnsMidExpanded",
                                    });
                                } else {
                                    this.getView().setBusy(false);
                                    MessageBox.error("Record Not able to delete.");
                                }
                            }.bind(this),
                            error: function (oError) {
                                this.getView().setBusy(false);
                            }.bind(this),
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

                setModifyVisibility: function (sStatus) {
                    var bIsUserManager = this.getOwnerComponent()
                        .getModel("EmpInfoModel")
                        .getProperty("/IsUserManager");

                    if (
                        bIsUserManager &&
                        this.getView()
                            .getModel("LocalViewModel")
                            .getProperty("/EditMode") === false
                    ) {
                        return (
                            sStatus.toUpperCase() === "APPROVED" ||
                            sStatus.toUpperCase() === "CANCELLED" ||
                            sStatus.toUpperCase() === "REJECTED"
                        );
                    } else return false;
                },

                setWithdrawVisibility: function (sStatus) {
                    return (
                        this.getView()
                            .getModel("LocalViewModel")
                            .getProperty("/EditMode") === false &&
                        sStatus.toUpperCase() === "PENDING"
                    );
                },
            }
        );
    }
);
