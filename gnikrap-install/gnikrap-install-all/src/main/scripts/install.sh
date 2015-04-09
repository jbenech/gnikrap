#! /bin/sh

# ----------------------------------------------------------------------------
local usage="Usage: ${0##*/} [-h] [-f] [-u]

Install Gnikrap as a leJOS 'plugin'/program.

Options:
    -h  Show this help text
    -f  Never prompt (force uninstall if needed)
    -u  Uninstall only (don't reinstall)"

local force=0
local install=1
local installFolder=/home/root/.gnikrap


# ----------------------------------------------------------------------------
# Uninstall procedure
uninstall() {
  echo "Delete previous installation"
  rm -f $installFolder/*.config
  rm -rf $installFolder/WEB-CONTENT
  rm -f /home/lejos/programs/gnikrap*.jar
  rm -f /home/lejos/programs/gnikrap*.err
  #rm -f /home/root/lejos/tools/gnikrap*.jar
}


# ----------------------------------------------------------------------------
# Install procedure (install Gnikrap as leJOS menu 'program')
install() {
  echo "Install Gnikrap"
  mkdir -p $installFolder
  mkdir -p $installFolder/WEB-CONTENT
  mkdir -p $installFolder/userData
  cp -f installData/*.config $installFolder/
  cp -a WEB-CONTENT/* $installFolder/WEB-CONTENT/
  cp -a userData/* $installFolder/userData/
  cp -f lib/*.jar /home/lejos/programs/
  #cp -f lib/*.jar /home/root/lejos/tools/
}


# ----------------------------------------------------------------------------
# Script main method
# ----------------------------------------------------------------------------

# Make sure only root can run our script
if [ "$(id -u)" != "0" ]; then
   echo "This script must be run as root"
   exit 1
fi

# Process parameters
for p in $*
do
  case $p in
    -f) force=1
      ;;
    -u) install=0
      ;;
    -h)
      echo "$usage"
      exit
      ;;
  esac
done

# Check if uninstall is needed ?
if [ -d $installFolder ]
then
  if [ "$force" = "1" ]
  then
    uninstall;
  else
    echo "Gnikrap already installed, uninstall old version ? [y/n]"
    read word
    case $word in
      [Yy] ) 
        uninstall;
        ;;
      * ) 
        echo "Installation aborted by user"
        exit 1
        ;;
    esac
  fi
fi

if [ "$install" = "1" ]
then
  install;
fi
