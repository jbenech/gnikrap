///////////////////////////////////////////////////////////////////////////////
// Note: Please adjust the port to what is physically connected on your brick.
//
// For more details on this sample, please see 'A robot controlled with the 
// xTouch sensor' in the documentation
///////////////////////////////////////////////////////////////////////////////

// Initialization
var leftMotor = ev3.getBrick().getLargeMotor("D");
var rightMotor = ev3.getBrick().getLargeMotor("A");
var xTouch = ev3.getXSensor("xTouch");

function activateMotor(motor, powerInPercent) {
    if(powerInPercent < 0) {
        motor.setSpeedPercent(-powerInPercent);
        motor.backward();
    } else if(powerInPercent > 0) {
        motor.setSpeedPercent(powerInPercent);
        motor.forward();
    } else {
        motor.stop();
    }
}

function activateLeftAndRightMotor(leftPowerInPercent, rightPowerInPercent) {
    activateMotor(leftMotor, leftPowerInPercent);
    activateMotor(rightMotor, rightPowerInPercent);
}

// Main loop - This is the main program
while(ev3.isOk()) {
    var val = xTouch.getValue();

    if(val.isStarted()) {
        var up = val.containsTouch("up") && !val.containsTouch("down");
        var down = val.containsTouch("down") && !val.containsTouch("up");
        var left = val.containsTouch("left") && !val.containsTouch("right");
        var right = val.containsTouch("right") && !val.containsTouch("left");
        
        if(up) {
            if(left) {
                activateLeftAndRightMotor(50, 90);
            } else if(right) {
                activateLeftAndRightMotor(90, 50);
            } else {
                activateLeftAndRightMotor(90, 90);
            } 
        } else if(down) {
            if(left) {
                activateLeftAndRightMotor(-50, -90);
            } else if(right) {
                activateLeftAndRightMotor(-90, -50);
            } else {
                activateLeftAndRightMotor(-90, -90);
            } 
        } else {
            if(left) {
                activateLeftAndRightMotor(-50, 50);
            } else if(right) {
                activateLeftAndRightMotor(50, -50);
            } else {
                activateLeftAndRightMotor(0, 0);
            }
        }
    } else {
        activateLeftAndRightMotor(0, 0);
    }
}

// Finalization
// None (motors will be automatically stopped)
