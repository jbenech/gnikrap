#! /bin/sh

local usage="Usage: ${0##*/} [-h] [-f] [-u]

Install Gnikrap as a leJOS 'plugin'/program.

Options:
    -h  Show this help text
    -f  Never prompt (force uninstall if needed)
    -u  Uninstall only (don't reinstall)"


# ----------------------------------------------------------------------------
# Process parameters
local force=0
local install=1

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

# ----------------------------------------------------------------------------
# Uninstall procedure
uninstall() {
  echo Delete previous installation
  rm -f /home/gnikrap/*.config
  rm -rf /home/gnikrap/WEB-CONTENT
  rm -f /home/lejos/programs/gnikrap*.jar
  #rm -f /home/root/lejos/tools/gnikrap*.jar
}


# ----------------------------------------------------------------------------
# Install procedure (install Gnikrap as leJOS menu 'program')
install() {
  echo Install Gnikrap
  mkdir -p /home/gnikrap
  mkdir -p /home/gnikrap/WEB-CONTENT
  mkdir -p /home/gnikrap/userData
  cp -f installData/*.config /home/gnikrap/
  cp -a WEB-CONTENT/* /home/gnikrap/WEB-CONTENT/
  cp -a userData/* /home/gnikrap/userData/
  cp -f lib/*.jar /home/lejos/programs/
  #cp -f lib/*.jar /home/root/lejos/tools/
}



# ----------------------------------------------------------------------------
# Check if uninstall is needed ?
if [ -d /home/gnikrap ]
then
  if [ "$force" = "1" ]
  then
    uninstall;
  else
    echo Gnikrap already installed, uninstall old version ? [y/n]
    read word
    case $word in
      [Yy] ) 
        uninstall;
        ;;
      * ) 
        echo Installation aborted by user
        exit 1
        ;;
    esac
  fi
fi

if [ "$install" = "1" ]
then
  install;
fi
