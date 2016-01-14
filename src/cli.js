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
const minimist = require("minimist");
const co = require("co");
const server = require("./server");

const usage = `
Usage:
  vbox-robot [options]

Accepted options:
  --host <hostname>                   Host to bind the web server to.
  --port <port>                       Port to bind the web server to.
  --username <username>               Username to protect the root url (with basic authentication).
  --password <password>               Password to protect the root url (with basic authentication).
  --vboxwebsrv <vboxwebsrv>           URL of the VBoxWebSrv server.
  --vboxusername <username>           Username to connect to the VBoxWebSrv server.
  --vboxpassword <password>           Password to connect to the VBoxWebSrv server.
  --help                              Displays this help message and exits.
  --version                           Displays the version number and exits.

The following options can be used and repeated several times (with a different <id>) to clone and start
some virtual machines right from the beginning:

  --vm.<id>.clone <vmName>            Clone <vmName>, starts it and allows accessing it through the /vm/<id> path.
  --vm.<id>.snapshot <snapshotName>   Specifies the snapshot to use when cloning the virtual machine.
  --vm.<id>.name <cloneName>          Specifies the name of the clone (automatically generated if omitted).

The following options can be used and repeated several times (with a different <id>) to connect to already
running virtual machines right from the beginning:

  --vm.<id>.connect <vmName>          Connect to the already running <vmName>, allowing accessing it through the /vm/<id> path.
`;

const minimistOptions = {
    string: ["host", "port", "username", "password", "vboxwebsrv", "vboxusername", "vboxpassword"],
    boolean: ["help", "version"]
};

module.exports = co.wrap(function * (args) {
    const config = minimist(args, minimistOptions);

    if (config.help) {
        console.log(usage);
        return null;
    }
    delete config.help;

    if (config.version) {
        console.log(require("../package.json").version);
        return null;
    }
    delete config.version;

    const serverRes = yield server(config);

    return serverRes;
});
