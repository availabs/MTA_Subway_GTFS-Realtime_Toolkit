#!/usr/bin/env node

'use strict';


var fs         = require('fs')                               ,
    FeedReader = require('GTFS-Realtime_Toolkit').FeedReader ,
    Wrapper    = require('../lib/Wrapper')                   ,
    config     = require('./.feedReaderConfig.js')           ,

    feedReader = new FeedReader(config)                      ;


feedReader.registerListener(listener);

var counter = 0;

function listener (msg) {
    if (++counter > 20) {
        feedReader.removeListener(listener);
    }
    var wrapper = new Wrapper(msg);
    console.log('====================');
}
