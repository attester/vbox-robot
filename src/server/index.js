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

const Koa = require("koa");
const co = require("co");
const vbox = require("virtualbox-soap");
const robotRoutes = require("./robotRoutes");
const vmManageRoutes = require("./vmManageRoutes");
const createId = require("./createId");

const appClearKeepAlive = function (application) {
    const keepAliveTimeout = application.keepAliveTimeout;
    if (keepAliveTimeout) {
        clearTimeout(keepAliveTimeout);
    }
};

const appClose = co.wrap(function * (application) {
    const httpServer = application.httpServer;
    if (httpServer) {
        console.log("Shutting down the http server...");
        application.httpServer = null;
        yield new Promise(function (resolve) {
            httpServer.close(resolve);
        });
        console.log("http server is closed");
    }

    const vms = application.vms;
    yield Promise.all(Object.keys(vms).map(vmName => vms[vmName].close()));

    const vboxObject = application.vboxObject;
    if (vboxObject) {
        appClearKeepAlive(application);
        application.vboxObject = null;
        console.log("Logging off from the Virtual Box server");
        yield application.vboxClient.logoff(vboxObject);
        console.log("Disconnected from the Virtual Box server");
    }
});

const appKeepAlive = co.wrap(function * (application) {
    appClearKeepAlive(application);
    yield application.vboxObject.getVersion();
    appClearKeepAlive(application);
    application.keepAliveTimeout = setTimeout(application.actions.keepAlive, 90000); // 1 min 30s
});

const appVirtualBoxConnect = co.wrap(function * (application) {
    const config = application.config;
    const vboxClient = application.vboxClient = yield vbox(config.vboxwebsrv);
    console.log("Connecting to Virtual Box server...");
    application.vboxObject = yield vboxClient.logon({
        username: config.vboxusername,
        password: config.vboxpassword
    });
    console.log("Connected.");
});

const appListen = function (application) {
    return new Promise(function (resolve, reject) {
        const config = application.config;
        const httpServer = application.koaApp.listen(config.port || 7778, config.host, function () {
            const address = httpServer.address();
            console.log(`Listening on http://${address.family == "IPv6" ? `[${address.address}]` : address.address}:${address.port}`);
            application.httpServer = httpServer;
            resolve();
        });
        httpServer.timeout = 0; // so that sockets are not closed automatically
        httpServer.on("error", reject);
    });
};

const initialVMs = co.wrap(function * (application) {
    const vmConfigurations = application.config.vm || {};
    const vms = application.vms;
    const vmNames = Object.keys(vmConfigurations);

    yield Promise.all(vmNames.map(co.wrap(function * (vmName) {
        const vmConfig = vmConfigurations[vmName];
        if (vmConfig.clone) {
            console.log(`/vm/${vmName}/clone ${vmConfig.clone} (${vmConfig.snapshot || "snapshot not specified"}) ${vmConfig.name || ""}`);
            vms[vmName] = yield vmManageRoutes.cloneAndRunVM(application, vmConfig.clone, vmConfig.name || createId(), vmConfig.snapshot);
        } else if (vmConfig.connect) {
            console.log(`/vm/${vmName}/connect ${vmConfig.connect}`);
            vms[vmName] = yield vmManageRoutes.addRunningVM(application, vmConfig.connect);
        }
    })));
});

module.exports = co.wrap(function * (config) {
    const application = {
        config: config,
        vboxClient: null,
        vboxObject: null,
        koaApp: null,
        httpServer: null,
        vms: Object.create(null),
        keepAliveTimeout: null,

        actions: null
    };
    application.actions = {
        close: appClose.bind(null, application),
        keepAlive: appKeepAlive.bind(null, application)
    };

    try {
        yield appVirtualBoxConnect(application);
        yield application.actions.keepAlive();

        const koaApp = application.koaApp = new Koa();

        koaApp.use(function(ctx, next) {
            ctx.application = application;
            return next();
        });
        koaApp.use(robotRoutes().routes());
        koaApp.use(vmManageRoutes().routes());

        yield appListen(application);
        yield initialVMs(application);
    } catch (e) {
        yield application.actions.close();
        throw e;
    }

    return application;
});
