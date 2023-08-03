/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"comsalreports/sla_compliance_report/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
