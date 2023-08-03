sap.ui.define([
    "./BaseController",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/upload/Uploader",
    "sap/m/UploadCollectionParameter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
],

    function (BaseController, Controller, JSONModel, MessageBox, Uploader, UploadCollectionParameter, Filter, FilterOperator) {
        "use strict";
        return BaseController.extend("com.sal.salhr.controller.CreateLetterRequest", {
            onInit: function () {
                this.oRouter = this.getRouter();
                this.oRouter.getRoute("LetterRequest").attachPatternMatched(this._onObjectMatched, this);
                this.mainModel = this.getOwnerComponent().getModel();
            },

            _onObjectMatched: function (oEvent) {
                this.sParentID = oEvent.getParameter("arguments").parentMaterial;
                var sLayout = oEvent.getParameter("arguments").layout;
                this.getView().getModel("layoutModel").setProperty("/layout", sLayout);
                var oLocalViewModel = new JSONModel({                 
                    busy: false,               
                    currentDate: new Date(),
                    nationality: "Saudi Arabia"      
                });
                this.byId("idLetterTemplate").setSelectedKey(1);

                this.getView().setModel(oLocalViewModel, "LocalViewModel");
                var country = this.getOwnerComponent().getModel("EmpInfoModel").getData().nationality;
                this.onSelectCountry(country);
                
            },
         
            onRaiseRequestPress: function () {
                var sEntityPath = "/LetterRequest",
                    oPayloadObj = this.fnGetLetterRequestPayload();

                    this.getView().setBusy(true);

                    this.mainModel.create(sEntityPath, oPayloadObj, {
                        success: function (oData, oResponse) {
                            sap.m.MessageBox.success("Request Submitted Successfully.");
                            this.getView().setBusy(false);
                            this.getView().getModel().refresh();
                            this.onDownLoadPress(oData.result, oData.template,  oData.asOfDate);
                            this.oRouter.navTo("detail", {
                                parentMaterial: this.sParentID,
                                layout: "TwoColumnsMidExpanded"
    
                            });
                        }.bind(this),
                        error: function (oError) {
                            this.getView().setBusy(false);
                            sap.m.MessageBox.error(JSON.parse(JSON.parse(oError.responseText).error.message.value).error.message.value.split("]")[1]);
                            this.getView().getModel().refresh();
    
    
                        }.bind(this)
                    });
                
               
            },

            onSelectCountry: function(countryCode) {
                this.getView().byId("idLetterCountry").setBusy(true);
                // load country
                var oFilter = new Filter(
                    [
                        new Filter(
                        "code",
                        FilterOperator.EQ,
                        countryCode
                    )], true 
                );
                this.getView()
                    .getModel()
                    .read("/SF_Country", {
                        filters: [oFilter],
                        urlParameters: {
                            "$top": 1
                        },
                        success: function (oData) {
                            this.getView().byId("idLetterCountry").setBusy(false);
                            var results = oData.results;
                            if(results.length > 0) {
                                var nationality = results[0].externalName_defaultValue;
                                this.getView().getModel("LocalViewModel").setProperty("/nationality", nationality);
                            }
                        }.bind(this),
                        error: function (oError) {
                            this.getView().byId("idLetterCountry").setBusy(false);
                            sap.m.MessageBox.error(
                                JSON.parse(oError.responseText).error.message.value
                            );
                        }.bind(this),
                    });
            },

            fnGetLetterRequestPayload: function () {
              var sTemplate = this.byId("idLetterTemplate").getSelectedKey();
              var sNationality = this.getView().getModel("LocalViewModel").getProperty("/nationality");
              var sDate = this.byId("idLetterEffectDatePicker").getDateValue();
              var sUserID = this.getOwnerComponent().getModel("EmpInfoModel").getData().userId;

              var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" }),
              sDate = dateFormat.format(new Date(sDate));
              sDate = sDate + "T00:00:00";
              if(sTemplate === "1"){
                  sTemplate = "Introduction";
              }else {
                sTemplate = "Salary";
              }
                return {
     
                        "language" : "EN",
                        "country" : sNationality,
                         "userId" : sUserID,
                         "template" : sTemplate,
                         "asOfDate" : sDate
                     
                  
                };
            
        },

            onCreateCancelPress: function () {
                this.oRouter.navTo("detail", {
                    parentMaterial: this.sParentID,
                    layout: "TwoColumnsMidExpanded"

                });
                this.mainModel.refresh();
            },
          
            onDownLoadPress: function (fContent, sName, sDate) {
              var sDate = new Date(sDate),
              sMonth = sDate.getMonth() + 1,
              sDay = sDate.getDate(),
              sYear = sDate.getFullYear();

             sDate = `${sMonth}-${sDay}-${sYear}`
                var sTemplate = this.byId("idLetterTemplate").getSelectedKey();
                if(sTemplate === "1"){
                    sTemplate = `${sName}_Certificate_ENGLISH_${sDate}.pdf`;
                }else {
                //   sTemplate = "Introduction Certificate with Salary.pdf";
                  sTemplate = `${sName}_Certificate with Salary_ENGLISH_${sDate}.pdf`;
                }


                    var decodedPdfContent = atob(fContent);
                    var byteArray = new Uint8Array(decodedPdfContent.length)
                    for (var i = 0; i < decodedPdfContent.length; i++) {
                        byteArray[i] = decodedPdfContent.charCodeAt(i);
                    }
                    var blob = new Blob([byteArray.buffer], { type: "pdf" });
                    var _pdfurl = URL.createObjectURL(blob);
                    var a = document.createElement('a');
                    a.href = _pdfurl;
                    a.download = sTemplate;
                    a.dispatchEvent(new MouseEvent('click'));
               
            }

        });
    });      
