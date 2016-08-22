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
const wait = require("../wait");
const vbox = require("virtualbox-soap");

const ignoreErrors = function (promise, defaultValue) {
    return promise.catch(() => defaultValue);
};

const VM = module.exports = function () {
    this.vboxMachine = null;
    this.vboxSession = null;
    this.vboxConsole = null;
    this.vboxKeyboard = null;
    this.vboxMouse = null;
    this.vboxDisplay = null;
    this.vboxGuest = null;
    this.mouseButtonsState = 0;
    this.closeOnFailedCalibration = false;
};

const dataSize = 64 * 1024;
const appendStreamData = co.wrap(function * (guestProcess, handle, array) {
    const result = yield guestProcess.read(handle, dataSize, 1);
    array.push(new Buffer(result, "base64"));
});

VM.prototype.runProcess = co.wrap(function * (params) {
    const stdOutArray = [];
    const stdErrArray = [];
    const guestSession = yield this.vboxGuest.createSession(params.user, params.password);
    try {
        const waitResult = yield guestSession.waitForArray(["Start"], 0);
        if (waitResult !== "Start") {
            throw new Error("The session was not successfully started.");
        }
        const guestProcess = yield guestSession.processCreate(null, params.commandLine, undefined, ["WaitForStdOut", "WaitForStdErr"], 0);
        let result = yield guestProcess.waitForArray(["Terminate"], 1000);
        while (result !== "Terminate") {
            yield ignoreErrors(appendStreamData(guestProcess, 1, stdOutArray));
            yield ignoreErrors(appendStreamData(guestProcess, 2, stdErrArray));
            result = yield guestProcess.waitForArray(["Terminate"], 1000);
        }
        const exitCode = yield guestProcess.getExitCode();
        return {
            stdout: Buffer.concat(stdOutArray).toString("binary"),
            stderr: Buffer.concat(stdErrArray).toString("binary"),
            exitCode: exitCode
        };
    } finally {
        yield guestSession.close();
    }
});

VM.prototype.fillConsole = co.wrap(function *() {
    const vboxConsole = this.vboxConsole = yield this.vboxSession.getConsole();
    // requests all objects:
    const vboxKeyboard = vboxConsole.getKeyboard();
    const vboxMouse = vboxConsole.getMouse();
    const vboxDisplay = vboxConsole.getDisplay();
    const vboxGuest = vboxConsole.getGuest();
    // then wait for each of them:
    this.vboxKeyboard = yield vboxKeyboard;
    this.vboxMouse = yield vboxMouse;
    this.vboxDisplay = yield vboxDisplay;
    this.vboxGuest = yield vboxGuest;
});

VM.prototype.setParams = co.wrap(function *(params) {
    if (!params) {
        return;
    }
    if (params.closeOnFailedCalibration) {
        this.closeOnFailedCalibration = true;
    }
});

VM.prototype.unlock = co.wrap(function *() {
    const vboxSession = this.vboxSession;
    if (vboxSession) {
        yield vboxSession.unlockMachine();
    }
});

VM.prototype.stop = co.wrap(function * () {
    const vboxGuest = this.vboxGuest;
    if (vboxGuest) {
        // it is important to close all sessions before powering down
        // (it may otherwise block the VM process)
        const guestSessions = yield ignoreErrors(vboxGuest.getSessions(), []);
        for (const session of guestSessions) {
            yield ignoreErrors(session.close());
        }
    }
    const vboxConsole = this.vboxConsole;
    if (vboxConsole) {
        try {
            const powerDownProgress = yield vboxConsole.powerDown();
            yield powerDownProgress.waitForCompletion(-1);
        } catch (e) {
            yield ignoreErrors(this.vboxMachine.launchVMProcess(null, "emergencystop"));
        }
    }
});

VM.prototype.stopAndDelete = co.wrap(function *() {
    yield this.stop();
    const vboxMachine = this.vboxMachine;
    if (vboxMachine) {
        let media;
        let error;
        for (let retries = 5; retries > 0 ; retries--) {
            try {
                media = yield vboxMachine.unregister("DetachAllReturnHardDisksOnly");
                error = null;
                break;
            } catch (e) {
                error = e;
                // retry to unregister the machine only if the failure is due to the machine being locked
                if (e.code !== vbox.VBOX_E_INVALID_OBJECT_STATE) {
                    break;
                }
                yield wait(500);
            }
        }
        if (error) {
            throw error;
        }
        const unregisterProgress = yield vboxMachine.deleteConfig(media);
        yield unregisterProgress.waitForCompletion(-1);
    }
});

VM.prototype.mouseMove = co.wrap(function *(x, y) {
    yield this.vboxMouse.putMouseEventAbsolute(x + 1, y + 1, 0, 0, this.mouseButtonsState);
});

// default close action: unlocking the VM
// note that the close method can be overridden (especially: replaced by stopAndDelete)
VM.prototype.close = VM.prototype.unlock;
