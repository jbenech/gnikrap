///////////////////////////////////////////////////////////////////////////////// This script show how to follow a line//// The main principle is to follow the edge of the line (which we will consider black)//// Note: Please adjust the port to what is physically connected on your brick.////////////////////////////////////////////////////////////////////////////////////////////////// Initializationvar leftMotor = ev3.getBrick().getLargeMotor("C");var rightMotor = ev3.getBrick().getLargeMotor("B");var irSensor = ev3.getBrick().getIRSensor("4");var colorSensor = ev3.Brick().getColorSensor("1");var lineLightLevel = 0, floorLightLevel = 0; // Values defined latter////////////////////////////////////////////////// You can also define functions here if needed// A function that wait that the enter key was pressedfunction waitEnterKeyPressed() {    while(ev3.isRunning() && enterKey.isUp()) {        ev3.sleep(200); // Wait the enter key was pressed    }}// A function that perform several acquisition and returns the meanfunction meanReflectedLight(numberOfReading) {    var total = 0;    for(var i = 0; i < numberOfReading; i++) {        total = total + colorSensor.getReflectedLight();    }    return (total / numberOfReading);}// We now define several algorithm that drive the robot according to the light level read// The most simple function is, if we see black, turn right, if we see white, turn left.// With this function the speed must be quite slow (otherwise we will be quickly "lost")function simpleDrive(light) {    if(light < (lineLightLevel - floorLightLevel) / 2) {        // Turn right        leftMotor.setSpeedPercent(30);        leftMotor.forward();        rightMotor.setSpeedPercent(10);        rightMotor.forward();    } else {        // Turn left        rightMotor.setSpeedPercent(30);        rightMotor.forward();        leftMotor.setSpeedPercent(10);        leftMotor.forward();    }}// With the "simpleDrive", the robot never goes straight. We try to fix this issue with this// function: 3 possible position, turn left, go straight and turn right.function drive(light) {    var threshold = (lineLightLevel - floorLightLevel) / 3;    if(light < (floorLightLevel + threshold) {        // Turn right        leftMotor.setSpeedPercent(30);        leftMotor.forward();        rightMotor.setSpeedPercent(10);        rightMotor.forward();    } else if(light > (lineLightLevel - threshold)) {        // Turn left        rightMotor.setSpeedPercent(30);        rightMotor.forward();        leftMotor.setSpeedPercent(10);        leftMotor.forward();    } else {        // Go straight (a bit faster)        rightMotor.setSpeedPercent(40);        rightMotor.forward();        leftMotor.setSpeedPercent(40);        leftMotor.forward();    }}/////////////////////////////////// Perform calibration if needed// Here we want to perform calibration on the reflected light level of the line and the floorev3.notify("Put the sensor on the line and press the enter key");waitEnterKeyPressed();var lineLightLevel = meanReflectedLight(10); // Perform 10 reading in order to avoid bad readingev3.notify("Put the sensor not on the line and press the enter key");waitEnterKeyPressed();var floorLightLevel = meanReflectedLight(10); // Perform 10 reading in order to avoid bad reading/////////////// Main loopwhile(ev3.isRunning()) {    var light = colorSensor.getReflectedLight();    simpleDrive(light);    // drive(light);}// Finalization// None (motors will be automatically stopped)