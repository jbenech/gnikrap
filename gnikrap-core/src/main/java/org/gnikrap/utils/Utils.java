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
package org.gnikrap.utils;

import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.text.ParseException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Enumeration;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Collection of utilities functions.<br/>
 * Part of the code is copy/paste from code found on the Internet
 */
public class Utils {
  private static final Logger LOGGER = LoggerUtils.getLogger(Utils.class);

  private Utils() {
    // Avoid instantiation
  }

  /**
   * List the EV3 available network interfaces.<br/>
   * Code copied from leJOS {@code lejos.ev3.startup.GraphicStartup}
   */
  public static List<String> getIPAddresses() {
    List<String> result = new ArrayList<String>();

    Enumeration<NetworkInterface> interfaces;
    try {
      interfaces = NetworkInterface.getNetworkInterfaces();
    } catch (SocketException e) {
      LOGGER.log(Level.SEVERE, "Failed to get network interfaces: ", e);
      return Collections.emptyList();
    }

    while (interfaces.hasMoreElements()) {
      NetworkInterface current = interfaces.nextElement();
      try {
        if (!current.isUp() || current.isLoopback() || current.isVirtual()) {
          continue;
        }
      } catch (SocketException e) {
        LOGGER.log(Level.SEVERE, "Failed to get network properties: ", e);
      }
      Enumeration<InetAddress> addresses = current.getInetAddresses();
      while (addresses.hasMoreElements()) {
        InetAddress current_addr = addresses.nextElement();
        if (current_addr.isLoopbackAddress())
          continue;
        result.add(current_addr.getHostAddress());
      }
    }
    return result;
  }

  // //////////////////////////////////////////////////////////////////////////
  // Base64 utils

  // TODO: Replace with java.util.Base64 while JDK8 was used

  private final static char[] ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".toCharArray();
  private final static int[] TO_INT = new int[128];
  static {
    for (int i = 0; i < ALPHABET.length; i++) {
      TO_INT[ALPHABET[i]] = i;
    }
  }

  /**
   * Translates the specified byte array into Base64 string.
   *
   * @param buf the byte array (not null)
   * @return the translated Base64 string (not null)
   * 
   * @author Code adapted from http://stackoverflow.com/questions/469695/decode-base64-data-in-java
   */
  public static String encodeBase64(byte[] buf) {
    final int size = buf.length;
    char[] ar = new char[((size + 2) / 3) * 4];
    int a = 0;
    int i = 0;
    byte b0, b1, b2;
    while (i < size) {
      b0 = buf[i++];
      b1 = (i < size) ? buf[i++] : 0;
      b2 = (i < size) ? buf[i++] : 0;

      ar[a++] = ALPHABET[(b0 >> 2) & 0x3F];
      ar[a++] = ALPHABET[((b0 << 4) | ((b1 & 0xFF) >> 4)) & 0x3F];
      ar[a++] = ALPHABET[((b1 << 2) | ((b2 & 0xFF) >> 6)) & 0x3F];
      ar[a++] = ALPHABET[b2 & 0x3F];
    }
    switch (size % 3) {
    case 1:
      ar[--a] = '=';
    case 2:
      ar[--a] = '=';
    }
    return new String(ar);
  }

  /**
   * Translates the specified Base64 string into a byte array.
   *
   * @param s the Base64 string (not null)
   * @return the byte array (not null)
   * 
   * @author Code adapted from http://stackoverflow.com/questions/469695/decode-base64-data-in-java
   */
  public static byte[] decodeBase64(String data) {
    // Clean the string from whitespace
    StringBuilder temp = new StringBuilder(data.length());
    for (char c : data.toCharArray()) {
      if (!Character.isWhitespace(c)) {
        temp.append(c);
      } // else ignore
    }
    String s = temp.toString();

    // Convert to byte
    final int bufferLength = s.length() * 3 / 4 - (s.endsWith("==") ? 2 : s.endsWith("=") ? 1 : 0);
    final byte[] buffer = new byte[bufferLength];
    final int sLength = s.length();
    int index = 0;
    int c0, c1, c2, c3;
    for (int i = 0; i < sLength; i += 4) {
      c0 = TO_INT[s.charAt(i)];
      c1 = TO_INT[s.charAt(i + 1)];
      buffer[index++] = (byte) (((c0 << 2) | (c1 >> 4)) & 0xFF);
      if (index >= bufferLength) {
        return buffer;
      }
      c2 = TO_INT[s.charAt(i + 2)];
      buffer[index++] = (byte) (((c1 << 4) | (c2 >> 2)) & 0xFF);
      if (index >= bufferLength) {
        return buffer;
      }
      c3 = TO_INT[s.charAt(i + 3)];
      buffer[index++] = (byte) (((c2 << 6) | c3) & 0xFF);
    }
    return buffer;
  }

  public static final String DATA_URI_PREFIX = "data:";
  public static final String DATA_URI_BASE64_ENC = ";base64";

  /**
   * A Data URI encoded in base 64.
   */
  public static class Base64DataURI {
    private final String mimeType;
    private final byte[] data;

    public Base64DataURI(String mimeType, byte[] data) {
      this.mimeType = mimeType;
      this.data = data;
    }

    public byte[] getData() {
      return data;
    }

    public String getMimeType() {
      return mimeType;
    }

    /**
     * Encode the data according to the data URI scheme (See <a href="http://en.wikipedia.org/wiki/Data_URI_scheme">Wikipedia</a> for more details).
     */
    public String encode() {
      return DATA_URI_PREFIX + getMimeType() + DATA_URI_BASE64_ENC + "," + encodeBase64(getData());
    }

    @Override
    public String toString() {
      return encode();
    }
  }

  public static Base64DataURI decodeBase64DataURI(String dataURI) throws ParseException {
    if (dataURI.startsWith(DATA_URI_PREFIX) == false) {
      throw new ParseException("Data URI should start with 'data:'", 0);
    }
    // Check comma and split header
    int commaIndex = dataURI.indexOf(',');
    if (commaIndex == -1) {
      throw new ParseException("Comma is mandatory in Data URI", 0);
    }
    String header = dataURI.substring(0, commaIndex);

    // Decode Split data as base64
    int indexOfBase64 = header.indexOf(DATA_URI_BASE64_ENC);
    if (indexOfBase64 == -1) {
      throw new ParseException("Only Data URI encoded in base64 are supported", header.length());
    }
    byte[] data = decodeBase64(dataURI.substring(commaIndex + 1));
    // Parse mime type
    String mimeType = header.substring(DATA_URI_PREFIX.length(), indexOfBase64); // Not 100% right (see http://tools.ietf.org/html/rfc2397)

    return new Base64DataURI(mimeType, data);
  }
}
