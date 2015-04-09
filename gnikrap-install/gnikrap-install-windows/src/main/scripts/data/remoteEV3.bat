@echo off
echo.

setlocal
set INSTALL_ALL_NAME=gnikrap-install-all-${project.version}
set PLINK_CMD=plink %1 -l root -pw ""

rem - =========================================================================
rem - Process arguments
if "%2" == "CHECK_IP" GOTO :CHECK_IP
if "%2" == "CHECK_INSTALL" GOTO :CHECK_INSTALL
if "%2" == "INSTALL_ON_EV3" GOTO :INSTALL_ON_EV3

rem - Print usage and exit
echo Usage: %0 ev3_ip_adress mode
echo.
echo Perform check on the EV3 brick
echo.
echo Otpions:
echo    ev3_ip_address  The IP address of the EV3 brick
echo    mode            The check mode, can be:
echo                    CHECK_IP:       Check that the device at the gievn IP address is an EV3 brick
echo                                    Returns code: 0 if IP ok, 1 otherwise
echo                    CHECK_INSTALL:  Check if Gnikrap has already been installed on this brick or not
echo                                    Returns code: O if not installed, 1 if already installed
echo                    INSTALL_ON_EV3: Install on the EV3 brick
echo                                    Returns code: 0 if installed, 1 otherwise
EXIT /B 1


rem - =========================================================================
rem - Check the IP address
:CHECK_IP
echo Try to ping the EV3...
ping -n 1 %1
if ERRORLEVEL 1 GOTO :FAIL_IP

echo.
echo Check if leJOS is installed on the EV3...
%PLINK_CMD% "ls /home/root/lejos"
if ERRORLEVEL 1 GOTO :FAIL_IP

EXIT /B 0

:FAIL_IP
echo.
echo %1 is not the IP adress of an EV3 brick with leJOS
EXIT /B 1


rem - =========================================================================
rem - Check if Gnikrap installed
:CHECK_INSTALL
echo Check if Gnikrap has already been installed...
%PLINK_CMD% "ls /home/root/.gnikrap/"
if ERRORLEVEL 0 GOTO :FAIL_INSTALL

EXIT /B 0

:FAIL_INSTALL
echo.
echo Gnikrap has already been installed on %1
EXIT /B 1


rem - =========================================================================
rem - Copy files to EV3
:INSTALL_ON_EV3
echo Copying Gnikrap to the EV3 brick...
rem Silently override if already exists
pscp -pw "" -scp %INSTALL_ALL_NAME%.tar.gz root@%1:/home/root
if ERRORLEVEL 1 GOTO :FAIL_INSTALL_ON_EV3

echo.
echo Decompress Gnikrap on the EV3 brick...
%PLINK_CMD% "rm -rf %INSTALL_ALL_NAME%"
if ERRORLEVEL 1 GOTO :FAIL_INSTALL_ON_EV3
%PLINK_CMD% "tar -xzf %INSTALL_ALL_NAME%.tar.gz"
if ERRORLEVEL 1 GOTO :FAIL_INSTALL_ON_EV3
%PLINK_CMD% "rm -f %INSTALL_ALL_NAME%.tar.gz"
if ERRORLEVEL 1 GOTO :FAIL_INSTALL_ON_EV3

echo Move files to the right place on the EV3 brick...
%PLINK_CMD% "cd %INSTALL_ALL_NAME% && ./install.sh -f"
if ERRORLEVEL 1 GOTO :FAIL_INSTALL_ON_EV3
echo Remove temporary files on the EV3 brick...
%PLINK_CMD% "rm -rf %INSTALL_ALL_NAME%"

EXIT /B 0

:FAIL_INSTALL_ON_EV3
echo.
echo Error while installing Gnikrap to the EV3 brick
EXIT /B 1
