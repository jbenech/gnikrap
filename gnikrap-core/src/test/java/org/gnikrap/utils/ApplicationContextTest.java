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

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Set;

import org.testng.Assert;
import org.testng.annotations.Test;

import com.eclipsesource.json.JsonArray;

public class ApplicationContextTest {
  @Test
  public void testWithClass() {
    ApplicationContext ctx = new ApplicationContext();
    ctx.registerObject(new Integer(123));
    ctx.registerObject(new Double(1.23));
    ctx.registerObject("toto");

    Assert.assertEquals(ctx.getObject(String.class), "toto");
    Assert.assertEquals(ctx.getObjects(Integer.class).size(), 1); // 123
    Assert.assertEquals(ctx.getObjects(Number.class).size(), 2); // 123 and 1.23
    Assert.assertEquals(ctx.getObjects(Object.class).size(), 3); // all objects
  }

  @Test
  public void testWithInterfaces() {
    ApplicationContext ctx = new ApplicationContext();
    ctx.registerObject(new ArrayList<Object>());
    ctx.registerObject(new LinkedList<Object>());
    ctx.registerObject(new HashSet<Object>());
    ctx.registerObject(new JsonArray());

    Assert.assertEquals(ctx.getObjects(List.class).size(), 2); // ArrayList and LinkedList
    Assert.assertEquals(ctx.getObjects(Set.class).size(), 1); // HashSet
    Assert.assertEquals(ctx.getObjects(Collection.class).size(), 3); // HashSet, ArrayList and LinkedList
    Assert.assertEquals(ctx.getObjects(Iterable.class).size(), 4); // all objects
  }
}
