#!/usr/bin/env node

'use strict';


var feedReader = require('GTFS-Realtime_Toolkit').FeedReader.newFeedReader(),
    _          = require('lodash'),

    config     = require('./config');


feedReader.configure(config);
feedReader.registerListener(listener);


function listener (msg) {
    console.log(_.filter(_.pluck(msg.entity, 'trip_update.trip.trip_id')));
}

