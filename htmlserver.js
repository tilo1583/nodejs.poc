var http = require('http');
var fs = require('fs');
var path = require('path');
var sys = require('sys');
var events = require("events");
var url = require("url");

var json_emitter = new events.EventEmitter();

function parseCsvFile(fileName, callback) {
    var jsonArray = new Array();
    var jsonIndex = 0;
    var data = ''
    var stream = fs.createReadStream(fileName)
    var iteration = 0, header = [], buffer = ""
    var pattern = /(?:^|,)("(?:[^"]+)*"|[^,]*)/g
    var record = {}
    stream.addListener('data', function (data) {

        buffer += data.toString()
        var parts = buffer.split('\r\n')
        var i = 0
        for (i = 0; i < parts.length; i++) {
            if (i == 0) {
                header = parts[i].split(pattern)
            } else {
                var record = {}
               
                parts[i].split(pattern).forEach(function (value, index) {
                    if (header[index] != '')
                        record[header[index].toLowerCase()] = value.replace(/"/g, '')
                })
                jsonArray[jsonIndex] = JSON.stringify(record) + ",";
                jsonIndex++;
            }
        };

        buffer = parts[parts.length - 1]

        stream.addListener('end', function () {
            var i = 0;
            var data = '[';
            for (i = 0; i < jsonArray.length - 1; i++) {
                data += jsonArray[i];
            }
            var str = jsonArray[jsonArray.length - 1];
            str = str.replace(/,$/g, '');
            data += str + ']'

            json_emitter.emit("servers", data);
        });
    })
}

http.createServer(function (request, response) {
    var uri = url.parse(request.url).pathname;
    var raw = url.parse(request.url, true).query;

    if (uri === "/servers") {
        parseCsvFile('C:/SVN/monitoring_rest_queues/serverconfig.csv');
        var listener = json_emitter.addListener("servers", function (servers) {
            response.writeHead(200, { "Content-Type": "text/json" });
            response.write(servers);
            response.end();

            clearTimeout(timeout);
        });

        var timeout = setTimeout(function () {
            response.writeHead(200, { "Content-Type": "text/plain" });
            response.write(JSON.stringify([]));
            response.end();

            json_emitter.removeListener(listener);
        }, 10000);
    }
    if (uri === "/status") {
        var data = raw ? raw : {};
        data = raw.data ? JSON.parse(raw.data) : data;
        console.log(data.server);
        var options = {
            host: data.server,
            port: '18181',
            path: '/queue'
        };
        var req = http.get(options, function (res2) {
            //console.log("!!!!" + options.host + " " + options.port + " " + options.path + "!!!!");
            var serverqueuesjson = ''
            res2.on('data', function (chunk) {
                serverqueuesjson += chunk
            });

            res2.on('end', function () {
                //console.log("***" + serverqueuesjson);
                var data = JSON.parse(serverqueuesjson);
                response.writeHead(200, { "Content-Type": "text/json" });
                response.write(JSON.stringify(data));
                //console.log("!!!" + serverqueuesjson);
                response.end();
                //res2.end();
            });
        });

    }
    else {
        load_static_file(request, response);
    }

}).listen(8125);

console.log('Server running at http://127.0.0.1:8125/');

function load_static_file(request, response) {
       
    var filePath = 'C:/SVN/monitoring_rest_queues/index.html';
    var extname = path.extname(filePath);
    var contentType = 'text/html';
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
    }
    console.log("$$$$$$"+contentType);
    path.exists(filePath, function (exists) {

        if (exists) {
            fs.readFile(filePath, function (error, content) {
                if (error) {
                    response.writeHead(500);
                    response.end();
                }
                else {
                    response.writeHead(200, { 'Content-Type': "text/html" });
                    response.write(content, 'utf-8');
                    response.end();
                }
            });
        }
        else {
            response.writeHead(404);
            response.end();
        }
    });
}
