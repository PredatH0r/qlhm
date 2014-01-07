// Dependencies
var util = require("util")

  , moment = require("moment")
  , restify = require("restify")

  , Scriptish_parser = require("./lib/scriptish").Scriptish_parser
  , uso = require("./lib/uso")
  ;


// Vars
var SCRIPT_CACHE = {};


// Logging helper that adds a timestamp prefix
function logTime() {
  console.log("%s %s", moment().format(), util.format.apply(null, arguments));
}


// Helper to update caching times for a script
function updateMetaTimes(aScript, aNextMinutes) {
  aScript.nextCheck = moment().add("minutes", aNextMinutes);
  if (!aScript.body) return;
  aScript.body._meta.nextCheckMinutes = aNextMinutes;
  aScript.body._meta.lastCheck = Date.now();
  aScript.body._meta.lastCheckUTC = moment.utc().format();
  aScript.body._meta.nextCheck = aScript.nextCheck.valueOf();
  aScript.body._meta.nextCheckUTC = aScript.nextCheck.utc();
}

// The latest "hook.js" version
var LATEST_CLIENT_VERSION = 0.2
  , LATEST_CLIENT_DOWNLOAD_URL = "https://github.com/supahgreg/qlhm/wiki/Version-History"
  ;


// Create the server
var server = restify.createServer();


// Middleware
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.jsonp());
server.use(restify.gzipResponse());

server.use(function(req, res, next) {
  logTime("%s %s %s", req.headers["x-forwarded-for"] || req.connection.remoteAddress, req.method, req.url);
  next();
});


// Routes
server.get({path: "/versioncheck", version: "1.0.0"}, function(req, res, next) {
  var clientVer = parseFloat(req.params.currentVersion);
  if (isNaN(clientVer) || clientVer == LATEST_CLIENT_VERSION) {
    return res.send({});
  }
  res.send({"new": {version: LATEST_CLIENT_VERSION, url: LATEST_CLIENT_DOWNLOAD_URL}});
});

server.get({path: "/serving", version: "1.0.0"}, function(req, res, next) {
  var scripts = [];
  for (var id in SCRIPT_CACHE) {
    scripts.push({
        id: parseInt(id)
      , name: (SCRIPT_CACHE[id].body ? (SCRIPT_CACHE[id].body.headers.name+"") : "not provided")
    });
  }
  scripts.sort(function(a, b) {
    a = a.name.toLowerCase(), b = b.name.toLowerCase();
    return (a < b ? -1 : a > b ? 1 : 0);
  });
  res.send(scripts);
});

server.get({path: /^\/uso\/?(.*)?/i, version: "1.0.0"}, function(req, res, next) {
  var scriptID = uso.parseID(req.params[0]);
  if (!scriptID) return res.send(404, {error: "Invalid or missing options.  '/uso/[id_number]' and '/uso/[full_url_to_.user.js]' are accepted."});

  // Create a cache entry if needed so we can always set "nextCheck"
  if (!(scriptID in SCRIPT_CACHE)) SCRIPT_CACHE[scriptID] = {};

  // Send from cache if available and we're not due for a refresh attempt
  if (scriptID in SCRIPT_CACHE && SCRIPT_CACHE[scriptID].nextCheck && !moment().isAfter(SCRIPT_CACHE[scriptID].nextCheck)) {
    if (SCRIPT_CACHE[scriptID].body) {
      // Only update the decreasing number of minutes
      SCRIPT_CACHE[scriptID].body._meta.nextCheckMinutes = SCRIPT_CACHE[scriptID].nextCheck.diff(moment(), "minutes");
      res.send(SCRIPT_CACHE[scriptID].body);
    }
    else {
      var tryAgainIn = moment.isMoment(SCRIPT_CACHE[scriptID].nextCheck) ? util.format("  You can try again %s.", SCRIPT_CACHE[scriptID].nextCheck.fromNow()) : ""
        , errMsg = util.format("Previous request for script with ID %d failed.%s", scriptID, tryAgainIn)
        ;
      logTime(errMsg);
      res.send(403, { error: errMsg });
    }
  }
  // Otherwise try a request from USO
  else {
    logTime("Performing a new metadata request for script %d", scriptID);

    uso.getMeta(scriptID, function(aError, aHeaders) {
      if (404 === aError) {
        logTime("404 received for script metadata %d", scriptID);
        // Wait 60 minutes if USO said the metadata couldn't be found
        updateMetaTimes(SCRIPT_CACHE[scriptID], 60);
        return res.send(404, {error: util.format("Metadata for script with ID %d was not found", scriptID)});
      }
      else if (aError) {
        logTime("Non-404 error for script metadata %d: %s", scriptID, aError);
        // Wait 5 minutes if there was a non-404 error in retrieval
        updateMetaTimes(SCRIPT_CACHE[scriptID], 5);

        // Send the previous body if available
        if (SCRIPT_CACHE[scriptID].body) return res.send(SCRIPT_CACHE[scriptID].body);
        return res.send(404, {error: "Invalid metadata request"});
      }

      // Successful metadata retrieval... check if script is cached, and if metadata version is different
      var scriptName = aHeaders.name ? aHeaders.name[0] : "unspecified";
      logTime("Successful metadata retrieval for script %d (\"%s\")", scriptID, scriptName);

      if (!SCRIPT_CACHE[scriptID].body
          || SCRIPT_CACHE[scriptID].body._meta["uso:version"] !== aHeaders["uso:version"][0]) {
        if (!SCRIPT_CACHE[scriptID].body) {
          logTime("Script %d (\"%s\") is not cached.  Requesting full script (\"uso:version\" %d)...",
              scriptID, scriptName, aHeaders["uso:version"]);
        }
        else {
          logTime("New version detected for script %d (\"%s\", old: \"%s\", new: \"%s\").  Requesting full script...",
              scriptID, scriptName, SCRIPT_CACHE[scriptID].body._meta["uso:version"], aHeaders["uso:version"]);
        }

        // Attempt a full update
        uso.getScript(scriptID, function(aError, aResult) {
          if (404 === aError) {
            logTime("404 received for script %d", scriptID);
            // Wait 60 minutes if USO said the script couldn't be found
            updateMetaTimes(SCRIPT_CACHE[scriptID], 60);
            return res.send(404, {error: util.format("Script with ID %d was not found", scriptID)});
          }
          else if (aError) {
            logTime("Non-404 error for script %d: %s", scriptID, aError);
            // Wait 5 minutes if there was a non-404 error in retrieval
            updateMetaTimes(SCRIPT_CACHE[scriptID], 5);
            // Send the previous body if available
            if (SCRIPT_CACHE[scriptID].body) return res.send(SCRIPT_CACHE[scriptID].body);
            return res.send(404, {error: "Invalid script request"});
          }

          // Successful new script retrieval... update the cache and send it along
          logTime("Successful response for script %d (\"%s\")", scriptID, scriptName);

          // Clear the cache entry
          SCRIPT_CACHE[scriptID] = {};

          // Good response.  Cache the data and send it along.
          SCRIPT_CACHE[scriptID].body = {
              "_meta": { id: scriptID }
            , headers: aResult.headers
            , content: aResult.content
          };

          // Add useful metadata headers starting with "uso:"
          for (var i in aHeaders) {
            if (0 === i.indexOf("uso:")) SCRIPT_CACHE[scriptID].body._meta[i] = aHeaders[i][0];
          }

          // Wait 30 minutes for the next recache.
          updateMetaTimes(SCRIPT_CACHE[scriptID], 30);

          res.send(SCRIPT_CACHE[scriptID].body);
        });
      }
      // Cached script is still okay... update times and send it along
      else {
        logTime("The cached version of script %d (\"%s\", \"uso:version\": %d) is the latest available.",
            scriptID, scriptName, aHeaders["uso:version"][0]);
        // Wait 30 minutes for the next recache.
        updateMetaTimes(SCRIPT_CACHE[scriptID], 30);
        res.send(SCRIPT_CACHE[scriptID].body);
      }
    });
  }
});

// Static content
// TODO: this regexp is unbelievably bad... replace it
server.get(/^\/((?!(?:serving|uso|versioncheck)).)*$/, restify.serveStatic({
    directory: "./public"
  , default: "index.html"
  , maxAge: 300
}));


// Start listening
server.listen(process.env.PORT || 8080, function() {
  console.log("%s listening at %s", server.name, server.url);
});
