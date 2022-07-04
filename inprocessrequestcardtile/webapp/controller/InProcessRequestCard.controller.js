sap.ui.define(
  ["sap/ui/core/mvc/Controller", "sap/ui/model/json/JSONModel", 	"sap/ui/core/Fragment"],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (Controller, JSONModel, Fragment) {
    "use strict";

    return Controller.extend(
      "com.sal.cards.inprocessrequestcardtile.controller.InProcessRequestCard",
      {
        onInit: function () {
        

          var oCardData = {
            donut: {
              "sap.app": {
                id: "com.sal.cards.inprocessrequestcardtile",
                type: "card",
              },
              "sap.card": {
                type: "Analytical",
                header: {
                  type: "Numeric",
                  title: "My Pending Requests",
                  subTitle: "Total requests that are Pending",
                  data: {
                    json: {
                      NumberCount: "0",
                      Unit: "",
                      Trend: "",
                      TrendColor: "Good",
                    },
                  },
                  mainIndicator: {
                    number: "{NumberCount}",
                    unit: "{Unit}",
                    trend: "{Trend}",
                    state: "{TrendColor}",
                  },
                  actions: [
                    {
                      type: "Navigation",
                      enabled: false,
                      parameters: {},
                    },
                  ],
                },
                content: {
                  chartType: "Donut",
                  legend: {
                    visible: true,
                    position: "Bottom",
                    alignment: "Left",
                  },
                  plotArea: {
                    dataLabel: {
                      visible: true,
                      showTotal: true,
                    },
                  },
                  title: {
                    text: "Pending requests by Type",
                    visible: true,
                  },
                  measureAxis: "size",
                  dimensionAxis: "color",
                  data: {
                    json: {
                      measures: [],
                    },
                    path: "/measures",
                  },
                  dimensions: [
                    {
                      label: "Measure Name",
                      value: "{name}",
                      tooltip:"{name}"
                    },
                  ],
                  measures: [
                    {
                      label: "Value",
                      value: "{totalPending}",
                      tootip:"{name}"
                    },
                  ],
                  "actionableArea": "Chart",
                  "actions": [
                      {
                          "type": "Navigation",
                          "parameters": {
                             "text":"{name}"
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
                var cardManifests = new JSONModel();
                oCardData.donut["sap.card"].content.data.json.measures =
                  oData.results;
                oCardData.donut["sap.card"].content.data.path = "/measures";

                // Set Values for Header
                oCardData.donut["sap.card"].header.data.json.NumberCount = oData.results[0].totalPending + oData.results[1].totalPending + oData.results[2].totalPending + oData.results[3].totalPending;
                // oCardData.donut["sap.card"].header.data.json.NumberCount =
                //   oData.results[0].totalPending +
                //   oData.results[1].totalPending +
                //   oData.results[2].totalPending +
                //   oData.results[3].totalPending;
                // oCardData.donut["sap.card"].content.data.json.Unit = "";
                // oCardData.donut["sap.card"].content.data.json.Trend= "";
                // oCardData.donut["sap.card"].content.data.json.TrendColor= "Good";

                cardManifests.setData(oCardData);
                this.getView().setModel(cardManifests, "manifests");
              }.bind(this),
              error: function () {},
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

        onAction: function (oEvent) {
            var selectedSlice = oEvent.getParameters().manifestParameters.text;
            var that = this;
           
            if (!this._oLabelAPDialog) {
				this._oLabelAPDialog = sap.ui.xmlfragment("idLabelAvailPickDialog", "com.sal.cards.inprocessrequestcardtile.Fragments.QuickView", this);
				that.getView().addDependent(this._oLabelAPDialog);
			}
            this.fnGetSelectedSliceData(selectedSlice);
            

        },
        fnGetSelectedSliceData:function(selectedSlice){
            if(selectedSlice === "Human Resource"){
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
                filter.push(sStatusFilter,sModuleFilter);
                this.getOwnerComponent().getModel().read("/Tickets",
                {
                    filters: [filter],
                    success:function(oData){
                        var oFragmetModel = new JSONModel(oData.results);
			            this._oLabelAPDialog.setModel(oFragmetModel, "FragmetModel");
                        this._oLabelAPDialog.getModel("FragmetModel").setProperty("/titleName",selectedSlice);
			            this._oLabelAPDialog.open();
                    }.bind(this),
                    error:function(){

                    }
                })
            }

            else  if(selectedSlice === "IT Service Management"){
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
                filter.push(sStatusFilter,sModuleFilter);
                this.getOwnerComponent().getModel().read("/Tickets",
                {
                    filters: [filter],
                    success:function(oData){
                        var oFragmetModel = new JSONModel(oData.results);
			            this._oLabelAPDialog.setModel(oFragmetModel, "FragmetModel");
                        this._oLabelAPDialog.getModel("FragmetModel").setProperty("/titleName",selectedSlice);
			            this._oLabelAPDialog.open();
                    }.bind(this),
                    error:function(){

                    }
                })
            }
        }
      }
    );
  }
);
