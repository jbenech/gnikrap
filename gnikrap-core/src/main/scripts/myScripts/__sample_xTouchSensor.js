///////////////////////////////////////////////////////////////////////////////
// This script show how to pilot a crawler robot like the TRACK3R (mission 2)
//
// Note: Please adjust the port to what is physically connected on your brick.
///////////////////////////////////////////////////////////////////////////////

// Initialization
var left = ev3.getBrick().getLargeMotor("D");
var right = ev3.getBrick().getLargeMotor("A");
var xTouch = ev3.getXSensor("xTouch");


// Main loop - This is the main program
while(ev3.isOk()) {
    var val = xTouch.getValue();

    if(val.isStarted()) {
        var left = val.containsTouch("left") && !val.containsTouch("right");
        var right = val.containsTouch("right") && !val.containsTouch("left");
        
        // Left motor
        if(val.containsTouch("up")) {
            if(left) {
                leftMotor.stop();
                rightMotor.forward();
            } else if(right) {
                leftMotor.forward();
                rightMotor.stop();
            } else {
                leftMotor.forward();
                rightMotor.forward();
            } 
        } else if(val.containsTouch("down")) {
            if(left) {
                leftMotor.backward();
                rightMotor.stop();
            } else if(right) {
                leftMotor.stop();
                rightMotor.backward();
            } else {
                leftMotor.backward();
                rightMotor.backward();
            } 
        } else {
            if(left) {
                leftMotor.forward();
                rightMotor.backward();
            } else if(right) {
                leftMotor.backward();
                rightMotor.forward();
            } else {
                leftMotor.stop();
                rightMotor.stop();
            }
        }
    } else {
        leftMotor.stop();
        rightMotor.stop();
    }
}

// Finalization
// None (motors will be automatically stopped)
