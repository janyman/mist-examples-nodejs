var EventEmitter = require('events').EventEmitter;
var MistNode = require('mist-api').MistNode;
var model = require('./model.json');
var util = require("util");

var name = process.env.NAME || 'Switch';

if (!process.env.NAME) { console.log('Use: NAME="Switch Label" to run several instances.'); }

function Switch(id) {
    var node = new MistNode({ name: name }); // , coreIp: '127.0.0.1', corePort: 9094
        
    node.create(model);
    
    node.update('mist.name', name);
    
    node.invoke('config', function(args, cb) {
        cb({ cool: ['a', 7, true], echo: args });
    });

    node.write(function(epid, data) {
        console.log('Node write:', epid, data);
        if (epid === 'state') { node.update(epid, !!data); }
    });
}

util.inherits(Switch, EventEmitter);

module.exports = {
    Switch: Switch
};
