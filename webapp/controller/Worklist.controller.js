sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/ColumnListItem",
    "sap/m/Text",
    "sap/m/Input",
    "sap/m/VBox",
    "sap/m/ProgressIndicator",
    "sap/m/Button",
    "sap/m/Dialog",
    "sap/m/Table",
    "sap/m/Column",
    "sap/m/Label"
], (Controller, Filter, FilterOperator, MessageToast, MessageBox, ColumnListItem, Text, Input, VBox, ProgressIndicator, Button, Dialog, Table, Column, Label) => {
    "use strict";

    return Controller.extend("com.gambit.evaforecast.controller.Worklist", {
        onInit() {
            // local JSON model for input text
            var oLocal = new sap.ui.model.json.JSONModel({
                selectedProjectText: "",
                selectedProjectId: "",
                selectedProjectDesc: "",
                selectedProjectStart: "",
                selectedProjectEnd: "",
                selectedProjectInterval: "",
                selectedProjectParent: "",
                tableTitle: "Work Packages"
            });
            this.getView().setModel(oLocal, "local");
            // json model that we will fill with projects from OData
            var oProj = new sap.ui.model.json.JSONModel({
                results: []
            });
            this.getView().setModel(oProj, "proj");
        },

        onTableUpdateFinished: function (oEvent) {
            // Update table title with actual displayed count (after filtering)
            var oTable = oEvent.getSource();
            var oBinding = oTable.getBinding("items");
            var count = 0;

            if (oBinding) {
                count = oBinding.getLength ? oBinding.getLength() : (oTable.getItems ? oTable.getItems().length : 0);
            }

            var oLocal = this.getView().getModel("local");
            if (oLocal) {
                oLocal.setProperty("/tableTitle", "Work Packages (" + count + ")");
            }
        },

        onProjectChange: function (oEvent) {
            // store selected key but do not filter immediately
            var sKey = oEvent.getParameter("selectedItem") && oEvent.getParameter("selectedItem").getKey();
            this._selectedProject = sKey;
        },

        onProjectGo: function () {
            // apply filter when Go button is pressed
            var sKey = this._selectedProject;
            var oTable = this.byId("workpackageTable");

            if (!sKey) {
                MessageToast.show("Please select a project first");
                return;
            }

            var oModel = this.getView().getModel();
            var aFilters = [new Filter("ProjectUUID", FilterOperator.EQ, sKey)];

            // Check if table is already bound
            var oBinding = oTable.getBinding("items");

            this.getView().setBusy(true);

            if (!oBinding) {
                // First time - create binding with template
                var oTemplate = new ColumnListItem({
                    cells: [
                        new Text({
                            text: "{ProjectElementDescription}"
                        }),
                        new Text({
                            text: "{ProjectElement}"
                        }),
                        new Text({
                            text: "{EVAInitBudgetDays} WD"
                        }),
                        new Text({
                            text: {
                                parts: [{
                                        path: "EVAInitialBudget"
                                    },
                                    {
                                        path: "EVAInitialBudgetCurrency"
                                    }
                                ],
                                formatter: function (budget, currency) {
                                    return budget ? budget + " " + currency : "";
                                }
                            }
                        }),
                        new Input({
                            value: {
                                path: "EVACurrentForecastPoC",
                                type: new sap.ui.model.type.Integer(),
                                mode: sap.ui.model.BindingMode.TwoWay
                            },
                            liveChange: this.onProgressLiveChange.bind(this),
                            width: "100%",
                            maxLength: 3
                        }),
                        new ProgressIndicator({
                            percentValue: "{EVACurrentForecastPoC}",
                            displayValue: "{= ${EVACurrentForecastPoC} + ' %'}",
                            width: "100%"
                        }),
                        new Input({
                            value: {
                                path: "EVACurrentForecastEtC",
                                type: new sap.ui.model.type.Integer(),
                                mode: sap.ui.model.BindingMode.TwoWay
                            },
                            placeholder: "WD",
                            liveChange: this.onProgressLiveChange.bind(this),
                            width: "100%",
                            maxLength: 3
                        }),
                        new Text({
                            text: "{= 'Progress: ' + ${EVAPreviousForecastPoC} + ' %, Rem. days: ' + ${EVAPreviousForecastEtC} + ' WD' }"
                        }),
                        new Button({
                            text: "{i18n>showHistoryButton}",
                            icon: "sap-icon://history",
                            type: "Transparent",
                            press: this.onShowHistory.bind(this)
                        })
                    ]
                });

                oTable.bindItems({
                    path: "/ZI_PS_EVA_WORKPACKAGE",
                    template: oTemplate,
                    filters: aFilters
                });
                this.getView().setBusy(false);
            } else {
                // Already bound - just update filters
                oBinding.filter(aFilters);
                this.getView().setBusy(false);
            }
        },

        onProjectValueHelp: function () {
            var that = this;
            // read list from OData into json model each time
            var oOData = this.getView().getModel();

            this.getView().setBusy(true);

            oOData.read("/ZI_PS_EVA_PROJECT", {
                success: function (oData) {
                    that.getView().getModel("proj").setProperty("/results", oData.results);
                    that.getView().setBusy(false);
                    // if dialog exists, also make sure it has fresh reference
                    if (that._oProjectVHDialog) {
                        that._oProjectVHDialog.setModel(that.getView().getModel("proj"), "proj");
                    }
                },
                error: function () {
                    that.getView().setBusy(false);
                }
            });
            // create fragment once, prefix IDs with the view id to avoid duplicates
            if (!this._oProjectVHDialog) {
                this._oProjectVHDialog = sap.ui.xmlfragment(
                    this.getView().getId(),
                    "com.gambit.evaforecast.view.ProjectValueHelp",
                    this
                );
                this.getView().addDependent(this._oProjectVHDialog);
                // attach json model as well so binding inside dialog works
                this._oProjectVHDialog.setModel(this.getView().getModel("proj"), "proj");
            }
            this._oProjectVHDialog.open();
        },




        onProjectVHConfirm: function (oEvent) {
            var oSelected = oEvent.getParameter("selectedItem");
            if (oSelected) {
                var sUUID = oSelected.data("uuid");


                var sText = oSelected.getTitle() + " - " + oSelected.getDescription();
                this._selectedProject = sUUID;
                this.getView().getModel("local").setProperty("/selectedProjectText", sText);

                var oSelectedData = oSelected.getBindingContext("proj").getObject();
                var oLocal = this.getView().getModel("local");

                oLocal.setProperty("/selectedProjectId", oSelectedData.Project || "");



                oLocal.setProperty("/selectedProjectStart", oSelectedData.ProjectStartDate ? this._formatDate(oSelectedData.ProjectStartDate) : "");
                oLocal.setProperty("/selectedProjectEnd", oSelectedData.ProjectEndDate ? this._formatDate(oSelectedData.ProjectEndDate) : "");


                var sInterval = oSelectedData.YY1_EVAIntervall_Cpr || "";
                if (sInterval === "101") {
                    sInterval = "101: weekly";
                } else if (sInterval === "102") {
                    sInterval = "102: monthly";
                }
                oLocal.setProperty("/selectedProjectInterval", sInterval);

                oLocal.setProperty("/selectedProjectParent", oSelectedData.YY1_ParentProject_Cpr || "");
            }
            this._oProjectVHDialog.close();
        },

        _formatDate: function (date) {
            if (!date) return "";

            var oDate;

            if (typeof date === "string") {
                if (date.indexOf("/Date(") === 0) {
                    oDate = new Date(parseInt(date.slice(6, -2), 10));
                } else {
                    oDate = new Date(date);
                }
            } else if (date instanceof Date) {
                oDate = date;
            } else {
                return "";
            }

            if (isNaN(oDate.getTime())) {
                return "";
            }

            var sMonth = String(oDate.getMonth() + 1).padStart(2, '0');
            var sDay = String(oDate.getDate()).padStart(2, '0');
            var sYear = oDate.getFullYear();


            return sDay + "." + sMonth + "." + sYear;
        },


        onProjectVHCancel: function () {
            this._oProjectVHDialog.close();
        },

        onProjectVHSearch: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            var oFilter = null;
            if (sValue && sValue.length) {
                oFilter = new Filter({
                    filters: [
                        new Filter("Project", FilterOperator.Contains, sValue),
                        new Filter("ProjectDescription", FilterOperator.Contains, sValue)
                    ],
                    and: false
                });
            }
            var oBinding = this._oProjectVHDialog.getBinding("items");
            if (oBinding) {
                oBinding.filter(oFilter);
            }
        },


        onProgressLiveChange: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            var oInput = oEvent.getSource();
            // Convert to integer and update binding to ensure proper OData transmission
            var iValue = sValue ? parseInt(sValue, 10) : null;
            oInput.getBinding("value").setValue(iValue);
        },




        //     var oModel = this.getView().getModel();
        //     var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();

        //     if (!oModel.hasPendingChanges()) {
        //         MessageToast.show(oResourceBundle.getText("noChangesToSave"));
        //         return;
        //     }

        //     this.getView().setBusy(true);

        //     // Pending changes'daki her item için ProjectElement ve ProjectUUID'yi ayarla
        //     var oPendingChanges = oModel.getPendingChanges();
        //     if (oPendingChanges) {
        //         Object.keys(oPendingChanges).forEach(function (sKey) {
        //             if (sKey.indexOf("ZI_PS_EVA_WORKPACKAGE") > -1) {
        //                 // OData key'sinden ProjectElement'i extract et: "ZI_PS_EVA_WORKPACKAGE('158100100000')" → "158100100000"
        //                 var aMatch = sKey.match(/'([^']+)'/);
        //                 if (aMatch && aMatch[1]) {
        //                     oPendingChanges[sKey].ProjectElement = aMatch[1];
        //                 }
        //                 oPendingChanges[sKey].ProjectUUID = this._selectedProject;
        //             }
        //         }.bind(this));
        //     }

        //     oModel.submitChanges({
        //         success: function () {
        //             this.getView().setBusy(false);
        //             MessageToast.show(oResourceBundle.getText("saveSuccess"));
        //         }.bind(this),
        //         error: function (oError) {
        //             this.getView().setBusy(false);
        //             MessageBox.error(oResourceBundle.getText("saveError"));
        //         }.bind(this)
        //     });
        // },

        onSave: function () {
            var oModel = this.getView().getModel();
            var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();

            if (!oModel.hasPendingChanges()) {
                sap.m.MessageToast.show(oResourceBundle.getText("noChangesToSave"));
                return;
            }

            this.getView().setBusy(true);

            var oPendingChanges = oModel.getPendingChanges();


            for (var sPath in oPendingChanges) {
                if (sPath.indexOf("ZI_PS_EVA_WORKPACKAGE") > -1) {
                    var aMatch = sPath.match(/'([^']+)'/);
                    if (aMatch && aMatch[1]) {
                        var sProjectElement = aMatch[1];


                        oModel.setProperty("/" + sPath + "/ProjectElement", sProjectElement);
                        oModel.setProperty("/" + sPath + "/ProjectUUID", this._selectedProject);
                    }
                }
            }

            oModel.submitChanges({
                success: function (oData) {
                    this.getView().setBusy(false);


                    if (oData && oData.__batchResponses && oData.__batchResponses.find(r => r.statusCode >= "400")) {
                        sap.m.MessageBox.error(oResourceBundle.getText("saveError"));
                    } else {
                        sap.m.MessageToast.show(oResourceBundle.getText("saveSuccess"));
                    }
                }.bind(this),
                error: function (oError) {
                    this.getView().setBusy(false);
                    sap.m.MessageBox.error(oResourceBundle.getText("saveError"));
                }.bind(this)
            });
        },
        onTableUpdateFinished: function (oEvent) {
            var oTable = oEvent.getSource();
            var aItems = oTable.getItems();


            if (aItems.length === 0) {
                return;
            }

            var oLocalModel = this.getView().getModel("local");
            var dCurrentPeriod = null;
            var dPreviousPeriod = null;


            for (var i = 0; i < aItems.length; i++) {
                var oContext = aItems[i].getBindingContext();
                if (oContext) {
                    var tempCurrent = oContext.getProperty("CurrentReportingPeriodStart");
                    var tempPrevious = oContext.getProperty("PreviousReportingPeriodStart");


                    if (tempCurrent || tempPrevious) {
                        dCurrentPeriod = tempCurrent;
                        dPreviousPeriod = tempPrevious;
                        break;
                    }
                }
            }


            oLocalModel.setProperty("/currentPeriod", dCurrentPeriod);
            oLocalModel.setProperty("/previousPeriod", dPreviousPeriod);
        },
        onShowHistory: function (oEvent) {
            var oButton = oEvent.getSource();
            var oContext = oButton.getBindingContext();

            if (!oContext) {
                MessageToast.show("No data available");
                return;
            }

            var sProjectElement = oContext.getProperty("ProjectElement");
            var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
            var oModel = this.getView().getModel();
            var that = this;

            var sNavPath = oContext.getPath() + "/to_Cycle";

            this.getView().setBusy(true);

            oModel.read(sNavPath, {
                success: function (oData) {
                    that.getView().setBusy(false);

                    var oHistoryModel = new sap.ui.model.json.JSONModel({
                        results: oData.results
                    });

                    if (that._oHistoryDialog) {
                        that._oHistoryDialog.destroy();
                        that._oHistoryDialog = null;
                    }

                    var oHistoryTable = new Table({
                        columns: [
                            new Column({ header: new Label({ text: oResourceBundle.getText("historyProjectColumn") }) }),
                            new Column({ header: new Label({ text: oResourceBundle.getText("historyWPColumn") }) }),
                            new Column({ header: new Label({ text: oResourceBundle.getText("historyPeriodColumn") }) })
                        ]
                    });

                    oHistoryTable.bindItems({
                        path: "history>/results",
                        template: new ColumnListItem({
                            cells: [
                                new Text({ text: "{history>customerprojectid}" }),
                                new Text({ text: "{history>customerprojectworkpackage}" }),
                                new Text({
                                    text: {
                                        path: "history>reportingperiodstart",
                                        type: new sap.ui.model.type.Date({ pattern: "dd.MM.yyyy" })
                                    }
                                })
                            ]
                        })
                    });

                    that._oHistoryDialog = new Dialog({
                        title: oResourceBundle.getText("historyDialogTitle") + " - " + sProjectElement,
                        contentWidth: "40rem",
                        resizable: true,
                        draggable: true,
                        content: [oHistoryTable],
                        beginButton: new Button({
                            text: oResourceBundle.getText("historyCloseButton"),
                            press: function () {
                                that._oHistoryDialog.close();
                            }
                        }),
                        afterClose: function () {
                            that._oHistoryDialog.destroy();
                            that._oHistoryDialog = null;
                        }
                    });

                    that._oHistoryDialog.setModel(oHistoryModel, "history");
                    that.getView().addDependent(that._oHistoryDialog);
                    that._oHistoryDialog.open();
                },
                error: function () {
                    that.getView().setBusy(false);
                    MessageBox.error(oResourceBundle.getText("saveError"));
                }
            });
        },

        onSearch: function (oEvent) {
            var aFilters = [];
            var sQuery = oEvent.getParameter("newValue");
            var oTable = this.byId("workpackageTable");
            var oBinding = oTable.getBinding("items");


            if (sQuery && sQuery.length > 0) {
                var filterById = new sap.ui.model.Filter("ProjectElement", sap.ui.model.FilterOperator.Contains, sQuery);
                var filterByDesc = new sap.ui.model.Filter("ProjectElementDescription", sap.ui.model.FilterOperator.Contains, sQuery);

                var oCombinedFilter = new sap.ui.model.Filter({
                    filters: [filterById, filterByDesc],
                    and: false
                });
                aFilters.push(oCombinedFilter);
            }



            if (sProjectUUID) {
                var oProjectFilter = new sap.ui.model.Filter("ProjectUUID", sap.ui.model.FilterOperator.EQ, sProjectUUID);

                if (aFilters.length > 0) {
                    var oFinalFilter = new sap.ui.model.Filter({
                        filters: [oProjectFilter, aFilters[0]],
                        and: true
                    });
                    oBinding.filter(oFinalFilter, "Application");
                } else {

                    oBinding.filter([oProjectFilter], "Application");
                }
            } else {

                oBinding.filter(aFilters, "Application");
            }
        }
    });
});