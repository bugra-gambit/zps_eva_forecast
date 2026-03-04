/* global QUnit */
QUnit.config.autostart = false;

sap.ui.require(["com/gambit/evaforecast/test/integration/AllJourneys"
], function () {
	QUnit.start();
});
