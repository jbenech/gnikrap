// Initialization
var leftMotor = ev3.getBrick().getLargeMotor("C");
leftMotor.setSpeed(90);
var rightMotor = ev3.getBrick().getLargeMotor("B");
rightMotor.setSpeed(90);
var medMotor = ev3.getBrick().getMediumMotor("A");
medMotor.setSpeed(75);
var irSensor = ev3.getBrick().getIRSensor("4");
var touchSensor = ev3.getBrick().getTouchSensor("2");


// Main loop
while(ev3.isRunning()) {
    var rc = irSensor.getRemoteCommand();
    // Left motor
    if(rc.isTopLeftEnabled()) {
        leftMotor.backward();
    } else if(rc.isBottomLeftEnabled()) {
        leftMotor.forward();
    } else {
        leftMotor.stop();
    }
    // Right motor
    if(rc.isTopRightEnabled()) {
        rightMotor.backward();
    } else if(rc.isBottomRightEnabled()) {
        rightMotor.forward();
    } else {
        rightMotor.stop();
    }
    // Fire
    if(rc.isBeaconEnabled()) {
        medMotor.rotate(3* 360);
        while(irSensor.getRemoteCommand().isBeaconEnabled() && ev3.isRunning()) {
        }
    }
    // Knock detection
    if(touchSensor.isPushed()) {
        leftMotor.forward();
        rightMotor.forward();
        ev3.sleep(1.5);
    }
}


// Finalization
// None (motors will be automatically stopped)
