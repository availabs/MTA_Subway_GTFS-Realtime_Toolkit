#!/usr/bin/env node

'use strict';


var feedReader = require('../lib/GTFS-RT_FeedReader'),
    wrapper    = require('../lib/GTFS-RT_Store'),
    key        = require('../mtaAPIKey');


feedReader.configure({ apiKey: key, });
feedReader.registerListener(listener);
feedReader.start();


function listener (msg) {
    var obj = wrapper.newGTFS_Realtime_Object(msg);

    console.log(JSON.stringify(obj, null, '    '));
}

