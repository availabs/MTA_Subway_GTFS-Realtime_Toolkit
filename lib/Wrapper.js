'use strict';


var _           = require('lodash'),
    gtfsWrapper = require('GTFS-Realtime_Toolkit').Wrapper,
    indexers    = require('./Indexers'),
    theAPI      = require('./WrapperAPI');


function newGTFSRealtimeObject (GTFSrt_JSON) {
    var baseGTFSrtObj  = gtfsWrapper.newGTFSRealtimeObject(GTFSrt_JSON),

        tripToTrainMap = indexers.buildTripToTrainMap(baseGTFSrtObj)  ,
        trainToTripMap = indexers.buildTrainToTripMap(tripToTrainMap) ,

        extraIndices   = {
            tripToTrainMap : tripToTrainMap ,
            trainToTripMap : trainToTripMap ,
        };

    // Merge allows functions in theAPI to use `this` to access the indices and other API functions
    // as they become methods of the merged object.
    return _.merge(baseGTFSrtObj, [extraIndices, theAPI]);
}


module.exports = {
    newGTFSRealtimeObject : newGTFSRealtimeObject,
};
