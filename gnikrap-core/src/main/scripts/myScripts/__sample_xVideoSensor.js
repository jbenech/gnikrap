///////////////////////////////////////////////////////////////////////////////
// This script show how to pilot a crawler robot like the TRACK3R (mission 2)
//
// Note: Please adjust the port to what is physically connected on your brick.
///////////////////////////////////////////////////////////////////////////////

// Initialization
var left = ev3.getBrick().getLargeMotor("D");
var right = ev3.getBrick().getLargeMotor("A");
var xVideo = ev3.getXSensor("xVideo");


// Main loop - This is the main program
while(ev3.isOk()) {
    var val = xTouch.getValue();

    if(val.isStarted()) {
        // TODO

    } else {
        leftMotor.stop();
        rightMotor.stop();
    }
}

// Finalization
// None (motors will be automatically stopped)
