#! /bin/sh

echo

# ----------------------------------------------------------------------------
# Launch Gnikrap
launchGnikrap() {
  echo "Starting Gnikrap, please wait..."
  exec jrun -cp "lib/*" org.gnikrap.Main
}

# ----------------------------------------------------------------------------
# Kill process using leJOS
killLeJOS() {
  echo "Killing other application using leJOS..."
  ps | grep -v grep | grep ev3classes.jar | awk '{print $1}' | xargs kill -9
}

if ps | grep -v grep | grep ev3classes.jar > /dev/null
then
  echo "Other applications using leJOS are already launched !"
  echo "If you start Gnikrap, the EV3 screen will blink."
  echo "You can:"
  echo "  C: Continue anyway"
  echo "  K: Kill other applications using leJOS and launch Gnikrap"
  echo "  X: Don't launch Gnikrap"
  read word
  case $word in
    [Cc] )
      launchGnikrap;
      ;;
    [Kk] )
      killLeJOS;
      launchGnikrap;
      ;;
    * )
      echo "Gnikrap start aborted by user"
      exit 1
      ;;
  esac
else
  launchGnikrap;
fi
