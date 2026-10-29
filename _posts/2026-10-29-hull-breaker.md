---
layout: post
title: "Hull Breaker: Building a Retro Horror Shooter with Claude"
description: "How I directed Claude to build a Duke Nukem / Dead Space-style browser shooter without writing a line of code, with every prompt I used."
date: 2026-10-29T07:00:00-05:00
author: bigDoodR
tags: Tech AI Gaming
image: /assets/hull-breaker-blog/hb-01-title.jpg
---

I built a playable retro horror shooter in about a week of evenings without writing a line of code. It's called **Hull Breaker**, and you can [play Deck 01 here](/hull-breaker/) in a browser on a computer, phone, or game console.

The spark was Simon Willison's post [Battle Drones, a vibe coded RTS with audio-based multiplayer](https://simonwillison.net/2026/Oct/20/battledrones/). He walks through each version of his game, the prompts that produced it, and what he learned. I've followed his writing for a long time, and that post made me want to try the same thing with a game I'd want to play.

My pitch was a hybrid of two favorites: Duke Nukem's attitude and Dead Space's dismemberment combat. You play Buck Hammersmith, a gravel-voiced repo man sent to repossess a derelict mining ship whose dead crew won't stay dead. It looks and sounds like a 1990s shareware episode: a low-res raycaster, CRT scanlines, synthesized music, and voiced audio logs.

![Hull Breaker title screen with a cracked, glowing moon and the New Game menu](/assets/hull-breaker-blog/hb-01-title.jpg)

*The title screen. Sit on it for eight seconds and the trailer starts.*

Here's how it came together, the prompts that drove it, and what surprised me. The full transcript of my side of the conversation is at the end, with story spoilers redacted.

## How I built this

The whole first deck came out of one Claude chat: 23 prompts from me between October 20 and October 28, 2026, mostly in four sittings. Claude (Opus 5.5) wrote and tested all of the code. My job was to describe what I wanted, play it on real devices, and say what was wrong.

Along the way Claude pulled in a surprising toolkit on its own:

- **The game** is one self-contained HTML file, about 2.2 MB, with a hand-rolled raycasting engine, procedural audio, and keyboard, controller, and touch input.
- **Voices** come from [Kokoro](https://github.com/thewh1teagle/kokoro-onnx), an open-source text-to-speech model, run through custom audio processing.
- **Quality checks:** Claude played the game in a headless Chrome browser to take screenshots, and ran every voice line through speech recognition (faster-whisper) to confirm the words came out clearly.
- **Hosting** is free on GitHub Pages. Claude committed and pushed to my repo once I connected GitHub.

I did almost none of the debugging, but I did all of the playtesting, and that turned out to matter a lot.

## v1: the one-prompt demo

I started with a single, fairly ambitious prompt:

> Create a complete first level demo of a video game that's a hybrid of Duke Nukem and Dead Space, including a trailer that plays automatically after sitting at the start screen for a few seconds and really sells the setting and tells the story. It should have an overall feel of what the full game would be, both fun and scary while nostalgic. It should be playable in a browser and from a mobile device, supporting keyboard, controller, and screen tap inputs.

What came back was already recognizably a game. Claude invented the name, the setting, the hero and his employer, and deliberately kept everything original rather than borrowing from either franchise.

- **A trailer** that starts after eight idle seconds: a distress beacon, the ship approaching a cracked moon, a corpse that twitches and lunges at the camera, Buck's introduction card, a combat montage, and a title slam.
- **Limb-based combat:** Buck's cutter fires a horizontal blade, so aiming at the shoulders takes both arms. Headshots just make enemies angrier.
- **A short level** with a shotgun called the Boomstick, a kick that stomps crawlers, explosive barrels, a keycard ambush that kills the lights, and a brute guarding the exit.
- **Buck's quips**, like "Your contract's been terminated" and "That's a limb-ited warranty."

![Trailer shot of the moon Ruin with glowing cracks and the caption Something inside cracked back](/assets/hull-breaker-blog/hb-02-trailer-moon.jpg)

![Trailer card introducing Buck Hammersmith, licensed repossession agent, ships recovered 41, payment plans offered 0](/assets/hull-breaker-blog/hb-03-trailer-buck.jpg)

*Two frames from the auto-playing trailer, which Claude wrote and scored entirely in code.*

![First-person view of the cutter's blade severing a husk's arm, with a SEVERED popup](/assets/hull-breaker-blog/hb-04-cutter-sever.jpg)

*The cutter takes an arm. Aim at the shoulders or the knees, not the head.*

It took me about three minutes to finish at 100%. Very fun, very short, and a good foundation.

## Making it work on my iPhone

The first round of feedback came from actually picking up my phone. On iPhone I couldn't tap the menu, the touch controls never appeared, and Buck had no voice, even though everything worked on my computer.

The menu fix was quick. The voice took longer. v1 used the browser's built-in speech synthesis, which stayed silent on my iPhone in both Safari and the Claude app. Claude's fix was to stop relying on the device: it recorded every Buck line ahead of time with a text-to-speech model, processed the audio, and embedded the clips in the page. That gave him a voice everywhere.

This was the first of several bugs that only showed up on a real device. Claude's headless browser tests passed every time; my iPhone disagreed.

## Finding Buck's voice: the Voice Lab

The best idea in the whole project came from getting tired of describing a voice in words.

Buck's first recorded voice was too chipper. I asked for something gruffer, "like he's smoked cigarettes for 30 years," in the Snake Plissken mold. The next take was gruffer but robotic. I asked for deeper, more gravel, slower. Each round trip took a while and got me only a little closer.

So I asked for something different:

> Can you build something that gives me a graphical interface to play with? ... I'd like to customize it to meet what I have in mind without having to keep going back and forth. Ideally, once I've tweaked it, I could simply tell you the parameters I set to achieve what I want and you could incorporate it with that.

Claude built me a **Buck Voice Lab**: a web page with live sliders for pitch, pace, chest size, intonation, hoarseness, growl, breath, grit, EQ, and compression, plus a choice of base voices. I played with it until Buck sounded right, then pasted back the code it generated:

```
BUCK-VOICE {"voice":"michael","pitch":-11,"pace":95,"size":87,"inton":100,"hoarse":37,"growl":55,"breath":61,"grit":54,"low":9.5,"mud":3.5,"pres":6,"bright":5300,"comp":50}
```

Claude re-recorded every line with those exact settings, running the lab's own audio processing in a headless browser so the game matched what I'd heard. That string is now "locked" for the rest of the series.

The lesson echoes Simon's point that tools are effectively free now. When feedback is going in circles, ask for a tool that lets you tune it yourself.

## From 3 minutes to an hour

With Buck sounding right, I turned to the game itself. This prompt changed the scale of the project:

> Let's add a difficulty selector and more areas to explore. Right now, I'd consider the gameplay as "Very Easy". It's also quite short for a full level—I'm able to get 100% achievement in about 3 minutes. I think it should take about an hour on "Normal" difficulty to get 100% for one level.

Claude rebuilt Deck 01 around a much larger map with roughly two dozen rooms and ten hidden secrets. It added five difficulties from Very Easy to Nightmare, two new enemy types (an acid spitter and a bloater that bursts), two new weapons, a three-keycard progression with a power-restore puzzle in the middle, save stations, and collectible asset tags for 100% completion.

![Choose Your Contract difficulty menu with Nightmare selected](/assets/hull-breaker-blog/hb-05-difficulty.jpg)

![The Boomstick firing at a husk in the docking bay](/assets/hull-breaker-blog/hb-06-boomstick.jpg)

*The difficulty picker, and the Boomstick doing what it does best.*

To keep a level that size consistent, Claude also built itself tools I never asked for: a script that builds the level from ASCII art and a validator that proves every room is reachable and the keycards can be collected in order.

I also caught two continuity problems. The trailer's crew count no longer matched the number of monsters in the bigger level, and its "headshots don't matter" claim wasn't true for the new enemies. Claude reworked the numbers and wrote the explanations into the audio logs. When I mentioned I pictured 10 to 15 levels eventually, it scaled the whole story to a 12-deck campaign.

## Voicing the audio logs

The audio logs started as text on screen. I asked what it would take to actually voice them, then said yes. Claude cast each of the 16 crew members with a different Kokoro voice, added a recorder filter so they sound like found tapes, and voiced every log.

Then I asked for a way to hear them without hunting through the level. Claude built a **review page**: every log with a play button and a notes box, plus a casting pool of spare voices, and a button that copies all my notes into one paste. That turned feedback into a tight loop. My first round looked like this:

> - Dockmaster J. Fell: Sounds good. But some dramatic pause before the last line would feel more natural.
> - Crewman P. Oduya: It's good. Adding a breath right before the last sentence would help.
> - Capt. Ilse Varga: 0400 comes out as individual numbers "zero four zero zero". Change it to "oh four hundred" to correct it.

Four rounds taught me where text-to-speech still falls short:

- **Punctuation doesn't create pauses.** Claude ended up recording each side of a pause separately and inserting real silence.
- **There are no emotion controls.** When I asked for fear, urgency, or remorse, Claude tried to fake it by speeding up or shifting pitch. My notes on that round were blunt: one line sounded "like a kid almost," another "like it's being played back at 2x speed."
- **Subtle processing works better.** A slight tremble and more breath read as nervous without making the speaker sound like a different person.

Claude was upfront about the limits throughout and suggested a human voice actor or an emotion-capable voice service if the approximations weren't good enough. By round four I called them "acceptable, given the limitations of the engine," except for one log that now sounded "like a drunk robot." One more pass fixed that. For a retro shareware feel, it's plenty.

![Audio Logs archive in the pause menu showing a dockmaster's log transcript](/assets/hull-breaker-blog/hb-07-log-archive.jpg)

*The pause-menu log archive replays any voiced log you've found.*

## Maps, navigation, GitHub Pages and the Xbox

Once I actually played the bigger level, two things stood out. Wall text and the SAVE label were rendering mirrored, and I loved the map overlay but wanted more from it. Claude fixed the text and made the map behave like Resident Evil's: rooms you've explored fill in, and a "?" marks rooms with undiscovered secrets. I had it gate that hint by difficulty: shown right away on Easy and Very Easy, and only after a room is cleared on Normal and up.

Next I wondered whether it would run on my Xbox Series X through the Edge browser. Claude researched it, added proper support for the Xbox controller, and walked me through publishing to my GitHub Pages site. I connected GitHub, Claude committed and pushed, and three minutes later it was live at a real URL.

Then I got lost. The level is big enough that I spent a while walking every room with the map open, looking for the red keycard door. So I asked for three things, and Claude built them:

1. **Room names** in a screen corner whenever you re-enter a room.
2. **A path to the objective** on a button press, Dead Space style: a glowing line on the floor from your feet to the next goal, recalculated at each stage.
3. **An audio log archive** in the pause menu, so you can replay anything you've found.

![Deck 01 map overlay with cleared rooms in blue, rooms with items left in red, and a legend](/assets/hull-breaker-blog/hb-08-map.jpg)

![Map overlay with a dotted cyan route from Buck's position to the next objective](/assets/hull-breaker-blog/hb-09-route.jpg)

*The Resident Evil-style map: blue rooms are cleared, red ones still have items. Press the route button and a dotted path leads to the next objective.*

I also asked for a soundboard of all of Buck's lines, like the log review page, and sent back pronunciation notes. "Repossessed" was coming out as "rip-o-zessed," so Claude fed the voice engine exact phonetic sounds instead. "Read" was present tense. And Buck's growl kept turning his pain cry "Ow" into "now," so after testing seven variations it became "Ouch!"

One process rule I set here, and recommend: no pushes to the live site until I've confirmed the fixes. Every update on GitHub is a tested, complete state.

## Twelve decks and a series bible

The last prompt in the chat set up everything after Deck 01. I asked for four things at once: fix a wonky shotgun, plan Army of Darkness-style homage for later levels, make the game episodic with 12 levels gated by completion, and give every future level its own chat:

> I figure continued development of each level should get its own dedicated chat, so we need a project to place this into—and instructions for how the pending episodes need to be generated, weaving the overarching storylines together and ensuring there aren't any inconsistencies.

Claude added a Deck Select screen to the game, pushed the update, and wrote a **series bible**: a shared doc that every future chat reads first. I won't share its contents, because it's the whole story, but its structure is the interesting part:

- **Canon facts:** a table of fixed names, numbers, and dates that later decks may add to but never change.
- **Voice cast:** Buck's locked voice code and an assigned voice for every character, plus a reserve list for new ones.
- **The arc:** one row per deck with its story beat, new enemy, new weapon, and boss.
- **Systems:** difficulty, saves, what carries between decks.
- **Homage rules:** affectionate nods only. Situations, wordplay, and fictional movie posters are fine; copied lines, character names, logos, and music are not.
- **A per-deck checklist**, from level design and validation to voice checks, a playable preview for me, and updating the bible.

![Deck Select screen listing 12 decks, with only Deck 01 Repo Day unlocked](/assets/hull-breaker-blog/hb-10-deck-select.jpg)

*Deck Select. Each deck unlocks when you clear the one before it.*

The bible ended with a list of open questions only I could answer, about story and game design. Answering those felt like the most "game director" part of the whole project. The bible now lives in a Claude Project whose instructions tell every chat to read it first and work on one deck at a time.

## Some thoughts

I'm not a game developer, which made this a good test of what these tools can do outside my own expertise. A few observations:

- **Playtesting is the job.** Claude tested constantly in a headless browser, and those tests caught a lot. They never caught a menu my thumb couldn't tap, a voice my iPhone wouldn't play, or a level so big I got lost. Real devices and real play found every one of those.
- **Ask for a tool instead of another round trip.** The Voice Lab, the log review page, and Buck's soundboard each turned vague back-and-forth into a precise, pasteable answer. They cost me nothing to request.
- **Make feedback structured.** The review pages produced notes in a consistent format, line by line, and Claude acted on them precisely. It also made it easy to see when a change was a regression.
- **Know the medium's limits.** Text-to-speech can't yet act. Claude said so plainly rather than pretending, which kept me from chasing a result the engine couldn't give.
- **Plan for context early.** One giant chat worked for one level, but it won't for twelve. The series bible and one-chat-per-deck rule are my attempt at keeping a long project consistent.
- **Static HTML is a great platform.** One file runs on my laptop, iPhone, and Xbox, hosted free on GitHub Pages.

Like Simon, I feel a little guilty about how good the result is relative to the effort I put in. Mostly, though, I had a blast, and I'm looking forward to Deck 02.

**Links:** [Battle Drones—a vibe coded RTS with audio-based multiplayer](https://simonwillison.net/2026/Oct/20/battledrones/) by Simon Willison · [Hull Breaker Deck 01](/hull-breaker/)

## Transcript

These are all 23 of my prompts, verbatim, typos included. Claude's replies are condensed to a line or two each, because the originals include thousands of lines of code and test output. Story details from the series bible are marked \[redacted\].

### October 20

**Casey:** Create a complete first level demo of a video game that's a hybrid of Duke Nukem and Dead Space, including a trailer that plays automatically after sitting at the start screen for a few seconds and really sells the setting and tells the story. It should have an overall feel of what the full game would be, both fun and scary while nostalgic. It should be playable in a browser and from a mobile device, supporting keyboard, controller, and screen tap inputs.

**Claude:** Built Hull Breaker: Episode One as a single HTML page with an original name, story, and hero. It included an auto-playing trailer, limb-cutting combat, a shotgun, kicks, explosive barrels, a keycard ambush, a brute at the exit, three text logs, and keyboard, controller, and touch controls. It was tested in a headless browser, but Claude noted it couldn't hear the audio.

**Casey:** That's pretty awesome so far.

A couple of things: on my iPhone, I couldn't interact with the menu. I was able to tap the screen to turn on sound, but the virtual controls didn't appear. Also, the main character only had a voice when I used my computer—he was silent in my iPhone.

**Claude:** Fixed menu taps and the touch controls on iOS, and changed how the speech voice starts on iPhone.

**Casey:** Hmm, I tried both the Claude app and Safari ands had the same experience in both as before; no voice, but tapping the menu choices worked as desired.

**Claude:** Replaced the browser's speech synthesis with Buck lines pre-recorded by a text-to-speech model and embedded in the page as audio.

**Casey:** Awesome! That gave him a voice!
But he sounded too chipper. I want him to be a lot gruffer, like he's smoked cigarettes for 30 years or something—Snake Plisken-like, from Escape from New York.

**Claude:** Re-processed Buck's lines with a lower, rougher voice.

**Casey:** Hmm. That's a lot more robotic than I want. Deeper, more gravel, and slower would be good, too.

This is a bit of a side track — what would it take to play this on my Apple TV? Would it need to be a full app?

**Claude:** Made a deeper, slower take and explained what an Apple TV version would involve.

### October 26

**Casey:** Thanks. That won't be necessary for now.

But I'm curious, regarding the different voice takes: can you build something that gives me a graphical interface to play with? Or might there be something out there on the internet already? I'd like to customize it to meet what I have in mind without having to keep going back and forth. Ideally, once I've tweaked it, I could simply tell you the parameters I set to achieve what I want and you could incorporate it with that.

**Claude:** Built the Buck Voice Lab, a page with live sliders that generates a settings code to paste back.

**Casey:** Great! I think I want to go with this:

BUCK-VOICE {"voice":"michael","pitch":-11,"pace":95,"size":87,"inton":100,"hoarse":37,"growl":55,"breath":61,"grit":54,"low":9.5,"mud":3.5,"pres":6,"bright":5300,"comp":50}

**Claude:** Re-recorded every Buck line with those exact settings.

### October 27

**Casey:** Great! Thanks!

Now let's tweak the demo itself. Let's add a difficulty selector and more areas to explore. Right now, I'd consider the gameplay as "Very Easy". It's also quite short for a full level—I'm able to get 100% achievement in about 3 minutes. I think it should take about an hour on "Normal" difficulty to get 100% for one level. I think the difficulty range could be: very easy, easy, normal, hard, and "Nightmare".

**Claude:** Rebuilt Deck 01 as a much larger level with five difficulties, new enemies and weapons, a three-keycard progression, save stations, secrets, and collectible asset tags.

**Casey:** Awesome! I haven't played through it yet, but I like the potential!

It would be good to adjust the trailer some, I think, though. Currently it says "91 crew"; given that the first level can have way more than that, the number should either be increased and/or an explanation added, perhaps in the audio logs, as to why there are so many more creatures appearing.

There's also a caption about head shots not mattering. With the new monster type, that's not always true. If it's not revealed in the trailer, then that should also be accounted for in an audio log.

And regarding the audio logs, right now, they're not actually audio, right? It's just text that appears? What ramifications would there be if voices were synthesized for each log?

**Claude:** Proposed fixes for both continuity issues and explained the trade-offs of voicing the logs, including file size and casting a voice per speaker.

**Casey:** Yes! Absolutely!

Also, I envision this eventually being 10-15 chapters (or levels). So that should also be accounted for in the trailer and overall count of enemies, logs, etc.

**Claude:** Updated the trailer and logs for a longer campaign and voiced all 16 audio logs, each with its own voice.

**Casey:** Fantastic! Thank you!

For the voices: is there a way I can listen to each of them without having to discover them while playing the level? I'd like to get a feel for them quickly and provide feedback if needed.

**Claude:** Built a log review page with play buttons, notes, a casting pool of spare voices, and a copy-feedback button.

**Casey:** Wow! Those are great overall! I really like the voices selected/generated. Perhaps the others could be used later on other levels.
Here are my notes for the current setup:

LOG VOICE FEEDBACK

- Dockmaster J. Fell (Dock Office, am\_eric): Sounds good. But some dramatic pause before the last line works feel more natural.
- Tech L. Marquez (Hydroponics, am\_puck): Quite good overall. But the last couple of sentences would benefit if they were spaced out from the previous section. And each other.
- Crewman P. Oduya (Crew Bunks, am\_echo): It's good. Adding a breathe right before the last sentence would help.
- Capt. Ilse Varga (Captain's Quarters, af\_kore): 0400 comes out as individual members "zero four zero zero". Change it to "o four hundred" to correct it. The last couple sentences should be a separate paragraph—or some other way to add a pause before they're spoken.
- Chief Engineer B. Tanaka (Chief Engineer's Office, bm\_daniel): Pause between \[redacted\] and \[redacted\] Then another dramatic pause before \[redacted\]. And one more before \[redacted\]
- Tech S. Volkov (Reactor, am\_liam): Dramatic pause needed in last sentence between each description.
- Cargo Master J. Rhee (Cargo Office, af\_sarah): Maybe slightly faster
- Sgt. D. Pruitt (Security, am\_fenrir): New paragraph / pause before \[redacted\] and another before "sorry"
- First Officer K. Shaw (Bridge, af\_nova): Big pauses needed before \[redacted\] then another after it. More despair and/or aggravation if possible.

**Claude:** Re-recorded those logs with real silences for the pauses and post-processing for emotion, and explained that the voice engine has no emotion controls.

**Casey:** LOG VOICE FEEDBACK

- Dockmaster J. Fell (Dock Office, am\_eric): The pause before the last sentence is good, but an element of fear and surprise would bring it home.
- Crewman P. Oduya (Crew Bunks, am\_echo): Pause before the last sentence is good! But some fear in it would help.
- Capt. Ilse Varga (Captain's Quarters, af\_kore): Really good! The final sentence needs some urgency / agitation to it, though.
- Tech S. Volkov (Reactor, am\_liam): Pretty good. The last phrase: \[redacted\] needs a hint of anxiety or fear.
- Sgt. D. Pruitt (Security, am\_fenrir): The "Sorry" is too cheery—almost sarcastic sounding. It should be the opposite. Truly remorseful.
- First Officer K. Shaw (Bridge, af\_nova): The pause before \[redacted\] is unnecessary. The speed slowdown of the second \[redacted\] line is too slow. Additionally, both it and the rest of the log need to sound sadder.

**Claude:** Tried faster delivery and pitch shifts to suggest fear and urgency.

**Casey:** Changes for the last two are good. The others, however, are more of a regression:

LOG VOICE FEEDBACK

- Dockmaster J. Fell (Dock Office, am\_eric): The last line now delivers too fast and too high. Sounds like a different person—like a kid almost.
- Crewman P. Oduya (Crew Bunks, am\_echo): The punctuation for the last half of the log does nothing for the pacing. And it (the last part of the log) sounds like it's being played back at 2x speed or something.
- Capt. Ilse Varga (Captain's Quarters, af\_kore): Sounds like the last couple of statements have been sped up. That doesn't really add the right kind of concern I had in mind.
- Tech S. Volkov (Reactor, am\_liam): The pacing on the last sentence is really awkward now and detracts from the overall experience.

**Claude:** Dropped the speed and pitch changes in favor of tremble, breath, and inserted silence. Recommended a human voice actor or an emotion-capable voice service if the results weren't enough.

**Casey:** Thanks. Those are acceptable, given the limitations of the engine. Except for one:

LOG VOICE FEEDBACK

- Crewman P. Oduya (Crew Bunks, am\_echo): A little too slow. Ends up sounding like a drunk robot for the last phrase.

**Claude:** Sped that log back up slightly.

**Casey:** I just tried the game—I'm really liking things so far!

One thing: it looks like things rendered backwards. The SAVE button text and the "Cut off the Limbs" wall messages were backwards.

I really like the map overlay! Let's add elements that show if an area has been explored and if there's any secrets not yet discovered, similar to how the Resident Evil map behaves.

**Claude:** Fixed the mirrored text and added explored rooms and "?" secret hints to the map, then asked whether the hint should depend on difficulty.

**Casey:** Great!
Yeah, let's gate the "?" hint behind Easy & Very Easy and then only after clearing a room on normal+ difficulties.

**Claude:** Gated the hint as described.

**Casey:** Awesome! This is really good.

Can you tell if the demo would work as-is on a Xbox Series X/S? I know it has the Edge web browser built in to it, but navigating a normal webpage with the game controller is clunky. I wasn't sure how it would interact. Could I export/publish the artifact to my GIthub.io site and try it?

**Claude:** Checked how Edge on Xbox handles controllers, added Xbox controller support, and explained how to publish to GitHub Pages.

**Casey:** Awesome. Here's my repo folder. And I believe I have connected my GitHub to Claude, so I think you can also commit and push it. If not, I'll do it through the GitHub Desktop app.

**Claude:** Committed and pushed. The game went live at bigdoodr.github.io/hull-breaker about three minutes later, with steps for playing it in Edge on the Xbox.

**Casey:** Awesome! I just played through the level. It was a lot of fun!
Can you do a similar soundboard for Buck's lines? I noticed a few mispronunciations that should be easy to tweak.

I'd also like to improve the map/navigation some, as I got lost (because the level is so big now! :-) ), trying to get to the bridge. I ended up keeping the map open as I walked through every room until I finally found the red card door.

1. Showing the names of each room in a screen corner upon  re-entry would be helpful.
2. Having a button press that shows a path to the current objective, similar to Dead Space, would also help.

I also think having access to the found logs in the pause/stats menu for replay would be helpful.

**Claude:** Added room-name tags, a glowing route-to-objective line, and a log archive in the pause menu, and built a Buck Soundboard with all 38 lines. Asked whether to push now or after the pronunciation fixes.

**Casey:** Let's handle pronunciation first

**Claude:** Held the push and asked for soundboard notes, with phonetic spellings where possible.

**Casey:** Great! Here's my feedback:

BUCK LINE FEEDBACK

- "Ship's repossessed. Mostly.": "Repossessed" sounds like rip-o-zessed currently \| say it like: Ship's rhee-po-zessed
- "Great. Repossessed.": Too quick between sentences, and "Repossessed" sounds like rip-o-zessed currently \| say it like: Great. … rhee-po-zessed
- "Hello. What's this?": Too quick between hello and what's; also need more random phrases—with so many secrets, this got repetitive \| say it like: Oh hell-low … what's this?
- "No power, no tram. Figures.": Too quick between tram and figures \| say it like: No power, no tram. …. Figures
- "Oh. You must be the co-signer.": Too quick between oh and you \| say it like: Oh …. You must be the co-signer.
- "Spitters. Great.": Too quick between the words \| say it like: Spitters … great
- "Stay down this time.": Nothing, but another note: having a re-rising body should happen in lesser difficulties, but at less frequency rates (e.g. very easy never happens, easy is a small percentage chance, normal is 33% chance, hard: 66% chance)
- "Ow. That's coming out of my commission.": Ow sounds like "oh" — so something needs to change to get it to sound like a cry of pain. It's also too quick between "ow" and "that's", so a pause is needed
- "Should've read the fine print.": Read is currently pronounced in present tense \| say it like: Should've red the fine print
- "Repossessed.": "Repossessed" sounds like rip-o-zessed currently \| say it like: rhee-po-zessed

**Claude:** Fed the voice engine exact phonetic sounds for "repossessed," recorded real pauses, switched to "red," and replaced "Ow" with "Ouch!" after seven variants all came out as "now." Added five new secret-discovery lines and made rising bodies scale by difficulty.

**Casey:** Yes! Those are great!

A few more things before the commit:

1. The shotgun looks wonky—the barrels are completely separate from each other.
2. I love that the shotgun is called a boomstick. Immediately makes me think of Army of Darkness. And that makes me think that perhaps in later levels new enemy types, quips, and other Easter Eggs show up that pay homage to Army of Darkness and other horror / comedy horror classics.
3. I like the idea of the full game being 12 levels. I think it would be cool for them to be episodic. Perhaps all of them in the hull-breaker directory, but gated by completion status.
4. I figure continued development of each level should get its own dedicated chat, so we need a project to place this into—and instructions for how the pending episodes need to be generated, weaving the overarching storylines together and ensuring there aren't any inconsistencies. Can you write that, outlining each level, rooms, progression between levels, etc?

**Claude:** Joined the shotgun barrels, added a 12-deck Deck Select gated by completion, pushed the update, and wrote the series bible: canon facts, voice cast, the deck-by-deck arc, systems, homage rules, and a per-deck checklist. It closed with open questions for me: \[redacted\].
