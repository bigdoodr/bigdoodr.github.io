---
layout: post
title: "Timers and Webpage Audio"
description: "My trek through getting a sound to play in a webpage when a timer ends."
date: 2025-01-20T17:10:39-6:00
tags: Tech Fitness
image: /resources/stopwatch.png
---
In my previous fitness post, I wrote about creating a randomized warmup routine. 
What I didn't realize then was that the soundfile of a whistle blowing at the end of each timer wasn't playing. 
While building the page, I tested it on my computer--the first thing I did was navigate to the mp3, then used same tab to go to the randomizer page and generate a workout. 
Because I had preloaded the soundfile, it played without issue when the timer's code called for it.

After publishing the randomizer page, I started working on a new page for creating separate timers based upon exercise parameters, e.g. as many reps as possible (AMRAP) in 30 seconds for 4 rounds with 15 second breaks in-between followed by 6 rounds of 12 reps with 90 second breaks in-between. 
This page needed a similar audible indicator of when the exercise and/or rest timer expired and it's time to move to the next round. 
So I used the same code for playing the whistle sound, but I couldn't get it to play. 
I noticed this issue on both my phone and my computer.
That's when I realized the randomizer page had the same issue, but I hadn't noticed it earlier because the file had been pre-loaded during the testing phase on my computer. 

And so, with ChatGPT's help once again, I got the code figured out for initializing the sound when visiting each page. 
However, I quickly realized that on my phone, though the sound played correctly, it stopped all other audio. 😦 
I started doing a little digging and came across [Playing Audio Resources Simultaneously in JavaScript](https://blog.cotten.io/playing-audio-resources-simultaneously-in-javascript-546ec4d6216a) by Tim Cotten. 
Returning to ChatGPT for assistance, I was able to adapt Tim's example for both pages; the sound plays without stopping other audio. 

Though, it's not entirely perfect, the new timer page is in good enough shape to publish: [Expandable Timer](/exercises/expandableTimer) 
In addition to having both an AMRAP and Sets timers, some other features of the new page include:
- each exercise can be renamed, moved around (though not triggering properly at time of writing), and deleted
- routines can be saved/exported in json format and imported for re-use

One big caveat that I still need to fix: if the browser loses focus on mobile, the sound won't play for the rest of the routine. 

As an example of how to make use of the page, here's a json file of [Jeff Cavaliere's 10 minute abs YouTube video](/exercises/10MinuteAbsByJeffCavaliere.json). You can find a gif guide of the routine on my [Daily Exercises page](/DailyExercises.html).