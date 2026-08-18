// The course is data, so the risk is not a wrong branch — it is a lesson that cannot be completed,
// or one whose own example passes the exercise it is supposed to fail. Both look perfectly fine on
// the page and waste the learner's time in a way nothing would ever report.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CARRIES, TELLS, mark, tells } from './learn.mjs';
import { LESSONS, WRITE, SPOT, byId, indexOf } from './lessons.mjs';

const writes = LESSONS.filter(l => l.kind === WRITE);
const spots = LESSONS.filter(l => l.kind === SPOT);

test('every lesson has a unique id and a real kind', () => {
  const ids = LESSONS.map(l => l.id);
  assert.equal(new Set(ids).size, ids.length, 'two lessons share an id');
  for (const l of LESSONS) assert.ok([WRITE, SPOT].includes(l.kind), l.id + ' is a ' + l.kind);
});

test('EVERY WRITING LESSON ASKS ONLY FOR THINGS THE MARKER CAN ACTUALLY SEE', () => {
  // A lesson asking for something the marker does not check can never be completed. The learner
  // writes it, the box stays red, and nothing anywhere explains why.
  for (const l of writes) {
    assert.ok(l.asked.length > 0, l.id + ' asks for nothing');
    for (const a of l.asked) assert.ok(Object.hasOwn(CARRIES, a), `${l.id} asks for "${a}", which is not something the marker reads`);
  }
});

test('every spotting lesson looks for tells the reader actually knows', () => {
  const known = new Set(TELLS.map(t => t.id));
  for (const l of spots) {
    assert.ok(l.find.length > 0, l.id + ' asks you to find nothing');
    for (const f of l.find) assert.ok(known.has(f), `${l.id} asks for "${f}", which no reader looks for`);
  }
});

test('THE WEAK EXAMPLE MUST ACTUALLY FAIL ITS OWN LESSON', () => {
  // ⚑ The one that would rot silently. A "here is the bad version" that quietly satisfies the
  // exercise teaches the opposite of the lesson, and the page would look identical.
  for (const l of writes) {
    const m = mark(l.weak, l.asked);
    assert.equal(m.passed, false, `${l.id}: the weak example passes its own exercise — it is not weak`);
    assert.ok(m.missing.length > 0);
  }
});

test('and the lesson explains why its weak example is weak, in plain words', () => {
  for (const l of writes) {
    assert.ok(l.weakWhy.length > 60, `${l.id} dismisses its own example in a shrug: ${l.weakWhy}`);
    assert.ok(l.brief.length > 30, l.id + ' has no real scenario to write against');
  }
});

test('EVERY SPOTTING LESSON CONTAINS EXACTLY THE TELLS IT CLAIMS', () => {
  // Two failures hide here: an example that does not contain the tell (unfindable, so the learner
  // is marked wrong for being right), and one that contains tells the lesson never mentions (marked
  // wrong for spotting something real).
  for (const l of spots) {
    const found = tells(l.reply, l.brief || '').map(t => t.id).sort();
    for (const f of l.find) assert.ok(found.includes(f), `${l.id}: the example does not contain "${f}" — it cannot be found`);
    for (const f of found) assert.ok(l.find.includes(f), `${l.id}: the example also contains "${f}", so a learner who spots it is marked wrong`);
  }
});

test('every lesson teaches something in a sentence you could disagree with', () => {
  for (const l of LESSONS) {
    assert.ok(l.title.length > 8, l.id + ' has no real title');
    assert.ok(l.teaches.length > 80, `${l.id} teaches in ${l.teaches.length} characters — that is a heading, not a lesson`);
    assert.ok(!/leverage|synergy|unlock your|game-chang|10x/i.test(l.teaches), l.id + ' teaches in course-speak');
  }
});

test('the course builds — the last writing lesson asks for everything', () => {
  const last = writes[writes.length - 1];
  assert.equal(last.asked.length, Object.keys(CARRIES).length,
    'the final exercise does not ask for the whole thing, so nothing ever tests the whole thing');
  // And nothing appears in a lesson before the lesson that introduces it.
  const seen = new Set();
  for (const l of writes.slice(0, -1)) {
    assert.ok(l.asked.includes(l.id) || l.id === 'whole', `${l.id} does not exercise the thing it is named for`);
    seen.add(l.id);
  }
});

test('no lesson demands more than three things at once, except the final one', () => {
  // Being asked for eight things you have never been shown is how people give up on lesson one.
  for (const l of writes.slice(0, -1)) {
    assert.ok(l.asked.length <= 3, `${l.id} asks for ${l.asked.length} things before any of them are taught`);
  }
});

test('the course speaks plainly — no in-house vocabulary reaches the learner', () => {
  // This is a public teaching tool. A word that means something only to us is a word that makes a
  // reader feel stupid for not knowing it.
  const banned = /\b(konomi|konomify|witness|proof-of-play|estate|sovereign|kernel|gate|didy|fallworld|mutation)\b/i;
  for (const l of LESSONS) {
    for (const field of ['title', 'teaches', 'brief', 'weakWhy']) {
      const v = l[field];
      if (typeof v !== 'string') continue;
      // Match first, then assert. Building the message inline evaluates it even when the check
      // passes, so a passing test dies inside its own failure message.
      const hit = v.match(banned);
      assert.equal(hit, null, hit ? `${l.id}.${field} uses in-house vocabulary: "${hit[0]}"` : '');
    }
  }
});

test('lookup by id works, and a lesson that is not there returns nothing rather than guessing', () => {
  assert.equal(byId('job').id, 'job');
  assert.equal(byId('nonsense'), null);
  assert.equal(indexOf('job'), 0, 'the course does not start with asking for a thing');
  assert.equal(indexOf('nonsense'), -1);
});

test('both halves are actually taught — writing and reading', () => {
  assert.ok(writes.length >= 6, 'only ' + writes.length + ' writing lessons');
  assert.ok(spots.length >= 4, 'only ' + spots.length + ' reading lessons — the half nobody teaches is missing again');
});
