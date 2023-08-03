/*global QUnit*/

sap.ui.define([
	"comsalopenrequestcardtile/openrequestcardtile/controller/OpenRequestCard.controller"
], function (Controller) {
	"use strict";

	QUnit.module("OpenRequestCard Controller");

	QUnit.test("I should test the OpenRequestCard controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
