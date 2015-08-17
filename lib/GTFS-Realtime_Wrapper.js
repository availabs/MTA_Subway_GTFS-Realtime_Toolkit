'use strict';

/* jshint unused: false */

// FIXME: Fix the partial route name logic. 
// Some routes have a .. because the second one is a place filler.
// Routes with a single char (1..)
// with two chars (FC.)


var _         = require('lodash'),
    timeUtils = require('./utils/timeUtils');


function newGTFS_Realtime_Object (GTFSrt_JSON) {

    var trainsIndex = {},
        routesIndex = {},
        stopsIndex  = {};

    console.log(GTFSrt_JSON);

    _.forEach(_.values(GTFSrt_JSON.entity), function (entity) { 

            switch (determineEntityType(entity)) {

                case 'Alert' :
                    indexAlert(entity.alert);
                    break;

                case 'TripUpdate' :
                    indexTripUpdate(entity.trip_update);
                    break;

                case 'VehiclePosition' :
                    indexVehiclePostion(entity.vehicle);
                    break;

                default :
                    console.log('WARNING: Unrecognized message type.');
            }
    });



//========================= The indexers =========================\\

    function indexAlert (alertMessage) {
        _.forEach(_.values(alertMessage.informed_entity), function (informedEntity) {
            var trainID = informedEntity.trip['.nyct_trip_descriptor'].train_id,
                routeID = informedEntity.trip.route_id;

            (trainsIndex[trainID] || (trainsIndex[trainID] = newTrainIndexNode())).alerts.push(alertMessage);

            (routesIndex[routeID] || (routesIndex[routeID] = {}))[trainID] = 1;
        });
    } 


    function indexTripUpdate (tripUpdateMessage) {
        var trainID = tripUpdateMessage.trip['.nyct_trip_descriptor'].train_id,
            routeID = tripUpdateMessage.trip.route_id;

        (trainsIndex[trainID] || (trainsIndex[trainID] = newTrainIndexNode())).tripUpdate = tripUpdateMessage;

        (routesIndex[routeID] || (routesIndex[routeID] = {}))[trainID] = 1;

        _.forEach(_.values(tripUpdateMessage.stop_time_update), function (stopTimeUpdate, index) {
            var stopID     = stopTimeUpdate.stop_id,

                timeAtStop = (stopTimeUpdate.arrival   && stopTimeUpdate.arrival.time.low)   ||
                             (stopTimeUpdate.departure && stopTimeUpdate.departure.time.low) ||
                             Number.POSITIVE_INFINITY;

                            
            trainsIndex[trainID].stops[stopID] = index; 
            (stopsIndex[stopID] || (stopsIndex[stopID] = {}))[trainID] = timeAtStop;
        });
    }


    function indexVehiclePostion (vehiclePositionMessage) {
        var trainID = vehiclePositionMessage.trip['.nyct_trip_descriptor'].train_id,
            routeID = vehiclePositionMessage.trip.route_id;

        (trainsIndex[trainID] || (trainsIndex[trainID] = newTrainIndexNode())).vehiclePosition = vehiclePositionMessage;
        (routesIndex[routeID] || (routesIndex[routeID] = {}))[trainID] = 1; // Redundant IF all trains have both a TripUpdate & VehiclePositio.
    }




    //========================= The API =========================\\
    // TODO: put all external facing functions in an object, 
    //       set module.exports equal to that object
    //

    function getTimestamp () {
        return GTFSrt_JSON.header.timestamp.low;
    }

    function getAllMonitoredTrains () {
        return _.keys(trainsIndex);
    }

    function getTripUpdateForTrain (trainID) {
        return trainsIndex[trainID].tripUpdate; 
    }

    function getVehiclePositionUpdateForTrain (trainID) {
        return trainsIndex[trainID].vehiclePosition;
    }

    function getAlertsForTrain (trainID) {
        // TODO Implement Alert indexing.
    }

function getStartDateForTrain (trainID) {
    var dateStr = getTripForTrain(trainID).start_date;

    return timeUtils.getDateFromDateString(dateStr);
}


function getTripScheduleDateForTrain (trainID) {
    var startDate  = getStartDateForTrain(trainID),
        originTime = getOriginTimeForTrain(trainID),
    
        scheduleDate  = new Date(startDate);

    if      ( originTime < 0 )      { scheduleDate.setDate(scheduleDate.getDate() + 1); }
    else if ( originTime > 144000 ) { scheduleDate.setDate(scheduleDate.getDate() - 1); }

    return scheduleDate;
}

function getPartialGTFSTripNameForTrain (trainID) {
    var tripDate     = getTripScheduleDateForTrain(trainID),
        tripID       = getGTFSrTripIDForTrain(trainID),
        day          = tripDate.getDay(),
        serviceCode,
        coreTripID;

    
    if      (day === 0) { serviceCode = 'SUN'; } 
    else if (day === 6) { serviceCode = 'SAT'; }
    else                { serviceCode = 'WKD'; }

    coreTripID = tripID.substring(0, tripID.lastIndexOf('.') + 2);

    return serviceCode + '_' + coreTripID;
}





    function getTripUpdatesForRoute (routeID) {
        return routesIndex.tripUpdates;
    }

    function getVehiclePositionUpdatesForRoute (routeID) {
        return routesIndex.trainPositions;
    }

    function getAlertsForRoute (routeID) {
        return routesIndex.alerts;
    }

    function getStopTimeUpdatesForTrain (trainID) {
        return trainsIndex[trainID].tripUpdate.stop_time_update;
    }

    function getTripForTrain (trainID) {
        return trainsIndex[trainID].tripUpdate.trip;
    }

    function getGTFSrTripIDForTrain (trainID) {
        return getTripForTrain(trainID).trip_id;
    }

    function getRouteIDForTrain (trainID) {
        return getTripForTrain(trainID).route_id;
    }

    function getOriginTimeForTrain (trainID) {
        var tripID = getGTFSrTripIDForTrain(trainID);

        return parseInt(tripID.substring(0, tripID.indexOf('_')));
    }

    function getStopsFromCallForTrain (trainID, stopID) {
        return trainsIndex[trainID].stops[stopID];
    }

    function getOnwardCallsForTrain (trainID) {
        return trainsIndex[trainID].tripUpdate.stop_time_update;
    }

    function getOnwardStopIDsForTrain (trainID) {
        return _.pluck(getOnwardCallsForTrain(trainID), 'stop_id');
    }


    function getFirstOnwardCallForTrain (trainID) {
        return _.first(getOnwardCallsForTrain(trainID));
    }

    function getIDOfNextStopForTrain (trainID) {
        return getFirstOnwardCallForTrain(trainID).stop_id;
    }


    function getFirstNOnwardCallsForTrain (trainID, n) {
        return _.take(getOnwardCallsForTrain(trainID), n);
    }

    function getFirstNOnwardStopIDsForTrain (trainID, n) {
        return _.pluck(getFirstNOnwardCallsForTrain(trainID), 'stop_id');
    }


    function getNthOnwardCallForTrain (trainID, n) {
        return getOnwardCallsForTrain(trainID)[n];
    }

    function getNthOnwardStopIDForTrain (trainID, n) {
        return getOnwardCallsForTrain(trainID)[n].stop_id;
    }


    function getStopTimeUpdateForStopForTrain (stopID, trainID) {
        var tripUpdate = trainsIndex[trainID].tripUpdate,
            stopIndex;
        
        if ( ! tripUpdate) { return; }

        stopIndex = trainsIndex[trainID].stops[stopID];

        return tripUpdate.stop_time_update[stopIndex];
    }

    function getDestinationStopTimeUpdateForTrain (trainID) {
        return _.last(getOnwardCallsForTrain(trainID));
    }

    function getDestinationIDForTrain (trainID) { //FIXME: Mess. At least make more defensively coded.
        return getDestinationStopTimeUpdateForTrain(trainID).stop_id;
    }

    function getGTFSRouteShortNameForTrain (trainID) {
        return trainsIndex[trainID].tripUpdate.trip.route_id;
    }


    function getTrainsServicingStop (stopID) {
        if ( ! Array.isArray(stopsIndex[stopID]) ) {
            stopsIndex[stopID] = convertStopIndexNodeObjectToSortedArray(stopID);
        }

        return stopsIndex[stopID];
    }

    function getTrainsServicingRoute (routeID) {
        if ( ! Array.isArray(routesIndex[routeID]) ) {
            routesIndex[routeID] = Object.keys(routesIndex[routeID]);
        }

        return routesIndex[routeID];
    }

    function getTrainsServicingStopForRoute(stopID, routeID) {
        return _.intersection(getTrainsServicingStop(stopID), getTrainsServicingRoute(routeID));
    }

    function convertStopIndexNodeObjectToSortedArray (stopID) {
        var trainArrivalTimePairs = _.pairs(stopsIndex[stopID]);

        trainArrivalTimePairs.sort(function (pair) { return pair[1]; });

        return _.pluck(trainArrivalTimePairs, 0);
    }


    function getTrainArrivalTimeForStop (trainID, stopID) {
        var stopTimeUpdate = getStopTimeUpdateForStopForTrain(stopID, trainID), //FIXME: Keep same ordering.
            arrivalTimeUpdate;

        if ( ! stopTimeUpdate ) { return; }

        arrivalTimeUpdate = stopTimeUpdate.arrival;

        return (arrivalTimeUpdate && arrivalTimeUpdate.time.low) || null;
    }


    function getTrainDepartureTimeForStop (trainID, stopID) {
        var stopTimeUpdate = getStopTimeUpdateForStopForTrain(stopID, trainID), //FIXME: Keep same ordering.
            departureTimeUpdate;

        if ( ! stopTimeUpdate ) { return; }

        departureTimeUpdate = stopTimeUpdate.departure;

        return (departureTimeUpdate && departureTimeUpdate.time.low) || null;
    }



function getDistanceInMilesToNextStop (GTFS, trainID) {
    if ( ! GTFS ) { return null; }

    return 'TODO: Implement this';
}

function getDistanceInStopsToNextStop (GTFS, trainID) {
    if ( ! GTFS ) { return null; }

    return 'TODO: Implement this';
}

function getDistanceInMilesToCurrStop (GTFS, trainID, stopID) {
    if ( ! GTFS ) { return null; }

    return 'TODO: Implement this';
}

function getDistanceInStopsToCurrStop (GTFS, trainID, stopID) {
    if ( ! GTFS ) { return null; }

    return 'TODO: Implement this';
}





    //========================= The helpers =========================\\


    function determineEntityType (entity) {
        if      ( entity.trip_update ) { return 'TripUpdate'      ; }
        else if ( entity.vehicle     ) { return 'VehiclePosition' ; }
        else if ( entity.alert       ) { return 'Alert'           ; }
    }


    function newTrainIndexNode () {
        return {
            tripUpdate      : null,
            vehiclePosition : null,
            alerts          : [],
            stops           : {},
        };
    }




    //========================= Export the API =========================\\

    return { 
        GTFS_Realtime_JSON                   : GTFSrt_JSON                          ,

        trainsIndex                          : trainsIndex                          ,
        routesIndex                          : routesIndex                          ,
        stopsIndex                           : stopsIndex                           ,

        getTimestamp                         : getTimestamp                         ,

        getAllMonitoredTrains                : getAllMonitoredTrains                ,
        getTrainsServicingRoute              : getTrainsServicingRoute              ,

        getTripUpdateForTrain                : getTripUpdateForTrain                ,
        getVehiclePositionUpdateForTrain     : getVehiclePositionUpdateForTrain     ,
        getAlertsForTrain                    : getAlertsForTrain                    ,

    getStartDateForTrain                 : getStartDateForTrain                 ,
    getTripScheduleDateForTrain          : getTripScheduleDateForTrain          ,
    getPartialGTFSTripNameForTrain       : getPartialGTFSTripNameForTrain       ,

        getTripUpdatesForRoute               : getTripUpdatesForRoute               ,
        getVehiclePositionUpdatesForRoute    : getVehiclePositionUpdatesForRoute    ,
        getAlertsForRoute                    : getAlertsForRoute                    ,

        getStopTimeUpdatesForTrain           : getStopTimeUpdatesForTrain           ,
        getTripForTrain                      : getTripForTrain                      ,

        getGTFSrTripIDForTrain               : getGTFSrTripIDForTrain               ,
        getRouteIDForTrain                   : getRouteIDForTrain                   ,

        getOriginTimeForTrain                : getOriginTimeForTrain                ,

        getStopsFromCallForTrain             : getStopsFromCallForTrain             ,

        getOnwardCallsForTrain               : getOnwardCallsForTrain               ,
        getFirstOnwardCallForTrain           : getFirstOnwardCallForTrain           ,
        getFirstNOnwardCallsForTrain         : getFirstNOnwardCallsForTrain         ,
        getNthOnwardCallForTrain             : getNthOnwardCallForTrain             ,

        getOnwardStopIDsForTrain             : getOnwardStopIDsForTrain             ,
        getIDOfNextStopForTrain              : getIDOfNextStopForTrain              ,
        getFirstNOnwardStopIDsForTrain       : getFirstNOnwardStopIDsForTrain       ,
        getNthOnwardStopIDForTrain           : getNthOnwardStopIDForTrain           ,

        getStopTimeUpdateForStopForTrain     : getStopTimeUpdateForStopForTrain     ,
        getDestinationStopTimeUpdateForTrain : getDestinationStopTimeUpdateForTrain ,

        getDestinationIDForTrain             : getDestinationIDForTrain             ,



        getGTFSRouteShortNameForTrain        : getGTFSRouteShortNameForTrain        ,

        getTrainsServicingStop               : getTrainsServicingStop               ,
        getTrainsServicingStopForRoute       : getTrainsServicingStopForRoute       ,

        getTrainArrivalTimeForStop           : getTrainArrivalTimeForStop           ,
        getTrainDepartureTimeForStop         : getTrainDepartureTimeForStop         ,
    };
}



module.exports = {
    newGTFS_Realtime_Object : newGTFS_Realtime_Object,
};