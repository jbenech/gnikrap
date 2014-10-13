gnikrap
=======

## Why gnikrap ?

Currently to program the Lego Mindstrom EV3, you have choice on several kind of tools:
* The software provided by Lego:
  * Pros: 
    * Simple programs (eg. actions in reactions to sensor values) are very simple to do
    * Very simple for children usage
  * Cons:
    * Complex programs are a mess to write
    * The GUI can be improved
    * Need a computer (Mac or Windows) to work
* Library/development environment which need a compiler (lejos, MonoBrick, etc.):
  * Pro:
    * Can write any kind of program (simple to very complex)
    * Best of bread languages
    * Full featured framework with access to all the Lego sensors and a lot of third party sensor
  * Cons:
    * Learning curve can be too long for children (need to know an IDE, a language, a library, etc.)
    * Need a computer (Mac, Windows or Linux) and a development environment in order to work


The aim of gnikrap is to provide another way by providing a scripting environment that run on the EV3.
This environment will enable the user to develop scripts directly in the browser without any IDE:
  * Pro:
    * Quite simple to use
    * Can be used on a computer or a tablet
    * Can use several scripting engine: javascript, groovy, etc.
    * Can use computer/tablet "sensor" (see below)
  * Cons:
    * Currently no access to a full featured API
    * Scripts are slower to execute than compiled code

In a forthcoming version, the aim is to add the ability to use in the scripts the sensors of the
computer/tablet (tactile-screen, webcam, gyroscope, etc.).

## How to install ?

In order to install gnikrap... TODO
