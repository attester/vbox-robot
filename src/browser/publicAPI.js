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

var normalizeCallback = require("./normalizeCallback");
var request = require("./request");
var calibrate = require("./calibrate");
var keyboardLayout = require("./keyboard/layout");
var stringToScancodes = require("./keyboard/stringToScancodes");

var slice = Array.prototype.slice;
var createFunction = function (name, argsNumber) {
    exports[name] = function () {
        request(name, slice.call(arguments, 0, argsNumber), normalizeCallback(arguments[argsNumber]));
    };
};

createFunction("mouseMove", 2);
createFunction("smoothMouseMove", 5);
createFunction("mousePress", 1);
createFunction("mouseRelease", 1);
createFunction("mouseWheel", 1);
createFunction("calibrate", 2);
createFunction("keyboardSendScancodes", 1);

exports.getOffset = function (callback) {
    calibrate(normalizeCallback(callback));
};

var sendError = function (callback, error) {
    setTimeout(function () {
        callback({
            success: false,
            result: error
        });
    }, 1);
};

var createKeyEventFunction = function (eventName) {
    var curLayout = keyboardLayout[eventName];
    exports[eventName] = function (keyCode, callback) {
        callback = normalizeCallback(callback);
        var scancodes = curLayout[keyCode];
        if (scancodes) {
            request("keyboardSendScancodes", [scancodes], callback);
        } else {
            sendError(callback, "Unknown key code: " + keyCode);
        }
    };
};

createKeyEventFunction("keyPress");
createKeyEventFunction("keyRelease");

exports.type = function (text, callback) {
    callback = normalizeCallback(callback);
    try {
        var scancodes = stringToScancodes(text);
        request("keyboardSendScancodes", [scancodes], callback);
    } catch (error) {
        sendError(callback, error + "");
    }
};
