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

import java.text.ParseException;

import org.testng.Assert;
import org.testng.annotations.Test;

public class UtilsTest {
  @Test
  public void testBase64() {
    byte[] src = new byte[] { (byte) 30, (byte) 130 };
    Assert.assertEquals(Utils.encodeBase64(src), "HoI=");
    Assert.assertEquals(Utils.decodeBase64("HoI="), src);

    src = new byte[] { (byte) 30, (byte) 130, (byte) 230, (byte) 30 };
    Assert.assertEquals(Utils.encodeBase64(src), "HoLmHg==");
    Assert.assertEquals(Utils.decodeBase64("HoLmHg=="), src);
    Assert.assertEquals(Utils.decodeBase64("H    \n\r    oLm    \n\r\tHg=="), src);
  }

  @Test
  public void testDataURI() throws ParseException {
    byte[] src = new byte[] { (byte) 30, (byte) 130, (byte) 230, (byte) 30 };
    Utils.Base64DataURI dataURI = new Utils.Base64DataURI("application/octet-stream", src);
    System.out.println(dataURI.encode());

    Assert.assertEquals(dataURI.encode(), "data:application/octet-stream;base64,HoLmHg==");

    Utils.Base64DataURI actual = Utils.decodeBase64DataURI("data:application/octet-stream;base64,HoLmHg==");
    Assert.assertEquals(actual.getMimeType(), "application/octet-stream");
    Assert.assertEquals(actual.getData(), src);

    try {
      Utils.decodeBase64DataURI("HoLmHg==");
      Assert.fail("Parse exception expected if 'data:' not present");
    } catch (ParseException pe) {
      // Expected
    }

    try {
      Utils.decodeBase64DataURI("data:HoLmHg==");
      Assert.fail("Parse exception expected if ',' not present");
    } catch (ParseException pe) {
      // Expected
    }

    try {
      Utils.decodeBase64DataURI("data:application/octet-stream,HoLmHg==");
      Assert.fail("Parse exception expected if not base64 encoding");
    } catch (ParseException pe) {
      // Expected
    }
  }
}
