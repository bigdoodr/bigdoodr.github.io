#!/bin/zsh

# Replace "Everyone" with the AirDrop status you want to check for
target_adstatus="Everyone"

# Get the current AirDrop status
current_adstatus=$(defaults read /Users/[current.user]/Library/Preferences/com.apple.sharingd.plist DiscoverableMode)

# Check if the current AD matches the target AD
if [ "$current_adstatus" = "$target_adstatus" ]; then
    # Make a record of it
    if [[ ! -f "/private/var/log/[org.name].status.airdrop.log" ]]; then
    touch "/private/var/log/[org.name].status.airdrop.log"
    fi
    echo "AirDrop Enabled for Everyone as of $( date +%Y-%m-%d\ %H:%M:%S )" >> "/private/var/log/[org.name].status.airdrop.log"
    # Show a warning message
    /usr/local/bin/dialog -b --title "AirDrop Enabled for Everyone" --message "It looks like your Mac is allowing AirDrop connections from any device. This can be used for malicious purposes. It is recommended to restrict AirDrop to Contacts Only or to turn it off altogether if unneeded.\n\nWould you like to open AirDrop settings to adjust them?" --icon "https://www.wku.edu/marketingandcommunications/images/wkucuptall.png" --bannerimage "https://www.wku.edu/admissions/images/cherry.jpeg" --button1text "Yes" --button2 --button2text "No" --infobutton "More Info about AirDrop" --infobuttonaction "https://paretosecurity.com/auditor/checks/airdrop"
    case $? in
      0)
      echo "Pressed Yes"
      # Button 1 processing here
      open x-apple.systempreferences:com.apple.AirDrop-Handoff-Settings.extension
      ;;
      2)
      echo "Pressed No (button 2)"
      # Button 2 processing here
      ;;
      esac
      echo "AirDrop enabled for $target_adstatus. A warning message has been displayed." >> "/private/var/log/[org.name].status.airdrop.log"
      

else
    echo "AirDrop not enabled for $target_adstatus." >> "/private/var/log/[org.name].status.airdrop.log"
fi