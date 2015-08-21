'use strict';

var _ = require('lodash');


function buildTripToTrainMap (baseWrapperObj) {
    return _.mapValues(baseWrapperObj.tripsIndex, getTrainIDForTripIndexNode);
}

function buildTrainToTripMap (tripToTrainMap) {
    return _.invert(tripToTrainMap);
}

// Helper for buildTripToTrainMap
function getTrainIDForTripIndexNode (indexNode) {
    return _.get(indexNode , ['tripUpdate'     , 'trip', '.nyct_trip_descriptor', 'train_id'])   ||
           _.get(indexNode , ['vehiclePosition', 'trip', '.nyct_trip_descriptor', 'train_id'])   ||
           _.get(indexNode , ['alerts',          'trip', '.nyct_trip_descriptor', 'train_id'], null) ;
}

module.exports = {
    buildTripToTrainMap : buildTripToTrainMap ,
    buildTrainToTripMap : buildTrainToTripMap ,
};
