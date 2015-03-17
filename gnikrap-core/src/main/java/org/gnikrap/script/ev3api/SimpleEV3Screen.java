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
import java.util.Collections;

import lejos.hardware.BrickFinder;
import lejos.hardware.lcd.Font;
import lejos.hardware.lcd.GraphicsLCD;
import lejos.hardware.lcd.Image;

import org.gnikrap.utils.MapBuilder;
import org.gnikrap.utils.ScriptApi;

/**
 * Note: Accessing to the screen API create an extra-thread in order to refresh the screen in background.
 * <p/>
 * TODO create a simple text API that have print() println() like feature with auto line break.
 */
final public class SimpleEV3Screen implements EV3Device {

  public static final int COLOR_BLACK = GraphicsLCD.BLACK; // 0x000000;
  public static final int COLOR_WHITE = GraphicsLCD.WHITE; // 0xFFFFFF;

  private final GraphicsLCD graphicsLCD;
  private int color;

  public SimpleEV3Screen() {
    graphicsLCD = BrickFinder.getLocal().getGraphicsLCD();
    resetToDefault();
  }

  private void resetToDefault() {
    setColor(COLOR_BLACK);
    setFont("M");
  }

  @Override
  public void release() {
    graphicsLCD.clear();
    resetToDefault();
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
  @ScriptApi(versionAdded = "0.4.0")
  public int getWidth() {
    return graphicsLCD.getWidth();
  }

  /**
   * @return The height of the screen in pixel
   */
  @ScriptApi(versionAdded = "0.4.0")
  public int getHeight() {
    return graphicsLCD.getHeight();
  }

  /**
   * @return the height of the font in pixel, 0 if not font is currently set.
   */
  @ScriptApi(versionAdded = "0.4.0")
  public int getFontHeight() {
    Font f = graphicsLCD.getFont();
    return (f != null ? f.getHeight() : 0);
  }

  /**
   * @param size available size: [S, M, L] for [Small, Medium, Large]. Default size is 'M'
   */
  @ScriptApi(versionAdded = "0.4.0")
  public void setFont(String size) {
    Font font;
    if ("S".equalsIgnoreCase(size)) {
      font = Font.getSmallFont();
    } else if ("L".equalsIgnoreCase(size)) {
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
   * Draw the given string at the given x and x
   */
  @ScriptApi(versionAdded = "0.4.0")
  public void drawText(Object txt, int x, int y) {
    drawText(txt, x, y, false);
  }

  @ScriptApi(versionAdded = "0.4.0")
  public void drawText(Object txt, int x, int y, boolean inverted) {
    String textToDraw = String.valueOf(txt);
    if (inverted) {
      graphicsLCD.drawString(textToDraw, x, y, 0, inverted);
    } else {
      graphicsLCD.drawString(textToDraw, x, y, 0);
    }
  }

  @ScriptApi(versionAdded = "0.4.0")
  public void drawLine(int x1, int y1, int x2, int y2) {
    graphicsLCD.drawLine(x1, y1, x2, y2);
  }

  @ScriptApi(versionAdded = "0.4.0")
  public void drawRectangle(int x, int y, int width, int height) {
    graphicsLCD.drawRect(x, y, width, height);
  }

  @ScriptApi(versionAdded = "0.4.0")
  public void fillRectangle(int x, int y, int width, int height) {
    graphicsLCD.fillRect(x, y, width, height);
  }

  @ScriptApi(versionAdded = "0.4.0")
  public void drawCircle(int x, int y, int r) {
    int d = 2 * r;
    graphicsLCD.drawArc(x - r, y - r, d, d, 0, 360);
  }

  @ScriptApi(versionAdded = "0.4.0")
  public void fillCircle(int x, int y, int r) {
    int d = 2 * r;
    graphicsLCD.fillArc(x - r, y - r, d, d, 0, 360);
  }

  public void drawPoint(int x, int y) {
    // Don't work ?
    graphicsLCD.setPixel(x, y, color);
  }

  @ScriptApi(versionAdded = "0.4.0")
  public void drawArc(int x, int y, int width, int height, int startAngle, int arcAngle) {
    graphicsLCD.drawArc(x, y, width, height, startAngle, arcAngle);
  }

  @ScriptApi(versionAdded = "0.4.0")
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
   */
  public SimpleEV3Image loadImage(String name) throws EV3ScriptException {
    try (DataInputStream in = new DataInputStream(new FileInputStream(name))) {
      int width = in.readUnsignedByte();
      int height = in.readUnsignedByte();
      byte[] ev3ImageData = new byte[(width + 7) / 8 * height]; // + 7 in order to have a full number of bytes
      if (in.read(ev3ImageData) != ev3ImageData.length) {
        throw new EV3ScriptException(EV3ScriptException.IMAGE_CORRUPTED, MapBuilder.buildHashMap("filename", name).build());
      }
      return new SimpleEV3Image(new Image(width, height, ev3ImageData));
    } catch (IOException e) {
      throw new EV3ScriptException(EV3ScriptException.CANT_READ_FILE, MapBuilder.buildHashMap("filename", name).put("error", e.toString()).build());
    }
  }

  /**
   * Build an image from an array of string.<br/>
   * Use space for white and any other characters for black.
   */
  public SimpleEV3Image buildImage(String... data) throws EV3ScriptException {
    // Check validity of data
    int height, width;
    if ((data != null) && (data.length > 0)) {
      height = data.length;
      width = data[0] != null ? data[0].length() : -1;
      for (String line : data) {
        if (line == null || line.length() != width) {
          throw new EV3ScriptException(EV3ScriptException.BAD_IMAGE_DATA, Collections.<String, String> emptyMap());
        }
      }
    } else {
      throw new EV3ScriptException(EV3ScriptException.BAD_IMAGE_DATA, Collections.<String, String> emptyMap());
    }

    // Build image
    byte[] ev3ImageData = new byte[(width + 7) / 8 * height]; // + 7 in order to have a full number of bytes
    int index = 0;
    for (int i = 0; i < height; i++) {
      char[] line = data[i].toCharArray();
      for (int j = 0; j < width; j += 8) {
        byte d = 0;
        for (int k = 7; k >= 0; k--) {
          d <<= 1;
          int x = j + k;
          if (x < width) { // End of line is blank
            d |= (byte) (line[x] != ' ' ? 1 : 0);
          }
        }
        ev3ImageData[index++] = d;
      }
    }

    return new SimpleEV3Image(new Image(width, height, ev3ImageData));
  }

  public void drawImage(SimpleEV3Image img, int x, int y) {
    if (img != null) {
      graphicsLCD.drawImage(img.getImage(), x, y, 0);
    }
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
