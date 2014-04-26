#!/usr/bin/env node

var colors = require("colors")
  , fs = require("fs-extra")
  , program = require("commander")
  , request = require("request")
  ;

program.option("-s, --site <site>", "The site running QLHM", "http://qlhm.phob.net")
       .option("-d, --directory <dir>", "Directory to dump retrieved scripts", "qlhmScripts")
       .parse(process.argv)
       ;

var SERVING = program.site + "/serving"
  , USO = program.site + "/uso/{{id}}?dump"
  , DUMP_DIR = __dirname + "/" + program.directory
  , RE_invalidChars = /[^\w-]/gi
  ;

fs.removeSync(DUMP_DIR);
fs.mkdirSync(DUMP_DIR);

request(SERVING, function(aErr, aResp, aBody) {
  if (aErr)
    return console.error("Unable to get list of scripts served from %s\n%s".red, SERVING, aErr);

  var scripts = JSON.parse(aBody);
  console.log("%d script IDs were retrieved".green, scripts.length);

  scripts.forEach(function(aScript) {
    var theScript = "script " + aScript.id + " ('" + aScript.name + "')";
    console.log("Requesting %s".grey, theScript);
    request(USO.replace("{{id}}", aScript.id), function(aErr, aResp, aBody) {
      if (aErr) return console.error("Error retrieving %s\n%s".red, theScript, aErr);
      console.log("Retrieved %s".green, theScript);
      var dest = DUMP_DIR + "/" + aScript.id + "-" + aScript.name.replace(RE_invalidChars, "_") + ".json";
      fs.writeFile(dest, aBody, function(aErr) {
        if (aErr) return console.error("Error writing %s to %s\n%s".red, theScript, dest, aErr);
        console.log("Wrote %s".cyan, theScript);
      });
    });
  });
});
