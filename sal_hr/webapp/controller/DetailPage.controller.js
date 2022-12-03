sap.ui.define([
    "./BaseController",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "com/sal/salhr/model/formatter",
    'sap/ui/model/Sorter',
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/Device"
],

    function (BaseController, Controller, JSONModel, formatter, Sorter, Filter, FilterOperator, Device) {
        "use strict";
        
        return BaseController.extend("com.sal.salhr.controller.DetailPage", {
            formatter: formatter,
            onInit: function () {
                this.oRouter = this.getRouter();
                this.oRouter.getRoute("master").attachPatternMatched(this._onObjectMatched, this);
                this.oRouter.getRoute("detail").attachPatternMatched(this._onObjectMatched, this);
                this.oRouter.getRoute("detailDetail").attachPatternMatched(this._onObjectMatched, this);
            },

            _onObjectMatched: function (oEvent) {
                this._bDescendingSort = false;
                this.oTicketTable = this.oView.byId("idTicketTable");
                this.sParentID = oEvent.getParameter("arguments").parentMaterial;
                var sLayout = oEvent.getParameter("arguments").layout;
                // this.getView().getModel().setProperty("/busy", false);
                this.getView().getModel("layoutModel").setProperty("/layout", sLayout);
               
                
                this._bindView();
                
            },

            // This Function is used to set the custom parameter for Tickets table binding according to user type as Manager or not?
            onUpdateTicketsBindingStart: function (oEvent) {
                debugger;
                var sIsUserManager = this.getOwnerComponent().getModel("EmpInfoModel").getProperty("/IsUserManager").toString();
                oEvent.getSource().getBinding("items").sCustomParams = "IsUserManager=" + sIsUserManager;
                oEvent.getSource().getBinding("items").mCustomParams.IsUserManager = sIsUserManager;
            },

            _bindView: function () {
                var oComponentModel = this.getComponentModel(),
                    sKey = null;
                var sKey = oComponentModel.createKey("/MasterSubModules", {
                    ID: this.sParentID
                });
                var oFilterSearch = [];
                this.byId("idTicketTable").getBinding("items").filter(new Filter(oFilterSearch, true));
                this.getView().byId("idBTRequestType").setSelectedKey("All");


                var bIsUserManager = this.getOwnerComponent().getModel("EmpInfoModel").getProperty("/IsUserManager").toString();

              

                this.getView().bindElement({
                    path: sKey,
                    parameters: {
                        custom: {
                            "IsUserManager": bIsUserManager
                        }
                    },
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
               
               
            },

            onPressRaiseRequest: function () {
                switch (this.sParentID) {
                    // Leave Request Module
                    case "1":
                        this.oRouter.navTo("LeaveRequest", {
                            parentMaterial: this.sParentID,
                            layout: "EndColumnFullScreen"
                        })
                        break;

                    // Health Insurance Module
                    case "3":
                        this.oRouter.navTo("HealthInsuranceRequest", {
                            parentMaterial: this.sParentID,
                            layout: "EndColumnFullScreen"
                        })
                        break;

                    // Additional Payment Request Module
                    case "10":
                        this.oRouter.navTo("AdditionalPaymentRequest", {
                            parentMaterial: this.sParentID,
                            layout: "EndColumnFullScreen"
                        })
                        break;
                    // Business Trip Module    
                    case "2":
                        this.oRouter.navTo("BusinessTripRequest", {
                            parentMaterial: this.sParentID,
                            layout: "EndColumnFullScreen"
                        })
                        break;
                    // Business Card Module
                    case "5":
                        this.oRouter.navTo("BusinessCardRequest", {
                            parentMaterial: this.sParentID,
                            layout: "EndColumnFullScreen"
                        })
                        break;
                    // Airport Travel Pass Request Module
                    case "6":
                        this.oRouter.navTo("AirportPassRequest", {
                            parentMaterial: this.sParentID,
                            layout: "EndColumnFullScreen"
                        });
                        break;

                    // ID Card Request Module
                    case "7":
                        this.oRouter.navTo("IDCardRequest", {
                            parentMaterial: this.sParentID,
                            layout: "EndColumnFullScreen"
                        })
                        break;
                    // Letter Request Module
                    case "11":
                        this.oRouter.navTo("LetterRequest", {
                            parentMaterial: this.sParentID,
                            layout: "EndColumnFullScreen"
                        })
                        break;
                    // Disciplinary Request Module
                    case "12":
                        this.oRouter.navTo("DisciplinaryRequest", {
                            parentMaterial: this.sParentID,
                            layout: "EndColumnFullScreen"
                        })
                        break;
                    //  Bank Account Change Request Module 
                    case "13":
                        this.oRouter.navTo("BankAccChangeRequest", {
                            parentMaterial: this.sParentID,
                            layout: "EndColumnFullScreen"
                        })
                        break;
                    //  Salary Increment Request Module 
                    case "15":
                        this.oRouter.navTo("SalaryIncrementRequest", {
                            parentMaterial: this.sParentID,
                            layout: "EndColumnFullScreen"
                        })
                        break;
                    //  Employee Terminate Change Request Module 
                    case "17":
                        this.oRouter.navTo("EmployeeTerminateRequest", {
                            parentMaterial: this.sParentID,
                            layout: "EndColumnFullScreen"
                        })
                        break;
                }

               
            },

     onPressTicketItem: function (oEvent) {
     var sStatus = oEvent.getSource().getBindingContext().getObject().status;
     var sExternalStatus = oEvent.getSource().getBindingContext().getObject().externalStatus;
    //  var sExternalcreatedBy = oEvent.getSource().getBindingContext().getObject().externalCreatedBy;
        //   this._getSFUser(sExternalcreatedBy);

                if(sStatus==='CANCELLED'){

                    sap.m.MessageToast.show("The record is removed from the source system.");
                    return;
                }

                else if(sStatus==='REJECTED' && sExternalStatus !== "SENTBACK")
                {
                    sap.m.MessageToast.show("The record is removed from the source system.");
                    return;
                }

                this.navToDetailDetail(this.sParentID, oEvent.getSource().getBindingContext().getObject().ID);
            },

            onSearch: function (oEvent) {
                // var oTableSearchState = [],
                var sQuery = oEvent.getParameter("query");
                var aFilters = [];
                if (sQuery && sQuery.length > 0) {

                    var aFilters = new sap.ui.model.Filter({
                        filters: [
                            this.createFilter("ticketCode", FilterOperator.Contains, sQuery, true),
                            // this.createFilter("ticketCode", sap.ui.model.FilterOperator.Contains, sQuery)
                            this.createFilter("externalCode", FilterOperator.Contains, sQuery, true),
                            this.createFilter("status", FilterOperator.Contains, sQuery, true)

                        ],
                        and: false
                    });
                }

                this.oTicketTable.getBinding("items").filter(aFilters, "Application");
            },

            createFilter: function (key, operator, value, useToLower) {
                return new Filter(useToLower ? "tolower(" + key + ")" : key, operator, useToLower ? "'" + value.toLowerCase() + "'" : value);
            },

            onSort: function () {
                this._bDescendingSort = !this._bDescendingSort;
                var oBinding = this.oTicketTable.getBinding("items"),
                    oSorter = new Sorter("ticketCode", this._bDescendingSort);

                oBinding.sort(oSorter);
            },

            onReset: function (oEvent) {
                oEvent.getSource().getFilterItems()[1].getCustomControl().setValue("");
            },

            onPersonalizationDialogPress: function () {
                var oView = this.getView();
                this.oJSONModel = new JSONModel();
                if (!this._pPersonalizationDialog) {
                    this._pPersonalizationDialog = Fragment.load({
                        id: oView.getId(),
                        name: "com.sal.salhr.Fragments.TicketP13nDialog",
                        controller: this
                    }).then(function (oPersonalizationDialog) {
                        oView.addDependent(oPersonalizationDialog);
                        oPersonalizationDialog.setModel(this.oJSONModel);
                        return oPersonalizationDialog;
                    }.bind(this));
                }
                this._pPersonalizationDialog.then(function (oPersonalizationDialog) {
                    this.oJSONModel.setProperty("/ShowResetEnabled", this._isChangedColumnsItems());
                    this.oDataBeforeOpen = deepExtend({}, this.oJSONModel.getData());
                    oPersonalizationDialog.open();
                }.bind(this));
            },

            handleDetailFullScreen: function (oEvent) {
                var sLayout = "";
                if (oEvent.getSource().getIcon() === "sap-icon://full-screen") {
                    sLayout = "MidColumnFullScreen";
                    oEvent.getSource().setIcon("sap-icon://exit-full-screen");
                } else {
                    sLayout = "TwoColumnsMidExpanded";
                    oEvent.getSource().setIcon("sap-icon://full-screen");
                }

                this.oRouter.navTo("detail", {
                    parentMaterial: this.sParentID,
                    layout: sLayout
                });
            },

            handleDetailClose: function (oEvent) {
                var sLayout = "",
                    sIcon = this.byId("idDetailFullScreenBTN").getIcon();
                if (sIcon === "sap-icon://full-screen") {
                    sLayout = "EndColumnFullScreen";
                } else {
                    sLayout = "TwoColumnsMidExpanded";
                    this.byId("idDetailFullScreenBTN").setIcon("sap-icon://full-screen");
                }
                this.oRouter.navTo("master");
            },

            onPressFilter: function () {
                if (!this._oFilterDialog) {
                    this._oFilterDialog = sap.ui.xmlfragment("com.sal.salhr.Fragments.FilterDialog", this);
                    this.getView().addDependent(this._oFilterDialog);
                }
                if (Device.system.desktop) {
                    this._oFilterDialog.addStyleClass("sapUiSizeCompact");
                }
                this._oFilterDialog.open();
            },

            onPressClearFilter: function () {
                this.byId("idClearFilter").setVisible(false);
                this.byId("idSelectFilter").setVisible(true);
                var oFilterSearch = [];
                this.byId("idTicketTable").getBinding("items").filter(new Filter(oFilterSearch, true));
            },

            handleFilterDialogConfirm: function (oEvent) {
                var oFilterSearch = [];

                var sDate = oEvent.getSource().getFilterItems()[1].getCustomControl().getValue();
                var iMonth = parseInt(sDate.split("/")[0]),
                    iDay = parseInt(sDate.split("/")[1]) + 1,
                    iYear = parseInt(sDate.split("/")[2]),

                    sconcatDate = `${iMonth}/${iDay}/${iYear}`,
                    sParsedDate = Date.parse(sconcatDate);

                // var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({pattern: "yyyy-MM-dd"}),
                // oDate = dateFormat.format(new Date(sDate));
                // oDate = oDate + "T00:00:00";

                var filters = oEvent.getParameters().filterCompoundKeys,
                    sStatusFilter = filters.Status === undefined ? "" : Object.keys(filters.Status)[0],
                    sDateFilter = sDate === "" ? "" : sParsedDate;

                if (sStatusFilter != "") {
                    oFilterSearch.push(new Filter("status", FilterOperator.EQ, sStatusFilter));
                }
                if (sDateFilter != "") {
                    oFilterSearch.push(new Filter("requestDate", FilterOperator.EQ, sDateFilter));
                }
                if (oFilterSearch.length > 0) {
                    this.byId("idClearFilter").setVisible(true);
                    this.byId("idSelectFilter").setVisible(false);
                    this.byId("idTicketTable").getBinding("items").filter(new Filter(oFilterSearch, true));
                    oFilterSearch = [];
                }
                else {
                    this.byId("idClearFilter").setVisible(false);
                    this.byId("idSelectFilter").setVisible(true);

                    this.byId("idTicketTable").getBinding("items").filter(new Filter(oFilterSearch, true));
                    //this.byId("idTicketTable").getBinding("items").filter(oFilterSearch, "Application");
                }
            },
            onSelectBTFilter:function(oEvent){
                debugger;
               
                  var sSelectedKey = oEvent.getSource().getSelectedKey();
                  var oFilterSearch = [];
                  var sExternalCode;
                  
                
                 
                    if(sSelectedKey === "All"){
                        oFilterSearch = [];
                        this.byId("idTicketTable").getBinding("items").filter(new Filter(oFilterSearch, true));
                  } else if (sSelectedKey === "Pending for Closure") {
                    sExternalCode = "Raise Initial Request";
                    this.onPressBTFilterRequest(sExternalCode);  
                  }else if (sSelectedKey === "Closed Requests") {
                    sExternalCode = "Return and Closure";
                    this.onPressBTFilterRequest(sExternalCode);  
                  }else {
                    oFilterSearch.push(new Filter("externalCode2", FilterOperator.EQ, sSelectedKey));
                    this.byId("idTicketTable").getBinding("items").filter(new Filter(oFilterSearch, true));
                  }

                  
                  
               

               
            },
            onPressBTFilterRequest:function(sExternalCode){
                var oFilterSearch = [];
                oFilterSearch.push(new Filter("externalCode2", FilterOperator.EQ, sExternalCode));
                oFilterSearch.push(new Filter("status", FilterOperator.EQ, "APPROVED"));
                this.byId("idTicketTable").getBinding("items").filter(new Filter(oFilterSearch, true));

                this.getView().byId("idBTRequestType").setSelectedKey(sExternalCode);
            },
            onPressBTClosureRequest:function(){
                var oFilterSearch = [];
                oFilterSearch.push(new Filter("externalCode2", FilterOperator.EQ, "Raise Initial Request"));
                oFilterSearch.push(new Filter("status", FilterOperator.EQ, "APPROVED"));
                this.byId("idTicketTable").getBinding("items").filter(new Filter(oFilterSearch, true));

                this.getView().byId("idBTRequestType").setSelectedKey("Pending for Closure");
            }


             

        });
    });        
