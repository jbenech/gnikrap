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

import org.gnikrap.GnikrapApp;
import org.gnikrap.script.ev3api.EV3ScriptException;
import org.gnikrap.script.ev3api.SimpleEV3Brick;
import org.gnikrap.script.ev3api.SimpleEV3Screen;
import org.gnikrap.script.ev3api.SimpleEV3Screen.SimpleEV3Image;
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
  static String LOGO_BASE64 = "data:image/rgf;base64,HyD8//8f/v//P////3////9//wMAfv8AAH7/" + //
      "AAB+fwAAfn8AAH4/wA9+P/APfj/wD34/8A9+P/APfj/gD34/AAB+fwAAfn8AAH7/AAB+/wEAfv8PAH7//w" + //
      "N+//8Dfv//A37//wN+//8Dfv//A37//wN+////f////3/+//8//P//Hw==";

  private static SimpleEV3Image logoImage;

  private final SimpleEV3Screen screen;
  private final GnikrapApp gnikrapApp;

  public WelcomeMenu(ApplicationContext appContext, SimpleEV3Brick brick) {
    screen = brick.getScreen();
    gnikrapApp = appContext.getObject(GnikrapApp.class);
  }

  public void start() {
    screen.setFont("L"); // Height: 32
    screen.drawText("Gnikrap", 0, 5);
    screen.drawImage(getLogoImage(screen), 145, 5);

    screen.setFont("S"); // Height: 8
    screen.drawText("Version: " + gnikrapApp.getVersion(), 10, 37);

    screen.drawText("Try to connect at:", 5, 60);
    int i = 0;
    for (String url : gnikrapApp.getGnikrapURL()) { // A maximum of 2 URLs (bluetooth and Wifi)
      screen.drawText("- " + url, 10, 70 + 10 * i++);
    }
  }

  public void stop() {
    screen.clear();
  }

  static SimpleEV3Image getLogoImage(SimpleEV3Screen screen) {
    if (logoImage == null) {
      try {
        logoImage = screen.decodeImage(LOGO_BASE64);
      } catch (EV3ScriptException ex) {
        // Ignore: Should never happens once tested
      }
    }
    return logoImage;
  }
}
