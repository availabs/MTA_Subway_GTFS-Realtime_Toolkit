#!/usr/bin/env node

'use strict';


var fs         = require('fs'),
    feedReader = require('../lib/GTFS-RT_FeedReader'),
    key        = require('../mtaAPIKey');


feedReader.configure({ apiKey: key, });
feedReader.registerListener(listener);
feedReader.start();


function listener (msg) {
    feedReader.stop();
    fs.writeFile('GTFS-RT_Sample.json', JSON.stringify(msg, null, '    '));
}

