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
import java.text.ParseException;
import java.util.Collections;

import lejos.hardware.BrickFinder;
import lejos.hardware.lcd.Font;
import lejos.hardware.lcd.GraphicsLCD;
import lejos.hardware.lcd.Image;

import org.gnikrap.utils.MapBuilder;
import org.gnikrap.utils.ScriptApi;
import org.gnikrap.utils.Utils;

/**
 * Note: Accessing to the screen API create an extra-thread in order to refresh the screen in background.
 */
final public class SimpleEV3Screen implements EV3Device {

  static final String DATA_FORMAT_RFG = "image/rgf";

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

  @ScriptApi(versionAdded = "TBD", isIncubating = true)
  public void drawPoint(int x, int y) {
    // Currenlty Don't work ?
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
  @ScriptApi(versionAdded = "TBD", isIncubating = true)
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
   * Decode the image from a Data URI string. Currently, only one binary data format was supported: 'image/rgf' (that is to say, RGF files like EV3 images)
   */
  @ScriptApi(versionAdded = "0.4.0")
  public SimpleEV3Image decodeImage(String data) throws EV3ScriptException {
    try {
      Utils.Base64DataURI dataURI = Utils.decodeBase64DataURI(data);
      if (DATA_FORMAT_RFG.equals(dataURI.getMimeType())) {
        return decodeRgfImage(dataURI.getData());
      } else {
        throw new EV3ScriptException(EV3ScriptException.CANT_DECODE_IMAGE_INVALID_TYPE, MapBuilder.buildHashMap("type", dataURI.getMimeType()).build());
      }
    } catch (ParseException pe) {
      throw new EV3ScriptException(EV3ScriptException.CANT_DECODE_IMAGE, MapBuilder.buildHashMap("reason", pe.toString()).build());
    }
  }

  private SimpleEV3Image decodeRgfImage(byte[] imageData) throws EV3ScriptException {
    if ((imageData != null) && (imageData.length > 2)) {
      int width = imageData[0] & 0xFF; // TODO: JDK8, replace by Byte.toUnsignedInt
      int height = imageData[1] & 0xFF;
      byte[] ev3ImageData = new byte[(width + 7) / 8 * height]; // + 7 in order to have a full number of bytes
      if (imageData.length >= ev3ImageData.length + 2) {
        System.arraycopy(imageData, 2, ev3ImageData, 0, ev3ImageData.length);
        return new SimpleEV3Image(new Image(width, height, ev3ImageData));
      }
      throw new EV3ScriptException(EV3ScriptException.CANT_DECODE_IMAGE_INVALID_DATA_SIZE, MapBuilder.buildHashMap("width", String.valueOf(width)).put("height", String.valueOf(height)).build());
    }
    throw new EV3ScriptException(EV3ScriptException.CANT_DECODE_IMAGE, MapBuilder.buildHashMap("reason", "Binary data is invalid").build());
  }

  /**
   * Build an image from an array of string.<br/>
   * Each characters represent 1 pixel, use a space for white and any other characters for black.
   */
  @ScriptApi(versionAdded = "0.4.0")
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

    int index = 0; // The index within the image
    char[] line; // The image line currently processed
    byte currentByte; // The 8 pixels in progress (1 pixel is 1 bit)
    int idxInline; // The index of the current pixel in the line

    for (int i = 0; i < height; i++) {
      line = data[i].toCharArray();
      for (int j = 0; j < width; j += 8) {
        currentByte = 0;
        for (int k = 7; k >= 0; k--) {
          currentByte <<= 1;
          idxInline = j + k;
          if (idxInline < width) { // End of line is blank
            currentByte |= (byte) (line[idxInline] != ' ' ? 1 : 0);
          }
        }
        ev3ImageData[index++] = currentByte;
      }
    }

    return new SimpleEV3Image(new Image(width, height, ev3ImageData));
  }

  @ScriptApi(versionAdded = "0.4.0")
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

    @ScriptApi(versionAdded = "0.4.0")
    public int getHeight() {
      return image.getHeight();
    }

    @ScriptApi(versionAdded = "0.4.0")
    public int getWidth() {
      return image.getWidth();
    }

    public String toDataURI() {
      byte[] ev3ImageData = image.getData();
      byte[] temp = new byte[ev3ImageData.length + 2];
      temp[0] = (byte) image.getWidth();
      temp[1] = (byte) image.getHeight();
      System.arraycopy(ev3ImageData, 0, temp, 2, ev3ImageData.length);
      return new Utils.Base64DataURI(DATA_FORMAT_RFG, ev3ImageData).encode();
    }
  }
}
