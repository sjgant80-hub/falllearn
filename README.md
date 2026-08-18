# FallLearn — how to actually talk to AI

**Live: https://sjgant80-hub.github.io/falllearn/**

Thirteen exercises. It marks what you write. One HTML file, works offline, no account, no model,
nothing you type leaves your machine.

## Why another one

Almost every course about talking to AI is a list of tips. You read it, you nod, and nothing has
changed — because nothing ever checked whether you could do it. **A lesson that cannot fail you has
not taught you anything; it has only agreed with you.**

So this one marks. You write a real request, and it tells you which of the things the exercise asked
for are actually in it — and for every one that is missing, the sentence you could paste.

## Both halves

| | |
|---|---|
| **Asking properly** (8) | ask for a thing not a topic · say who reads it · give it something to work from · say what finished looks like · show one example · say what you do not want · give it room to say no · then all of it, unprompted |
| **Reading the answer** (5) | the half nobody teaches: praise before the answer · warm-up padding · precise numbers from nowhere · not one soft edge anywhere · all of it at once |

Every reading exercise ends with the sentence to send back, because a fault you cannot act on is
trivia. The follow-up **is** the skill.

## What it cannot do, said up front

It checks whether you **said** a thing, not whether what you said was any good. It can see you named
an audience; it cannot know whether it was the right audience. Every verdict is "you left this out"
or "you put this in" — never "this is good". A marker claiming to judge quality would be doing
exactly what the course teaches you to catch.

It says so on every single pass, on purpose.

## Proof

| check | verdict |
|---|---|
| tests | 48 |
| mutation gate on `learn.mjs` | **1.00 — 0 survivors, 0 exemptions** |
| fuzz | `read` `mark` `tells` `exchange` never throw, on any input |
| lessons | every weak example provably FAILS its own exercise; every tell is provably findable |
| page | generated from `learn.mjs`; CI fails if the page and the marker disagree |

```bash
node --test learn.test.mjs lessons.test.mjs
node build-page.mjs
```

`learn.mjs` is pure — no model, no network, no clock, no randomness. The same text gets the same
verdict every time, which is what makes it something you can argue with.

## Take it with you

Save the page (⌘S / Ctrl-S) and it keeps working with the wifi off. That is the whole product —
one file.
