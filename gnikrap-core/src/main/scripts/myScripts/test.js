// Initialization
var leftMotor = ev3.getBrick().getLargeMotor("C");
leftMotor.setSpeed(90);
var rightMotor = ev3.getBrick().getLargeMotor("B");
rightMotor.setSpeed(90);
var medMotor = ev3.getBrick().getMediumMotor("A");
medMotor.setSpeed(75);

function avance() {
    var multiple = -4.1;
    leftMotor.rotate(multiple*360, true);
    rightMotor.rotate(multiple*360, true);
    while(rightMotor.isMoving() && ev3.isRunning()) { }
}

function recule() {
    var multiple = -4.1;
    leftMotor.rotate(multiple*360, true);
    rightMotor.rotate(multiple*360, true);
    while(rightMotor.isMoving() && ev3.isRunning()) { }
}

function tourneDroite() {
    var multiple = -1.4;
    leftMotor.rotate(multiple*360, true);
    rightMotor.rotate(multiple*-360, true);
    while(rightMotor.isMoving() && ev3.isRunning()) { }
}

function tourneGauche() {
    var multiple = 1.4;
    leftMotor.rotate(multiple*360, true);
    rightMotor.rotate(multiple*-360, true);
    while(rightMotor.isMoving() && ev3.isRunning()) { }
}

