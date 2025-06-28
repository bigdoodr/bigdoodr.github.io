---
layout: default
title: AirDrop for Everyone Enabled Checker v1
description: code blocks for building a script to detect and prompt if AirDrop is enabled for Everyone
date: 2025-06-27T12:33:30-6:00
body_class: codeblock-fullwidth
---

<style>
body.codeblock-fullwidth .container,
body.codeblock-fullwidth .wrapper,
body.codeblock-fullwidth .page-content,
body.codeblock-fullwidth .post,
body.codeblock-fullwidth .content {
  max-width: 100vw !important;
  width: 100vw !important;
  margin: 0 !important;
  padding: 0 !important;
  left: 0 !important;
  right: 0 !important;
  position: relative !important;
}

body.codeblock-fullwidth pre,
body.codeblock-fullwidth pre > code {
  width: 100vw !important;
  max-width: 100vw !important;
  margin: 0 !important;
  border-radius: 0 !important;
  padding-left: 2rem !important;
  padding-right: 2rem !important;
  box-sizing: border-box;
  overflow-x: auto;
}
</style>


```
#!/bin/zsh

# Name the AirDrop status you want to check for
target_adstatus="Everyone"
```
---
```
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
	/usr/local/bin/dialog --jsonfile /path/to/save/file.json
```
---
OR
```
	# Show a warning message
	/usr/local/bin/dialog --big --title "AirDrop Enabled for Everyone" --message "It looks like your Mac is allowing AirDrop connections from any device. This can be used for malicious purposes. It is recommended to restrict AirDrop to Contacts Only or to turn it off altogether if unneeded.\n\nWould you like to open AirDrop settings to adjust them?" --icon "/System/Library/ExtensionKit/Extensions/WallpaperMacintoshExtension.appex/Contents/Resources/MacPaint.png" --bannerimage "/System/Library/Desktop Pictures/.wallpapers/Sequoia Sunrise/Sequoia Sunrise.heic" --button1text "Yes" --button2text "No" --infobuttontext "About AirDrop" --infobuttonaction "https://paretosecurity.com/auditor/checks/airdrop"
```
---
```
	case $? in
      0)
      echo "Pressed Yes"
      # Button 1 processing here
      open x-apple.systempreferences:com.apple.AirDrop-Handoff-Settings.extension
      ;;
      2)
      echo "Pressed No (button 2)"
      # Button 2 processing here
      echo "AirDrop enabled for $target_adstatus. A warning message has been displayed." >> "/private/var/log/[org.name].status.airdrop.log"
      ;;
    esac


else
	echo "AirDrop not enabled for $target_adstatus" >> "/private/var/log/[org.name].status.airdrop.log"
fi
```
