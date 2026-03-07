---
layout: page
title: "Style"
description: "The design style guide for this site."
date: 2026-02-25
permalink: /style/
---

# /style

A reference for the design decisions behind this site.

## 🎨 Color Palette

This site uses an **Apple Intelligence-inspired** color palette — the same gradient family Apple introduced with AI features in iOS 18 and macOS Sequoia.

| Name | Hex | Use |
|------|-----|-----|
| AI Blue | `#007AFF` | Primary links, headings, accents |
| AI Purple | `#5856D6` | Gradient midpoint |
| AI Violet | `#AF52DE` | Gradient accent, dark mode highlights |
| AI Pink | `#FF2D92` | Gradient accent |
| AI Orange | `#FF9500` | Gradient endpoint |

The signature gradient runs: **Blue → Purple → Violet → Pink → Orange** at 135°, and animates continuously on the site header and title.

## 🖋️ Typography

The site uses the system font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` — meaning it renders in San Francisco on Apple devices, Segoe UI on Windows, and Roboto on Android/Linux.

- **H1** (page titles): 3em, bold, centered, with a gradient underline accent and glow effect
- **H2** (section headers): styled with a left border and subtle gradient background pill
- **Body text:** 1.1em, line-height 1.6, `#86868b` (light) / `#98989d` (dark)
- **Links:** AI Blue by default; hover triggers a gradient text effect

## 🌗 Light & Dark Mode

The site fully supports `prefers-color-scheme` for automatic light/dark switching.

- **Light mode:** White/near-white background (`#f8f9ff → #ffffff`), black H1s, grey body text
- **Dark mode:** Dark background (`#1c1c1e → #000000`), white H1s, slightly lighter grey body text
- The header gradient and animated site title remain consistent in both modes

## 📐 Layout

- Max content width: **1000px**, centered
- Container padding: **20px** (15px on mobile)
- List items are card-styled with rounded corners, backdrop blur, and a left-border hover effect
- Tables use the gradient header row and have rounded corners via `overflow: hidden`

## 📱 Responsive Design

The layout adapts at **768px** for mobile:
- Header stacks vertically
- Navigation wraps and reduces gap
- Font sizes scale down slightly

---

*This page was inspired by [slashpages.net](https://slashpages.net).*
