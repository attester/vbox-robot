# vbox-robot server

This repository contains a tool which starts an HTTP server and accepts
requests to clone and start [Virtual Box](https://www.virtualbox.org/) virtual machines,
to stop and delete them and to run programs in them. It also offers a browser JavaScript API
to control the keyboard and mouse inside the connected virtual machines.

The JavaScript API to control the keyboard and mouse in the virtual machines
is the same as the one provided by the [Selenium Java Robot](https://github.com/attester/selenium-java-robot),
and the [Robot Server](https://github.com/attester/robot-server), but the implementation
is completely different, as it relies on the [Virtual Box API](https://www.virtualbox.org/sdkref/),
which generates keyboard and mouse events at the lowest possible level.

Combined with [attester](https://github.com/attester/attester) and [attester-launcher](https://github.com/attester/attester-launcher),
`vbox-robot` can be used to automate the testing of web applications, and how they react to specific user input.
Especially, it allows to automatically test the compatibility of web applications with screen readers,
even if they modify the behavior of the keyboard at a low level in the operating system.

## Installing this tool

Before installing this tool, please make sure [node.js](http://nodejs.org/) and [npm](https://www.npmjs.org/doc/README.html) are installed on your computer.
[Virtual Box](https://www.virtualbox.org/) can be installed either on the same computer or on a different one.

This tool can then be installed with the following command line:

```
npm install -g vbox-robot
```

## Command line usage

* Make sure `VBoxWebSrv`, from the Virtual Box installation, is running.

For example, on Windows, you can run the following command:

```
"%VBOX_MSI_INSTALL_PATH%\VBoxWebSrv.exe" --authentication null
```

The `--authentication null` option disables authentication for simplicity, but this should
be done with caution. You can explore the options of `VBoxWebSrv` with the `--help` option.

* Now that `VBoxWebSrv` is running, it is possible to execute the `vbox-robot` command:

```
vbox-robot --username toto --password secret
```

This command opens a web server on port 7778 (by default).

The `--username` and `--password` options allow to specify a user name and password to protect the root url of
the web server with basic authentication. Other URLs of the HTTP API are not protected with basic authentication,
but they contain an id in the URL which cannot be easily guessed.

`vbox-robot` connects by default to the `VBoxWebSrv` process running on the same machine with the default port,
but the `--vboxwebsrv` option allows to connect to a different URL.

You can see the list of accepted options with:

```
vbox-robot --help
```

## HTTP API

### Connecting to an already running virtual machine

Command:

```
curl -X POST 'http://toto:secret@localhost:7778/' -d '{"connect":"MyMachineName"}'
```

Sample return value:

```json
{
    "robotjs" : "http://localhost:7778/vm/1-1452787263159-d0cd6cf022b981c1/robot.js",
    "run" : "http://localhost:7778/vm/1-1452787263159-d0cd6cf022b981c1/run",
    "close" : "http://localhost:7778/vm/1-1452787263159-d0cd6cf022b981c1/close"
}
```

The returned JSON object contains URLs which can be used to further interact with the virtual machine.

### Cloning and starting a virtual machine

Command:

```
curl -X POST 'http://toto:secret@localhost:7778/' -d '{"clone":"MyMachineName", "snapshot": "MySnapshotName"}'
```

Sample return value:

```json
{
    "robotjs" : "http://localhost:7778/vm/2-1452787433599-d6972233187fb4e9/robot.js",
    "run" : "http://localhost:7778/vm/2-1452787433599-d6972233187fb4e9/run",
    "close" : "http://localhost:7778/vm/2-1452787433599-d6972233187fb4e9/close"
}
```

The returned JSON object contains URLs which can be used to further interact with the virtual machine.

### Running a command inside a virtual machine

Command:

```
curl -X POST 'http://localhost:7778/vm/2-1452787433599-d6972233187fb4e9/run' -d '{"commandLine": ["c:\\windows\\system32\\ping.exe", "-n", "1", "www.google.fr"], "user": "IEUser", "password": "Passw0rd!"}'
```

Sample return value:

```json
{
    "stdout" : "\r\nPinging www.google.fr [173.194.40.111] with 32 bytes of data:\r\nReply from 173.194.40.111: bytes=32 time=18ms TTL=54\r\n\r\nPing statistics for 173.194.40.111:\r\n    Packets: Sent = 1, Received = 1, Lost = 0 (0% loss),\r\nApproximate round trip times in milli-seconds:\r\n    Minimum = 18ms, Maximum = 18ms, Average = 18ms\r\n",
    "stderr" : "",
    "exitCode" : 0
}
```

### Closing a virtual machine

Command:

```
curl -X POST 'http://localhost:7778/vm/2-1452787433599-d6972233187fb4e9/close'
```

* If the machine was already running when `vbox-robot` connected to it, this command will only disconnect `vbox-robot` from it.

* If the machine was cloned and started by `vbox-robot`, this command will stop and delete it.

## JavaScript API

Once *vbox-robot* is loaded, and it is connected to a virtual machine, it is possible to use its API from a web page by
including a script tag similar to the following one (the exact url is returned in the `robotjs` field of the action which
connected *vbox-robot* to the corresponding virtual machine):

```html
<script src="http://localhost:7778/vm/2-1452787433599-d6972233187fb4e9/robot.js"></script>
```

The script tag creates a JavaScript global object called `SeleniumJavaRobot`.
(This name is used for compatibility with the [Selenium Java Robot](https://github.com/attester/selenium-java-robot))
This object contains some methods which can be called to simulate keyboard and mouse events in the corresponding virtual machine.

If you remove `/robot.js` at the end of the URL, you get the URL of a page where you can play with the different commands of
the JavaScript API.

### Callback

Each method on the `SeleniumJavaRobot` object accepts a callback as its last parameter, to be notified when
the corresponding operation is done. When the callback is provided (which is optional), it is expected to
be either a simple function, or an object with the following structure:

```js
{
   fn: function (response, args) { /* ... */ }, // function to be called when the operation is done.
   scope: window, // object to be available as this in the callback function
   args: { /* something */ } // second argument passed to the callback function
}
```

Here is the structure of the `response` object passed in the callback as the first argument:

```js
{
   success: true, // true if there was no problem during the execution of the method, false otherwise
   result: null // if success is true, this is the result of the method (currently only relevant for getOffset)
   // if success is false, result contains a string with the error message
}
```

### List of methods

You can find in this section the description of the methods available on the `SeleniumJavaRobot` object.

* `getOffset (callback: Callback)`

This method triggers a calibration of the robot and then returns the coordinates of the top left corner of
the viewport in the screen, as detected during the calibration phase.

```js
SeleniumJavaRobot.getOffset({
   fn: function (response) {
      if (response.success) {
         var coordinates = response.result;
         alert("The coordinates of the viewport in the screen are: " + coordinates.x + "," + coordinates.y);
      }
   }
})
```

* `mouseMove (x: Number, y: Number, callback: Callback)`

Instantly moves the mouse to the specified `x`, `y` screen coordinates.

* `smoothMouseMove (fromX: Number, fromY: Number, toX: Number, toY: Number, duration: Number, callback: Callback)`

Instantly moves the mouse to the specified `fromX`, `fromY` screen coordinates, then smoothly moves the mouse
from there to the `toX`, `toY` screen coordinates. The duration of the move must be expressed in milliseconds.

* `mousePress (buttons: Number, callback: Callback)`

Presses one or more mouse buttons. The mouse buttons should be released using the mouseRelease method.
The `buttons` parameter can be a combination (with the logical OR operator `a | b`) of one or more of the following flags:

```js
var BUTTON1_MASK = 16;
var BUTTON2_MASK = 8;
var BUTTON3_MASK = 4;
```

For example, to press both the button 1 and button 2 of the mouse at the same time, call:

```js
SeleniumJavaRobot.mousePress(16 | 8);
```

* `mouseRelease (buttons: Number, callback: Callback)`

Releases one or more mouse buttons.

* `mouseWheel (amount: Number, callback: Callback)`

Rotates the scroll wheel on wheel-equipped mice.

The `amount` parameter is the number of "notches" to move the mouse wheel Negative values indicate movement up/away from the user,
positive values indicate movement down/towards the user.

* `keyPress (keyCode: Number, callback: Callback)`

Presses a given key. The key should be released using the keyRelease method.
Valid key codes are the constants starting with `VK_` as listed in
[this Java documentation](http://docs.oracle.com/javase/6/docs/api/constant-values.html#java.awt.event.KeyEvent.VK_0).

* `keyRelease (keyCode: Number, callback: Callback)`

Releases a given key.

* `type (text: String, callback: String)`

Send multiple keys, as specified in the given text, one after the other.
Note that this last method is not present in the API of the [Selenium Java Robot](https://github.com/attester/selenium-java-robot),
and the [Robot Server](https://github.com/attester/robot-server).

## License

[Apache License 2.0](LICENSE)
