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
package org.gnikrap.script.ev3menu;

import lejos.hardware.BrickFinder;
import lejos.hardware.lcd.Image;

import org.gnikrap.GnikrapApp;
import org.gnikrap.script.ev3api.SimpleEV3Brick;
import org.gnikrap.script.ev3api.SimpleEV3Screen;
import org.gnikrap.utils.ApplicationContext;

/**
 * Display the Gnikrap welcome menu while there is no script running.<br/>
 * The screen contains:
 * <ul>
 * <li>The Gnikrap name, logo and version</li>
 * <li>The URLs where the user can connect to Gnikrap</li>
 * </ul>
 */
public class WelcomeMenu {
  private final SimpleEV3Screen screen;
  private final GnikrapApp gnikrapApp;

  public WelcomeMenu(ApplicationContext appContext, SimpleEV3Brick brick) {
    screen = brick.getScreen();
    gnikrapApp = appContext.getObject(GnikrapApp.class);
  }

  public void start() {
    screen.setFont("L"); // Height: 32
    screen.drawText("Gnikrap", 5, 5);
    screen.setFont("S"); // Height: 8
    screen.drawText("Version: " + gnikrapApp.getVersion(), 10, 35);
    // screen.drawText("Press ESC to quit Gnikrap", 10, 120);

    screen.drawText("Try to connect at:", 10, 50);
    int i = 0;
    for (String url : gnikrapApp.getGnikrapURL()) { // A maximum of 2 URLs (bluetooth and Wifi)
      screen.drawText(" - " + url, 10, 60 + 10 * i++);
    }

    Image img = new Image(4, 5, new byte[] { (byte) 0x7F, (byte) 0x00, (byte) 0x02, (byte) 0x7f, (byte) 0x00, (byte) 0x00 });
    // byte[] imageData = new byte[width * (height + 7) / 8];
    BrickFinder.getLocal().getGraphicsLCD().drawImage(img, 100, 100, 0);
  }

  public void stop() {
    screen.clear();
  }
}
