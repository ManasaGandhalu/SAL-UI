sap.ui.define([ 
    "./BaseController",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/upload/Uploader",
    "sap/ui/core/Fragment",
    "sap/ui/Device",
    "sap/ui/model/Filter"
],

    function (BaseController, Controller,JSONModel,MessageBox,Uploader,Fragment, Device, Filter) {
        "use strict";
        return BaseController.extend("com.sal.salhr.controller.CreateDisciplinaryRequest", {
            onInit: function () {

                
                this.oRouter = this.getRouter();
                this.oRouter.getRoute("DisciplinaryRequest").attachPatternMatched(this._onObjectMatched, this);
             
                this.mainModel = this.getOwnerComponent().getModel();
                var that = this;

                
                var oLocalViewModel = new JSONModel({
                    currentDate: new Date(),    
                    busy:false,
                    uploadAttachment:true,
                    currentDate:new Date(),
                    managerId: "12345"
                });

                this.getView().setModel(oLocalViewModel, "LocalViewModel");

              
                

               
            },
      
            _onObjectMatched: function (oEvent) {
                this.onResetPress();
                
                this.sParentID = oEvent.getParameter("arguments").parentMaterial;
                var sLayout = oEvent.getParameter("arguments").layout;
               
                this.getView().getModel("layoutModel").setProperty("/layout", sLayout);
               
                this._bindView("/MasterSubModules" + this.sParentID);
                this.onResetPress();
                this.fnSetDisciplinaryLocalModel();
                

                
            },
            fnSetDisciplinaryLocalModel: function () {
              
               
                this.EmpInfoObj = this.getOwnerComponent().getModel("EmpInfoModel").getData();
              this.managerID = this.EmpInfoObj.userId;

              

                var   oCreateDisciplinaryObj = {
                        "managerId": this.EmpInfoObj.managerId,
                       
                      
                        
                    },
                    oCreateDisplinaryModel = new JSONModel(oCreateDisciplinaryObj);

                this.getView().setModel(oCreateDisplinaryModel, "CreateDisplinaryModel");

              
            },
            _bindView: function (sObjectPath) {
                var objectViewModel = this.getViewModel("objectViewModel");
                var that = this;
                var oComponentModel = this.getComponentModel();
              
                var sKey = oComponentModel.createKey("/MasterSubModules", {
                    ID: this.sParentID
                });

                this.getView().bindElement({
                    path: sKey,
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

            onValueHelpRequest: function (oEvent) {

                var oView = this.getView();
    
                if (!this._pDialog) {
                    this._pDialog = Fragment.load({
                        id: oView.getId(),
                        name: "com.sal.salhr.Fragments.PRNValueHelp",
                        controller: this
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        if (Device.system.desktop) {
                            oDialog.addStyleClass("sapUiSizeCompact");
                        }
                        return oDialog;
                    });
                }
    
                this._pDialog.then(function (oDialog) {
                    var oList = oDialog.getAggregation("_dialog").getAggregation("content")[1];
                  var userId =    this.managerID;
                    var sUserIDFilter = new sap.ui.model.Filter({
                        path: "manager/userId",
                        operator: sap.ui.model.FilterOperator.EQ,
                        value1: userId
                    });
                    
                    oList.getBinding("items").filter([sUserIDFilter]);
                   
    
                    oDialog.open();
                }.bind(this));
            },

            onValueHelpSearch: function (oEvent) {
                var sValue = oEvent.getParameter("value");
          
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
                var obj = oSelectedItem.getBindingContext().getObject();
                this.byId("idPRN").setValue(obj["userId"]);
                this.prnID = obj["userId"];
    
            },
    
            _validateMandatoryFields: function () {
                var bValid = true;
                if (this.byId("idIncidentDescription").getValue() === "") {
                    this.byId("idIncidentDescription").setValueState("Error");
                    this.byId("idIncidentDescription").setValueStateText(
                        "Please enter incident description details"
                    );
                    bValid = false;
                } else {
                    this.byId("idIncidentDescription").setValueState("None");
                    this.byId("idIncidentDescription").setValueStateText(null);
                }

               



                return bValid;
            },
            
            onRaiseRequestPress: function () {
                if (!this._validateMandatoryFields()) {

                    return;
                }

                var oPayload,sPath;
                
                oPayload = this.getDisciplinaryCreatePayload();
                sPath = "/SF_Disciplinary_Action";

               
                this.getView().setBusy(true);
              
                this.mainModel.create(sPath, oPayload, {
                    success: function (oData, oResponse) {
                        this.prnID = null;
                        sap.m.MessageBox.success("Request Submitted Successfully.");
                        this.getView().setBusy(false);
                        this.getView().getModel().refresh();
                        this.onResetPress();
                        this.oRouter.navTo("detail", {
                            parentMaterial: this.sParentID,
                            layout: "TwoColumnsMidExpanded"

                        });
                    }.bind(this),
                    error: function (oError) {
                        this.prnID = null;
                        sap.m.MessageBox.error(JSON.parse(JSON.parse(oError.responseText).error.message.value).error.message.value.split("]")[1]);  
                        this.getView().getModel().refresh();
                        this.getView().setBusy(false);
                       
                    }.bind(this)
                })
            },

            onFileAdded: function (oEvent) {
                debugger;
                var that = this;

         
                var file = oEvent.getParameter("item");
                var Filename = file.getFileName(),
                    Filetype = file.getMediaType(),
                    Filesize = file.getFileObject().size,
                    Filedata = oEvent.getParameter("item").getFileObject();


                //code for base64/binary array 
                this._getImageData((Filedata), function (Filecontent) {
                    that._addData(Filecontent, Filename, Filetype, Filesize);
                });
                var oUploadSet = this.byId("UploadSet");
                oUploadSet.getDefaultFileUploader().setEnabled(false);


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
                this.getViewModel("LocalViewModel").setProperty(
                    "/busy",
                    true
                );
                this.fileContent = Filecontent;
                this.fileName = Filename;
                this.isAttachment = true;

            },
            onFileDeleted: function (oEvent) {
                var oUploadSet = this.byId("UploadSet");
                oUploadSet.getDefaultFileUploader().setEnabled(true);
            },
            getDisciplinaryCreatePayload:function(){
                var sUserID = this.getOwnerComponent().getModel("EmpInfoModel").getData().userId;
                var sPRNID = this.getView().byId("idPRN").getValue();
          

            //    if (this.prnID) {
            //     sPRNID =   this.prnID;
            // } else {
            //     sPRNID = this.getOwnerComponent().getModel("EmpInfoModel").getData().userId;
            // }

                var sAttachmentFileContent, sAttahmentFileName;
                var sIncidentStartDate = this.byId("idIncidentStartDate").getDateValue();
                var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" }),
                sIncidentStartDate = dateFormat.format(new Date(sIncidentStartDate));
                sIncidentStartDate = sIncidentStartDate + "T00:00:00";
                var sEffectiveStartDate = this.byId("idEffectStartDate").getDateValue();
                sEffectiveStartDate = dateFormat.format(new Date(sEffectiveStartDate));
                sEffectiveStartDate = sEffectiveStartDate + "T00:00:00";
                var sIncidentCategory = this.byId("idIncidenCategiory").getSelectedKey();
                var sIncidentStatus = this.byId("idIncidentStatus").getSelectedKey();
                var sSeverity = this.byId("idSeverity").getSelectedKey();
                var sWarningType = this.byId("idWarningType").getSelectedKey();
                var sIncidentDesc = this.byId("idIncidentDescription").getValue();

                

                if(this.isAttachment === true){
                    sAttachmentFileContent = this.fileContent;
                    sAttahmentFileName = this.fileName;
                }else{
                    sAttachmentFileContent = null;
                    sAttahmentFileName = null;
                    this.isAttachment = false;
                 }
              
                return{
                    "cust_DateofIncident": sIncidentStartDate,
                    "cust_IncidentStatus": sIncidentStatus,
                    "cust_IncidentDetails": sIncidentDesc,
                    "cust_Reason": sIncidentCategory,
                    "cust_Severity": sSeverity,
                    "cust_warningType": sWarningType,
                    "effectiveStartDate": sEffectiveStartDate,
                    "externalCode": sPRNID,
                    "externalName": null,
                    "attachmentFileContent":sAttachmentFileContent,
                    "attachmentFileName": sAttahmentFileName,
                    "isAttachmentNew": this.isAttachment,
                    "attachmentUserId": sUserID,
                    "cust_letterIssued": "Y"
  
                };
            },
         
         
            
          
          
            onFileSizeExceed: function () {
                MessageBox.error("File size exceeded, Please upload file upto 10MB.");
            },
    
            onFileNameLengthExceed: function () {
                MessageBox.error("File name length exceeded, Please upload file with name lenght upto 50 characters.");
            },
            onUploadComplete: function(oEvent) {
                var sUploadedFileName = oEvent.getParameter("files")[0].fileName;
                setTimeout(function() {
                    var oUploadCollection = sap.ui.core.Fragment.byId("idLeaveFragment", "UploadCollection");
    
                    for (var i = 0; i < oUploadCollection.getItems().length; i++) {
                        if (oUploadCollection.getItems()[i].getFileName() === sUploadedFileName) {
                            oUploadCollection.removeItem(oUploadCollection.getItems()[i]);
                            break;
                        }
                    }
    
                    // delay the success message in order to see other messages before
                   
                }.bind(this), 8000);
            },
            onCreateCancelPress:function(){
                this.oRouter.navTo("detail", {
                    parentMaterial: this.sParentID,
                    layout: "TwoColumnsMidExpanded"

                });
                this.mainModel.refresh();
            },
            onResetPress:function(){
                this.onCreateResetPress();
              
               
            },
            onCreateResetPress:function(){
                var dataReset = {
                    currentDate: new Date(),    
                    endDate: new Date(),
                    busy:false,
                    uploadAttachment:true
                };
                this.getView().getModel("LocalViewModel").setData(dataReset);
                this.getView().getModel("LocalViewModel").refresh();
                this.byId("UploadSet").removeAllItems();
                var oUploadSet = this.byId("UploadSet");
                this.byId("idIncidentDescription").setValue("");
                oUploadSet.getDefaultFileUploader().setEnabled(true);
            }
    

             
        });
    });      
