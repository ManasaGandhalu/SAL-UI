sap.ui.define(
  [
    "./BaseController",
    "sap/ui/core/mvc/Controller",
    "com/sal/salhr/model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "com/sal/salhr/utils/const",
    "sap/ui/core/routing/History",
  ],

  function (
    BaseController,
    Controller,
    formatter,
    Filter,
    FilterOperator,
    Sorter,
    Const,
    History
  ) {
    "use strict";

    return BaseController.extend("com.sal.salhr.controller.MasterList", {
      formatter: formatter,
      onInit: function () {
        this.getView().setBusy(true);
        this.startUpTriggered = true;
        var oModel = this.getOwnerComponent().getModel("layoutModel");
        oModel.setProperty("/layout", "OneColumn");

        //Router Object
        this.oRouter = this.getRouter();
        this.oRouter
          .getRoute("master")
          .attachPatternMatched(this._onObjectMatched, this);
        var sManagerTile = this.getOwnerComponent()
          .getModel("EmpInfoModel")
          .getProperty("/IsUserManager");
        var subModuleId = new sap.ui.core.routing.HashChanger()
          .getHash()
          .split("/")[2];
        if (subModuleId) {
          this.fnGetRoleAccess(sManagerTile, subModuleId);
        }
        this.getView().setBusy(false);
      },

      onNavBack: function () {
        var oHistory = History.getInstance();
        var sPreviousHash = oHistory.getPreviousHash();
        if (sPreviousHash !== undefined) {
          window.history.go(-1);
        } else {
          var oRouter = this.getOwnerComponent().getRouter();
          oRouter.navTo("overview", {}, true);
        }
      },
      _onObjectMatched: function (oEvent) {
        debugger;
        this.getView().setBusy(true);

        var sLayout = oEvent.getParameter("arguments").layout;

        
        this.getView().getModel("layoutModel").setProperty("/layout", sLayout);

        this.getView().setBusy(false);
        var startupParams = this.getOwnerComponent().getComponentData()
          .startupParameters;
        // get Startup params from Owner Component
        if (startupParams?.submoduleId && startupParams?.submoduleId[0]) {
          this._navToDetail(
            startupParams.submoduleId[0],
            startupParams.ticketId[0]
          );
        } else {
          var params = new URLSearchParams(
            decodeURIComponent(window.location.href)
          );

          if (!params.has("submoduleId")) {
            params = new URLSearchParams(
              decodeURIComponent(window.parent.location.href)
            );
          }

          var subModuleId = params.get("submoduleId"),
                //  ticketId = null;
            ticketId = params.get("ticketId");
          if (subModuleId) {
            this._navToDetail(subModuleId, ticketId);
          }
        }
      },
      onUpdateMasterListBindingStart: function (oEvent) {
        var sIsUserManager = this.getOwnerComponent()
          .getModel("EmpInfoModel")
          .getProperty("/IsUserManager")
          .toString();
        //    sIsUserManager = "true";
        oEvent.getSource().getBinding("items").sCustomParams =
          "IsUserManager=" + sIsUserManager;
        oEvent
          .getSource()
          .getBinding("items").mCustomParams.IsUserManager = sIsUserManager;
        this.getView().setBusy(false);
      },
      _navToDetail: function (submoduleId, ticketId) {
        if (this.startUpTriggered) {
          this.startUpTriggered = false;
          if (ticketId) {
            this.navToDetailDetail(
              submoduleId,
              ticketId,
              "EndColumnFullScreen"
            );
          } else {
            this.getRouter().navTo(
              "detail",
              {
                parentMaterial: submoduleId,
                layout: "TwoColumnsMidExpanded",
              },
              false
            );
          }
        }
      },

      onMasterListPress: function (oEvent) {
        this._showObject(oEvent.getSource());
      },

      _showObject: function (oItem) {
        var that = this;
        var sManagerTile = this.getView().getModel("EmpInfoModel").getData()
          .IsUserManager;
        var subModuleId = oItem.getBindingContext().getObject().ID;
        this.fnGetRoleAccess(sManagerTile, subModuleId, oItem);
      },

      

      onSearch: function (oEvent) {
        var aFilters = [];
        var sQuery = oEvent.getSource().getValue();
        if (sQuery && sQuery.length > 0) {
          aFilters.push(
            this.createFilter("name", FilterOperator.Contains, sQuery, true)
          );
        }

        var oTable = this.byId("idMasterTable");
        var oBinding = oTable.getBinding("items");
        oBinding.filter(aFilters);
      },
      createFilter: function (key, operator, value, useToLower) {
        return new Filter(
          useToLower ? "tolower(" + key + ")" : key,
          operator,
          useToLower ? "'" + value.toLowerCase() + "'" : value
        );
      },
      onSort: function () {
        this._bDescendingSort = !this._bDescendingSort;
        var oBinding = this.getView().byId("idMasterTable").getBinding("items"),
          oSorter = new Sorter("name", this._bDescendingSort);

        oBinding.sort(oSorter);
      },

      fnGetRoleAccess: function (sManagerTile, subModuleId, oItem) {
          debugger;
        this.sManagerTile = sManagerTile;
        var sURL = "";
        var oComponentModel = this.getComponentModel();
        oComponentModel.read("/MasterRolePermission", {
          urlParameters: {
            subModuleId: subModuleId,
          },

          success: function (oData) {

            // oData = {
            //   results: [
            //     {
            //       createSelf: true,
            //       readSelf: true,
            //       updateSelf: true,
            //       deleteSelf: true,
            //       withdrawSelf: true,
            //       createOther: true,
            //       readOther: true,
            //       updateOther: true,
            //       deleteOther: true,
            //       approveOther: true,
            //       rejectOther: true,
            //     },
            //   ],
            // };
            if (oData.results.length === 0) {
              sap.m.MessageBox.error(
                "You do not have permission to perform this action"
              );
              return;
            }

            if (this.sManagerTile === false) {
              this.getOwnerComponent()
                .getModel("RoleInfoModel")
                .setProperty("/createSelf", oData.results[0].createSelf);
              this.getOwnerComponent()
                .getModel("RoleInfoModel")
                .setProperty("/deleteSelf", oData.results[0].deleteSelf);
              this.getOwnerComponent()
                .getModel("RoleInfoModel")
                .setProperty("/readSelf", oData.results[0].readSelf);
              this.getOwnerComponent()
                .getModel("RoleInfoModel")
                .setProperty("/updateSelf", oData.results[0].updateSelf);
              this.getOwnerComponent()
                .getModel("RoleInfoModel")
                .setProperty("/withdrawSelf", oData.results[0].withdrawSelf);
            } else {
              this.getOwnerComponent()
                .getModel("RoleInfoModel")
                .setProperty("/approveOther", oData.results[0].approveOther);
              this.getOwnerComponent()
                .getModel("RoleInfoModel")
                .setProperty("/createOther", oData.results[0].createOther);
              this.getOwnerComponent()
                .getModel("RoleInfoModel")
                .setProperty("/deleteOther", oData.results[0].deleteOther);
              this.getOwnerComponent()
                .getModel("RoleInfoModel")
                .setProperty("/readOther", oData.results[0].readOther);
              this.getOwnerComponent()
                .getModel("RoleInfoModel")
                .setProperty("/rejectOther", oData.results[0].rejectOther);
              this.getOwnerComponent()
                .getModel("RoleInfoModel")
                .setProperty("/updateOther", oData.results[0].updateOther);
            }
            if (oItem) {
              var sPath = oItem.getBindingContextPath();
              this.getView().getModel("EmpInfoModel").refresh(true);

              switch (subModuleId) {
                case 8:
                  sURL = Const.LINKS.Vacancy;
                  this.openSucessFatcors(sURL);
                  break;
                case 18:
                  sURL = Const.LINKS.Learning;
                  this.openSucessFatcors(sURL);
                  break;
                case 4:
                  sURL = Const.LINKS.Loan;
                  this.openSucessFatcors(sURL);
                  break;
                case 9:
                  sURL = Const.LINKS.Performance;
                  this.openSucessFatcors(sURL);
                  break;
                case 33:
                  sURL = Const.LINKS.EmployeeProfile;
                  this.openSucessFatcors(sURL);
                  break;
                case 34:
                  sURL = Const.LINKS.OrganizationChart;
                  this.openSucessFatcors(sURL);
                  break;
                default:
                  this.getRouter().navTo(
                    "detail",
                    {
                      parentMaterial: oItem.getModel().getProperty(sPath).ID,
                      layout: "TwoColumnsMidExpanded",
                    },
                    false
                  );
              }
            }
          }.bind(this),
          error: function (oError) {
            sap.m.MessageBox.error(JSON.stringify(oError));
          }.bind(this),
        });
      },

      openSucessFatcors: function (sUrl) {
        sap.m.MessageToast.show("Redirecting to SuccessFactors");
        jQuery.sap.delayedCall(500, this, function () {
          window.open(sUrl);
        });
      },
    });
  }
);
