; Gnikrap is a simple scripting environment for the Lego Mindstrom EV3
; Copyright (C) 2015 Jean BENECH
; 
; Gnikrap is free software: you can redistribute it and/or modify
; it under the terms of the GNU General Public License as published by
; the Free Software Foundation, either version 3 of the License, or
; (at your option) any later version.
; 
; Gnikrap is distributed in the hope that it will be useful,
; but WITHOUT ANY WARRANTY; without even the implied warranty of
; MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
; GNU General Public License for more details.
; 
; You should have received a copy of the GNU General Public License
; along with Gnikrap.  If not, see <http://www.gnu.org/licenses/>.


; MyAppTextVersion is defined on the icc compiler command line while called by maven
#ifndef MyAppVersion
#define MyAppVersion "A.B.C.D-SNAP"
#endif
#define MyAppName "Gnikrap"


[Setup]
; Functional/Visual settings
AllowCancelDuringInstall=no
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
DisableReadyMemo=yes
DisableDirPage=yes
DisableProgramGroupPage=yes
PrivilegesRequired=lowest 
SetupIconFile=src\main\innosetup\gnikrap.ico
ShowLanguageDialog=no

; input/output files settings
Compression=none
OutputBaseFilename=insall_on_ev3
OutputDir=target\install
SolidCompression=no
SourceDir=..\..\..\

; No modification on Windows
ChangesAssociations=no
ChangesEnvironment=no
CreateAppDir=no
CreateUninstallRegKey=no
Uninstallable=no
UpdateUninstallLogAppName=no


; Patch some default translation in order to better match our use-case
[Messages]
SetupWindowTitle=Install Gnikrap on your EV3 Brick
; *** "Welcome" wizard page
WelcomeLabel2=This will install Gnikrap on your EV3 brick.%n%nEnsure that leJOS is installed and running on your EV3 brick.%n%nEnsure that a network access is configured and active between your EV3 brick and this computer (either Wifi or point-to-point with Bluetooth).
; *** "Ready to Install" wizard page
ReadyLabel1=Setup is now ready to install Gnikrap on your EV3 brick.
; *** "Preparing to Install" wizard page
WizardPreparing=Installing
PreparingDesc=Installation of Gnikrap on your EV3 brick.
; *** "Setup Completed" wizard page
FinishedLabelNoIcons=Setup has finished installing Gnikrap on your EV3 brick.


[Code]

var
  ipAdressPage: TInputQueryWizardPage;
  installPage: TOutputProgressWizardPage;

  ev3IpAdress: String;

function RemoteEV3(Action: String; ShowCmd: Boolean): Boolean;
var
  cmdResultCode: Integer;
  iShowCmd: Integer;
begin
  Result := true;
  if ShowCmd then begin
    iShowCmd := SW_SHOW;
  end else begin
    iShowCmd := SW_HIDE;
  end;

  if Exec('remoteEV3.bat', ev3IpAdress + ' ' + Action, 'data\', iShowCmd, ewWaitUntilTerminated, cmdResultCode) then begin
    if cmdResultCode <> 0 then begin
      Result := False;
    end;
  end else begin
    // Should not happens
    MsgBox('Error while calling remoteEV3.bat', mbError, MB_OK);
    Result := False
  end;
end;


procedure InitializeWizard();
begin
  ipAdressPage := CreateInputQueryPage(wpWelcome,
    'EV3 brick IP adress ?', '',
    'Please enter your EV3 Brick IP adress (it should be displayed on the leJOS screen), then click Next.');
  // Add items (False means it's not a password edit)
  ipAdressPage.Add('EV3 Brick IP adress:', False);

  installPage := CreateOutputProgressPage('Installation of Gnikrap on your EV3 brick.', '');
end;


function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := True;

  if CurPageID = ipAdressPage.ID then begin
    ev3IpAdress := ipAdressPage.Values[0]
    // Validate IP adress
    if ev3IpAdress = '' then begin
      MsgBox('You must enter an IP adress.', mbError, MB_OK);
      Result := False;
    end;
  end;
end;

// Perform the install here in order to be able to cancel properly the installation.
function PrepareToInstall(var NeedsRestart: Boolean): String;
begin
  Result := '';
  installPage.Show;

  try
    // Check IP adress
    installPage.SetProgress(1, 5);
    installPage.SetText('Checking that the IP adress...' + ev3IpAdress + ' is correct', '');
    if not RemoteEV3('CHECK_IP', False) then begin
      Result := 'No EV3 with leJOS installed found at the IP adress: ' + ev3IpAdress + '.' + #13#10 + 
             'Please check that it''s the right adress and that the brick is on.';
    end;
    
    if Result = '' then begin
      // Check not already installed
      installPage.SetProgress(2, 5);
      installPage.SetText('Checking if Gnikrap has already been installed on your brick', '');
      if not RemoteEV3('CHECK_INSTALL', False) then begin
        if MsgBox('Gnikrap has already been installed on your EV3 brick.' + #13#10 +
                  'Do you want to continue installation anywhere ?', 
                    mbConfirmation, MB_YESNO or MB_DEFBUTTON2) = IDNO then begin
          Result := 'Gnikrap already installed, installation canceled by the user';
        end;
      end;
    end;

    if Result = '' then begin
      // Perform the installation
      installPage.SetProgress(3, 5);
      installPage.SetText('Installation in progress...' + #13#10 +
                          'Don''t close the black box, it display installation progress information and will be automatically closed while installation is done', '');
      if not RemoteEV3('INSTALL_ON_EV3', True) then begin
        Result := 'Unexpected problem while installing Gnikrap on your EV3 brick.';
      end;
    end;

    // Note: While udapting Gnikrap, we have very often a NPE on the the leJOS menu if Gnikrap has been launched before the update
    //       <=> Reboot is performed in order to avoid this issue.
    if Result = '' then begin
      // Perform the EV3 reboot
      installPage.SetProgress(3, 5);
      installPage.SetText('EV3 brick reboot in progress...', '');
      if not RemoteEV3('REBOOT_EV3', False) then begin
        Result := 'Installation done, but an unexpected problem while rebooting the EV3 Brick.';
      end;
    end;
  finally
    installPage.Hide;
  end;
end;

[/Code]
