var MistNode = require('mist-api').MistNode;

var cls = 'fi.controlthings.chat';

function Chat() {
    var self = this;
    this.node = new MistNode(process.env.NAME || 'Chat');

    self.node.addEndpoint('mist.name', { type: 'string', read: (args, peer, cb) => { cb(null, 'Chat'); } });
    self.node.addEndpoint('mist.class', { type: 'string', read: (args, peer, cb) => { cb(null, cls); } });

    self.node.addEndpoint('message', {
        invoke: (args, peer, cb) => {
            console.log('Received message:', args);
            self.node.wish.request('identity.get', [peer.ruid], (err, data) => {
                cb(null, 'You are known to me as '+data.alias);
            });
        }
    });

    self.node.on('online', (peer) => {
        self.node.request(peer, 'control.read', ['mist.class'], (err, type) => {
            if (type === cls) {
                self.node.wish.request('identity.get', [peer.luid], (err, data1) => {
                    self.node.wish.request('identity.get', [peer.ruid], (err, data2) => {
                        self.node.request(peer, 'control.read', ['mist.name'], (err, name) => {
                            console.log('peer:alias', data1.alias, data2.alias, name, type);
                            
                            self.node.request(peer, 'control.invoke', ['message', 'I see U!'], (err, data) => {
                                if (err) { return console.log('send message error:', data); }
                                
                                // message delivered
                                console.log('sent message successfully, they said:', data);
                            });
                        });
                    });
                });
            }
        });
        
    });
    
    self.node.on('offline', (peer) => {
        //console.log('chat:offline', peer);
    });
}

var chat = new Chat();