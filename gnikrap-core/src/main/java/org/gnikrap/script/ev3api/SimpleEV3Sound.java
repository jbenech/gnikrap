/*
 * Gnikrap is a simple scripting environment for the Lego Mindstrom EV3
 * Copyright (C) 2014-2015 Jean BENECH
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
import org.gnikrap.utils.ScriptApi;

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
  @ScriptApi
  public void setVolume(int vol) {
    audio.setVolume(vol);
    volume = getVolume();
  }

  @ScriptApi
  public int getVolume() {
    return audio.getVolume();
  }

  @ScriptApi
  public void beep() {
    audio.systemSound(Sounds.BEEP);
  }

  /**
   * Play with the volume defined with {{@link #setVolume(int)} .
   */
  @ScriptApi
  public void playTone(int frequency, int durationInMS) {
    audio.playTone(frequency, durationInMS, volume);
  }

  // public void playTone(int frequency, int durationInMS, int vol) {
  // audio.playTone(frequency, durationInMS, vol);
  // }

  // Currently not part of the ScriptAPI
  public void playFile(String filename) throws EV3ScriptException {
    playFile(filename, volume);
  }

  // Currently not part of the ScriptAPI
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
  @ScriptApi
  public void playNote(String note, float durationInMS) throws EV3ScriptException {
    audio.playNote(Sounds.PIANO, getFrequency(note), (int) durationInMS);
  }

  @ScriptApi(isIncubating = true)
  public void playNotes(String[] notes, float durationInMS) throws EV3ScriptException {
    for (String n : notes) {
      playNote(n, durationInMS);
    }
  }

  // Data on notes from http://fr.wikipedia.org/wiki/Fr%C3%A9quences_des_touches_du_piano

  static final float[] OCTAVE3 = {
      //
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

  // Coefficient used to convert from the 4th Gregorian octave to the others
  static final float[] GREGORIAN_OCTAVE_COEF = {
      //
      0.125f, // 1
      0.25f, // 2
      0.5f, // 3
      1, // 4
      2, // 5
      4, // 6
      8 // 7
  };

  // Coefficient used to convert from the 3th Latin octave to the others
  static final float[] LATIN_OCTAVE_COEF = {
      //
      0.25f, // 1
      0.5f, // 2
      1, // 3
      2, // 4
      4, // 5
      8 // 6
  };

  static final int DO3 = 0, C4 = 0;
  static final int RE3 = 2, D4 = 2;
  static final int MI3 = 4, E4 = 4;
  static final int FA3 = 5, F4 = 5;
  static final int SOL3 = 7, G4 = 7;
  static final int LA3 = 9, A4 = 9;
  static final int SI3 = 11, B4 = 11;

  static int getFrequency(String note) throws EV3ScriptException {
    String cleanNote = note.trim();
    int length = cleanNote.length();
    if ((length >= 2) && (length <= 5)) {
      char last = cleanNote.charAt(length - 1);

      // Sharp or not ?
      boolean isSharp = (last == '#');

      // Octave
      char octaveChar = (isSharp ? cleanNote.charAt(length - 2) : last);
      int octaveIndex = -1; // 0 for octave 1
      if ((octaveChar >= '1') && (octaveChar <= '7')) {
        octaveIndex = octaveChar - '1';
      }

      // Note
      final char c0 = note.charAt(0);
      final char c1 = note.charAt(1);

      // Latin notation
      if ((length <= 4) || isSharp) {
        float coef = ((octaveIndex >= 0) && (octaveIndex < LATIN_OCTAVE_COEF.length) ? LATIN_OCTAVE_COEF[octaveIndex] : 1);

        if (c0 == 'D' && c1 == 'o') { // Do
          return getFrequency(DO3, coef, isSharp);
        }
        if (c0 == 'R' && c1 == 'e') { // Re
          return getFrequency(RE3, coef, isSharp);
        }
        if (c0 == 'M' && c1 == 'i') { // Mi
          return getFrequency(MI3, coef, false);
        }
        if (c0 == 'F' && c1 == 'a') { // Fa
          return getFrequency(FA3, coef, isSharp);
        }
        if (c0 == 'S') {
          if (c1 == 'o' && length >= 3 && note.charAt(2) == 'l') { // Sol
            return getFrequency(SOL3, coef, isSharp);
          }
          if (c1 == 'i') { // Si
            return getFrequency(SI3, coef, false);
          }
        }
        if (c0 == 'L' && c1 == 'a') { // La
          return getFrequency(LA3, coef, isSharp);
        }
      }

      // Gregorian notation
      if ((isSharp && length == 3) || (length == 2)) {
        float coef = ((octaveIndex >= 0) && (octaveIndex < GREGORIAN_OCTAVE_COEF.length) ? GREGORIAN_OCTAVE_COEF[octaveIndex] : 1);

        if (c0 == 'C') {
          return getFrequency(C4, coef, isSharp);
        }
        if (c0 == 'D') {
          return getFrequency(D4, coef, isSharp);
        }
        if (c0 == 'E' && isSharp == false) {
          return getFrequency(E4, coef, false);
        }
        if (c0 == 'F') {
          return getFrequency(F4, coef, isSharp);
        }
        if (c0 == 'G') {
          return getFrequency(G4, coef, isSharp);
        }
        if (c0 == 'A') {
          return getFrequency(A4, coef, isSharp);
        }
        if (c0 == 'B' && isSharp == false) {
          return getFrequency(B4, coef, false);
        }
      }
    }
    throw new EV3ScriptException(EV3ScriptException.INVALID_NOTE, MapBuilder.buildHashMap("note", note).build());
  }

  static final int getFrequency(int note, float octaveCoef, boolean isSharp) {
    return (int) (OCTAVE3[(isSharp ? note + 1 : note)] * octaveCoef);
  }
}
