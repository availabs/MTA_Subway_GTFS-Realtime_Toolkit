#!/usr/bin/env node

'use strict';


var feedReader = require('GTFS-Realtime_Toolkit').FeedReader.newFeedReader(),
    wrapper    = require('../lib/Wrapper'),
    config     = require('./config');


feedReader.configure(config);
feedReader.registerListener(listener);


function listener (msg) {
    var obj = wrapper.newGTFSRealtimeObject(msg);

    console.log(JSON.stringify(obj, null, '    '));
}

