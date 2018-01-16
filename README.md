# Example code for mist-api on node.js

## Prerequisites

You will need to be an appropriate wish-core (the peer-to-peer identity based communication layer), form https://mist.controlthings.fi/dist.

Download and run a wish-core:

```sh
wget http://mist.controlthings.fi/dist/wish-core-v0.8.0-beta-2-x64-linux
chmod u+x wish-core-v0.8.0-beta-2-x64-linux
wish-core-v0.8.0-beta-2-x64-linux
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

If you are running on Linux x64/ia32 everything should work out of the box. For OSX see section OSX workaround. Windows is not supported yet.

In the examples root directory run 

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

A simple parking service. 

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

There is currently a problem with running on OSX, but it can be worked around.

### OSX older than High Sierra (i.e. Sierra and older, <= 10.12):

Install `brew`:

```sh
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
```

Install `gcc`:

```sh
brew install gcc48 --enable-cxx
```

Now you should have everything you need.


### OSX High Sierra



