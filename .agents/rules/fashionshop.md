---
trigger: always_on
---

# FASHION SHOP — RULES

Build a polished 2D fashion shop simulation for Gen Z, mobile-first web.

TECH:
Use Phaser 3 + TypeScript. Keep code modular, data-driven and responsive. Do not switch frameworks.

GAME:
Player starts with a tiny fashion boutique and grows it into a fashion brand.

Core loop:
Buy inventory → follow trends → decorate shop → open shop → serve customers → recommend outfits → sell → earn money/XP → increase reputation → upgrade → next day.

SYSTEMS:
Implement reusable systems for customers, inventory, fashion items, trends, economy, shop, decoration, reputation, events and save data.

CUSTOMERS:
Customers have different personalities, styles, budgets, moods and shopping goals. Their preferences must affect purchases and reactions.

ART:
Cute premium 2D fashion style. Modern, clean, colorful, Gen-Z friendly. No copied assets or branding.

ANIMATION:
Animation is essential. Use smooth tweens, sprites, particles and feedback for walking, idle, shopping, try-on, reactions, sales, rewards and UI.

UX:
Mobile-first. Large touch targets, responsive layouts, simple interactions. Every important action needs immediate visual/audio feedback.

CODE:
Do not hard-code gameplay data unnecessarily. Separate scenes, systems, UI and data. Avoid giant files and duplicated logic.

DEVELOPMENT:
Build incrementally. First create a small playable MVP, then expand features. Never fake functionality or claim incomplete features are finished.

Prioritize FUN, GAMEPLAY, ANIMATION, RESPONSIVENESS and POLISH.
## Core Principle
Maintain a **flat DOM tree**. Avoid nesting multiple generic `<div>` elements without semantic meaning or explicit layout necessity (commonly known as "Divitis" or "Div Soup").

## Core Principle
Maintain a **flat DOM tree**. Avoid nesting multiple generic `<div>` elements without semantic meaning or explicit layout necessity (commonly known as "Divitis" or "Div Soup").

## Mandatory Rules

### 1. Enforce Semantic HTML
Replace generic `<div>` containers with explicit semantic elements wherever possible:
* **Layout Structure**: Use `<header>`, `<nav>`, `<main>`, `<footer>`, `<section>`, `<article>`, and `<aside>` instead of structural divs.
* **Text & Data**: Use `<h1>`-`<h6>` for headings, `<p>` for body text, and `<ul>`/`<li>` for collections or lists.
* **Interactions**: Never use `<div onClick={...}>`. Use native `<button>` or `<a>` elements to ensure accessibility (a11y).

### 2. Leverage Framework-Specific Fragments
* In **React / JSX**, always use Fragments (`<>...</>`) or `<React.Fragment>` when wrapping siblings to avoid rendering redundant, useless `<div>` nodes into the actual DOM.

### 3. Optimize Modern CSS Layouts
* Use **Flexbox** or **CSS Grid** directly on parent elements to control layout, alignment, spacing, and wrapping.
* Do **not** create intermediate or single-purpose wrapper `<div>` elements solely to apply `margin`, `padding`, or alignment properties.

### 4. DOM Depth & Cleanliness Target
* Keep the code as shallow as possible. 
* Consecutive nesting of purely generic `<div>` tags must not exceed **3 levels** deep. If a deeper structure is needed, refactor the layout into smaller, independent sub-components.