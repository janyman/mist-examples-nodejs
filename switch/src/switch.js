var MistNode = require('mist-api').MistNode;

/* This defines the service name, and also the service id. This must be unique among all the services that are connected to the Wish core. */
var name = process.env.NAME || 'Switch';

if (!process.env.NAME) { console.log('Use: NAME="Switch Label" to run several instances.'); }

/* The (local) TCP port where the local Wish core accepts service connections. This is the so-called 'app TCP' server's port. */
var port = parseInt(process.env.COREPORT) || 9094;
if (!process.env.COREPORT) { console.log('Use COREPORT=port to connect to a specific wish core, defaulting to 9094')}

function Switch() {
    var relay = false;
    
    var node = new MistNode({ name: name, corePort: port }); // , coreIp: '127.0.0.1', corePort: 9094

    // add `mist` endpoint, required by convention.
    node.addEndpoint('mist', { type: 'string' });
    // add `mist.name` as subendpoint to mist,  required by convention.
    node.addEndpoint('mist.name', { type: 'string', read: function(args, peer, cb) { cb(null, name); } });
    
    // add readable and writable `relay` endpoint. This endpoint simulates a relay which can be switched between "on" or "off" states.
    node.addEndpoint('relay', {
        type: 'bool',
        read: function(args, peer, cb) {
            cb(null, relay);
            
            if (!peer) { /* local read */ return; }
            node.request(peer, 'control.invoke', ['debug', 'You read my values!'], console.log);
        },
        write: function(value, peer, cb) {
            // write the internal state variable for `number` endpoint
            relay = !!value;
            // signal successful write
            cb();
            // signal `number` value changed
            node.changed('relay');
        }
    });

    // This endpoint shows how arbitrary BSON-encoded data can be sent over Mist, and how a reply can be sent back.
    // The endpoint 'omiHandler' is of type "invoke", which has semantics resembling a function call: it may take arbitrary arguments, and each request may produce an unique response.
    node.addEndpoint('omiHandler', {
        type: 'invoke',
        invoke: function(args, peer, cb) {

            /* This is the handler function for the omiHandler endpoint. This handler is called every time OMI protocol data is sent to this node using a 
            'mist.control.invoke' command. */

            /* Do the parsing of 'args' here, and when you are are done, call function cb() passing the reply as a parameter. 
            The cb can be called asynchronously, it need not be inside this invoke handler function. However, you may only send a reply once. */
            
            cb(null, "Good day Sir, your args were:" + args + " and the switch state is " + relay);

            /* By saving the 'peer' object, you can later invoke endpoints on the peer that invoked this endpoint, for example invoke the "omiData" endpoint of the peer to send results of a omi/odf subscription. */
            node.request(peer, 'control.invoke', ["omiHandler", "<foo/>"], (err, data) => {
                if (err) {
                    console.log("Error invoking omiHandler:", data);
                    return;
                }

                console.log("OmiNode's omiHandler responded with:", data);
            });
            
        }
    });

    /* Setup the wish core */
    setTimeout(() => { setupWishCore(node); }, 200); //TODO: Get rid of this timeout and make it work with { ready: true } intead.
}

/* This function lists the identities in the Wish core, and if there are no identities, a local identity is created. 
 If the local identity has no friends, the core is set to claimable state. */
function setupWishCore(node) {
    
    node.wish.request('identity.list', [], function(err, data) { 
        var foundLocalId = false;
        var foundRemoteContact = false;
        
        for (var i in data) {

            if (data[i] && data[i].privkey) {
                /* A local identity was found */
                foundLocalId = true;
            }

            if (data[i] && data[i].privkey === false) {
                /* A remote contact (a "friend") was found */
                foundRemoteContact = true;
            }
        }
        
        if (!foundLocalId) {
            console.log("There were no local identities in the core, creating one!");
            node.wish.request("identity.create", [name + " identity"], (err, data) => {
                if (err) { console.log("Error creating identity!", data); return; }
            });
        }
            
        if (!foundRemoteContact) {
            console.log("Setting core to insecure state because no contacts found!")
            node.wish.request("host.skipConnectionAcl", [true], (err, data) => {
                console.log(data);
            });
        }
        
    });

    var signalsId = node.wish.request('signals', [], (err, data) => {
        if (err) { console.log("error", data); return; }

        console.log("wish signals:", data);
        if (data[0] === "friendRequest") {
            console.log("got friend request");
            node.wish.request("identity.friendRequestList", [], (err, data) => {
                console.log("the pending friend reqs", data);
                node.wish.request("identity.friendRequestAccept", [data[0].luid, data[0].ruid], (err, data) => {
                    node.wish.cancel(signalsId);
                });
            });
        }
    });
}



module.exports = {
    Switch: Switch
};
