sap.ui.define(
  [
    "./BaseController",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "com/sal/salhr/model/formatter",
  ],
  function (BaseController, Controller, JSONModel, formatter) {
    "use strict";
    return BaseController.extend(
      "com.sal.salhr.controller.HealthInsuranceRequestDetailPage",
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
            .getRoute("HealthInsuranceRequestDetail")
            .attachPatternMatched(this._onObjectMatched, this);
        },
        onWithdrawPress: function () {
          var swfRequestId = this.getView()
            .getModel("headerModel")
            .getProperty("/workflowRequestId");
          if (swfRequestId) {
            this.onWithdrawRequest(swfRequestId);
          }
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
          this.onCallHistoryData(object.ticketCode);
          this.getView().setBusy(true);
          var oComponentModel = this.getComponentModel();
          var sKey = oComponentModel.createKey("/SF_HealthInsurance", {
            effectiveStartDate: object.effectiveStartDate,
            User: object.externalCode,
          });
          var bIsUserManager = this.getOwnerComponent()
            .getModel("EmpInfoModel")
            .getProperty("/IsUserManager")
            .toString();
          this.getView()
            .getModel()
            .read(sKey, {
              urlParameters: {
                $expand:
                  "cust_healthInsuranceDetails,cust_healthInsuranceDetails/cust_relationshipNav,cust_healthInsuranceDetails/cust_genderNav,cust_healthInsuranceDetails/cust_attachment1Nav,cust_healthInsuranceDetails/cust_attachment2Nav,cust_healthInsuranceDetails/cust_attachment3Nav,UserNav",
                IsUserManager: bIsUserManager,
                recordStatus: object.status,
              },
              success: function (oData) {
                this.getView().setBusy(false);
                this.fnSetDisplayHealthInsuranceModel(oData);
              }.bind(this),
              error: function () {
                this.getView().setBusy(false);
              }.bind(this),
            });
          this.getView()
            .getModel("LocalViewModel")
            .setProperty("/PageTitle", "Health Insurance dependent Request");
          this.getView().getModel("LocalViewModel").refresh();
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
        fnSetDisplayHealthInsuranceModel: function (oData) {
          this.getView().setBusy(true);
          var aCust_healthInsuranceDetails =
              oData.cust_healthInsuranceDetails.results,
            oDisplayEditBusinessTripObj = {
              externalCode: oData.externalCode,
              UserNav: oData.UserNav,
              effectiveStartDate: oData.effectiveStartDate,
              cust_healthInsuranceDetails: aCust_healthInsuranceDetails.map(
                function (item) {
                  return {
                    Relationship:
                      item.cust_relationshipNav.results[0].externalCode,
                    externalCode: item.externalCode,
                    DependentName: item.cust_dependentName,
                    DependentGender:
                      item.cust_genderNav.results[0].externalCode,
                    NationalID: item.cust_nationalID,
                    DependentNationalAddress: item.cust_address,
                    DependentDOB: item.cust_dateOfBirth,
                    DeliveryLoc: item.cust_location,
                    Scheme: item.cust_scheme,
                    attachment1FileContent: item.cust_attachment1Nav
                      ? item.cust_attachment1Nav.fileContent
                      : null,
                    attachment1FileName: item.cust_attachment1Nav
                      ? item.cust_attachment1Nav.fileName
                      : null,
                    attachment2FileContent: item.cust_attachment2Nav
                      ? item.cust_attachment2Nav.fileContent
                      : null,
                    attachment2FileName: item.cust_attachment2Nav
                      ? item.cust_attachment2Nav.fileName
                      : null,
                    attachment3FileContent: item.cust_attachment3Nav
                      ? item.cust_attachment3Nav.fileContent
                      : null,
                    attachment3FileName: item.cust_attachment3Nav
                      ? item.cust_attachment3Nav.fileName
                      : null,
                    isAttach1New: false,
                    isAttach2New: false,
                    isAttach3New: false,
                  };
                }
              ),
            },
            oDisplayHealthInsuranceModel = new JSONModel(
              oDisplayEditBusinessTripObj
            );
          this.getView().setModel(
            oDisplayHealthInsuranceModel,
            "DisplayHealthInsuranceModel"
          );
          this.getView().setBusy(false);
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
          this.handleClose();
        },
        onAttach1FileSelectedForUpload: function (oEvent) {
          // keep a reference of the uploaded file
          var that = this;
          var iRowNumber = oEvent
            .getSource()
            .getBindingContext("DisplayHealthInsuranceModel")
            .getPath();
          var oFiles = oEvent.getParameters().files;
          var fileName = oFiles[0].name;
          var fileType = oFiles[0].type;
          //code for base64/binary array
          this._getImageData(oFiles[0], function (base64) {
            sap.m.MessageBox.success("Attachment Uploaded Successfully.");
            that
              .getView()
              .getModel("DisplayHealthInsuranceModel")
              .setProperty(iRowNumber + "/attachment1FileContent", base64);
            that
              .getView()
              .getModel("DisplayHealthInsuranceModel")
              .setProperty(iRowNumber + "/attachment1FileName", fileName);
            that
              .getView()
              .getModel("DisplayHealthInsuranceModel")
              .setProperty(iRowNumber + "/isAttach1New", true);
          });
        },
        onAttach2FileSelectedForUpload: function (oEvent) {
          var that = this;
          var iRowNumber = oEvent
            .getSource()
            .getBindingContext("DisplayHealthInsuranceModel")
            .getPath();
          var oFiles = oEvent.getParameters().files;
          var fileName = oFiles[0].name;
          var fileType = oFiles[0].type;
          //code for base64/binary array
          this._getImageData(oFiles[0], function (base64) {
            sap.m.MessageBox.success("Attachment Uploaded Successfully.");
            that
              .getView()
              .getModel("DisplayHealthInsuranceModel")
              .setProperty(iRowNumber + "/attachment2FileContent", base64);
            that
              .getView()
              .getModel("DisplayHealthInsuranceModel")
              .setProperty(iRowNumber + "/attachment2FileName", fileName);
            that
              .getView()
              .getModel("DisplayHealthInsuranceModel")
              .setProperty(iRowNumber + "/isAttach2New", true);
          });
        },
        onAttach3FileSelectedForUpload: function (oEvent) {
          var that = this;
          var iRowNumber = oEvent
            .getSource()
            .getBindingContext("DisplayHealthInsuranceModel")
            .getPath();
          var oFiles = oEvent.getParameters().files;
          var fileName = oFiles[0].name;
          var fileType = oFiles[0].type;
          //code for base64/binary array
          this._getImageData(oFiles[0], function (base64) {
            sap.m.MessageBox.success("Attachment Uploaded Successfully.");
            that
              .getView()
              .getModel("DisplayHealthInsuranceModel")
              .setProperty(iRowNumber + "/attachment3FileContent", base64);
            that
              .getView()
              .getModel("DisplayHealthInsuranceModel")
              .setProperty(iRowNumber + "/attachment3FileName", fileName);
            that
              .getView()
              .getModel("DisplayHealthInsuranceModel")
              .setProperty(iRowNumber + "/isAttach3New", true);
          });
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
        onAddDetailsItemsPress: function (oEvent) {
          var aItemData = this.getView()
            .getModel("DisplayHealthInsuranceModel")
            .getData().cust_healthInsuranceDetails;
          if (aItemData.length > 0) {
            if (!this._validateMandatoryFields()) {
              return;
            }
          }
          var oModel = this.getViewModel(
            "DisplayHealthInsuranceModel"
          ).getProperty("/cust_healthInsuranceDetails");
          oModel.push({
            Relationship: "",
            DependentName: "",
            DependentGender: "",
            NationalID: "",
            DependentNationalAddress: "",
            DependentDOB: new Date(),
            DeliveryLoc: "",
            Scheme: "",
            attachment1FileContent: null,
            attachment1FileName: null,
            attachment2FileContent: null,
            attachment2FileName: null,
            attachment3FileContent: null,
            attachment3FileName: null,
            isAttach1New: false,
            isAttach2New: false,
            isAttach3New: false,
          });
          this.getView().getModel("DisplayHealthInsuranceModel").refresh();
        },
        onDeleteItemPress: function (oEvent) {
          this.packingListObj = oEvent
            .getSource()
            .getBindingContext("DisplayHealthInsuranceModel")
            .getObject();
          var iRowNumberToDelete = parseInt(
            oEvent
              .getSource()
              .getBindingContext("DisplayHealthInsuranceModel")
              .getPath()
              .split("/")[2]
          );
          var aTableData = this.getViewModel(
            "DisplayHealthInsuranceModel"
          ).getProperty("/cust_healthInsuranceDetails");
          aTableData.splice(iRowNumberToDelete, 1);
          this.getView().getModel("DisplayHealthInsuranceModel").refresh();
        },
        onSavePress: function () {
          var sTicketID = this.object.ID;
          var sEffectiveStartDate =   this.getFormattedDateValue("idEditEffectiveStartDate");
          var sUserID = this.getOwnerComponent()
            .getModel("EmpInfoModel")
            .getData().userId;
          var sEntityPath = `/SF_HealthInsurance(effectiveStartDate=datetime'${sEffectiveStartDate}',User='${sUserID}')`,
            oPayloadObj = this.fnGetHealthInsuranceRequestPayload();

          if (this.bValid != false) {
            this.getView().setBusy(true);
            this.getView()
              .getModel()
              .update(sEntityPath, oPayloadObj, {
                urlParameters: {
                   
                    "ticketId": sTicketID
                },
                success: function (oResponse) {
                  this.getView().setBusy(false);
                  sap.m.MessageBox.success("Request Submitted successfully.");
                  this.getView().getModel().refresh();
                  this.oRouter.navTo("detail", {
                    parentMaterial: this.sParentID,
                    layout: "TwoColumnsMidExpanded",
                  });
                }.bind(this),
                error: function (oError) {
                  this.getView().setBusy(false);
                  if (
                    JSON.parse(oError.responseText).error.message.value.indexOf(
                      "{"
                    ) === 0
                  )
                    sap.m.MessageBox.error(
                      JSON.parse(
                        JSON.parse(oError.responseText).error.message.value
                      ).error.message.value.split("]")[1]
                    );
                  else {
                    sap.m.MessageBox.error(
                      JSON.parse(oError.responseText).error.message.value
                    );
                  }
                  this.getView().getModel().refresh();
                }.bind(this),
              });
          }
        },
        _validateMandatoryFields: function (itemData) {
          var bValid = true;
          var aItemData = this.getView()
            .getModel("DisplayHealthInsuranceModel")
            .getData().cust_healthInsuranceDetails;
          if (aItemData.length > 0) {
            for (let i = 0; i < aItemData.length; i++) {
              if (!aItemData[i].Relationship) {
                bValid = false;
                sap.m.MessageBox.alert("Please select Relationship ");
                return;
              }
              if (!aItemData[i].DependentName) {
                bValid = false;
                sap.m.MessageBox.alert("Please select Dependent Name ");
                return;
              }
              if (!aItemData[i].DependentGender) {
                bValid = false;
                sap.m.MessageBox.alert("Please select Dependent Gender ");
                return;
              }
              if (!aItemData[i].NationalID) {
                bValid = false;
                sap.m.MessageBox.alert("Please select National ID ");
                return;
              }
              if (!aItemData[i].DependentNationalAddress) {
                bValid = false;
                sap.m.MessageBox.alert(
                  "Please select Dependent National Address "
                );
                return;
              }
              if (!aItemData[i].DeliveryLoc) {
                bValid = false;
                sap.m.MessageBox.alert("Please select Delivery Location");
                return;
              }
            }
          }
          if (aItemData.length === 0) {
            bValid = false;
            sap.m.MessageBox.alert("Please add atleast one item");
          }
          return bValid;
        },
        fnGetHealthInsuranceRequestPayload: function () {
          var aData = this.getViewModel("DisplayHealthInsuranceModel").getData()
            .cust_healthInsuranceDetails;
          var sUserID = this.getOwnerComponent()
            .getModel("EmpInfoModel")
            .getData().userId;
          var sEffectiveStartDate =   this.getFormattedDateValue("idEditEffectiveStartDate");
          var cust_healthInsuranceDetails = aData.map(function (item) {
            return {
              externalCode: item.externalCode,
              cust_address: item.DependentNationalAddress,
              cust_dateOfBirth: new Date(item.DependentDOB),
              cust_dependentName: item.DependentName,
              cust_healthInsurance_User: sUserID,
              cust_healthInsurance_effectiveStartDate: sEffectiveStartDate,
              cust_location: item.DeliveryLoc,
              cust_nationalID: item.NationalID,
              cust_gender: item.DependentGender,
              cust_relationship: item.Relationship,
              cust_scheme: item.Scheme,
              attachment1FileContent: item.attachment1FileContent,
              attachment1FileName: item.attachment1FileName,
              isAttach1New: item.isAttach1New,
              attachment1UserId: sUserID,
              attachment2FileContent: item.attachment2FileContent,
              attachment2FileName: item.attachment2FileName,
              isAttach2New: item.isAttach2New,
              attachment2UserId: sUserID,
              attachment3FileContent: item.attachment3FileContent,
              attachment3FileName: item.attachment3FileName,
              isAttach3New: item.isAttach3New,
              attachment3UserId: sUserID,
            };
          });
          return {
            User: sUserID,
            effectiveStartDate: sEffectiveStartDate,
            cust_healthInsuranceDetails: cust_healthInsuranceDetails,
          };
        },
        onDownLoadPress: function (oEvent) {
          var oItemRowObj = oEvent
            .getSource()
            .getBindingContext("DisplayHealthInsuranceModel")
            .getObject();
          var sLinkText = oEvent.getSource().getTooltip_Text().trim();
          var fContent =
            sLinkText === "Download(1)"
              ? oItemRowObj.attachment1FileContent
              : sLinkText === "Download(2)"
              ? oItemRowObj.attachment2FileContent
              : oItemRowObj.attachment3FileContent;
          var fileext = oFileObj.fileExtension;
          var mimeType = oFileObj.mimeType;
          var fName =
            sLinkText === "Download(1)"
              ? oItemRowObj.attachment1FileName
              : sLinkText === "Download(2)"
              ? oItemRowObj.attachment2FileName
              : oItemRowObj.attachment3FileName;
          fName = fName.split(".")[0];
          debugger;
          if (
            fileext === "pdf" ||
            fileext === "png" ||
            fileext === "jpg" ||
            fileext === "jpeg"
          ) {
            var decodedPdfContent = atob(fContent);
            var byteArray = new Uint8Array(decodedPdfContent.length);
            for (var i = 0; i < decodedPdfContent.length; i++) {
              byteArray[i] = decodedPdfContent.charCodeAt(i);
            }
            var blob = new Blob([byteArray.buffer], { type: mimeType });
            var _pdfurl = URL.createObjectURL(blob);
            var a = document.createElement("a");
            a.href = _pdfurl;
            a.download = fName;
            a.dispatchEvent(new MouseEvent("click"));
          } else {
            var decodedContent = atob(fContent);
            sap.ui.core.util.File.save(
              decodedContent,
              fName,
              fileext,
              mimeType
            );
          }
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
          this.oRouter.navTo("HealthInsuranceRequestDetail", {
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
      }
    );
  }
);
