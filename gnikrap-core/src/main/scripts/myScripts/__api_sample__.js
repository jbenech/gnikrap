// ////////////////////////////////////////////////////////////////////////////
// Motor API

/*
var largeMotor = ev3.getBrick().getLargeMotor("B");

// Rotate and wait end of rotation
largeMotor.rotate(360);
largeMotor.setSpeedPercent(100);
largeMotor.rotate(-360);

// Retrieve tacho
largeMotor.rotate(60);
ev3.notify("TachoA: " + largeMotor.getTachoCount());
largeMotor.rotate(-60);
ev3.notify("TachoB: " + largeMotor.getTachoCount());
largeMotor.resetTachoCount();
ev3.notify("TachoC: " + largeMotor.getTachoCount());

// Rotate and don't wait
var tacho;
largeMotor.rotate(360 * 3, true);
while((tacho = largeMotor.getTachoCount()) < 1000) {
  ev3.notify("Tacho: " + tacho);
  ev3.sleep(200);
}
*/



// ////////////////////////////////////////////////////////////////////////////
// Color sensor API

/*
// Reflected light API
var colorSensor = ev3.getBrick().getColorSensor("S1");
while(ev3.isOk()) {
  ev3.notify("Reflected light: " + colorSensor.getReflectedLight());
  ev3.sleep(200);
}
*/

/*
// Ambient light API
var colorSensor = ev3.getBrick().getColorSensor("S1");
while(ev3.isOk()) {
  ev3.notify("Ambient light: " + colorSensor.getAmbientLight());
  ev3.sleep(200);
}
*/

/*
// Color API
var colorSensor = ev3.getBrick().getColorSensor("S1");
while(ev3.isOk()) {
  ev3.notify("Color: " + colorSensor.getColor());
  ev3.sleep(200);
}
*/



// ////////////////////////////////////////////////////////////////////////////
// IR sensor API

/*
// Distance API
var irSensor = ev3.getBrick().getIRSensor("S1");
while(ev3.isOk()) {
  ev3.notify("Distance: " + irSensor.getDistance());
  ev3.sleep(200);
}
*/

/*
// Seek beacon API
var irSensor = ev3.getBrick().getIRSensor("S1");
while(ev3.isOk()) {
  var x = irSensor.seekBeacon();
  ev3.notify("Beacon found: " + x.isBeaconFound() + ", bearing: " + x.getBearing() + ", distance: " + x.getDistance());
  ev3.sleep(200);
}
*/

/*
// Remote control API
var irSensor = ev3.getBrick().getIRSensor("S1");
while(ev3.isOk()) {
  var x = irSensor.getRemoteCommand();
  ev3.notify("value: " + x.getValue() + 
            ", tl: " + x.isTopLeftEnabled() + ", tr: " + x.isTopRightEnabled() + 
            ", bl: " + x.isBottomLeftEnabled() + ", br: " + x.isBottomRightEnabled() + 
            ", bea: " + x.isBeaconEnabled() + " nothing: " + x.isNothingEnabled());
  ev3.sleep(200);
}
*/



// ////////////////////////////////////////////////////////////////////////////
// Touch sensor sensor API

/*
// Touch sensor API
var touchSensor = ev3.getBrick().getTouchSensor("S1");
while(ev3.isOk()) {
  ev3.notify("Push button: " + touchSensor.isPushed());
  ev3.sleep(200);
}
*/




// ////////////////////////////////////////////////////////////////////////////
// Keyboard API

/*
// Keyboard API
var enterKey = ev3.getBrick().getKeyboard().getEnter();
ev3.notify("Press enter to continue");
while(enterKey.isUp() && ev3.isOk()) {
  ev3.sleep(200);
}
ev3.notify("Enter - Down: " + enterKey.isDown() + " / Up: " + enterKey.isUp());
*/




// ////////////////////////////////////////////////////////////////////////////
// Led API

/*
// Led API
var leds = ev3.getBrick().getLed();
leds.lightGreen();
ev3.sleep(2000);
leds.lightOrange().blink();
ev3.sleep(2000);
leds.lightRed().blink().blink();
ev3.sleep(2000);
leds.off();
*/



// ////////////////////////////////////////////////////////////////////////////
// Sound API

/*
// Sound API
var sound = ev3.getBrick().getSound();
sound.setVolume(90);
sound.beep();
for(freq = 50; freq < 1500; freq = freq + 10) {
  sound.playTone(freq, 5);
}
sound.playNote("Do", 500);
sound.playNote("Re", 500);
sound.playNote("Mi", 500);
sound.playNote("Fa", 500);
sound.playNote("Sol", 500);
sound.playNote("La", 500);
sound.playNote("Si", 500);
*/



// ////////////////////////////////////////////////////////////////////////////
// Battery API

/*
// Battery API
var battery = ev3.getBrick().getBattery();
ev3.notify("Battery current: " + battery.getBatteryCurrent());
ev3.notify("Motor current: " + battery.getMotorCurrent());
ev3.notify("Voltage: " + battery.getVoltageMilliVolt());
*/


// ////////////////////////////////////////////////////////////////////////////
// Screen API

/*
// Screen API
var screen = ev3.getBrick().getScreen();

screen.clear();

screen.drawText("Hello world !", 0, 0);

screen.drawLine(5, 20, 120, 20);

screen.drawRectangle(10, 30, 20, 30);
screen.fillRectangle(40, 30, 30, 20);

screen.drawCircle(90, 40, 15);
screen.fillCircle(130, 40, 15);

screen.drawArc(10, 70, 20, 30, 0, 180);
screen.fillArc(10, 70, 20, 30, 180, 180);


ev3.sleep(5000);
*/

// ////////////////////////////////////////////////////////////////////////////
// xTouch XSensor

/*
// xTouch XSensor
// Configure the xTouch sensor with at least one touch "up"
var xTouch = ev3.getXSensor("xTouch");
while(ev3.isOk()) {
  var value = xTouch.getValue();
  if(value.isStarted()) {
    if(value.containsTouch("up")) {
      ev3.notify("You have clicked the 'up' touch !");
    } else {
      ev3.notify("Click on 'up'");
    }
  }
  
  ev3.sleep(100);
}
*/



// ////////////////////////////////////////////////////////////////////////////
// xGyro XSensor

/*
// xGyro XSensor
var xGyro = ev3.getXSensor("xGyro");

while(ev3.isOk()) {
  var value = xGyro.getValue();
  if(value.isStarted()) {
    var y = value.getY().getAngle();
    var x = value.getX().getAngle();
    
    ev3.notify("XGyro - x: " + x + ", y: " + y);
  }
  
  ev3.sleep(100);
}
*/



// ////////////////////////////////////////////////////////////////////////////
// xVideo XSensor

/*
// xVideo XSensor
// Configure the xVideo sensor to track one object called "myTarget"
var xVideo = ev3.getXSensor("xVideo");
while(ev3.isOk()) {
  var value = xVideo.getValue();
  if(value.isStarted()) {
    if(value.containsObject("myTarget")) {
      var t = value.getObject("myTarget");
      ev3.notify("Target found: [" + t.getX() + ", " + t.getY() + "]");
    } else {
      ev3.notify("Hey, select a target and call it 'myTarget'");
    }
  }
  
  ev3.sleep(100);
}
*/
