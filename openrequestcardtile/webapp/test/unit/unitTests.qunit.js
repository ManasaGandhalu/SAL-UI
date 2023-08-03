/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"comsalopenrequestcardtile/openrequestcardtile/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
