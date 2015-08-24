'use strict';


var _            = require('lodash'),
    SuperWrapper = require('GTFS-Realtime_Toolkit').Wrapper,
    indexers     = require('./Indexers'),
    theAPI       = require('./WrapperAPI.js');


function GTFSRealtimeWrapper (GTFSrt_JSON) {
    SuperWrapper.call(this, GTFSrt_JSON);

    this.tripToTrainMap = indexers.buildTripToTrainMap(this.tripsIndex);
    this.trainToTripMap = indexers.buildTrainToTripMap(this.tripToTrainMap);
}

GTFSRealtimeWrapper.prototype = Object.create(SuperWrapper.prototype);
_.assign(GTFSRealtimeWrapper.prototype, theAPI);

module.exports = GTFSRealtimeWrapper;
