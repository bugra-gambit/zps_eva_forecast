sap.ui.define([], function () {
    "use strict";
    return {
        /**
         * Formats the last cycle text shown in the table's cell.
         * @param {int} prevProgress
         * @param {int} prevDays
         * @returns {string} Combined text
         */
        lastCycleText: function (prevProgress, prevDays) {
            if (prevProgress === undefined || prevDays === undefined) {
                return "";
            }
            return "Progress: " + prevProgress + " %, Rem. days: " + prevDays + " WD";
        },

        /**
         * Combine a budget value with its currency code.
         */
        budgetText: function (amount, currency) {
            if (amount === undefined || amount === null) {
                return "";
            }
            var text = amount;
            if (currency) {
                text += " " + currency;
            }
            return text;
        }
    };
});