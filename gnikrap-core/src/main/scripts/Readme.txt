History:

 0.1.0 (private release): 
    - Proof of concept: Ensure that the performance reached are acceptable.
    - Simple API to manipulate the EV3 brick:
      - Battery
      - Sound: play tone, play note
      - Keyboard: leds and buttons
      - Screen: only clear :-(
      - Touch sensor
      - Color Sensor: reflected, ambiant, color
      - IR Sensor: distance, seek beacon, remote command
      - Motors: speed, rotate, tacho "sensor", forward, backward

 0.2.0:
    - Load/Delete/Save script added
    - About box added
    - Internationalization (GUI, ...)
    - Jackson JSON parser replaced by 'minimal-json' which is faster on the EV3 hardware
 


Known defects:
 - Fix screen API - only clear working (Checked with lejos 0.6.0-alpha, to be confirmed with lejos-0.8.1-beta)

 
Features (no specific order): 
 - Add import/export
 - Add "external" sensors
 - Add real time sensor probes
 - Add port checking (auto detection for EV3 devices)
 - Add the ability to choose script language (by simply adding jars within the lib folders)
 - Add a packing simple to use (write the SD card and play)
 - Exit script feature (is return work ?)
