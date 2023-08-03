sap.ui.define([], function () {
    "use strict";
    return {
        handleNoData: function (sValue) {
            if (!sValue) {
                var sNoData = "NA";
                return sNoData;
            } else {
                return sValue;
            }
        },

        ticketStatus: function (sValue) {
            var returnStatus = "None";
            sValue = sValue.toUpperCase();
            switch (sValue) {
                case 'CANCELLED':
                    returnStatus = "Error";
                    break;
                case 'REJECTED':
                    returnStatus = "Error";
                    break;
                case 'APPROVED':
                    returnStatus = "Success";
                    break;
                case 'PENDING':
                    returnStatus = "Warning";
                    break;
                default:
                    returnStatus = "None";
            }
            return returnStatus;
        }
    };
});

