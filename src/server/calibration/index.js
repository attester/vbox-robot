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

const path = require("path");
const co = require("co");
const promisify = require("pify");
const writeFile = promisify(require("fs").writeFile);
const PNG = require("pngjs").PNG;
const findRectangle = require("./findRectangle");
const checkInt = require("../checkInt");
const createId = require("../createId");

module.exports = co.wrap(function *(ctx){
    const expectedWidth = checkInt(ctx.data[0]);
    const expectedHeight = checkInt(ctx.data[1]);
    const vm = ctx.vm;
    // resets the mouse:
    vm.mouseButtonsState = 0;
    yield vm.mouseMove(0, 0);
    const resolution = yield vm.vboxDisplay.getScreenResolution(0);
    const screenShot = yield vm.vboxDisplay.takeScreenShotToArray(0, resolution.width, resolution.height, "PNG");
    const image = new PNG();
    const parseImage = promisify(image.parse.bind(image));
    const imageBuffer = new Buffer(screenShot, "base64");
    yield parseImage(imageBuffer);
    const rectangle = findRectangle(image, [255,0,0,255], expectedWidth, expectedHeight, 50);
    if (!rectangle) {
        const screenshotsFolder = ctx.application.config["failed-calibrations-folder"];
        if (screenshotsFolder) {
            const fileName = path.join(screenshotsFolder, `${createId()}.png`);
            writeFile(fileName, imageBuffer); // no yield to speed up the response
            throw new Error(`Calibration failed, screenshot recorded as ${fileName}`);
        } else {
            throw new Error("Calibration failed, screenshot was not saved.");
        }
    }
    ctx.body = {
        x: rectangle.x,
        y: rectangle.y
    };
});
