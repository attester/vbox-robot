/*
 * Copyright 2021 Amadeus s.a.s.
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

const { RGBLuminanceSource, BinaryBitmap, HybridBinarizer, QRCodeReader, DecodeHintType } = require("@zxing/library");

const resultRegExp = /^vbox-robot:\/\/(\d+)\/(\d+)$/;

const processResult = (res, extraX, extraY) => {
    const text = res.getText();
    const match = resultRegExp.exec(text);
    if (match) {
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY= -Infinity;
        res.getResultPoints().forEach(function (point) {
            const x = extraX + point.x;
            const y = extraY + point.y;
            if (x < minX) {
                minX = x;
            }
            if (x > maxX) {
                maxX = x;
            }
            if (y < minY) {
                minY = y;
            }
            if (y > maxY) {
                maxY = y;
            }
        });
        minX = Math.floor(minX - 3.5);
        minY = Math.floor(minY - 3.5);
        maxX = Math.floor(maxX + 3.5);
        maxY = Math.floor(maxY + 3.5);
        const x = +match[1];
        const y = +match[2];
        return {
            x: minX - x,
            y: minY - y,
            qrCodeX: Math.floor((minX + maxX)/2),
            qrCodeY: Math.floor((minY + maxY)/2)
        };
    } else {
        throw new Error(`Unexpected QR code containing: ${text}`);
    }
};

module.exports = function (image) {
    const size = image.width * image.height;
    const luminancesUint8Array = new Uint8ClampedArray(size);
    for (let offset = 0; offset < size; offset++) {
        const r = image.data[offset * 4];
        const g = image.data[offset * 4 + 1];
        const b = image.data[offset * 4 + 2];
        luminancesUint8Array[offset] = ((r + g + b) / 3) & 0xFF;
    }
    const luminanceSource = new RGBLuminanceSource(luminancesUint8Array, image.width, image.height);
    const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
    const reader = new QRCodeReader();
    const hints = new Map();
    const possibleResultPoints = [];
    hints.set(DecodeHintType.TRY_HARDER, true);
    hints.set(DecodeHintType.NEED_RESULT_POINT_CALLBACK, {
        foundPossibleResultPoint(point) {
            if (point.estimatedModuleSize === 1) {
                possibleResultPoints.push(point);
            }
        }
    });
    try {
        return processResult(reader.decode(binaryBitmap, hints), 0, 0);
    } catch (error) {
        // the QR code reader may not find any result because it gets confused with the multiple QR codes
        // let's try again after cropping around each result point:
        for (const point of possibleResultPoints) {
            try {
                const x1 = Math.max(0, Math.floor(point.x - 50));
                const y1 = Math.max(0, Math.floor(point.y - 50));
                const x2 = Math.min(image.width, Math.floor(point.x + 50));
                const y2 = Math.min(image.height, Math.floor(point.y + 50));
                return processResult(reader.decode(binaryBitmap.crop(x1, y1, x2 - x1, y2 - y1)), x1, y1);
            } catch (error) {
                // ignore errors
            }
        }
        throw error;
    }
};
