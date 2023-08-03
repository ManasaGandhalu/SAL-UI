// @ts-ignore
sap.ui.define(
  [
    "com/sal/salhr/createuser/controller/BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Sorter",
    "sap/ui/Device",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
  ],
  function (
    BaseController,
    Filter,
    FilterOperator,
    JSONModel,
    Sorter,
    Device,
    MessageBox,
    MessageToast,
    Fragment
  ) {
    "use strict";

    return BaseController.extend(
      "com.sal.salhr.createuser.controller.CreateUser",
      {
        onInit: function () {
          // Keeps reference to any of the created sap.m.ViewSettingsDialog-s in this sample
          this._mViewSettingsDialogs = {};

          //Router Object
          this.oRouter = this.getRouter();
          this.mainModel = this.getOwnerComponent().getModel();
          this.mainModel.setSizeLimit(1000);
          this.oRouter
            .getRoute("CreateUserPage")
            .attachPatternMatched(this._onObjectMatched, this);
            this._SetFilterData();
        },

        _SetFilterData: function () {
            var oDataControl = {
                filterBar: {
                   
                    Name: "",
                    Email: ""
                },
            };
            var oMdlCtrl = new JSONModel(oDataControl);
            this.getView().setModel(oMdlCtrl, "oModelControl");
        },
        onReset: function () {
            this._ResetFilterBar();
        },
        _ResetFilterBar: function () {
            var aCurrentFilterValues = [];
            var aResetProp = {
               
                Name: "",
                Email: "",
               
            };
            var oViewModel = this.getView().getModel("oModelControl");
            oViewModel.setProperty("/filterBar", aResetProp);
            var oTable = this.byId("idOffersTable");
            var oBinding = oTable.getBinding("items");
            oBinding.filter([]);
            oBinding.sort(new Sorter({
                path: "CreatedAt",
                descending: true
            }));
            this._fiterBarSort();
        },

        _onObjectMatched: function (oEvent) {
          var oViewModel,
            iOriginalBusyDelay,
            oTable = this.byId("idCreateUserTable");

          iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
          oViewModel = new JSONModel({
            TableTitle: this.getResourceBundle().getText("TableTitle"),
            tableNoDataText: this.getResourceBundle().getText(
              "tableNoDataText"
            ),
            tableBusyDelay: 0,
          });

          this.setModel(oViewModel, "worklistView");

          oTable.attachEventOnce("updateFinished", function () {
            // Restore original busy indicator delay for worklist's table
            oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
          });
          this.getView().getModel().refresh();
          var oVendorViewModel = new JSONModel({});

          this.getView().setModel(oVendorViewModel, "CreateUserViewModel");
        },

        onSearch: function (oEvent) {
            var aCurrentFilterValues = [];
            var oViewFilter = this.getView()
                .getModel("oModelControl")
                .getProperty("/filterBar");
            var aFlaEmpty = true;
            for (let prop in oViewFilter) {
                if (oViewFilter[prop]) {
                    if (prop === "Name") {
                        aFlaEmpty = false;
                        aCurrentFilterValues.push(
                            new Filter({
                                path: "name",
                                operator: "Contains",
                                value1: oViewFilter[prop].trim(),
                                caseSensitive: false
                            })
                        );
                    } else if (prop === "sfuserID") {
                        aFlaEmpty = false;
                        aCurrentFilterValues.push(
                            new Filter({
                                path: "sfUserId",
                                operator: "Contains",
                                value1: oViewFilter[prop].trim(),
                               
                            })
                            
                        );
                    }  
                }
            }

            var endFilter = new Filter({
                filters: aCurrentFilterValues,
                and: true,
            });
            var oTable = this.getView().byId("idCreateUserTable");
            var oBinding = oTable.getBinding("items");
            if (!aFlaEmpty) {
                oBinding.filter(endFilter);
            } else {
                oBinding.filter([]);
            }
        },

        onUpdateFinished: function (oEvent) {
          var sTitle,
            oTable = oEvent.getSource(),
            iTotalItems = oEvent.getParameter("total");
          if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
            sTitle = this.getResourceBundle().getText("TableDataCount", [
              iTotalItems,
            ]);
          } else {
            sTitle = this.getResourceBundle().getText("TableDataCount", [0]);
          }
          this.getView()
            .getModel("worklistView")
            .setProperty("/TableTitle", sTitle);
        },

        onEditUser: function (oEvent) {
          var sPath = oEvent
            .getSource()
            .getBindingContext()
            .getPath()
            .substr(1);
          var oBject = oEvent.getSource().getBindingContext().getObject();
          this.sID = oBject.ID;
          this.getView()
            .getModel("CreateUserViewModel")
            .setProperty("/name", oBject.name);
          this.getView()
            .getModel("CreateUserViewModel")
            .setProperty("/email", oBject.email);
          this.getView()
            .getModel("CreateUserViewModel")
            .setProperty("/sfUserId", oBject.sfUserId);
          this.getView()
            .getModel("CreateUserViewModel")
            .setProperty("/itsmUserID", oBject.itsmUserId);
          this.getView()
            .getModel("CreateUserViewModel")
            .setProperty("/s4UserId", oBject.s4UserId);
            this.getView()
            .getModel("CreateUserViewModel")
            .setProperty("/roleID",  oBject.masterRoleId);

           

          this.action = "Edit";
          this.openUserFragment();
        },

        onDeleteUser: function (oEvent) {

            var sID = oEvent.getSource().getBindingContext().getObject().ID;

            sap.m.MessageBox.warning("Are you sure to delete this record?", {
				actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
				styleClass: "messageBoxError",
				onClose: function (oAction) {
					if (oAction === sap.m.MessageBox.Action.YES) {
					
						this.handleDeleteServiceCall(sID);

					}

				}.bind(this),
			});



        
        },

        handleDeleteServiceCall : function(sID)
        {
            
            var  sPath;
            sPath = `/SALUser(guid'${sID}')`;

            this.getView().setBusy(true);
            var oComponentModel = this.getComponentModel();
  
            oComponentModel.remove(sPath, {
              success: function (oData, oResponse) {
                sap.m.MessageBox.success("Record Deleted Successfully.");
                this.getView().setBusy(false);
                this.getView().getModel().refresh();
                //  this.onResetPress();
              }.bind(this),
              error: function (oError) {
                sap.m.MessageBox.error(
                  JSON.parse(
                    JSON.parse(oError.responseText).error.message.value
                  ).error.message.value.split("]")[1]
                );
                this.getView().getModel().refresh();
                this.getView().setBusy(false);
              }.bind(this),
            });
        },

        onPressAdd: function () {
          this.action = "CREATE";
          this.getView()
            .getModel("CreateUserViewModel")
            .setProperty("/name", "");
          this.getView()
            .getModel("CreateUserViewModel")
            .setProperty("/email", "");
          this.getView()
            .getModel("CreateUserViewModel")
            .setProperty("/sfUserId", "");
          this.getView()
            .getModel("CreateUserViewModel")
            .setProperty("/itsmUserID", "");
          this.getView()
            .getModel("CreateUserViewModel")
            .setProperty("/s4UserId", "");
          this.openUserFragment();
        },

        openUserFragment: function () {
          if (!this._oCreateUserDialog) {
            this._oCreateUserDialog = sap.ui.xmlfragment(
              "com.sal.salhr.createuser.view.fragments.CreateFragment",
              this
            );
            this.getView().addDependent(this._oCreateUserDialog);
          }
          if (Device.system.desktop) {
            this._oCreateUserDialog.addStyleClass("sapUiSizeCompact");
          }
          this._oCreateUserDialog.open();
        },

        onPressCreateUser: function () {
          // if (!this._validateMandatoryFields()) {

          //     return;
          // }
          this._oCreateUserDialog.close();

          var oPayload, sPath;

          oPayload = this.getCreateUserPayload();

         


     
          this.action === "CREATE"
            ? this.createServiceCall(oPayload)
            : this.editServiceCall(oPayload);

        
        },
        createServiceCall : function(oPayload)
        {

            this.getView().setBusy(true);
            var sPath ="/SALUser";
            
            this.getOwnerComponent()
            .getModel()
            .create(sPath, oPayload, {
              success: function (oData, oResponse) {
                sap.m.MessageBox.success("Request Submitted Successfully.");
                this.getView().setBusy(false);
                this.getView().getModel().refresh();

                //  this.onResetPress();
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

        editServiceCall : function(oPayload)
        {
            this.getView().setBusy(true);

            var sPath =`/SALUser(guid'${this.sID}')`;
            this.getOwnerComponent()
            .getModel()
            .update(sPath, oPayload, {
              success: function (oData, oResponse) {
                sap.m.MessageBox.success("Record Updated Successfully.");
                this.getView().setBusy(false);
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


        getCreateUserPayload: function () {
          var oCreateUserData = this.getView()
            .getModel("CreateUserViewModel")
            .getData();

          return {
            name: oCreateUserData.name,
            email: oCreateUserData.email,
            sfUserId: oCreateUserData.sfUserId,
            itsmUserId: oCreateUserData.itsmUserID,
            s4UserId: oCreateUserData.s4UserId,
            reportingTo: "",
            masterRoleId: parseInt(oCreateUserData.roleID)
          };
        },

        onCancelCreateUser: function () {
          this._oCreateUserDialog.close();
        },
        onReset: function () {
          this._ResetFilterBar();
        },
        _ResetFilterBar: function () {
          var aCurrentFilterValues = [];
          var aResetProp = {
            
            Name: "",
            sfuserID: "",
            
          };
          var oViewModel = this.getView().getModel("oModelControl");
          oViewModel.setProperty("/filterBar", aResetProp);
          var oTable = this.byId("idCreateUserTable");
          var oBinding = oTable.getBinding("items");
          oBinding.filter([]);
          oBinding.sort(
            new Sorter({
              path: "createdAt",
              descending: true,
            })
          );
          //this._fiterBarSort();
        },
      }
    );
  }
);
