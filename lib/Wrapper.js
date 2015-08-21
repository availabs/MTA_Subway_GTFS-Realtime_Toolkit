'use strict';


var _           = require('lodash'),
    gtfsWrapper = require('GTFS-Realtime_Toolkit').Wrapper,
    theAPI      = require('./WrapperAPI');



function newGTFSRealtimeObject (GTFSrt_JSON) {
    var baseGTFSrtObj = gtfsWrapper.newGTFSRealtimeObject(GTFSrt_JSON);

    return _.merge(baseGTFSrtObj, theAPI);
}


module.exports = {
    newGTFSRealtimeObject : newGTFSRealtimeObject,
};
