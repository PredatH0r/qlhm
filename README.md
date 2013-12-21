# Quake Live Hook Manager (QLHM)


## What QLHM is

* A client-side `hook.js` file used to allow many [userscripts](http://userscripts.org) to run in the standalone [QUAKE LIVE](http://www.quakelive.com) client
* A server-side [node.js](http://nodejs.org) application which provides a JSONP interface to manage (i.e. retrieve, cache, check for updates) scripts from [userscripts.org](http://userscripts.org)

**NOTE:** The vast majority of users will only need the `hook.js` script.  Refer to the "Installation" section.


## What QLHM is not

* A perfect replacement for a proper userscript engine (e.g. Scriptish, Greasemonkey)


## TODO

* [A lot](https://github.com/supahgreg/qlhm/issues)... this is a very early release, so expect major
issues and breaking changes.


## Want to contribute/help/say thanks?

* Subscribe to QUAKE LIVE if you're able.  The `hook.js` script gets loaded thanks to those guys.
* Good pull requests are welcome.  There is a lot to be done and rewritten.
* [Report a bug](https://github.com/supahgreg/qlhm/issues), but check if it has already been reported.
* Help others work through the many issues that are bound to occur using QLHM.


## How to use

1. Follow the "client" installation instructions below
2. Open the QUAKE LIVE standalone client
3. Click on the QLHM "HOOK" menu (to the lower-left of the QUAKE LIVE logo)
4. Under the "New" section enter the [userscripts.org](http://userscripts.org) script ID (the number in the URL)
or a comma-delimited list of script IDs and click "Save".

**TIP:** To install [QLRanks.com Display](https://userscripts.org/scripts/show/111519) (111519),
[Quake Live Stream Notifier](https://userscripts.org/scripts/show/114449) (114449),
and [Quake Live New Alt Browser](https://userscripts.org/scripts/show/73076) (73076) in one go simply
enter "111519,114449,73076" and click "Save".  Note that "Quake Live New Alt Browser" has not been made
compatible yet.

**NOTE:** The server-side app is running on wn's server.  If you'd prefer to run your own, feel free
to modify `config.BASE_URL` in "hook.js".


## Installation

### Client

1. [Locate your Quake Live config directory](http://lmgtfy.com/?q=quake+live+config+location)
2. Save [`hook.js`](https://raw.github.com/supahgreg/qlhm/master/client/hook.js) there

### Server

1. `git clone https://github.com/supahgreg/qlhm.git`
2. `cd server`
3. `npm install -d`
4. `node app`


## Userscript Developers

You'll either need to add a full URL to your work-in-progress script to the `config.manual` array
(within "hook.js") or come up with a creative alternative.

If you'd like, list your QUAKE LIVE script [on the wiki](https://github.com/supahgreg/qlhm/wiki).