// ══════════════════════════════════════════════════════════════════════════════════════════════
// learn.mjs — the part of a learning tool that is allowed to tell you no.
//
// Almost every course about talking to AI is a list of tips. You read it, you nod, and nothing has
// changed, because nothing ever checked whether you could actually do it. A lesson that cannot fail
// you has not taught you anything; it has only agreed with you.
//
// So this file is a marker, and it is a deliberately narrow one. It reads what you actually wrote
// and reports which of the eight things a request can carry are present, which are missing, and —
// for every missing one — the specific sentence you could add. Then it does the other half, which
// is the half people are never taught: it reads the ANSWER and points at the tells that mean you
// are being agreed with rather than helped.
//
// ⚑ WHAT THIS CANNOT DO, SAID UP FRONT BECAUSE THAT IS THE WHOLE LESSON.
// It checks whether you SAID a thing, not whether what you said is any good. It can see that you
// named an audience; it cannot know whether that audience is the right one. Every verdict here is
// "you left this out" or "you put this in" — never "this is good". A marker that claimed to judge
// quality would be doing exactly what it is teaching you to catch.
//
// No model. No network. No clock, no randomness. It runs on your machine, offline, and gives the
// same verdict on the same text every time — so you can argue with it, which you cannot do with a
// score that changes when you ask twice.
// ══════════════════════════════════════════════════════════════════════════════════════════════

/** Never let a value refuse to become text. An object whose toString throws must not stop a lesson. */
const text = (v) => { try { return String(v ?? ''); } catch { return ''; } };
const low = (v) => text(v).toLowerCase();
const words = (v) => low(v).match(/[a-z0-9'’-]+/g) || [];

/** Does any of these phrases appear? Returns the one that did, so the marker can quote it back. */
const anyOf = (haystack, needles) => needles.find(n => haystack.includes(n)) || null;

// ── THE EIGHT THINGS A REQUEST CAN CARRY ──────────────────────────────────────────────────────
// Chosen because each one is visible in the text itself. A signal a marker cannot see is a signal
// it must not claim to grade.
export const CARRIES = Object.freeze({
  who: 'who',
  job: 'job',
  ground: 'ground',
  shape: 'shape',
  example: 'example',
  limits: 'limits',
  openness: 'openness',
  detail: 'detail',
});

export const MEANS = Object.freeze({
  who: 'who the answer is for',
  job: 'what you actually want done',
  ground: 'what it should work from',
  shape: 'what the finished thing looks like',
  example: 'a sample of what good looks like',
  limits: 'what to leave out or avoid',
  openness: 'permission to push back',
  detail: 'concrete detail',
});

// The sentence to add when it is missing. Written as something you could paste, because "add more
// context" is advice nobody has ever been able to act on.
export const FIXES = Object.freeze({
  who: 'Say who reads it: "This is for someone who has never used the product before."',
  job: 'Start with a verb and one object: "Write…", "Compare…", "Find the three…". "Help me with X" is not a job.',
  ground: 'Point at what it should use: "Use only the notes below" — then paste them. Otherwise it works from nothing and fills the gap itself.',
  shape: 'Say what finished looks like: "Six bullets, under 15 words each" or "one email, no subject line".',
  example: 'Show one: "Something like: \'We\'ve moved your delivery to Tuesday — sorry for the mess.\'" One example moves the answer further than a paragraph of description.',
  limits: 'Say what you do not want: "No introduction, no summary at the end, do not use the word \'solution\'."',
  openness: 'Give it room to say no: "If anything here is unclear or you would be guessing, say so instead of filling it in."',
  detail: 'Put something real in: a name, a number, a date, the actual sentence you are stuck on. A request with nothing specific in it can only come back generic.',
});

// ── reading a request ─────────────────────────────────────────────────────────────────────────

const AUDIENCE = ['for a ', 'for an ', 'for my ', 'for our ', 'for people', 'for someone', 'for the ',
  'audience', 'reader', 'readers', 'my boss', 'my team', 'my customers', 'my students', 'my mum',
  'beginner', 'beginners', 'a child', 'non-technical', 'nontechnical', 'someone who'];
const GROUND = ['below', 'above', 'attached', 'the notes', 'these notes', 'this file', 'the file',
  'the data', 'this data', 'the transcript', 'the document', 'the text', 'based on', 'using only',
  'use only', 'from the', 'in the email', 'pasted', 'here is', 'here are'];
const SHAPE = ['bullet', 'bullets', 'table', 'email', 'paragraph', 'paragraphs', 'sentence',
  'sentences', 'list', 'headline', 'headlines', 'summary', 'one page', 'word', 'words',
  'no more than', 'at most', 'under ', 'exactly ', 'format', 'columns', 'steps'];
const EXAMPLE = ['for example', 'e.g.', 'eg.', 'such as', 'like this', 'here is one', "here's one",
  'an example', 'example:', 'something like', 'similar to', 'in the style of'];
const LIMITS = ["don't", 'do not', 'avoid', 'without', 'never ', 'no jargon', 'leave out',
  'skip the', 'not the', 'rather than', 'instead of', 'except'];
const OPENNESS = ['if you', 'not sure', 'unsure', 'unclear', 'ask me', 'tell me what', 'what else',
  'push back', 'disagree', 'flag ', 'say so', 'would be guessing', 'guessing', 'missing',
  'before you start', 'questions'];

// A verb in the first few words is what separates a request from a topic. "Marketing plan" is a
// subject; "Draft a marketing plan" is a job somebody can finish and hand back.
const VERBS = ['write', 'draft', 'rewrite', 'edit', 'summarise', 'summarize', 'compare', 'list',
  'find', 'explain', 'translate', 'plan', 'check', 'review', 'turn', 'make', 'build', 'fix',
  'shorten', 'expand', 'name', 'suggest', 'give', 'show', 'sort', 'group', 'rank', 'pick',
  'reply', 'respond', 'answer', 'describe', 'outline', 'critique', 'proofread', 'convert'];

/** Concrete detail: a name, a number, a date, a quoted phrase. Vagueness has none of these. */
function hasDetail(raw) {
  const s = text(raw);
  if (/\d/.test(s)) return 'a number';
  if (/["“][^"”]{4,}["”]/.test(s)) return 'a quoted phrase';
  // A capitalised word that is not merely the start of a sentence — a name, a place, a product.
  const proper = s.match(/(?:[a-z0-9,;:)]\s+)([A-Z][a-zA-Z]{2,})/);
  if (proper) return `a name (${proper[1]})`;
  return null;
}

/**
 * What does this request actually carry? Each answer is `{ found, evidence }` — evidence is the
 * bit of your own text that made the marker say yes, so you can see it was not guessing.
 */
export function read(request) {
  const raw = text(request);
  const s = low(raw);
  const w = words(raw);
  // Politeness is not part of the request. "Please could you write…" still starts with "write".
  const POLITE = new Set(['please', 'can', 'could', 'would', 'you', 'i', 'need', 'want', 'to', 'me',
    'hi', 'hey', 'hello', 'ok', 'okay', 'so', 'now', 'just', 'quickly', 'kindly', 'lets', "let's", 'let', 'us']);
  const opener = w.find(x => !POLITE.has(x)) || '';

  const sig = (found, evidence) => ({ found: Boolean(found), evidence: found ? String(evidence) : null });
  const detail = hasDetail(raw);

  // ⚑ A JOB MEANS THE REQUEST *STARTS* WITH A VERB, not that a verb appears somewhere in it.
  // Half these words are nouns as well: "marketing plan", "shopping list", "the review" all contain
  // a verb and none of them is a job. Looking anywhere in the sentence marked a bare topic as a
  // proper request — which is precisely the mistake the lesson is trying to correct.
  const verb = VERBS.includes(opener) ? opener : null;

  return {
    words: w.length,
    carries: {
      who: sig(anyOf(s, AUDIENCE), anyOf(s, AUDIENCE)),
      job: sig(verb, verb ? `it starts with a verb ("${verb}")` : null),
      ground: sig(anyOf(s, GROUND), anyOf(s, GROUND)),
      shape: sig(anyOf(s, SHAPE), anyOf(s, SHAPE)),
      example: sig(anyOf(s, EXAMPLE), anyOf(s, EXAMPLE)),
      limits: sig(anyOf(s, LIMITS), anyOf(s, LIMITS)),
      openness: sig(anyOf(s, OPENNESS), anyOf(s, OPENNESS)),
      detail: sig(detail, detail),
    },
  };
}

// ── marking one exercise ──────────────────────────────────────────────────────────────────────

/** The floor. Below this a request cannot carry anything, whatever words happen to be in it. */
export const TOO_SHORT = 6;

/**
 * Mark a request against ONE lesson. A lesson names the handful of things it is teaching, and the
 * marker grades those and nothing else — being told off for missing something the lesson never
 * mentioned is how people learn to ignore feedback.
 */
export function mark(request, asked) {
  const want = (Array.isArray(asked) ? asked : [])
    .map(a => text(a)).filter(a => Object.hasOwn(CARRIES, a));
  const r = read(request);

  // ⚑ NOTHING PASSES ON AN EMPTY PAGE. A marker that awards a point for a blank box is the
  // cannot-fail badge this whole tool exists to argue against.
  if (r.words < TOO_SHORT) {
    return {
      words: r.words, asked: want, met: [], missing: want, score: 0, passed: false,
      notes: want.map(k => ({ carries: k, means: MEANS[k], fix: FIXES[k] })),
      verdict: r.words === 0
        ? 'Nothing written yet.'
        : `Only ${r.words} word${r.words === 1 ? '' : 's'}. A request this short cannot carry what the lesson is asking for — it is a topic, not a job.`,
    };
  }

  const met = want.filter(k => r.carries[k].found);
  const missing = want.filter(k => !r.carries[k].found);
  const score = want.length === 0 ? null : met.length / want.length;

  return {
    words: r.words,
    asked: want,
    met, missing,
    score,
    passed: want.length > 0 && missing.length === 0,
    evidence: met.map(k => ({ carries: k, saw: r.carries[k].evidence })),
    notes: missing.map(k => ({ carries: k, means: MEANS[k], fix: FIXES[k] })),
    verdict: want.length === 0 ? 'This exercise asks for nothing, so there is nothing to mark.'
      : missing.length === 0
        ? `All ${want.length} in. ${LIMIT}`
        : `${met.length} of ${want.length}. Missing: ${missing.map(k => MEANS[k]).join(', ')}.`,
  };
}

// Said on every pass, on purpose. The moment a marker starts saying "excellent" it has stopped
// being useful and started being pleasant, which is the exact failure it is teaching you to spot.
export const LIMIT = 'That is everything this checker can see — it knows you said these things, not whether they were the right ones.';

// ── reading the ANSWER: the half nobody teaches ───────────────────────────────────────────────
//
// Getting a reply is not the end of the exchange, it is the middle. These are the marks a reply
// leaves when it is agreeing with you rather than helping you — all of them visible in the text,
// none of them requiring another model to spot.

export const TELLS = Object.freeze([
  {
    id: 'flattery',
    name: 'It opened by praising you',
    why: 'An answer that starts by telling you what a good question it was is warming you up, and the warmth costs words that could have been the answer.',
    look: ['great question', 'excellent question', "that's a great", 'what a great', 'good question',
      'absolutely right', "you're absolutely", 'i apologize', 'i apologise', 'my apologies'],
  },
  {
    id: 'nodoubt',
    name: 'Not one word of doubt anywhere',
    why: 'A long answer about anything real has soft edges. One with none has either checked everything or is guessing smoothly, and from the outside those look identical. Ask it which parts it is least sure of.',
    hedges: ['might', 'may ', 'could', 'roughly', 'about ', 'approximately', 'i think', 'unclear',
      'not sure', 'uncertain', 'depends', 'assuming', 'if ', 'unless', 'likely', 'probably',
      'appears', 'seems', 'typically', 'usually', 'generally'],
    minWords: 90,
  },
  {
    id: 'precision',
    name: 'Precise numbers from nowhere',
    why: 'Exact figures with no source are the easiest thing in the world to produce and the hardest to notice. "73% of teams" reads as research and can be invented whole. Ask where the number came from.',
    look: [/\b\d{1,3}(\.\d+)?\s?%/, /\b(19|20)\d{2}\b/, /\bstudies show\b/i, /\bresearch shows\b/i,
      /\bexperts (say|agree)\b/i, /\baccording to (a |an )?(study|survey|report)\b/i],
    sources: ['source', 'sources', 'link', 'https://', 'citation', 'reference', 'i cannot verify',
      'i have not checked', 'from memory', 'you should check'],
  },
  {
    id: 'padding',
    name: 'Warm-up before the answer',
    why: 'Openers like "in today\'s fast-paced world" are what a model writes while it works out what to say. Anything you could delete without losing meaning was not an answer.',
    look: ["in today's", 'in the world of', 'fast-paced', "it's important to note", 'it is important to note',
      "it's worth noting", 'delve', 'navigate the', 'landscape of', 'in conclusion', 'furthermore',
      'moreover', 'that being said', 'at the end of the day', 'unlock', 'harness the power',
      'ever-evolving', 'in summary'],
  },
  {
    id: 'echo',
    name: 'It repeated your question back',
    why: 'Restating what you just asked fills the top of the reply with words you already had. It is not comprehension, it is throat-clearing.',
  },
]);

const wordSet = (v) => new Set(words(v));

/**
 * Read a reply and name the tells. Each returns the evidence that fired it, because "this looks
 * like AI slop" is not something a person can learn from — "it praised you in the first line, here
 * is the line" is.
 */
export function tells(reply, request) {
  const raw = text(reply);
  const s = low(raw);
  const w = words(raw);
  const out = [];
  const hit = (t, evidence) => out.push({ id: t.id, name: t.name, why: t.why, evidence: text(evidence) });

  for (const t of TELLS) {
    if (t.id === 'flattery' || t.id === 'padding') {
      const found = anyOf(s, t.look);
      if (found) hit(t, `it says "${found}"`);
    }
    if (t.id === 'nodoubt') {
      // Only meaningful on an answer long enough to have needed a soft edge somewhere.
      if (w.length >= t.minWords && !t.hedges.some(h => s.includes(h))) {
        hit(t, `${w.length} words and not one of "might", "roughly", "depends", "I'm not sure"`);
      }
    }
    if (t.id === 'precision') {
      const found = t.look.find(rx => rx.test(raw));
      const cited = t.sources.some(src => s.includes(src));
      if (found && !cited) hit(t, `a figure or claim like "${(raw.match(found) || [''])[0]}" with nothing said about where it came from`);
    }
    if (t.id === 'echo') {
      const q = wordSet(request);
      if (q.size >= 4 && w.length >= 12) {
        const opening = new Set(w.slice(0, Math.min(25, w.length)));
        let shared = 0;
        for (const x of opening) if (q.has(x)) shared += 1;
        if (shared / opening.size >= 0.5) hit(t, `${Math.round((shared / opening.size) * 100)}% of the opening is words from your own question`);
      }
    }
  }
  return out;
}

/**
 * What to do about it. A tell nobody can act on is trivia, so every reading ends with the sentence
 * you can send back — the follow-up IS the skill this whole thing is teaching.
 */
export const COMEBACK = Object.freeze({
  flattery: 'Answer the question first. Skip the opening line.',
  nodoubt: 'Which parts of that are you least sure about, and what would you need to check them?',
  precision: 'Where does each of those numbers come from? Mark any you cannot source.',
  padding: 'Cut everything that is not the answer. Give it to me again, half the length.',
  echo: 'Do not restate my question. Start at the first new thing you have to say.',
});

/** The whole loop in one call: what you sent, what came back, what to send next. */
export function exchange(request, reply, asked) {
  const marked = mark(request, asked);
  const found = tells(reply, request);
  return {
    sent: marked,
    back: found,
    // Ordered as the tells are declared, so two people looking at the same exchange are handed the
    // same next move rather than whichever one their tool happened to list first.
    next: found.map(t => ({ id: t.id, ask: COMEBACK[t.id] })),
    clean: text(reply).trim().length > 0 && found.length === 0,
  };
}
