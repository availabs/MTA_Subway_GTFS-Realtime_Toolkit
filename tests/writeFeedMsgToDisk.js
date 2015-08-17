#!/usr/bin/env node

'use strict';


var fs         = require('fs'),
    feedReader = require('../lib/GTFS-Realtime_FeedReader'),
    key        = require('./mtaAPIKey');


feedReader.configure({ apiKey: key, });
feedReader.registerListener(listener);


function listener (msg) {
    feedReader.stop();

    // If you change this file name, make sure to make the same change in .gitignore.
    fs.writeFile('GTFS-Realtime_Sample.json', JSON.stringify(msg, null, '    '));
}

