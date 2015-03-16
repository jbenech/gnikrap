package org.gnikrap.utils;

import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

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
      return null;
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

}
