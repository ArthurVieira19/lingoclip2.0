# SongGap - Implementation Plan

## Objective

Build the platform incrementally.

DO NOT start with the final UI.

DO NOT start with animations.

DO NOT start by creating every page.

The first goal is to build a robust and testable game engine.

The project should be developed in phases.

Each phase must be fully functional before moving to the next.

---

# Development Philosophy

This project is fundamentally a:

- timing engine
- lyric synchronization engine
- exercise generation engine

Everything else is secondary.

Prioritize:

1. Reliability
2. Maintainability
3. Performance

Only then:

4. Design
5. Animations
6. Gamification

---

# PHASE 1

Core Domain Models

Goal:

Create all shared types and contracts.

Deliverables:

src/types/

Files:

Song.ts

LyricLine.ts

ExerciseLine.ts

GameMode.ts

Difficulty.ts

Statistics.ts

Achievement.ts

UserProgress.ts

Requirements:

No UI.

No pages.

Types only.

---

# PHASE 2

LRC Parsing Engine

Goal:

Create a robust lyrics parser.

Folder:

src/modules/lyrics/

Files:

lrcParser.ts

Responsibilities:

Parse timestamps.

Convert:

[00:15.20]

Into:

15.2

Output:

LyricLine[]

Requirements:

Support malformed lines.

Ignore empty entries.

Maintain order.

Create unit tests.

Test Cases:

Single line

Multiple lines

Invalid timestamps

Duplicated timestamps

Missing timestamps

Acceptance:

100% deterministic output.

---

# PHASE 3

YouTube Player Abstraction

Goal:

Completely isolate YouTube.

Folder:

src/modules/player/

Files:

youtubePlayer.ts

Create interface:

MediaPlayer

Methods:

play()

pause()

seek()

getCurrentTime()

setPlaybackRate()

destroy()

No UI yet.

Only abstraction layer.

Requirements:

Future support for MP3 playback.

Never couple game engine directly to YouTube.

Acceptance:

Game engine interacts only with MediaPlayer.

---

# PHASE 4

Synchronization Engine

Most important phase.

Folder:

src/modules/game/

Files:

GameSynchronizer.ts

Responsibilities:

Track playback time.

Determine active lyric.

Notify application state.

Handle line transitions.

Maintain internal clock.

Algorithm:

currentTime

↓

find active lyric

↓

trigger update

↓

update exercise state

Requirements:

Use binary search.

Do not iterate every lyric every frame.

Target:

Thousands of lyric entries.

Acceptance:

Correct lyric activation.

No dropped transitions.

---

# PHASE 5

Exercise Generator

Folder:

src/modules/game/

Files:

exerciseGenerator.ts

Goal:

Generate hidden-word exercises.

Input:

LyricLine

Output:

ExerciseLine

Responsibilities:

Hide words.

Store answers.

Generate metadata.

Requirements:

Never hide interjections / vocal expressions.

Examples (non-exhaustive):

"oohh", "ohh", "haha", "uh", "ah", "yeah", "la la la", "na na na", "hmm", "woo", "yo"

These words carry no listening-comprehension value and must be excluded from the
hidden-word candidate pool regardless of difficulty level (including Expert / 100%).

Create:

interjections.ts (list of known filler/vocal expressions, similar structure to
englishStopWords.ts from Phase 7)

---

# PHASE 6

Difficulty Engine

Folder:

src/modules/game/

Files:

difficultyEngine.ts

Recreate LingoClip behavior.

Beginner

Hide 10%

Intermediate

Hide 25%

Advanced

Hide 50%

Expert

Hide 100%

Requirements:

Expert forces typing mode.

Hidden word selection must be deterministic.

Accept seeded randomness.

Acceptance:

Same line + same seed = same result.

---

# PHASE 7

Word Classification Engine

Folder:

src/modules/game/

Files:

wordPriority.ts

Purpose:

Choose meaningful words.

Priority:

1 Verbs

2 Nouns

3 Adjectives

4 Adverbs

Avoid:

Articles

Prepositions

Conjunctions

Common stop words

Interjections / vocal expressions (see interjections.ts, Phase 5)

Create:

englishStopWords.ts

Acceptance:

Important words hidden first.

---

# PHASE 8

Answer Validation Engine

Folder:

src/modules/game/

Files:

answerValidator.ts

Features:

Case insensitive

Whitespace tolerance

Punctuation tolerance

Smart comparison

Examples:

"Hello"

equals

"hello"

equals

" hello "

Requirements:

Optional fuzzy matching

Levenshtein support

Acceptance:

Human mistakes do not feel unfair.

---

# PHASE 9

Scoring Engine

Folder:

src/modules/game/

Files:

scoreEngine.ts

Responsibilities:

Calculate:

Points

Combo

Accuracy

Completion

Speed bonus

Formula:

baseScore = 100

speedBonus = 0-50

comboBonus = combo * 10

Total:

score +=
baseScore +
speedBonus +
comboBonus

Requirements:

Pure functions only.

Acceptance:

Fully testable.

---

# PHASE 10

State Management

Folder:

src/stores/

Create:

playerStore

gameStore

statsStore

settingsStore

achievementStore

Technology:

Zustand

Requirements:

Keep business logic outside stores.

Stores only manage state.

---

# PHASE 11

Local Persistence

Folder:

src/services/storage/

Files:

storageService.ts

Responsibilities:

Save:

XP

Levels

History

Achievements

Settings

Technology:

LocalStorage

Acceptance:

Refresh browser.

Data survives.

---

# PHASE 12

Statistics Engine

Folder:

src/modules/stats/

Files:

statsCalculator.ts

Calculate:

Songs completed

Average accuracy

Best score

Total play time

Streak

Longest streak

Requirements:

Pure functions.

Unit tests.

---

# PHASE 13

Achievement Engine

Folder:

src/modules/achievements/

Files:

achievementEngine.ts

Input:

Game Result

Output:

Unlocked Achievements

Requirements:

Rule based architecture.

Easy to extend.

---

# PHASE 14

Game UI Prototype

Only now build UI.

Pages:

Home

Library

Game

Results

Statistics

Requirements:

Functional only.

No polish.

No animations.

Goal:

Verify entire game loop.

---

# PHASE 15

Game Screen

Implement:

Video

Lyrics

Input

Score

Combo

Progress

Requirements:

Responsive.

Desktop first.

Mobile compatible.

---

# PHASE 16

Visual System

Add:

Theme

Color system

Typography

Spacing

Glassmorphism

Cards

Design language

Goal:

Spotify + Duolingo inspiration.

Unique visual identity.

---

# PHASE 17

Animations

Use:

Framer Motion

Add:

Page transitions

Combo feedback

Correct answer feedback

Level up effects

Achievement unlock effects

Requirements:

Subtle.

Never compromise performance.

---

# PHASE 18

Advanced Features

Implement:

Search

Filter

Sort

Recently played

Continue playing

Daily challenge

Recommended songs

---

# PHASE 19

AI Expansion Layer

Design only.

Do not implement.

Create interfaces for:

TranslationProvider

VocabularyProvider

FlashcardProvider

ExerciseGenerationProvider

Future providers may use:

OpenAI

Claude

Gemini

Local LLMs

Application must support provider replacement.

---

# PHASE 20

Optimization Pass

Requirements:

Lighthouse > 90

No memory leaks

Lazy loading

Code splitting

Memoization

Virtualized lyric lists

YouTube script loaded only when required

---

# PHASE 21

Final QA

Validate:

All game modes

All difficulties

Desktop

Mobile

LocalStorage integrity

Long sessions

Poor network conditions

Edge cases

Deliver production-ready application.

---

# Success Criteria

The project is complete when:

A user can:

- Open the website
- Select a song
- Play a YouTube video
- Follow synchronized lyrics
- Complete exercises
- Receive a score
- Gain XP
- Unlock achievements
- Track progress
- Return later and continue from LocalStorage

Without:

- Accounts
- Backend
- Database
- Authentication

Everything must work locally.