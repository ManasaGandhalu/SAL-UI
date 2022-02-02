sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function (Controller) {
	"use strict";

	return Controller.extend("com.sal.salportalhr.controller.Detail", {
		onInit: function () {
			// this.oOwnerComponent = this.getOwnerComponent();

			// this.oRouter = this.oOwnerComponent.getRouter();
			// this.oModel = this.oOwnerComponent.getModel();

			// this.oRouter.getRoute("master").attachPatternMatched(this._onProductMatched, this);
			// this.oRouter.getRoute("detail").attachPatternMatched(this._onProductMatched, this);
			// this.oRouter.getRoute("detailDetail").attachPatternMatched(this._onProductMatched, this);
		},


		onExit: function () {
			this.oRouter.getRoute("master").detachPatternMatched(this._onProductMatched, this);
			this.oRouter.getRoute("detail").detachPatternMatched(this._onProductMatched, this);
		}
	});
});
