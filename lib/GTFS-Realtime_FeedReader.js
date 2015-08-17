'use strict';

// NOTE: Currently, the feedReader is currently designed to be a singleton with listeners.
//       Only admin should call stop. 
//       Clients should simply remove their listener.
//


var ProtoBuf = require('protobufjs'),
    http     = require("http"),
    _        = require('lodash');



// Module scope variables.
//============================================================

var nyctSubwayProtoFilePath = __dirname + '/' + '../proto_files/nyct-subway.proto',
    transit                 = ProtoBuf.protoFromFile(nyctSubwayProtoFilePath).build('transit_realtime');


var feedUrl;


var feedReaderIntervalObj = null,
    retryReadIntervalObj  = null,
    retryCounter          = 0,
    MAX_RETRIES           = 3;

var listeners = [];

//============================================================




// The external interface
//============================================================

// Must configure before using.
function configure (config) {
    if (config.apiKey) {
        feedUrl = "http://datamine.mta.info/mta_esi.php?key=" + config.apiKey;    
    }
}

function registerListener (listener) {
    if ( ! _.isFunction(listener) ) {
        throw "Listeners must be functions.";
    }

    listeners.push(listener);

    if ( ! feedReaderIntervalObj ) { start(); }
}

function removeListener (listener) {
    _.pull(listeners, listener);

    if (listeners.length === 0) { // Only makes sense.
        stop();
    }
}

// Must be called at least once with a config.apiKey
function start () {
    if ( ! feedUrl ) {
        console.log('Please send an MTA Realtime API key.');
        return;
    }

    if ( ! feedReaderIntervalObj ) { // Make idempotent, unless stopped.
        readFeed();
        feedReaderIntervalObj = setInterval(intervaledFeedReader, 30000);
    }
}


function stop () {
    clearInterval(retryReadIntervalObj);
    clearInterval(feedReaderIntervalObj);
}

//============================================================




// Read (or retry reading) the feed on an interval.
//============================================================

function intervaledFeedReader () {
    clearInterval(retryReadIntervalObj);
    readFeed();
}


function retry () {
    retryCounter = 0;
    retryReadIntervalObj = setInterval(intervaledRetry, 1500);
}



function intervaledRetry () {
    if (retryCounter++ > MAX_RETRIES) {
        clearInterval(retryReadIntervalObj);
    } else {
        console.log('Retry number', retryCounter);
        readFeed();
    }
}

//============================================================




// Get and parse the GTFS-Realtime messages
//============================================================

function readFeed() {
    try {
        http.get(feedUrl, parse)
            .on("error", function (e) { 
                console.log(e.stack);
            });
    } catch (e) {
        console.log(e.stack);
        if ( ! retryReadIntervalObj ) { // Prevent cascading
            retry();
        }
    }
}



function parse (res) {
    var data = [];

    res.on("data", function(chunk) {
        data.push(chunk);
    });

    res.on("end", function() {
        try {
            data = Buffer.concat(data);
            
            var msg = transit.FeedMessage.decode(data);
            
            _.forEach(listeners, function (listener) { 
                try {
                    listener(msg); 
                } catch (e) {
                    console.log(e.stack); 
                }
            });

        } catch (e) {
            console.log(e.stack);
            if ( ! retryReadIntervalObj ) { // Prevent cascading
                retry();
            }
        }
    }); 
}

//============================================================





module.exports = {
    registerListener : registerListener ,
    removeListener   : removeListener   ,
    configure        : configure        ,
    stop             : stop             ,
};


