# Installs libstdc++ and libgcc_s as a workaround for Mist nodejs addon to work on OSX

if [ -f /usr/local/opt/gcc@4.8/lib/gcc/4.8/libstdc++.6.dylib ]; then
    echo "libstdc++.6.dylib already exists, skipping."
else
    echo "Installing /usr/local/opt/gcc@4.8/lib/gcc/4.8/libstdc++.6.dylib."
    mkdir -p /usr/local/opt/gcc@4.8/lib/gcc/4.8 #/libstdc++.6.dylib (compatibility version 7.0.0, current version 7.19.0)
    curl -s --output /usr/local/opt/gcc@4.8/lib/gcc/4.8/libstdc++.6.dylib https://mist.controlthings.fi/dist/libstdc++.6.dylib
fi

if [ -f /usr/local/lib/gcc/4.8/libgcc_s.1.dylib ]; then
    echo "libgcc_s.1.dylib already exists, skipping."
else
    echo "Installing /usr/local/lib/gcc/4.8/libgcc_s.1.dylib"
    mkdir -p /usr/local/lib/gcc/4.8 #/libgcc_s.1.dylib (compatibility version 1.0.0, current version 1.0.0)
    curl -s --output /usr/local/lib/gcc/4.8/libgcc_s.1.dylib https://mist.controlthings.fi/dist/libgcc_s.1.dylib
fi


