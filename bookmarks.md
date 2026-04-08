---
title: "Bookmarks"
---

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

<style>
.bookmarks-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.category-section {
  margin-bottom: 50px;
}

.category-title {
  font-size: 1.8em;
  font-weight: bold;
  margin-bottom: 25px;
  padding-bottom: 10px;
  border-bottom: 2px solid #e0e0e0;
}

.bookmarks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
}

.bookmark-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 25px 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #ffffff;
  transition: all 0.3s ease;
  text-decoration: none;
  color: inherit;
}

.bookmark-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #007bff;
}

.bookmark-icon {
  font-size: 3em;
  margin-bottom: 15px;
  color: #007bff;
}

.bookmark-card:hover .bookmark-icon {
  color: #0056b3;
}

.bookmark-label {
  font-size: 0.95em;
  font-weight: 500;
  line-height: 1.3;
  color: #007bff;  /* Always use the blue color */
}

/* Dark mode specific styles */
@media (prefers-color-scheme: dark) {
  .category-title {
    border-bottom-color: #444;
    color: #f2f2f7;
  }
  
  .bookmark-card {
    background-color: #1c1c1e;
    border-color: #444;
  }
  
  .bookmark-card:hover {
    border-color: #007bff;
    background-color: #2c2c2e;
  }
  
  .bookmark-icon {
    color: #007bff;
  }
  
  .bookmark-card:hover .bookmark-icon {
    color: #3392ff;
  }
  
  .bookmark-label {
    color: #007bff;  /* Keep blue color in dark mode too */
  }
}

@media (max-width: 768px) {
  .bookmarks-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 15px;
  }
  
  .bookmark-card {
    padding: 20px 10px;
  }
  
  .bookmark-icon {
    font-size: 2.5em;
  }
}
</style>

<div class="bookmarks-container">

<div class="category-section">
<div class="category-title">Shopping</div>
<div class="bookmarks-grid">

<a href="https://www.meh.com" class="bookmark-card">
<div class="bookmark-icon"><i class="fas fa-shopping-bag"></i></div>
<div class="bookmark-label">Meh</div>
</a>

<a href="https://www.woot.com" class="bookmark-card">
<div class="bookmark-icon"><i class="fas fa-tag"></i></div>
<div class="bookmark-label">Woot</div>
</a>

</div>
</div>

<div class="category-section">
<div class="category-title">Health & Fitness</div>
<div class="bookmarks-grid">

<a href="/exercises/" class="bookmark-card">
<div class="bookmark-icon"><i class="fas fa-dumbbell"></i></div>
<div class="bookmark-label">Exercise Utilities</div>
</a>

<a href="/exercises/Zone2Exercises.html" class="bookmark-card">
<div class="bookmark-icon"><i class="fas fa-person-running"></i></div>
<div class="bookmark-label">Zone 2 Exercise Catalog</div>
</a>

</div>
</div>

<div class="category-section">
<div class="category-title">Parenting & Kids</div>
<div class="bookmarks-grid">

<a href="https://cupofjo.com/2025/11/24/25-things-to-say-to-your-children/" class="bookmark-card">
<div class="bookmark-icon"><i class="fas fa-heart"></i></div>
<div class="bookmark-label">25 Things to Say to Your Children</div>
</a>

<a href="https://www.vox.com/today-explained-to-kids" class="bookmark-card">
<div class="bookmark-icon"><i class="fas fa-child"></i></div>
<div class="bookmark-label">Today, Explained to Kids</div>
</a>

</div>
</div>

<div class="category-section">
<div class="category-title">Reference & Tools</div>
<div class="bookmarks-grid">

<a href="https://scrabblewordfinder.org/" class="bookmark-card">
<div class="bookmark-icon"><i class="fas fa-spell-check"></i></div>
<div class="bookmark-label">Scrabble Word Finder</div>
</a>

<a href="https://screensizes.app" class="bookmark-card">
<div class="bookmark-icon"><i class="fas fa-mobile-alt"></i></div>
<div class="bookmark-label">Screen Sizes</div>
</a>

<a href="https://ballotpedia.org" class="bookmark-card">
<div class="bookmark-icon"><i class="fas fa-vote-yea"></i></div>
<div class="bookmark-label">Ballotpedia</div>
</a>

<a href="https://americanindian.si.edu/americans/" class="bookmark-card">
<div class="bookmark-icon"><i class="fas fa-landmark"></i></div>
<div class="bookmark-label">Smithsonian NMAI: Americans Exhibit</div>
</a>

<a href="https://www.12steprecovery.com/step-4-moral-inventory-example/" class="bookmark-card">
<div class="bookmark-icon"><i class="fas fa-clipboard-list"></i></div>
<div class="bookmark-label">Step 4: Moral Inventory Example</div>
</a>

</div>
</div>

<div class="category-section">
<div class="category-title">Privacy & Rights</div>
<div class="bookmarks-grid">

<a href="https://www.aclu.org/know-your-rights/page/2#all-kyr" class="bookmark-card">
<div class="bookmark-icon"><i class="fas fa-balance-scale"></i></div>
<div class="bookmark-label">ACLU: Know Your Rights</div>
</a>

<a href="https://www.eff.org/deeplinks/2026/03/targeted-advertising-gives-your-location-government-just-ask-cbp" class="bookmark-card">
<div class="bookmark-icon"><i class="fas fa-eye-slash"></i></div>
<div class="bookmark-label">EFF: Targeted Advertising Gives Your Location to Government</div>
</a>

<a href="https://tosdr.org/en" class="bookmark-card">
<div class="bookmark-icon"><i class="fas fa-file-contract"></i></div>
<div class="bookmark-label">Terms of Service; Didn't Read</div>
</a>

</div>
</div>

<div class="category-section">
<div class="category-title">AI & Productivity</div>
<div class="bookmarks-grid">

<a href="https://block.github.io" class="bookmark-card">
<div class="bookmark-icon"><i class="fas fa-robot"></i></div>
<div class="bookmark-label">Goose — Local Open Source AI Agent</div>
</a>

<a href="https://code.claude.com/docs/en/overview" class="bookmark-card">
<div class="bookmark-icon"><i class="fas fa-terminal"></i></div>
<div class="bookmark-label">Claude Code Docs</div>
</a>

<a href="https://cc.storyfox.cz" class="bookmark-card">
<div class="bookmark-icon"><i class="fas fa-feather-alt"></i></div>
<div class="bookmark-label">Storyfox</div>
</a>

<a href="https://support.claude.com/en/articles/11725091-when-to-use-desktop-and-web-connectors" class="bookmark-card">
<div class="bookmark-icon"><i class="fas fa-plug"></i></div>
<div class="bookmark-label">Claude: Desktop & Web Connectors Guide</div>
</a>

<a href="https://openalternative.co" class="bookmark-card">
<div class="bookmark-icon"><i class="fas fa-code-branch"></i></div>
<div class="bookmark-label">Open Alternative — Open Source Software Directory</div>
</a>

<a href="https://platform.claude.com/settings/billing" class="bookmark-card">
<div class="bookmark-icon"><i class="fas fa-coins"></i></div>
<div class="bookmark-label">Claude API Credits</div>
</a>

<a href="https://github.com/Mail-0/Zero" class="bookmark-card">
<div class="bookmark-icon"><i class="fas fa-envelope-open"></i></div>
<div class="bookmark-label">Zero — Open Source Email</div>
</a>

<a href="https://eliteai.tools/tool/0email" class="bookmark-card">
<div class="bookmark-icon"><i class="fas fa-inbox"></i></div>
<div class="bookmark-label">0email</div>
</a>

</div>
</div>

<div class="category-section">
<div class="category-title">Apple & Mac</div>
<div class="bookmarks-grid">

<a href="https://tonyyo11.github.io/posts/Managing-Family-Devices-Jamf-Now/" class="bookmark-card">
<div class="bookmark-icon"><i class="fas fa-laptop"></i></div>
<div class="bookmark-label">Managing Family Devices with Jamf Now</div>
</a>

<a href="https://macstories.net" class="bookmark-card">
<div class="bookmark-icon"><i class="fas fa-cut"></i></div>
<div class="bookmark-label">Shortcuts Archive — MacStories</div>
</a>

</div>
</div>

<div class="category-section">
<div class="category-title">Entertainment</div>
<div class="bookmarks-grid">

<a href="https://mediastinger.com" class="bookmark-card">
<div class="bookmark-icon"><i class="fas fa-film"></i></div>
<div class="bookmark-label">MediaStinger — Post-Credits Scene Database</div>
</a>

<a href="https://what-song.com" class="bookmark-card">
<div class="bookmark-icon"><i class="fas fa-music"></i></div>
<div class="bookmark-label">What Song</div>
</a>

<a href="https://ytmanager.vercel.app" class="bookmark-card">
<div class="bookmark-icon"><i class="fa-brands fa-youtube"></i></div>
<div class="bookmark-label">YouTube Playlist Manager</div>
</a>

<a href="https://www.eurogamer.net/dash-food-locations-mario-kart-world#section-12" class="bookmark-card">
<div class="bookmark-icon"><i class="fas fa-gamepad"></i></div>
<div class="bookmark-label">Mario Kart World: Dash Food Locations</div>
</a>

</div>
</div>

<div class="category-section">
<div class="category-title">Games</div>
<div class="bookmarks-grid">

<a href="https://www.nytimes.com/games/wordle/index.html" class="bookmark-card">
<div class="bookmark-icon"><i class="fas fa-font"></i></div>
<div class="bookmark-label">Wordle</div>
</a>

<a href="https://murdle.com" class="bookmark-card">
<div class="bookmark-icon"><i class="fas fa-magnifying-glass"></i></div>
<div class="bookmark-label">Murdle</div>
</a>

<a href="https://apps.apple.com/us/app/stitch/id1581052096" class="bookmark-card">
<div class="bookmark-icon"><i class="fas fa-puzzle-piece"></i></div>
<div class="bookmark-label">Stitch (Apple Arcade)</div>
</a>

<a href="https://apps.apple.com/us/app/solitaire-by-mobilityware/id1556715867" class="bookmark-card">
<div class="bookmark-icon"><i class="fas fa-layer-group"></i></div>
<div class="bookmark-label">Solitaire Daily Challenge (Apple Arcade)</div>
</a>

<a href="https://www.thesprucecrafts.com/top-solitaire-card-games-412483" class="bookmark-card">
<div class="bookmark-icon"><i class="fas fa-list-ul"></i></div>
<div class="bookmark-label">Top Solitaire Card Games</div>
</a>

<a href="https://www.thesprucecrafts.com/klondike-solitaire-card-game-rules-412473" class="bookmark-card">
<div class="bookmark-icon"><i class="fas fa-heart"></i></div>
<div class="bookmark-label">Klondike Solitaire Rules</div>
</a>

<a href="https://www.thesprucecrafts.com/pyramid-solitaire-card-game-rules-412478" class="bookmark-card">
<div class="bookmark-icon"><i class="fas fa-chevron-up"></i></div>
<div class="bookmark-label">Pyramid Solitaire Rules</div>
</a>

<a href="https://www.thesprucecrafts.com/canfield-solitaire-412467" class="bookmark-card">
<div class="bookmark-icon"><i class="fas fa-redo"></i></div>
<div class="bookmark-label">Canfield Solitaire Rules</div>
</a>

<a href="https://www.thesprucecrafts.com/take-ten-solitaire-412479" class="bookmark-card">
<div class="bookmark-icon"><i class="fas fa-plus-circle"></i></div>
<div class="bookmark-label">Take Ten Solitaire Rules</div>
</a>

</div>
</div>

<div class="category-section">
<div class="category-title">Community Events</div>
<div class="bookmarks-grid">

<a href="https://www.mudhappensfec.com/" class="bookmark-card">
<div class="bookmark-icon"><i class="fas fa-running"></i></div>
<div class="bookmark-label">Mud Happens Annual Fundraiser</div>
</a>

<a href="https://www.lostrivercave.org/event/snow-flurry-scurry/" class="bookmark-card">
<div class="bookmark-icon"><i class="fas fa-snowflake"></i></div>
<div class="bookmark-label">Snow Flurry Scurry Annual Fundraiser</div>
</a>

</div>
</div>

</div>