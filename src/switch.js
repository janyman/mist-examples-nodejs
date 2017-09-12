var EventEmitter = require('events').EventEmitter;
var MistNode = require('mist-api').MistNode;
var model = require('./model.json');
var util = require("util");

var name = process.env.NAME || 'Parking';
var lon = parseFloat(process.env.LON) || 25;
var lat = parseFloat(process.env.LAT) || 60.1;

if (!process.env.NAME) { console.log('Use: NAME="Switch Label" to run several instances.'); }

var parkingSpots = [];
var parkingCount = 10;
var parkingId = 1;

function Switch(id) {
    var node = new MistNode({ name: name }); // , coreIp: '127.0.0.1', corePort: 9094
        
    node.create(model);
    
    node.update('mist.name', name);
    
    node.update('spotCount', parkingCount);
    node.update('spotFree', parkingCount-parkingSpots.length);
    
    node.invoke('geo', function(args, cb) {
        cb({ lon: lon, lat: lat });
    });
    
    node.invoke('getParkingSpot', function(args, cb) {
        
        if (parkingCount <= parkingSpots.length) {
            // parking is full
            return cb({ err: "We're full", code: 1 });
        }
        
        var reservation = { id: 'p-'+(parkingId++) };
        parkingSpots.push(reservation);
        
        node.update('spotFree', parkingCount - parkingSpots.length);
        
        cb(reservation);
    });
    
    node.invoke('cancelParkingSpot', function(args, cb) {
        var reservationId = args[0];

        for(var i in parkingSpots) {
            if (parkingSpots[i].id === reservationId) {
                parkingSpots.splice(i, 1);
                node.update('spotFree', parkingCount - parkingSpots.length);
                return cb(true);
            }
        }
        
        cb({ err: 'Parking not found', code: 2 });
    });

    node.write(function(epid, data) {
        console.log('Node write:', epid, data);
    });
}

util.inherits(Switch, EventEmitter);

module.exports = {
    Switch: Switch
};
