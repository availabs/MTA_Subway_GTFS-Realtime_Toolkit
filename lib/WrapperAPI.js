'use strict';


/* jshint unused:false */


var _          = require('lodash'),

    timeUtils  = require('./utils/timeUtils');


// Note: `this` also has the methods and data of the base GTFS_Toolkit.Wrapper.

var theAPI = {

    getAllMonitoredTrains : function () {
        return _.keys(this.trainToTripMap);
    },


    getTripScheduleDateForTripID : function (tripID) {
        var startDate  = this.getStartDateForTripID(tripID)  ,  // In the GTFS Wrapper API.
            originTime = this.getOriginTimeForTripID(tripID) ,
        
            scheduleDate  = new Date(startDate);

        if      ( originTime < 0 )      { scheduleDate.setDate(scheduleDate.getDate() + 1); }
        else if ( originTime > 144000 ) { scheduleDate.setDate(scheduleDate.getDate() - 1); }

        return scheduleDate;
    },


    getGTFSTripKeyForRealtimeTripID : function (tripID) {
        var tripDate     = this.getTripScheduleDateForTripID(tripID),
            day          = tripDate.getDay(),
            serviceCode;

        if      (day === 0) { serviceCode = 'SUN'; } 
        else if (day === 6) { serviceCode = 'SAT'; }
        else                { serviceCode = 'WKD'; }

        return serviceCode + '_' + tripID;
    },

    getOriginTimeForTripID : function (tripID) {
        var trainID = this.tripToTrainMap(tripID);

        return parseInt(tripID.substring(0, tripID.indexOf('_'))); // FIXME FIXME FIXME
    },
};

module.exports = theAPI;
