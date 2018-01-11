var EventEmitter = require('events').EventEmitter;
var MistNode = require('mist-api').MistNode;
var util = require("util");

var name = process.env.NAME || 'Switch';
var state = false;

if (!process.env.NAME) { console.log('Use: NAME="Switch Label" to run several instances.'); }

function Switch(id) {
    var node = new MistNode({ name: name }); // , coreIp: '127.0.0.1', corePort: 9094
        
    node.addEndpoint('mist', { type: 'string' });
    node.addEndpoint('mist.name', { type: 'string', read: function(args, peer, cb) { cb(null, name); } });
    node.addEndpoint('state', { 
        type: 'bool',
        read: function(args, peer, cb) { cb(null, state); },
        write: function(value, peer, cb) {
            state = !!value;
            console.log('Node write state:', state);
            cb();
            node.changed('state');
        }
    });
    node.addEndpoint('config', { type: 'invoke', invoke: function(args, peer, cb) { cb(null, { cool: ['a', 7, true], echo: args }); } });
}

util.inherits(Switch, EventEmitter);

module.exports = {
    Switch: Switch
};
