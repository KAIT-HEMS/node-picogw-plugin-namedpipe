**node-picogw-plugin-namedpipe** is a sample plugin module for [PicoGW](https://github.com/KAIT-HEMS/node-picogw), a [Home Automation](https://en.wikipedia.org/wiki/Home_automation) and [Building Automation](https://en.wikipedia.org/wiki/Building_automation) devices gateway server, developed by [Kanagawa Institute of Technology, Smart House Research Center](http://sh-center.org/en/), released under [MIT license](https://opensource.org/licenses/mit-license.php).

### Plugin API

Named pipe can be used as a transport of PicoGW API. It is convenient to access PicoGW's functionality within a single machine. To use this API, please first make two named piped files (by the **mkfifo** command), which must have the unique prefix with two kinds of postfices (_r and _w). For example :

```bash
$ mkfifo np_r np_w
```
will create a pair of named pipes. *np* in the example above can be an arbitrary vaild string.
Then, PicoGW must be launched with **--pipe** option supplied with unique prefix:
```bash
$ node main.js --pipe np
```
In this mode, PicoGW will halt until the client that accesses the named pipe is connected. The client must open *_r* file with read only mode, while *_w* with write mode.

The API call should be written to *_w* file as a string followed by a newline "\n". The string is a stringified JSON object such as:

```
{"method":"GET","path":"/v1/echonet/airconditioner_1/operatingstate/","tid":"RANDOM_STR"}
```
**tid** is the transaction id of the request, which is used to match request and reply (multiple request causes unordered reply.)  
To set a new value:
```
{"method":"PUT","path":"/v1/echonet/airconditioner_1/operatingstate/","args":{"value":["0x30"]},"tid":"RANDOM_STR"}
```
For PUT case, **args** key is necessary.
Make sure that this request itself must not contain a newline "\n".

The API result can be obtained from reading the *_r* file.