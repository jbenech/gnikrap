/*
 * Gnikrap is a simple scripting environment for the Lego Mindstrom EV3
 * Copyright (C) 2014 Jean BENECH
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

import java.io.PrintWriter;
import java.io.StringWriter;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.logging.Formatter;
import java.util.logging.Handler;
import java.util.logging.Level;
import java.util.logging.LogManager;
import java.util.logging.LogRecord;
import java.util.logging.Logger;

/**
 * Provide some basic utilities to use default JRE Logging fwk.
 */
public class LoggerUtils {

  private LoggerUtils() { // Avoid instantiation
  }

  /**
   * Default initialization of the Logging fwk - Replace default formatter.
   */
  public static void initializeLogging() {
    LogManager.getLogManager();
    for (Handler h : Logger.getLogger("").getHandlers()) {
      h.setFormatter(new OneLineFormatter());
    }
  }

  /**
   * 
   */
  public static void setDefaultLogLevel(String level) {
    Level l = Level.parse(level);
    Logger.getLogger("").setLevel(l);
  }

  /**
   * @return the {@see Logger} for this class
   */
  public static Logger getLogger(Class<?> clazz) {
    return Logger.getLogger(clazz.getName());
  }

  /**
   * Print a log on a simple line
   */
  public static final class OneLineFormatter extends Formatter {
    private static final String LINE_SEPARATOR = System.getProperty("line.separator", "\n");
    private static final String FIELD_SEPARATOR = " - ";

    private final SimpleDateFormat dateFormat = new SimpleDateFormat("yyyyMMdd HH:mm:ss.SSS");;
    private final Date tempDate = new Date();

    /**
     * Format the given LogRecord.
     * 
     * @param record the log record to be formatted.
     * @return a formatted log record
     */
    @Override
    public synchronized String format(final LogRecord record) {
      StringBuilder sb = new StringBuilder(256);

      // Date
      tempDate.setTime(record.getMillis());
      sb.append(dateFormat.format(tempDate)).append(FIELD_SEPARATOR);

      // Level
      sb.append(record.getLevel().getName()).append(FIELD_SEPARATOR);

      // Source
      if (record.getSourceClassName() != null) {
        sb.append(record.getSourceClassName());
      } else {
        sb.append(record.getLoggerName());
      }
      if (record.getSourceMethodName() != null) {
        sb.append("/").append(record.getSourceMethodName());
      }
      sb.append(FIELD_SEPARATOR);

      // Message
      sb.append(formatMessage(record)).append(LINE_SEPARATOR);

      // Exceptions (if any)
      if (record.getThrown() != null) {
        StringWriter sw = new StringWriter(256);
        PrintWriter pw = new PrintWriter(sw);
        record.getThrown().printStackTrace(pw);
        sb.append(sw);
      }

      return sb.toString();
    }
  }
}
