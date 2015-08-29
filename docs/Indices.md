#The MTA_Subway_GTFS-Realtime Indices

This module extends the GTFS-Realtime_Toolkit to handle the MTA extensions of the standard.

The GTFS-Realtime_Toolkit creates indices on the GTFS-Realtime Message JSON object. 
These indices provide O(1) lookup times for the Wrapper accessor methods.
See the GTFS-Realtime_Toolkit indices [documentation]() for an explanation of the base indices.

This module adds two indices. These provide easy mapping between the trips and the trains assigned to them.

##tripIDToTrainIDMap
This index maps trip_ids to the train_id of the vehicle assigned to the trip.

##trainIDToTripIDMap
This index maps train_id of a vehicle to trip_id of the trip to which the vehicle is assigned.
