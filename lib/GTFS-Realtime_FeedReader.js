'use strict';


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

function registerListener (listener) {
    if ( ! _.isFunction(listener) ) {
        throw "Listeners must be functions.";
    }

    listeners.push(listener);
}

function removeListner (listener) {
    _.pull(listeners, listener);
}


function configure (config) {
    if (config.apiKey) {
        feedUrl = "http://datamine.mta.info/mta_esi.php?key=" + config.apiKey;    
    }
}

// Must be called at least once with a config.apiKey
function start () {
    if ( ! feedUrl ) {
        console.log('Please send an MTA Realtime API key.');
        return;
    }

    if ( ! feedReaderIntervalObj ) {
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
                throw e;
            });
    } catch (e) {
        console.log(e);
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
            
            console.log(data.length);

            var msg = transit.FeedMessage.decode(data);
            
            _.forEach(listeners, function (listener) { 
                try {
                    listener(msg); 
                } catch (e) {
                    console.log(e); 
                }
            });

        } catch (e) {
            console.log(e);
            if ( ! retryReadIntervalObj ) { // Prevent cascading
                retry();
            }
        }
    }); 
}

//============================================================





module.exports = {
    registerListener : registerListener ,
    removeListner    : removeListner    ,
    configure        : configure        ,
    start            : start            ,
    stop             : stop             ,
};


