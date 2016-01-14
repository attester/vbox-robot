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

/*global SERVER_URL*/
"use strict";

var callbackFunctions = window.__vboxRobotCallbacks;
if (!callbackFunctions) {
    callbackFunctions = window.__vboxRobotCallbacks = {
        counter: 0
    };
}

module.exports = function (methodName, args, callback) {
    var data = encodeURIComponent(JSON.stringify(args));
    var script = document.createElement("script");
    var id = callbackFunctions.counter;
    callbackFunctions.counter++;
    callbackFunctions[id] = function (result) {
        delete callbackFunctions[id];
        script.parentNode.removeChild(script);
        callback(result);
    };
    script.src = [SERVER_URL, "/", methodName, "?callback=__vboxRobotCallbacks%5B", id, "%5D&data=", data, "&ts=", new Date().getTime()].join("");
    // Note that SERVER_URL is replaced with a string litteral containing the actual url of the server when the server sends the JS file
    (document.head || document.getElementsByTagName("head")[0]).appendChild(script);
};
