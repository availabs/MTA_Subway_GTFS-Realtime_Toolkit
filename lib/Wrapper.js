/**
 *
 * @module "MTA_Subway_GTFS-Realtime_Toolkit.Wrapper"
 *
 * see http://datamine.mta.info/sites/all/files/pdfs/GTFS-Realtime-NYC-Subway%20version%201%20dated%207%20Sep.pdf
 */

'use strict';


var _            = require('lodash'),
    SuperWrapper = require('GTFS-Realtime_Toolkit').Wrapper,
    indexers     = require('./Indexers'),
    timeUtils    = require('GTFS-Realtime_Toolkit').TimeUtils;


//========================= The Constructor and prototype ========================= 

/**
 * Creates a GTFS-Realtime Message Wrapper.
 * @constructor
 * @augments 'GTFS-Realtime Wrapper'
 * @param {Object} GTFSrt_JSON - The MTA Subway GTFS-Realtime message, in JSON format.
 */
function Wrapper (GTFSrt_JSON, GTFS) {
    SuperWrapper.call(this, GTFSrt_JSON, GTFS);

    this.agencyIds = (GTFS) ? GTFS.getAllAgencyIDs() : null;

    this.tripIDToTrainIDMap = indexers.buildTripToTrainMap(this.tripsIndex);
    this.trainIDToTripIDMap = indexers.buildTrainToTripMap(this.tripIDToTrainIDMap);
}


Wrapper.prototype = Object.create(SuperWrapper.prototype);


//=================================================================================





//======================== Adding methods to the prototype ======================== 

/**
 * @override
 * "The shape_id field contains an ID that defines a shape for the trip. 
 *  This value is referenced from the shapes.txt file. 
 *  The shapes.txt file allows you to define how a line 
 *  should be drawn on the map to represent a trip.
 * @param {string} tripKey - either trip_id or output of tripKeyBuilder
 * @return {string}
 */
Wrapper.prototype.getShapeIDForTrip = function (tripKey) {
    var startIndex = _.isString(tripKey) && (tripKey.lastIndexOf('_') + 1);

    return (startIndex) ? tripKey.substring(startIndex) : null;
};


/** 
 * @summary Get the trip_id for a train_id
 */
Wrapper.prototype.getTripIDForTrain = function (train_id) {
    return _.get(this, ['trainIDToTripIDMap', train_id], null);
};


/** 
 * @summary Get the trip_id for a train_id
 */
Wrapper.prototype.getTrainIDForTrip = function (trip_id) {
    return _.get(this, ['tripIDToTrainIDMap', trip_id], null);
};



/** 
 * @summary Get all trains in the message. 
 */
Wrapper.prototype.getAllMonitoredTrains = function () {
    return _.keys(this.trainIDToTripIDMap);
};

Wrapper.prototype.getTrainsWithAlertFilterObject = function (allTripsWithAlert) {
    var that = this,
        allTripsWithAlert = allTripsWithAlert || this.getAllTripsWithAlert() || []; //jshint ignore: line

    return allTripsWithAlert.reduce(function (acc, trip_id) {
        acc[that.getTrainIDForTrip(trip_id)] = 1;    

        return acc;
    }, {});
};


/** 
 * Get the Effective date of the base schedule.
 *  ??? Not necessarily the start_date ???
 *  "It should be noted that the service associated with 
 *      a single day's subway schedule is not necessarily confined to a twenty-four hour period."
 * @param   {String} trip_id - GTFS-Realtime trip_id
 * @returns {Date}
 * @summary Get the Effective date of the base schedule.
 */
Wrapper.prototype.getScheduleDateForTrip = function (trip_id) {
    var startDate         = this.getStartDateForTrip(trip_id)         , // Defined in the super class.
        encodedOriginTime = this.getEncodedOriginTimeForTrip(trip_id) ,
    
        scheduleDate;

    if ( !((typeof startDate === 'string') && (startDate.length === 8) && (encodedOriginTime !== null)) ) {
        return null;
    } 
  
    scheduleDate = new Date(startDate.slice(0, 4), startDate.slice(4,6), startDate.slice(6,8));

    if      ( encodedOriginTime < 0 )      { scheduleDate.setDate(scheduleDate.getDate() + 1); }
    else if ( encodedOriginTime > 144000 ) { scheduleDate.setDate(scheduleDate.getDate() - 1); }

    return scheduleDate;
};



/** 
 * From the GTFS-Realtime trip_id, get the string that may be a partial match with the GTFS trip_id.
 *  Note, this partial match is called the tripKey.  
 *  The GTFS indexers take a configuraion option that transforms the 
 *  GTFS tripIDs into this potential partial match key.
 * @param   {String} trip_id - GTFS-Realtime trip_id.
 * @returns {String} If the GTFS-Realtime trip is a scheduled trip in the GTFS data, the substring of the GTFS trip_id.
 * @summary Get the potential GTFS trip_id substring that map the tripKey to the GTFS schedule.
 */
Wrapper.prototype.getGTFSTripKeyForRealtimeTripKey = function (trip_id) {
    var tripDate ,
        day ,
        serviceCode;


    if (Array.isArray(this.agencyIds) && (this.agencyIds[0] === 'MTA NYCT')) {

        tripDate = this.getScheduleDateForTrip(trip_id) ;
        day = tripDate.getDay() ;

        if      (day === 0) { serviceCode = 'SUN'; } 
        else if (day === 6) { serviceCode = 'SAT'; }
        else                { serviceCode = 'WKD'; }

        return serviceCode + '_' + trip_id;

    } else {
        return trip_id;
    }
};


/**
 * Get the orign time from the trip, as encoded in the trip_id.
 * @param {String} trip_id - GTFS-Realtime trip_id
 * @returns {Number}
 */
Wrapper.prototype.getOriginTimeForTrip = function (trip_id) {
    var scheduleDate      = this.getScheduleDateForTrip(trip_id)      ,
        encodedOriginTime = this.getEncodedOriginTimeForTrip(trip_id) ;

    return timeUtils.getTimeStampForHundredthsOfMinutePastMidnight(scheduleDate, encodedOriginTime);
};



/**
 * Get the orign time from the trip, as encoded in the trip_id.
 * @param {String} trip_id - GTFS-Realtime trip_id
 * @returns {Number}
 */
Wrapper.prototype.getEncodedOriginTimeForTrip = function (trip_id) {
    var encodedOriginTime = parseInt((_.isString(trip_id) && trip_id.substring(0, trip_id.indexOf('_'))) || null);
        
    return (!isNaN(encodedOriginTime)) ? encodedOriginTime : null;
};


Wrapper.prototype.getTrainsServicingStop = function (stop_id) {
    var that = this,
        tripsServicing = this.getTripsServicingStop(stop_id);

    return _.map(tripsServicing, function (trip_id) {
        return _.get(that, ['tripIDToTrainIDMap', trip_id], null);
    });
};


Wrapper.prototype.getTrainsServicingStopForRoute = function (stop_id, route_id) {
    var that = this,
        tripsServicing = this.getTripsServicingStopForRoute(stop_id, route_id);

    return _.map(tripsServicing, function (trip_id) {
        return _.get(that, ['tripIDToTrainIDMap', trip_id], null);
    });
};

 /**
 * "The direction of the trip encoded in the trip_id.
 * @param {string|number} trip_id
 * @returns {number} route_id
 */
Wrapper.prototype.getRouteDirectionForTrip = function (trip_id) {
    var direction = (typeof trip_id === 'string') && trip_id.charAt(trip_id.lastIndexOf('.') + 1);
    return (direction) ? ((direction === 'N') ? 0 : 1) : null;
};
    


Wrapper.prototype.tripWasAssignedATrain = function (trip_id) {
    return !!_.get(this, 
                   ['tripsIndex', trip_id, 'TripUpdate', 'trip', '.nyct_trip_descriptor', 'is_assigned'], 
                   null);
};


 /**
  * "The motivation to include VehiclePosition is to provide the timestamp field. 
  *  This is the time of the last detected movement of the train. 
  *  This allows feed consumers to detect the situation when a train stops moving (aka stalled)."
  * @param {string|number} trip_id
  * @returns {number} 
  */
Wrapper.prototype.getVehiclePositionTimestamp = function (trip_id) {
    return  _.get(this, ['tripsIndex', trip_id, 'VehiclePosition', 'timestamp', 'low'], null);
};
 
Wrapper.prototype.getDirectionForTrip = function (trip_id) {
    var direction_id = _.get(this, 
                             ['tripsIndex', trip_id, 'TripUpdate', 'trip', '.nyct_trip_descriptor', 'direction'], 
                             null);

    return ((direction_id !== null) && (direction_id.toString)) ? direction_id.toString() : direction_id;
};


 /**
  * "For a train enroute, the actual track may differ from the scheduled track. 
  *  This could be the result of manually rerouting the train from its scheduled track. 
  *  When this occurs, prediction data may become unreliable since the train is no longer 
  *  operating in accordance to its schedule. The rules engine for the “countdown” clocks 
  *  will remove this train from all scheduled station signage. It is highly probable that 
  *  the train will be rerouted back to its schedule track at some future point. When this
  *  happens train prediction for this train will return to the “countdown” clocks."
  * @param {string|number} trip_id
  * @returns {boolean}
  */
Wrapper.prototype.trainServingTripIsOnScheduledTrack = function (trip_id) {
    var stopTimeUpdateForNextStop = this.getStopTimeUpdateForNextStopForTrip(trip_id),

        scheduledTrack = _.get(stopTimeUpdateForNextStop, ['.nyct_stop_time_update', 'scheduled_track'], null) ,
        actualTrack    = _.get(stopTimeUpdateForNextStop, ['.nyct_stop_time_update', 'actual_track'], null)     ;

    return (scheduledTrack === actualTrack);
};
  
//=================================================================================



module.exports = Wrapper;


