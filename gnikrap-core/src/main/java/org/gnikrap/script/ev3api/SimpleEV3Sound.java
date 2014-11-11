/*
 * Gnikrap is a simple scripting environment for the Lego Mindstrom EV3
 * Copyright (C) 2014 Jean BENECH
 * 
 * Gnikrap is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * Gnikrap is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Gnikrap.  If not, see <http://www.gnu.org/licenses/>.
 */
package org.gnikrap.script.ev3api;

import lejos.hardware.Audio;
import lejos.hardware.BrickFinder;
import lejos.hardware.Sounds;

import org.gnikrap.utils.MapBuilder;

/**
 * Enable the play sounds with the HW.
 */
final public class SimpleEV3Sound implements EV3Device {

  private final Audio audio;
  private int volume;

  public SimpleEV3Sound() {
    audio = BrickFinder.getLocal().getAudio();
  }

  @Override
  public void release() {
    // Does nothing, Sound is a static API within lejos
  }

  /**
   * @param vol The volume [0-100]
   */
  public void setVolume(int vol) {
    audio.setVolume(vol);
    volume = getVolume();
  }

  public int getVolume() {
    return audio.getVolume();
  }

  public void beep() {
    audio.systemSound(Sounds.BEEP);
  }

  /**
   * Play with the volume defined with {{@link #setVolume(int)} .
   */
  public void playTone(int frequency, int durationInMS) {
    audio.playTone(frequency, durationInMS, volume);
  }

  // public void playTone(int frequency, int durationInMS, int vol) {
  // audio.playTone(frequency, durationInMS, vol);
  // }

  public void playFile(String filename) throws EV3ScriptException {
    playFile(filename, volume);
  }

  public void playFile(String filename, int volume) throws EV3ScriptException {
    // TODO: implement
    // Sound.playSample(file, vol)
    throw new EV3ScriptException(EV3ScriptException.API_NOT_IMPLEMENTED, MapBuilder.buildHashMap("function", "playFile()").build());
  }

  /**
   * Play a note with the value defined with {{@link #setVolume(int)} </br> Sample usage:
   * 
   * <pre>
   * // Gregorian notation
   * playNote(&quot;C4&quot;, 100);
   * playNote(&quot;G#4&quot;, 100);
   * 
   * // Latin notation
   * playNote(&quot;Do&quot;, 100);
   * playNote(&quot;Sol#&quot;, 100);
   * </pre>
   * 
   * @throws EV3ScriptException
   */
  public void playNote(String note, float durationInS) throws EV3ScriptException {
    audio.playNote(Sounds.PIANO, getFrequency(note), (int) (durationInS * 1000));
  }

  public void playNotes(String[] notes, float durationInS) throws EV3ScriptException {
    for (String n : notes) {
      playNote(n, durationInS);
    }
  }

  static final float[] OCTAVE3 = { //
  261.626f, // Do3 - C4
      277.183f, // Do3# - C#4
      293.665f, // Re3 - D4
      311.127f, // Re3# - D#4
      329.628f, // Mi3 - E4
      349.228f, // Fa3 - F4
      369.994f, // Fa3# - F#4
      391.995f, // Sol3 - G4
      415.305f, // Sol3# - G#4
      440, // La3 - A4
      466.164f, // La3# - A#4
      493.883f, // Si3 - B4
  };

  // Coefficient used to convert from the 4th octave to the others
  static final float[] OCTAVE_COEF = { //
  0.125f, // 1
      0.25f, // 2
      0.5f, // 3
      1, // 4
      2, // 5
      4, // 6
      8 // 7
  };

  static final int DO3 = 0, C4 = 0;
  static final int DO3_s = 1, Cd4 = 1;
  static final int RE3 = 2, D4 = 2;
  static final int RE3_s = 3, Dd4 = 3;
  static final int MI3 = 4, E4 = 4;
  static final int FA3 = 5, F4 = 5;
  static final int FA3_s = 6, Fd4 = 6;
  static final int SOL3 = 7, G4 = 7;
  static final int SOL3_s = 8, Gd4 = 8;
  static final int LA3 = 9, A4 = 9;
  static final int LA3_s = 10, Ad4 = 10;
  static final int SI3 = 11, B4 = 11;

  /**
   * // C - Do // D - Re // E - Mi // F - Fa // G - Sol // A - La // B - Si
   * 
   * @param note
   * @return
   * @throws EV3ScriptException
   */
  static int getFrequency(String note) throws EV3ScriptException {
    int length = note.length();
    boolean isLength3orUpper = length >= 3;
    if (length >= 2) {
      // Gregorian notation
      final char c0 = note.charAt(0);
      final char c1 = note.charAt(1);
      final char c2 = (isLength3orUpper ? note.charAt(2) : '-');

      if ((c0 >= 'A') && (c0 <= 'G')) {
        // C4 - C#4, etc...
        boolean isSharp = (c1 == '#');
        char octave = (isSharp ? c2 : c1); // => If not parsable, Exception will be launched later
        if ((octave >= '1') && (octave <= '7')) {
          float coef = OCTAVE_COEF[octave - '1'];
          if (c0 == 'C') {
            return (int) (OCTAVE3[(isSharp ? Cd4 : C4)] * coef);
          }
          if (c0 == 'D') {
            return (int) (OCTAVE3[(isSharp ? Dd4 : D4)] * coef);
          }
          if (c0 == 'E' && isSharp == false) {
            return (int) (OCTAVE3[E4] * coef);
          }
          if (c0 == 'F') {
            return (int) (OCTAVE3[(isSharp ? Fd4 : F4)] * coef);
          }
          if (c0 == 'G') {
            return (int) (OCTAVE3[(isSharp ? Gd4 : G4)] * coef);
          }
          if (c0 == 'A') {
            return (int) (OCTAVE3[(isSharp ? Ad4 : A4)] * coef);
          }
          if (c0 == 'B' && isSharp == false) {
            return (int) (OCTAVE3[B4] * coef);
          }
        }
      }

      // Latin notation
      if (c0 == 'D' && c1 == 'o') { // Do
        if (isLength3orUpper && c2 == '#') {
          return (int) OCTAVE3[DO3_s];
        }
        return (int) OCTAVE3[DO3];
      }
      if (c0 == 'R' && c1 == 'e') { // Re
        if (isLength3orUpper && c2 == '#') {
          return (int) OCTAVE3[RE3_s];
        }
        return (int) OCTAVE3[RE3];
      }
      if (c0 == 'M' && c1 == 'i') { // Mi
        return (int) OCTAVE3[MI3];
      }
      if (c0 == 'F' && c1 == 'a') { // Fa
        if (isLength3orUpper && c2 == '#') {
          return (int) OCTAVE3[FA3_s];
        }
        return (int) OCTAVE3[FA3];
      }
      if (c0 == 'S') {
        if (c1 == 'o' && c2 == 'l') { // Sol
          if (length >= 4 && note.charAt(3) == '#') {
            return (int) OCTAVE3[SOL3_s];
          }
          return (int) OCTAVE3[SOL3];
        }
        if (c1 == 'i') { // Si
          return (int) OCTAVE3[SI3];
        }
      }
      if (c0 == 'L' && c1 == 'a') { // La
        if (isLength3orUpper && c2 == '#') {
          return (int) OCTAVE3[LA3_s];
        }
        return (int) OCTAVE3[LA3];
      }
    }
    throw new EV3ScriptException(EV3ScriptException.INVALID_NOTE, MapBuilder.buildHashMap("note", note).build());
  }
}
