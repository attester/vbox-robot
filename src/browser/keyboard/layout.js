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
var keyPress = exports.keyPress = {};
var keyRelease = exports.keyRelease = {};

var setShortCode = function(keyCode, scanCode) {
    keyPress[keyCode] = [scanCode];
    keyRelease[keyCode] = [scanCode | 0x80];
};

var setExtCode = function(keyCode, scanCode) {
    keyPress[keyCode] = [0xe0, scanCode];
    keyRelease[keyCode] = [0xe0, scanCode | 0x80];
};

// cf vboxshell.py
// see also http://www.win.tue.nl/~aeb/linux/kbd/scancodes-1.html

setShortCode(keys.VK_ESCAPE, 0x01);
setShortCode(keys.VK_F1, 0x3b);
setShortCode(keys.VK_F2, 0x3c);
setShortCode(keys.VK_F3, 0x3d);
setShortCode(keys.VK_F4, 0x3e);
setShortCode(keys.VK_F5, 0x3f);
setShortCode(keys.VK_F6, 0x40);
setShortCode(keys.VK_F7, 0x41);
setShortCode(keys.VK_F8, 0x42);
setShortCode(keys.VK_F9, 0x43);
setShortCode(keys.VK_F10, 0x44);
setShortCode(keys.VK_F11, 0x57);
setShortCode(keys.VK_F12, 0x58);

setShortCode(keys.VK_BACK_QUOTE, 0x29);
setShortCode(keys.VK_1, 0x02);
setShortCode(keys.VK_2, 0x03);
setShortCode(keys.VK_3, 0x04);
setShortCode(keys.VK_4, 0x05);
setShortCode(keys.VK_5, 0x06);
setShortCode(keys.VK_6, 0x07);
setShortCode(keys.VK_7, 0x08);
setShortCode(keys.VK_8, 0x09);
setShortCode(keys.VK_9, 0x0a);
setShortCode(keys.VK_0, 0x0b);
setShortCode(keys.VK_UNDERSCORE, 0x0c);
setShortCode(keys.VK_EQUALS, 0x0d);
setShortCode(keys.VK_BACK_SPACE, 0x0e);

setShortCode(keys.VK_TAB, 0x0f);
setShortCode(keys.VK_Q, 0x10);
setShortCode(keys.VK_W, 0x11);
setShortCode(keys.VK_E, 0x12);
setShortCode(keys.VK_R, 0x13);
setShortCode(keys.VK_T, 0x14);
setShortCode(keys.VK_Y, 0x15);
setShortCode(keys.VK_U, 0x16);
setShortCode(keys.VK_I, 0x17);
setShortCode(keys.VK_O, 0x18);
setShortCode(keys.VK_P, 0x19);
setShortCode(keys.VK_BRACELEFT, 0x1a);
setShortCode(keys.VK_BRACERIGHT, 0x1b);
setShortCode(keys.VK_BACK_SLASH, 0x2b);
setShortCode(keys.VK_ENTER, 0x1c);

setShortCode(keys.VK_CAPS_LOCK, 0x3a);
setShortCode(keys.VK_A, 0x1e);
setShortCode(keys.VK_S, 0x1f);
setShortCode(keys.VK_D, 0x20);
setShortCode(keys.VK_F, 0x21);
setShortCode(keys.VK_G, 0x22);
setShortCode(keys.VK_H, 0x23);
setShortCode(keys.VK_J, 0x24);
setShortCode(keys.VK_K, 0x25);
setShortCode(keys.VK_L, 0x26);
setShortCode(keys.VK_SEMICOLON, 0x27);
setShortCode(keys.VK_QUOTE, 0x28);

setShortCode(keys.VK_SHIFT, 0x2a);
setShortCode(keys.VK_Z, 0x2c);
setShortCode(keys.VK_X, 0x2d);
setShortCode(keys.VK_C, 0x2e);
setShortCode(keys.VK_V, 0x2f);
setShortCode(keys.VK_B, 0x30);
setShortCode(keys.VK_N, 0x31);
setShortCode(keys.VK_M, 0x32);
setShortCode(keys.VK_COMMA, 0x33);
setShortCode(keys.VK_PERIOD, 0x34);
setShortCode(keys.VK_SLASH, 0x35);

setShortCode(keys.VK_CONTROL, 0x1d);
setShortCode(keys.VK_ALT, 0x38);
setShortCode(keys.VK_SPACE, 0x39);

setExtCode(keys.VK_INSERT, 0x52);
setExtCode(keys.VK_HOME, 0x47);
setExtCode(keys.VK_PAGE_UP, 0x49);
setExtCode(keys.VK_DELETE, 0x53);
setExtCode(keys.VK_END, 0x4f);
setExtCode(keys.VK_PAGE_DOWN, 0x51);

setExtCode(keys.VK_UP, 0x48);
setExtCode(keys.VK_LEFT, 0x4b);
setExtCode(keys.VK_DOWN, 0x50);
setExtCode(keys.VK_RIGHT, 0x4d);

setShortCode(keys.VK_NUM_LOCK, 0x45);
setShortCode(keys.VK_SCROLL_LOCK, 0x46);
setShortCode(keys.VK_NUMPAD7, 0x47);
setShortCode(keys.VK_NUMPAD8, 0x48);
setShortCode(keys.VK_NUMPAD9, 0x49);
setShortCode(keys.VK_MINUS, 0x4a);
setShortCode(keys.VK_NUMPAD4, 0x4b);
setShortCode(keys.VK_NUMPAD5, 0x4c);
setShortCode(keys.VK_NUMPAD6, 0x4d);
setShortCode(keys.VK_PLUS, 0x4e);
setShortCode(keys.VK_NUMPAD1, 0x4f);
setShortCode(keys.VK_NUMPAD2, 0x50);
setShortCode(keys.VK_NUMPAD3, 0x51);
setShortCode(keys.VK_NUMPAD0, 0x52);
