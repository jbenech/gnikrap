///////////////////////////////////////////////////////////////////////////////
// Note: Please adjust the port to what is physically connected on your brick.
//
// For more details on this sample, please see 'A robot that stay in the video'
// in the documentation
///////////////////////////////////////////////////////////////////////////////

// Initialization
var leftMotor = ev3.getBrick().getLargeMotor("D");
var rightMotor = ev3.getBrick().getLargeMotor("A");
var xVideo = ev3.getXSensor("xVideo");

// The margin in order to consider that we reach the border
var borderMargin = 80; 

// Motor should not go too fast in order to don't "loose" the ev3
leftMotor.setSpeedPercent(30);
rightMotor.setSpeedPercent(30);

// Function in order to check if the ev3 is near from the xSensor "vision" border
function isNearToBorder(visibleObject) {
    return (visibleObject.getX() < borderMargin) || (visibleObject.getY() < borderMargin) 
        || ((visibleObject.getX() + borderMargin) > 640) || ((visibleObject.getY() + borderMargin) > 480);
}

// Function to move backward and make a random turn
function backwardAndTurnRandomly() {
    leftMotor.rotate(-360, true);
    rightMotor.rotate(-360);
    
    var r = 180 + Math.random() * 270;
    leftMotor.rotate(r, true);
    rightMotor.rotate(-r);
}

function stopMotors() {
    leftMotor.stop();
    rightMotor.stop();
}

// Main loop - This is the main program
while(ev3.isOk()) {
    var val = xVideo.getValue();

    if(val.isStarted()) {
        if(val.containsObject("ev3")) {
            if(isNearToBorder(val.getObject("ev3"))) {
                ev3.notify("Close to the border " + val.getObject("ev3") + ", need to change direction");
                backwardAndTurnRandomly();
            } else {
                leftMotor.forward();
                rightMotor.forward();
            }
        } else {
            stopMotors();
            ev3.notify("I don't find the 'ev3', please select it !");
            ev3.sleep(200);
        }
    } else {
        stopMotors();
        ev3.notify("I don't see nothing, please start the xVideo sensor !");
        ev3.sleep(200);
    }
}

// Finalization
// None (motors will be automatically stopped)
