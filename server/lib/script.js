var moment = require("moment");

function Script(aID, aHeaders, aContent) {
  this.meta = {id: aID};

  this.headers = aHeaders;
  this.content = aContent;

  this.nextCheck = undefined;
}

Script.prototype.isValid = function() {
  return this.headers && this.content;
}

Script.prototype.updateCheckNeeded = function() {
  return !this.nextCheck || moment().isAfter(this.nextCheck);
}

Script.prototype.updateMetaTimes = function(aNextMinutes) {
  this.nextCheck = moment().add("minutes", aNextMinutes);
  if (!this.isValid()) return;
  this.meta.nextCheckMinutes = aNextMinutes;
  this.meta.lastCheck = Date.now();
  this.meta.lastCheckUTC = moment.utc().format();
  this.meta.nextCheck = this.nextCheck.valueOf();
  this.meta.nextCheckUTC = this.nextCheck.utc();
}

Script.prototype.isOlderThan = function(aVersion) {
  var thisVer = parseInt(this.meta["uso:version"])
    , thatVer = parseInt(aVersion)
    ;

  if (isNaN(thisVer)) thisVer = -1;
  if (isNaN(thatVer)) thatVer = -1;

  return !this.isValid() || thisVer < thatVer;
}

Script.prototype.toJSON = function() {
  return {
      "_meta": this.meta // '_meta' is what hook.js expects...
    , headers: this.headers
    , content: this.content
  }
}

Script.prototype.toString = function() {
  return JSON.stringify(this.toJSON());
}

module.exports = Script;
