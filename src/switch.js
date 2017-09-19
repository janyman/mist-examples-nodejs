var EventEmitter = require('events').EventEmitter;
var MistNode = require('mist-api').MistNode;
var model = require('./model.json');
var parking = require('./parking.json');
var util = require("util");

function Switch(id) {
    var node = new MistNode({name: 'Switch'}); // , coreIp: '127.0.0.1', corePort: 9094

    node.create(model);

    var name = 'Controlthings parking'
    var url = 'http://mist.cto.fi/mist-parking-ui-0.0.2.tgz'

    node.update('mist.name', name);
    node.update('mist.ui.url', url);

    var capacity = 10;
    var owner = "CT"

    node.update("capacity", capacity);
    node.update("owner", owner);

    var vehicle = ["Car"];
    var coordinates = {lon: 25.6809455, lat: 60.404048};

    node.invoke('vehicle', function (args, cb) {
        cb(vehicle);
    });
    node.invoke('geo', function (args, cb) {
        cb(coordinates);
    });

    node.invoke("directory", function (args, cb) {
        if (args === "parking") {
            console.log(parking);
            var obj = JSON.parse(JSON.stringify(parking), function (key, value) {
                if (typeof value === "string" && value.indexOf('mistSource/') !== -1) {
                    console.log(value.split('mistSource/')[1]);
                    console.log(eval(value.split('mistSource/')[1]));
                    return(eval(value.split('mistSource/')[1]));
                } else {
                    return value;
                }
            });
            console.log("obj", obj);
            cb(obj);
        } else {
            var context = model.context["#"];
            cb(Object.keys(context));
        }
    });

    node.invoke('config', function (args, cb) {
        cb({cool: ['a', 7, true], echo: args});
    });

    node.write(function (epid, data) {
        console.log('Node write:', epid, data);
        if (epid === 'state') {
            node.update(epid, !!data);
        }
        if (epid === "capacity") {
            capacity = data;
            node.update(epid, capacity);
        }
    });
}

util.inherits(Switch, EventEmitter);

module.exports = {
    Switch: Switch
};
