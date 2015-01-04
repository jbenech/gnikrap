///////////////////////////////////////////////////////////////////////////////
// This script show how to pilot a crawler robot like the TRACK3R (mission 2)
//
// Note: Please adjust the port to what is physically connected on your brick.
///////////////////////////////////////////////////////////////////////////////

// Initialization
var leftMotor = ev3.getBrick().getLargeMotor("D");
leftMotor.setSpeedPercent(90);
var rightMotor = ev3.getBrick().getLargeMotor("A");
rightMotor.setSpeedPercent(90);
var medMotor = ev3.getBrick().getMediumMotor("C");
medMotor.setSpeedPercent(50);
var irSensor = ev3.getBrick().getIRSensor("1");
var touchSensor = ev3.getBrick().getTouchSensor("4");
var origin = false;


// Main loop
while(ev3.isRunning()) {
    var rc = irSensor.getRemoteCommand();
    // Left motor
    if(rc.isTopLeftEnabled()) {
        leftMotor.forward();
    } else if(rc.isBottomLeftEnabled()) {
        leftMotor.backward();
    } else {
        leftMotor.stop();
    }
    // Right motor
    if(rc.isTopRightEnabled()) {
        rightMotor.forward();
    } else if(rc.isBottomRightEnabled()) {
        rightMotor.backward();
    } else {
        rightMotor.stop();
    }
    
    // Fire
    if(touchSensor.isPushed() == false && origin == false) {
        medMotor.backward();
    } else {
        medMotor.stop(false);
        origin = true;
    }
    
    if(rc.isBeaconEnabled() && origin == true) {
        medMotor.stop();
        medMotor.setSpeedPercent(100);
        medMotor.rotate(90);
        medMotor.setSpeedPercent(50);
        origin = false;

        while(irSensor.getRemoteCommand().isBeaconEnabled() && ev3.isRunning()) {
            // Wait that the beacon button was released
        }
    }
}


// Finalization
// None (motors will be automatically stopped)
