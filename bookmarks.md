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

<a href="/DailyExercises" class="bookmark-card">
<div class="bookmark-icon"><i class="fas fa-dumbbell"></i></div>
<div class="bookmark-label">Daily Exercises</div>
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

<a href="https://ballotpedia.org" class="bookmark-card">
<div class="bookmark-icon"><i class="fas fa-vote-yea"></i></div>
<div class="bookmark-label">Ballotpedia</div>
</a>

<a href="https://americanindian.si.edu/americans/" class="bookmark-card">
<div class="bookmark-icon"><i class="fas fa-landmark"></i></div>
<div class="bookmark-label">Smithsonian NMAI: Americans Exhibit</div>
</a>

<a href="https://screensizes.app" class="bookmark-card">
<div class="bookmark-icon"><i class="fas fa-mobile-alt"></i></div>
<div class="bookmark-label">Screen Sizes</div>
</a>

<a href="https://scrabblewordfinder.org/" class="bookmark-card">
<div class="bookmark-icon"><i class="fas fa-spell-check"></i></div>
<div class="bookmark-label">Scrabble Word Finder</div>
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