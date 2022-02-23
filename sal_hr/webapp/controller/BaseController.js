sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/ui/core/BusyIndicator'
], function (Controller, BusyIndicator) {
    "use strict";

    return Controller.extend("com.sal.salhr.controller.BaseController", {
        /**
         * Convenience method for accessing the router.
         * @public
         * @returns {sap.ui.core.routing.Router} the router for this component
         */
        getRouter: function () {
            return sap.ui.core.UIComponent.getRouterFor(this);
        },

        addContentDensityClass: function () {
            return this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
        },
        /**
         * Convenience method for getting the view model by name.
         * @public
         * @param {string} [sName] the model name
         * @returns {sap.ui.model.Model} the model instance
         */
        getViewModel: function (sName) {
            return this.getView().getModel(sName);
        },

        getComponentModel: function () {
            return this.getOwnerComponent().getModel();
        },

        /**
         * Convenience method for setting the view model.
         * @public
         * @param {sap.ui.model.Model} oModel the model instance
         * @param {string} sName the model name
         */
        setModel: function (oModel, sName) {
            return this.getView().setModel(oModel, sName);
        },

        /**
         * Getter for the resource bundle.
         * @public
         * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
         */
        getResourceBundle: function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },
        
        //for controlling global busy indicator        
        presentBusyDialog: function () {
            BusyIndicator.show();
        },

        dismissBusyDialog: function () {
            BusyIndicator.hide();
        },
        _getTicketData: function (sId) {

            var idFILTER = new sap.ui.model.Filter({
            
            path: "ID",
            
            operator: sap.ui.model.FilterOperator.EQ,
            
            value1: sId
            
            });
            
            var filter = [];
            
            filter.push(idFILTER);
            
            
            
            var oComponentModel = this.getComponentModel();   
            oComponentModel.read("/Tickets", {
            
            filters: [filter],
            
            success: function (oData, oResponse) {
            
            this._bindView(oData);
            
            }.bind(this),
            
            error: function (oError) {
            
            sap.m.MessageBox.error(JSON.stringify(oError));
            
            }
            
            });
            
            
            
            
            },

        /**
        * Adds a history entry in the FLP page history
        * @public
        * @param {object} oEntry An entry object to add to the hierachy array as expected from the ShellUIService.setHierarchy method
        * @param {boolean} bReset If true resets the history before the new entry is added
        */
        addHistoryEntry: (function () {
            var aHistoryEntries = [];

            return function (oEntry, bReset) {
                if (bReset) {
                    aHistoryEntries = [];
                }

                var bInHistory = aHistoryEntries.some(function (entry) {
                    return entry.intent === oEntry.intent;
                });

                if (!bInHistory) {
                    aHistoryEntries.push(oEntry);
                    this.getOwnerComponent().getService("ShellUIService").then(function (oService) {
                        oService.setHierarchy(aHistoryEntries);
                    });
                }
            };
        })
    });

}
);