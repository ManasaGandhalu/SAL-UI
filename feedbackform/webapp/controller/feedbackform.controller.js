sap.ui.define(
  ["./BaseController", "sap/ui/model/json/JSONModel", "sap/ui/Device", "sap/ui/core/routing/History",     "sap/m/MessageBox"],

  function (BaseController, JSONModel, Device, History, MessageBox) {
    "use strict";
    return BaseController.extend(
      "com.sal.feedbackform.controller.feedbackform",
      {
        onInit: function () {
          this.mainModel = this.getOwnerComponent().getModel();
        //   this.getView().byId("idRating").setSelectedIndex(null);
        },


        onResetPress : function()
        {
            this.byId("idSuggestion").setValue("");
            this.byId("idComplains").setValue("");
            this.getView().byId("idRating").setSelectedIndex(null);

        },

        onCancelPress : function()
        {
            this.handleNavigationBack();
        },


        onSubmitPress: function () {


          

          if (!this._validateMandatoryFields()) {

              return;
          }
          var oRatingPayloadObj = this.fnGetRatingPayload(),
            oSuggestionPayloadObj = this.fnGetSuggestionPayload(),
            oComplainPayloadObj = this.fnGetComplainPayload(),
            sRatingEntityPath = "/Rating",
            sSuggestionEntityPath = "/Suggestion",
            sComplainEntityPath = "/Answer";

          this.getView().setBusy(true);
          Promise.allSettled([

            this.callAPIServiceInstance(sRatingEntityPath, oRatingPayloadObj),
            this.callAPIServiceInstance(sSuggestionEntityPath, oSuggestionPayloadObj),
            this.callAPIServiceInstance(sComplainEntityPath, oComplainPayloadObj)
        ]).then(this.PromiseResponse.bind(this)).catch(function (error) {}.bind(this));

      
        },
        _validateMandatoryFields: function () {
            var bValid = true;

            // if (this.byId("idRating").getSelectedIndex() === 0) {
            //     sap.m.MessageToast.show("Please Select Rating.");
            //     bValid = false;
            // } 

            if (this.byId("idSuggestion").getValue() === "") {
                this.byId("idSuggestion").setValueState("Error");
                this.byId("idSuggestion").setValueStateText(
                    "Please enter Suggestion"
                );
                bValid = false;
            } else {
                this.byId("idSuggestion").setValueState("None");
                this.byId("idSuggestion").setValueStateText(null);
            }


            if (this.byId("idComplains").getValue() === "") {
                this.byId("idComplains").setValueState("Error");
                this.byId("idComplains").setValueStateText(
                    "Please enter Complains"
                );
                bValid = false;
            } else {
                this.byId("idComplains").setValueState("None");
                this.byId("idComplains").setValueStateText(null);
            }

           



            



            



            return bValid;
        },



        callAPIServiceInstance: function (path, oPayload) {

			return new Promise(
				function (resolve, reject) {
                    this.mainModel.create(path, oPayload, {
						success: function (oData) {
							resolve(oData);
						},
						error: function (oResult) {
							reject(oResult);

						}
					});
				}.bind(this));
		},
        PromiseResponse : function(aValues)
        {
            this.getView().setBusy(false);
       
            var that = this;

            MessageBox.confirm("Thank You for Your Feedback.", {
                icon: MessageBox.Icon.INFORMATION,
                title: "Information",
                actions: [MessageBox.Action.OK],
                emphasizedAction: MessageBox.Action.OK,
                onClose: function (oAction) {
                    if (oAction == "OK") {
                        that.handleNavigationBack();
                    }
                }
            });
            this.getView().byId("idRating").setSelectedIndex(null);
            this.getView().byId("idSuggestion").setValue("");
        },
        fnGetRatingPayload: function () {
         var  sEmployeeID = this.getOwnerComponent().getModel("EmpInfoModel").getData().userId;

          return {
            employeeId: sEmployeeID,
            moduleId: 1,
            masterSubModuleId: 60,
            rating: this.getView().byId("idRating").getSelectedIndex() === 0 ? 1 : this.getView().byId("idRating").getSelectedIndex(),
            questionId: 2,
            source : "EP_PORTLET"
         
          };
        },

        fnGetSuggestionPayload: function () {
            var  sEmployeeID = this.getOwnerComponent().getModel("EmpInfoModel").getData().userId;
          return {
            employeeId: sEmployeeID,
            moduleId: 4,
            masterSubModuleId: 2,
            questionId: 3,
            suggestion: this.getView().byId("idSuggestion").getValue(),
            source : "EP_PORTLET"
          
          };
        },

        fnGetComplainPayload :  function()
        {
            var  sEmployeeID = this.getOwnerComponent().getModel("EmpInfoModel").getData().userId;
            return {
              employeeId: sEmployeeID,
              moduleId: 4,
              masterSubModuleId: 2,
              questionId: 5,
              answerText: this.getView().byId("idComplains").getValue(),
              source : "EP_PORTLET"
            
            };
        },

        handleNavigationBack: function (oEvent) {
            history.go(-1);
        },
      }
    );
  }
);
