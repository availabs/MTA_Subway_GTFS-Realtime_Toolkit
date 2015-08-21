/**
 *
 *
 * @module "MTA_Subway_GTFS-Realtime_Toolkit"
 * @summary  "Reads the NYCT Subway's GTFS-Realtime feed, converting the protobuf message to JSON. 
 *            Offers a layer of abtraction through an indexed JS object with accessor functions for message data."
 *
 */

module.exports = {
    Wrapper             : require('./lib/Wrapper')                                 ,
    FeedReader          : require('GTFS-Realtime_Toolkit').FeedReader              ,
    ObjectStreamFactory : require('./lib/ObjectStreamFactory').ObjectStreamFactory ,
};
