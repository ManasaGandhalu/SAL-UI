sap.ui.define(
  ["sap/ui/core/mvc/Controller", "sap/ui/model/json/JSONModel", "sap/ui/core/Fragment", 'sap/ui/model/Sorter', 'com/sal/cards/inprocessrequestcardtile/model/formatter'],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (Controller, JSONModel, Fragment, Sorter, formatter) {
    "use strict";

    return Controller.extend(
      "com.sal.cards.inprocessrequestcardtile.controller.InProcessRequestCard",
      {
        formatter: formatter,
        onInit: function () {

          var oCardData = {
            "donut": {
                "sap.app": {
                    "id": "com.sal.cards.inprocessrequestcardtile",
                    "type": "card"
                },
                "sap.card": {
                    "type": "Analytical",
                    "header": {
                        // "type": "Numeric",
                        "title": "",
                        // "subTitle": "Total requests that are Pending",
                       
                        "actions": [
                            {
                                "type": "Navigation",
                                "parameters": {},
                                "enabled": false
                            }
                        ]
                    },
                    "content": {
                        "chartType": "donut",
                        "chartProperties": {
                            "legend": {
                                "visible": true,
                                "position": "Bottom",
                                "alignment": "Left",
                            },
                            "plotArea": {
                                "dataLabel": {
                                    "visible": true,
                                    "showTotal": true
                                },
                                "colorPalette": ["#6c1332", "#ff0000", "#6a6d70"]
                            },
                            "title": {
                                "text": "Pending requests by Type",
                                "visible": true
                                }
                        },
                        "measureAxis": "size",
                        "dimensionAxis": "color",
                        "data": {
                            "json": {
                                "measures": []
                            },
                            "path": "/measures"
                        },
                        "dimensions": [{
                            "label": "Measure Name",
                            "value": "{name}"
                        }],
                        "measures": [{
                            "label": "totalPending",
                            "value": "{totalPending}"
                        }],
                        "actionableArea": "Chart",
                        "actions": [
                            {
                                "type": "Navigation",
                                "parameters": {
                                    "text": "{name}"
                                }

                            }
                        ]
                    }
                }
            }
        };
         
          this.getOwnerComponent()
            .getModel()
            .read("/MasterModules", {
              // urlParameters: {
              //     "IsUserManager": "true"
              // },

              success: function (oData) {
                // debugger;
                var cardManifests = new JSONModel();
                oCardData.donut["sap.card"].content.data.json.measures =
                  oData.results;
                oCardData.donut["sap.card"].content.data.path = "/measures";

                // Set Values for Header
                var iTotalRequest=Number(oData.results[0].totalPending) + Number(oData.results[1].totalPending) + Number(oData.results[2].totalPending);
                  oCardData.donut["sap.card"].header.title = "My Total Pending Requests (" + iTotalRequest + ")";
                // oCardData.donut["sap.card"].header.data.json.NumberCount = oData.results[0].totalPending + oData.results[1].totalPending + oData.results[2].totalPending;
                // oCardData.donut["sap.card"].header.data.json.NumberCount =
                //   oData.results[0].totalPending +
                //   oData.results[1].totalPending +
                //   oData.results[2].totalPending +
                //   oData.results[3].totalPending;
                // oCardData.donut["sap.card"].content.data.json.Unit = "";
                // oCardData.donut["sap.card"].content.data.json.Trend= "";
                // oCardData.donut["sap.card"].content.data.json.TrendColor= "Good";

                oData.results[0].name = "HR";
                oData.results[1].name = "Procurement";
                oData.results[2].name = "ITSM";
                //oData.results[3].name = "ITSM";

                cardManifests.setData(oCardData);
                this.getView().setModel(cardManifests, "manifests");
              }.bind(this),
              error: function () { },
            });
        },


        // openQuickView: function (oEvent, oModel) {
        //     var oButton = oEvent,
        //     that = this,
        //     oView = this.getView();

        //   if (!this._pQuickView) {
        //     this._pQuickView = Fragment.load({
        //       id: oView.getId(),
        //       name: "com.sal.cards.inprocessrequestcardtile.Fragments.QuickView",
        //       controller: this,
        //     }).then(function (oQuickView) {
        //       oView.addDependent(oQuickView);
        //       return oQuickView;
        //     });
        //   }
        //   this._pQuickView.then(function (oQuickView) {
        //     oQuickView.setModel(oModel);
        //     oQuickView.openBy( that.getView()
        //     .byId("idCardInprocessRequest"));
        //   });
        // },
        onConfirmPendingRequest: function (oEvent) {
          var oSelectedItem = oEvent.getParameter("selectedItem");
          var obj = oSelectedItem.getBindingContext("FragmetModel").getObject();
          
          if(obj.status === "REJECTED" || obj.status === "CANCELLED"){
            sap.m.MessageToast.show("The record is removed from the source system.");
        }else{
        this.triggerCrossApp(obj.subModuleId, obj.ID, obj.externalCode);
        } 
        
        },

        triggerCrossApp: function (sSubModuleID, sTicketID, sExternalCode) {
          // debugger;

          var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation"); // get a handle on the global XAppNav service
          var hash = (oCrossAppNavigator && oCrossAppNavigator.hrefForExternal({
            target: {
              semanticObject: this.semanticObject,
              action: this.action
            },
            params: {

              "submoduleId": sSubModuleID,
              "ticketId": sTicketID,
              "externalCode": sExternalCode

            }
          })) || "";

          if (this.semanticObject === 'itsm_semantic') {
            hash += `&/detail/${sSubModuleID}/detailDetail/${sExternalCode}/${sTicketID}/EndColumnFullScreen`;
          }

          oCrossAppNavigator.toExternal({
            target: {
              shellHash: hash
            }
          });
        },

        onAction: function (oEvent) {
          var selectedSlice = oEvent.getParameters().manifestParameters.text;
          var that = this;

          if (!this._oLabelAPDialog) {
            this._oLabelAPDialog = sap.ui.xmlfragment("idLabelAvailPickDialog", "com.sal.cards.inprocessrequestcardtile.Fragments.QuickView", this);
            that.getView().addDependent(this._oLabelAPDialog);
          }
          this.fnGetSelectedSliceData(selectedSlice);


        },
        fnGetSelectedSliceData: function (selectedSlice) {
          if (selectedSlice === "HR") {
            this.semanticObject = "HR_semantic";
            this.action = "display";

            var sStatusFilter = new sap.ui.model.Filter({
              path: "status",
              operator: sap.ui.model.FilterOperator.EQ,
              value1: "PENDING"
            });
            var sModuleFilter = new sap.ui.model.Filter({
              path: "moduleId",
              operator: sap.ui.model.FilterOperator.EQ,
              value1: "1"
            });
            var filter = [];
            filter.push(sStatusFilter, sModuleFilter);
            this.getOwnerComponent().getModel().read("/Tickets",
              {
                urlParameters: {
                  $expand: "subModule"

                },
                sorters: [new Sorter("createdAt", true)],
                filters: [filter],
                success: function (oData) {
                  var oFragmetModel = new JSONModel(oData.results);
                  this._oLabelAPDialog.setModel(oFragmetModel, "FragmetModel");
                  this._oLabelAPDialog.getModel("FragmetModel").setProperty("/titleName", selectedSlice);
                  this._oLabelAPDialog.open();
                }.bind(this),
                error: function () {

                }
              })
          }

          else if (selectedSlice === "ITSM") {
            this.semanticObject = "itsm_semantic";
            this.action = "display";

            var sStatusFilter = new sap.ui.model.Filter({
              path: "status",
              operator: sap.ui.model.FilterOperator.EQ,
              value1: "PENDING"
            });
            var sModuleFilter = new sap.ui.model.Filter({
              path: "moduleId",
              operator: sap.ui.model.FilterOperator.EQ,
              value1: "4"
            });
            var filter = [];
            filter.push(sStatusFilter, sModuleFilter);
            this.getOwnerComponent().getModel().read("/Tickets",
              {
                urlParameters: {
                  $expand: "subModule"

                },

                sorters: [new Sorter("createdAt", true)],
                filters: [filter],
                success: function (oData) {
                  var oFragmetModel = new JSONModel(oData.results);
                  this._oLabelAPDialog.setModel(oFragmetModel, "FragmetModel");
                  this._oLabelAPDialog.getModel("FragmetModel").setProperty("/titleName", selectedSlice);
                  this._oLabelAPDialog.open();
                }.bind(this),
                error: function () {

                }
              })
          } else if (selectedSlice === "Procurement") {
            this.semanticObject = "procurement_semantic";
            this.action = "display";

            var sStatusFilter = new sap.ui.model.Filter({
              path: "status",
              operator: sap.ui.model.FilterOperator.EQ,
              value1: "PENDING"
            });
            var sModuleFilter = new sap.ui.model.Filter({
              path: "moduleId",
              operator: sap.ui.model.FilterOperator.EQ,
              value1: "2"
            });
            var filter = [];
            filter.push(sStatusFilter, sModuleFilter);
            this.getOwnerComponent().getModel().read("/Tickets",
              {
                urlParameters: {
                  $expand: "subModule"

                },

                sorters: [new Sorter("createdAt", true)],
                filters: [filter],
                success: function (oData) {
                  var oFragmetModel = new JSONModel(oData.results);
                  this._oLabelAPDialog.setModel(oFragmetModel, "FragmetModel");
                  this._oLabelAPDialog.getModel("FragmetModel").setProperty("/titleName", selectedSlice);
                  this._oLabelAPDialog.open();
                }.bind(this),
                error: function () {

                }
              })
          }
        },
        getGroupHeader: function (oGroup) {
          return new GroupHeaderListItem({
            title: oGroup.key,
            upperCase: false
          });
        }
      }
    );
  }
);
