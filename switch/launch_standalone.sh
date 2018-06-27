#!/bin/bash

# trap ctrl-c and call ctrl_c()
trap ctrl_c INT

function ctrl_c() {
    echo "** Trapped CTRL-C, killing wish-core ($WISH_PID) too"
    kill $WISH_PID
}

WISH=~/controlthings/mist/wish-c99/build/wish-core

$WISH -p 38112 -r -a 50001  &
WISH_PID=$!

NAME=sw1 COREPORT=50001 node run.js

