// ==UserScript==
// @id             qlhmUserscriptList@beham.biz
// @name           Quake Live QLHM Userscript List
// @version        1.0
// @description    Provides a list of known Userscripts to Quake Live Hook Manager
// @namespace      beham.biz
// @homepage       
// @author         PredatH0r
// @include        http://*.quakelive.com/*
// @exclude        http://*.quakelive.com/forum*
// @run-at         document-end
// ==/UserScript==

test = "Horst";
window.foo = "bar";
HOOK_MANAGER.knownUserscripts = [
  111519, // QLRank.com Display
  114449, // Quake Live Stream Notifier
  110327, // Quake Live Escaper
  73076, // Quake Live New Alt Browser
  120117, // QL Gametype Switcher
  186527, // Quake Live left-hand-side Player List Popup
  126719, // Quake Live Extended Stats
  152168, // Quake Live ingame friend commands
  96307 // Linkify Plus for Quake Live
];