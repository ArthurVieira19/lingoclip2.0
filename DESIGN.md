---
name: SongGap
description: A listening-comprehension game where you fill in the blanks of synced song lyrics while the music video plays.
colors:
  background: "oklch(0.16 0.014 55)"
  foreground: "oklch(0.97 0.02 85)"
  card: "oklch(0.21 0.018 55)"
  primary: "oklch(0.72 0.19 40)"
  primary-foreground: "oklch(0.16 0.02 40)"
  secondary: "oklch(0.87 0.22 122)"
  secondary-foreground: "oklch(0.16 0.03 122)"
  muted: "oklch(0.26 0.02 55)"
  muted-foreground: "oklch(0.72 0.03 70)"
  accent: "oklch(0.29 0.03 55)"
  accent-foreground: "oklch(0.97 0.02 85)"
  destructive: "oklch(0.62 0.21 20)"
  border: "oklch(0.97 0.02 85 / 10%)"
typography:
  display:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 4vw, 2.25rem)"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "normal"
rounded:
  sm: "0.344rem"
  md: "0.469rem"
  lg: "0.625rem"
  xl: "0.844rem"
  2xl: "1.0625rem"
  full: "9999px"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: "8px 10px"
  button-primary-hover:
    backgroundColor: "color-mix(in oklch, {colors.primary} 80%, transparent)"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "8px 10px"
  glass-panel:
    backgroundColor: "color-mix(in oklch, {colors.card} 70%, transparent)"
    textColor: "{colors.foreground}"
    rounded: "{rounded.2xl}"
---

# Design System: SongGap

## 1. Overview

**Creative North Star: "The Midnight Record Store"**

SongGap ("Marquee" theme) reads like a record shop after closing — the neon sign is still lit, the lights are low and warm, and the only bright things in the room are the music and the score. The palette is a warm near-black felt background with cream-white ink, lit by a two-bulb accent pair: a coral marquee-bulb orange as the primary action color and an acid-lime green as the secondary/success color. Frosted `.glass` panels — translucent, blurred, softly bordered — stand in for the physical surfaces of a listening booth: the video screen, the HUD chips, the lyrics panel. A faint animated film-grain sits over everything at 5% opacity, the one deliberately imperfect touch in an otherwise crisp system.

This is explicitly **not** a gray corporate dashboard — there is no neutral-gray chrome, no identical stat-card grid, no admin-panel seriousness. It is also not a cutesy literacy app — no mascots, no oversized bubble shapes, no primary-color cartoon illustration. And it is not a generic unstyled template — every surface carries the warm near-black + coral/lime identity, never a default Tailwind gray.

**Key Characteristics:**
- Dark-by-default, warm-tinted near-black, never a cool/blue-gray dark mode
- One primary accent (coral/orange) used deliberately, one secondary accent (acid lime) reserved for success/positive states
- Frosted glass surfaces for elevated panels (video frame, HUD stats, lyrics panel) — never applied decoratively to flat page background sections
- Subtle animated grain for atmosphere, not texture-for-texture's-sake
- Rounded, soft geometry (0.6–1.9rem radii) — friendly but not bubble-childish

## 2. Colors

A one-accent-pair system: warm near-black as the stage, coral as the spotlight, acid lime reserved for "you got it right."

### Primary
- **Marquee Coral** (`oklch(0.72 0.19 40)`): every primary call-to-action — Play buttons, the active difficulty accent, primary CTAs, focus rings (at 55% alpha), glow blooms behind hero elements.

### Secondary
- **Acid Lime** (`oklch(0.87 0.22 122)`): reserved for positive/celebratory states — correct-answer reveals, combo/streak indicators, success glows. Its rarity is what makes a correct answer feel like a hit.

### Neutral
- **Felt Black** (`oklch(0.16 0.014 55)`, background): the base stage color, warm near-black, never pure `#000`.
- **Booth Card** (`oklch(0.21 0.018 55)`, card/popover): the surface one step up from the stage — dialogs, popovers, solid card backgrounds.
- **Marquee Cream** (`oklch(0.97 0.02 85)`, foreground): primary text color against the dark stage; also the base of the film-grain and the glass panels' inner highlight line.
- **Dim Cream** (`oklch(0.72 0.03 70)`, muted-foreground): secondary/supporting text — captions, timestamps, helper copy. Always checked against its actual background, never assumed.
- **Ember** (`oklch(0.62 0.21 20)`, destructive): errors, "remove from library," incorrect-answer shake state.

### Named Rules
**The One Spotlight Rule.** Coral is the only color allowed to mean "primary action" on any given screen. If two elements compete for coral, one of them is wrong.

## 3. Typography

**Display Font:** Bricolage Grotesque (with `system-ui, sans-serif` fallback)
**Body Font:** Instrument Sans (with `system-ui, sans-serif` fallback)

**Character:** A geometric, slightly quirky grotesque (Bricolage) for anything that needs presence — song titles, section headers, the score HUD — paired with a clean, humanist-leaning sans (Instrument Sans) for everything read at length. The pairing is confident but never shouty: display sizes stay modest (clamp ceiling ~2.25rem) because the video and lyrics, not the type, are the star.

### Hierarchy
- **Display** (600, `clamp(1.5rem, 4vw, 2.25rem)`, 1.1): song titles, page headers (Library, Statistics), the "Choose a difficulty" heading.
- **Title** (600, `1.125–1.25rem`, 1.2): card titles, dialog titles, section headings within a page.
- **Body** (400, `1rem`, 1.5): lyrics text, paragraph copy, form labels' companion text.
- **Label** (500, `0.8–0.875rem`, 1.3): HUD stat chips, badges, button labels, difficulty tags.

### Named Rules
**The Video Wins Rule.** No text element on the game screen may out-compete the video for visual weight — display sizes on that screen stay at the small end of the clamp.

## 4. Elevation

SongGap uses a hybrid of translucency and soft ambient shadow rather than a stepped Material elevation scale. The signature `.glass` treatment — `color-mix` translucent card fill, `backdrop-filter: blur(16px)`, a 1px near-transparent border, an inset top highlight, and one short, tight outer shadow — is the *only* elevation vocabulary in the system. Flatter surfaces (page background, plain text rows) carry no shadow at all; there is no separate "card shadow" system independent of glass.

### Shadow Vocabulary
- **Glass ambient** (`0 1px 0 0 color-mix(in oklch, var(--foreground) 6%, transparent) inset, 0 2px 8px -2px oklch(0 0 0 / 35%)`; tightened from a 40px-blur drop shadow in the 2026-10-03 redesign, since a hairline border plus a wide soft shadow reads as a generic "ghost card"): the only shadow in the system, paired 1:1 with `.glass`. Used on the video frame, HUD stat chips, lyrics panel, dialogs, cards.
- **Glow blooms** (`--glow-primary` / `--glow-secondary`, soft 35%/30% alpha color, blurred): not a shadow but the same "light source" idea — used behind active/primary buttons and success states to suggest the marquee bulb is lit.

### Named Rules
**The Glass-Or-Nothing Rule.** A surface either commits fully to `.glass` (translucency + blur + the ambient shadow) or sits flat with no shadow at all. No plain `box-shadow` cards outside that system.

## 5. Components

### Buttons
- **Shape:** `rounded-lg` (0.825rem / `--radius-md` in the button's own default size scale)
- **Primary:** solid Marquee Coral fill, coral-foreground (near-black) text, `hover:bg-primary/80`
- **Secondary:** solid Acid Lime fill, dark lime-foreground text — reserved for affirmative/celebratory actions, not general secondary actions
- **Outline / Ghost:** transparent or `bg-input/30`, foreground text, border in `--border` (10% white) — the default for "Cancel," "Back," and other low-emphasis actions
- **Destructive:** low-emphasis by default (`bg-destructive/10`, ember text), escalating to solid ember only inside a confirmation dialog
- **Hover / Focus:** buttons nudge (`active:translate-y-px`), get a `focus-visible` ring at `ring-3 ring-ring/50`; primary/circular play-style controls additionally scale ~1.05 and carry a soft coral glow shadow

### Badges / Chips
- **Style:** HUD stat pills are `.glass` + full-pill radius. Filter chips are neutral: the active one is a cream (`bg-foreground`) pill that glides via `layoutId`, never coral, so the screen's one coral thing stays the primary action.
- **Difficulty meter** (`DifficultyMeter` in `song-card.tsx`): four rising bars (filled up to the level) plus the level name, in the level's color — beginner=lime, intermediate=coral, advanced=orange, expert=ember (`DIFFICULTY_TEXT`, with deeper shades in the light theme for small-text contrast). Replaces the old solid-color difficulty chips.

### Cards / Containers
- **Corner Style:** `rounded-2xl` (~17px) for panels and dialogs, `rounded-xl` (~13px) for rows and media frames, `rounded-lg` for thumbnails. Nothing above ~17px except full pills.
- **Background:** `.glass` (see Elevation) for anything "elevated" — panels, the lyrics panel, HUD chips, dialogs, setup choice rows
- **Song cards are art-first, not boxed:** a 16:9 thumbnail (`rounded-lg`, hairline ring), with title, artist and difficulty meter sitting on the page below it. On hover the coral play button rises into the art's bottom-right corner; a "Played" chip sits top-left.
- **Shadow Strategy:** glass ambient shadow only (see Elevation §4); no independent card shadow
- **Border:** 1px `--border` (10% white on the dark card) as part of `.glass`, never a colored accent border and never a `border-left`/`border-right` stripe
- **Internal Padding:** `p-5`/`p-6` for panels; the video frame has no bezel any more (a hairline ring, so the video fills its 16:9 box — `.yt-frame` stretches the iframe the YouTube API injects)

### Ambient art
- `AmbientArt` blurs the current song's thumbnail (72px blur, saturated, ~40% opacity) into a full-viewport wash behind the top of the page, faded out by a radial mask before any edge. Used on Home (today's pick), the setup steps, the game and Results, so each screen is tinted by what's playing. Decoration only: text is always judged against the plain background below it.

### Inputs / Fields
- **Style:** `bg-input/30` fill, 1px `--border`, `rounded-md`
- **Focus:** border shifts to `--primary`, focus ring at `ring-3 ring-ring/50`
- **Fill-in-the-blank input (signature):** dashed coral underline instead of a full box border, transparent background, center-aligned bold coral text, solid underline on focus — deliberately different from ordinary form inputs to read as "part of the lyric," not "a form field"

### Navigation
- **Style:** `.glass` sticky header, wordmark in two-tone type ("Song" in foreground, "Gap" in primary coral), flat text links with a muted→foreground hover shift, no underline
- **Links:** Home, Library, Review (with a due-count badge), Stats, Ranking. To the right: a streak + level chip (links to Stats), then How to play (help icon), Settings and Log out.
- **Active state:** a pill (`bg-accent`) that glides between links via a shared framer-motion `layoutId`
- **Below `md`:** the header keeps the wordmark, the streak/level chip, help and settings (log out lives in Settings); primary nav moves to a fixed `.glass` bottom tab bar (icon + label, ≥48px targets, `env(safe-area-inset-bottom)` padding). The tab bar is hidden on `/game`, where the game's transport bar owns the bottom edge instead.

### Screen structure (2026-10-03 redesign)
- **Home** is a dashboard for a signed-in player, not a marketing hero: greeting, today's pick as a large art-backed hero, a progress panel (7-day streak strip, level bar, review link), then "Jump back in" / "Fresh for you" shelves.
- **Library** is only the catalog: one sticky toolbar (search, played/level chips, sort) and a 2/3/4-column grid.
- **Login / sign-up** split on desktop: a brand side with `LyricDemo` (a lyric line whose blank types itself and pays out +150) and the form side.
- Page headers are left-aligned (`text-2xl md:text-3xl`) on every screen; centered layouts are kept for single-moment screens (Results, review summary).

### Game transport bar
- One bar holds every playback control: rewind 10s/5s, a single Play/Pause toggle (the screen's one coral spotlight), speed, skip — plus a full-width progress bar with an "n/total words" count.
- Fixed to the bottom on phones (thumb reach); an inline `.glass` bar from `lg` up.
- Per-answer feedback floats next to the score chip (`+150` lime / `miss` ember) — never a toast.

## 5b. Motion

- **Durations:** 150–250ms for state changes; ~0.9s only for one-shot celebrations (results burst, level-progress fill).
- **Easing:** `--ease-out-quint` (`cubic-bezier(0.22, 1, 0.36, 1)`) as the default; springs only for `layoutId` glides (nav pill, active lyric line). No bounce/elastic curves.
- **Signature motion:** the active-lyric highlight glides from line to line as the song advances.
- **Reduced motion:** `MotionConfig reducedMotion="user"` in the root layout covers framer-motion; a `prefers-reduced-motion` block in `globals.css` covers CSS transitions and keyframes. Animate `transform`/`opacity` (e.g. `scaleX` for progress bars), not `width`/`height`.

## 5c. Light theme

Optional, via Settings (dark stays the default). Surfaces flip lightness but keep brand hues. Exception: **Acid Lime is darkened to `oklch(0.56 0.17 130)` with near-white foreground** — at its dark-theme lightness it's ~1.5:1 as text on a light surface.

## 6. Do's and Don'ts

### Do:
- **Do** keep the video and the lyrics/typing surface visually adjacent — proximity is a core product principle, not just a layout preference.
- **Do** use `.glass` for every elevated surface, and only for elevated surfaces (video frame, HUD chips, lyrics panel, dialogs, song cards).
- **Do** reserve Acid Lime for positive/correct/success states so it keeps its meaning.
- **Do** give every icon-only control an `aria-label` and every interactive element a visible focus ring — this is a fast-paced typing game played with a keyboard as much as a mouse.
- **Do** pair every Framer Motion animation with a `prefers-reduced-motion` fallback (instant or crossfade).

### Don't:
- **Don't** introduce gray dashboard chrome, identical stat-card grids, or "admin panel" seriousness — SongGap is about music and play, not spreadsheets (per PRODUCT.md's anti-references).
- **Don't** use mascots, oversized bubble shapes, or cartoon illustration — avoid reading as a children's literacy app (per PRODUCT.md's anti-references).
- **Don't** ship an unstyled/generic template look — every surface carries the warm near-black + coral/lime identity (per PRODUCT.md's anti-references).
- **Don't** use `background-clip: text` gradient text anywhere. `.text-marquee-gradient` was removed in the 2026-10-03 redesign; celebratory numbers (Results score, review XP) are solid Acid Lime.
- **Don't** use a `border-left`/`border-right` colored stripe as a card accent. Use the full `.glass` border, a background tint, or a leading icon instead.
- **Don't** let two elements compete for coral on the same screen (The One Spotlight Rule).
