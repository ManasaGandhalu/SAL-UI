/*global QUnit*/

sap.ui.define([
	"comsal/itsrvmgmtrequestssummarytile/controller/ITSrvMgmtTile.controller"
], function (Controller) {
	"use strict";

	QUnit.module("ITSrvMgmtTile Controller");

	QUnit.test("I should test the ITSrvMgmtTile controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
