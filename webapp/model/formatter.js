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
        },
        /**
         * Formats JSON Date string to dd.MM.yyyy
         */
        dateFromJson: function (date) {
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
        /**
         * Formats boolean to Yes/No
         */
        booleanToYesNo: function (bValue) {
            return bValue ? "Yes" : "No";
        }
    };
});