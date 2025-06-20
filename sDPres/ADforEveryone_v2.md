```
#!/bin/zsh

#################################################
#				Reused Variables				#
#################################################
target_adstatus="Everyone"
banner="/System/Library/Desktop Pictures/.wallpapers/Sequoia Sunrise/Sequoia Sunrise.heic"
logo="/System/Library/ExtensionKit/Extensions/WallpaperMacintoshExtension.appex/Contents/Resources/MacPaint.png"
ibutton="About AirDrop"
iaction="https://paretosecurity.com/auditor/checks/airdrop"
log="/private/var/log/[org.name].status.airdrop.log"
#												#
#												#
#												#
#################################################

# Get the current AirDrop status
current_adstatus=$(defaults read ~/Library/Preferences/com.apple.sharingd.plist DiscoverableMode)

# Check if the current AD matches the target AD
if [ "$current_adstatus" = "$target_adstatus" ]; then
    # Make a record of it
    if [[ ! -f "$log" ]]; then
    touch "$log"
    fi
    echo "AirDrop Enabled for Everyone as of $( date +%Y-%m-%d\ %H:%M:%S )" >> "$log"
    echo "AirDrop Enabled for Everyone as of $( date +%Y-%m-%d\ %H:%M:%S )"
    # Show a warning message
    /usr/local/bin/dialog \
		--big \
		--title "AirDrop Enabled for Everyone" \
		--message "It looks like your Mac is allowing AirDrop connections from any device. This can be used for malicious purposes. It is recommended to restrict AirDrop to Contacts Only or to turn it off altogether if unneeded.\n\nWould you like to open AirDrop settings to adjust them?" \
		--icon $logo \
		--bannerimage $banner \
		--button1text "Yes" \
		--button2 \
		--button2text "No" \
		--infobuttontext $ibutton \
		--infobuttonaction $iaction
	case $? in
      0)
      echo "Pressed Yes"
      # Button 1 processing here
      open x-apple.systempreferences:com.apple.AirDrop-Handoff-Settings.extension
      /usr/local/bin/dialog \
		  --big \
		  --title "Continue When Ready" \
		  --message "Once you have updated the AirDrop settings, press Continue below"  \
		  --icon $logo \
		  --bannerimage $banner \
		  --button1text "Continue" \
		  --infobuttontext $ibutton \
		  --infobuttonaction $iaction
      current_adstatus=$(defaults read ~/Library/Preferences/com.apple.sharingd.plist DiscoverableMode)
      if [ "$current_adstatus" != "$target_adstatus" ]; then
      /usr/local/bin/dialog \
		  --big \
		  --title "AirDrop Updated" \
		  --message "Thank you for changing your AirDrop settings to $current_adstatus." \
		  --icon $logo \
		  --bannerimage $banner \
		  --button1text "Close"
      else
      	/usr/local/bin/dialog \
			--big \
			--title "AirDrop Unchanged" \
			--message "AirDrop is still enabled for Everyone. If you need assistance updating the settings, please contact Support."  \
			--icon $logo \
			--bannerimage $banner \
			--button1text "Close" \
			--infobuttontext $ibutton \
			--infobuttonaction $iaction
      	echo "AirDrop settings not changed." >> "$log"
      	echo "AirDrop settings not changed."
      fi
      ;;
      2)
      echo "Pressed No (button 2)"
      # Button 2 processing here
      echo "AirDrop enabled for $target_adstatus. Settings were not changed. A warning message has been displayed." >> "$log"
      echo "AirDrop enabled for $target_adstatus. Settings were not changed. A warning message has been displayed."
      ;;
	esac


else
    echo "AirDrop not enabled for $target_adstatus."
fi
```