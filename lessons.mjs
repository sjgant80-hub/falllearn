// lessons.mjs — the course.
//
// Two kinds of exercise, because talking to an AI is two skills and courses only ever teach one.
//
//   WRITE  you write a real request and the marker says which of the things it asks for are in it.
//   SPOT   you are shown a real answer and have to find what is wrong with it before it is told you.
//
// The order is not decorative. Each lesson adds one thing and keeps everything before it, so by the
// end you are writing the whole request without being reminded — which is the only test of whether
// you learned it rather than followed it.
import { CARRIES } from './learn.mjs';

export const WRITE = 'write';
export const SPOT = 'spot';

export const LESSONS = Object.freeze([
  {
    id: 'job', kind: WRITE, title: 'Ask for a thing, not a topic',
    teaches: 'Most requests that come back useless were never requests. "Marketing plan" is a subject; nobody can finish a subject and hand it to you. Start with a verb.',
    brief: 'You need a short note telling your customers that Saturday deliveries are stopping. Ask for it.',
    asked: ['job', 'detail'],
    weak: 'saturday deliveries',
    weakWhy: 'Two words and no verb. This is a topic, so what comes back is whatever the model guesses you meant — usually an essay about logistics.',
  },
  {
    id: 'who', kind: WRITE, title: 'Say who is going to read it',
    teaches: 'The same facts written for your boss and for a stranger are two different pieces of writing. If you do not say, you get the average of everybody, which suits nobody.',
    brief: 'Same note about Saturday deliveries — but now say who reads it.',
    asked: ['job', 'who', 'detail'],
    weak: 'Write a note about Saturday deliveries ending on 4 March.',
    weakWhy: 'A real job with a real date, and still no idea who is reading. It will land somewhere between a press release and a text to a friend.',
  },
  {
    id: 'ground', kind: WRITE, title: 'Give it something to work from',
    teaches: 'Asked about something it cannot see, a model does not stop — it fills the gap with what usually goes there. That is where invented details come from. Point it at your notes and the gap closes.',
    brief: 'You have the delivery dates and the reason in a note. Ask for the customer message, and tell it to use only that.',
    asked: ['job', 'who', 'ground'],
    weak: 'Write a note for customers about why Saturday deliveries are ending.',
    weakWhy: 'It has no idea why they are ending, so it will invent a plausible reason — and a plausible reason is the hardest kind of wrong to notice.',
  },
  {
    id: 'shape', kind: WRITE, title: 'Say what finished looks like',
    teaches: 'A request with no shape comes back as five paragraphs, because five paragraphs is the safe answer to everything. Say the format and the length and you stop editing it down.',
    brief: 'Ask again, and this time say exactly what you want handed back.',
    asked: ['job', 'who', 'shape'],
    weak: 'Write a customer note about Saturday deliveries for people who order weekly.',
    weakWhy: 'Good so far — but nothing says whether you want a text message or a page. You will get the page.',
  },
  {
    id: 'example', kind: WRITE, title: 'Show one example',
    teaches: 'One example moves an answer further than a paragraph describing what you want. Tone is almost impossible to describe and trivial to demonstrate.',
    brief: 'Ask for the note again, and show one line in the voice you actually want.',
    asked: ['job', 'shape', 'example'],
    weak: 'Write it in a friendly but professional tone, warm but not too casual.',
    weakWhy: 'Every one of those words means something different to everybody. One real sentence would have settled it.',
  },
  {
    id: 'limits', kind: WRITE, title: 'Say what you do not want',
    teaches: 'You know what you are sick of seeing. Say it. Ruling things out is faster than describing what should be there instead, and it is the fastest way to kill the house style you did not ask for.',
    brief: 'Ask for the note, and rule out the openers and closers you never want to see.',
    asked: ['job', 'shape', 'limits'],
    weak: 'Write the note and make it good and natural and not too corporate.',
    weakWhy: '"Not too corporate" is a feeling. "No opening line, no sign-off, never the word \'valued\'" is a rule it can follow.',
  },
  {
    id: 'openness', kind: WRITE, title: 'Give it room to say no',
    teaches: 'A model asked a question it cannot answer will answer anyway — that is the single most expensive habit it has. One sentence giving it permission to stop turns a confident invention into a question you can actually answer.',
    brief: 'Ask for the note, and add the line that lets it come back to you instead of guessing.',
    asked: ['job', 'who', 'openness'],
    weak: 'Write the customer note using the details below. Get it right.',
    weakWhy: '"Get it right" is not permission to admit a gap. It is pressure to sound right, which is a different thing and easier to fake.',
  },
  {
    id: 'whole', kind: WRITE, title: 'All of it, without being reminded',
    teaches: 'This is the test. Nothing new is introduced — you write one request carrying everything, in your own words, with nobody prompting you for the parts.',
    brief: 'Write the full request for the Saturday delivery note, as if for real.',
    asked: Object.keys(CARRIES),
    weak: 'Write a really good customer email about the delivery change, thanks.',
    weakWhy: '"Really good" is the whole request doing no work at all. Everything that would have made it good was left for the model to guess.',
  },

  // ── the half nobody teaches ──────────────────────────────────────────────────────────────────
  {
    id: 'flattery', kind: SPOT, title: 'When it opens by praising you',
    teaches: 'An answer that begins by telling you what a good question that was is warming you up. The warmth costs words that could have been the answer, and it is the cheapest signal that you are being agreed with.',
    reply: `Great question! Pricing is such an important topic. Here's my thinking on whether you should raise your prices: it really depends on your market position and your customers' willingness to pay.`,
    find: ['flattery'],
  },
  {
    id: 'padding', kind: SPOT, title: 'The warm-up before the answer',
    teaches: 'Openers like "in today\'s fast-paced world" are what gets written while the answer is being worked out. Anything you could delete without losing meaning was not an answer.',
    reply: `In today's fast-paced world, it's important to note that customer communication is key. Furthermore, as we navigate the ever-evolving landscape of delivery logistics, businesses must unlock new ways of keeping customers informed.`,
    find: ['padding'],
  },
  {
    id: 'precision', kind: SPOT, title: 'Numbers out of nowhere',
    teaches: 'An exact figure with no source is the easiest thing to produce and the hardest to catch. It reads as research. Ask where each number came from and watch which ones survive.',
    reply: `Studies show that 73% of customers prefer email notifications, and research shows a 2.4x increase in retention when businesses give at least 14 days notice. Experts agree this is the single biggest factor.`,
    find: ['precision'],
  },
  {
    id: 'nodoubt', kind: SPOT, title: 'Not one soft edge anywhere',
    teaches: 'A long answer about anything real has parts it is less sure of. One with none has either checked everything or is guessing smoothly, and from where you are sitting those look the same. Ask which parts are weakest.',
    reply: `You should stop Saturday deliveries at the end of the month. Customers will understand and retention will not be affected. Send one email two weeks before and follow up on the day. Your competitors have all made this change and none of them lost business. The operational saving will cover the cost of the transition within one quarter, and your drivers will welcome the change. Schedule the announcement for a Tuesday morning, which is when open rates are strongest, and keep the message to three short paragraphs so that it reads on a phone without scrolling.`,
    find: ['nodoubt'],
  },
  {
    id: 'stack', kind: SPOT, title: 'All of it at once',
    teaches: 'Real answers rarely fail in only one way. This is what a genuinely bad reply looks like — find everything wrong with it, then send the follow-up.',
    reply: `Great question! In today's fast-paced world, customer communication is absolutely critical. Studies show that 89% of customers expect at least 30 days notice of any service change. You should announce the change immediately, send a follow-up email, and offer a discount. This will maintain satisfaction and protect your revenue. It's important to note that businesses who handle this well see a 3.2x improvement in loyalty.`,
    find: ['flattery', 'padding', 'precision'],
  },
]);

/** The lesson before this one is finished — used to walk the course in order. */
export const byId = (id) => LESSONS.find(l => l.id === id) || null;
export const indexOf = (id) => LESSONS.findIndex(l => l.id === id);
export default LESSONS;
