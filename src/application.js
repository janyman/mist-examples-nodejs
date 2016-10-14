var util = require("util");
var EventEmitter = require('events').EventEmitter;

function MistIoSwitch() {
    var self = this;

    process.nextTick(function () {
        self.emit("state", false);
    });

}

util.inherits(MistIoSwitch, EventEmitter);

MistIoSwitch.prototype.state = function (args, opts, cb) {
    var value = args;
    if (!this.state || this.state !== value) {
        this.state = value;
        console.log("new state:", value);
        this.emit('state', value);
    }
    cb(null, this.state);
};


module.exports = {
    MistIoSwitch: MistIoSwitch
};
