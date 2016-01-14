/*
 * Copyright 2015 Amadeus s.a.s.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
"use strict";

var keys = require("./keys");
var layout = require("./layout");
var layoutKeyPress = layout.keyPress;
var layoutKeyRelease = layout.keyRelease;
var mapKeys = {
    "CTRL" : "CONTROL",
    "\t" : "TAB",
    " " : "SPACE",
    "\b" : "BACK_SPACE",
    "\r" : "ENTER",
    "*" : "MULTIPLY",
    "+" : "PLUS",
    "-" : "MINUS",
    "." : "PERIOD",
    "/" : "SLASH",
    ";" : "SEMICOLON",
    ":" : "COLON",
    "=" : "EQUALS",
    "," : "COMMA",
    "`" : "BACK_QUOTE",
    "\\" : "BACK_SLASH",
    "'" : "QUOTE",
    "\"" : "QUOTEDBL",
    "(" : "LEFT_PARENTHESIS",
    ")" : "RIGHT_PARENTHESIS"
};

module.exports = function (text) {
    var result = [];
    if (!text) {
        return result;
    }
    var parts = text.match(/(\[[^\]]+\])|([^\[])/g);
    for (var i = 0, l = parts.length; i < l; i++) {
        var key = parts[i];
        var shift = false;
        var keyPress = true;
        var keyRelease = true;
        if (key.length > 1) {
            // remove '[' and ']', and convert to upper case
            key = key.substr(1, key.length - 2).toUpperCase();
            if (/^<.*>$/.test(key)) {
                // only keyPress
                keyRelease = false;
            } else if (/^>.*<$/.test(key)) {
                // only keyRelease
                keyPress = false;
            }
            if (!(keyPress && keyRelease)) {
                key = key.substr(1, key.length - 2);
            }
            key = key.replace(/-/g, "_"); // replace - by _
        } else {
            // press shift for a upper case character
            shift = (key != key.toLowerCase());
            key = key.toUpperCase();
        }
        var replaceKey = mapKeys[key];
        if (replaceKey != null) {
            key = replaceKey;
        }
        var keyCode = keys["VK_" + key];
        if (keyCode == null || layoutKeyPress[keyCode] == null) {
            throw new Error("Unknown key " + key);
        }
        if (shift) {
            result = result.concat(layoutKeyPress[keys.VK_SHIFT]);
        }
        if (keyPress) {
            result = result.concat(layoutKeyPress[keyCode]);
        }
        if (keyRelease) {
            result = result.concat(layoutKeyRelease[keyCode]);
        }
        if (shift) {
            result = result.concat(layoutKeyRelease[keys.VK_SHIFT]);
        }
    }
    return result;
};
