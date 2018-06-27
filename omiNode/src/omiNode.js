var Mist = require('mist-api').Mist;

function OmiNode() {
    var mist = new Mist({ name: 'MistApi', corePort: 9094 }); // , coreIp: '127.0.0.1', corePort: 9094
    
    mist.request('signals', [], (err, data) => {
        console.log(err, data[0]);

        if (data[0] && data[0] === 'ready') {
            if (data[1] === true) {
                setupWishCore(mist);
            }
        }

        if (data[0] && data[0] === "peers") {
            mist.request('listPeers', [], (err, data) => {
                console.log("listPeers:", data);

                for (var i in data) {
                    var peer = data[i];
                    mist.request('mist.control.invoke', [peer, "omiHandler", "<foo/>"], (err, data) => {
                        if (err) {
                            console.log("Error invoking omiHandler:", data);
                            return;
                        }

                        console.log("omiHandler responded with:", data);
                    });
                }
            });
        }
    });
    
    mist.node.addEndpoint('omiHandler', {
        type: 'invoke',
        invoke: function(args, peer, cb) {

            /* This is the handler function for the omiHandler endpoint. This handler is called every time OMI protocol data is sent to this node using a 
            'mist.control.invoke' command. */

            /* Do the parsing of 'args' here, and when you are are done, call function cb() passing the reply as a parameter. 
            The cb can be called asynchronously, it need not be inside this invoke handler function. However, you may only send a reply once. */
            
            console.log("OmiNode's omiHandler got arguments:", args);
            cb(null, "OmiNode's omiHandler responding here!");

            /* By saving the 'peer' object, you can later invoke endpoints on the peer that invoked this endpoint, for example invoke the "omiData" endpoint of the peer to send results of a omi/odf subscription. */
        }
    });
}

/* This function lists the identities in the Wish core, and if there are no identities, a local identity is created. 
 If the local identity has no friends, the core is set to claimable state. */
 function setupWishCore(mist) {
    var localUid;
    mist.wish.request('identity.list', [], function(err, data) { 
        var foundLocalId = false;
        
        
        for (var i in data) {
            if (data[i] && data[i].privkey) {
                /* A local identity was found */
                foundLocalId = true;
                localUid = data[i].uid;
                console.log("localuid", localUid);
            }
        }
        
        if (!foundLocalId) {
            console.log("There were no local identities in the core, creating one!");
            mist.wish.request("identity.create", [name + "'s identity"], (err, data) => {
                if (err) { console.log("Error creating identity!", data); return; }
                console.log("identity.create", data);
                localUid = data.uid;
            });
        }
    });

    mist.wish.request("signals", [], (err, data) => {
        //console.log("Got Wish core signals: ", data);

        if (data[0] === "ok") {
            // Clear the local discovery cache so that we may get updates on available peers
            mist.wish.request("wld.clear", [], (err, data) => { if (err)  { console.log("wld.clear err", data)}});
        }

        if (data[0] === "localDiscovery") {
            mist.wish.request("wld.list", [], (err, data) => { 
                //console.log("wld:", data);
                for (var i in data) {
                    if (data[i] && data[i].claim === true) {
                        mist.wish.request("wld.friendRequest", [localUid, data[i].ruid, data[i].rhid], (err, data) => {
                            console.log("Friend request sent to:", data[i].alias);
                        });
                    }
                }
            });
        }
    });
}

module.exports = {
    OmiNode: OmiNode
};
