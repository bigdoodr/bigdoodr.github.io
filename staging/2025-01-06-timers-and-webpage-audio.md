---
layout: post
title: "Timers and Webpage Audio"
description: "My trek through getting a sound to play in a webpage when a timer ends."
date: 2025-01-06T20:10:39-6:00
tags: Tech, Fitness
image: /resources/stopwatch.png
---

# Timers and Webpage Audio

- /sounds/beep.mp3 included in original zone2randomizer page
	- tested in computer browser; navigated to mp3 file first, then used same tab to go to the page and generate a workout; no issues encountered
- after publishing zone2randomizer page, started working on a new page for creating separate timers based upon exercise parameters, e.g. as many reps as you can do in 30 seconds for 4 rounds with 15 second breaks in-between followed by 6 rounds of 12 reps with 90 second breaks in-between
	- needed a similar audible indicator of when the exercise and/or rest timer expired and it's time to move to the next round
	- used same code for playing /sounds/beep.mp3, but couldn't get it to play
	- noticed this issue on both my phone and my computer; realized zone2randomizer page had the same issue, but that I didn't know it because I had pre-loaded the file on my computer
- with ChatGPT's help, got the code figured out for initializing the sound when visiting each page
- quickly realized that on my phone, though the sound played correctly, it stopped all other audio
	- after a little bit of digging, came across [Playing Audio Resources Simultaneously in JavaScript](https://blog.cotten.io/playing-audio-resources-simultaneously-in-javascript-546ec4d6216a) by Tim Cotten
	- again with ChatGPT's assistance, was able to adapt Tim's example for both pages; the sound plays without stopping other audio
- though not entirely perfect (specifically, if the browser loses focus on mobile), the new timer page is in good enough shape to publish
	- drag and drop works, but actually order of exercises remains as original creation
- example routine: [10 minute abs from Jeff's YouTube video](/exercises/10MinuteAbsByJeffCavaliere.json) / [exercises bookmark link](/DailyExercises.html)
- exercises can be renamed, moved around (though not triggering properly at time of writing), and deleted
- routines can be saved/exported in json format and imported for re-use