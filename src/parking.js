var EventEmitter = require('events').EventEmitter;
var MistNode = require('mist-api').MistNode;
var model = require('./model.json');
var util = require("util");

var name = process.env.NAME || 'ControlThings parking';
var lon = parseFloat(process.env.LON) || 25.6809455;
var lat = parseFloat(process.env.LAT) || 60.404048;

if (!process.env.NAME) {
    console.log('Use: NAME="MY Parking Ltd. 2" to run several instances.');
}

var parkingSpots = [];
var parkingCount = 10;
var parkingId = 1;
var owner = "ControlThings";
var vehicle = ["Car"];
var coordinates = {lon: lon, lat: lat};

var imageUrl =  'https://mist.controlthings.fi/parking.bmp';
var description = "";

function Parking(id) {
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

    node.read('chargeEnabled', function(args, peer, cb) { cb(null, self.chargeEnabled); });
    node.read('chargeTime', function(args, peer, cb) { cb(null, self.chargeTime); });

    node.read('mist.name', function(args, peer, cb) { cb(null, name); });
    node.read('mist.ui.url', function(args, peer, cb) { cb(null, url); });
    node.read('owner', function(args, peer, cb) { cb(null, owner); });

    node.read('spotCount', function(args, peer, cb) { cb(null, parkingCount); });
    node.read('spotFree', function(args, peer, cb) { cb(null, parkingCount - parkingSpots.length); });

    node.read('mist.product.imageUrl', function(args, peer, cb) { cb(null, imageUrl); });
    node.read('mist.product.description', function(args, peer, cb) { cb(null, description); });

    node.invoke('vehicle', function (args, peer, cb) {
        cb(null, vehicle);
    });

    node.invoke('geo', function (args, peer, cb) {
        cb(null, coordinates);
    });

    node.invoke("directory", function (args, peer, cb) {

        var schema = {
            "@context": "http://schema.mobivoc.org/",
            "@type": "ParkingFacility",
            "@id": 84,
            totalCapacity: {
                "@type": "totalCapacity",
                value: parkingCount
            },
            supportVehicleType: {
                "@type": "vehicleType",
                value: vehicle
            },
            placeName: {
                "@type": "placeName",
                value: name
            },
            isOwnedBy: {
                "@type": "isOwnedBy",
                value: owner
            },
            isLocated: {
                "@type": "ParkingFacilityLocation",
                "@context": "http://schema.org",
                //"@type": "Place",
                geo: { 
                    "@type": "GeoCoordinates",
                    latitude: coordinates.lat,
                    longitude: coordinates.lon
                }
            }
        };

        cb(null, schema);
    });

    node.invoke('geo', function (args, peer, cb) {
        cb(null, {lon: coordinates.lon, lat: coordinates.lat});
    });

    node.invoke('getParkingSpot', function (args, peer, cb) {

        if (parkingCount <= parkingSpots.length) {
            // parking is full
            return cb({err: "We're full", code: 1});
        }

        var reservation = {id: 'p-' + (parkingId++)};
        parkingSpots.push(reservation);
        node.changed('spotFree');
        cb(null, reservation);
    });

    node.invoke('cancelParkingSpot', function (args, peer, cb) {
        var reservationId = args[0];
        for (var i in parkingSpots) {
            if (parkingSpots[i].id === reservationId) {
                parkingSpots.splice(i, 1);
                node.changed('spotFree');
                return cb(null, true);
            }
        }
        cb(null, {err: 'Parking not found', code: 2});
    });

    node.write('spotCount', function (value, peer, cb) {
        parkingCount = value;
        node.changed('spotCount');
        node.changed('spotFree');
        cb();
    });

    node.write('chargeEnabled', function (value, peer, cb) {
        self.chargeEnabled = !!value;
        
        node.changed('chargeEnabled');

        if (!!value) {
            self.chargeTime = 10;
            node.changed('chargeTime');
        }
        cb();
    });
}


util.inherits(Parking, EventEmitter);

module.exports = {
    Parking: Parking
};
