sap.ui.define([], function () {
  "use strict";
  return {
    changeIcon: function (sValue) {
      switch (sValue) {
        case 1:
          return "sap-icon://create-leave-request";
          break;
        case 2:
          return "sap-icon://flight";
          break;
        case 3:
          return "sap-icon://stethoscope";
          break;
        case 4:
          return "sap-icon://loan";
          break;
        case 5:
          return "sap-icon://business-card";
          break;
        case 6:
          return "sap-icon://travel-expense";
          break;
        case 7:
          return "sap-icon://business-card";
          break;
        case 8:
          return "sap-icon://business-card";
          break;
        case 9:
          return "sap-icon://business-card";
          break;
        case 10:
          return "sap-icon://travel-expense";
          break;
        case 11:
          return "sap-icon://business-card";
          break;
        case 12:
          return "sap-icon://quality-issue";
          break;
        case 13:
          return "sap-icon://quality-issue";
          break;
        case 14:
          return "sap-icon://quality-issue";
          break;
        case 15:
          return "sap-icon://quality-issue";
          break;
        case 16:
          return "sap-icon://quality-issue";
          break;
        case 17:
          return "sap-icon://quality-issue";
          break;
        case 18:
          return "sap-icon://quality-issue";
          break;
        case 33:
          return "sap-icon://business-card";
          break;
        case 34:
          return "sap-icon://quality-issue";
          break;
      }
    },

    addDesc: function (sValue) {
      switch (sValue) {
        case 1:
          return "Create, edit or withdraw leave application";
          break;
        case 2:
          return "Create, edit or withdraw request for business trip requests with required details";
          break;
        case 3:
          return "Raise a request to add a health insurance dependant";
          break;
        case 4:
          return "Create, edit or withdraw request for loan advance";
          break;
        case 5:
          return "Create or withdraw request for business card ";
          break;
        case 6:
          return "Create, edit or withdraw request for airport pass";
          break;
        case 7:
          return "Create a request to update the Id card details";
          break;
        case 8:
          return "Apply for job vacany";
          break;
        case 9:
          return "Performance Management module";
          break;
        case 10:
          return "Create a request for additional payment";
          break;
        case 11:
          return "Raise a request to download Salary certificate or Introductory letter";
          break;
        case 12:
          return "Create a request to HR for disciplinary action against subordinate";
          break;
        case 13:
          return "Create or withdraw Bank account change";
          break;
        case 14:
          return "Create a request to HR for Salary Increment of subordinate";
          break;
        case 15:
          return "Create a request to HR for Promotion of subordinate";
          break;
        case 16:
          return "Create a request to HR for Transfer of subordinate";
          break;
        case 17:
          return "Create a request to HR for Termination of subordinate";
          break;
        case 18:
          return "Learning module";
          break;
      }
    },

    viewFileNames: function (oData) {
      if (oData) {
        if (oData.length > 0) return true;
        else return false;
      } else {
        return false;
      }
    },
    viewItemsFileUploader: function (oData) {
      if (oData) {
        if (oData.length > 0) return false;
        else return true;
      } else {
        return true;
      }
    },

    ticketStatusText: function (sValue, externalStatus) {
      switch (sValue) {
        case "CANCELLED":
          sValue = "CANCELLED";
          break;
        case "APPROVED":
          sValue = "APPROVED";
          break;
        case "PENDING":
          sValue = "PENDING";
          break;
        case "REJECTED":
          sValue = "REJECTED";
          break;
      }
      return sValue;
    },
    ticketStatusText1: function (sValue, externalStatus) {
      switch (sValue) {
        case "CANCELLED":
          sValue = "CANCELLED";
          break;
        case "APPROVED":
          sValue = "APPROVED";
          break;
        case "PENDING":
          sValue = "PENDING";
          break;
        case "REJECTED":
          if (
            sValue == "REJECTED" &&
            externalStatus !== null &&
            externalStatus !== sValue
          ) {
            sValue = `${sValue} (${externalStatus})`;
          } else {
            sValue = "REJECTED";
          }

          break;
      }
      return sValue;
    },

    ticketStatus: function (sValue) {
      var returnStatus = "None";
      switch (sValue) {
        case "CANCELLED":
          returnStatus = "Error";
          break;
        case "REJECTED":
          returnStatus = "Error";
          break;
        case "APPROVED":
          returnStatus = "Success";
          break;
        case "PENDING":
          returnStatus = "Warning";
          break;
        case "SKIPPED":
          returnStatus = "Information";
          break;
        default:
          returnStatus = "None";
      }
      return returnStatus;
    },

    formatCostCenter: function (oValue) {
      console.log(oValue);
      return oValue.results[0].name_defaultValue;
    },

    handleNoData: function (sValue) {
      if (!sValue) {
        var sNoData = "NA";
        return sNoData;
      } else {
        return sValue;
      }
    },

    setApproveVisibility: function (sStatus, sWorkflowRequestId, approverId) {
      var bIsUserManager = this.getOwnerComponent()
        .getModel("EmpInfoModel")
        .getProperty("/IsUserManager");
      var bApproveVisible = false;

      if (bIsUserManager) {
        if (sStatus === "PENDING" && sWorkflowRequestId !== null) {
          var bApproveOther = this.getOwnerComponent()
            .getModel("RoleInfoModel")
            .getProperty("/approveOther");
          var empInfoObj = this.getOwnerComponent()
            .getModel("EmpInfoModel")
            .getData();
          var bUserIsApprover = approverId == empInfoObj.userId ? true : false;
          bApproveVisible =
            bApproveOther === true && bUserIsApprover ? true : false;
        } else {
          bApproveVisible = false;
        }
      } else {
        bApproveVisible = false;
      }
      return bApproveVisible;
    },

    setRejectVisibility: function (sStatus, sWorkflowRequestId, approverId) {
      var bIsUserManager = this.getOwnerComponent()
        .getModel("EmpInfoModel")
        .getProperty("/IsUserManager");
      var bRejectVisible = false;

      if (bIsUserManager) {
        if (sStatus === "PENDING" && sWorkflowRequestId !== null) {
          var bRejectOther = this.getOwnerComponent()
            .getModel("RoleInfoModel")
            .getProperty("/rejectOther");
          var empInfoObj = this.getOwnerComponent()
            .getModel("EmpInfoModel")
            .getData();
          var bUserIsApprover = approverId == empInfoObj.userId ? true : false;
          bRejectVisible =
            bRejectOther === true && bUserIsApprover ? true : false;
        } else {
          bRejectVisible = false;
        }
      } else {
        bRejectVisible = false;
      }
      return bRejectVisible;
    },

    fnSetRaiseRequestVisibilty: function (bIsUserManager) {
      var bRaiseRequestVisible = false;

      if (bIsUserManager) {
        var bCreateOther = this.getOwnerComponent()
          .getModel("RoleInfoModel")
          .getProperty("/createOther");
        bRaiseRequestVisible = bCreateOther === true ? true : false;
      }
      if (!bIsUserManager) {
        var bCreateSelf = this.getOwnerComponent()
          .getModel("RoleInfoModel")
          .getProperty("/createSelf");
        bRaiseRequestVisible = bCreateSelf === true ? true : false;
      }
    //   return true;
      return bRaiseRequestVisible;
    },

    fnSetModifyVisibilty: function (bEditMode, bIsUserManager) {
      var bModifyVisible = false;

      if (bEditMode === false) {
        if (bIsUserManager) {
          var bUpdateOther = this.getOwnerComponent()
            .getModel("RoleInfoModel")
            .getProperty("/updateOther");
          bModifyVisible = bUpdateOther === true ? true : false;
        }
        if (!bIsUserManager) {
          var bUpdateSelf = this.getOwnerComponent()
            .getModel("RoleInfoModel")
            .getProperty("/updateSelf");
          bModifyVisible = bUpdateSelf === true ? true : false;
        }
      } else {
        bModifyVisible = false;
      }
      return bModifyVisible;
    },

    formatExternalCode: function (
      subModuleId,
      employeeId,
      externalCode,
      externalCode2
    ) {
      if (subModuleId === 1) {
        return externalCode2;
      } 
      else if (subModuleId === 14 || subModuleId === 15) {
        return employeeId;
      }
     
      
      else {
        return externalCode;
      }
    },

    fnSetWithdrawtVisibilty: function (
      bEditMode,
      bIsUserManager,
      sExternalStatus
    ) {
      var bWithdrawVisible = false;

      if (bEditMode === false) {
        if (bIsUserManager) {
          var bDeleteOther = this.getOwnerComponent()
            .getModel("RoleInfoModel")
            .getProperty("/deleteOther");
          bWithdrawVisible = bDeleteOther === true ? true : false;
        }
        if (!bIsUserManager) {
          if (sExternalStatus === "SENTBACK") {
            var bWithdrawSelf = this.getOwnerComponent()
              .getModel("RoleInfoModel")
              .getProperty("/withdrawSelf");
            bWithdrawVisible = bWithdrawSelf === true ? true : false;
          } else {
            var bDeleteSelf = this.getOwnerComponent()
              .getModel("RoleInfoModel")
              .getProperty("/deleteSelf");
            bWithdrawVisible = bDeleteSelf === true ? true : false;
          }
        }
      } else {
        bWithdrawVisible = false;
      }
      return bWithdrawVisible;
    },

    setApproveRejectManagerActionVisibility: function (
      sStatus,
      sWorkflowRequestId
    ) {
      var bIsUserManager = this.getOwnerComponent()
        .getModel("EmpInfoModel")
        .getProperty("/IsUserManager");

      if (
        bIsUserManager &&
        sStatus === "PENDING" &&
        sWorkflowRequestId !== null
      ) {
        return true;
      } else {
        return false;
      }
    },

    formatLabel: function (svalue, sKey) {
      if (sKey && svalue) {
        return `${svalue} (${sKey})`;
      } else {
        return null;
      }
    },

    formatPicklistOptions: function (picklist, property) {
      console.log(picklist, property);
      var oComponentModel = this.getComponentModel();
      var promise = new Promise(
        function (resolve, reject) {
          oComponentModel.read("/" + picklist, {
            success: function (oData) {
              resolve(oData[property]);
            },
            error: function (err) {
              console.log(err);
              reject(err);
            },
          });
        }.bind(this)
      );
      return promise;
    },

    formatTimeInPosition: function(date) {
        if(!date) {
            return 'NA';
        }
        var diff = Date.now() - new Date(date);
        var days    = Math.ceil(diff / 86400000),
            months  = Math.floor(days / 30),
            years   = Math.floor(days / 365);
        
        days %= 30;
        months %= 12;
        // console.log("Years:", years);
        // console.log("Months:", months);
        // console.log("Days:", days);
        return `${years} Years ${months} Months ${days} Days`;
    },

    formatEvent: function (requestEvent) {
        if(requestEvent == 'CREATED') {
            return 'Create Request';
        } else if(requestEvent == 'MODIFIED') {
            return 'Update Request';
        } else if(requestEvent == 'DELETED') {
            return 'Delete Request';
        } else if(requestEvent == 'CANCELLED') {
            return 'Cancel Request';
        }
        return '';
    },
    DateFormatter: function (dValue) {
            if (!dValue) {
                return "";
            }
            var localDate = new Date(dValue);
            var pattern = "dd/MM/yyyy";
            var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                pattern: pattern
            });
            var oNow = new Date(localDate);
            return oDateFormat.format(oNow);
        },
    
    ticketSLACounter: function(slaMinutes, slaCounter, slaViolated, slaTargetDate, slaActualDate) {
        if(slaMinutes == 0 || slaMinutes == null) {
            if(slaViolated || slaActualDate == null || slaActualDate > slaTargetDate) {
                return 'SLA Violated';
            } else {
                return 'SLA Completed';
            }
        }
        var hours = 0, min = 0;
        if(slaMinutes != null) {
            if(slaCounter) {
                hours = Math.floor(slaMinutes/60);
                min = slaMinutes % 60;
                return `${hours}hr ${min}min`;
            }
            hours = Math.floor(slaMinutes/60);
            min = slaMinutes % 60;
        }
        return `${hours}hr ${min}min`;
    },

    ticketSLAState: function(slaMinutes, slaViolated, slaTargetDate, slaActualDate) {
        if(slaMinutes == 0 || slaMinutes == null) {
            if(slaViolated || slaActualDate == null || slaActualDate > slaTargetDate) {
                return 'Error';
            } else {
                return 'Success';
            }
        }
        return 'Warning';
    },

    ticketSLAIcon: function(slaMinutes, slaViolated, slaTargetDate, slaActualDate) {
        if(slaMinutes == 0 || slaMinutes == null) {
            if(slaViolated || slaActualDate == null || slaActualDate > slaTargetDate) {
                return 'sap-icon://alert';
            } else {
                return 'sap-icon://complete';
            }
        }
        return 'sap-icon://history';
    }

  };
});
