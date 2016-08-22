/*
 * Copyright 2016 Amadeus s.a.s.
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

const wait = require("../../wait");
const path = require("path");
const child_process = require("child_process");
const co = require("co");
const checkInt = require("../checkInt");
const createId = require("../createId");
const closeVM = require("../vmManageRoutes").closeVM;

const processes = [];
const availableProcesses = [];

const childProcessModulePath = path.join(__dirname, "processMain.js");

const createProcess = function () {
    let curProcess = child_process.fork(childProcessModulePath);
    processes.push(curProcess);
    console.log(`[${curProcess.pid}] New child process created (total child processes: ${processes.length})`);
    let curTaskResolve;
    let curTaskReject;
    const res = {
        executeTask: function (task) {
            return new Promise((resolve, reject) => {
                if (curTaskResolve || curTaskReject) {
                    return reject(new Error("A task is already running in the selected process."));
                }
                curTaskResolve = resolve;
                curTaskReject = reject;
                curProcess.send(task);
            });
        }
    };
    const removeProcess = function() {
        if (!curProcess) {
            return;
        }
        console.log(`[${curProcess.pid}] child process disconnected (remaining child processes: ${processes.length - 1})`);
        curProcess = null;
        let index = processes.indexOf(res);
        if (index > -1) {
            processes.splice(index, 1);
        }
        index = availableProcesses.indexOf(res);
        if (index > -1) {
            availableProcesses.splice(index, 1);
        }
        const reject = curTaskReject;
        curTaskReject = null;
        curTaskResolve = null;
        if (reject) {
            reject(new Error("The task terminated unexpectedly."));
        }
    };
    curProcess.on("exit", removeProcess);
    curProcess.on("disconnect", removeProcess);
    curProcess.on("message", function (response) {
        const resolve = curTaskResolve;
        curTaskResolve = curTaskReject = null;
        if (resolve) {
            resolve(response);
        }
    });
    return res;
};

const executeTask = co.wrap(function *(task) {
    let curProcess = availableProcesses.pop();
    if (!curProcess) {
        curProcess = createProcess();
    }
    const response = yield curProcess.executeTask(task);
    availableProcesses.push(curProcess);
    if (response.success) {
        return response.result;
    } else {
        throw new Error(response.result);
    }
});

module.exports = co.wrap(function *(ctx){
    const config = ctx.application.config;
    const screenshotsFolder = config["failed-calibrations-folder"];
    const vm = ctx.vm;
    const task = {
        expectedWidth: checkInt(ctx.data[0]),
        expectedHeight: checkInt(ctx.data[1]),
        failedCalibrationFileName: screenshotsFolder ? path.join(screenshotsFolder, `${createId()}.png`) : null,
        vboxServer: config.vboxwebsrv,
        vboxDisplay: vm.vboxDisplay.__object
    };

    // resets the mouse:
    vm.mouseButtonsState = 0;
    yield vm.mouseMove(0, 0);
    // wait for the mouse to really be out of the way:
    yield wait(100);
    // execute the calibration in a different process (because processing images blocks the
    // js process, and this could impact other virtual machines managed by this vbox-robot)
    try {
        ctx.body = yield executeTask(task);
    } catch (e) {
        if (vm.closeOnFailedCalibration) {
            yield closeVM(ctx.application, ctx.vmId, vm);
        }
        throw e;
    }
});
