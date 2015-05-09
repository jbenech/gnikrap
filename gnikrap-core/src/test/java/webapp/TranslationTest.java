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
package webapp;

import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.io.Reader;
import java.util.ArrayList;
import java.util.List;

import org.gnikrap.utils.Configuration;
import org.testng.Assert;
import org.testng.annotations.Test;

import com.eclipsesource.json.JsonObject;

/**
 * Check for webapp translation <br/>
 * Don't find a better simple way to do it
 */
public class TranslationTest {

  @Test
  public void testTranslationFiles() {
    String translationPath = null;
    try {
      Configuration c = Configuration.load(TranslationTest.class);
      translationPath = c.getValueAsString("TranslationPath");
    } catch (IOException ioe) {
      Assert.fail("Cannot read the test configuration file", ioe);
    }
    Assert.assertNotNull(translationPath, "Missing translation path");

    List<File> files = listFiles(new File(translationPath));
    Assert.assertTrue(files.size() > 0, "No translation files found");

    // Load all files in order to check json
    for (File f : files) {
      System.out.println("Checking file: " + f);
      try (Reader r = new FileReader(f)) {
        JsonObject.readFrom(r);
      } catch (Exception ioe) {
        Assert.fail("Problem on file '" + f + "': " + ioe, ioe);
      }
    }
  }

  // TODO: Check that there is no keys defines in translation and not defined in English one (reference)

  private List<File> listFiles(File file) {
    List<File> result = new ArrayList<>();
    if (file.isDirectory()) {
      for (String f : file.list()) {
        result.addAll(listFiles(new File(file, f)));
      }
    } else if (file.isFile() && file.getName().toLowerCase().endsWith(".json")) {
      result.add(file);
    }

    return result;
  }
}
