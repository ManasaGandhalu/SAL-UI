sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/ui/core/BusyIndicator'
], function (Controller, BusyIndicator) {
    "use strict";

    return Controller.extend("com.sal.salportalhr.controller.BaseController", {
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
        getComponentNamedModel: function (sName) {
            return this.getOwnerComponent().getModel(sName);
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

        initializeFilterBar: function () {
            this._addSearchFieldAssociationToFB();

            this.oFilterBar = null;
            this.oFilterBar = this.byId("filterbar");

            this.oFilterBar.registerFetchData(this.fFetchData);
            this.oFilterBar.registerApplyData(this.fApplyData);
            this.oFilterBar.registerGetFiltersWithValues(this.fGetFiltersWithValues);

            thiinis.oFilterBar.fireInitialise();
        },

        _addSearchFieldAssociationToFB: function () {
            let oFilterBar = this.getView().byId("filterbar");
            let oSearchField = oFilterBar.getBasicSearch();
            var oBasicSearch;
            if (!oSearchField) {
                // @ts-ignore   
                oBasicSearch = new sap.m.SearchField({
                    id: "idSearch", showSearchButton: false,
                    placeholder: "Search"
                });
                oBasicSearch.attachLiveChange(this.onFilterChange, this);
            } else {
                oSearchField = null;
            }
            oFilterBar.setBasicSearch(oBasicSearch);
            oBasicSearch.attachBrowserEvent("keyup", function (e) {
                if (e.which === 13) {
                    this.onSearch();
                }
            }.bind(this));
        },

        fFetchData: function () {
            var oJsonParam;
            var oJsonData = [];
            var sGroupName;
            var oItems = this.getAllFilterItems(true);

            for (var i = 0; i < oItems.length; i++) {
                oJsonParam = {};
                sGroupName = null;
                if (oItems[i].getGroupName) {
                    sGroupName = oItems[i].getGroupName();
                    oJsonParam.groupName = sGroupName;
                }

                oJsonParam.name = oItems[i].getName();

                var oControl = this.determineControlByFilterItem(oItems[i]);
                if (oControl) {
                    oJsonParam.value = oControl.getValue();
                    oJsonData.push(oJsonParam);
                }
            }

            return oJsonData;
        },

        fApplyData: function (oJsonData) {

            var sGroupName;

            for (var i = 0; i < oJsonData.length; i++) {

                sGroupName = null;

                if (oJsonData[i].groupName) {
                    sGroupName = oJsonData[i].groupName;
                }

                var oControl = this.determineControlByName(oJsonData[i].name, sGroupName);
                if (oControl) {
                    oControl.setValue(oJsonData[i].value);
                }
            }
        },

        fGetFiltersWithValues: function () {
            var i;
            var oControl;
            var aFilters = this.getFilterGroupItems();

            var aFiltersWithValue = [];

            for (i = 0; i < aFilters.length; i++) {
                oControl = this.determineControlByFilterItem(aFilters[i]);
                if (oControl && oControl.getValue && oControl.getValue()) {
                    aFiltersWithValue.push(aFilters[i]);
                }
            }

            return aFiltersWithValue;
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
        })()
    });

}
);