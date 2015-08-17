'use strict';


var feedReader = require('./GTFS-Realtime_FeedReader'),
    wrapper    = require('./GTFS-Realtime_Wrapper');


function newGTFSRealtimeObjectStream (apiKey, callback) {
    function wrapAndSend (msg) { 
        var obj = wrapper.newGTFSRealtimeObject(msg);

        callback(obj);
    } 

    feedReader.configure({ apiKey : apiKey }); 

    function startStream () {
        feedReader.registerListener(wrapAndSend);
    }

    function stopStream () {
        feedReader.removeListener(wrapAndSend);
    }

    return {
        start : startStream ,
        stop  : stopStream  ,
    };
}

module.exports = {
    newGTFSRealtimeObjectStream : newGTFSRealtimeObjectStream,
};
