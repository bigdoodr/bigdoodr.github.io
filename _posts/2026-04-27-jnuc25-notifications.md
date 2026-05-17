---
layout: post
title: "Think Like a Journalist: End User Notification Strategy — Takeaways"
date: 2026-04-27 08:00:00 +0000
author: bigDoodR
description: "Key takeaways from Josh Perlman's JNUC 2025 talk on crafting end-user notifications that actually work, using the journalist's 5W1H framework."
image: https://img.youtube.com/vi/fwE2DDbWy_U/hqdefault.jpg
categories: [tech, career]
---

Getting end users to actually respond to IT notifications is one of those problems that sounds trivial until you're staring at compliance numbers that aren't moving. Josh Perlman, an endpoints engineer at Booking.com, gave a talk at JNUC 2025 called *Think Like a Journalist: Strategies for End User Notifications* that I found genuinely useful — not because it has magic answers, but because it offers a real framework for thinking about communication design.

The premise: end-user notifications are more art than science, there's a ton of psychology involved, and communications can be improved with good design. That's it. If you're a Mac admin, you've felt the frustration of shouting into the void. You know that native macOS notifications alone aren't persuasive enough. The fix _isn't_ more notifications — it's _better_ ones.

Watch the whole thing [on YouTube](https://www.youtube.com/watch?v=fwE2DDbWy_U)

---

## The Core Idea: The Journalist's 5W1H

Journalists use **Who, What, Where, Why, When, and How** to structure every story. The lede — the first paragraph — packs in the most critical information before the reader has a chance to tune out. Articles are ordered most-to-least important so an editor can trim from the bottom without losing anything essential.

The psychology underneath: *people first consider how news affects them, then decide whether to keep reading.* It's a race between you and the reader to land enough information before their eyes glaze over. Notifications are a call to action — structure them accordingly.

---

## WHY

Lead with the reason. Even a boilerplate "please update to protect your organization's data" gives users something to anchor to. But ideally: plain language, no jargon. If you need someone to re-escrow their FileVault key, most users don't know what FileVault is. Use words they understand, or link to docs that explain it.

## WHO

Only send to people who are actually affected. Sending a "please update to 15.7.1" to someone already on 15.7.1 creates confusion and drives unnecessary support tickets. For on-screen popups, do a live inventory check right before firing — if the device is already compliant, the script should silently exit.

Make it personal: "**You** have not updated" hits differently than a generic blast.

## WHAT

Reserve your notification channels for time-sensitive, security-required topics. Don't abuse them for project announcements or status updates — that erodes trust in the channel so that when something urgent comes through, people ignore it.

- **Eye-catching where culture allows:** Make it fun where you can
- **Authoritative:** Use logos and branding. Users trained on phishing resistance will be suspicious of unbranded IT notifications. Maintain a KB article listing legitimate notifications so users can verify.
- **Brief and organized:** Headline, lede, essential info, links to more. Include a FAQ section for longer communications.

## WHEN

- **Zero-day:** Communicate immediately, then set enforcement expectations
- **Major OS upgrade:** Multi-stage over weeks (e.g., for macOS Tahoe: "don't run the beta" → "Tahoe is coming, not yet" → "now available" → deadline reminders)
- **Less is more** — this might be the most important point in the whole talk. The less you communicate, the more weight each message carries. Users tuned out by volume ignore everything, including the urgent stuff
- **Be specific on deadlines:** Not "this afternoon." Not "by tomorrow." A specific time, with a time zone if your org spans multiple

## WHERE

**Active notifications** (require acknowledgment) — a must for high-stakes situations. Clicking "I acknowledge" or even typing a confirmation word forces the user to actually engage.

**Passive notifications** (Slack posts, email, forum) — lower friction, but valuable as a reference point. Your IT support team can link back to them. Your future Slack notifications can link back to them.

**Consistency matters:** Pick a channel and stick to it. If one update goes out via email, the next via Slack, and the next some other way, users won't know where to look. Same goes for the visual design of on-screen notifications — changing the look causes confusion and erodes the recognition that signals legitimacy.

## HOW

**Passive tools:** Email (use SendGrid or similar at scale to avoid spam threshold issues), Slack posts, forum announcements, Okta Workflows.

**Active/on-screen tools:**
- [Nudge](https://github.com/macadmins/nudge) — config-driven, minimal setup
- [SUPER](https://github.com/Macjutsu/super) — macOS update enforcement
- [SwiftDialog](https://github.com/swiftDialog/swiftDialog) — roll your own, very flexible
- [IBM Notifier](https://github.com/IBM/mac-ibm-notifications) — another solid option

**Posture checking (enforcement-level):** Okta Device Assurance, Duo, 1Password Collide, and various VPN providers can both notify *and* enforce — blocking access to company resources when a device is out of compliance. The deadline enforces itself. This is a significant lever.

Always tell users *how* to do the thing, not just *what* to do. Don't say "update Slack." Say "open Self Service and run the Slack item."

---

## Getting Organized (Before Any of the Above)

1. **Avoid the bunker mentality.** End users are partners. When someone complains about a notification, that feedback sometimes has a point.
2. **Get management sign-off.** Present your regime — frequency, scope, timing — before rolling it out. If a popup fires during a big presentation, you're covered because you already got the blessing.
3. **Work with your comms team.** Or training, documentation, marketing — someone will happily check your spelling and logo usage.
4. **Loop in IT Support.** They shouldn't be surprised when users call in asking about a popup. Bonus: give end users a document listing what notifications they can expect to see and why.

---

## Measuring What Works

Once you have a regime in place, track compliance numbers at each stage — before notification 1, after notification 1, after notification 2, etc. After a couple of release cycles you'll have a clear picture of which stage is doing the actual work. Also pay attention to qualitative feedback from IT Support ("this was confusing") — that's actionable data too. Schedule regular re-evaluation.

---

## Lessons Learned

- **Approach with a user focus.** Users have day jobs. Updating their OS is at the bottom of their list. Craft your communications to earn their attention, not demand it.
- **Clarity, Brevity, Consistency, Eye-catching.** Return to these four for every notification, every time.
- **It's the journey, not the destination.** You're never done. Measure, gather feedback, iterate.

---

*Talk by Josh Perlman, Endpoints Engineer, Booking.com — JNUC 2025, Denver, CO.*  
Watch the full session [on YouTube](https://www.youtube.com/watch?v=fwE2DDbWy_U)
