// Dependencies
var util = require("util")

  , moment = require("moment")
  , request = require("request")
  , restify = require("restify")

  , Scriptish_parser = require("./lib/scriptish").Scriptish_parser
  ;


// Vars
var uso = {
    meta: {s: "https://userscripts.org/scripts/source/%d.meta.js", r: /^https?:\/\/userscripts\.org\/scripts\/source\/(\d{1,16})\.meta\.js/}
  , script: {s: "https://userscripts.org/scripts/source/%d.user.js", r: /^https?:\/\/userscripts\.org\/scripts\/source\/(\d{1,16})\.user\.js/}
};

var RE_digits = /^\d{1,16}$/;
var err404 = "Invalid or missing options.  '/uso/[id_number]' and '/uso/[full_url_to_.user.js]' are accepted.";

var SCRIPT_CACHE = {};


// Logging helper that adds a timestamp prefix
function logTime() {
  console.log("%s %s", moment().format(), util.format.apply(null, arguments));
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

server.get({path: /^\/uso\/?(.*)?/i, version: "1.0.0"}, function(req, res, next) {
  var scriptID, scriptURL, reqID, reqURL;

  // trailing slugs
  if (req.params[0]) {
    // [id]
    if (RE_digits.test(req.params[0]))
      scriptID = req.params[0];
    // [url]
    else if (uso.script.r.test(req.params[0]))
      scriptURL = req.params[0];
  }
  // nothing...
  else {
    return res.send(404, {error: err404});
  }

  // Try to get request URL and script ID
  if (scriptID) {
    reqURL = util.format(uso.script.s, scriptID);
    reqID = parseInt(scriptID);
  }
  else if (scriptURL) {
    reqURL = scriptURL;
    reqID = parseInt(uso.script.exec(scriptURL)[0]);
  }

  if (reqURL && reqID) {
    // Create a cache entry if needed so we can always set "nextCheck"
    if (!(reqID in SCRIPT_CACHE)) SCRIPT_CACHE[reqID] = {};

    // Send from cache if available and we're not due for a refresh attempt
    if (reqID in SCRIPT_CACHE && SCRIPT_CACHE[reqID].nextCheck && !moment().isAfter(SCRIPT_CACHE[reqID].nextCheck)) {
      if (SCRIPT_CACHE[reqID].body) {
        SCRIPT_CACHE[reqID].body._meta.nextCheckMinutes = SCRIPT_CACHE[reqID].nextCheck.diff(moment(), "minutes");
        res.send(SCRIPT_CACHE[reqID].body);
      }
      else {
        var tryAgainIn = moment.isMoment(SCRIPT_CACHE[reqID].nextCheck) ? util.format("  You can try again %s.", SCRIPT_CACHE[reqID].nextCheck.fromNow()) : ""
          , errMsg = util.format("Previous request for script with ID %d failed.%s", reqID, tryAgainIn)
          ;
        logTime(errMsg);
        res.send(403, { error: errMsg });
      }
    }
    // Otherwise try a request from USO
    else {
      logTime("Performing a new request for script %d (%s)", reqID, reqURL);
      request({url: reqURL, timeout: 10E3}, function(usoError, usoResponse, usoBody) {
        if (404 === usoResponse.statusCode) {
          logTime("404 received for script %d (%s)", reqID, reqURL);
          // Wait 60 minutes if USO said it couldn't be found
          SCRIPT_CACHE[reqID].nextCheck = moment().add("minutes", 60);
          res.send(404, {error: util.format("Script with ID %d was not found", reqID)});
        }
        else if (usoError) {
          logTime("Non-404 error for script %d (%s): %s", reqID, reqURL, usoError);
          // Wait 5 minutes if there was a non-404 error in retrieval
          SCRIPT_CACHE[reqID].nextCheck = moment().add("minutes", 5);
          res.send(404, {error: "Invalid request"});
        }
        else {
          var scriptHeaders = Scriptish_parser(usoBody)
            , scriptName = scriptHeaders.name ? scriptHeaders.name[0] : "unspecified"
            ;
          logTime("Successful response for script %d (\"%s\", %s)", reqID, scriptName, reqURL);

          // Clear the cache entry
          SCRIPT_CACHE[reqID] = {};

          // Good response.  Cache the data and send it along.
          // Wait 30 minutes for the next recache.

          SCRIPT_CACHE[reqID].nextCheck = moment().add("minutes", 30);
          SCRIPT_CACHE[reqID].body = {
              "_meta": {
                  id: reqID
                , lastCheck: Date.now()
                , lastCheckUTC: moment.utc().format()
                , nextCheck: SCRIPT_CACHE[reqID].nextCheck.valueOf()
                , nextCheckUTC: SCRIPT_CACHE[reqID].nextCheck.utc()
                , nextCheckMinutes: SCRIPT_CACHE[reqID].nextCheck.diff(moment(), "minutes")
              }
            , headers: scriptHeaders
            , content: usoBody
          };
          res.send(SCRIPT_CACHE[reqID].body);
        }
      });
    }
  }
  // Missing URL and/or ID
  else {
    return res.send(404, {error: err404});
  }
});

// Static content
// TODO: this regexp is unbelievably bad... replace it
server.get(/^\/((?!(?:uso|versioncheck)).)*$/, restify.serveStatic({
    directory: "./public"
  , default: "index.html"
  , maxAge: 300
}));


// Start listening
server.listen(process.env.PORT || 8080, function() {
  console.log("%s listening at %s", server.name, server.url);
});
