/*
 * Gnikrap is a simple scripting environment for the Lego Mindstrom EV3
 * Copyright (C) 2015 Jean BENECH
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

import org.testng.Assert;
import org.testng.annotations.Test;

// Frequencies from: http://en.wikipedia.org/wiki/Piano_key_frequencies and http://fr.wikipedia.org/wiki/Fr%C3%A9quences_des_touches_du_piano
public class SimpleEV3SoundTest {

  @Test
  public void testLatinNotationMain() throws Exception {
    Assert.assertEquals(SimpleEV3Sound.getFrequency("Do"), (int) 261.626);
    Assert.assertEquals(SimpleEV3Sound.getFrequency("Do3"), (int) 261.626);
    Assert.assertEquals(SimpleEV3Sound.getFrequency("Do#"), (int) 277.183);
    Assert.assertEquals(SimpleEV3Sound.getFrequency("Re"), (int) 293.665);
    Assert.assertEquals(SimpleEV3Sound.getFrequency("Re#"), (int) 311.127);
    Assert.assertEquals(SimpleEV3Sound.getFrequency("Mi"), (int) 329.628);
    Assert.assertEquals(SimpleEV3Sound.getFrequency("Fa"), (int) 349.228);
    Assert.assertEquals(SimpleEV3Sound.getFrequency("Fa#"), (int) 369.994);
    Assert.assertEquals(SimpleEV3Sound.getFrequency("Sol"), (int) 391.995);
    Assert.assertEquals(SimpleEV3Sound.getFrequency("Sol#"), (int) 415.305);
    Assert.assertEquals(SimpleEV3Sound.getFrequency("La"), (int) 440.000);
    Assert.assertEquals(SimpleEV3Sound.getFrequency("La#"), (int) 466.164);
    Assert.assertEquals(SimpleEV3Sound.getFrequency("Si"), (int) 493.883);
    Assert.assertEquals(SimpleEV3Sound.getFrequency("Do4"), (int) 523.251);
    Assert.assertEquals(SimpleEV3Sound.getFrequency("Do4#"), (int) 554.365);
  }

  @Test
  public void testLatinNotationOthers() throws Exception {
    Assert.assertEquals(SimpleEV3Sound.getFrequency("Do1"), (int) 65.4064);
    Assert.assertEquals(SimpleEV3Sound.getFrequency("La2"), 220);
    Assert.assertEquals(SimpleEV3Sound.getFrequency("Do6"), 2093);
  }

  @Test
  public void testGregorianNotationMain() throws Exception {
    Assert.assertEquals(SimpleEV3Sound.getFrequency("C4"), (int) 261.626);
    Assert.assertEquals(SimpleEV3Sound.getFrequency("C4#"), (int) 277.183);
    Assert.assertEquals(SimpleEV3Sound.getFrequency("D4"), (int) 293.665);
    Assert.assertEquals(SimpleEV3Sound.getFrequency("D4#"), (int) 311.127);
    Assert.assertEquals(SimpleEV3Sound.getFrequency("E4"), (int) 329.628);
    Assert.assertEquals(SimpleEV3Sound.getFrequency("F4"), (int) 349.228);
    Assert.assertEquals(SimpleEV3Sound.getFrequency("F4#"), (int) 369.994);
    Assert.assertEquals(SimpleEV3Sound.getFrequency("G4"), (int) 391.995);
    Assert.assertEquals(SimpleEV3Sound.getFrequency("G4#"), (int) 415.305);
    Assert.assertEquals(SimpleEV3Sound.getFrequency("A4"), (int) 440.000);
    Assert.assertEquals(SimpleEV3Sound.getFrequency("A4#"), (int) 466.164);
    Assert.assertEquals(SimpleEV3Sound.getFrequency("B4"), (int) 493.883);
    Assert.assertEquals(SimpleEV3Sound.getFrequency("C5"), (int) 523.251);
    Assert.assertEquals(SimpleEV3Sound.getFrequency("C5#"), (int) 554.365);
  }

  @Test
  public void testGregorianNotationOthers() throws Exception {
    Assert.assertEquals(SimpleEV3Sound.getFrequency("C1"), (int) 32.7032);
    Assert.assertEquals(SimpleEV3Sound.getFrequency("C1#"), (int) 34.6478);
    Assert.assertEquals(SimpleEV3Sound.getFrequency("C2"), (int) 65.4064);
    Assert.assertEquals(SimpleEV3Sound.getFrequency("A3"), 220);
    Assert.assertEquals(SimpleEV3Sound.getFrequency("C7"), 2093);
  }

}
