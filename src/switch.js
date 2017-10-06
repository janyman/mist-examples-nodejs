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
var owner = "ControlThings";
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
        
        self.chargeTime--;
        node.changed('chargeTime');
        
        if(self.chargeTime === 0) {
            self.chargeEnabled = false;
            node.changed('chargeEnabled'); 
        }
    }, 1000);
        
    node.create(model);

    node.read('chargeEnabled', function(args, peer, cb) { cb(self.chargeEnabled); });
    node.read('chargeTime', function(args, peer, cb) { cb(self.chargeTime); });

    node.read('mist.name', function(args, peer, cb) { cb(name); });
    node.read('mist.ui.url', function(args, peer, cb) { cb(url); });
    node.read('owner', function(args, peer, cb) { cb(owner); });

    node.read('spotCount', function(args, peer, cb) { cb(parkingCount); });
    node.read('spotFree', function(args, peer, cb) { cb(parkingCount - parkingSpots.length); });

    node.read('mist.product.imageUrl', function(args, peer, cb) { cb(imageUrl); });
    node.read('mist.product.description', function(args, peer, cb) { cb(description); });

    node.invoke('vehicle', function (args, peer, cb) {
        cb(vehicle);
    });

    node.invoke('geo', function (args, peer, cb) {
        cb(coordinates);
    });

    node.invoke("directory", function (args, peer, cb) {
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

    node.invoke('geo', function (args, peer, cb) {
        cb({lon: coordinates.lon, lat: coordinates.lat});
    });

    node.invoke('getParkingSpot', function (args, peer, cb) {

        if (parkingCount <= parkingSpots.length) {
            // parking is full
            return cb({err: "We're full", code: 1});
        }

        var reservation = {id: 'p-' + (parkingId++)};
        parkingSpots.push(reservation);
        node.changed('spotFree');
        cb(reservation);
    });

    node.invoke('cancelParkingSpot', function (args, peer, cb) {
        var reservationId = args[0];
        for (var i in parkingSpots) {
            if (parkingSpots[i].id === reservationId) {
                parkingSpots.splice(i, 1);
                node.changed('spotFree');
                return cb(true);
            }
        }
        cb({err: 'Parking not found', code: 2});
    });

    node.write('spotCount', function (value, peer, cb) {
        parkingCount = value;
        node.changed('spotCount');
        node.changed('spotFree');
    });

    node.write('chargeEnabled', function (value, peer, cb) {
        self.chargeEnabled = !!value;
        
        node.changed('chargeEnabled');

        if (!!value) {
            self.chargeTime = 10;
            node.changed('chargeTime');
        }
    });
}


util.inherits(Switch, EventEmitter);

module.exports = {
    Switch: Switch
};
