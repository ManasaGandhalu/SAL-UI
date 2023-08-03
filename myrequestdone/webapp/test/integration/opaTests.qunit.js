/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require(["com/sal/myrequestdone/myrequestdone/test/integration/AllJourneys"
	], function () {
		QUnit.start();
	});
});
