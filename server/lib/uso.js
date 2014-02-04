var request = require("request")
  , util = require("util")

  , Scriptish_parser = require("./scriptish").Scriptish_parser
  ;

var uso = Object.create(null)
  , meta = {str: "https://userscripts.org/scripts/source/%d.meta.js", reg: /^https?:\/\/userscripts\.org\/scripts\/source\/(\d{1,16})\.meta\.js/}
  , script = {str: "https://userscripts.org/scripts/source/%d.user.js", reg: /^https?:\/\/userscripts\.org\/scripts\/source\/(\d{1,16})\.user\.js/}
  , RE_digits = /^\d{1,16}$/
  , DOLITTLE = function() {}
  ;


/**
 * Return the integer script ID or false
 *
 * NOTE: we know the parseInt result will be okay due to the meta/script regex
 */
uso.parseID = function(aStr) {
  if (aStr) {
    // ID
    if (RE_digits.test(aStr)) return parseInt(aStr);
    // Script URL
    else if (script.reg.test(aStr)) return parseInt(uso.script.exec(aStr)[0]);
    // Meta URL
    else if (meta.reg.test(aStr)) return parseInt(uso.script.exec(aStr)[0]);
  }
  return false;
}


/**
 * Try to retrieve and parse a userscripts.org meta file
 */
uso.getMeta = function(aID, aCallback) {
  aCallback = aCallback ? aCallback : DOLITTLE;
  var url = util.format(meta.str, aID);

  request({url: url, timeout: 10E3}, function(usoError, usoResponse, usoBody) {
    if (usoError) return aCallback(usoError);
    if (200 !== usoResponse.statusCode) return aCallback(usoResponse.statusCode);
    aCallback(null, Scriptish_parser(usoBody));
  });
}

/**
 * Try to retrieve and parse a userscripts.org script file
 */
uso.getScript = function(aID, aCallback) {
  aCallback = aCallback ? aCallback : DOLITTLE;
  var url = util.format(script.str, aID);

  request({url: url, timeout: 10E3}, function(usoError, usoResponse, usoBody) {
    if (usoError) return aCallback(usoError);
    if (200 !== usoResponse.statusCode) return aCallback(usoResponse.statusCode);
    aCallback(null, {headers: Scriptish_parser(usoBody), content: usoBody});
  });
}

// Export "uso" as the module
module.exports = uso;
