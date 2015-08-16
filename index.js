/**
 *
 *
 * @module "MTA_Subway_GTFS-Realtime_Toolkit"
 * @summary  "Reads the NYCT Subway's GTFS-Realtime feed, converting the protobuf message to JSON. 
 *            Offers a layer of abtraction through an indexed JS object with accessor functions for message data."
 *
 */

module.exports = {
    GTFS_Realtime_Wrapper    : require('./lib/GTFS-Realtime_Wrapper')         ,
    GTFS_Realtime_FeedReader : require('./lib/GTFS-GTFS_Realtime_FeedReader') ,
};
