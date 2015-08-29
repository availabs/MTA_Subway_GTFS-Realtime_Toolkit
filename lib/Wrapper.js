/**
 *
 * @module "MTA_Subway_GTFS-Realtime_Toolkit.Wrapper"
 *
 * see http://datamine.mta.info/sites/all/files/pdfs/GTFS-Realtime-NYC-Subway%20version%201%20dated%207%20Sep.pdf
 */

'use strict';


var _            = require('lodash'),
    SuperWrapper = require('GTFS-Realtime_Toolkit').Wrapper,
    indexers     = require('./Indexers');




//========================= The Constructor and prototype ========================= 

/**
 * Creates a GTFS-Realtime Message Wrapper.
 * @constructor
 * @augments 'GTFS-Realtime Wrapper'
 * @param {Object} GTFSrt_JSON - The MTA Subway GTFS-Realtime message, in JSON format.
 */
function Wrapper (GTFSrt_JSON) {
    SuperWrapper.call(this, GTFSrt_JSON);

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
 * @summary Get all trains in the message. 
 */
Wrapper.prototype.getAllMonitoredTrains = function () {
    return _.keys(this.trainIDToTripIDMap);
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
    var startDate  = this.getStartDateForTrip(trip_id)  ,  // In the (super class) GTFS-Realtime Wrapper API.
        originTime = this.getOriginTimeForTrip(trip_id) ,
    
        scheduleDate  = new Date(startDate);

    if      ( originTime < 0 )      { scheduleDate.setDate(scheduleDate.getDate() + 1); }
    else if ( originTime > 144000 ) { scheduleDate.setDate(scheduleDate.getDate() - 1); }

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
Wrapper.prototype.getGTFSTripKeyForRealtimeTripID = function (trip_id) {
    var tripDate     = this.getScheduleDateForTrip(trip_id),
        day          = tripDate.getDay(),
        serviceCode;

    if      (day === 0) { serviceCode = 'SUN'; } 
    else if (day === 6) { serviceCode = 'SAT'; }
    else                { serviceCode = 'WKD'; }

    return serviceCode + '_' + trip_id;
};


/**
 * Get the orign time from the trip, as encoded in the train_id.
 * @param {String} trip_id - GTFS-Realtime trip_id
 * @returns {Number}
 */
Wrapper.prototype.getOriginTimeForTrip = function (trip_id) {
    var trainID = _.get(this, ['tripIDToTrainIDMap', trip_id], null),
        encodedOriginTime = _.isString(trainID) && trainID.substring(0, trainID.indexOf('_'));

    return (_.isNull(encodedOriginTime)) ? parseInt(encodedOriginTime) : null;
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

//=================================================================================



module.exports = Wrapper;

