var MistNode = require('mist-api').MistNode;

var cls = 'fi.controlthings.chat';

function Beacon() {
    var self = this;
    this.node = new MistNode('RandomBeacon');
    this.peers = {};
    this.beaconEnabled = true;
    this.peerCount = 0;
    this.messageCountOld = 0;
    this.messageCount = 0;
    this.messageCountPerSecond = 0;

    self.node.addEndpoint('mist.name', { type: 'string', read: (args, peer, cb) => { cb(null, 'RandomBeacon'); } });
    self.node.addEndpoint('mist.class', { type: 'string', read: (args, peer, cb) => { cb(null, cls); } });

    self.node.addEndpoint('message', {
        invoke: (args, peer, cb) => {
            console.log('Received message:', args);
            self.node.wish.request('identity.get', [peer.ruid], (err, data) => {
                cb(null, 'You are known to me as '+data.alias);
            });
        }
    });

    self.node.addEndpoint('beaconEnabled', {
        type: 'bool',
        read: (args, peer, cb) => { cb(null, self.beaconEnabled); },
        write: (value, peer, cb) => {
            self.beaconEnabled = value;
            cb();
            self.node.changed('beaconEnabled');
            
            // if set to true, start sending beacons to online peers
            if(value) {
                for(var i in self.peers) {
                    self.startBeacon(self.peers[i].peer);
                }
            }
        }
    });

    self.node.addEndpoint('peerCount', {
        type: 'int',
        read: (args, peer, cb) => { cb(null, self.peerCount); }
    });

    self.node.addEndpoint('messageCount', { type: 'int', read: (args, peer, cb) => { cb(null, self.messageCount); } });
    self.node.addEndpoint('messageCountPerSecond', { type: 'int', read: (args, peer, cb) => { cb(null, self.messageCountPerSecond); } });
    
    self.node.on('online', (peer) => {
        self.node.request(peer, 'control.read', ['mist.class'], (err, type) => {
            if (type === cls) {
                self.node.wish.request('identity.get', [peer.luid], (err, data1) => {
                    self.node.wish.request('identity.get', [peer.ruid], (err, data2) => {
                        //console.log('peer:alias', data1.alias, data2.alias);
                        self.node.request(peer, 'control.read', ['mist.name'], (err, name) => {
                            //console.log('peer:alias', data1.alias, data2.alias, data);
                            console.log('peer:alias', data1.alias, data2.alias, name, type);
                            
                            // start "spamming"
                            self.startBeacon(peer);
                        });
                    });
                });
            }
        });
    });
    
    self.node.on('offline', (peer) => {
        // stop "spamming"
        self.stopBeacon(peer);
    });
    
    setInterval(() => {
        if (self.messageCount !== self.messageCountOld) {
            self.messageCountPerSecond = self.messageCount - self.messageCountOld;
            self.messageCountOld = self.messageCount;
            self.node.changed('messageCount');
            self.node.changed('messageCountPerSecond');
        }
    }, 1000);
}

function toUrl(peer) {
    return peer.protocol +':'+ peer.luid.toString('base64')+peer.ruid.toString('base64')+peer.rhid.toString('base64')+peer.rsid.toString('base64');
}

function bacon(self, peer, url) {
    return function() {
        if (!self.peers[url]) { return console.log('bail!', self.peers, url); };
        if(!self.beaconEnabled) { return; }

        self.node.request(peer, 'control.invoke', ['message', 'beacon! ('+( ++self.peers[url].cnt )+')'], (err, data) => {
            if (err) { return console.log('send message error:', data); }

            // message delivered
            console.log('sent message successfully, they said:', data);
            self.messageCount++;
            setTimeout(bacon(self, peer, url));
        });
    };
}

Beacon.prototype.startBeacon = function(peer) {
    var url = toUrl(peer);
    
    console.log('beacon ', typeof bacon);
    
    this.peers[url] = { 
        interval: setTimeout(bacon(this, peer, url), 30),
        peer: peer,
        cnt: this.peers[url] ? this.peers[url].cnt : 0
    };
    
    this.updatePeerCount();
};

Beacon.prototype.stopBeacon = function(peer) {
    var url = toUrl(peer);
    if (!this.peers[url]) { return; };
    clearInterval(this.peers[url].interval);
    delete this.peers[url];
    this.updatePeerCount();
};

Beacon.prototype.updatePeerCount = function() {
    var count = 0;
    for(var i in this.peers) { count++; }
    
    console.log('peerCount:', count);
    
    this.peerCount = count;
    this.node.changed('peerCount');
};

var beacon = new Beacon();