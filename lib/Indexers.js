/**
 *
 * @module "MTA_Subway_GTFS-Realtime_Toolkit.Indexers"
 *
 */

'use strict';

var _ = require('lodash');


function buildTripToTrainMap (tripsIndex) {
    return _.mapValues(tripsIndex, getTrainIDForTripIndexNode);
}

function buildTrainToTripMap (tripIDToTrainIDMap) {
    return _.invert(tripIDToTrainIDMap);
}

// Helper for buildTripToTrainMap
function getTrainIDForTripIndexNode (indexNode) {
    return _.get(indexNode , ['TripUpdate'     , 'trip', '.nyct_trip_descriptor', 'train_id'])   ||
           _.get(indexNode , ['VehiclePosition', 'trip', '.nyct_trip_descriptor', 'train_id'])   ||
           _.get(indexNode , ['Alerts',          'trip', '.nyct_trip_descriptor', 'train_id'], null) ;
}

module.exports = {
    buildTripToTrainMap : buildTripToTrainMap ,
    buildTrainToTripMap : buildTrainToTripMap ,
};
