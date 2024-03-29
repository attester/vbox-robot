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

const co = require("co");
const promisify = require("pify");
const writeFile = promisify(require("fs").writeFile);
const PNG = require("pngjs").PNG;
const findViewport = require("./findViewport");
const getVboxDisplay = require("./getVBoxDisplay");

module.exports = co.wrap(function *(task){
    const vboxDisplay = yield getVboxDisplay(task.vboxServer, task.vboxDisplay);
    const resolution = yield vboxDisplay.getScreenResolution(0);
    const screenShot = yield vboxDisplay.takeScreenShotToArray(0, resolution.width, resolution.height, "PNG");
    const image = new PNG();
    const parseImage = promisify(image.parse.bind(image));
    const imageBuffer = Buffer.from(screenShot, "base64");
    yield parseImage(imageBuffer);
    try {
        return findViewport(image);
    } catch (error) {
        const fileName = task.failedCalibrationFileName;
        if (fileName) {
            writeFile(fileName, imageBuffer); // no yield to speed up the response
        }
        throw new Error(`Calibration failed, ${fileName ? `screenshot recorded as ${fileName}` : `screenshot was not saved` }.\n${error}`);
    }
});
