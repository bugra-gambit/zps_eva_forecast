sap.ui.define([
    "sap/ui/core/UIComponent",
    "com/gambit/evaforecast/model/models"
], (UIComponent, models) => {
    "use strict";

    return UIComponent.extend("com.gambit.evaforecast.Component", {
        metadata: {
            manifest: "json",
            config: {
                fullWidth: true
            },
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // enable routing
            this.getRouter().initialize();
        }

        // mock server removed – data will be fetched from the backend OData service
    });
});