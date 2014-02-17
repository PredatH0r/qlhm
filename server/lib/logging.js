var util = require("util")

  , moment = require("moment")
  ;

// Logging helper that adds a timestamp prefix
exports.logTime = function logTime() {
  console.log("%s %s", moment().format(), util.format.apply(null, arguments));
}
