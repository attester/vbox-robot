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

module.exports = function (image, color, expectedWidth, expectedHeight, colorTolerance) {
    const data = image.data; // concatenation of r,g,b,a values
    const width = image.width;
    const height = image.height;

    const isRightColor = function (x, y) {
        const baseIndex = 4 * (y * width + x);
        const distance = Math.abs(data[baseIndex] - color[0]) + Math.abs(data[baseIndex+1] - color[1]) + Math.abs(data[baseIndex+2] - color[2]) + Math.abs(data[baseIndex+3] - color[3]);
        return distance < colorTolerance;
    };

    const isCorrectX = function (x) {
        return x >= 0 && x < width;
    };

    const isCorrectY = function (y) {
        return y >= 0 && y < height;
    };

    const updateX = function (initValue, y, increment) {
        let value = initValue + increment;
        while (isCorrectX(value) && isRightColor(value, y)) {
            value += increment;
        }
        return value - increment;
    };

    const updateY = function (x, initValue, increment) {
        let value = initValue + increment;
        while (isCorrectY(value) && isRightColor(x, value)) {
            value += increment;
        }
        return value - increment;
    };


    const checkRectangle = function (rectangle) {
        const maxX = rectangle.x + rectangle.width;
        const maxY = rectangle.y + rectangle.height;
        for (let x = rectangle.x; x < maxX; x++) {
            for (let y = rectangle.y; y < maxY; y++) {
                if (!isRightColor(x, y)) {
                    return false;
                }
            }
        }
        return true;
    };

    // this method supposes that the shape is really a rectangle
    const findRectangleFromPosition = function (x, y) {
        if (!isRightColor(x, y)) {
            return null;
        }
        const res = {};
        res.x = updateX(x, y, -1);
        res.y = updateY(x, y, -1);
        res.width = updateX(x, y, 1) + 1 - res.x;
        res.height = updateY(x, y, 1) + 1 - res.y;
        if (res.width != expectedWidth || res.height != expectedHeight || !checkRectangle(res)) {
            return null;
        }
        return res;
    };

    const findRectangle = function() {
        for (let x = expectedWidth - 1; x < width; x += expectedWidth) {
            for (let y = expectedHeight - 1; y < height; y += expectedHeight) {
                const res = findRectangleFromPosition(x, y);
                if (res != null) {
                    return res;
                }
            }
        }
        return null;
    };

    return findRectangle();
};
