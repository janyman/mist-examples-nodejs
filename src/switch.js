var EventEmitter = require('events').EventEmitter;
var MistNode = require('mist-api').MistNode;
var model = require('./model.json');
var parking = require('./parking.json');
var util = require("util");

var name = process.env.NAME || 'Controlthings parking';
var lon = parseFloat(process.env.LON) || 25.6809455;
var lat = parseFloat(process.env.LAT) || 60.404048;

if (!process.env.NAME) {
    console.log('Use: NAME="Switch Label" to run several instances.');
}

var parkingSpots = [];
var parkingCount = 10;
var parkingId = 1;
var owner = "Controlthings";
var vehicle = ["Car"];
var coordinates = {lon: lon, lat: lat};

var imageUrl =  'https://mist.controlthings.fi/parking.bmp';
var description = "";

function Switch(id) {
    var url = 'http://mist.cto.fi/mist-parking-ui-0.0.2.tgz'

    var self = this;
    var node = new MistNode({ name: name }); // , coreIp: '127.0.0.1', corePort: 9094
    
    this.chargeEnabled = false;
    this.chargeTime = 10;
    
    setInterval(function() {
        if (self.chargeTime <= 0 || !self.chargeEnabled) { return; }
        node.update('chargeTime', --self.chargeTime);
        if(self.chargeTime === 0) { node.update('chargeEnabled', false); }
    }, 1000);
        
    node.create(model);

    node.update('mist.name', name);
    node.update('mist.ui.url', url);
    node.update("owner", owner);

    node.update('spotCount', parkingCount);
    node.update('spotFree', parkingCount - parkingSpots.length);

  node.update('mist.product.imageUrl', imageUrl);
    node.update('mist.product.description', description);

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

    node.invoke('geo', function (args, cb) {
        cb({lon: coordinates.lon, lat: coordinates.lat});
    });

    node.invoke('getParkingSpot', function (args, cb) {

        if (parkingCount <= parkingSpots.length) {
            // parking is full
            return cb({err: "We're full", code: 1});
        }

        var reservation = {id: 'p-' + (parkingId++)};
        parkingSpots.push(reservation);
        node.update('spotFree', parkingCount - parkingSpots.length);
        cb(reservation);
    });

    node.invoke('cancelParkingSpot', function (args, cb) {
        var reservationId = args[0];
        for (var i in parkingSpots) {
            if (parkingSpots[i].id === reservationId) {
                parkingSpots.splice(i, 1);
                node.update('spotFree', parkingCount - parkingSpots.length);
                return cb(true);
            }
        }
        cb({err: 'Parking not found', code: 2});
    });

    node.write(function (epid, data) {
        console.log('Node write:', epid, data);
        if (epid === "spotCount") {
            parkingCount = data;
            node.update(epid, parkingCount);
            return;
        }

        node.update(epid, data);
        
        if (epid === 'chargeEnabled') {
            
            self.chargeEnabled = !!data;

            if (!!data) {
                self.chargeTime = 10;
                node.update('chargeTime', self.chargeTime);
            }
        }
    });
}


util.inherits(Switch, EventEmitter);

module.exports = {
    Switch: Switch
};
