#!/usr/bin/env node

'use strict';


var feedReader = require('../lib/GTFS-RT_FeedReader'),
    key        = require('../mtaAPIKey'),
    _          = require('lodash');


feedReader.configure({ apiKey: key, });
feedReader.registerListener(listener);
feedReader.start();


function listener (msg) {
    console.log(_.filter(_.pluck(msg.entity, 'trip_update.trip.trip_id')));
}

