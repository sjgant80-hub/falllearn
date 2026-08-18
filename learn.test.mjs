// Tests for the marker.
//
// The thing to defend against here is the pleasant failure: a marker that passes everybody. It
// would look fine in every screenshot, every learner would feel good, and nobody would learn
// anything. So a large share of these tests are about what must FAIL.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CARRIES, MEANS, FIXES, TOO_SHORT, LIMIT, TELLS, COMEBACK, read, mark, tells, exchange } from './learn.mjs';

const ALL = Object.keys(CARRIES);

const GOOD = `Rewrite the paragraph below for a customer who has never used the product before.
Use only the notes I have pasted. Six bullets, under 15 words each. Something like: "We have moved
your delivery to Tuesday." Do not use the word "solution" and no closing summary. If anything is
unclear or you would be guessing, say so instead of filling it in. The order number is 44812.`;

// ─────────────────────────── reading a request ───────────────────────────

test('a request carrying everything is seen to carry everything', () => {
  const r = read(GOOD);
  for (const k of ALL) assert.ok(r.carries[k].found, `missed ${k} (${MEANS[k]}) in a request that has it`);
});

test('a bare topic carries almost nothing', () => {
  const r = read('marketing plan');
  const found = ALL.filter(k => r.carries[k].found);
  assert.deepEqual(found, [], 'a two-word topic was read as carrying ' + found.join(', '));
});

test('EVERY SIGNAL QUOTES THE TEXT THAT FIRED IT', () => {
  // A marker that says "missing context" and cannot point at anything is indistinguishable from a
  // marker that is guessing, and a learner is right to ignore it.
  const r = read(GOOD);
  for (const k of ALL) {
    assert.equal(typeof r.carries[k].evidence, 'string', `${k} said found with no evidence`);
    assert.ok(r.carries[k].evidence.length > 0);
  }
  assert.equal(read('marketing plan').carries.who.evidence, null, 'a miss must carry no evidence at all');
});

test('a job needs a verb — a subject is not a request', () => {
  assert.ok(read('Write a blog post about pricing').carries.job.found);
  assert.ok(read('Compare these two options').carries.job.found);
  assert.ok(!read('a blog post about pricing').carries.job.found, 'a noun phrase read as a job');
  assert.ok(!read('help me with my pricing page please').carries.job.found, '"help me with X" is not a job');
});

test('concrete detail means a number, a name, or a quoted phrase — not length', () => {
  assert.ok(read('Write to the customer about order 44812').carries.detail.found);
  assert.ok(read('Draft a note to the team about Barcelona').carries.detail.found);
  assert.ok(read('Rewrite the line "we regret to inform you" please').carries.detail.found);
  const waffle = 'Write something really good and quite detailed and thorough and helpful and long';
  assert.ok(!read(waffle).carries.detail.found, 'a pile of adjectives read as concrete detail');
});

test('reading is case-insensitive and survives anything at all', () => {
  assert.equal(read('FOR A BEGINNER').carries.who.found, read('for a beginner').carries.who.found);
  // read() is deliberately literal: handed the text "0" it will say yes, there is a number in it,
  // because there is. The floor in mark() is what stops that becoming a pass — so the guarantee
  // worth testing is that no junk ever gets marked, not that the reader refuses to see it.
  for (const junk of [null, undefined, 0, NaN, [], {}, true, { toString() { throw new Error('no'); } }]) {
    const r = read(junk);
    assert.equal(typeof r.words, 'number');
    assert.ok(r.words < TOO_SHORT, 'junk read as a real request of ' + r.words + ' words');
    const m = mark(junk, ALL);
    assert.equal(m.passed, false, 'junk was marked as a pass');
    assert.equal(m.score, 0);
  }
  for (const blank of [null, undefined, '', '   ']) {
    const r = read(blank);
    for (const k of ALL) assert.equal(r.carries[k].found, false, 'an empty request was read as carrying ' + k);
  }
});

// ─────────────────────────── marking ───────────────────────────

test('NOTHING PASSES ON AN EMPTY PAGE', () => {
  // The cannot-fail badge, in its most obvious form.
  for (const empty of ['', '   ', null, undefined]) {
    const m = mark(empty, ALL);
    assert.equal(m.passed, false, 'an empty box passed');
    assert.equal(m.score, 0);
    assert.deepEqual(m.met, []);
    assert.ok(m.verdict.length > 0);
  }
});

test('a request under the floor cannot pass, however well chosen its words', () => {
  // "Write for a beginner" ticks two boxes by accident. It is still not a request.
  const m = mark('Write for a beginner', ['who', 'job']);
  assert.ok(m.words < TOO_SHORT);
  assert.equal(m.passed, false, 'four words passed a two-signal lesson');
  assert.equal(m.score, 0);
  assert.ok(/short|topic/i.test(m.verdict), 'the verdict did not say why: ' + m.verdict);
});

test('a lesson marks what it asked for and nothing else', () => {
  // Being told off for missing something the lesson never mentioned is how people learn to ignore
  // feedback entirely.
  const m = mark('Write six bullets about our new pricing for a first-time customer', ['who', 'job']);
  assert.deepEqual(m.asked, ['who', 'job']);
  assert.equal(m.passed, true);
  assert.deepEqual(m.missing, []);
  assert.ok(!m.notes.some(n => n.carries === 'example'), 'marked something the lesson never asked for');
});

test('EVERY MISS HANDS BACK A SENTENCE YOU COULD PASTE, not a label', () => {
  const m = mark('Write a blog post about our pricing changes this quarter', ALL);
  assert.ok(m.missing.length > 0);
  for (const n of m.notes) {
    assert.ok(n.fix.length > 40, `${n.carries} was refused with a label, not a fix: ${n.fix}`);
    assert.equal(n.means, MEANS[n.carries]);
  }
});

test('a full pass still says what the marker cannot see', () => {
  const m = mark(GOOD, ALL);
  assert.equal(m.passed, true, 'a complete request did not pass: missing ' + m.missing.join(', '));
  assert.equal(m.score, 1);
  assert.ok(m.verdict.includes(LIMIT), 'a pass was awarded with no word about what it could not judge');
  assert.ok(!/excellent|great|well done|perfect|amazing/i.test(m.verdict), 'the marker started flattering: ' + m.verdict);
});

test('the score is the share of what the lesson asked for', () => {
  const m = mark('Write six bullets about pricing for a first-time customer', ['who', 'job', 'example']);
  assert.equal(m.met.length + m.missing.length, 3);
  assert.ok(Math.abs(m.score - m.met.length / 3) < 1e-9);
});

test('an exercise that asks for nothing scores nothing rather than everything', () => {
  const m = mark(GOOD, []);
  assert.equal(m.score, null, 'an empty lesson awarded ' + m.score);
  assert.equal(m.passed, false);
});

test('a made-up thing to check is ignored, not marked', () => {
  const m = mark(GOOD, ['who', 'telepathy', 'job']);
  assert.deepEqual(m.asked, ['who', 'job']);
});

test('marking is total and repeatable', () => {
  for (const bad of [null, undefined, 7, {}, [], 'x', { toString() { throw new Error('no'); } }]) {
    for (const asked of [null, undefined, 'who', ['who'], [null, 7], ALL]) {
      const m = mark(bad, asked);
      assert.equal(typeof m.verdict, 'string');
      assert.ok(Array.isArray(m.missing));
    }
  }
  assert.deepEqual(mark(GOOD, ALL), mark(GOOD, ALL));
});

// ─────────────────────────── reading the answer ───────────────────────────

test('it catches an answer that opens by praising you', () => {
  const t = tells('Great question! Here is what I think about pricing.', 'how should we price this');
  assert.ok(t.some(x => x.id === 'flattery'), 'flattery went unnoticed');
  assert.ok(t.find(x => x.id === 'flattery').evidence.includes('great question'));
});

test('A LONG ANSWER WITH NO DOUBT IN IT ANYWHERE IS THE TELL', () => {
  const certain = ('The correct approach is to raise prices immediately across every tier. '
    + 'This will increase revenue and customers will accept it. The market rewards confidence and '
    + 'every competitor has already done this. Implement it on Monday and communicate by email. ').repeat(3);
  assert.ok(tells(certain, 'should we raise prices').some(x => x.id === 'nodoubt'));

  const honest = certain + ' That said, this depends on your churn, and I am not sure what it is.';
  assert.ok(!tells(honest, 'should we raise prices').some(x => x.id === 'nodoubt'),
    'an answer that admitted a limit was still called overconfident');
});

test('a short answer is not accused of overconfidence', () => {
  // Not every brief reply is hiding something, and a checker that cries wolf gets switched off.
  assert.ok(!tells('Yes. Tuesday works.', 'is tuesday ok').some(x => x.id === 'nodoubt'));
});

test('precise numbers with no source are flagged; with a source they are not', () => {
  const bare = 'Around 73% of teams report better results when they do this.';
  assert.ok(tells(bare, 'does this work').some(x => x.id === 'precision'), 'an unsourced statistic passed');
  const sourced = bare + ' Source: https://example.com/report — though you should check it yourself.';
  assert.ok(!tells(sourced, 'does this work').some(x => x.id === 'precision'), 'a sourced figure was still flagged');
});

test('warm-up padding is caught', () => {
  assert.ok(tells("In today's fast-paced world, pricing is important.", 'pricing').some(x => x.id === 'padding'));
  assert.ok(tells('It is important to note that the file is missing.', 'where is it').some(x => x.id === 'padding'));
});

test('an answer that opens by repeating your question back is caught', () => {
  const q = 'how do I reset the router in the upstairs office on a weekend';
  const echo = 'How do you reset the router in the upstairs office on a weekend? Here is how you reset it.';
  assert.ok(tells(echo, q).some(x => x.id === 'echo'), 'the echo went unnoticed');
  const straight = 'Hold the pinhole button for ten seconds until the light goes amber, then wait two minutes.';
  assert.ok(!tells(straight, q).some(x => x.id === 'echo'), 'a direct answer was called an echo');
});

test('a plain, hedged, sourced, unflattering answer trips nothing', () => {
  const clean = 'Hold the pinhole for ten seconds. It might need two tries if the light stays green.';
  assert.deepEqual(tells(clean, 'how do I reset the router'), []);
});

test('EVERY TELL HANDS BACK THE SENTENCE TO SEND NEXT', () => {
  // A tell nobody can act on is trivia. The follow-up is the entire skill.
  for (const t of TELLS) {
    assert.ok(COMEBACK[t.id], t.id + ' has no comeback');
    assert.ok(COMEBACK[t.id].length > 15, t.id + ' comeback is a shrug: ' + COMEBACK[t.id]);
    assert.ok(t.why.length > 60, t.id + ' does not explain itself: ' + t.why);
  }
});

test('reading an answer is total', () => {
  for (const bad of [null, undefined, 0, NaN, [], {}, true, { toString() { throw new Error('no'); } }]) {
    assert.ok(Array.isArray(tells(bad, bad)));
    assert.ok(Array.isArray(tells('a real reply', bad)));
    assert.ok(Array.isArray(tells(bad, 'a real question')));
  }
});

// ─────────────────────────── the whole loop ───────────────────────────

test('the exchange marks what you sent and what came back, and says what to send next', () => {
  const e = exchange(GOOD, 'Great question! In today\'s fast-paced world, 82% of teams do this.', ALL);
  assert.equal(e.sent.passed, true);
  assert.ok(e.back.length >= 3, 'a reply full of tells produced ' + e.back.length);
  assert.equal(e.next.length, e.back.length, 'a tell came back with no next move');
  assert.equal(e.clean, false);
});

test('a clean exchange says so without inventing a problem', () => {
  const e = exchange(GOOD, 'Hold the pinhole for ten seconds; it might take two tries.', ALL);
  assert.deepEqual(e.back, []);
  assert.equal(e.clean, true);
});

test('an empty reply is not a clean reply', () => {
  // Silence trips no tells, and reading that as a good answer is the cannot-fail badge again.
  for (const empty of ['', '   ', null, undefined]) {
    assert.equal(exchange(GOOD, empty, ALL).clean, false, 'an empty reply passed as clean');
  }
});

test('the same exchange gives the same reading every time, in the same order', () => {
  const a = exchange(GOOD, 'Great question! It is important to note that 50% agree.', ALL);
  const b = exchange(GOOD, 'Great question! It is important to note that 50% agree.', ALL);
  assert.deepEqual(a, b);
  assert.deepEqual(a.back.map(t => t.id), TELLS.filter(t => a.back.some(x => x.id === t.id)).map(t => t.id),
    'tells came back in an unstable order');
});

test('every fix and every meaning is a sentence somebody could act on', () => {
  for (const k of Object.keys(CARRIES)) {
    assert.ok(MEANS[k] && MEANS[k].length > 10, k + ' has no plain meaning');
    assert.ok(FIXES[k] && FIXES[k].length > 40, k + ' has no usable fix');
    assert.ok(!/context|leverage|synergy|optimi[sz]e your/i.test(FIXES[k]), k + ' fix is course-speak: ' + FIXES[k]);
  }
});


// ─── the boundaries the mutation gate proved nothing was holding ───

test('the floor is exactly where it says it is', () => {
  // One word either side of the line. A floor that quietly sits one word higher fails requests that
  // the tool told the learner were long enough, which is worse than having no floor at all.
  const six = 'Write six bullets for a beginner';           // exactly TOO_SHORT words
  assert.equal(read(six).words, TOO_SHORT);
  const m = mark(six, ['who', 'job']);
  assert.equal(m.passed, true, 'a request of exactly the minimum was refused: ' + m.verdict);

  const five = 'Write bullets for a beginner';
  assert.equal(read(five).words, TOO_SHORT - 1);
  assert.equal(mark(five, ['who', 'job']).passed, false, 'one word under the floor still passed');
});

test('the too-short message counts in English, singular and plural', () => {
  assert.ok(/1 word\b/.test(mark('pricing', ['job']).verdict), 'said: ' + mark('pricing', ['job']).verdict);
  assert.ok(/2 words\b/.test(mark('pricing plan', ['job']).verdict), 'said: ' + mark('pricing plan', ['job']).verdict);
});

test('the overconfidence check fires exactly at its own threshold, not one word later', () => {
  const flat = ('the price is fixed and the answer is final and the team agrees on every point ').repeat(20);
  const w = flat.trim().split(/\s+/);
  const at = w.slice(0, 90).join(' ');
  const under = w.slice(0, 89).join(' ');
  assert.ok(tells(at, 'q').some(x => x.id === 'nodoubt'), 'an answer at the threshold was let through');
  assert.ok(!tells(under, 'q').some(x => x.id === 'nodoubt'), 'an answer under the threshold was flagged');
});

test('the echo check needs a real question and a real answer before it will accuse anybody', () => {
  // Three words of question is not enough to say an answer echoed it, and a checker that accuses on
  // thin evidence is one people learn to switch off.
  assert.ok(!tells('reset the router now please ok then', 'reset the router').some(x => x.id === 'echo'),
    'a three-word question was enough to accuse the answer of echoing');
  const q = 'how do I reset the upstairs router';                 // 7 distinct words
  const eleven = 'how do I reset the upstairs router well';       // under the answer floor
  assert.ok(!tells(eleven, q).some(x => x.id === 'echo'), 'an answer too short to judge was judged');
});

test('half the opening being your own words is the line, and it is inclusive', () => {
  // Exactly half: the tell fires. This is the number a learner will argue with, so it has to be
  // the number the code actually uses.
  // Constructed to sit exactly on the line rather than near it: the opening has eight distinct
  // words and four of them are the asker's. A boundary test that lands at 0.44 proves nothing
  // about 0.5, and 0.5 is the number somebody will one day argue with.
  const q = 'reset upstairs router weekend';
  const half = 'reset upstairs router weekend the the the the the hold pinhole ten';
  const t = tells(half, q).find(x => x.id === 'echo');
  assert.ok(t, 'an opening that was half your own words was not flagged');
  assert.ok(/%/.test(t.evidence), 'the echo tell did not say how much: ' + t.evidence);
});

test('the unsourced-number tell quotes the actual figure it objected to', () => {
  // "It used a statistic" is not something a learner can act on. "It said 73%" is.
  const t = tells('Around 73% of teams report better results.', 'does this work').find(x => x.id === 'precision');
  assert.ok(t, 'an unsourced statistic passed');
  assert.ok(t.evidence.includes('73%'), 'the tell did not quote the figure: ' + t.evidence);
});

test('a year is treated as a claim needing a source, like any other hard number', () => {
  const t = tells('The rule changed in 2019 and has applied since.', 'when did it change');
  assert.ok(t.some(x => x.id === 'precision'), 'a bare date passed as though it needed no source');
});
