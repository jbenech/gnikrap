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

import java.io.DataInputStream;
import java.io.FileInputStream;
import java.io.IOException;

import lejos.hardware.BrickFinder;
import lejos.hardware.lcd.Font;
import lejos.hardware.lcd.GraphicsLCD;
import lejos.hardware.lcd.Image;

import org.gnikrap.script.EV3ScriptContext;
import org.gnikrap.utils.ScriptApi;

/**
 * Note: Accessing to the screen API create an extra-thread in order to refresh the screen in background.
 * <p/>
 * TODO create a simple text API that have print() println() like feature with auto line break.
 */
final public class SimpleEV3Screen implements EV3Device {

  public static final int COLOR_BLACK = 0x000000;
  public static final int COLOR_WHITE = 0xFFFFFF;

  private final GraphicsLCD graphicsLCD;
  private int color;

  public SimpleEV3Screen(EV3ScriptContext sc) {
    graphicsLCD = BrickFinder.getLocal().getGraphicsLCD();
    setColor(COLOR_BLACK);
  }

  @Override
  public void release() {
    graphicsLCD.clear(); // TODO confirm that clear at exit is ok ?
  }

  /**
   * Clear the screen
   */
  @ScriptApi
  public void clear() {
    graphicsLCD.clear();
  }

  /**
   * @return The width of the screen in pixel
   */
  // To be tested
  public int getWidth() {
    return graphicsLCD.getWidth();
  }

  /**
   * @return The height of the screen in pixel
   */
  // To be tested
  public int getHeight() {
    return graphicsLCD.getHeight();
  }

  /**
   * @return the height of the font in pixel, 0 if not font is currently set.
   */
  // To be tested
  public int getFontHeight() {
    Font f = graphicsLCD.getFont();
    return (f != null ? f.getHeight() : 0);
  }

  /**
   * @param size available size: [S, M, L] for [Small, Medium, Large]. Default size is 'M'
   */
  public void setFont(char c) {
    Font font;
    if (c == 'S') {
      font = Font.getSmallFont();
    } else if (c == 'L') {
      font = Font.getLargeFont();
    } else {
      font = Font.getDefaultFont();
    }
    graphicsLCD.setFont(font);
  }

  /**
   * @param color The #RRGGBB color as an integer. All the values that are not black will be displayed as white.
   */
  public void setColor(int color) {
    this.color = color;
    graphicsLCD.setColor(color);
  }

  public int getColor() {
    return color;
  }

  /**
   * Draw the given string at the given x and x (x and y are expressed as characters and not pixel)
   */
  public void drawText(Object txt, int x, int y) {
    drawText(txt, x, y, false);
  }

  public void drawText(Object txt, int x, int y, boolean inverted) {
    String textToDraw = String.valueOf(txt);
    if (inverted) {
      graphicsLCD.drawString(textToDraw, x, y, 0, inverted);
    } else {
      graphicsLCD.drawString(textToDraw, x, y, 0);
    }
  }

  public void drawLine(int x1, int y1, int x2, int y2) {
    graphicsLCD.drawLine(x1, y1, x2, y2);
  }

  public void drawRectangle(int x, int y, int width, int height) {
    graphicsLCD.drawRect(x, y, width, height);
  }

  public void fillRectangle(int x, int y, int width, int height) {
    graphicsLCD.fillRect(x, y, width, height);
  }

  public void drawCircle(int x, int y, int r) {
    int d = 2 * r;
    graphicsLCD.drawArc(x - r, y - r, d, d, 0, 360);
  }

  public void fillCircle(int x, int y, int r) {
    int d = 2 * r;
    graphicsLCD.fillArc(x - r, y - r, d, d, 0, 360);
  }

  public void drawPoint(int x, int y) {
    graphicsLCD.setPixel(x, y, color);
  }

  public void drawArc(int x, int y, int width, int height, int startAngle, int arcAngle) {
    graphicsLCD.drawArc(x, y, width, height, startAngle, arcAngle);
  }

  public void fillArc(int x, int y, int width, int height, int startAngle, int arcAngle) {
    graphicsLCD.fillArc(x, y, width, height, startAngle, arcAngle);
  }

  /**
   * Load LEGO RGF file format.
   * <p>
   * Description of the format:
   * <ul>
   * <li>1st byte: width (max 180)</li>
   * <li>2nd byte: height (max 128)</li>
   * <li>image data: line by line, 1 line is stored on a full number of byte (so 180 => 23 bytes, some of the bits of the last bytes are not used)</li>
   * </ul>
   * </p>
   * 
   * @param name
   * @return
   */
  public SimpleEV3Image loadImage(String name) {
    try (FileInputStream fis = new FileInputStream(name)) {
      DataInputStream in = new DataInputStream(fis);
      int w = in.readUnsignedByte();
      int h = in.readUnsignedByte();

      byte[] ev3ImageData = new byte[w * ((h + 7) / 8)];
      byte[] line = new byte[w / 8];
      // in.readFully(imageData);

      // return SimpleEV3Image(new Image(w, h, ev3ImageData));
      return null;
    } catch (IOException e) {
      // TODO Auto-generated catch block
      e.printStackTrace();
    }
    return null;
  }

  public static final class SimpleEV3Image {

    private final Image image;

    SimpleEV3Image(Image img) {
      image = img;
    }

    Image getImage() {
      return image;
    }
  }
}
