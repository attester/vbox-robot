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

var QRCode = require("qrcode/lib/core/qrcode");
var Utils = require("qrcode/lib/renderer/utils");
var request = require("./request");

var qrCodePrefix = "vbox-robot://";
var outerMargin = 10;
var innerMargin = 50;

module.exports = function (callback) {
    var div = document.createElement("div");
    div.style.cssText = "display:block;position:absolute;background-color:white;left:0px;top:0px;right:0px;bottom:0px;cursor:none;z-index:999999;";
    document.body.appendChild(div);
    var width = div.offsetWidth;
    var height = div.offsetHeight;
    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.style.cssText = "display:block;position:absolute;left:0px;top:0px;";
    div.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    var y = outerMargin;
    var qrSize = 0;
    var opts = {
        errorCorrectionLevel: "H",
        margin: 0,
        scale: 1
    };
    while (y + qrSize + outerMargin < height) {
        var x = outerMargin;
        while (x + qrSize + outerMargin < width) {
            var qrData = QRCode.create(qrCodePrefix + x + "/" + y, opts);
            qrSize = Utils.getImageWidth(qrData.modules.size, opts);
            var image = ctx.createImageData(qrSize, qrSize);
            Utils.qrToImageData(image.data, qrData, Utils.getOptions(opts));
            ctx.putImageData(image, x, y);
            x += qrSize + innerMargin;
        }
        y += qrSize + innerMargin;
    }

    // wait some time for the browser to display the element
    setTimeout(function () {
        request("calibrate", [], function (response) {
            div.parentNode.removeChild(div);
            if (response.success) {
                var result = response.result;
                response.result = {
                    x : result.x,
                    y : result.y
                };
            }
            callback(response);
        });
    }, 200);
};
