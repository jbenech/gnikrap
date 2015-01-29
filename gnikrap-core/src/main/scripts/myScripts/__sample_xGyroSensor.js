///////////////////////////////////////////////////////////////////////////////
// Note: Please adjust the port to what is physically connected on your brick.
//
// For more details on this sample, please see 'A robot controlled with the 
// xGyro sensor' in the documentation
///////////////////////////////////////////////////////////////////////////////

// Initialization
var left = ev3.getBrick().getLargeMotor("D");
var right = ev3.getBrick().getLargeMotor("A");
var xGyro = ev3.getXSensor("xGyro");


// Define a function that activate (or not) one motor with the given percentage (positive or negative)
function activateMotor(motor, powerInPercent) {
    if(Math.abs(powerInPercent) < 10) {
        motor.stop();
    } else if(powerInPercent > 10) {
        motor.setSpeedPercent(powerInPercent);
        motor.forward();
    } else if(powerInPercent < 10) {
        motor.setSpeedPercent(-powerInPercent);
        motor.backward();
    }
}


// Main loop - This is the main program
while(ev3.isOk()) {
    var gyro = xGyro.getValue();

    if(gyro.isStarted()) {
        var y = gyro.getX().getAngle();
        var x = gyro.getY().getAngle();
        
        var leftPower = 0;
        if(x > 10) {
            leftPower = -(Math.min(Math.round(2*x), 100)); // Back (-) => Forward (+)
        } else if(x < -10) {
            leftPower = Math.min(Math.round(2*-x), 100);
        }
        var rightPower = leftPower;
        
        if(y > 10) {
            if(leftPower >= 0) {
                leftPower += Math.min(Math.round(y), 50);
                if(rightPower == 0) {
                    rightPower = - leftPower;
                }
            } else {
                leftPower -= Math.min(Math.round(y), 50);
            }
        } else if(y < -10) {
            if(rightPower >= 0) {
                rightPower += Math.min(Math.round(-y), 50);
                if(leftPower == 0) {
                    leftPower = -rightPower;
                }
            } else {
                rightPower -= Math.min(Math.round(-y), 50);
            }
        }
        
        activateMotor(left, leftPower);
        activateMotor(right, rightPower);
    } else {
        activateMotor(left, 0);
        activateMotor(right, 0);
    }
}

// Finalization
// None (motors will be automatically stopped)
