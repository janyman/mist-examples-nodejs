var MistHelper = require('mist-device').MistHelper;
var MistIoSwitch = require('./src/application.js').MistIoSwitch;
var model = require('./src/model.json');

var mistIoSwitch = new MistIoSwitch();

var app = new MistHelper(model, mistIoSwitch);
