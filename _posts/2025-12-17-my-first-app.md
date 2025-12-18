---
layout: post
title: "My First App"
description: "My experience creating an app, with some AI assistance"
date: 2025-12-17T14:19:00-6:00
tags: Tech Fitness
image: /resources/clearback.png
---

## My First App

## TL;DR
I built a workout timer app for iOS/macOS/visionOS. It's currently in TestFlight beta testing. [Get TestFlight](https://apps.apple.com/us/app/testflight/id899247664) → [Download ExpandableExerciseTimer](https://testflight.apple.com/join/mRp4ySuZ)

<a href="https://testflight.apple.com/join/mRp4ySuZ" style="display:inline-block; padding:10px 20px; background:#007AFF; color:white; text-decoration:none; border-radius:8px; font-weight:bold;">Join TestFlight Beta</a>

## Why I Built This  
Each winter, my employer gives us a generous break. Last year I took the time off to create a couple of webpages ([Zone 2 Randomizer](/exercises/Zone2Randomizer), which has gone through quite a few iterations and [Expandable Timer](/exercises/expandableTimer)). For the last calendar year, I've been using the Expandable Timer page as my go-to fitness tool.

Overall, I've been pretty happy with it, but I kept encountering oddities with the audio alerts that are supposed to play when a timer expires. So for this winter break, I decided to make a dedicated Apple OS app to solve these issues once and for all.  

## What It Does  
The app lets you create custom workout routines with:
- **Time-based or rep-based exercises** - Mix and match based on your needs
- **Custom rest periods** - Set different rest times after each exercise
- **Audio alerts** - Get notified when it's time to move on (most of the time - see known issues below)
- **Screen wake** - Keep your device active during workouts
- **Import/Export** - Save and share routines as JSON files
- **Full control** - Pause, resume, or cancel anytime

Perfect for HIIT, circuit training, strength routines, or even non-workout uses (I've started using it as a slow-eating timer, too).

## The Development Journey  
I started by creating an Xcode project and simply adding the HTML file from my expandable timer page. It "worked"—but was a terrible user experience.

So I switched to using [Bitrig](https://testflight.apple.com/join/ENKk1PMU) and had it generate the Swift code for the overall concept. With that, I made a new Xcode project and added the Swift file to it.

Xcode's embedded ChatGPT assistance (added earlier in 2025) was invaluable for fixing various build issues. It also helped me create versions not just for iPhone/iPad, but also for visionOS and macOS devices—making all the needed OS-specific changes automatically.

Granted, it wasn't really that simple. I spent multiple hours each day for about a week getting it to behave as desired—but the AI assistance absolutely streamlined the process SIGNIFICANTLY.

## Navigating App Store Connect

Next was getting the app into Apple's "AppStoreConnect" system. I think I spent as much time figuring that out as I did working in Xcode!
I've still got a couple of errors with the "app previews" and screenshots I uploaded—but I don't have to worry about those until the app is actually in the App Store. For now, it's in TestFlight.

## Try It in TestFlight  
If you're not familiar with TestFlight—it's Apple's pre-App Store testing platform. You can't browse for apps; you have to be "invited" to test individual ones.

### To try my timer app:  
1. First get [TestFlight](https://apps.apple.com/us/app/testflight/id899247664) if you don't have it already
2. Then install my [ExpandableExerciseTimer](https://testflight.apple.com/join/mRp4ySuZ) app.

## Sample Routines to Get Started  
If you want a starter set, here are routines I've made based on Jeff Cavaliere's YouTube Perfect PPL series:  
- [Pull I](https://raw.githubusercontent.com/bigdoodr/bigdoodr.github.io/refs/heads/main/exercises/Pull%20I.json)
- [Push I](https://raw.githubusercontent.com/bigdoodr/bigdoodr.github.io/refs/heads/main/exercises/Push%20I.json)
- [Legs I](https://raw.githubusercontent.com/bigdoodr/bigdoodr.github.io/refs/heads/main/exercises/Legs%20I.json)
- [Pull II](https://raw.githubusercontent.com/bigdoodr/bigdoodr.github.io/refs/heads/main/exercises/Pull%20II.json)
- [Push II](https://raw.githubusercontent.com/bigdoodr/bigdoodr.github.io/refs/heads/main/exercises/Push%20II.json)
- [Legs II](https://raw.githubusercontent.com/bigdoodr/bigdoodr.github.io/refs/heads/main/exercises/Legs%20II.json)

[Full PPL Playlist on YouTube](https://www.youtube.com/playlist?list=PLRS2DE4P39EfbnnL23NnP-ne_BsnxrNPL)

I'm a big fan of Jeff—and I've given him a fair amount of my money over the last few years. His Athlean-X programs are legit. But I thought I'd go cheap-o mode for a bit and try some of his free routines. I'm about a week into the Perfect PPL series and have been really impressed with it!

Another YouTube video of his—[10 Minute Abs](https://www.youtube.com/embed/i27K2ry9jEo)—is another fantastic workout. [Download my routine for it](https://raw.githubusercontent.com/bigdoodr/bigdoodr.github.io/refs/heads/main/exercises/10MinAbs.json).  
**Other routines:**  
* [Slow-eating timer](https://raw.githubusercontent.com/bigdoodr/bigdoodr.github.io/refs/heads/main/exercises/Food%20timer.json) - Eat slowly for 10 minutes, don't eat at all for 5 minutes, return to eating slowly for another 10 minutes. At the end you should feel "satisfied"—but not "full", which indicates you've overeaten.  

## Known Issues (Please Help Test!)  
Before I move the app to the App Store, there's a bug that needs addressing:  
**Background timer issue:** If the routine is started and then the app sleeps or loses focus, the timer keeps counting (as desired), but the audio alert doesn't trigger. A notification will appear in the Notification Center, but it doesn't show as an alert, so you don't notice when it's time to move to the next portion of the routine. Also, it won't advance to the next step in the routine until you return to the app. 😞  
If you use the app and notice any oddities or undesired behaviors, please let me know! And if there's any extra functions you'd like to see added, let me know that too!  

## Tracking Your Progress  
If you're looking for a solution for tracking your exercise journey, I've been using [Obsidian](https://obsidian.md) for the last 3+ months and find it incredibly robust and flexible.  
![screenshot of workout routine tracking in Obsidian](/resources/obsidianExercises.png)  

Here are some placeholder markdown templates you can add to Obsidian to help you get started:
- [Daily Log](https://raw.githubusercontent.com/bigdoodr/bigdoodr.github.io/refs/heads/main/resources/obsidianTemplates/DailyLogTemplate.md)
- [Equipment](https://raw.githubusercontent.com/bigdoodr/bigdoodr.github.io/refs/heads/main/resources/obsidianTemplates/EquipmentTemplate.md)
- [Exercise](https://raw.githubusercontent.com/bigdoodr/bigdoodr.github.io/refs/heads/main/resources/obsidianTemplates/ExerciseTemplate.md)
- [Focus Area](https://raw.githubusercontent.com/bigdoodr/bigdoodr.github.io/refs/heads/main/resources/obsidianTemplates/FocusTemplate.md)
- [Routine](https://raw.githubusercontent.com/bigdoodr/bigdoodr.github.io/refs/heads/main/resources/obsidianTemplates/RoutineTemplate.md)
- [Dashboard](https://raw.githubusercontent.com/bigdoodr/bigdoodr.github.io/refs/heads/main/resources/obsidianTemplates/WorkoutDashboard.md)

## What's Next  
I need to tackle the background notification issue before submitting to the App Store. Once that's done, if time permits and inspiration strikes during the break, I want to return to the workout randomizer page and turn it into an app. 🤞  
