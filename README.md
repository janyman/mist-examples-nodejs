# Example code for illlustrating protocol tunneling over Mist

This example code illustrates how higher-level protocols can be tunneled over Mist. The example consists of two parts

* switch, which simulates an on/off switch, and that also has an endpoint for receiving tunneled protocol data unit
* omiNode, which simulates a peer capable of sending and receiving protocol data units from the switch



# Example code for mist-api on node.js

## Prerequisites

If you are running on Linux x64 everything should work out of the box according to the instructions below. For OSX see section OSX workaround. Windows is not supported yet.

Download and install node.js v6.x: https://nodejs.org/dist/latest-v6.x/. You may use Node Version Manager `nvm` (https://github.com/creationix/nvm).

You will need to have an appropriate wish-core (the peer-to-peer identity based communication layer mist is based on). Binaries are available from https://mist.controlthings.fi/dist.

Download and run a wish-core:

```sh
wget http://mist.controlthings.fi/dist/wish-core-v0.8.0-beta-2-x64-linux
chmod u+x wish-core-v0.8.0-beta-2-x64-linux
./wish-core-v0.8.0-beta-2-x64-linux
```

Install command line tools for Mist and Wish:

```sh
npm install -g mist-cli@latest wish-cli@latest
```


Create an identity.

```sh
wish-cli
identity.create('Demo Identity')
```

In the examples root directory run:

```sh
npm install
```

## Running examples

### Switch

A simplistic switch implementation.

```sh
node switch/run.js
```

### Parking

A parking service. 

```sh
node parking/run.js
```

## Accessing the examples from CLI

```sh
# run the command line tool
mist-cli
# shows help
help()
# shows list of peers available
list()
# show model
mist.control.model(peers[x])
# write to relay endpoint of switch
mist.control.write(peers[x], 'relay', true)
```


## OSX workaround

There is currently a problem with running on OSX, but it can be worked around as follows.

### Install dependencies

Run this one-liner in the terminal, or download it to see what it does.

```bash
curl -s https://mist.controlthings.fi/dist/osx-gcc48-runtime.sh | sudo /bin/bash -s
```

### OSX older than High Sierra may use `brew` (i.e. Sierra and older, versions <= 10.12):

Install `brew`:

```sh
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
```

Install `gcc`:

```sh
brew install gcc48 --enable-cxx
```

Now you should have everything you need.

