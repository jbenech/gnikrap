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
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;

import org.gnikrap.utils.Configuration;
import org.testng.Assert;
import org.testng.annotations.Test;

import com.eclipsesource.json.JsonObject;
import com.eclipsesource.json.JsonObject.Member;

/**
 * Check for webapp translation <br/>
 */
public class TranslationTest {

  @Test(description = "Ensure that the json files are syntaxically correct")
  public void testTranslationFiles() {
    List<File> files = loadTranslationFiles();
    Assert.assertTrue(files.size() > 0, "No translation files found");

    // Load all files in order to check json
    Map<String, Map<String, JsonObject>> translations = new HashMap<>();
    for (File f : files) {
      System.out.println("Checking file: " + f);
      try (Reader r = new FileReader(f)) {
        JsonObject json = JsonObject.readFrom(r);
        String lang = f.getParentFile().getName();
        if (!translations.containsKey(lang)) {
          translations.put(lang, new HashMap<String, JsonObject>());
        }
        translations.get(lang).put(f.getName(), json);
      } catch (Exception ioe) {
        Assert.fail("Problem on file '" + f + "': " + ioe, ioe);
      }
    }

    // Compare the files from the reference (english)
    Map<String, JsonObject> english = translations.get("en");
    Assert.assertNotNull(english, "Reference (English) translation not found");
    for (Map.Entry<String, Map<String, JsonObject>> e : translations.entrySet()) {
      if (english != e.getValue()) {
        checkTranslation(english, e.getKey(), e.getValue());
      }
    }
  }

  /**
   * <ul>
   * <li>Check all fields defined in toCheck exist in ref
   * <li>Compute coverage
   * </ul>
   */
  private void checkTranslation(Map<String, JsonObject> ref, String lang, Map<String, JsonObject> toCheck) {
    Set<String> refSet = flatten(ref);
    Set<String> toCheckSet = flatten(toCheck);
    Set<String> toCheckSet2 = new HashSet<>(toCheckSet);

    // Check for useless translation (not in reference)
    toCheckSet.removeAll(refSet);
    if (toCheckSet.size() > 0) {
      for (String s : toCheckSet) {
        System.out.println("    WARN - Useless translation in [" + lang + "]: " + s);
      }
    }
    // Check translation coverage
    // refSet.removeAll(translationToIgnore);
    removeTranslationToIgnore(refSet);
    removeTranslationToIgnore(toCheckSet2);
    // toCheckSet2.removeAll(translationToIgnore);
    int refCount = refSet.size();
    refSet.removeAll(toCheckSet2);
    int notTranslated = refSet.size();
    System.out.println("INFO - [" + lang + "] translation coverage is: " + (int) ((refCount - notTranslated) * 100.0 / (refCount)) + " %");
    if (notTranslated > 0) {
      for (String s : refSet) {
        System.out.println("    WARN - Missing translation in [" + lang + "]: " + s);
      }
    }
  }

  // Translation linked to bugs of Gnikrap (should never happens) <=> Not needed to be translated
  private final String[] translationToIgnore = { //
      "translation.json.server.errors.INVALID_MESSAGE_FIELD_FORMAT", //
      "translation.json.server.errors.MESSAGE_FIELD_NOT_FOUND", //
      "translation.json.server.errors.SCRITP_LANGUAGE_NOT_SUPPORTED", //
      "translation.json.server.errors.UNKNOWN_ACTION", //
      "translation.json.autocompletion." };

  private void removeTranslationToIgnore(Set<String> data) {
    for (Iterator<String> it = data.iterator(); it.hasNext();) {
      String s = it.next();
      for (String toIgnore : translationToIgnore) {
        if (s.startsWith(toIgnore)) {
          it.remove();
          break;
        }
      }
    }
  }

  private Set<String> flatten(Map<String, JsonObject> ref) {
    Set<String> result = new TreeSet<>();
    for (Map.Entry<String, JsonObject> e : ref.entrySet()) {
      flatten(e.getValue(), e.getKey(), result);
    }
    return result;
  }

  private void flatten(JsonObject ref, String path, Set<String> target) {
    for (Member m : ref) {
      String newPath = path + (path.length() > 0 ? "." : "") + m.getName();
      if (m.getValue().isObject()) {
        flatten(m.getValue().asObject(), newPath, target);
      } else {
        if (!m.getName().startsWith("@")) {
          target.add(newPath);
        }
      }
    }
  }

  /**
   * Load the list of translation files available
   */
  private List<File> loadTranslationFiles() {
    String translationPath = null;
    try {
      Configuration c = Configuration.load(TranslationTest.class);
      translationPath = c.getValueAsString("TranslationPath");
    } catch (IOException ioe) {
      Assert.fail("Cannot read the test configuration file", ioe);
    }
    Assert.assertNotNull(translationPath, "Missing translation path");

    return listFiles(new File(translationPath));
  }

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
