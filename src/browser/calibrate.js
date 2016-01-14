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

var request = require("./request");

module.exports = function (callback) {
    var div = document.createElement("div");
    var border = 30;
    div.style.cssText = "display:block;position:absolute;background-color:rgb(255, 0, 0);border:" + border
            + "px solid rgb(100, 100, 100);left:0px;top:0px;right:0px;bottom:0px;cursor:none;z-index:999999;";
    document.body.appendChild(div);
    // wait some time for the browser to display the element
    setTimeout(function () {
        request("calibrate", [div.offsetWidth - 2 * border, div.offsetHeight - 2 * border], function (response) {
            div.parentNode.removeChild(div);
            if (response.success) {
                var result = response.result;
                response.result = {
                    x : result.x - border,
                    y : result.y - border
                };
            }
            callback(response);
        });
    }, 200);
};
