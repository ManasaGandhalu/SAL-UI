/*global QUnit*/

sap.ui.define([
	"comsalcards/inprocessrequestcardtile/controller/InProcessRequestCard.controller"
], function (Controller) {
	"use strict";

	QUnit.module("InProcessRequestCard Controller");

	QUnit.test("I should test the InProcessRequestCard controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
