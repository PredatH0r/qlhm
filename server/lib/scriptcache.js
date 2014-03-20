var Script = require("./script");


// Private cache object
var _cache = Object.create(null);


function scriptCache() {}

scriptCache.prototype.get = function(aID, aCreateMissing) {
  aID = parseInt(aID);
  if (isNaN(aID)) return;
  if (aID in _cache) return _cache[aID];
  if (aCreateMissing) return this.set(aID);
}

scriptCache.prototype.set = function(aID, aHeaders, aContent) {
  aID = parseInt(aID);
  if (isNaN(aID)) return false;
  _cache[aID] = new Script(aID, aHeaders, aContent);
  return _cache[aID];
}

scriptCache.prototype.remove = function(aID) {
  aID = parseInt(aID);
  if (isNaN(aID)) return false;
  delete _cache[aID];
  return true;
}

scriptCache.prototype.each = function(aCallback) {
  for (var i in _cache) {
    if (false === aCallback.call(_cache[i], parseInt(i), _cache[i])) break;
  }
}

scriptCache.prototype.filter = function(aCallback) {
  var ret = [];
  for (var i in _cache) {
    if (aCallback.call(_cache[i], parseInt(i), _cache[i])) {
      ret.push(_cache[i]);
    }
  }
  return ret;
}

scriptCache.prototype.map = function(aCallback) {
  var ret = [];
  for (var i in _cache) ret.push(aCallback.call(_cache[i], parseInt(i), _cache[i]));
  return ret;
}


module.exports = new scriptCache();
