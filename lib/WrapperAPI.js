'use strict';


/* jshint unused:false */


var _          = require('lodash'),

    timeUtils  = require('./utils/timeUtils');


// Requires being merged into object with the GTFSrt_JSON and the indices.
// `this` in the functions then has 
//      * the GTFSrt_JSON, 
//      * the indices, 
//      * the functions in the API.
//
// Note: The purpose for the heavy use of this
//          is to define all these once
//          and reuse them for the various 
//
var theAPI = {

    getTrainIDForTripID : function (tripID) {
        var indexNode = this.tripsIndex[tripID];

        return _.get(indexNode , ['tripUpdate'     , 'trip', 'nyct_trip_descriptor', 'train_id'])   ||
               _.get(indexNode , ['vehiclePosition', 'trip', 'nyct_trip_descriptor', 'train_id'])   ||
               _.get(indexNode , ['alerts',          'trip', 'nyct_trip_descriptor', 'train_id'], null) ;
    },


    getAllMonitoredTrains : function () {
        return _.keys(this.trainsIndex);
    },


    getTripScheduleDateForTripID : function (tripID) {
        var startDate  = this.getStartDateForTripID(tripID),
            originTime = this.getOriginTimeForTripID(tripID),
        
            scheduleDate  = new Date(startDate);

        if      ( originTime < 0 )      { scheduleDate.setDate(scheduleDate.getDate() + 1); }
        else if ( originTime > 144000 ) { scheduleDate.setDate(scheduleDate.getDate() - 1); }

        return scheduleDate;
    },


    getStaticTripKeyForRealtimeTripID : function (tripID) {
        var tripDate     = this.getTripScheduleDateForTripID(tripID),
            day          = tripDate.getDay(),
            serviceCode;

        if      (day === 0) { serviceCode = 'SUN'; } 
        else if (day === 6) { serviceCode = 'SAT'; }
        else                { serviceCode = 'WKD'; }

        return serviceCode + '_' + tripID;
    },

    getOriginTimeForTripID : function (tripID) {
        var trainID = this.getTrainIDForTripID(tripID);

        return parseInt(tripID.substring(0, tripID.indexOf('_'))); // FIXME FIXME FIXME
    },

};
//
//*************************************************************

module.exports = theAPI;

