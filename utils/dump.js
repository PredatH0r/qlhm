#!/usr/bin/env node

var fs = require("fs");

var colors = require("colors")
  , program = require("commander")
  , request = require("request")
  ;

program.option("-s, --site <site>", "The site running QLHM", "http://qlhm.phob.net")
       .option("-d, --directory <dir>", "Directory to dump retrieved scripts", "qlhmScripts")
       .parse(process.argv)
       ;

var SERVING = program.site + "/serving"
  , DUMP_DIR = __dirname + "/" + program.directory
  , RE_invalidChars = /[^\w-]/gi
  ;

try { fs.rmdirSync(DUMP_DIR); } catch(e) {}
try { fs.mkdirSync(DUMP_DIR); } catch(e) {}

request(SERVING, function(aErr, aResp, aBody) {
  if (aErr)
    return console.error("Unable to get list of scripts served from %s\n%s".red, SERVING, aErr);

  var scripts = JSON.parse(aBody);
  console.log("%d script IDs were retrieved".green, scripts.length);

  scripts.forEach(function(aScript) {
    var theScript = "script " + aScript.id + " ('" + aScript.name + "')";
    console.log("Requesting %s".grey, theScript);
    request(program.site + "/uso/" + aScript.id + "?dump", function(aErr, aResp, aBody) {
      if (aErr) return console.error("Error retrieving %s\n%s".red, theScript, aErr);
      console.log("Retrieved %s".green, theScript);
      var dest = DUMP_DIR + "/" + aScript.id + "-" + aScript.name.replace(RE_invalidChars, "_") + ".json";
      fs.writeFile(dest, aBody, function(aErr) {
        if (aErr) return console.error("Error writing %s\n%s".red, theScript, aErr);
        console.log("Wrote %s".cyan, theScript);
      });
    });
  });
});
