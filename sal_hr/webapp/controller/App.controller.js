sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller,JSONModel) {
        "use strict";

        return Controller.extend("com.sal.salhr.controller.App", {
            onInit: function () {
                this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
                this.oOwnerComponent = this.getOwnerComponent();
                this.oRouter = this.oOwnerComponent.getRouter();

                this.getView().setBusy(true);

                this.oRouter.attachRouteMatched(this.onRouteMatched, this);
                
           
            },
            
            onRouteMatched: function (oEvent) {
                this.getView().setBusy(false);
                var sRouteName = oEvent.getParameter("name"),
                    oArguments = oEvent.getParameter("arguments");
                // Save the current route name
                this.currentRouteName = sRouteName;
                this.currentParent = oArguments.parentMaterial;
                this.currentChild = oArguments.childModule;

               
            },
            
            onStateChanged: function (oEvent) {
                var bIsNavigationArrow = oEvent.getParameter("isNavigationArrow"),
                    sLayout = oEvent.getParameter("layout");
                    // this.getView().setBusy(true);
    
                // Replace the URL with the new layout if a navigation arrow was used
                if (bIsNavigationArrow) {
                    this.oRouter.navTo(this.currentRouteName, {layout: sLayout, parentMaterial: this.currentParent,childModule: this.currentChild }, true);

                    // this.getView().setBusy(false);
                }
                
            },

           
        });
    });
