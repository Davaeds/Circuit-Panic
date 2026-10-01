/* Circuit Panic! — the wiring levels. One factory, buildLevel(), builds each
   level's scene and screen; everything but the practice board in the middle is
   shared, so both levels live in the same workshop with the same light and ink.

   Level 1, "Flip the Switch".
   The same late-night workshop as the menu. On the left the house's service panel
   hangs on the plank wall, fed by a conduit from the ceiling; in the middle, under
   the green shop lamp, the practice board carries a steel device box with the
   nervous switch standing in it, and a porcelain lampholder with the bulb on top.
   Off to the right there's a hole in the plaster, and the bench in front is the
   stage anyone walks on along. The player runs real, sagging cables between
   binding screws, wraps them clockwise, pigtails doubled screws with a wire nut,
   grounds the switch box, tests for voltage with a neon pen, and calls in the
   Inspector, who traces the job terminal by terminal.
   The rule for everything that happens: circuit.js decides what physically
   happens (does the bulb light, does the breaker trip, is that metal live, where
   exactly is the mistake), and this file only exaggerates that outcome for
   comedy.

   Level 2, "Stairway Lights".
   The same workshop, but the practice board is a stairway mock-up: a light over
   the stairs controlled from two places, a 3-way switch at the foot and another
   at the head. The two switch characters argue about which of them is really in
   charge of the light (both are); the old fuse heckles from the bench. */
(function () {
  'use strict';
  const T = window.Toons, A = window.AudioSys, App = window.App, C = window.Circuit, { Particles } = window.FX;
  const G = window.GFX; /* the GPU light pass (js/gfx.js), may be missing or off */
  const { el, sa, R, rand, pick, clamp, INK } = T;
  const svg = App.svg;
  const BR = '#3a2414';
  const easeOutBack = u => 1 + 2.4 * Math.pow(u - 1, 3) + 1.4 * Math.pow(u - 1, 2);

  /* Chapter 1 (lighting), in the order it's played: 1.1 Toolbox, 1.2 Pull
     Chain, 1.3 Flip the Switch (internal id 1), ... 1.7 Stairway Lights (id 2).
     The two first jobs have no wall switch at all. */
  /* 1.1 and 1.2 are puzzles, not tutorials: the work order states the goal and
     nothing else. The job starts LIVE, the way real ones do; safety is taught by
     consequences (a shock, the Inspector's write-up, the punch card), and the
     Hint button escalates on whatever is actually wrong: a nudge, a clearer
     hint, then the rule. */
  const SAFETY_HINTS = [
    'Those wires are LIVE right now. What should happen before anybody puts a hand in there?',
    'Circuit 1\'s breaker is in the panel on the left. Flip it OFF (click it, or press B) before you touch a thing.',
    'Rule: kill the power before you work. A breaker doesn\'t trip when a PERSON gets shocked: it protects the wire, not you. The tester in the toolbox shows what\'s live, if you want to look.',
  ];
  const LEVEL11 = {
    id: 11, num: '1.1', screen: 'lvl11', store: 'circuitPanic.level11', name: 'Toolbox', goal: 'light', par: 3, requireGround: true, guide: true, safety: true, safetyFails: true, colorCode: true, startsLive: true, toolbox: true, noRed: true,
    form: 'Form 1-TB', next: 'lvl12', nextName: '1.2 Pull Chain', plate: 'THE TOOLBOX',
    objective: 'Install this lampholder on circuit 1. Make it safe.',
    components: [{ id: 'P', type: 'source' }, { id: 'L1', type: 'fixture' }],
    names: {
      'P.hot': 'the panel HOT', 'P.neu': 'the panel NEUTRAL bar', 'P.gnd': 'the panel GROUND bar',
      'L1.brass': 'the lampholder\'s BRASS screw', 'L1.silver': 'the lampholder\'s SILVER screw', 'L1.g': 'the fixture box\'s green GROUND screw',
    },
    winText: 'Power killed before you touched a thing. Black hot on brass, white neutral on silver, green ground on the box. That\'s the whole toolbox.',
    hintSets: {
      safety: SAFETY_HINTS,
      hot: ['Three conductors, three screws on me. Which of my screws is the odd colour out?', 'My BRASS screw is the one for the hot. The shiny silver one is on my screw-shell side.', 'Rule: the hot (black) lands on BRASS, the neutral (white) on SILVER, the ground (green or bare) on the green screw.'],
      neutral: ['Electricity goes out AND comes home. What\'s bringing it home?', 'The way home starts at the panel\'s NEUTRAL bar.', 'Rule: the neutral (white) runs from the NEUTRAL bar to my SILVER screw.'],
      polarity: ['I light... but is the part your fingers touch changing a bulb safe?', 'My screw shell is on the SILVER side. What\'s landed there?', 'Rule: hot to BRASS, neutral to SILVER. Reversed, the shell is live whenever the breaker is ON.'],
      ground: ['If something went wrong inside my metal box, where would it go?', 'A metal box needs its own path back to the panel\'s GROUND bar.', 'Rule: green (or bare) from the GROUND bar to the box\'s green screw. It carries no current unless something\'s wrong.'],
      short: ['Something runs straight from the push to the way home, with nothing in between.', 'Look for a wire joining the hot to the neutral or the ground without going through me.', 'Rule: hot and neutral only ever meet THROUGH the load. Hot straight to neutral or ground is a short.'],
      color: ['The next electrician can\'t see voltage. What does he go by?', 'Check each wire\'s colour against the job it\'s doing.', 'Rule: black (or red) is hot, white is neutral, green or bare is ground.'],
      done: ['Looks finished? There\'s only one way to find out.', 'Breaker ON and watch me. Then call the Inspector.', 'The Inspector checks every screw. Call him when you\'re sure.'],
    },
  };
  const LEVEL12 = {
    id: 12, num: '1.2', screen: 'lvl12', store: 'circuitPanic.level12', name: 'Pull Chain', goal: 'switch', par: 3, requireGround: true, chain: true, safety: true, colorCode: true, startsLive: true, toolbox: true, noRed: true,
    form: 'Form 1-PC', next: 'level', nextName: '1.3 Flip the Switch', plate: 'THE PULL CHAIN',
    objective: 'Hang the pull-chain light on circuit 1. The chain should work it. Make it safe.',
    components: [{ id: 'P', type: 'source' }, { id: 'L1', type: 'pullchain' }],
    names: {
      'P.hot': 'the panel HOT', 'P.neu': 'the panel NEUTRAL bar', 'P.gnd': 'the panel GROUND bar',
      'L1.brass': 'the lampholder\'s BRASS screw', 'L1.silver': 'the lampholder\'s SILVER screw', 'L1.g': 'the fixture box\'s green GROUND screw',
    },
    winText: 'Out on the hot, through the filament, home on the neutral: one complete loop, and the chain opens and closes it on the hot side. Box grounded. Textbook.',
    hintSets: {
      safety: SAFETY_HINTS,
      hot: ['Pull the chain all you like: nothing happens without a complete path.', 'Out from the panel HOT, through me, and home to the NEUTRAL bar. Where\'s the way OUT?', 'Rule: the hot goes to my BRASS screw. The chain switches it inside me.'],
      neutral: ['I\'ve got a way in. Have I got a way home?', 'Out from the panel HOT, through me, and home to the NEUTRAL bar. Where\'s your gap?', 'Rule: the neutral runs from my SILVER screw back to the NEUTRAL bar. That closes the loop.'],
      polarity: ['I light... but is the part your fingers touch changing a bulb safe?', 'My screw shell is on the SILVER side. What\'s on it right now?', 'Rule: hot to BRASS, neutral to SILVER. Reversed, the shell is live whenever the breaker is ON, chain or no chain.'],
      ground: ['If something went wrong inside my metal box, where would it go?', 'A metal box needs its own path back to the panel\'s GROUND bar.', 'Rule: green (or bare) from the GROUND bar to the box\'s green screw.'],
      short: ['Something runs straight from the push to the way home, with nothing in between.', 'Look for a wire joining the hot to the neutral or the ground without going through me.', 'Rule: hot and neutral only ever meet THROUGH the load.'],
      color: ['The next electrician can\'t see voltage. What does he go by?', 'Check each wire\'s colour against the job it\'s doing.', 'Rule: black (or red) is hot, white is neutral, green or bare is ground.'],
      done: ['Looks finished? There\'s only one way to find out.', 'Breaker ON, then give my chain a tug (click it, or press S).', 'The Inspector checks every screw. Call him when you\'re sure.'],
    },
  };
  /* which hint topic each of the Inspector's fault codes belongs to */
  const HINT_TOPIC = {
    'short': 'short', 'ground-fault': 'short', 'overvolt': 'short', 'no-hot': 'hot', 'switch-arrangement': 'hot', 'bypass': 'bypass', 'inverted': 'bypass', 'neutral-missing': 'neutral', 'reversed': 'polarity',
    'hot-enclosure': 'ground', 'no-ground': 'ground', 'ground-as-neutral': 'ground', 'neutral-ground-bond': 'ground', 'wrong-color': 'color', 'switched-neutral': 'swneutral',
    'series': 'series', 'pair': 'pair', 'hot-on-traveler': 'threeway', 'traveler-on-common': 'threeway', 'not-3way': 'threeway', 'not-multiway': 'threeway', 'fourway-pairs': 'fourway',
    'no-switch-neutral': 'boxneutral', 'cable': 'cable',
  };
  /* the hints any job falls back on for a topic it doesn't word for itself:
     a nudge, a clearer hint, then the rule (never the whole answer) */
  const GENERIC_HINTS = {
    hot: ['Where does the power come IN on this job? Start there.', 'Follow the hot: from where it comes in, through the switch, to the light\'s BRASS screw. Where does it stop?', 'Rule: the hot goes through the switch to the BRASS screw. Hot and neutral only ever meet through the load.'],
    neutral: ['Electricity goes out AND comes home. What\'s bringing it home?', 'The way home starts at the light\'s SILVER screw.', 'Rule: the neutral (white) runs straight to the light\'s SILVER screw. It never goes through a switch.'],
    polarity: ['It lights... but is the part your fingers touch changing a bulb safe?', 'The screw shell is on the SILVER side. What\'s landed there?', 'Rule: switched hot to BRASS, neutral to SILVER.'],
    ground: ['If something went wrong inside a metal box, where would it go?', 'Every metal box needs its own path back to ground.', 'Rule: the bare (or green) ground reaches every metal box\'s green screw. It carries no current unless something\'s wrong.'],
    short: ['Something runs straight from the push to the way home, with nothing in between.', 'Look for a hot joined to a neutral or a ground without going through a light.', 'Rule: hot and neutral only ever meet THROUGH the load. Hot straight to neutral or ground is a short.'],
    color: ['The next electrician can\'t see voltage. What does he go by?', 'Check each wire\'s colour against the job it\'s doing.', 'Rule: black (or red) is hot, white is neutral, green or bare is ground. A white used as a hot is re-marked with black tape.'],
    swneutral: ['The switch is supposed to break the hot. What is it breaking?', 'With the switch OFF, is the socket still live?', 'Rule: a switch goes in the HOT. The neutral runs straight to the SILVER screw.'],
    bypass: ['Flip the switch. Does the light even notice?', 'Something reaches the light\'s BRASS screw without going through a switch.', 'Rule: the ONLY way to the BRASS screw is through the switch.'],
    series: ['Both lit... but look how dim. Who\'s sharing what?', 'One after the other, the bulbs split the 120 volts. Each one wants its own.', 'Rule: lights go in PARALLEL: each one from the switched hot to the neutral on its own.'],
    pair: ['Flip one switch. Which light answers?', 'Each light should answer to ONE switch, and only that one.', 'Rule: one switched hot per light, from its own switch to its own BRASS screw.'],
    threeway: ['Flip each switch from every position. Which flip does nothing?', 'Dark screw = COMMON, brass screws = travelers. Hot goes to a COMMON; the travelers run between the switches.', 'Rule: hot to one COMMON, the far COMMON feeds the light, travelers from switch to switch.'],
    fourway: ['A 4-way has two PAIRS of screws. Where did each side\'s travelers land?', 'Both travelers from one 3-way go on ONE pair of the 4-way. The other pair goes on to the other 3-way.', 'Rule: a 4-way never splits a pair: one side in on one pair, out on the other pair.'],
    boxneutral: ['It works. Will it still work when somebody puts in a smart switch?', 'New switch locations need something brought into the box besides the hots.', 'Rule (NEC 404.2(C)): bring the neutral into a switch box and cap it. With several switches for the same lights, one box will do.'],
    cable: ['Count what\'s in that cable before you use it.', 'Each conductor in a cable can only be used once, and it only goes where the cable goes.', 'Rule: a 14/2 has a black, a white and a bare. A white used as a hot gets taped, and only as the supply to a switch or a traveler.'],
    done: ['Looks finished? There\'s only one way to find out.', 'Breaker ON and try every switch. Then call the Inspector.', 'The Inspector checks every connection. Call him when you\'re sure.'],
  };
  /* 1.4 Switch Loop: the power comes in at the light, and a 2-wire cable loops
     down to the switch and back. Framed as an OLD house, on purpose: since the
     2011 Code (NEC 404.2(C)) a NEW switch loop is run in 14/3 so the switch box
     gets a neutral; an existing 2-wire loop stays when you only replace the
     light. In a 2-wire loop the white has to carry a hot, so it's re-marked
     with black tape, and NEC 200.7(C)(1) lets it be the supply TO the switch,
     never the switched return to the light. */
  const LEVEL14 = {
    id: 14, num: '1.4', screen: 'lvl14', store: 'circuitPanic.level14', name: 'Switch Loop', goal: 'switch', par: 5, requireGround: true, colorCode: true,
    stage: 'loop', noRed: true, taped: true, fuseX: 262,
    form: 'Form 1-SL', next: 'lvl15', nextName: '1.5 Two Lights, One Switch',
    objective: 'Old house: the power comes in at the light, and an old 2-wire switch loop runs down to the switch. Make the switch work the light, and make it right.',
    components: [{ id: 'P', type: 'source' }, { id: 'S1', type: 'sp' }, { id: 'L1', type: 'fixture' }],
    boxes: { 'P.hot': 'FX', 'P.neu': 'FX', 'P.gnd': 'FX', 'L1.brass': 'FX', 'L1.silver': 'FX', 'L1.g': 'FX', 'S1.a': 'SB', 'S1.b': 'SB', 'S1.g': 'SB' },
    boxNames: { FX: 'the light\'s box', SB: 'the switch box' },
    cables: [{ id: 'loop', a: 'FX', b: 'SB', type: 'an old 14/2', name: 'switch loop', conductors: ['black', 'white'] }],
    names: {
      'P.hot': 'the feed\'s BLACK (the power coming in)', 'P.neu': 'the feed\'s WHITE', 'P.gnd': 'the feed\'s bare GROUND',
      'S1.a': 'the switch\'s left BRASS screw', 'S1.b': 'the switch\'s right BRASS screw', 'S1.g': 'the switch box\'s green GROUND screw',
      'L1.brass': 'the light\'s BRASS screw', 'L1.silver': 'the light\'s SILVER screw', 'L1.g': 'the light box\'s green GROUND screw',
    },
    winText: 'The feed\'s black spliced to the loop\'s white, taped, as the supply DOWN to the switch; the loop\'s black brings the switched hot BACK to the brass; the feed\'s white straight to silver; both boxes grounded. That\'s a switch loop. (Run a new one today in 14/3, so the switch box gets a neutral.)',
    punch: { fewest: 'No spare wire (five will do)', colors: 'Right colours: taped white only as the supply to the switch, white neutral, green ground' },
    intro: ['The power comes in up here at MY box this time. The switch is way down the end of that old loop.', 'Clean board. Power still comes in at my box.'],
    hintSets: {
      hot: ['The power comes in at MY box this time. How does it get down to the switch, and back?', 'It\'s a loop: one conductor takes the hot DOWN to the switch, the other brings it BACK, switched, to my BRASS screw.', 'Rule: the feed\'s black is spliced to the loop conductor going TO the switch; the conductor coming BACK from the switch lands on my BRASS screw.'],
      neutral: ['Out and back is only half of it. Where does the current go home?', 'The neutral never goes near the switch. It\'s right here in my box.', 'Rule: the feed\'s white goes straight to my SILVER screw.'],
      ground: ['Two metal boxes. Are they BOTH safe if something goes wrong?', 'The feed\'s bare lands on my box\'s green screw, and the loop\'s bare carries it on down to the switch box.', 'Rule: every metal box gets the ground: the feed\'s bare to the green screw here, the loop\'s bare to the green screw at the switch.'],
      cable: ['How many conductors are in that old loop? Count them.', 'The loop is a 2-wire cable: one black, one white, one bare. Both hots have to fit in it.', 'Rule (NEC 200.7(C)): in a switch loop the WHITE may carry the hot TO the switch, re-marked with black tape. Never the leg coming back to the light.'],
      color: ['A white wire carrying the hot... how would the next electrician know?', 'Any white used as a hot gets re-marked: black tape, the taped-white wire on your bench.', 'Rule: a taped white may be the supply TO a switch, never the switched return to the light. That one\'s the black.'],
    },
  };
  /* 1.5 Two Lights, One Switch: series against parallel. Two incandescent
     lamps one after the other on 120 V split the voltage (about 60 V each)
     and give about a tenth of their light, a dull orange glow (circuit.js
     evaluate: bright and light, the lamp law). Side by side, each gets 120 V. */
  const LEVEL15 = {
    id: 15, num: '1.5', screen: 'lvl15', store: 'circuitPanic.level15', name: 'Two Lights, One Switch', goal: 'switch', par: 6, requireGround: true, colorCode: true,
    stage: 'two', fuseX: 262,
    form: 'Form 1-TL', next: 'lvl16', nextName: '1.6 Two Switches, Two Lights',
    objective: 'Two lights, one switch: the switch turns BOTH lights fully on and off. Ground the switch box.',
    components: [{ id: 'P', type: 'source' }, { id: 'S1', type: 'sp' }, { id: 'L1', type: 'bulb' }, { id: 'L2', type: 'bulb' }],
    names: {
      'P.hot': 'the panel HOT', 'P.neu': 'the panel NEUTRAL bar', 'P.gnd': 'the panel GROUND bar',
      'S1.a': 'the switch\'s left BRASS screw', 'S1.b': 'the switch\'s right BRASS screw', 'S1.g': 'the switch box\'s green GROUND screw',
      'L1.brass': 'the first light\'s BRASS screw', 'L1.silver': 'the first light\'s SILVER screw', 'L2.brass': 'the second light\'s BRASS screw', 'L2.silver': 'the second light\'s SILVER screw',
    },
    winText: 'Each light has its own path from the switched hot to the neutral, so each gets the full 120 volts: that\'s PARALLEL, the way every light in a house is wired. In series they\'d split it, about 60 volts each, and glow a dull orange.',
    punch: { fewest: 'No spare wire (six will do)', colors: 'Right colours: white neutral, green ground, hot never white or green' },
    intro: ['Two of us on one switch this time. Don\'t short-change anybody.', 'Clean board. Both of us, one switch.'],
    hintSets: {
      series: ['You lit us both... but look how DIM. Who\'s sharing what?', 'One after the other, we split the 120 volts: about 60 each, and a filament on 60 gives a tenth of its light.', 'Rule: lights go in PARALLEL. Each one gets its own path: switched hot to its BRASS, its SILVER straight back to the neutral.'],
      hot: ['Two lights, and the power has to reach both of us THROUGH the switch.', 'Out of the switch, the switched hot has to get to BOTH our BRASS screws.', 'Rule: panel HOT to the switch; from the switch\'s other screw, to each light\'s BRASS (a pigtail where two wires share a screw).'],
      neutral: ['Each of us needs a way home. Have we both got one?', 'The way home is the NEUTRAL bar, from EACH light\'s SILVER screw.', 'Rule: each light\'s SILVER screw goes back to the panel NEUTRAL. Never through the other light.'],
    },
  };
  /* 1.6 Two Switches, Two Lights: one feed into a 2-gang box, a pigtail off
     the feed's black to BOTH switches, the neutrals spliced, the grounds bonded
     to the box. The box is Sparky Junction (owner-approved character): every
     splice happens in his belly. A 14/2 runs from him to each light, so each
     light's switched hot, neutral and ground ride in the same cable (NEC
     300.3(B)); the switches ground through his steel box (404.9(B)). The feed
     comes into the switch box, so the neutral is there (404.2(C)). */
  const LEVEL16 = {
    id: 16, num: '1.6', screen: 'lvl16', store: 'circuitPanic.level16', name: 'Two Switches, Two Lights', goal: 'pair', par: 9, requireGround: true, colorCode: true,
    stage: 'sparky', noRed: true, fuseX: 262, hintVoice: 'sparky', introVoice: 'sparky', swHeads: ['Left', 'Right'],
    form: 'Form 1-TS', next: 'level2', nextName: '1.7 Stairway Lights',
    objective: 'Two lights, two switches: each switch runs its own light. One feed comes into the switch box. Make it up right, and ground everything metal.',
    components: [{ id: 'P', type: 'source' }, { id: 'J', type: 'box' }, { id: 'S1', type: 'sp' }, { id: 'S2', type: 'sp' }, { id: 'L1', type: 'fixture' }, { id: 'L2', type: 'fixture' }],
    selfGrounded: ['S1.g', 'S2.g'],
    boxes: { 'P.hot': 'J', 'P.neu': 'J', 'P.gnd': 'J', 'J.g': 'J', 'S1.a': 'J', 'S1.b': 'J', 'S2.a': 'J', 'S2.b': 'J', 'L1.brass': 'B1', 'L1.silver': 'B1', 'L1.g': 'B1', 'L2.brass': 'B2', 'L2.silver': 'B2', 'L2.g': 'B2' },
    boxNames: { J: 'Sparky\'s box', B1: 'the first light\'s box', B2: 'the second light\'s box' },
    cables: [{ id: 'c1', a: 'J', b: 'B1', type: 'a 14/2', name: 'cable', conductors: ['black', 'white'] }, { id: 'c2', a: 'J', b: 'B2', type: 'a 14/2', name: 'cable', conductors: ['black', 'white'] }],
    names: {
      'P.hot': 'the feed\'s BLACK (the power coming in)', 'P.neu': 'the feed\'s WHITE', 'P.gnd': 'the feed\'s bare GROUND', 'J.g': 'Sparky\'s green GROUND screw',
      'S1.a': 'the left switch\'s top BRASS screw', 'S1.b': 'the left switch\'s bottom BRASS screw', 'S2.a': 'the right switch\'s top BRASS screw', 'S2.b': 'the right switch\'s bottom BRASS screw',
      'L1.brass': 'the first light\'s BRASS screw', 'L1.silver': 'the first light\'s SILVER screw', 'L1.g': 'the first light box\'s green GROUND screw',
      'L2.brass': 'the second light\'s BRASS screw', 'L2.silver': 'the second light\'s SILVER screw', 'L2.g': 'the second light box\'s green GROUND screw',
    },
    winText: 'One feed in. Its black pigtailed to BOTH switches, each switch\'s other screw out to its own light\'s brass, the whites spliced together with the feed\'s, and every ground bonded to the box. Each light rides in its own cable with its own neutral and ground. Two circuits\' worth of lights, one splice box. Sparky approves. Barely.',
    punch: { fewest: 'No spare wire (nine will do)', colors: 'Right colours: white neutral, green ground, hot never white or green' },
    intro: ['Ahem. MY box. Every splice in it gets a wire nut, and every nut goes on clockwise. Carry on.', 'Back again. Clean box. Don\'t make me regret it.'],
    hintSets: {
      hot: ['One black comes in. Two switches want it.', 'Splice the feed\'s black to BOTH switches: a pigtail, under one nut, in my box.', 'Rule: the hot is spliced to each switch\'s supply screw. Each switch\'s other screw carries ITS light\'s switched hot.'],
      pair: ['Flip each switch. Does each light answer to exactly one of them?', 'One switch, one light: a switch\'s second screw goes to ONE light\'s brass.', 'Rule: each light gets its own switched hot from its own switch. Nothing else switches it.'],
      neutral: ['Two lights, one way home. Where does it start?', 'The feed\'s white, spliced in MY box with each light\'s white.', 'Rule: the neutrals are spliced together in the box: the feed\'s white to each light\'s SILVER screw.'],
      ground: ['Three metal boxes on this job. Count the grounds.', 'The feed\'s bare goes to my green screw, and a bare runs out to each light\'s box too. The switches ground through me.', 'Rule: every ground in a box is bonded together and to the box\'s green screw; each light box gets one too.'],
      cable: ['A wire from one light straight to the other? Through what?', 'The only cables run from MY box out to each light. Everything comes home to me.', 'Rule: each 14/2 to a light carries that light\'s switched hot (black), its neutral (white) and a bare ground. Splices happen in a box, never in the air.'],
    },
  };
  const LEVEL1 = {
    id: 1, num: '1.3', screen: 'level', store: 'circuitPanic.level1', name: 'Flip the Switch', goal: 'switch', par: 4, requireGround: true,
    form: 'Form 1-SP', next: 'lvl14', nextName: '1.4 Switch Loop', plate: 'PRACTICE BOARD No. 1',
    objective: 'Wire the panel, switch and bulb so the switch turns the bulb ON and OFF, and ground the switch box.',
    components: [{ id: 'P', type: 'source' }, { id: 'S1', type: 'sp' }, { id: 'L1', type: 'bulb' }],
    names: {
      'P.hot': 'the panel HOT', 'P.neu': 'the panel NEUTRAL bar', 'P.gnd': 'the panel GROUND bar',
      'S1.a': 'the switch\'s left brass screw', 'S1.b': 'the switch\'s right brass screw', 'S1.g': 'the switch box\'s green GROUND screw',
      'L1.brass': 'the lampholder\'s BRASS screw', 'L1.silver': 'the lampholder\'s SILVER screw',
    },
    winText: 'The switch breaks the hot, the hot lands on brass, the neutral comes home on silver, and the box is grounded. Textbook.',
    hints: [
      'Power leaves the panel on the HOT screw and comes home on the NEUTRAL bar. Everything in between is the path.',
      'A switch is a gate in the HOT wire. Run a wire from the panel\'s HOT to one of my switch buddy\'s screws.',
      'From the switch\'s other screw, go to my BRASS screw. Brass is for hot!',
      'My SILVER screw goes back to the panel\'s NEUTRAL bar. That closes the loop.',
      'Don\'t forget the ground: a GREEN wire from the panel\'s GROUND bar to the green screw on the switch box. It carries no current unless something goes wrong.',
      'Then flip the breaker ON and try the switch. Gently. Please.',
    ],
  };
  const LEVEL2 = {
    id: 2, num: '1.7', screen: 'level2', store: 'circuitPanic.level2', name: 'Stairway Lights', goal: 'threeway', par: 8, requireGround: true, wide: true, swap: true, bonus: true, taped: true,
    form: 'Form 2-3W',
    objective: 'Wire the stair light so EITHER 3-way switch turns it on and off. Ground both switch boxes and the fixture box.',
    components: [{ id: 'P', type: 'source' }, { id: 'S1', type: 'threeway' }, { id: 'S2', type: 'threeway' }, { id: 'L1', type: 'fixture' }],
    switchNames: { S1: 'the bottom switch', S2: 'the top switch' },
    names: {
      'P.hot': 'the panel HOT', 'P.neu': 'the panel NEUTRAL bar', 'P.gnd': 'the panel GROUND bar',
      'S1.com': 'the bottom switch\'s dark COMMON screw', 'S1.t1': 'the bottom switch\'s left traveler screw', 'S1.t2': 'the bottom switch\'s right traveler screw', 'S1.g': 'the bottom box\'s green GROUND screw',
      'S2.com': 'the top switch\'s dark COMMON screw', 'S2.t1': 'the top switch\'s left traveler screw', 'S2.t2': 'the top switch\'s right traveler screw', 'S2.g': 'the top box\'s green GROUND screw',
      'L1.brass': 'the stair light\'s BRASS screw', 'L1.silver': 'the stair light\'s SILVER screw', 'L1.g': 'the fixture box\'s green GROUND screw',
    },
    winText: 'Hot in on one COMMON, the travelers brass-to-brass, the other COMMON feeding the brass, the neutral straight to silver, and every box grounded. Either switch works the light from any position. Textbook.',
    hints: [
      'Two switches, one light! Each 3-way has a dark COMMON screw and two brass TRAVELER screws. No ON or OFF on them, see?',
      'The panel HOT goes to the COMMON of one 3-way. The dark screw. Black wire.',
      'Now the travelers: brass to brass between the two switches. On the job that\'s a 14/3 cable, and its RED and BLACK are the travelers. Which brass goes to which doesn\'t matter.',
      'The OTHER switch\'s COMMON feeds my BRASS screw. That\'s the switched leg.',
      'The neutral never goes through a switch: WHITE from the panel NEUTRAL straight to my SILVER screw.',
      'Ground every metal box: GREEN from the panel GROUND bar to one box, box to box, and on to my fixture box. Pigtail the doubled screws.',
      'A white wire in a cable may be a traveler only if you re-mark it with black tape. Never tape a real neutral, and never use a taped white as the leg to the light.',
      'Then breaker ON and try BOTH switches. Each one should flip me on and off, whatever the other one is doing.',
    ],
  };
  const COLOR_NAME = { '#1c1c1e': 'black', '#f1ead8': 'white', '#c7322b': 'red', '#3f8a4c': 'green', '#ebe2cc': 'taped' };
  const TAPED = '#ebe2cc';
  /* touch screens get bigger targets and a stronger pull toward screws */
  const TOUCH = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || 'ontouchstart' in window;
  const HIT0 = TOUCH ? 44 : 30, SNAP0 = TOUCH ? 72 : 48;

  App.defs.insertAdjacentHTML('beforeend', `
    <linearGradient id="gPly" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e6c38c"/><stop offset=".55" stop-color="#d6aa6e"/><stop offset="1" stop-color="#b98a55"/></linearGradient>
    <linearGradient id="gCab" x1="0" x2="1"><stop offset="0" stop-color="#6f7376"/><stop offset=".28" stop-color="#b4b8bb"/><stop offset=".62" stop-color="#9a9ea1"/><stop offset="1" stop-color="#606467"/></linearGradient>
    <linearGradient id="gCabIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16171a"/><stop offset=".22" stop-color="#26282c"/><stop offset="1" stop-color="#34373c"/></linearGradient>
    <linearGradient id="gDoor" x1="0" x2="1"><stop offset="0" stop-color="#55595c"/><stop offset="1" stop-color="#8d9194"/></linearGradient>
    <linearGradient id="gGalv" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9fa4a8"/><stop offset=".42" stop-color="#d9dcde"/><stop offset="1" stop-color="#767b7f"/></linearGradient>
    <linearGradient id="gBakelite" x1="0" x2="1"><stop offset="0" stop-color="#0e0e10"/><stop offset=".35" stop-color="#303036"/><stop offset="1" stop-color="#0a0a0c"/></linearGradient>
    <linearGradient id="gHandle" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdf4de"/><stop offset=".55" stop-color="#e6d6b2"/><stop offset="1" stop-color="#b7a178"/></linearGradient>
    <radialGradient id="gJewelOn" cx="38%" cy="32%" r="72%"><stop offset="0" stop-color="#fff4cc"/><stop offset=".32" stop-color="#ff7a48"/><stop offset="1" stop-color="#b0160b"/></radialGradient>
    <radialGradient id="gJewelOff" cx="38%" cy="32%" r="72%"><stop offset="0" stop-color="#8e4d42"/><stop offset=".5" stop-color="#4a1712"/><stop offset="1" stop-color="#220705"/></radialGradient>
    <radialGradient id="gRedGlow"><stop offset="0" stop-color="#ff9a6a" stop-opacity=".85"/><stop offset=".45" stop-color="#ff6a3a" stop-opacity=".3"/><stop offset="1" stop-color="#ff5a2a" stop-opacity="0"/></radialGradient>
    <radialGradient id="gNeon"><stop offset="0" stop-color="#ffd0a0" stop-opacity=".95"/><stop offset=".4" stop-color="#ff7a2a" stop-opacity=".45"/><stop offset="1" stop-color="#ff5a10" stop-opacity="0"/></radialGradient>
    <radialGradient id="gPorc" cx="38%" cy="28%" r="85%"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#eee7d8"/><stop offset="1" stop-color="#b4ab98"/></radialGradient>
    <radialGradient id="gScrewBrass" cx="35%" cy="32%"><stop offset="0" stop-color="#fff3b8"/><stop offset=".5" stop-color="#d9a93e"/><stop offset="1" stop-color="#6e4a10"/></radialGradient>
    <radialGradient id="gScrewSilver" cx="35%" cy="32%"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#b9b6ae"/><stop offset="1" stop-color="#55524c"/></radialGradient>
    <radialGradient id="gScrewDark" cx="35%" cy="32%"><stop offset="0" stop-color="#9a9a9a"/><stop offset=".45" stop-color="#3a3a3a"/><stop offset="1" stop-color="#0e0e0e"/></radialGradient>
    <radialGradient id="gScrewGreen" cx="35%" cy="32%"><stop offset="0" stop-color="#c8f0c0"/><stop offset=".5" stop-color="#3f9a4a"/><stop offset="1" stop-color="#1a4a22"/></radialGradient>
    <linearGradient id="gGndBar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8c79a"/><stop offset=".5" stop-color="#c98a4e"/><stop offset="1" stop-color="#8a5226"/></linearGradient>
    <filter id="xray" x="-10%" y="-10%" width="120%" height="120%"><feColorMatrix type="matrix" values="-1 0 0 0 1  0 -1 0 0 1  0 0 -1 0 .9  0 0 0 1 0"/></filter>
    <linearGradient id="gNut" x1="0" x2="1"><stop offset="0" stop-color="#b85a10"/><stop offset=".4" stop-color="#ffab4a"/><stop offset="1" stop-color="#a84a08"/></linearGradient>
    <linearGradient id="gPen" x1="0" x2="1"><stop offset="0" stop-color="#b9862c"/><stop offset=".4" stop-color="#ffe6a0"/><stop offset="1" stop-color="#a8761c"/></linearGradient>
    <radialGradient id="gRoomDark" cx="50%" cy="40%" r="72%"><stop offset=".5" stop-color="#0a0503" stop-opacity="0"/><stop offset="1" stop-color="#0a0503" stop-opacity=".62"/></radialGradient>
    <radialGradient id="gSoot"><stop offset="0" stop-color="#0d0806" stop-opacity=".9"/><stop offset=".55" stop-color="#1a0f0a" stop-opacity=".45"/><stop offset="1" stop-color="#1a0f0a" stop-opacity="0"/></radialGradient>
    <radialGradient id="gWarm"><stop offset="0" stop-color="#ffe49a" stop-opacity=".75"/><stop offset=".4" stop-color="#ffc85a" stop-opacity=".3"/><stop offset="1" stop-color="#ff9a20" stop-opacity="0"/></radialGradient>
    <pattern id="spangle" width="46" height="46" patternUnits="userSpaceOnUse"><path d="M4,6 L16,2 L22,12 L10,18 Z M26,24 L40,22 L42,36 L30,40 Z M6,30 L14,28 L18,40 L4,42 Z" fill="#ffffff" opacity=".16"/><path d="M28,4 L38,8 L34,16 L24,14 Z M18,20 L26,22 L22,30 Z" fill="#000000" opacity=".07"/></pattern>
    <clipPath id="phClip"><rect x="-40" y="-40" width="1400" height="484"/><rect x="-40" y="-40" width="1190" height="800"/><path d="M1168,462 L1186,448 L1204,456 L1222,444 L1240,460 L1250,480 L1242,504 L1222,516 L1202,510 L1182,516 L1166,500 L1162,480 Z"/></clipPath>
    <clipPath id="phClipW"><rect x="-40" y="-40" width="1600" height="484"/><rect x="-40" y="-40" width="1318" height="900"/><path transform="translate(128,0)" d="M1168,462 L1186,448 L1204,456 L1222,444 L1240,460 L1250,480 L1242,504 L1222,516 L1202,510 L1182,516 L1166,500 L1162,480 Z"/></clipPath>
    <clipPath id="phClip2"><rect x="-40" y="-40" width="1400" height="298"/><rect x="-40" y="-40" width="336" height="800"/><rect x="376" y="-40" width="1000" height="800"/><path d="M316,232 L328,222 L342,229 L356,222 L362,244 L356,264 L362,284 L348,294 L332,288 L316,294 L308,272 L312,250 Z"/></clipPath>
  `);

  /* ======================================================================
     buildLevel(LEVEL): the whole scene and screen for one level. Level 1 and
     Level 2 share everything except the practice board in the middle.
     ====================================================================== */
  function buildLevel(LEVEL) {
  const SCREEN = LEVEL.screen, ID = LEVEL.id;
  /* Level 2's camera sits a little further back so the whole stairway run fits
     one roomy picture: the world it shows is W x H. Tap targets are scaled back
     up so they stay the same size on screen. DX moves the right-hand strip of
     wall (the cable coil and the big hole) out to the new right edge. */
  const WIDE = !!LEVEL.wide;
  const KZ = WIDE ? 0.9 : 1, W = 1280 / KZ, H = 720 / KZ, DX = WIDE ? 128 : 0;
  const HIT = HIT0 / KZ, SNAP = SNAP0 / KZ;
  const CLIP1 = WIDE ? 'url(#phClipW)' : 'url(#phClip)';
  const LX = LEVEL.lx || (WIDE ? 690 : 640);
  const OFFX = W + 90;
  /* the camera: a gentle push-in when the light comes on, a punch-in on a
     short. It holds perfectly still while a wire, a strip, a wrap or the tester
     is in hand, and toW() and the bubble layout always undo it, so a tap lands
     exactly where it looks. (cx, cy, x, y are in stage units, before KZ.) */
  const cam = { z: 1, x: 0, y: 0, cx: 640, cy: 360, pz: 1, pcx: 640, pcy: 360, until: -9, rate: 1.5, lit: false, nextPush: 0, lastShake: -9 };
  let dofW = null; /* the baked soft back wall (GFX.dof), made the first time it's wanted */
  const unCam = (x, y) => [((x - cam.cx - cam.x) / cam.z + cam.cx) / KZ, ((y - cam.cy - cam.y) / cam.z + cam.cy) / KZ];
  /* (measured from the frame, which the camera never moves) */
  const toW = e => { const r = App.frame.getBoundingClientRect(); return unCam((e.clientX - r.left) * 1280 / r.width, (e.clientY - r.top) * 720 / r.height); };
  const root = el('g', { id: 'levelRoot' + ID, style: 'display:none' }, svg);
  if (KZ !== 1) root.setAttribute('transform', `scale(${KZ})`);
  const shakeG = el('g', {}, root);
  const L = {};
  /* the practice board's outline: Level 2's stairway mock-up is a little bigger */
  const BD = !WIDE ? { x0: 360, y0: 118, x1: 1130, y1: 512 } : { x0: 372, y0: 112, x1: 1276, y1: 540 };
  /* 1.1 and 1.2 have no wall switch; 1.2's switch is the chain on the lampholder */
  const CHAIN = !!LEVEL.chain, GUIDE = !!LEVEL.guide;
  /* depth, back to front: the wall and its hardware, the cables, the characters
     who live on the board, the screw heads, then anything standing or reaching in
     the room in front of the wall (the Phantom, the Inspector on the bench), then
     the player's own hand-held tools, the light and the effects */
  /* (the screw heads sit under the characters, who always stand in front of
     wall hardware; the screws' rings and tap targets stay on top) */
  ['wall', 'board', 'bench', 'parts', 'holder', 'tags', 'soot', 'wshadow', 'plates', 'wires', 'nuts', 'heads', 'cast', 'terms', 'phantom', 'fore', 'drag', 'ui', 'lamp', 'light', 'dark', 'fx', 'bubble', 'flash'].forEach(n => { L[n] = el('g', {}, shakeG); });
  ['board', 'bench', 'parts', 'holder', 'tags'].forEach(n => L[n].setAttribute('filter', 'url(#inkOnly)'));
  L.phantom.setAttribute('clip-path', CLIP1);
  /* light, effects, the blackout and the talk never swallow clicks */
  ['soot', 'wshadow', 'lamp', 'light', 'dark', 'fx', 'bubble', 'flash'].forEach(n => L[n].setAttribute('pointer-events', 'none'));

  /* scene clock, advanced by update() */
  let now = 0;
  const ev = { haul0: -9, flash: -9, shake: -9, black0: -9, black1: -9, arc: -9, arcA: null, arcB: null, pilot: -9, soot: -9, sootOn: false, cord0: -9, cord1: -9, kick: -9, tripT: -9, dip: -9 };
  const wait = s => new Promise(r => setTimeout(r, s * 1000));

  /* ---------- the workshop wall ---------- */
  el('rect', { x: -20, y: -20, width: W + 40, height: 620, fill: 'url(#gWallB)' }, L.wall);
  const planks = [];
  for (let x = 0; x <= W; x += 58) planks.push(`M${x},26 V600`);
  el('path', { d: planks.join(' '), stroke: '#2a180e', 'stroke-width': 2.5, opacity: 0.35 }, L.wall);
  for (let i = 0; i < 10; i++) el('ellipse', { cx: i % 2 ? rand(8, 50) : rand(W - 46, W - 8), cy: rand(60, 530), rx: rand(3, 6), ry: rand(6, 11), fill: 'none', stroke: '#2a180e', 'stroke-width': 1.5, opacity: 0.3 }, L.wall);
  /* (the painted pool is live, so the baked soft wall leaves it out: it's hidden
     whenever the GPU light is on anyway) */
  const lampPool = el('ellipse', { cx: LX, cy: 40, rx: 660 / KZ, ry: 620, fill: 'url(#gLampPool)', 'data-nobake': 1 }, L.wall);
  el('rect', { x: -20, y: -20, width: W + 40, height: 46, fill: '#2e1c10' }, L.wall);
  el('path', { d: `M-20,26 H${W + 20}`, stroke: INK, 'stroke-width': 4 }, L.wall);
  for (let x = 40; x < W; x += 160) el('rect', { x, y: -10, width: 26, height: 48, fill: '#3a2414', stroke: INK, 'stroke-width': 3 }, L.wall);
  el('rect', { x: BD.x0 + 20, y: BD.y0 + 20, width: BD.x1 - BD.x0 + 6, height: BD.y1 - BD.y0 + 2, rx: 10, fill: '#140904', opacity: 0.55, filter: 'url(#bigBlur)' }, L.wall);
  /* the right-hand strip of wall: a coil of spare cable on a nail, and a hole
     punched through the plaster low down, where something lives */
  const STRIP = el('g', { transform: `translate(${DX},0)` }, L.wall);
  const HOLE = { x: 1206 + DX, y: 486 };
  el('path', { d: 'M1168,462 L1186,448 L1204,456 L1222,444 L1240,460 L1250,480 L1242,504 L1222,516 L1202,510 L1182,516 L1166,500 L1162,480 Z', fill: 'url(#gHole)', stroke: INK, 'stroke-width': 4, 'stroke-linejoin': 'round' }, STRIP);
  el('path', { d: 'M1176,474 L1192,468 M1212,466 L1230,474 M1186,498 L1206,502', stroke: '#6a4a36', 'stroke-width': 3, opacity: 0.7 }, STRIP);
  el('path', { d: 'M1168,462 L1150,448 L1140,452 M1250,480 L1268,470 L1278,476 M1222,444 L1228,424 L1240,418 M1182,516 L1172,526', fill: 'none', stroke: '#2a180e', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, STRIP);
  for (const [cx, cy, r] of [[1160, 530, 5], [1178, 536, 3.5], [1246, 532, 4]]) el('path', { d: `M${cx - r},${cy} L${cx},${cy - r} L${cx + r * 1.2},${cy - r * 0.2} L${cx + r * 0.6},${cy + r * 0.5} Z`, fill: '#c9b28c', stroke: BR, 'stroke-width': 1.6 }, STRIP);
  /* and a second, smaller hole punched through right beside the panel, just
     about an arm's reach from the breaker */
  const HOLE2 = { x: 335, y: 262 };
  el('path', { d: 'M316,232 L328,222 L342,229 L356,222 L362,244 L356,264 L362,284 L348,294 L332,288 L316,294 L308,272 L312,250 Z', fill: 'url(#gHole)', stroke: INK, 'stroke-width': 4, 'stroke-linejoin': 'round' }, L.wall);
  el('path', { d: 'M322,246 L336,240 M332,276 L348,280', stroke: '#6a4a36', 'stroke-width': 2.5, opacity: 0.7 }, L.wall);
  el('path', { d: 'M328,222 L326,204 L334,196 M348,294 L352,312 M316,294 L310,306', fill: 'none', stroke: '#2a180e', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, L.wall);
  el('circle', { cx: 1206, cy: 176, r: 4, fill: '#9a9a9a', stroke: INK, 'stroke-width': 2 }, STRIP);
  for (let i = 0; i < 4; i++) {
    const rx = 34 - i * 2, ry = 58 - i * 3, cy = 238 + i * 3;
    el('ellipse', { cx: 1206 + i * 1.5, cy, rx, ry, fill: 'none', stroke: INK, 'stroke-width': 9 }, STRIP);
    el('ellipse', { cx: 1206 + i * 1.5, cy, rx, ry, fill: 'none', stroke: '#2c2c31', 'stroke-width': 5.5 }, STRIP);
  }
  el('path', { d: 'M1178,214 Q1190,190 1210,188', fill: 'none', stroke: '#9696a0', 'stroke-width': 2, opacity: 0.7 }, STRIP);
  el('path', { d: 'M1234,286 Q1250,330 1244,366 L1246,376', fill: 'none', stroke: INK, 'stroke-width': 9, 'stroke-linecap': 'round' }, STRIP);
  el('path', { d: 'M1234,286 Q1250,330 1244,366', fill: 'none', stroke: '#2c2c31', 'stroke-width': 5.5, 'stroke-linecap': 'round' }, STRIP);
  el('path', { d: 'M1244,366 L1246,378', stroke: '#d98a4a', 'stroke-width': 3, 'stroke-linecap': 'round' }, STRIP);

  /* ---------- the practice board: a sheet of plywood screwed to the wall ---------- */
  el('path', { d: `M${BD.x1},${BD.y0 + 2} L${BD.x1 + 14},${BD.y0 + 12} L${BD.x1 + 14},${BD.y1 + 12} L${BD.x0 + 14},${BD.y1 + 12} L${BD.x0},${BD.y1} L${BD.x1},${BD.y1} Z`, fill: '#94643a', stroke: INK, 'stroke-width': 4, 'stroke-linejoin': 'round' }, L.board);
  el('path', { d: `M${BD.x0 + 10},${BD.y1 + 5} H${BD.x1 + 8} M${BD.x0 + 14},${BD.y1 + 8.5} H${BD.x1 + 11} M${BD.x1 + 5},${BD.y0 + 14} V${BD.y1 + 4} M${BD.x1 + 9},${BD.y0 + 16} V${BD.y1 + 7}`, stroke: '#5e3a1c', 'stroke-width': 1.4, opacity: 0.8 }, L.board);
  el('rect', { x: BD.x0, y: BD.y0, width: BD.x1 - BD.x0, height: BD.y1 - BD.y0, rx: 5, fill: 'url(#gPly)', stroke: INK, 'stroke-width': 5 }, L.board);
  const grainB = [];
  for (let i = 0; i < 12; i++) { const y = BD.y0 + 16 + i * 32 + rand(-6, 6); grainB.push(`M${BD.x0 + 4},${R(y)} C${R(rand(500, 650))},${R(y + rand(-12, 12))} ${R(rand(800, 950))},${R(y + rand(-12, 12))} ${BD.x1 - 4},${R(y + rand(-8, 8))}`); }
  el('path', { d: grainB.join(' '), fill: 'none', stroke: '#a87a45', 'stroke-width': 2, opacity: 0.45 }, L.board);
  for (const [cx, cy, rx] of [[470, 460, 16], [1050, 176, 12], [820, 420, 9]]) el('ellipse', { cx, cy, rx, ry: rx * 0.45, fill: 'none', stroke: '#a3713e', 'stroke-width': 2, opacity: 0.5 }, L.board);
  el('rect', { x: BD.x0 + 14, y: BD.y0 + 14, width: BD.x1 - BD.x0 - 28, height: BD.y1 - BD.y0 - 28, rx: 4, fill: 'none', stroke: '#a3261c', 'stroke-width': 2.5, opacity: 0.35, 'stroke-dasharray': '26 8 4 8' }, L.board);
  for (const [x, y] of [[BD.x0 + 22, BD.y0 + 22], [BD.x1 - 22, BD.y0 + 22], [BD.x0 + 22, BD.y1 - 22], [BD.x1 - 22, BD.y1 - 22]]) {
    el('circle', { cx: x, cy: y, r: 9, fill: 'url(#gScrewSilver)', stroke: INK, 'stroke-width': 2.5 }, L.board);
    el('path', { d: `M${x - 5},${y - 3} L${x + 5},${y + 3}`, stroke: INK, 'stroke-width': 2.2, 'stroke-linecap': 'round' }, L.board);
  }
  if (ID === 2) drawStairs();
  else if (!LEVEL.stage) {
    const px = ID === 1 ? 860 : 520;
    el('text', { x: px, y: 158, 'text-anchor': 'middle', 'font-family': 'Rye, Georgia, serif', 'font-size': 19, 'letter-spacing': 3, fill: '#7d4f24', opacity: 0.6 }, L.board).textContent = LEVEL.plate;
    el('path', { d: `M${px - 108},166 H${px + 108}`, stroke: '#7d4f24', 'stroke-width': 2, opacity: 0.4, 'stroke-dasharray': '10 6' }, L.board);
  }

  /* ---------- the bench in front, with a few things left lying about ---------- */
  el('path', { d: `M24,548 H${W - 24} L${W},600 H0 Z`, fill: 'url(#gBenchTop)', stroke: INK, 'stroke-width': 4, 'stroke-linejoin': 'round' }, L.bench);
  const grainT = [];
  for (let i = 0; i < 5; i++) { const y = 556 + i * 9; grainT.push(`M${R(rand(10, 200))},${y} C${R(rand(300, 500))},${R(y + rand(-3, 3))} ${R(rand(700, 900))},${R(y + rand(-3, 3))} ${R(rand(W - 200, W - 10))},${y}`); }
  el('path', { d: grainT.join(' '), fill: 'none', stroke: '#6a3f1f', 'stroke-width': 1.6, opacity: 0.4 }, L.bench);
  el('rect', { x: -5, y: 600, width: W + 10, height: 26, fill: '#7a4a26', stroke: INK, 'stroke-width': 4 }, L.bench);
  el('path', { d: `M0,606 H${W}`, stroke: '#c79566', 'stroke-width': 3, opacity: 0.6 }, L.bench);
  el('rect', { x: -5, y: 626, width: W + 10, height: H - 610, fill: 'url(#gBenchFront)', stroke: INK, 'stroke-width': 4 }, L.bench);
  /* the bench is painted on watercolour paper (GPU quality only) */
  if (G) G.paper(shakeG, -20, 546, W + 40, H - 526, { flip: true, opacity: 0.85, before: L.parts });
  /* the props keep to the left end: the rest of the bench is a clear lane for
     anyone walking on */
  const spool = el('g', { transform: 'translate(-56,0)' }, L.bench);
  el('ellipse', { cx: 150, cy: 590, rx: 32, ry: 9, fill: '#6a4428', stroke: INK, 'stroke-width': 3 }, spool);
  el('rect', { x: 126, y: 564, width: 48, height: 26, fill: '#c7322b', stroke: INK, 'stroke-width': 3 }, spool);
  el('path', { d: 'M126,570 Q150,574 174,570 M126,576 Q150,580 174,576 M126,582 Q150,586 174,582', fill: 'none', stroke: '#7a1c14', 'stroke-width': 1.6, opacity: 0.8 }, spool);
  el('path', { d: 'M132,566 V588', stroke: '#ff9a84', 'stroke-width': 2.4, opacity: 0.6 }, spool);
  el('ellipse', { cx: 150, cy: 562, rx: 32, ry: 9, fill: '#8a5a30', stroke: INK, 'stroke-width': 3 }, spool);
  el('ellipse', { cx: 150, cy: 562, rx: 9, ry: 3, fill: '#3a2414' }, spool);
  el('path', { d: 'M174,574 C196,578 204,592 232,590 C246,589 250,584 258,586', fill: 'none', stroke: INK, 'stroke-width': 6, 'stroke-linecap': 'round' }, spool);
  el('path', { d: 'M174,574 C196,578 204,592 232,590 C246,589 250,584 258,586', fill: 'none', stroke: '#c7322b', 'stroke-width': 3, 'stroke-linecap': 'round' }, spool);
  el('path', { d: 'M258,586 L266,588', stroke: '#d98a4a', 'stroke-width': 2.6, 'stroke-linecap': 'round' }, spool);
  const drv = el('g', { transform: 'translate(-46,2)' }, L.bench);
  el('path', { d: 'M318,588 L372,582', stroke: '#9a9a9a', 'stroke-width': 4.5, 'stroke-linecap': 'round' }, drv);
  el('path', { d: 'M318,588 L372,582', stroke: INK, 'stroke-width': 1, opacity: 0.4 }, drv);
  el('rect', { x: 368, y: 574, width: 44, height: 15, rx: 7, fill: '#d0983a', stroke: INK, 'stroke-width': 2.8, transform: 'rotate(-6 390 581)' }, drv);
  const pl = el('g', { transform: 'translate(430,588) rotate(-8)' }, L.bench);
  el('path', { d: 'M-40,-3 L0,-2 L0,3 L-40,4 Z', fill: '#8c8f94', stroke: INK, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, pl);
  el('path', { d: 'M0,-2 C20,-8 44,-12 66,-12 Q70,-6 66,-4 C44,-3 20,2 4,4 Z', fill: '#c7322b', stroke: INK, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, pl);
  el('path', { d: 'M2,2 C22,6 44,12 64,14 Q66,8 62,6 C42,3 22,-1 2,-2 Z', fill: '#b02a22', stroke: INK, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, pl);
  el('circle', { cx: 0, cy: 0, r: 4.5, fill: 'url(#gSteel)', stroke: INK, 'stroke-width': 2 }, pl);
  const jar = el('g', { transform: 'translate(-590,0)' }, L.bench);
  el('path', { d: 'M1128,596 V560 Q1128,554 1134,554 H1170 Q1176,554 1176,560 V596 Z', fill: '#cfe3e0', opacity: 0.55, stroke: BR, 'stroke-width': 3 }, jar);
  for (let i = 0; i < 8; i++) el('path', { d: `M${1134 + (i % 4) * 10},${592 - Math.floor(i / 4) * 12} l5,-10 l5,10 Z`, fill: pick(['#f28c1c', '#f2d21c', '#d8342a']), stroke: BR, 'stroke-width': 1.2 }, jar);
  el('rect', { x: 1124, y: 546, width: 56, height: 10, rx: 2, fill: '#a0998a', stroke: BR, 'stroke-width': 2.5 }, jar);
  /* 1.1 and 1.2: the hand tools live in the toolbox, which takes the spool's spot */
  if (LEVEL.toolbox) [spool, drv, pl].forEach(g => g.remove());

  /* little paper labels, tacked on */
  function tag(x, y, text, rot = 0, g = L.tags) {
    const w = text.length * 8.6 + 18;
    const t = el('g', { transform: `translate(${x},${y}) rotate(${rot})` }, g);
    el('rect', { x: -w / 2, y: -11, width: w, height: 22, rx: 2, fill: '#f3e6c4', stroke: BR, 'stroke-width': 2 }, t);
    el('text', { x: 3, y: 5.5, 'text-anchor': 'middle', 'font-family': 'Special Elite, monospace', 'font-size': 14, fill: '#3a2414' }, t).textContent = text;
    el('circle', { cx: -w / 2 + 6, cy: -2, r: 2.6, fill: '#c7322b', stroke: BR, 'stroke-width': 1 }, t);
    return t;
  }

  /* ---------- the service panel: riveted steel, door swung open, on the bare
     wall and fed from above by a steel conduit ---------- */
  const PX = -26, PY = -20;
  const panel = el('g', { transform: `translate(${PX},${PY})` }, L.parts);
  el('rect', { x: 104, y: 158, width: 244, height: 366, rx: 12, fill: '#140904', opacity: 0.45, filter: 'url(#softBlur)' }, panel);
  el('rect', { x: 206, y: 36, width: 20, height: 116, fill: 'url(#gSteel)', stroke: INK, 'stroke-width': 3.5 }, panel);
  el('path', { d: 'M211,40 V146', stroke: '#f2f2ee', 'stroke-width': 2, opacity: 0.6 }, panel);
  el('rect', { x: 201, y: 92, width: 30, height: 14, rx: 2, fill: 'url(#gSteel)', stroke: INK, 'stroke-width': 3 }, panel);
  el('path', { d: 'M196,70 H206 M226,70 H236 M206,62 Q216,56 226,62 V78 Q216,84 206,78 Z', fill: '#8c8f94', stroke: INK, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, panel);
  for (const x of [193, 239]) el('circle', { cx: x, cy: 70, r: 3.4, fill: 'url(#gScrewSilver)', stroke: INK, 'stroke-width': 1.4 }, panel);
  el('path', { d: 'M200,140 H232 L236,148 H196 Z', fill: '#6c6f72', stroke: INK, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, panel);
  el('path', { d: 'M96,152 L36,178 L36,484 L96,508 Z', fill: 'url(#gDoor)', stroke: INK, 'stroke-width': 4, 'stroke-linejoin': 'round' }, panel);
  el('path', { d: 'M86,174 L46,190 L46,470 L86,488 Z', fill: '#9a9ea1', opacity: 0.55, stroke: INK, 'stroke-width': 2 }, panel);
  el('rect', { x: 38, y: 300, width: 10, height: 36, rx: 4, fill: 'url(#gSteel)', stroke: INK, 'stroke-width': 2.5 }, panel);
  el('rect', { x: 96, y: 148, width: 240, height: 364, rx: 10, fill: 'url(#gCab)', stroke: INK, 'stroke-width': 5 }, panel);
  el('path', { d: 'M104,160 V500', stroke: '#e3e6e8', 'stroke-width': 3, opacity: 0.55, 'stroke-linecap': 'round' }, panel);
  for (const x of [105, 327]) for (let y = 170; y <= 496; y += 41) el('circle', { cx: x, cy: y, r: 3.2, fill: 'url(#gScrewSilver)', stroke: INK, 'stroke-width': 1.4 }, panel);
  el('rect', { x: 114, y: 166, width: 204, height: 328, rx: 5, fill: 'url(#gCabIn)', stroke: INK, 'stroke-width': 3 }, panel);
  el('path', { d: 'M118,172 H314', stroke: '#000', 'stroke-width': 8, opacity: 0.3 }, panel);
  el('rect', { x: 134, y: 176, width: 164, height: 26, rx: 3, fill: 'url(#gGold)', stroke: INK, 'stroke-width': 2.5 }, panel);
  el('text', { x: 216, y: 194, 'text-anchor': 'middle', 'font-family': 'Rye, Georgia, serif', 'font-size': 13.5, fill: INK, 'letter-spacing': 1 }, panel).textContent = 'SERVICE PANEL';
  for (const x of [141, 291]) el('circle', { cx: x, cy: 189, r: 2.4, fill: '#7a5a1a', stroke: INK, 'stroke-width': 1 }, panel);
  el('path', { d: 'M206,316 V330 H284', fill: 'none', stroke: INK, 'stroke-width': 12, 'stroke-linejoin': 'round' }, panel);
  el('path', { d: 'M206,316 V330 H284', fill: 'none', stroke: '#c8743a', 'stroke-width': 7, 'stroke-linejoin': 'round' }, panel);
  el('path', { d: 'M204,318 V328 H284', fill: 'none', stroke: '#f2b27a', 'stroke-width': 1.8, opacity: 0.8 }, panel);
  el('rect', { x: 280, y: 314, width: 40, height: 32, rx: 4, fill: 'url(#gGold)', stroke: INK, 'stroke-width': 3 }, panel);
  const dir = el('g', { transform: 'rotate(-2 190 372)' }, panel);
  el('rect', { x: 134, y: 348, width: 108, height: 52, rx: 2, fill: '#efe3c2', stroke: INK, 'stroke-width': 2 }, dir);
  el('path', { d: 'M140,362 H236 M140,376 H236 M140,390 H236', stroke: '#9ab0c8', 'stroke-width': 1, opacity: 0.8 }, dir);
  el('text', { x: 142, y: 360, 'font-family': 'Special Elite, monospace', 'font-size': 9.5, fill: '#3a2a1a' }, dir).textContent = 'CKT 1 ... PRACTICE';
  el('text', { x: 142, y: 374, 'font-family': 'Special Elite, monospace', 'font-size': 9.5, fill: '#3a2a1a' }, dir).textContent = 'KILL POWER';
  el('text', { x: 142, y: 388, 'font-family': 'Special Elite, monospace', 'font-size': 9.5, fill: '#a3261c' }, dir).textContent = 'BEFORE WIRING!';
  el('path', { d: 'M142,391 H232', stroke: '#a3261c', 'stroke-width': 1.4 }, dir);
  /* the neutral bar and the ground bar, bonded together here in the service
     panel and nowhere else */
  el('rect', { x: 132, y: 412, width: 190, height: 18, rx: 3, fill: 'url(#gSteel)', stroke: INK, 'stroke-width': 3 }, panel);
  el('rect', { x: 132, y: 448, width: 190, height: 18, rx: 3, fill: 'url(#gGndBar)', stroke: INK, 'stroke-width': 3 }, panel);
  el('rect', { x: 136, y: 424, width: 12, height: 30, rx: 2, fill: '#c98a4e', stroke: INK, 'stroke-width': 2.2 }, panel);
  el('circle', { cx: 142, cy: 421, r: 5, fill: 'url(#gScrewGreen)', stroke: INK, 'stroke-width': 1.8 }, panel);
  el('text', { x: 154, y: 443, 'font-family': 'Special Elite, monospace', 'font-size': 8.5, fill: '#cfc6ae', 'letter-spacing': 1 }, panel).textContent = 'BONDED HERE ONLY';
  for (const [x, y, f] of [[166, 421, 'url(#gScrewSilver)'], [192, 421, 'url(#gScrewSilver)'], [166, 457, 'url(#gScrewGreen)'], [192, 457, 'url(#gScrewGreen)']]) {
    el('circle', { cx: x, cy: y, r: 5.5, fill: f, stroke: INK, 'stroke-width': 1.8 }, panel);
    el('path', { d: `M${x - 3},${y - 2} L${x + 3},${y + 2}`, stroke: INK, 'stroke-width': 1.6 }, panel);
  }
  el('rect', { x: 146, y: 496, width: 140, height: 18, rx: 3, fill: '#c7322b', stroke: INK, 'stroke-width': 2.5 }, panel);
  el('text', { x: 216, y: 509, 'text-anchor': 'middle', 'font-family': 'Rye, Georgia, serif', 'font-size': 10, fill: '#fbeac0', 'letter-spacing': 1 }, panel).textContent = 'DANGER · 120 VOLTS';
  el('circle', { cx: 276, cy: 240, r: 12, fill: 'url(#gScrewSilver)', stroke: INK, 'stroke-width': 2.5 }, panel);
  const jewel = el('circle', { cx: 276, cy: 240, r: 8, fill: 'url(#gJewelOff)', stroke: INK, 'stroke-width': 2 }, panel);
  el('path', { d: 'M272,236 Q274,233 278,233', fill: 'none', stroke: '#fff', 'stroke-width': 1.8, opacity: 0.8, 'stroke-linecap': 'round' }, panel);
  el('text', { x: 276, y: 266, 'text-anchor': 'middle', 'font-family': 'Special Elite, monospace', 'font-size': 9, fill: '#cfc6ae' }, panel).textContent = 'PILOT';
  const jewelGlow = el('circle', { cx: 276 + PX, cy: 240 + PY, r: 34, fill: 'url(#gRedGlow)', opacity: 0, style: 'mix-blend-mode:screen' }, L.light);

  /* the main breaker: a black bakelite toggle with a cream handle */
  const breaker = el('g', { class: 'clicky', role: 'button', tabindex: 0, 'aria-label': 'Main breaker' }, el('g', { transform: `translate(${PX},${PY})` }, L.parts));
  el('rect', { x: 144, y: 212, width: 96, height: 110, rx: 9, fill: 'url(#gBakelite)', stroke: INK, 'stroke-width': 3.5 }, breaker);
  el('path', { d: 'M150,220 H234', stroke: '#55555c', 'stroke-width': 2, opacity: 0.7, 'stroke-linecap': 'round' }, breaker);
  el('text', { x: 158, y: 229, 'font-family': 'Special Elite, monospace', 'font-size': 9, fill: '#cfc6ae' }, breaker).textContent = 'CKT 1 15A';
  el('text', { x: 228, y: 250, 'text-anchor': 'middle', 'font-family': 'Special Elite, monospace', 'font-size': 9.5, fill: '#e6dcc0' }, breaker).textContent = 'ON';
  el('text', { x: 228, y: 300, 'text-anchor': 'middle', 'font-family': 'Special Elite, monospace', 'font-size': 9.5, fill: '#e6dcc0' }, breaker).textContent = 'OFF';
  el('rect', { x: 166, y: 234, width: 50, height: 74, rx: 7, fill: '#050506', stroke: '#3e3e46', 'stroke-width': 2 }, breaker);
  const hUnder = el('rect', { x: 172, width: 38, rx: 4, fill: '#7d6a48', stroke: INK, 'stroke-width': 2.5 }, breaker);
  const hFace = el('rect', { x: 169, width: 44, height: 28, rx: 6, fill: 'url(#gHandle)', stroke: INK, 'stroke-width': 3 }, breaker);
  const hGrip = el('path', { fill: 'none', stroke: '#a8916a', 'stroke-width': 2, 'stroke-linecap': 'round' }, breaker);
  const tripFlag = el('g', { opacity: 0 }, breaker);
  el('path', { d: 'M238,262 H270 L276,270 L270,278 H238 Z', fill: '#f28c1c', stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round' }, tripFlag);
  el('text', { x: 255, y: 274, 'text-anchor': 'middle', 'font-family': 'Rye, Georgia, serif', 'font-size': 10, fill: INK }, tripFlag).textContent = 'TRIP';
  const brk = { p: -1, v: 0 };
  const BRK_AT = [192 + PX, 268 + PY];

  /* ---------- the board's hardware: device boxes, the lampholder, the screws ---------- */
  /* TERMS: every binding screw; PIG_AT: where a pigtail's wire nut sits for a
     doubled screw; SWDEF: the switch characters; BULB: where the bulb stands */
  const PANEL_TERMS = {
    'P.hot': { x: 300 + PX, y: 330 + PY, kind: 'dark', label: 'HOT', tx: 300 + PX, ty: 296 + PY, name: 'Panel HOT' },
    'P.neu': { x: 300 + PX, y: 421 + PY, kind: 'silver', label: 'NEUTRAL', tx: 240 + PX, ty: 421 + PY, name: 'Panel NEUTRAL bar' },
    'P.gnd': { x: 300 + PX, y: 457 + PY, kind: 'green', label: 'GROUND', tx: 242 + PX, ty: 457 + PY, name: 'Panel GROUND bar' },
  };
  let TERMS, PIG_AT, SWDEF, BULB, BULB2 = null, OUTLET = null, CHAIN_AT = null, REC = null;
  /* the later Chapter 1 boards, by LEVEL.stage */
  const STAGES = { loop: stageLoop, two: stageTwo, sparky: stageSparky };
  let SPARKY = null;
  if (ID === 2) stage2();
  else if (LEVEL.toolbox) stageLight();
  else if (LEVEL.stage) STAGES[LEVEL.stage]();
  else {
  /* the steel device box the switch stands in */
  const box = el('g', {}, L.parts);
  el('rect', { x: 574, y: 196, width: 150, height: 300, rx: 12, fill: '#140904', opacity: 0.45, filter: 'url(#softBlur)' }, box);
  for (const y of [172, 482]) {
    el('rect', { x: 614, y, width: 52, height: 20, rx: 6, fill: 'url(#gGalv)', stroke: INK, 'stroke-width': 3 }, box);
    el('circle', { cx: 640, cy: y + 10, r: 5, fill: 'url(#gScrewSilver)', stroke: INK, 'stroke-width': 1.8 }, box);
    el('path', { d: `M636,${y + 8} L644,${y + 12}`, stroke: INK, 'stroke-width': 1.6 }, box);
  }
  for (const [x0, x1] of [[532, 582], [698, 748]]) {
    el('rect', { x: x0, y: 302, width: x1 - x0, height: 36, rx: 7, fill: 'url(#gGalv)', stroke: INK, 'stroke-width': 3 }, box);
    el('path', { d: `M${x0 + 6},${308} H${x1 - 6}`, stroke: '#f2f4f5', 'stroke-width': 2, opacity: 0.6, 'stroke-linecap': 'round' }, box);
  }
  /* the grounding tab welded to the box, with its green screw */
  el('path', { d: 'M592,470 H546 Q538,470 538,478 V508 Q538,516 546,516 H592 Z', fill: 'url(#gGalv)', stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round' }, box);
  el('path', { d: 'M546,476 H586', stroke: '#f2f4f5', 'stroke-width': 2, opacity: 0.6, 'stroke-linecap': 'round' }, box);
  el('rect', { x: 566, y: 186, width: 148, height: 298, rx: 10, fill: 'url(#gGalv)', stroke: INK, 'stroke-width': 5 }, box);
  el('rect', { x: 566, y: 186, width: 148, height: 298, rx: 10, fill: 'url(#spangle)' }, box);
  el('rect', { x: 574, y: 194, width: 132, height: 282, rx: 7, fill: 'none', stroke: '#f2f4f5', 'stroke-width': 2, opacity: 0.55 }, box);
  el('rect', { x: 582, y: 202, width: 116, height: 266, rx: 5, fill: 'url(#gCabIn)', stroke: INK, 'stroke-width': 3 }, box);
  el('path', { d: 'M586,208 H694', stroke: '#000', 'stroke-width': 7, opacity: 0.3 }, box);
  el('path', { d: 'M596,456 H684', stroke: '#55595c', 'stroke-width': 5, 'stroke-linecap': 'round' }, box);

  /* ---------- the porcelain keyless lampholder on a turned wooden block ---------- */
  const HX = -80;
  const holder = el('g', { transform: `translate(${HX},0)` }, L.holder);
  el('path', { d: 'M912,456 V504 Q1020,544 1128,504 V456 Z', fill: '#8a5a30', stroke: INK, 'stroke-width': 4, 'stroke-linejoin': 'round' }, holder);
  el('path', { d: 'M920,500 Q1020,534 1120,500', fill: 'none', stroke: '#c79566', 'stroke-width': 2.5, opacity: 0.6 }, holder);
  el('ellipse', { cx: 1020, cy: 456, rx: 108, ry: 26, fill: '#a26e3e', stroke: INK, 'stroke-width': 4 }, holder);
  el('path', { d: 'M930,442 V488 Q1020,522 1110,488 V442 Z', fill: 'url(#gPorc)', stroke: INK, 'stroke-width': 5, 'stroke-linejoin': 'round' }, holder);
  el('path', { d: 'M946,454 V484', stroke: '#ffffff', 'stroke-width': 6, opacity: 0.75, 'stroke-linecap': 'round' }, holder);
  el('path', { d: 'M1094,452 V486', stroke: '#8f8676', 'stroke-width': 8, opacity: 0.35, 'stroke-linecap': 'round' }, holder);
  el('ellipse', { cx: 1020, cy: 442, rx: 90, ry: 24, fill: '#f8f3e8', stroke: INK, 'stroke-width': 5 }, holder);
  el('ellipse', { cx: 1020, cy: 442, rx: 40, ry: 11.5, fill: 'url(#gGold)', stroke: INK, 'stroke-width': 3 }, holder);
  el('path', { d: 'M986,441 Q1020,450 1054,441 M990,436 Q1020,444 1050,436', fill: 'none', stroke: '#7a5316', 'stroke-width': 1.6, opacity: 0.8 }, holder);
  for (const [x0, x1] of [[916, 952], [1088, 1124]]) el('rect', { x: x0, y: 454, width: x1 - x0, height: 24, rx: 4, fill: x0 < 1000 ? 'url(#gGold)' : 'url(#gSteel)', stroke: INK, 'stroke-width': 2.5 }, holder);

  TERMS = Object.assign({}, PANEL_TERMS, {
    'S1.a': { x: 550, y: 320, kind: 'brass', label: 'BRASS', tx: 522, ty: 360, name: 'Switch left BRASS' },
    'S1.b': { x: 730, y: 320, kind: 'brass', label: 'BRASS', tx: 758, ty: 360, name: 'Switch right BRASS' },
    'S1.g': { x: 558, y: 493, kind: 'green', label: 'GROUND', tx: 490, ty: 493, name: 'Switch box green GROUND' },
    'L1.brass': { x: 934 + HX, y: 466, kind: 'brass', label: 'BRASS', tx: 876 + HX, ty: 470, name: 'Bulb BRASS' },
    'L1.silver': { x: 1106 + HX, y: 466, kind: 'silver', label: 'SILVER', tx: 1170 + HX, ty: 470, name: 'Bulb SILVER' },
  });
  PIG_AT = { 'P.hot': [0.95, 0.55], 'P.neu': [0.95, 0.3], 'P.gnd': [0.95, 0.35], 'S1.a': [-0.8, -0.65], 'S1.b': [0.8, -0.65], 'S1.g': [-0.9, -0.5], 'L1.brass': [-0.55, 0.95], 'L1.silver': [0.55, 0.95] };
  SWDEF = [{ id: 'S1', x: 640, y: 468, s: 0.8, labels: true, tip: [618, 236] }];
  BULB = { x: 1020 + HX, y: 440, s: 0.8, tip: [918, 214] };
  }

  /* Level 2's board: a stairway painted on the plywood, a 3-way switch in a
     steel box at the foot of the stairs and another at the head, and the stair
     light in between, a porcelain lampholder on a steel octagon box */
  function drawStairs() {
    const g = L.board;
    const paint = '#f6ecd2';
    /* the flight: five treads rising from the foot (left) to the landing (right) */
    const x0 = 700, y0 = 530, tread = 60, riser = 19;
    let d = `M${BD.x0 + 16},${y0} H${x0}`, nose = [];
    for (let i = 0; i < 5; i++) { const x = x0 + i * tread, y = y0 - (i + 1) * riser; d += ` V${y} H${x + tread}`; nose.push([x, y]); }
    const land = y0 - 5 * riser;
    d += ` H${BD.x1 - 16}`;
    el('path', { d, fill: 'none', stroke: '#6a3f1f', 'stroke-width': 7, opacity: 0.35, transform: 'translate(3,4)' }, g);
    el('path', { d, fill: 'none', stroke: paint, 'stroke-width': 4.5, opacity: 0.62, 'stroke-linejoin': 'round' }, g);
    /* the stringer under the flight, and the handrail with its balusters and newel post */
    el('path', { d: `M${x0},${y0} L${x0 + 5 * tread},${land}`, stroke: paint, 'stroke-width': 3, opacity: 0.4, 'stroke-dasharray': '12 7' }, g);
    const rail = (x) => y0 - 96 - ((x - x0) / tread) * riser;
    el('path', { d: `M${x0 - 6},${R(rail(x0 - 6))} L${x0 + 5 * tread + 8},${R(rail(x0 + 5 * tread + 8))}`, stroke: '#6a3f1f', 'stroke-width': 9, opacity: 0.3, 'stroke-linecap': 'round', transform: 'translate(3,4)' }, g);
    el('path', { d: `M${x0 - 6},${R(rail(x0 - 6))} L${x0 + 5 * tread + 8},${R(rail(x0 + 5 * tread + 8))}`, stroke: paint, 'stroke-width': 7, opacity: 0.6, 'stroke-linecap': 'round' }, g);
    const bal = [];
    for (const [x, y] of nose) for (const dx of [12, 40]) bal.push(`M${x + dx},${R(rail(x + dx))} V${y}`);
    el('path', { d: bal.join(' '), stroke: paint, 'stroke-width': 3, opacity: 0.5 }, g);
    el('rect', { x: x0 - 20, y: R(rail(x0) - 14), width: 18, height: R(y0 - rail(x0) + 14), rx: 3, fill: 'none', stroke: paint, 'stroke-width': 4, opacity: 0.6 }, g);
    el('circle', { cx: x0 - 11, cy: R(rail(x0) - 20), r: 8, fill: 'none', stroke: paint, 'stroke-width': 4, opacity: 0.6 }, g);
    /* an arrow up the flight */
    const up = el('g', { transform: `translate(${x0 + 150},${y0 - 30}) rotate(-18)`, opacity: 0.55 }, g);
    el('path', { d: 'M-40,0 H30 M18,-10 L32,0 L18,10', fill: 'none', stroke: '#a3261c', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, up);
    el('text', { x: -34, y: -8, 'font-family': 'Rye, Georgia, serif', 'font-size': 15, fill: '#a3261c' }, up).textContent = 'UP';
    el('text', { x: 640, y: 186, 'text-anchor': 'middle', 'font-family': 'Rye, Georgia, serif', 'font-size': 19, 'letter-spacing': 3, fill: '#7d4f24', opacity: 0.6 }, g).textContent = 'PRACTICE BOARD No. 2';
    el('text', { x: 640, y: 212, 'text-anchor': 'middle', 'font-family': 'Special Elite, monospace', 'font-size': 14, 'letter-spacing': 4, fill: '#7d4f24', opacity: 0.6 }, g).textContent = 'THE STAIRWAY';
    el('path', { d: 'M532,195 H748', stroke: '#7d4f24', 'stroke-width': 2, opacity: 0.4, 'stroke-dasharray': '10 6' }, g);
  }
  /* a steel device box like Level 1's, smaller: side ears carry the device's
     screws, a welded tab carries the green ground screw */
  function deviceBox(cx, y0, w, h, ears, gtab) {
    const g = el('g', {}, L.parts), x0 = cx - w / 2, x1 = cx + w / 2, y1 = y0 + h;
    el('rect', { x: x0 + 8, y: y0 + 10, width: w + 2, height: h + 2, rx: 12, fill: '#140904', opacity: 0.45, filter: 'url(#softBlur)' }, g);
    for (const y of [y0 - 14, y1 - 4]) {
      el('rect', { x: cx - 20, y, width: 40, height: 18, rx: 5, fill: 'url(#gGalv)', stroke: INK, 'stroke-width': 3 }, g);
      el('circle', { cx, cy: y + 9, r: 4.5, fill: 'url(#gScrewSilver)', stroke: INK, 'stroke-width': 1.6 }, g);
      el('path', { d: `M${cx - 3.5},${y + 7} L${cx + 3.5},${y + 11}`, stroke: INK, 'stroke-width': 1.4 }, g);
    }
    for (const [ex0, ex1, ey] of ears) {
      el('rect', { x: ex0, y: ey - 17, width: ex1 - ex0, height: 34, rx: 7, fill: 'url(#gGalv)', stroke: INK, 'stroke-width': 3 }, g);
      el('path', { d: `M${ex0 + 6},${ey - 11} H${ex1 - 6}`, stroke: '#f2f4f5', 'stroke-width': 2, opacity: 0.6, 'stroke-linecap': 'round' }, g);
    }
    if (gtab) {
      const [tx, ty] = gtab;
      el('path', { d: `M${tx - 30},${ty - 22} H${tx + 20} Q${tx + 28},${ty - 22} ${tx + 28},${ty - 14} V${ty + 16} Q${tx + 28},${ty + 24} ${tx + 20},${ty + 24} H${tx - 30} Z`, fill: 'url(#gGalv)', stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round' }, g);
      el('path', { d: `M${tx - 24},${ty - 16} H${tx + 16}`, stroke: '#f2f4f5', 'stroke-width': 2, opacity: 0.6, 'stroke-linecap': 'round' }, g);
    }
    el('rect', { x: x0, y: y0, width: w, height: h, rx: 10, fill: 'url(#gGalv)', stroke: INK, 'stroke-width': 5 }, g);
    el('rect', { x: x0, y: y0, width: w, height: h, rx: 10, fill: 'url(#spangle)' }, g);
    el('rect', { x: x0 + 7, y: y0 + 7, width: w - 14, height: h - 14, rx: 7, fill: 'none', stroke: '#f2f4f5', 'stroke-width': 2, opacity: 0.55 }, g);
    el('rect', { x: x0 + 14, y: y0 + 14, width: w - 28, height: h - 28, rx: 5, fill: 'url(#gCabIn)', stroke: INK, 'stroke-width': 3 }, g);
    el('path', { d: `M${x0 + 18},${y0 + 20} H${x1 - 18}`, stroke: '#000', 'stroke-width': 6, opacity: 0.3 }, g);
    el('path', { d: `M${x0 + 26},${y1 - 26} H${x1 - 26}`, stroke: '#55595c', 'stroke-width': 4.5, 'stroke-linecap': 'round' }, g);
    return g;
  }
  function stage2() {
    /* the foot of the stairs: 3-way number one */
    /* the whole run spreads across the wider Level 2 stage: foot switch at the
       left, the light in the middle, head switch well over to the right */
    const FX = 846;
    deviceBox(520, 290, 112, 216, [[422, 470, 336], [570, 618, 336], [422, 470, 426]], [592, 510]);
    /* the head of the stairs: 3-way number two */
    deviceBox(1170, 214, 112, 216, [[1072, 1120, 260], [1220, 1268, 260], [1072, 1120, 350]], [1242, 434]);
    /* the stair light: a steel octagon box, and a porcelain lampholder on it */
    const oct = el('g', {}, L.parts);
    const octD = (cx, cy, r) => { let d = ''; for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + (i * Math.PI) / 4; d += (i ? 'L' : 'M') + R(cx + Math.cos(a) * r) + ',' + R(cy + Math.sin(a) * r); } return d + 'Z'; };
    el('path', { d: octD(FX + 8, 362, 82), fill: '#140904', opacity: 0.45, filter: 'url(#softBlur)' }, oct);
    el('path', { d: octD(FX, 352, 80), fill: 'url(#gGalv)', stroke: INK, 'stroke-width': 5, 'stroke-linejoin': 'round' }, oct);
    el('path', { d: octD(FX, 352, 80), fill: 'url(#spangle)' }, oct);
    el('path', { d: octD(FX, 352, 70), fill: 'none', stroke: '#f2f4f5', 'stroke-width': 2, opacity: 0.55 }, oct);
    for (const [kx, ky] of [[FX - 64, 382], [FX + 64, 382]]) { el('circle', { cx: kx, cy: ky, r: 9, fill: '#6c7074', stroke: INK, 'stroke-width': 2.5 }, oct); el('circle', { cx: kx, cy: ky, r: 5.5, fill: '#3a3d40' }, oct); }
    const hs = 0.7;
    const holder = el('g', { transform: `translate(${R(FX - 1020 * hs)},${R(300 - 442 * hs)}) scale(${hs})` }, L.holder);
    el('path', { d: 'M930,442 V488 Q1020,522 1110,488 V442 Z', fill: 'url(#gPorc)', stroke: INK, 'stroke-width': 5, 'stroke-linejoin': 'round' }, holder);
    el('path', { d: 'M946,454 V484', stroke: '#ffffff', 'stroke-width': 6, opacity: 0.75, 'stroke-linecap': 'round' }, holder);
    el('path', { d: 'M1094,452 V486', stroke: '#8f8676', 'stroke-width': 8, opacity: 0.35, 'stroke-linecap': 'round' }, holder);
    el('ellipse', { cx: 1020, cy: 442, rx: 90, ry: 24, fill: '#f8f3e8', stroke: INK, 'stroke-width': 5 }, holder);
    el('ellipse', { cx: 1020, cy: 442, rx: 40, ry: 11.5, fill: 'url(#gGold)', stroke: INK, 'stroke-width': 3 }, holder);
    el('path', { d: 'M986,441 Q1020,450 1054,441 M990,436 Q1020,444 1050,436', fill: 'none', stroke: '#7a5316', 'stroke-width': 1.6, opacity: 0.8 }, holder);
    for (const [x0, x1] of [[916, 952], [1088, 1124]]) el('rect', { x: x0, y: 454, width: x1 - x0, height: 24, rx: 4, fill: x0 < 1000 ? 'url(#gGold)' : 'url(#gSteel)', stroke: INK, 'stroke-width': 2.5 }, holder);
    tag(520, 262, 'FOOT OF STAIRS', -1.5);
    tag(1030, 460, 'HEAD OF STAIRS', 1.5);
    TERMS = Object.assign({}, PANEL_TERMS, {
      'S1.t1': { x: 440, y: 336, kind: 'brass', label: 'TRAVELER', tx: 440, ty: 298, name: 'Bottom switch left traveler, brass' },
      'S1.t2': { x: 600, y: 336, kind: 'brass', label: 'TRAVELER', tx: 606, ty: 298, name: 'Bottom switch right traveler, brass' },
      'S1.com': { x: 440, y: 426, kind: 'dark', label: 'COMMON', tx: 436, ty: 464, name: 'Bottom switch COMMON, dark screw' },
      'S1.g': { x: 598, y: 511, kind: 'green', label: 'GROUND', tx: 668, ty: 478, name: 'Bottom box green GROUND' },
      'S2.t1': { x: 1090, y: 260, kind: 'brass', label: 'TRAVELER', tx: 1078, ty: 222, name: 'Top switch left traveler, brass' },
      'S2.t2': { x: 1250, y: 260, kind: 'brass', label: 'TRAVELER', tx: 1246, ty: 222, name: 'Top switch right traveler, brass' },
      'S2.com': { x: 1090, y: 350, kind: 'dark', label: 'COMMON', tx: 1076, ty: 388, name: 'Top switch COMMON, dark screw' },
      'S2.g': { x: 1248, y: 435, kind: 'green', label: 'GROUND', tx: 1180, ty: 480, name: 'Top box green GROUND' },
      'L1.brass': { x: R(934 * hs + FX - 1020 * hs), y: R(466 * hs + 300 - 442 * hs), kind: 'brass', label: 'BRASS', tx: 730, ty: 296, name: 'Stair light BRASS' },
      'L1.silver': { x: R(1106 * hs + FX - 1020 * hs), y: R(466 * hs + 300 - 442 * hs), kind: 'silver', label: 'SILVER', tx: 962, ty: 296, name: 'Stair light SILVER' },
      'L1.g': { x: FX, y: 410, kind: 'green', label: 'GROUND', tx: FX, ty: 450, name: 'Fixture box green GROUND' },
    });
    PIG_AT = {
      'P.hot': [0.95, 0.55], 'P.neu': [0.95, 0.3], 'P.gnd': [0.95, 0.35],
      'S1.t1': [-0.3, -1], 'S1.t2': [0.6, -0.9], 'S1.com': [-0.6, 0.85], 'S1.g': [0.9, 0.2],
      'S2.t1': [-0.8, 0.5], 'S2.t2': [0.3, 0.95], 'S2.com': [-0.85, 0.55], 'S2.g': [-0.6, 0.85],
      'L1.brass': [-0.7, 0.75], 'L1.silver': [0.7, 0.75], 'L1.g': [0.8, 0.6],
    };
    SWDEF = [{ id: 'S1', x: 520, y: 494, s: 0.6, labels: false, tip: [506, 346] }, { id: 'S2', x: 1170, y: 418, s: 0.6, labels: false, tip: [1156, 270] }];
    BULB = { x: FX, y: 298, s: 0.56, tip: [FX - 42, 184] };
  }
  /* 1.1 and 1.2: one light, fed straight from the panel. A porcelain lampholder
     on a steel octagon box (1.2's has a pull chain); in 1.1 the outlet stands in
     his own box on another circuit, the known live source for the tester */
  function stageLight() {
    const FX = 700, TOP = 300, hs = 0.8, k = hs / 0.7;
    const oct = el('g', {}, L.parts);
    const octD = (cx, cy, r) => { let d = ''; for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + (i * Math.PI) / 4; d += (i ? 'L' : 'M') + R(cx + Math.cos(a) * r) + ',' + R(cy + Math.sin(a) * r); } return d + 'Z'; };
    const OC = TOP + 52 * k, OR = 80 * k;
    /* the cable comes in through a clamp at the box's left knockout */
    el('path', { d: octD(FX + 9, OC + 11, OR + 2), fill: '#140904', opacity: 0.45, filter: 'url(#softBlur)' }, oct);
    el('path', { d: octD(FX, OC, OR), fill: 'url(#gGalv)', stroke: INK, 'stroke-width': 5, 'stroke-linejoin': 'round' }, oct);
    el('path', { d: octD(FX, OC, OR), fill: 'url(#spangle)' }, oct);
    el('path', { d: octD(FX, OC, OR - 11), fill: 'none', stroke: '#f2f4f5', 'stroke-width': 2, opacity: 0.55 }, oct);
    for (const [kx, ky] of [[FX - 70, OC + 12], [FX + 70, OC + 12]]) { el('circle', { cx: kx, cy: ky, r: 10, fill: '#6c7074', stroke: INK, 'stroke-width': 2.5 }, oct); el('circle', { cx: kx, cy: ky, r: 6, fill: '#3a3d40' }, oct); }
    const holder = el('g', { transform: `translate(${R(FX - 1020 * hs)},${R(TOP - 442 * hs)}) scale(${hs})` }, L.holder);
    el('path', { d: 'M930,442 V488 Q1020,522 1110,488 V442 Z', fill: 'url(#gPorc)', stroke: INK, 'stroke-width': 5, 'stroke-linejoin': 'round' }, holder);
    el('path', { d: 'M946,454 V484', stroke: '#ffffff', 'stroke-width': 6, opacity: 0.75, 'stroke-linecap': 'round' }, holder);
    el('path', { d: 'M1094,452 V486', stroke: '#8f8676', 'stroke-width': 8, opacity: 0.35, 'stroke-linecap': 'round' }, holder);
    if (CHAIN) {
      /* the pull-chain switch housing bulges out of the porcelain's front */
      el('path', { d: 'M1040,486 Q1044,512 1062,516 Q1080,512 1082,486', fill: 'url(#gPorc)', stroke: INK, 'stroke-width': 4, 'stroke-linejoin': 'round' }, holder);
      el('circle', { cx: 1062, cy: 512, r: 5, fill: 'url(#gSteel)', stroke: INK, 'stroke-width': 2.5 }, holder);
    }
    el('ellipse', { cx: 1020, cy: 442, rx: 90, ry: 24, fill: '#f8f3e8', stroke: INK, 'stroke-width': 5 }, holder);
    el('ellipse', { cx: 1020, cy: 442, rx: 40, ry: 11.5, fill: 'url(#gGold)', stroke: INK, 'stroke-width': 3 }, holder);
    el('path', { d: 'M986,441 Q1020,450 1054,441 M990,436 Q1020,444 1050,436', fill: 'none', stroke: '#7a5316', 'stroke-width': 1.6, opacity: 0.8 }, holder);
    for (const [x0, x1] of [[916, 952], [1088, 1124]]) el('rect', { x: x0, y: 454, width: x1 - x0, height: 24, rx: 4, fill: x0 < 1000 ? 'url(#gGold)' : 'url(#gSteel)', stroke: INK, 'stroke-width': 2.5 }, holder);
    const hx = x => R(FX + (x - 1020) * hs), hy = y => R(TOP + (y - 442) * hs);
    if (CHAIN) CHAIN_AT = { x: hx(1062), y: hy(516), len: 124 };
    TERMS = Object.assign({}, PANEL_TERMS, {
      'L1.brass': { x: hx(934), y: hy(466), kind: 'brass', label: 'BRASS', tx: hx(934) - 64, ty: hy(466) - 22, name: 'Lampholder BRASS' },
      'L1.silver': { x: hx(1106), y: hy(466), kind: 'silver', label: 'SILVER', tx: hx(1106) + 68, ty: hy(466) - 22, name: 'Lampholder SILVER' },
      'L1.g': { x: FX - 30, y: R(OC + 50), kind: 'green', label: 'GROUND', tx: FX - 44, ty: R(OC + OR + 26), name: 'Fixture box green GROUND' },
    });
    PIG_AT = { 'P.hot': [0.95, 0.55], 'P.neu': [0.95, 0.3], 'P.gnd': [0.95, 0.35], 'L1.brass': [-0.8, 0.6], 'L1.silver': [0.8, 0.6], 'L1.g': [-0.9, 0.3] };
    SWDEF = [];
    BULB = { x: FX, y: TOP - 2, s: 0.64, tip: [FX - 48, TOP - 136] };
    /* the known live source, on both jobs: the outlet, standing in a steel box
       on circuit 2, fed down its own conduit from the ceiling */
    const OX = 985, OY = 262, CX = OX - 40;
    const cg = el('g', {}, L.parts);
    el('rect', { x: CX - 10, y: -10, width: 20, height: OY + 4, fill: 'url(#gSteel)', stroke: INK, 'stroke-width': 3.5 }, cg);
    el('path', { d: `M${CX - 5},-6 V${OY - 4}`, stroke: '#f2f2ee', 'stroke-width': 2, opacity: 0.6 }, cg);
    el('rect', { x: CX - 15, y: 140, width: 30, height: 14, rx: 2, fill: 'url(#gSteel)', stroke: INK, 'stroke-width': 3 }, cg);
    el('rect', { x: CX - 16, y: OY - 12, width: 32, height: 12, rx: 2, fill: '#8c8f94', stroke: INK, 'stroke-width': 3 }, cg);
    deviceBox(OX, OY, 150, 204, [], null);
    /* ...and in it stands the outlet himself, a working receptacle: his slots,
       his ground hole and his terminal screws are the probe points (body
       coordinates, so they move with him) */
    OUTLET = { x: OX, y: OY + 196, s: 0.74 };
    REC = [
      ['X.neu', -21.5, -82, 'the outlet\'s long slot'], ['X.hot', 21.5, -83, 'the outlet\'s short slot'], ['X.gnd', 0, -55, 'the outlet\'s round ground hole'],
      ['X.hot', 61, -76, 'the outlet\'s brass screw'], ['X.neu', -61, -76, 'the outlet\'s silver screw'], ['X.gnd', 0, -24, 'the outlet\'s green screw'],
    ].map(([id, lx, ly, name]) => ({ id, lx, ly, name, x: OX, y: OY }));
    tag(CX + 50, 176, 'CKT 2', -2);
  }
  /* ---------- 1.4 on: the jobs out in the house ----------
     The power no longer starts on the panel's bars: a feed cable leaves the
     panel and comes into a box out on the job, and its conductors hang out of
     that box ("tails") to be spliced. Cables between boxes are drawn as real
     NM cable stapled to the board; what's in each one is in LEVEL.cables. */
  /* a porcelain keyless lampholder on a steel octagon box: where its screws
     are, and where the bulb stands */
  function octD(cx, cy, r) { let d = ''; for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + (i * Math.PI) / 4; d += (i ? 'L' : 'M') + R(cx + Math.cos(a) * r) + ',' + R(cy + Math.sin(a) * r); } return d + 'Z'; }
  function octLight(FX, TOP, hs = 0.8, o = {}) {
    const k = hs / 0.7, OC = TOP + 52 * k, OR = 80 * k;
    const oct = el('g', {}, L.parts);
    el('path', { d: octD(FX + 9, OC + 11, OR + 2), fill: '#140904', opacity: 0.45, filter: 'url(#softBlur)' }, oct);
    el('path', { d: octD(FX, OC, OR), fill: 'url(#gGalv)', stroke: INK, 'stroke-width': 5, 'stroke-linejoin': 'round' }, oct);
    el('path', { d: octD(FX, OC, OR), fill: 'url(#spangle)' }, oct);
    el('path', { d: octD(FX, OC, OR - 11), fill: 'none', stroke: '#f2f4f5', 'stroke-width': 2, opacity: 0.55 }, oct);
    if (o.open) el('path', { d: octD(FX, OC + 4, OR - 20), fill: 'url(#gCabIn)', stroke: INK, 'stroke-width': 3 }, oct);
    for (const [kx, ky] of o.knock || [[FX - 70, OC + 12], [FX + 70, OC + 12]]) { el('circle', { cx: kx, cy: ky, r: 10, fill: '#6c7074', stroke: INK, 'stroke-width': 2.5 }, oct); el('circle', { cx: kx, cy: ky, r: 6, fill: '#3a3d40' }, oct); }
    const holder = el('g', { transform: `translate(${R(FX - 1020 * hs)},${R(TOP - 442 * hs)}) scale(${hs})` }, L.holder);
    el('path', { d: 'M930,442 V488 Q1020,522 1110,488 V442 Z', fill: 'url(#gPorc)', stroke: INK, 'stroke-width': 5, 'stroke-linejoin': 'round' }, holder);
    el('path', { d: 'M946,454 V484', stroke: '#ffffff', 'stroke-width': 6, opacity: 0.75, 'stroke-linecap': 'round' }, holder);
    el('path', { d: 'M1094,452 V486', stroke: '#8f8676', 'stroke-width': 8, opacity: 0.35, 'stroke-linecap': 'round' }, holder);
    el('ellipse', { cx: 1020, cy: 442, rx: 90, ry: 24, fill: '#f8f3e8', stroke: INK, 'stroke-width': 5 }, holder);
    el('ellipse', { cx: 1020, cy: 442, rx: 40, ry: 11.5, fill: 'url(#gGold)', stroke: INK, 'stroke-width': 3 }, holder);
    el('path', { d: 'M986,441 Q1020,450 1054,441 M990,436 Q1020,444 1050,436', fill: 'none', stroke: '#7a5316', 'stroke-width': 1.6, opacity: 0.8 }, holder);
    for (const [x0, x1] of [[916, 952], [1088, 1124]]) el('rect', { x: x0, y: 454, width: x1 - x0, height: 24, rx: 4, fill: x0 < 1000 ? 'url(#gGold)' : 'url(#gSteel)', stroke: INK, 'stroke-width': 2.5 }, holder);
    const hx = x => R(FX + (x - 1020) * hs), hy = y => R(TOP + (y - 442) * hs);
    return { OC, OR, brass: [hx(934), hy(466)], silver: [hx(1106), hy(466)], g: [FX - 30, R(OC + 50)] };
  }
  /* a length of NM cable stapled to the board: cream sheath, ink edge, a
     highlight, a staple every so often, and a connector where it enters a box */
  function nmCable(d, staples, o = {}) {
    const g = el('g', {}, L.parts);
    el('path', { d, fill: 'none', stroke: '#1a0c05', 'stroke-width': 13, opacity: 0.22, transform: 'translate(5,7)', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    el('path', { d, fill: 'none', stroke: INK, 'stroke-width': 15, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    el('path', { d, fill: 'none', stroke: o.sheath || '#e6dcbf', 'stroke-width': 10, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    el('path', { d, fill: 'none', stroke: '#fffaea', 'stroke-width': 2.4, opacity: 0.7, transform: 'translate(-1.2,-2.4)', 'stroke-linecap': 'round' }, g);
    /* the printing on the jacket */
    el('path', { d, fill: 'none', stroke: '#8a7a58', 'stroke-width': 1.4, opacity: 0.6, 'stroke-dasharray': '3 9 14 30' }, g);
    for (const [x, y, a = 0] of staples || []) {
      const s = el('g', { transform: `translate(${x},${y}) rotate(${a})` }, g);
      el('path', { d: 'M-9,4 V-7 H9 V4', fill: 'none', stroke: INK, 'stroke-width': 5, 'stroke-linejoin': 'round' }, s);
      el('path', { d: 'M-9,4 V-7 H9 V4', fill: 'none', stroke: '#c4c8cc', 'stroke-width': 2.4, 'stroke-linejoin': 'round' }, s);
    }
    for (const [x, y, a = 0] of o.clamps || []) {
      const c = el('g', { transform: `translate(${x},${y}) rotate(${a})` }, g);
      el('rect', { x: -9, y: -11, width: 18, height: 22, rx: 3, fill: 'url(#gSteel)', stroke: INK, 'stroke-width': 3 }, c);
      el('path', { d: 'M-9,-4 H9 M-9,4 H9', stroke: INK, 'stroke-width': 1.6, opacity: 0.6 }, c);
    }
    if (o.tag) tag(o.tag[0], o.tag[1], o.tag[2], o.tag[3] || 0);
    return g;
  }
  /* a conductor end hanging out of a box: insulation up to the stripped end */
  const TAILCOL = { black: ['#2c2c31', '#9696a0'], white: ['#f1ead8', '#ffffff'], red: ['#c7322b', '#ff9f8a'] };
  function drawTail(tm) {
    const [fx, fy] = tm.from, dx = tm.x - fx, dy = tm.y - fy, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
    const bx = tm.x - ux * 13, by = tm.y - uy * 13, bend = tm.bend == null ? 0.25 : tm.bend;
    const cx = (fx + bx) / 2 - uy * d * bend, cy = (fy + by) / 2 + ux * d * bend;
    const path = `M${R(fx)},${R(fy)} Q${R(cx)},${R(cy)} ${R(bx)},${R(by)}`;
    const g = el('g', {}, L.plates);
    el('path', { d: path, fill: 'none', stroke: '#1a0c05', 'stroke-width': 9, opacity: 0.22, transform: 'translate(5,8)', 'stroke-linecap': 'round' }, g);
    if (tm.wire === 'bare') {
      el('path', { d: path, fill: 'none', stroke: INK, 'stroke-width': 6, 'stroke-linecap': 'round' }, g);
      el('path', { d: path, fill: 'none', stroke: '#d98a4a', 'stroke-width': 3.2, 'stroke-linecap': 'round' }, g);
    } else {
      const c = TAILCOL[tm.wire] || TAILCOL.black;
      el('path', { d: path, fill: 'none', stroke: INK, 'stroke-width': 12, 'stroke-linecap': 'round' }, g);
      el('path', { d: path, fill: 'none', stroke: c[0], 'stroke-width': 7.5, 'stroke-linecap': 'round' }, g);
      el('path', { d: path, fill: 'none', stroke: c[1], 'stroke-width': 2.2, opacity: 0.7, transform: 'translate(-1,-2)', 'stroke-linecap': 'round' }, g);
    }
    /* the bare copper end */
    el('path', { d: `M${R(bx)},${R(by)} L${R(tm.x)},${R(tm.y)}`, stroke: INK, 'stroke-width': 6.4, 'stroke-linecap': 'round' }, g);
    el('path', { d: `M${R(bx)},${R(by)} L${R(tm.x)},${R(tm.y)}`, stroke: '#d98a4a', 'stroke-width': 3.4, 'stroke-linecap': 'round' }, g);
    el('path', { d: `M${R(bx)},${R(by)} L${R(tm.x)},${R(tm.y)}`, stroke: '#ffd6ae', 'stroke-width': 1.1, opacity: 0.9, transform: 'translate(-.6,-.8)' }, g);
  }
  /* 1.4: the switch loop. The light is up on the right, in a steel octagon box;
     the feed comes over from the panel into the light's box; an old 2-wire
     cable runs from there down to the switch box on the left */
  function stageLoop() {
    /* left to right, the way the power goes: panel, feed, the light's box,
       the old loop, the switch */
    const FX = 600, TOP = 292, ol = octLight(FX, TOP, 0.8);
    /* the switch, in its steel box over on the right */
    const SX = 960;
    deviceBox(SX, 300, 112, 216, [[SX - 98, SX - 50, 346], [SX + 50, SX + 98, 346]], [SX + 72, 520]);
    /* the feed: out of the panel's side, along under the top of the board,
       and into the light's box through a connector at its left */
    const KY = R(ol.OC + 12);
    nmCable(`M312,196 C380,196 430,200 440,250 C448,300 470,${KY} ${FX - 78},${KY}`, [[404, 200, 20], [446, 296, 78]], { clamps: [[316, 196, 90], [FX - 76, KY, 90]], tag: [420, 160, 'FEED  14/2', -1.5] });
    /* the old switch loop: out of the right of the light's box, up and over,
       down into the top of the switch box */
    nmCable(`M${FX + 78},${KY} C770,${KY + 6} 776,250 860,250 C920,250 ${SX},254 ${SX},288`, [[790, 268, 40], [904, 250, 2]], { sheath: '#d8cba6', clamps: [[FX + 76, KY, -90], [SX, 290, 0]], tag: [860, 218, 'OLD 2-WIRE LOOP', 1.5] });
    /* the feed's three conductors hang out of the bottom of the box to be spliced */
    const cl = [FX + 24, R(ol.OC + 36)];
    TERMS = {
      'P.hot': { x: FX + 104, y: R(ol.OC + 70), kind: 'tail', wire: 'black', from: cl, bend: -0.25, nut: true, name: 'Feed black (power in)' },
      'P.neu': { x: FX + 122, y: R(ol.OC + 112), kind: 'tail', wire: 'white', from: [cl[0] + 4, cl[1] + 4], bend: -0.2, nut: true, name: 'Feed white' },
      'P.gnd': { x: FX + 92, y: R(ol.OC + 146), kind: 'tail', wire: 'bare', from: [cl[0] + 8, cl[1] + 8], bend: -0.12, nut: true, name: 'Feed bare ground' },
      'S1.a': { x: SX - 80, y: 346, kind: 'brass', label: 'BRASS', tx: SX - 86, ty: 392, name: 'Switch left BRASS' },
      'S1.b': { x: SX + 80, y: 346, kind: 'brass', label: 'BRASS', tx: SX + 88, ty: 392, name: 'Switch right BRASS' },
      'S1.g': { x: SX + 78, y: 521, kind: 'green', label: 'GROUND', tx: SX + 120, ty: 482, name: 'Switch box green GROUND' },
      'L1.brass': { x: ol.brass[0], y: ol.brass[1], kind: 'brass', label: 'BRASS', tx: ol.brass[0] - 66, ty: ol.brass[1] - 22, name: 'Light BRASS' },
      'L1.silver': { x: ol.silver[0], y: ol.silver[1], kind: 'silver', label: 'SILVER', tx: ol.silver[0] + 16, ty: ol.silver[1] - 54, name: 'Light SILVER' },
      'L1.g': { x: ol.g[0], y: ol.g[1], kind: 'green', label: 'GROUND', tx: ol.g[0] - 70, ty: ol.g[1] + 34, name: 'Light box green GROUND' },
    };
    PIG_AT = { 'S1.a': [-0.6, 0.8], 'S1.b': [0.7, 0.7], 'S1.g': [-0.95, -0.2], 'L1.brass': [-0.8, 0.6], 'L1.silver': [0.85, 0.5], 'L1.g': [-0.8, 0.6] };
    SWDEF = [{ id: 'S1', x: SX, y: 504, s: 0.6, labels: true, tip: [SX - 14, 356] }];
    BULB = { x: FX, y: TOP - 2, s: 0.64, tip: [FX - 48, TOP - 136] };
    el('text', { x: 1000, y: 168, 'text-anchor': 'middle', 'font-family': 'Rye, Georgia, serif', 'font-size': 17, 'letter-spacing': 3, fill: '#7d4f24', opacity: 0.6 }, L.board).textContent = 'PRACTICE BOARD No. 4';
    el('text', { x: 1000, y: 190, 'text-anchor': 'middle', 'font-family': 'Special Elite, monospace', 'font-size': 13, 'letter-spacing': 3, fill: '#7d4f24', opacity: 0.6 }, L.board).textContent = 'THE OLD HOUSE';
  }
  /* a porcelain keyless lampholder on a turned wooden block (no metal box, so
     nothing to ground), like 1.3's: where its screws are */
  function blockLight(cx, Y, s) {
    const holder = el('g', { transform: `translate(${R(cx - 1020 * s)},${R(Y - 442 * s)}) scale(${s})` }, L.holder);
    el('ellipse', { cx: 1028, cy: 516, rx: 120, ry: 22, fill: '#140904', opacity: 0.35, filter: 'url(#softBlur)' }, holder);
    el('path', { d: 'M912,456 V504 Q1020,544 1128,504 V456 Z', fill: '#8a5a30', stroke: INK, 'stroke-width': 4, 'stroke-linejoin': 'round' }, holder);
    el('path', { d: 'M920,500 Q1020,534 1120,500', fill: 'none', stroke: '#c79566', 'stroke-width': 2.5, opacity: 0.6 }, holder);
    el('ellipse', { cx: 1020, cy: 456, rx: 108, ry: 26, fill: '#a26e3e', stroke: INK, 'stroke-width': 4 }, holder);
    el('path', { d: 'M930,442 V488 Q1020,522 1110,488 V442 Z', fill: 'url(#gPorc)', stroke: INK, 'stroke-width': 5, 'stroke-linejoin': 'round' }, holder);
    el('path', { d: 'M946,454 V484', stroke: '#ffffff', 'stroke-width': 6, opacity: 0.75, 'stroke-linecap': 'round' }, holder);
    el('path', { d: 'M1094,452 V486', stroke: '#8f8676', 'stroke-width': 8, opacity: 0.35, 'stroke-linecap': 'round' }, holder);
    el('ellipse', { cx: 1020, cy: 442, rx: 90, ry: 24, fill: '#f8f3e8', stroke: INK, 'stroke-width': 5 }, holder);
    el('ellipse', { cx: 1020, cy: 442, rx: 40, ry: 11.5, fill: 'url(#gGold)', stroke: INK, 'stroke-width': 3 }, holder);
    el('path', { d: 'M986,441 Q1020,450 1054,441 M990,436 Q1020,444 1050,436', fill: 'none', stroke: '#7a5316', 'stroke-width': 1.6, opacity: 0.8 }, holder);
    for (const [x0, x1] of [[916, 952], [1088, 1124]]) el('rect', { x: x0, y: 454, width: x1 - x0, height: 24, rx: 4, fill: x0 < 1000 ? 'url(#gGold)' : 'url(#gSteel)', stroke: INK, 'stroke-width': 2.5 }, holder);
    const hx = x => R(cx + (x - 1020) * s), hy = y => R(Y + (y - 442) * s);
    return { brass: [hx(934), hy(466)], silver: [hx(1106), hy(466)] };
  }
  /* 1.5: one switch, two lights. The panel's on the left as usual, the switch
     in a steel box, and two porcelain lampholders on wooden blocks side by side */
  function stageTwo() {
    const SX = 540;
    deviceBox(SX, 300, 112, 216, [[SX - 98, SX - 50, 346], [SX + 50, SX + 98, 346]], [SX + 72, 520]);
    const a = blockLight(800, 440, 0.68), b = blockLight(1010, 440, 0.68);
    TERMS = Object.assign({}, PANEL_TERMS, {
      'S1.a': { x: SX - 80, y: 346, kind: 'brass', label: 'BRASS', tx: SX - 86, ty: 392, name: 'Switch left BRASS' },
      'S1.b': { x: SX + 80, y: 346, kind: 'brass', label: 'BRASS', tx: SX + 88, ty: 392, name: 'Switch right BRASS' },
      'S1.g': { x: SX + 78, y: 521, kind: 'green', label: 'GROUND', tx: SX + 150, ty: 520, name: 'Switch box green GROUND' },
      'L1.brass': { x: a.brass[0], y: a.brass[1], kind: 'brass', label: 'BRASS', tx: a.brass[0] - 8, ty: a.brass[1] + 44, name: 'First light BRASS' },
      'L1.silver': { x: a.silver[0], y: a.silver[1], kind: 'silver', label: 'SILVER', tx: a.silver[0] + 4, ty: a.silver[1] + 44, name: 'First light SILVER' },
      'L2.brass': { x: b.brass[0], y: b.brass[1], kind: 'brass', label: 'BRASS', tx: b.brass[0] - 4, ty: b.brass[1] + 44, name: 'Second light BRASS' },
      'L2.silver': { x: b.silver[0], y: b.silver[1], kind: 'silver', label: 'SILVER', tx: b.silver[0] + 6, ty: b.silver[1] + 44, name: 'Second light SILVER' },
    });
    PIG_AT = { 'P.hot': [0.95, 0.55], 'P.neu': [0.95, 0.3], 'P.gnd': [0.95, 0.35], 'S1.a': [-0.6, 0.8], 'S1.b': [0.7, 0.7], 'S1.g': [0.95, -0.2], 'L1.brass': [-0.5, -0.85], 'L1.silver': [0.4, -0.9], 'L2.brass': [-0.4, -0.9], 'L2.silver': [0.5, -0.85] };
    SWDEF = [{ id: 'S1', x: SX, y: 504, s: 0.6, labels: true, tip: [SX - 14, 356] }];
    BULB = { x: 800, y: 438, s: 0.66, tip: [752, 300] };
    BULB2 = { x: 1010, y: 438, s: 0.66, tip: [962, 300] };
    el('text', { x: 905, y: 168, 'text-anchor': 'middle', 'font-family': 'Rye, Georgia, serif', 'font-size': 17, 'letter-spacing': 3, fill: '#7d4f24', opacity: 0.6 }, L.board).textContent = 'PRACTICE BOARD No. 5';
    el('text', { x: 905, y: 190, 'text-anchor': 'middle', 'font-family': 'Special Elite, monospace', 'font-size': 13, 'letter-spacing': 3, fill: '#7d4f24', opacity: 0.6 }, L.board).textContent = 'TWO LIGHTS, ONE SWITCH';
  }
  /* 1.6: Sparky Junction stands on the bench against the board, the feed
     coming into his left side, both switches standing in his gangs and the
     splices in his open belly; a 14/2 runs from him to each light */
  function stageSparky() {
    const SXC = 535;
    SPARKY = { x: SXC, y: 590, s: 1 };
    /* what shows through his openings: the inside of a steel box */
    const inside = el('g', {}, L.parts);
    el('rect', { x: SXC - 146, y: 280, width: 292, height: 228, rx: 8, fill: 'url(#gCabIn)', stroke: INK, 'stroke-width': 3 }, inside);
    el('path', { d: `M${SXC - 140},290 H${SXC + 140}`, stroke: '#000', 'stroke-width': 8, opacity: 0.3 }, inside);
    for (const [kx, ky] of [[SXC - 100, 360], [SXC, 360], [SXC + 100, 360], [SXC - 40, 470], [SXC + 60, 470]]) { el('circle', { cx: kx, cy: ky, r: 13, fill: 'none', stroke: '#55595c', 'stroke-width': 2.4 }, inside); el('circle', { cx: kx, cy: ky, r: 7, fill: 'none', stroke: '#55595c', 'stroke-width': 2 }, inside); }
    /* the green screw's welded tab in his belly */
    el('path', { d: `M${SXC + 86},468 H${SXC + 124} V498 H${SXC + 86} Z`, fill: 'url(#gGalv)', stroke: INK, 'stroke-width': 2.6 }, inside);
    const a = octLight(800, 300, 0.7), b = octLight(1030, 300, 0.7);
    /* the feed, down the left edge of the board into his side */
    nmCable(`M312,196 C350,196 372,204 372,244 V440 Q372,478 ${SXC - 150},478`, [[372, 300, 90], [372, 400, 90]], { clamps: [[SXC - 146, 478, 90]], tag: [430, 160, 'FEED  14/2', -1.5] });
    /* a 14/2 out of his right side to each light */
    nmCable(`M${SXC + 150},330 C${SXC + 178},330 704,364 ${800 - 72},364`, [], { clamps: [[SXC + 147, 330, 90], [800 - 70, 364, 90]], tag: [660, 252, '14/2', 2] });
    nmCable(`M${SXC + 150},470 C760,476 900,486 980,476 C1010,472 1030,454 1030,${R(b.OC + 74)}`, [[820, 480, 6], [930, 482, -4]], { clamps: [[SXC + 147, 470, 90], [1030, R(b.OC + 72), 0]], tag: [880, 508, '14/2', -1.5] });
    const cl = [SXC - 132, 478];
    TERMS = {
      'P.hot': { x: SXC - 88, y: 468, kind: 'tail', wire: 'black', from: cl, bend: 0.2, nut: true, name: 'Feed black (power in)' },
      'P.neu': { x: SXC - 50, y: 488, kind: 'tail', wire: 'white', from: [cl[0] + 2, cl[1] + 4], bend: -0.15, nut: true, name: 'Feed white' },
      'P.gnd': { x: SXC - 12, y: 470, kind: 'tail', wire: 'bare', from: [cl[0] + 4, cl[1] + 8], bend: 0.12, nut: true, name: 'Feed bare ground' },
      'J.g': { x: SXC + 105, y: 483, kind: 'green', label: 'GROUND', tx: SXC + 104, ty: 532, name: 'Sparky\'s green GROUND screw' },
      'S1.a': { x: SXC - 121, y: 318, kind: 'brass', label: 'BRASS', tx: 350, ty: 318, name: 'Left switch top BRASS' },
      'S1.b': { x: SXC - 121, y: 404, kind: 'brass', label: 'BRASS', tx: 350, ty: 404, name: 'Left switch bottom BRASS' },
      'S2.a': { x: SXC + 121, y: 318, kind: 'brass', label: 'BRASS', tx: SXC + 190, ty: 300, name: 'Right switch top BRASS' },
      'S2.b': { x: SXC + 121, y: 404, kind: 'brass', label: 'BRASS', tx: SXC + 190, ty: 420, name: 'Right switch bottom BRASS' },
      'L1.brass': { x: a.brass[0], y: a.brass[1], kind: 'brass', label: 'BRASS', tx: a.brass[0] - 52, ty: a.brass[1] - 30, name: 'First light BRASS' },
      'L1.silver': { x: a.silver[0], y: a.silver[1], kind: 'silver', label: 'SILVER', tx: a.silver[0] + 46, ty: a.silver[1] - 18, name: 'First light SILVER' },
      'L1.g': { x: a.g[0], y: a.g[1], kind: 'green', label: 'GROUND', tx: a.g[0], ty: a.g[1] + 48, name: 'First light box green GROUND' },
      'L2.brass': { x: b.brass[0], y: b.brass[1], kind: 'brass', label: 'BRASS', tx: b.brass[0] - 30, ty: b.brass[1] - 48, name: 'Second light BRASS' },
      'L2.silver': { x: b.silver[0], y: b.silver[1], kind: 'silver', label: 'SILVER', tx: b.silver[0] + 4, ty: b.silver[1] - 48, name: 'Second light SILVER' },
      'L2.g': { x: b.g[0], y: b.g[1], kind: 'green', label: 'GROUND', tx: b.g[0] + 60, ty: b.g[1] + 40, name: 'Second light box green GROUND' },
    };
    PIG_AT = { 'J.g': [-0.98, 0.1], 'S1.a': [0.5, 0.85], 'S1.b': [0.5, 0.85], 'S2.a': [-0.5, 0.85], 'S2.b': [-0.5, 0.85], 'L1.brass': [-0.8, 0.6], 'L1.silver': [0.8, 0.6], 'L1.g': [-0.8, 0.6], 'L2.brass': [-0.8, 0.6], 'L2.silver': [0.8, 0.6], 'L2.g': [0.8, 0.6] };
    SWDEF = [{ id: 'S1', x: SXC - 66, y: 436, s: 0.48, labels: false, tip: [SXC - 80, 330] }, { id: 'S2', x: SXC + 66, y: 436, s: 0.48, labels: false, tip: [SXC + 52, 330] }];
    BULB = { x: 800, y: 298, s: 0.58, tip: [758, 170] };
    BULB2 = { x: 1030, y: 298, s: 0.58, tip: [988, 170] };
  }
  const fillOf = { brass: 'url(#gScrewBrass)', silver: 'url(#gScrewSilver)', dark: 'url(#gScrewDark)', green: 'url(#gScrewGreen)' };
  for (const [id, tm] of Object.entries(TERMS)) {
    if (tm.label) tag(tm.tx, tm.ty, tm.label, id.charCodeAt(3) % 2 ? -2.5 : 2);
    const g = el('g', { class: 'term', 'data-term': id, tabindex: 0, role: 'button', 'aria-label': `${tm.name} ${tm.kind === 'tail' ? '(a conductor end, spliced with a wire nut)' : tm.kind === 'splice' ? '(a splice: wire nut)' : 'terminal'}` }, L.terms);
    tm.ring = el('circle', { cx: tm.x, cy: tm.y, r: 23, fill: 'none', stroke: '#ffe27a', 'stroke-width': 4, opacity: 0 }, g);
    if (tm.kind === 'tail') drawTail(tm);
    else if (tm.kind === 'splice') {
      /* an empty spot in the box where conductors can be spliced */
      el('circle', { cx: tm.x, cy: tm.y, r: 13, fill: '#1a0c05', opacity: 0.25 }, L.plates);
      el('circle', { cx: tm.x, cy: tm.y, r: 13, fill: 'none', stroke: '#e8c79a', 'stroke-width': 2, opacity: 0.55, 'stroke-dasharray': '4 4' }, L.plates);
    } else {
      el('ellipse', { cx: tm.x + 2.5, cy: tm.y + 4, rx: 17, ry: 15, fill: '#1a0c05', opacity: 0.35 }, L.plates);
      el('circle', { cx: tm.x, cy: tm.y, r: 16, fill: fillOf[tm.kind === 'dark' ? 'brass' : tm.kind === 'green' ? 'silver' : tm.kind], stroke: INK, 'stroke-width': 2.5 }, L.plates);
      el('circle', { cx: tm.x, cy: tm.y, r: 11.5, fill: fillOf[tm.kind], stroke: INK, 'stroke-width': 3.2 }, L.heads);
      tm.slot = el('path', { d: 'M-7,0 H7', stroke: INK, 'stroke-width': 2.8, 'stroke-linecap': 'round' }, L.heads);
      el('path', { d: `M${tm.x - 7},${tm.y - 4} A8,8 0 0,1 ${tm.x - 1},${tm.y - 8}`, fill: 'none', stroke: '#fff', 'stroke-width': 1.8, opacity: 0.85, 'stroke-linecap': 'round' }, L.heads);
    }
    el('circle', { cx: tm.x, cy: tm.y, r: HIT, fill: 'transparent', class: 'hit' }, g);
    tm.g = g; tm.rot = (id.length * 37) % 180 - 60; tm.spin = -9; tm.spinDir = 1;
  }
  /* the outlet's slots, ground hole and screws are probe points (they only take
     the tester's probes, never a wire): each is focusable, with a ring that
     shows while the tester's in hand. They ride on him, so render() moves them */
  if (REC) {
    REC.forEach((p, i) => {
      const g = el('g', { class: 'term probe', 'data-probe': i, tabindex: 0, role: 'button', 'aria-label': `Circuit 2 outlet: ${p.name.replace('the outlet\'s ', '')} (tester probe point)` }, L.terms);
      p.ring = el('circle', { r: 14, fill: 'none', stroke: '#ffe27a', 'stroke-width': 3.5, opacity: 0 }, g);
      p.hit = el('circle', { r: TOUCH ? 16 : 12, fill: 'transparent', class: 'hit' }, g);
    });
  }
  /* whose screw is it: a switch's id ('S1', 'S2'), 'bulb' or 'panel' */
  const ownerOf = id => { const c = id.split('.')[0]; return c === 'L1' ? 'bulb' : c === 'P' ? 'panel' : c; };
  const isSw = who => SWS.some(s => s.id === who);
  const talker = id => (isSw(ownerOf(id)) ? ownerOf(id) : lampOf(id) && lampOf(id).id === 'L2' ? 'L2' : 'bulb');

  /* ---------- the cast ---------- */
  const scene = { defs: App.defs, layer: L.cast, get boil() { return App.boil; }, lamps: [LX], get dark() { return now > ev.black0 && now < ev.black1; } };
  /* a single-pole switch is ON with its toggle up; a 3-way has no ON or OFF, only
     UP (state 0) and DOWN (state 1) */
  const swType = id => LEVEL.components.find(c => c.id === id).type;
  const leverOf = (id, s) => (swType(id) === 'sp' ? (s ? 1 : -1) : (s ? -1 : 1));
  /* 1.6: Sparky Junction goes on first, so the switches stand in front of him */
  const sparky = SPARKY ? T.makeJunction(scene, SPARKY.x, SPARKY.y, SPARKY.s) : null;
  if (sparky) sparky.root.setAttribute('class', 'toon clicky');
  const SWS = SWDEF.map(d => Object.assign({ toon: T.makeSwitch(scene, d.x, d.y, d.s, { labels: d.labels, pose: { lever: leverOf(d.id, 0) } }) }, d));
  const swT = id => (SWS.find(s => s.id === id) || SWS[0]).toon;
  const sw = SWS[0] ? SWS[0].toon : null;
  /* 1.1: the outlet from the menu, standing in his box on CKT 2 */
  const outlet = OUTLET ? T.makeOutlet(scene, OUTLET.x, OUTLET.y, OUTLET.s, { probe: true }) : null;
  if (outlet) { outlet.root.setAttribute('class', 'toon clicky'); Object.assign(outlet.cfg.life, { breath: 3.1, bounce: 4, beatMul: 0.73, beatOffset: 0.4, sway: 3.4, lean: 2.4, nervous: 0.2 }); }
  const bulb = T.makeBulb(scene, BULB.x, BULB.y, BULB.s);
  /* jobs with two lights: the second is another bulb, with his own temper
     (LAMPS: every light on the board, L1 the hero first) */
  const bulb2 = BULB2 ? T.makeBulb(scene, BULB2.x, BULB2.y, BULB2.s) : null;
  const LAMPS = [{ id: 'L1', t: bulb, def: BULB }].concat(bulb2 ? [{ id: 'L2', t: bulb2, def: BULB2 }] : []);
  for (const l of LAMPS) { l.t.lampId = l.id; l.t.lit = 0; l.t.light = 0; }
  const lampOf = id => (LAMPS.find(l => l.id === String(id).split('.')[0]) || null);
  if (bulb2) {
    bulb2.root.setAttribute('class', 'toon clicky');
    /* the second bulb: slow, heavy-lidded and unbothered, until he isn't */
    Object.assign(bulb2.cfg.life, { breath: 4.4, bounce: 2, beatMul: 0.67, beatOffset: 0.55, sway: 1.4, lean: 1.6, nervous: 0.12 });
    Object.assign(bulb2.base, { lid: 0.42, browTilt: 0.2, browRaise: 0.1, pupil: 0.9, mouthOpen: 0.15 });
  }
  /* 1.2: the beaded pull chain hanging off the lampholder, with a brass pull */
  let chainG = null, chainBeads = null, chainPullG = null;
  if (CHAIN_AT) {
    chainG = el('g', { class: 'clicky', role: 'button', tabindex: 0, 'aria-label': 'Pull chain: pull it to switch the light (S)' }, L.cast);
    el('rect', { x: CHAIN_AT.x - 22, y: CHAIN_AT.y, width: 44, height: CHAIN_AT.len + 40, fill: 'transparent' }, chainG);
    chainBeads = el('path', { fill: 'none', stroke: INK, 'stroke-width': 5.5, 'stroke-linecap': 'round', 'stroke-dasharray': '0.1 7' }, chainG);
    el('path', { d: `M${CHAIN_AT.x},${CHAIN_AT.y} v${CHAIN_AT.len}`, fill: 'none', stroke: 'transparent' }, chainG);
    chainPullG = el('g', {}, chainG);
    el('path', { d: 'M-7,0 Q-9,18 0,24 Q9,18 7,0 Z', fill: 'url(#gGold)', stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round' }, chainPullG);
    el('path', { d: 'M-3,5 Q-4,14 0,18', fill: 'none', stroke: '#fff6d8', 'stroke-width': 1.8, opacity: 0.8, 'stroke-linecap': 'round' }, chainPullG);
  }
  /* the Inspector is the old multimeter from the menu, in his peaked cap. He
     stands on the bench, in front of everything on the wall, so he lives in the
     foreground layer; his wrapper lets him spin through the air and flash like
     an X-ray when he gets zapped */
  const inspWrap = el('g', {}, L.fore);
  const insp = T.makeMeter({ defs: App.defs, layer: inspWrap, get boil() { return App.boil; }, lamps: [LX], get dark() { return now > ev.black0 && now < ev.black1; } }, OFFX, 594, 0.62);
  for (const s of SWS) s.toon.root.setAttribute('class', 'toon clicky');
  bulb.root.setAttribute('class', 'toon clicky');
  insp.root.style.display = 'none';
  /* each keeps its own rhythm: the bulb droops and trembles, the switch fidgets,
     the Inspector barely moves at all. On the stairs, the switch at the foot is a
     jittery little upstart; the one at the head is slow, stiff and superior */
  Object.assign(bulb.cfg.life, { breath: 3.6, bounce: 3, beatMul: 0.41, beatOffset: 0.3, sway: 2, lean: 3.2, nervous: 0.34 });
  if (sw) Object.assign(sw.cfg.life, { breath: 2.2, bounce: 4, beatMul: 0.87, beatOffset: 0.15, sway: 2.4, lean: 2.2, nervous: 0.26 });
  if (SWS[1]) {
    Object.assign(SWS[0].toon.cfg.life, { breath: 1.7, bounce: 5, beatMul: 1.19, beatOffset: 0.6, sway: 3.2, lean: 2.6, nervous: 0.42 });
    Object.assign(SWS[1].toon.cfg.life, { breath: 3.9, bounce: 2, beatMul: 0.53, beatOffset: 0.05, sway: 1.4, lean: 1.2, nervous: 0.12 });
    Object.assign(SWS[1].toon.base, { browTilt: -0.2, browRaise: 0.1, lid: 0.42, pupil: 0.8 });
  }
  /* Level 2's heckler: the old glass fuse from the menu, retired to the bench
     under the panel, who remembers when HE was the one who stopped the fire */
  let fuse = null;
  if (ID !== 1) {
    fuse = T.makeFuse({ defs: App.defs, layer: L.fore, get boil() { return App.boil; }, lamps: [LX], get dark() { return now > ev.black0 && now < ev.black1; } }, LEVEL.fuseX || (ID === 2 ? 236 : 266), 594, 0.55);
    Object.assign(fuse.cfg.life, { breath: 1.5, bounce: 3, beatMul: 1.31, beatOffset: 0.85, sway: 2, lean: 3, nervous: 0.3 });
    fuse.root.setAttribute('class', 'toon clicky');
    L.fore.insertBefore(fuse.root, inspWrap);
  }
  /* 1.1 and 1.2: the toolbox on the bench. Red enamel steel, a bail handle on a
     hinged lid, the tester and the strippers inside. Click it (or press T) to
     take the tester out; put it back and the lid drops shut. The old fuse likes
     to lean on it, fingers over the rim... */
  let TB = null;
  if (LEVEL.toolbox) {
    TB = { x0: 50, x1: 206, rim: 548, hinge: [48, 548], len: 160, ang: 0, vel: 0, want: 0, peek: false, closeAt: -9, pinch: -9, ouch: -9, bitten: false, shy: -9, prank: -9, prankAt: 1e9 };
    const body = el('g', { class: 'clicky toolbox', role: 'button', tabindex: 0, 'aria-label': 'Toolbox: take out the tester, or put it back (T)' }, L.bench);
    el('ellipse', { cx: 128, cy: 596, rx: 88, ry: 7, fill: '#1a0c05', opacity: 0.4 }, body);
    /* the open top: the dark inside, then whatever's still in there, then the front */
    TB.inside = el('path', { d: 'M54,548 L60,536 H198 L204,548 Z', fill: '#2a1810', stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round', opacity: 0 }, body);
    TB.strip = el('g', { opacity: 0 }, body);
    el('path', { d: 'M86,552 L92,512 L100,512 L98,552 Z M100,552 L106,514 L114,516 L108,552 Z', fill: '#c7322b', stroke: INK, 'stroke-width': 2.8, 'stroke-linejoin': 'round' }, TB.strip);
    el('path', { d: 'M92,512 L96,496 L104,498 L106,514 Z', fill: 'url(#gSteel)', stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round' }, TB.strip);
    TB.tool = el('g', { opacity: 0 }, body);
    el('path', { d: 'M150,552 C146,530 176,532 170,512', fill: 'none', stroke: INK, 'stroke-width': 5, 'stroke-linecap': 'round' }, TB.tool);
    el('path', { d: 'M150,552 C146,530 176,532 170,512', fill: 'none', stroke: '#c7322b', 'stroke-width': 2.6, 'stroke-linecap': 'round' }, TB.tool);
    el('rect', { x: 132, y: 506, width: 14, height: 46, rx: 6, fill: 'url(#gPen)', stroke: INK, 'stroke-width': 2.8 }, TB.tool);
    el('circle', { cx: 139, cy: 520, r: 4, fill: '#6a3a22', stroke: INK, 'stroke-width': 1.6 }, TB.tool);
    el('rect', { x: 164, y: 500, width: 9, height: 30, rx: 3, fill: '#c7322b', stroke: INK, 'stroke-width': 2.4, transform: 'rotate(10 168 515)' }, TB.tool);
    el('rect', { x: 176, y: 504, width: 9, height: 30, rx: 3, fill: '#2c2c31', stroke: INK, 'stroke-width': 2.4, transform: 'rotate(16 180 519)' }, TB.tool);
    el('path', { d: 'M50,548 H206 L203,591 Q203,596 198,596 H58 Q53,596 53,591 Z', fill: '#b8322a', stroke: INK, 'stroke-width': 4, 'stroke-linejoin': 'round' }, body);
    el('path', { d: 'M53,582 H203', stroke: '#7a1c14', 'stroke-width': 6, opacity: 0.55 }, body);
    el('path', { d: 'M58,555 H198', stroke: '#ff9f8a', 'stroke-width': 2.4, opacity: 0.55, 'stroke-linecap': 'round' }, body);
    for (const [x, y] of [[60, 556], [196, 556], [62, 586], [194, 586]]) el('circle', { cx: x, cy: y, r: 2.4, fill: '#e8c7a0', stroke: INK, 'stroke-width': 1 }, body);
    el('text', { x: 100, y: 578, 'font-family': 'Rye, Georgia, serif', 'font-size': 10.5, 'letter-spacing': 2, fill: '#fbeac0', opacity: 0.9 }, body).textContent = 'TOOLS';
    el('rect', { x: 120, y: 548, width: 16, height: 14, rx: 2, fill: 'url(#gGold)', stroke: INK, 'stroke-width': 2.4 }, body);
    el('circle', { cx: 128, cy: 556, r: 2, fill: INK }, body);
    TB.hit = el('rect', { x: 44, y: 500, width: 170, height: 100, fill: 'transparent' }, body);
    /* the lid lives in front, with the characters, so it can come down on a hand */
    const lid = el('g', { class: 'clicky toolbox' }, L.fore);
    L.fore.insertBefore(lid, inspWrap);
    el('path', { d: 'M-2,0 V-12 Q-2,-20 6,-20 H152 Q160,-20 160,-12 V0 Z', fill: '#c23a2c', stroke: INK, 'stroke-width': 4, 'stroke-linejoin': 'round' }, lid);
    el('path', { d: 'M6,-15 H150', stroke: '#ff9f8a', 'stroke-width': 2.4, opacity: 0.6, 'stroke-linecap': 'round' }, lid);
    el('path', { d: 'M-2,-4 H160', stroke: '#7a1c14', 'stroke-width': 3, opacity: 0.6 }, lid);
    el('path', { d: 'M54,-20 Q54,-36 80,-36 Q106,-36 106,-20', fill: 'none', stroke: INK, 'stroke-width': 7, 'stroke-linecap': 'round' }, lid);
    el('path', { d: 'M54,-20 Q54,-36 80,-36 Q106,-36 106,-20', fill: 'none', stroke: '#b4b8bb', 'stroke-width': 3.5, 'stroke-linecap': 'round' }, lid);
    for (const x of [54, 106]) el('circle', { cx: x, cy: -20, r: 3, fill: 'url(#gSteel)', stroke: INK, 'stroke-width': 1.5 }, lid);
    TB.lid = lid; TB.body = body;
    const toggle = e => { e.stopPropagation(); if (App.current === SCREEN && !busy()) setTester(!st.tester); };
    for (const g of [body, lid]) {
      g.addEventListener('click', toggle);
      g.addEventListener('pointerenter', () => { TB.peek = true; });
      g.addEventListener('pointerleave', () => { TB.peek = false; });
    }
    body.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(e); } });
  }
  /* the lid: sprung open, or dropping shut under its own weight. Coming down on
     the fuse's fingers the first time is the one thing he never sees coming. */
  const TB_OPEN = -1.62;
  function toolboxTick(dt) {
    if (!TB) return;
    const out = st.tester || !!(job && job.strip);
    if (out) TB.closeAt = now + 0.45;
    const open = out || now < TB.closeAt;
    TB.want = open ? TB_OPEN : TB.peek || now < (TB.peekT || 0) ? -0.2 : 0;
    /* once a visit, when things are quiet, the old fuse can't help himself: he
       lifts the lid for a nosy look, lets go to reach in... and it comes down
       on his fingers */
    if (!TB.bitten && TB.prank < 0 && now > TB.prankAt && !out && !open && TB.ang > -0.05 && fuse && !fuse.actions.length && App.running && !busy() && !lead && !job) TB.prank = now;
    const pu = TB.prank >= 0 ? now - TB.prank : -1;
    if (pu >= 0) {
      TB.prankAt = 1e9;
      if (pu > 0.9 && pu < 2.5) TB.want = -0.62;
      if (pu >= 2.5) { TB.prank = -9; TB.fingersIn = true; TB.want = 0; }
    }
    /* his fingers go over the rim once it's properly open, and stay till he moves */
    if (!fuseOnRim()) TB.fingersIn = false;
    else if (TB.ang < -0.9 && pu < 0) TB.fingersIn = true;
    const fingers = TB.fingersIn;
    if (TB.want < TB.ang - 0.01 || TB.want < -0.1) {
      /* opening (or held open): a sprung hinge */
      TB.vel += ((TB.want - TB.ang) * 140 - TB.vel * 16) * dt;
    } else {
      /* shutting: it falls */
      TB.vel += 34 * dt;
      /* he always snatches his hand back in time... after the first time */
      if (fingers && TB.bitten && TB.ang > -1.2) TB.shy = now + 1.6;
    }
    TB.ang += TB.vel * dt;
    const stop = fingers && !TB.bitten ? -0.1 : 0;
    if (TB.ang > stop) {
      const hit = TB.vel;
      TB.ang = stop;
      if (stop < 0 && hit > 4) pinchFuse(hit);
      else if (stop < 0) {
        /* only a nudge: he feels it and slides his hand out */
        TB.shy = now + 1.4; TB.fingersIn = false; A.sfx.tick(); particles.bonk(TB.hinge[0] + TB.len - 8, TB.rim - 4, 0.3);
        const m = K.swFlinch(); fuse.play(m.k, m.d, { slot: 'small' });
      } else if (hit > 1.8) { A.sfx.clunk(false); particles.bonk(TB.hinge[0] + TB.len - 6, TB.rim - 2, 0.35 + Math.min(0.5, hit / 20)); }
      TB.vel = hit > 1.8 ? -hit * 0.22 : 0;
    }
    TB.lid.setAttribute('transform', `translate(${TB.hinge[0]},${TB.hinge[1]}) rotate(${R(TB.ang * 57.3)})`);
    const o = clamp((-TB.ang - 0.3) / 0.6);
    TB.inside.setAttribute('opacity', R(o * 100) / 100);
    TB.tool.setAttribute('opacity', st.tester ? 0 : R(o * 100) / 100);
    TB.strip.setAttribute('opacity', job && job.strip ? 0 : R(o * 100) / 100);
  }
  /* is the fuse leaning on the toolbox with his fingers over the rim? */
  const fuseOnRim = () => !!(TB && fuse && fuse.root.style.display !== 'none' && now > TB.shy && now > TB.ouch && !fuse.actions.some(a => a.slot === 'big'));
  function pinchFuse(hit) {
    TB.bitten = true; TB.ouch = now + 2.4; TB.fingersIn = false;
    const x = TB.hinge[0] + TB.len - 8, y = TB.rim - 4;
    particles.bonk(x, y, 0.9); particles.spark(x, y, 5, 0.25);
    A.sfx.clack(); A.sfx.squeak(); setTimeout(() => A.sfx.ahh(), 120);
    ev.shake = now - 0.45;
    const m = K.ouch(); fuse.play(m.k, m.d);
    /* hand yanked out: the lid falls the last little way */
    setTimeout(() => { if (TB) TB.vel = Math.max(TB.vel, 3); }, 260);
    setTimeout(() => { if (App.current === SCREEN && !st.inspecting) say('YEOWCH!', 1.4, 'fuse'); }, 150);
  }
  Object.assign(insp.cfg.life, { breath: 4.2, bounce: 0, sway: 0.8, lean: 0.5, nervous: 0.02 });
  {
    /* hair that only shows when it's standing on end */
    insp.hair = el('path', { d: 'M-40,-250 L-52,-300 M-24,-252 L-26,-318 M-8,-254 L2,-324 M10,-254 L24,-318 M28,-252 L50,-300 M44,-248 L66,-280', fill: 'none', stroke: INK, 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0 }, insp.bodyG);
    const cap = el('g', {}, insp.bodyG);
    insp.cap = cap;
    el('path', { d: 'M-50,-246 Q-46,-292 0,-296 Q46,-292 50,-246 Z', fill: '#2c3a52', stroke: INK, 'stroke-width': 4.5, 'stroke-linejoin': 'round' }, cap);
    el('path', { d: 'M-48,-258 H48', stroke: '#1a2436', 'stroke-width': 7 }, cap);
    el('path', { d: 'M-66,-244 Q0,-236 70,-246 Q72,-238 64,-234 Q0,-226 -64,-234 Q-72,-238 -66,-244 Z', fill: '#18202e', stroke: INK, 'stroke-width': 4, 'stroke-linejoin': 'round' }, cap);
    el('path', { d: 'M0,-286 L5,-276 L16,-275 L8,-268 L10,-257 L0,-263 L-10,-257 L-8,-268 L-16,-275 L-5,-276 Z', fill: 'url(#gGold)', stroke: INK, 'stroke-width': 2 }, cap);
    el('path', { d: 'M-30,-286 Q-10,-292 12,-290', fill: 'none', stroke: '#6b82a6', 'stroke-width': 4, opacity: 0.8, 'stroke-linecap': 'round' }, cap);
    const clip = el('g', { transform: 'translate(-64,-120) rotate(-10)' }, insp.bodyG);
    el('rect', { x: -26, y: -36, width: 52, height: 70, rx: 4, fill: '#9a6a3a', stroke: INK, 'stroke-width': 3.5 }, clip);
    el('rect', { x: -21, y: -28, width: 42, height: 58, fill: '#fbf1d4', stroke: INK, 'stroke-width': 2 }, clip);
    el('path', { d: 'M-16,-14 H14 M-16,-4 H14 M-16,6 H8 M-16,16 H12', stroke: '#8a9ab0', 'stroke-width': 1.6 }, clip);
    el('rect', { x: -12, y: -42, width: 24, height: 12, rx: 3, fill: 'url(#gSteel)', stroke: INK, 'stroke-width': 2.5 }, clip);
    insp.ticks = el('path', { d: '', fill: 'none', stroke: '#c7322b', 'stroke-width': 2.4, 'stroke-linecap': 'round' }, clip);
  }
  /* the Frayed Phantom, from the menu, lives in the hole in the wall */
  const phScene = { defs: App.defs, layer: L.phantom, get boil() { return App.boil; }, lamps: [LX], get dark() { return now > ev.black0 && now < ev.black1; } };
  const ph = T.makeEvilWire(phScene, HOLE.x, HOLE.y, 0.62);
  Object.assign(ph.cfg.life, { breath: 3.4, bounce: 0, sway: 5, lean: 4, nervous: 0.02 });
  ph.root.style.display = 'none';
  ph.root.style.cursor = 'pointer';
  const particles = new Particles(L.fx);
  /* ...and so are the wall and the practice board, over everything built on them */
  if (G) G.paper(shakeG, -20, -20, W + 40, 620, { before: L.bench });

  /* ---------- the shop lamp and the light it throws ---------- */
  const lamp = { g: el('g', {}, L.lamp), coneG: el('g', { style: 'mix-blend-mode:screen', opacity: 0.85 }, L.light), th: 0.02, w: 0 };
  el('path', { d: 'M0,-4 V34', stroke: INK, 'stroke-width': 3 }, lamp.g);
  el('path', { d: 'M-12,34 H12 V44 H-12 Z', fill: '#3a3a3a', stroke: INK, 'stroke-width': 3 }, lamp.g);
  el('path', { d: 'M-12,44 Q-46,50 -52,72 H52 Q46,50 12,44 Z', fill: 'url(#gShade)', stroke: INK, 'stroke-width': 4, 'stroke-linejoin': 'round' }, lamp.g);
  el('path', { d: 'M-34,56 Q-22,49 -8,48', fill: 'none', stroke: '#bfe8d2', 'stroke-width': 3, opacity: 0.8, 'stroke-linecap': 'round' }, lamp.g);
  lamp.bulbE = el('ellipse', { cx: 0, cy: 74, rx: 14, ry: 9, fill: '#fff4c8', stroke: INK, 'stroke-width': 2.5 }, lamp.g);
  lamp.cone = el('path', { d: 'M-40,72 L-470,500 L470,500 L40,72 Z', fill: 'url(#gCone)' }, lamp.coneG);
  const benchPool = el('ellipse', { cx: LX, cy: 574, rx: 470 / KZ, ry: 42, fill: 'url(#gBenchPool)', style: 'mix-blend-mode:screen' }, L.light);
  const bulbGlow = el('ellipse', { rx: 330, ry: 270, fill: 'url(#gWarm)', opacity: 0, style: 'mix-blend-mode:screen' }, L.light);
  /* (each light has its own painted pool for the classic look) */
  for (const l of LAMPS) l.glowEl = l.t === bulb ? bulbGlow : el('ellipse', { rx: 300, ry: 250, fill: 'url(#gWarm)', opacity: 0, style: 'mix-blend-mode:screen' }, L.light);
  const vign = el('rect', { x: -20, y: -20, width: W + 40, height: H + 40, fill: 'url(#gRoomDark)' }, L.dark);
  const darkRect = el('rect', { x: -20, y: -20, width: W + 40, height: H + 40, fill: '#050308', opacity: 0 }, L.dark);
  const darkEyes = [...SWS.map(s => s.toon), bulb, ph].concat(bulb2 ? [bulb2] : [], sparky ? [sparky] : [], fuse ? [fuse] : [], outlet ? [outlet] : []).map(c => {
    const g = el('g', { opacity: 0 }, L.dark);
    const evil = c === ph;
    return { c, g, e: [0, 1].map(() => ({ w: el('ellipse', evil ? { fill: '#fff2a0', opacity: 0.25, filter: 'url(#softBlur)' } : { fill: '#f4ecd8' }, g), p: el('ellipse', { fill: evil ? '#fff8d8' : '#0a0606' }, g) })) };
  });
  const soots = [];
  const cord = el('path', { fill: 'none', stroke: INK, 'stroke-width': 3, opacity: 0 }, L.cast);
  L.cast.insertBefore(cord, L.cast.firstChild);

  /* ---------- speech bubble ---------- */
  const bub = el('g', { opacity: 0 }, L.bubble);
  const bubShadow = el('path', { fill: '#140904', opacity: 0.35, transform: 'translate(5,7)' }, bub);
  const bubBox = el('path', { fill: '#fffaf0', stroke: INK, 'stroke-width': 4, 'stroke-linejoin': 'round' }, bub);
  const bubText = el('text', { 'font-family': 'Special Elite, "Courier New", monospace', 'font-size': 17, fill: INK }, bub);
  const bubS = { t0: -9, until: -9, tip: [918, 214], who: 'bulb', text: '', at: null };
  function say(text, secs = 6, who = 'bulb') {
    if (who === 'sw') who = SWS[0] ? SWS[0].id : fuse ? 'fuse' : 'bulb';
    if (who === 'bulb' && st.blown) who = SWS[0] ? SWS[0].id : 'husk';
    if (who === 'fuse' && !fuse) who = 'bulb';
    if (who === 'outlet' && !outlet) who = 'bulb';
    bubS.who = who; bubS.text = text;
    layoutBubble();
    bubS.t0 = now; bubS.until = now + secs;
    A.sfx.squeak();
  }
  /* Where a bubble goes: clear of the speaker (the whole body, not just the
     face), clear of every other character's head, clear of the HUD, on screen,
     and as close to the speaker as that allows, with the tail pointing at him.
     Everything is measured live, so a phone's bigger HUD text is avoided too,
     and the words grow on a small screen so they stay readable. */
  const speakerOf = who => { const s = SWS.find(q => q.id === who); return s ? s.toon : who === 'insp' ? insp : who === 'fuse' ? fuse : who === 'outlet' ? outlet : who === 'L2' && bulb2 ? bulb2 : who === 'sparky' && sparky ? sparky : bulb; };
  const shown = c => c && c.root.style.display !== 'none';
  function hudRects(fr) {
    const k = 1280 / fr.width;
    return ['#hud .plate', '#hud .ticket', '#hud .tools', '#musicToggle'].map(q => document.querySelector(q))
      .filter(e => e && e.getClientRects().length)
      .map(e => {
        const r = e.getBoundingClientRect(), a = unCam((r.left - fr.left) * k, (r.top - fr.top) * k), b = unCam((r.right - fr.left) * k, (r.bottom - fr.top) * k);
        return [a[0] - 8, a[1] - 8, b[0] + 8, b[1] + 8];
      });
  }
  const wrap = (text, n) => {
    const lines = [];
    let line = '';
    for (const w of text.split(' ')) { if ((line + ' ' + w).trim().length > n) { lines.push(line.trim()); line = w; } else line += ' ' + w; }
    if (line.trim()) lines.push(line.trim());
    return lines;
  };
  function layoutBubble() {
    if (!bubS.text) return;
    const fr = App.frame.getBoundingClientRect(); /* (the frame: the camera never moves it) */
    const px = fr.width ? (fr.width / 1280) * KZ : 1;
    const fs0 = clamp(12 / px, 17, 24);
    const husk = bubS.who === 'husk', me = husk ? bulb : speakerOf(bubS.who);
    const mine = me.bodyCircles();
    const [hx, hy, hr0] = husk ? mine[1] : mine[0];
    const hr = hr0 + 6;
    /* what the bubble must not cover */
    const circles = mine.map(([x, y, r]) => [x, y, r + 4, 3]);
    for (const c of [bulb, bulb2, sparky, fuse, outlet, insp, ph, ...SWS.map(s => s.toon)]) {
      if (!c || c === me || !shown(c)) continue;
      if (c === ph) { circles.push([...ph.facePos(), 50, 4]); continue; }
      /* their faces above all, but not their bodies either if it can be helped */
      c.bodyCircles().forEach(([x, y, r], i) => circles.push(i ? [x, y, r, 1.5] : [x, y, r * 1.1 + 6, 4]));
    }
    const rects = fr.width ? hudRects(fr) : [];
    const cost = (x, y, w, h) => {
      let c = 0;
      for (const [cx, cy, r, k] of circles) {
        const qx = clamp(cx, x, x + w), qy = clamp(cy, y, y + h), d = Math.hypot(qx - cx, qy - cy);
        if (d < r) c += (r - d) * r * k;
      }
      for (const [x0, y0, x1, y1] of rects) {
        const ox = Math.min(x + w, x1) - Math.max(x, x0), oy = Math.min(y + h, y1) - Math.max(y, y0);
        if (ox > 0 && oy > 0) c += ox * oy * 6;
      }
      return c + Math.hypot(x + w / 2 - hx, y + h / 2 - hy) * 0.8;
    };
    /* try a few line lengths and a ring of spots round his head; cheapest wins */
    let best = null;
    /* (a slightly smaller type size is allowed when a small screen is crowded) */
    for (const fs of fs0 > 17.5 ? [fs0, Math.max(17, fs0 * 0.8)] : [fs0]) for (const n of [28, 20, 36]) {
      const lines = wrap(bubS.text, n), lh = fs * 1.3;
      const w = Math.max(...lines.map(l => l.length)) * fs * 0.56 + 34, h = 26 + fs + (lines.length - 1) * lh;
      const g = 26, cands = [
        [hx - w + hr * 0.4, hy - hr - g - h * 0.55], [hx - hr * 0.4, hy - hr - g - h * 0.55],
        [hx - hr - g - w, hy - h * 0.75], [hx + hr + g, hy - h * 0.75], [hx - hr - g - w, hy - h * 0.2], [hx + hr + g, hy - h * 0.2],
        [hx - w - hr * 0.5, hy + hr * 0.4], [hx + hr * 0.5, hy + hr * 0.4],
      ];
      /* rows above (and one below) swept from left of him to right of him */
      for (const ry of [hy - hr - g - h, hy - hr - g - h - 60, hy + hr + g]) for (let i = 0; i <= 6; i++) cands.push([hx - w - hr + (i / 6) * (w + 2 * hr), ry]);
      for (const [cx, cy] of cands) {
        const x = clamp(cx, 10, W - 10 - w), y = clamp(cy, 10, H - 10 - h), s = cost(x, y, w, h) + (n === 28 ? 0 : 40) + (fs < fs0 ? 150 : 0);
        if (!best || s < best.s) best = { x, y, w, h, s, lines, fs, lh };
      }
    }
    const { x, y, w, h, lines, fs, lh } = best;
    /* the tail: from the side of the bubble facing him, to just off his head */
    const bx = x + w / 2, by = y + h / 2, da = Math.atan2(by - hy, bx - hx);
    const tip = [hx + Math.cos(da) * (hr - 2), hy + Math.sin(da) * (hr - 2)];
    const edge = tip[1] > y + h ? 'bottom' : tip[1] < y ? 'top' : tip[0] < x ? 'left' : 'right';
    const along = edge === 'top' || edge === 'bottom' ? clamp(tip[0], x + 22, x + w - 22) : clamp(tip[1], y + 18, y + h - 18);
    const s = edge === 'top' || edge === 'bottom' ? clamp(w / 6, 8, 14) : clamp(h / 5, 6, 12);
    const b0 = R(along - s), b1 = R(along + s), T = `${R(tip[0])},${R(tip[1])}`, r = 10;
    const X0 = R(x), Y0 = R(y), X1 = R(x + w), Y1 = R(y + h);
    let d = `M${X0 + r},${Y0}`;
    if (edge === 'top') d += ` H${b0} L${T} L${b1},${Y0}`;
    d += ` H${X1 - r} Q${X1},${Y0} ${X1},${Y0 + r}`;
    if (edge === 'right') d += ` V${b0} L${T} L${X1},${b1}`;
    d += ` V${Y1 - r} Q${X1},${Y1} ${X1 - r},${Y1}`;
    if (edge === 'bottom') d += ` H${b1} L${T} L${b0},${Y1}`;
    d += ` H${X0 + r} Q${X0},${Y1} ${X0},${Y1 - r}`;
    if (edge === 'left') d += ` V${b1} L${T} L${X0},${b0}`;
    d += ` V${Y0 + r} Q${X0},${Y0} ${X0 + r},${Y0} Z`;
    bubBox.setAttribute('d', d); bubShadow.setAttribute('d', d);
    while (bubText.firstChild) bubText.firstChild.remove();
    bubText.setAttribute('font-size', R(fs * 10) / 10);
    lines.forEach((ln, i) => { el('tspan', { x: R(x + 17), y: R(y + 13 + fs * 0.9 + i * lh) }, bubText).textContent = ln; });
    bubS.tip = tip; bubS.at = [hx, hy];
  }

  /* ---------- state ---------- */
  const st = { worked: {}, wires: [], power: false, trip: false, sw: Object.fromEntries(SWS.map(s => [s.id, 0]).concat(CHAIN ? [['L1', 0]] : [])), color: '#1c1c1e', tests: [], proven: false, blown: false, faultLock: false, hint: 0, hintTier: {}, lastRes: null, won: false, shorts: 0, hookOk: 0, tester: false, inspecting: false, told: {}, work: { unproven: false, shocks: 0, live: 0 } };
  const flash = el('rect', { x: -20, y: -20, width: W + 40, height: H + 40, fill: '#fff4c8', opacity: 0 }, L.flash);
  const look = { x: 0, y: 0, until: -9 };
  const glance = (x, y, secs = 1.4) => { look.x = x; look.y = y; look.until = now + secs; };
  const once = (key, fn) => { if (st.told[key]) return; st.told[key] = true; fn(); };
  let lastInput = 0;

  /* ---------- cables: verlet ropes pinned at the screws, sagging under gravity ---------- */
  const GRAV = 1500, FLOOR = 594;
  function makeRope(ax, ay, bx, by, n = 16) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1), x = ax + (bx - ax) * u, y = ay + (by - ay) * u - Math.sin(u * Math.PI) * 30;
      pts.push({ x, y, px: x, py: y });
    }
    return { pts, seg: Math.hypot(bx - ax, by - ay) / (n - 1), still: 0, sleep: false };
  }
  const slackFor = dist => 16 + dist * 0.05;
  function fitRope(r, ax, ay, bx, by, slack) { const d = Math.hypot(bx - ax, by - ay); r.seg = (d + (slack == null ? slackFor(d) : slack)) / (r.pts.length - 1); }
  function stepRope(r, h, pa, pb) {
    const p = r.pts, n = p.length;
    let moved = 0;
    for (const q of p) {
      const vx = (q.x - q.px) * 0.985, vy = (q.y - q.py) * 0.985;
      q.px = q.x; q.py = q.y;
      q.x += vx; q.y += vy + GRAV * h * h;
    }
    for (let it = 0; it < 12; it++) {
      if (pa) { p[0].x = pa[0]; p[0].y = pa[1]; }
      if (pb) { p[n - 1].x = pb[0]; p[n - 1].y = pb[1]; }
      for (let i = 0; i < n - 1; i++) {
        const a = p[i], b = p[i + 1], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1e-6, diff = (d - r.seg) / d;
        const wa = i === 0 && pa ? 0 : 1, wb = i + 1 === n - 1 && pb ? 0 : 1, s = wa + wb;
        if (!s) continue;
        a.x += (dx * diff * wa) / s; a.y += (dy * diff * wa) / s;
        b.x -= (dx * diff * wb) / s; b.y -= (dy * diff * wb) / s;
      }
    }
    /* a little bending stiffness so it reads as cable, not string */
    for (let i = 1; i < n - 1; i++) {
      const q = p[i];
      q.x += ((p[i - 1].x + p[i + 1].x) / 2 - q.x) * 0.06;
      q.y += ((p[i - 1].y + p[i + 1].y) / 2 - q.y) * 0.06;
    }
    if (pa) { p[0].x = pa[0]; p[0].y = pa[1]; }
    if (pb) { p[n - 1].x = pb[0]; p[n - 1].y = pb[1]; }
    for (const q of p) {
      if (q.y > FLOOR) { q.y = FLOOR; q.px = q.x - (q.x - q.px) * 0.4; }
      moved = Math.max(moved, Math.abs(q.x - q.px) + Math.abs(q.y - q.py));
    }
    r.still = moved < 0.03 ? r.still + 1 : 0;
    if (r.still > 120) r.sleep = true;
  }
  const wake = r => { r.sleep = false; r.still = 0; };
  function smoothD(pts) {
    let d = `M${R(pts[0].x)},${R(pts[0].y)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += ` C${R(p1.x + (p2.x - p0.x) / 6)},${R(p1.y + (p2.y - p0.y) / 6)} ${R(p2.x - (p3.x - p1.x) / 6)},${R(p2.y - (p3.y - p1.y) / 6)} ${R(p2.x)},${R(p2.y)}`;
    }
    return d;
  }
  function cutFront(pts, amt) {
    let rem = amt;
    while (pts.length > 2) {
      const d = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      if (d > rem) { const k = rem / d; pts[0] = { x: pts[0].x + (pts[1].x - pts[0].x) * k, y: pts[0].y + (pts[1].y - pts[0].y) * k }; return pts; }
      rem -= d; pts.shift();
    }
    return pts;
  }
  /* the bare copper end wrapped round the screw, under its head. s is how far
     it's wrapped, in radians: positive is clockwise (the finished hook is ~300°) */
  function hook(tm, e, s = 5.2, tail = 0) {
    const a = Math.atan2(e.y - tm.y, e.x - tm.x), r = 13.5, a2 = a + s;
    let d = `M${R(e.x)},${R(e.y)} L${R(tm.x + Math.cos(a) * r)},${R(tm.y + Math.sin(a) * r)} `;
    if (Math.abs(s) >= 0.05) d += `A${r},${r} 0 ${Math.abs(s) > Math.PI ? 1 : 0},${s > 0 ? 1 : 0} ${R(tm.x + Math.cos(a2) * r)},${R(tm.y + Math.sin(a2) * r)} `;
    /* while it's being wrapped, the loose end of the copper runs out to the grip */
    if (tail) d += `L${R(tm.x + Math.cos(a2) * tail)},${R(tm.y + Math.sin(a2) * tail)} `;
    return d;
  }
  const WCOL = { '#1c1c1e': ['#2c2c31', '#9696a0'], '#f1ead8': ['#f1ead8', '#ffffff'], '#c7322b': ['#c7322b', '#ff9f8a'], '#3f8a4c': ['#3f8a4c', '#9fe0a8'], [TAPED]: ['#ebe2cc', '#ffffff'] };
  function wireEls(parent, color, shadowParent, clickable) {
    const g = el('g', { class: clickable ? 'wire' : 'wire-x' }, parent);
    const cols = WCOL[color] || WCOL['#1c1c1e'];
    const o = { g, color };
    o.shadow = el('path', { fill: 'none', stroke: '#1a0c05', 'stroke-width': 10, 'stroke-linecap': 'round', opacity: 0.24, transform: 'translate(7,11)' }, shadowParent || g);
    o.glow = el('path', { fill: 'none', stroke: '#ffd23a', 'stroke-width': 24, 'stroke-linecap': 'round', opacity: 0 }, g);
    o.cuInk = el('path', { fill: 'none', stroke: INK, 'stroke-width': 6.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    o.cu = el('path', { fill: 'none', stroke: '#d98a4a', 'stroke-width': 3.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    o.cuHi = el('path', { fill: 'none', stroke: '#ffd6ae', 'stroke-width': 1.1, 'stroke-linecap': 'round', opacity: 0.9, transform: 'translate(-.6,-.8)' }, g);
    o.ink = el('path', { fill: 'none', stroke: INK, 'stroke-width': 13, 'stroke-linecap': 'round' }, g);
    o.core = el('path', { class: 'wcore', fill: 'none', stroke: cols[0], 'stroke-width': 8, 'stroke-linecap': 'round' }, g);
    o.hi = el('path', { fill: 'none', stroke: cols[1], 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0.75, transform: 'translate(-1.2,-2.2)' }, g);
    /* a white conductor re-identified as a hot: black tape wrapped near each end */
    if (color === TAPED) o.tape = el('path', { fill: 'none', stroke: '#1c1c1e', 'stroke-width': 10, 'stroke-linecap': 'butt' }, g);
    o.flow = el('path', { fill: 'none', stroke: '#fff6b8', 'stroke-width': 4.5, 'stroke-linecap': 'round', 'stroke-dasharray': '4 26', opacity: 0 }, g);
    /* the Inspector's chalk line as he follows this wire */
    o.trace = el('path', { fill: 'none', stroke: '#fff3a0', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-dasharray': '10 12', opacity: 0 }, g);
    o.hit = el('path', { fill: 'none', stroke: 'transparent', 'stroke-width': (TOUCH ? 44 : 26) / KZ, class: 'wire-hit' }, g);
    if (!clickable) { o.hit.remove(); g.style.pointerEvents = 'none'; }
    return o;
  }
  function removeEls(o) { o.g.remove(); o.shadow.remove(); }
  /* how a rope end is drawn: a screw (hooked round it), { t: screw, s: sweep }
     (being wrapped right now), 'free' (a bare copper tip), 'nut' (it disappears
     into a wire nut) or null (nothing) */
  function drawRope(o, r, endA, endB) {
    let body = r.pts.map(q => ({ x: q.x, y: q.y }));
    const trim = e => (e === 'free' ? 9 : e === 'nut' ? 4 : e === 'jacket' ? 1 : 18);
    if (endA) body = cutFront(body, trim(endA));
    if (endB) body = cutFront(body.reverse(), trim(endB)).reverse();
    const d = smoothD(body);
    for (const k of ['shadow', 'glow', 'ink', 'core', 'hi', 'flow', 'trace']) o[k].setAttribute('d', d);
    if (o.hit.parentNode) o.hit.setAttribute('d', d);
    if (o.tape) {
      let len = 0;
      for (let i = 1; i < body.length; i++) len += Math.hypot(body[i].x - body[i - 1].x, body[i].y - body[i - 1].y);
      const a = 8, b = 18;
      o.tape.setAttribute('d', d);
      o.tape.setAttribute('stroke-dasharray', len > 2 * (a + b) + 10 ? `0 ${a} ${b} ${R(len - 2 * (a + b))} ${b} 9999` : '0 9999');
    }
    let cd = '';
    const P = r.pts, n = P.length;
    const tip = (e, b, p) => (e === 'free' ? `M${R(b.x)},${R(b.y)} L${R(p.x)},${R(p.y)} ` : e && e.t ? hook(e.t, b, e.s, 30) : e && e !== 'nut' && e !== 'jacket' ? hook(e, b) : '');
    cd += tip(endA, body[0], P[0]);
    cd += tip(endB, body[body.length - 1], P[n - 1]);
    o.cuInk.setAttribute('d', cd); o.cu.setAttribute('d', cd); o.cuHi.setAttribute('d', cd);
  }

  /* ---------- placed wires and their pigtails ---------- */
  const vis = new Map();
  const loose = [];
  const pig = {};
  const countAt = id => st.wires.filter(w => w.a === id || w.b === id).length;
  const pinOf = id => (pig[id] ? pig[id].J : [TERMS[id].x, TERMS[id].y]);
  /* a conductor end or a splice has no screw: its wires always meet in a nut */
  const endOf = id => (pig[id] ? 'nut' : TERMS[id].nut ? 'free' : TERMS[id]);
  const nutAt = id => (TERMS[id].nut ? 1 : 2);
  function syncWires(fromRope) {
    for (const [w, v] of vis) if (!st.wires.includes(w)) { removeEls(v.o); vis.delete(w); }
    for (const w of st.wires) {
      if (vis.has(w)) continue;
      const [ax, ay] = pinOf(w.a), [bx, by] = pinOf(w.b);
      const rope = fromRope && fromRope.w === w ? fromRope.rope : makeRope(ax, ay, bx, by);
      fitRope(rope, ax, ay, bx, by); wake(rope);
      const o = wireEls(L.wires, w.color, L.wshadow, true);
      o.g.addEventListener('click', e => {
        e.stopPropagation();
        const [x, y] = toW(e);
        cutWire(st.wires.indexOf(w), x, y);
      });
      vis.set(w, { rope, o, hot: false, current: false, dir: 1 });
    }
    /* a doubled screw keeps its pigtail; a screw back down to one wire loses it */
    for (const id of Object.keys(pig)) if (countAt(id) < nutAt(id)) dropPigtail(id);
    for (const id of Object.keys(TERMS)) if (countAt(id) >= nutAt(id) && !pig[id]) makePigtail(id, null, true);
    for (const [w, v] of vis) { const [ax, ay] = pinOf(w.a), [bx, by] = pinOf(w.b); fitRope(v.rope, ax, ay, bx, by); wake(v.rope); v.dirty = true; }
  }
  function shakeWires(k) {
    for (const r of allRopes()) {
      wake(r);
      for (const q of r.pts) { q.px -= rand(-5, 5) * k; q.py -= rand(-8, 3) * k; }
    }
  }
  const allRopes = () => [...[...vis.values()].map(v => v.rope), ...Object.values(pig).map(p => p.rope).filter(Boolean)];

  /* F. the pigtail: a short jumper from the screw to a wire nut, and every
     conductor for that screw twisted together inside the nut */
  function pigDir(id, extra) {
    const t = TERMS[id];
    let dx = 0, dy = 0;
    const others = st.wires.filter(w => w.a === id || w.b === id).map(w => TERMS[w.a === id ? w.b : w.a]);
    if (extra) others.push(TERMS[extra]);
    for (const o of others) { const d = Math.hypot(o.x - t.x, o.y - t.y) || 1; dx += (o.x - t.x) / d; dy += (o.y - t.y) / d; }
    const d = Math.hypot(dx, dy);
    return d < 0.2 ? [0, 1] : [dx / d, dy / d];
  }
  function makePigtail(id, extra, snug) {
    const t = TERMS[id];
    if (!pig[id]) {
      /* each screw has an open patch of board beside it where the nut can sit,
         out of everyone's way; a conductor end or a splice takes its nut right
         where it is (no jumper) */
      const [ux, uy] = t.nut ? [0, 0] : PIG_AT[id] || pigDir(id, extra);
      const J = [t.x + ux * 58, t.y + uy * 58];
      const first = st.wires.find(w => w.a === id || w.b === id);
      let rope = null, o = null;
      if (!t.nut) {
        rope = makeRope(t.x, t.y, J[0], J[1], 7);
        fitRope(rope, t.x, t.y, J[0], J[1], 10);
        o = wireEls(L.wires, first ? first.color : st.color, L.wshadow, false);
      }
      const nut = el('g', { class: 'nut clicky', role: 'button', tabindex: 0, 'aria-label': 'Wire nut: twist it on' }, L.nuts);
      el('ellipse', { cx: 0, cy: 3, rx: 16, ry: 5, fill: '#1a0c05', opacity: 0.3, transform: 'translate(4,8)' }, nut);
      const body = el('g', {}, nut);
      el('path', { d: 'M-13,2 Q-14,-12 -8,-24 Q0,-32 8,-24 Q14,-12 13,2 Q0,7 -13,2 Z', fill: 'url(#gNut)', stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round' }, body);
      const ribs = el('path', { d: '', fill: 'none', stroke: '#8a3a06', 'stroke-width': 1.6 }, body);
      el('path', { d: 'M-8,-18 Q-7,-24 -3,-26', fill: 'none', stroke: '#ffe0b0', 'stroke-width': 2, opacity: 0.8, 'stroke-linecap': 'round' }, body);
      el('circle', { cx: 0, cy: -8, r: 26, fill: 'transparent' }, nut);
      const arrow = el('path', { d: 'M-22,-30 A26,26 0 0,1 22,-30 M22,-30 l-9,0 M22,-30 l2,-9', fill: 'none', stroke: '#ffe27a', 'stroke-width': 3.5, 'stroke-linecap': 'round', opacity: 0 }, nut);
      const pg = { J, rope, o, nut, body, ribs, arrow, rot: 0, turn: 0, snug: false, twists: 0, res: null };
      nut.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); twistClick(id); });
      nut.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); twistClick(id); } });
      pig[id] = pg;
    }
    const pg = pig[id];
    if (!snug) { pg.snug = false; pg.twists = 0; }
    else pg.snug = true;
    for (const [w, v] of vis) if (w.a === id || w.b === id) { const [ax, ay] = pinOf(w.a), [bx, by] = pinOf(w.b); fitRope(v.rope, ax, ay, bx, by); wake(v.rope); }
    return pg;
  }
  function dropPigtail(id) {
    const pg = pig[id];
    if (!pg) return;
    if (pg.o) removeEls(pg.o);
    pg.nut.remove();
    delete pig[id];
  }
  function twistClick(id) {
    const pg = pig[id];
    if (!pg || pg.snug || !pg.res) return;
    pg.twists++; pg.turn = now;
    A.sfx.ratchet();
    particles.spark(pg.J[0], pg.J[1] - 14, 2, 0.2);
    /* a splice in Sparky's box: he supervises every turn */
    const hisBox = sparky && (LEVEL.boxes || {})[id] === 'J';
    if (hisBox) sparky.attn = pg.J.slice();
    if (pg.twists >= 3) {
      pg.snug = true;
      particles.bonk(pg.J[0], pg.J[1] - 12, 0.8);
      A.sfx.pop();
      if (hisBox) { const m = SPK.nod(); sparky.play(m.k, m.d, { slot: 'small' }); once('sparkyNut', () => setTimeout(() => say('Clockwise. Like a gentleman.', 2.6, 'sparky'), 400)); }
      const r = pg.res; pg.res = null; r(true);
    }
  }
  function twistNut(id) {
    return new Promise(res => {
      const pg = pig[id];
      pg.res = res;
      if (TERMS[id].nut) once('splice', () => say('Splices get a wire nut. Twist it on: click it three times!', 5, talker(id)));
      else once('pigtail', () => say('Two wires on one screw? On the job you pigtail them. Twist the wire nut on: click it three times!', 7, talker(id)));
      status('Twist the wire nut on: click it (or press Enter) three times, clockwise.');
      try { pg.nut.focus({ preventScroll: true }); } catch (e) { /* no focus */ }
    });
  }

  function evaluate() {
    const res = C.evaluate(LEVEL.components, st.wires, st.sw, st.power && !st.blown);
    st.lastRes = res;
    const info = C.wireInfo(res, LEVEL.components, st.wires);
    info.forEach((wi, i) => {
      const w = st.wires[i], v = vis.get(w);
      if (!v) return;
      v.hot = wi.hot; v.current = wi.current;
      v.dir = Math.abs(res.V[w.a] || 0) >= Math.abs(res.V[w.b] || 0) ? 1 : -1;
    });
    for (const [id, pg] of Object.entries(pig)) { const v = res.V[id]; pg.hot = v != null && Math.abs(v) > 1; }
    /* lit: the share of 120 V across each filament; light: what that gives
       (circuit.js, the lamp law: half the voltage is about a tenth the light) */
    for (const l of LAMPS) { const b = res.bulbs[l.id]; l.t.lit = st.blown || !b ? 0 : b.bright; l.t.light = st.blown || !b ? 0 : b.light; }
    A.sfx.hum(LAMPS.some(l => l.t.lit > 0.5) && App.current === SCREEN);
    /* probes left on across a breaker flip: the neon follows the circuit */
    if (st.tester && tester.a && tester.b) tester.glow = C.neonBetween(probeV(tester.a.id), probeV(tester.b.id));
    if (res.short && !st.faultLock && !st.inspecting) deadShort(res);
    return res;
  }
  const isHot = id => !!(st.lastRes && st.lastRes.V[id] != null && Math.abs(st.lastRes.V[id]) > 1);

  /* ---------- performances for this scene ---------- */
  const K = {
    brace: () => ({ d: 1.1, k: [[0.1, { lid: 1, sy: 0.9, shake: 1.4, mouth: 'grit', lhx: -12, lhy: -30, rhx: 12, rhy: -30, lg: 'fist', rg: 'fist', sweat: 1 }], [0.8, { lid: 0.9 }]] }),
    joy: () => ({ d: 2.2, k: [[0.08, { sy: 0.85, hipY: 8 }], [0.2, { sy: 1.15, hipY: -40, lfy: 36, rfy: 30, lhx: -66, lhy: -80, rhx: 66, rhy: -84, lg: 'palm', rg: 'palm', lroll: 0.3, rroll: -0.3, mouth: 'smile', mouthOpen: 0.9, lowLid: 0.45, browTilt: -0.4, browRaise: 0.9, pupil: 1 }], [0.36, { hipY: 4, sy: 0.9, lfy: 0, rfy: 0 }], [0.5, { hipY: -22, lfy: 20, rfy: 16, sy: 1.08 }], [0.64, { hipY: 0, lfy: 0, rfy: 0, sy: 1 }]], cues: [[0.2, () => A.sfx.boing()]] }),
    confused: () => ({ d: 2.4, k: [[0.1, { turn: 0.4, lookX: 0.6, lookY: 0.4, browTilt: 0.2, browRaise: 0.6, mouth: 'flat', rhx: 42, rhy: -132, rg: 'claw', rroll: 0.4 }], [0.4, { turn: -0.3, lookX: -0.6 }], [0.7, { turn: 0.3 }]] }),
    panicPop: () => ({ d: 0.6, k: [[0.05, { glow: 1.6, stretch: 1.4, sy: 1.25, sx: 1.1, shake: 3, pupil: 0.3, mouth: 'gasp', mouthOpen: 1.3, browRaise: 1.6, lhx: -50, lhy: -60, rhx: 50, rhy: -60, lg: 'palm', rg: 'palm', lid: 0, pop: 1.2 }], [0.9, { stretch: 1.6, sy: 1.35 }]] }),
    shaky: () => ({ d: 2.4, k: [[0.1, { shake: 1.8, mouth: 'worry', browTilt: 1.2, browRaise: 0.8, pupil: 0.6, lhx: -14, lhy: 30, rhx: 14, rhy: 28, lg: 'fist', rg: 'fist', knee: -0.5, sweat: 1 }], [0.8, { shake: 1.2 }]] }),
    startle: p => ({ d: 1.5, k: [[0.08, { sy: 1 - 0.14 * p, hipY: 8 * p, lid: 0.4 }], [0.22, { sy: 1 + 0.2 * p, hipY: -50 * p, lfy: 40 * p, rfy: 32 * p, lhx: -66, lhy: -70, rhx: 66, rhy: -74, pop: 1, lg: 'palm', rg: 'back', rroll: -0.5, mouth: 'gasp', mouthOpen: 1, pupil: 0.45, browRaise: 1.3, lid: 0 }], [0.45, { hipY: 6, sy: 0.9, lfy: 0, rfy: 0 }], [0.7, { hipY: 0, sy: 1, mouth: 'grit', shake: 1 }]] }),
    /* hands up, palms out toward the panel: "whoa, whoa, WHOA" */
    whoa: () => ({ d: 1.6, k: [[0.06, { hipX: 8, lean: 7, sy: 1.08, lhx: -74, lhy: -46, rhx: 34, rhy: -118, lg: 'palm', rg: 'palm', lroll: 0.2, rroll: -0.3, mouth: 'gasp', mouthOpen: 1, pop: 1, browRaise: 1.4, pupil: 0.45, lid: 0, turn: -0.45, lookX: -1, lookY: 0.2, sweat: 1 }], [0.3, { lhy: -56, rhy: -110, pop: 0.3 }], [0.45, { lhy: -44, rhy: -122 }], [0.8, { hipX: 0, lean: 0, sy: 1 }]] }),
    /* a wire lands on your screw: it tickles */
    tickle: s => ({ d: 1.3, k: [[0.05, { sy: 0.9, sx: 1.07, lid: 0.55, lowLid: 0.5, mouth: 'smile', mouthOpen: 0.55, blush: 1, shake: 2.4, turn: 0.35 * s, lean: -5 * s, lroll: 0.7, rroll: -0.7 }], [0.45, { shake: 1.4, sy: 1.04 }], [0.85, { shake: 0.2, sy: 1, blush: 0 }]] }),
    /* proven dead: the breath he's been holding since you walked in */
    relief: () => ({ d: 1.7, k: [[0.12, { sy: 0.88, sx: 1.07, hipY: 6, lid: 0.6, lowLid: 0.3, mouth: 'smile', mouthOpen: 0.35, browTilt: -0.4, browRaise: 0.2, shake: 0, lhx: -40, lhy: 30, rhx: 40, rhy: 30, lg: 'palm', rg: 'palm' }], [0.5, { sy: 1.04, hipY: 0 }], [0.85, { sy: 1 }]] }),
    swFlinch: () => ({ d: 0.8, k: [[0.1, { sy: 0.9, lid: 0.8, mouth: 'grit' }], [0.4, { sy: 1.04, lid: 0.1 }]] }),
    /* breaker on: the switch covers its eyes, then peeks through its fingers */
    swCover: () => ({ d: 2, k: [[0.08, { sy: 0.93, lhx: 26, lhy: -46, rhx: -26, rhy: -46, lg: 'back', rg: 'back', lLayer: 'front!', rLayer: 'front!', shake: 1.3, mouth: 'grit', mouthOpen: 0.45, browRaise: 0.9 }], [0.5, { rhx: -34, rhy: -22, rroll: 0.5, lookX: 0.8, lookY: 0.2, pupil: 0.5, lid: 0 }], [0.85, { sy: 1 }]] }),
    swShrug: () => ({ d: 1.9, k: [[0.1, { sy: 0.94, hipY: 4, lhx: -50, lhy: -26, rhx: 50, rhy: -26, lg: 'palm', rg: 'palm', lroll: 0.25, rroll: -0.25, browRaise: 1.1, browTilt: 0.7, mouth: 'flat', mouthOpen: 0.3, turn: 0.35, lookX: 1, lookY: -0.2 }], [0.35, { hipY: 0, sy: 1.04 }], [0.8, { sy: 1 }]] }),
    swCheer: () => ({ d: 2, k: [[0.12, { hipY: -30, lfy: 26, rfy: 20, lhx: -40, lhy: -80, rhx: 40, rhy: -80, lg: 'palm', rg: 'palm', mouth: 'smile', mouthOpen: 0.7, browTilt: -0.3, lowLid: 0.4 }], [0.35, { hipY: 0, lfy: 0, rfy: 0 }]] }),
    /* the Inspector: a tip of the cap, a tick on the clipboard, a stern point */
    capTip: () => ({ d: 1.4, k: [[0.15, { rhx: -20, rhy: -150, rg: 'fist', lean: -4, lid: 0.35, mouth: 'happy', mouthOpen: 0.3, browRaise: 0.6 }], [0.55, { rhy: -140 }], [0.85, {}]] }),
    tick: () => ({ d: 0.7, k: [[0.1, { rhx: -70, rhy: -8, rg: 'fist', lookX: -0.7, lookY: 0.8, lid: 0.3 }], [0.35, { rhx: -64, rhy: -2 }], [0.55, { rhx: -72, rhy: -12 }]] }),
    point: s => ({ d: 1.3, k: [[0.12, { rhx: 70 * s, rhy: -60, rg: 'fist', turn: 0.4 * s, lookX: s, browTilt: 1, mouth: 'flat' }], [0.8, {}]] }),
    probe: () => ({ d: 1.8, k: [[0.12, { lhx: -54, lhy: -40, rhx: 54, rhy: -40, lroll: 0.2, rroll: -0.2, lookX: 0, lookY: 0.6, browTilt: 0.8, lid: 0.25, dial: 1 }], [0.85, { dial: 1 }]] }),
    /* the bulb, bypassed by a short: not a flicker of light, just a scream */
    scream: () => ({ d: 1.1, k: [[0.05, { stretch: 1.2, sy: 1.22, sx: 1.08, shake: 3, pupil: 0.3, mouth: 'gasp', mouthOpen: 1.3, browRaise: 1.6, lhx: -50, lhy: -60, rhx: 50, rhy: -60, lg: 'palm', rg: 'palm', lid: 0, pop: 1.2, sweat: 1 }], [0.7, { stretch: 0.6, sy: 1.08 }]] }),
    /* zapped: every limb straight out, eyes like saucers */
    zapped: () => ({ d: 1.2, k: [[0.02, { sy: 1.3, sx: 0.86, lhx: -80, lhy: -90, rhx: 80, rhy: -96, lg: 'palm', rg: 'palm', lroll: 0.6, rroll: -0.6, lfy: 30, rfy: 36, lfx: -30, rfx: 30, mouth: 'gasp', mouthOpen: 1, pupil: 0.3, browRaise: 1.6, lid: 0, pop: 1.3, shake: 5 }], [0.9, { shake: 3 }]] }),
    dazed: () => ({ d: 2.2, k: [[0.05, { sy: 0.82, sx: 1.12, hipY: 8, lean: -8, lhx: -40, lhy: 30, rhx: 40, rhy: 30, lg: 'back', rg: 'back', mouth: 'worry', mouthOpen: 0.5, lid: 0.45, pupil: 0.5, browTilt: 1.2, dizzy: 1 }], [0.5, { lean: 8 }], [0.9, { lean: 0, sy: 1, sx: 1, hipY: 0 }]] }),
    stomp: () => ({ d: 1.4, k: [[0.1, { hipY: -16, sy: 1.12, lhx: -30, lhy: -110, lg: 'fist', mouth: 'grit', mouthOpen: 0.8, browTilt: -1.4, browRaise: 0, lid: 0.3, shake: 1.2 }], [0.3, { hipY: 4, sy: 0.9, lhy: -120 }], [0.5, { hipY: -10, sy: 1.08, lhy: -104 }], [0.8, { hipY: 0, sy: 1 }]] }),
    /* the arc is right inside his own socket: no light, just heat and terror */
    blowUp: () => ({ d: 1, k: [[0.04, { stretch: 1.5, sy: 1.3, sx: 1.06, shake: 4, pupil: 0.25, mouth: 'gasp', mouthOpen: 1.3, browRaise: 1.7, lhx: -60, lhy: -70, rhx: 60, rhy: -74, lg: 'palm', rg: 'palm', lroll: 0.5, rroll: -0.5, lid: 0, pop: 1.4, sweat: 1, heat: 1 }], [0.5, { stretch: 1.1, sy: 1.18, shake: 5 }], [1, { stretch: 1.3, sy: 1.24 }]] }),
    /* ...and then he hears the glass go: eyes roll up to the crack, one gulp */
    crackLook: () => ({ d: 0.9, k: [[0.06, { lookX: 0.2, lookY: -1, pupil: 0.35, lid: 0, browRaise: 1.6, mouth: 'worry', mouthOpen: 0.4, lhx: -30, lhy: -120, rhx: 30, rhy: -120, lg: 'claw', rg: 'claw', shake: 2.2, sy: 1.12, stretch: 1 }], [0.6, { sy: 1.06, shake: 3, mouthOpen: 0.15 }], [1, { sy: 1.14, shake: 4 }]] }),
    /* 3-way switches: fists on hips, leaning in at the other one */
    huff: s => ({ d: 1.8, k: [[0.08, { lhx: -46, lhy: 8, rhx: 46, rhy: 8, lg: 'fist', rg: 'fist', lroll: 0.4, rroll: -0.4, lean: 7 * s, turn: 0.45 * s, lookX: s, lookY: -0.2, browTilt: -1.3, browRaise: 0, mouth: 'grit', mouthOpen: 0.6, sy: 1.08, hipY: -6 }], [0.3, { hipY: 2, sy: 0.96, lean: 9 * s }], [0.5, { hipY: -6, sy: 1.06 }], [0.85, { lean: 3 * s }]] }),
    /* the Inspector going for his cap: bend at the knees, reach, grab */
    stoop: () => ({ d: 1.1, k: [[0.25, { hipY: 34, sy: 0.84, sx: 1.06, knee: 0.9, lean: -16, lhx: -58, lhy: 128, lg: 'claw', lookX: -0.6, lookY: 1, browTilt: 1, mouth: 'flat' }], [0.55, { hipY: 40, lean: -20, lhx: -64, lhy: 138, lg: 'fist' }], [0.8, { hipY: 30, lean: -12, lhy: 120 }], [1, { hipY: 0, sy: 1, sx: 1, knee: 0.15, lean: 0, lhx: -40, lhy: -30 }]] }),
    /* the toolbox lid on the fuse's fingers: up on his toes, hand yanked to his
       mouth, a blow on the fingertips, then a furious shake of the hand */
    ouch: () => ({ d: 1.9, k: [[0.03, { hipY: -26, sy: 1.18, sx: 0.9, lfy: 20, rfy: 12, lhx: -14, lhy: -96, lg: 'claw', rhx: 30, rhy: -40, rg: 'palm', mouth: 'gasp', mouthOpen: 1, pupil: 0.3, browRaise: 1.7, lid: 0, pop: 1.3, shake: 3.5, sweat: 1 }], [0.22, { hipY: 0, sy: 0.94, sx: 1.05, lfy: 0, rfy: 0, lhx: 8, lhy: -62, pop: 0 }], [0.4, { lhx: 10, lhy: -58, mouth: 'worry', mouthOpen: 0.6, lid: 0.5, pupil: 0.6, shake: 1 }], [0.55, { lhx: -34, lhy: -20, lroll: 1.4, shake: 2 }], [0.62, { lhx: -20, lhy: -46, lroll: -0.6 }], [0.69, { lhx: -36, lhy: -18, lroll: 1.2 }], [0.76, { lhx: -20, lhy: -44, lroll: -0.4 }], [0.95, { lhx: -20, lhy: 38, mouth: 'grit', mouthOpen: 0.3, browTilt: -1.2 }]] }),
    /* two brisk swats of dust off the cap, held out at arm's length */
    dust: () => ({ d: 1.1, k: [[0.1, { lhx: -62, lhy: -40, lg: 'fist', rhx: -20, rhy: -70, rg: 'palm', lookX: -0.7, lookY: 0.1, browTilt: 1.2, mouth: 'flat', lid: 0.35 }], [0.25, { rhx: -50, rhy: -36 }], [0.4, { rhx: -18, rhy: -72 }], [0.55, { rhx: -52, rhy: -34 }], [0.7, { rhx: -20, rhy: -66 }], [1, { rhx: 24, rhy: 44 }]] }),
    /* ...up over the head, on, and a tug on the peak */
    capOn: () => ({ d: 1, k: [[0.3, { lhx: -6, lhy: -262, lg: 'fist', lookY: -0.6, lean: -2, sy: 1.04 }], [0.55, { lhx: -2, lhy: -238, sy: 0.94 }], [0.75, { lhx: -30, lhy: -236, sy: 1 }], [1, { lhx: -34, lhy: 30, lookY: 0 }]] }),
  };

  const FIDGETS = [
    s => ({ d: 1.4, k: [[0.2, { hipX: 7 * s, lean: 3 * s, sy: 0.97 }], [0.8, { hipX: 5 * s, lean: 2 * s }]] }),
    s => ({ d: 1.6, k: [[0.15, { turn: 0.45 * s, lookX: s, lookY: -0.2 }], [0.6, { turn: 0.3 * s, lookX: 0.7 * s }]] }),
    () => ({ d: 1.2, k: [[0.15, { lhx: -14, lhy: 10, rhx: 14, rhy: 10, lroll: 0.6, rroll: -0.6 }], [0.4, { lroll: -0.4, rroll: 0.4 }], [0.65, { lroll: 0.6, rroll: -0.6 }]] }),
    () => ({ d: 1, k: [[0.25, { sy: 1.05, sx: 0.97, lid: 0.45, browRaise: 0.8 }], [0.65, { sy: 0.97, sx: 1.02 }]] }),
  ];
  /* hover: they stiffen up and sweat when the pointer gets near */
  const hoverStiff = (toon, tg, d) => {
    if (!toon.hovered || toon.actions.length) return;
    tg.sy += 0.04; tg.pupil = 0.55; tg.shake += 0.7; tg.browRaise = 1; tg.lid = 0; tg.sweat = 1;
    d.mouth = 'grit'; tg.mouthOpen = 0.35;
  };
  const lampBrain = me => (t, dt, tg, d) => {
    /* blown: just a scorched base, his face peering over the broken collar */
    if (me.burnt) {
      tg.faceY = 72; tg.glow = 0; tg.lid = Math.max(tg.lid, 0.5); tg.pupil = 0.45; tg.browTilt = 1.2; d.mouth = 'worry'; tg.mouthOpen = 0.35;
      tg.lookY = 0.4; tg.shake += 0.6; tg.sy -= 0.06;
      return;
    }
    const lit = me.lit || 0;
    if (lit > 0.9) {
      tg.glow = 1; d.mouth = 'smile'; tg.mouthOpen = 0.55; tg.lowLid = 0.35; tg.browTilt = -0.3; tg.browRaise = 0.6; tg.pupil = 1;
      tg.lhx = -50 + 6 * Math.sin(t * 6); tg.lhy = -40; tg.rhx = 50 - 6 * Math.sin(t * 6); tg.rhy = -40; d.lg = 'palm'; d.rg = 'palm'; tg.knee = 0.2; tg.shake = 0;
      tg.lroll = 0.3 * Math.sin(t * 3); tg.rroll = -0.3 * Math.sin(t * 3 + 1);
    } else if (lit > 0.05) {
      /* part of his voltage: the filament only gets to a dull orange (the lamp
         law, from circuit.js), and he strains for every lumen */
      tg.glow = 0.1 + 0.9 * (me.light || 0); d.mouth = 'grit'; tg.mouthOpen = 0.35; tg.lid = 0.45; tg.browTilt = 1.1; tg.browRaise = 0.5; tg.pupil = 0.7;
      tg.shake += 0.7; tg.sweat = 0.7; tg.sy -= 0.04; tg.sx += 0.02;
      tg.lhx = -30; tg.lhy = 18; tg.rhx = 30; tg.rhy = 18; d.lg = 'fist'; d.rg = 'fist';
    } else {
      /* fretting hands that keep turning over */
      tg.lroll = 0.5 + 0.4 * Math.sin(t * 1.6); tg.rroll = -0.5 - 0.4 * Math.sin(t * 1.6 + 1.1);
      tg.lhy += 2 * Math.sin(t * 5); tg.rhy += 2 * Math.sin(t * 5 + 1.3);
      if (st.power) { tg.shake += 0.9; tg.sweat = 1; tg.pupil = 0.6; tg.browRaise = 1; d.mouth = 'grit'; tg.mouthOpen = 0.3; }
      hoverStiff(me, tg, d);
    }
    /* the Phantom's fingers creeping close: lean well away and don't look */
    if (me === bulb && (PH.st === 'creep' || PH.st === 'grab')) {
      tg.hipX -= 16; tg.lean -= 9; tg.turn = -0.5; tg.sweat = 1; tg.shake += 1.2; tg.pupil = 0.4; tg.browRaise = 1.4; d.mouth = 'gasp'; tg.mouthOpen = 0.6;
      bulb.attn = ph.facePos();
    }
  };
  for (const l of LAMPS) l.t.brain = lampBrain(l.t);
  for (const s of SWS) {
    const me = s.toon, other = SWS.find(o => o !== s);
    s.glare = -9;
    me.brain = (t, dt, tg, d) => {
      tg.lever = leverOf(s.id, st.sw[s.id]);
      if (bulb.lit > 0.9) { d.mouth = 'happy'; tg.mouthOpen = 0.5; tg.browTilt = 0; tg.shake = 0.05; tg.lowLid = 0.3; }
      else if (st.power) { tg.shake += 0.6; tg.sweat = 0.8; }
      /* standing in a metal box that's live: he can feel it */
      if (st.power && isHot(s.id + '.g')) { tg.shake += 2.2; tg.sweat = 1; tg.pupil = 0.45; tg.browRaise = 1.2; d.mouth = 'grit'; tg.mouthOpen = 0.5; }
      /* the Phantom's bony fingers at your own screws: duck, cringe, don't look */
      if (PH.st === 'swap' && s.id === 'S2') { tg.shake += 2.2; tg.hipX -= 8; tg.hipY += 8; tg.lean -= 7; tg.sy -= 0.06; tg.pupil = 0.4; tg.browRaise = 1.4; d.mouth = 'grit'; tg.mouthOpen = 0.5; tg.lookX = 1; tg.lookY = -0.6; tg.sweat = 1; }
      /* 3-ways: a hard stare down the stairs at the other one after he flips */
      if (other && now < s.glare) {
        const dir = other.x > s.x ? 1 : -1;
        tg.lookX = dir; tg.lookY = other.y < s.y ? -0.5 : 0.4; tg.turn += 0.3 * dir; tg.browTilt = -1.2; tg.browRaise = 0; d.mouth = 'grit'; tg.mouthOpen = 0.25;
      }
      hoverStiff(me, tg, d);
    };
  }
  if (outlet) {
    outlet.brain = (t, dt, tg, d) => {
      /* circuit 2 never goes off: he's the steady one. Probes in him tickle; a
         glowing tester across him has him giggling and pink in the face */
      const onMe = st.tester && [tester.a, tester.b].some(p => p && REC.includes(p));
      if (onMe && tester.glow && tester.b) { d.mouth = 'smile'; tg.mouthOpen = 0.45; tg.lowLid = 0.5; tg.shake += 2.2; tg.blush = 1; tg.sy += 0.03 * Math.sin(t * 22); tg.lookX = -0.3; tg.lookY = 0.7; }
      else if (onMe) { d.mouth = 'grit'; tg.mouthOpen = 0.3; tg.shake += 1; tg.blush = 0.6; tg.lookY = 0.7; tg.browRaise = 1; }
      else if (bulb.lit > 0.9) { d.mouth = 'smile'; tg.mouthOpen = 0.3; tg.lowLid = 0.3; tg.browTilt = -0.2; }
      hoverStiff(outlet, tg, d);
    };
  }
  if (fuse) {
    fuse.brain = (t, dt, tg, d) => {
      /* the old-timer squints at the panel; he flinches at every clunk */
      tg.lookX = -0.4; tg.lookY = -0.6; tg.turn -= 0.15;
      if (st.power) { tg.shake += 0.8; tg.sweat = 0.6; tg.browRaise = 0.9; }
      if (st.trip) { d.mouth = 'smile'; tg.mouthOpen = 0.3; tg.lowLid = 0.3; }
      /* 1.1 and 1.2: one elbow's worth of leaning on the toolbox, fingers over the
         rim, eyeing whatever the lid's doing */
      if (TB && TB.prank >= 0) {
        /* the nosy lift: hand to the lid's free end, up it comes, a long look in */
        const [sx, sy] = fuse.world(-31, -84), k = fuse.cfg.scale, a = TB.ang, pu = now - TB.prank;
        const ex = TB.hinge[0] + 148 * Math.cos(a) + 22 * Math.sin(a), ey = TB.hinge[1] + 148 * Math.sin(a) - 22 * Math.cos(a);
        tg.lhx = (ex - sx) / k; tg.lhy = (ey - sy) / k; d.lg = 'fist';
        tg.lean -= 9; tg.hipX -= 10; tg.turn = -0.5; tg.shake = 0.15; tg.sweat = 0;
        tg.lookX = -1; tg.lookY = pu > 1.2 ? 0.8 : 0.3; d.mouth = 'smile'; tg.mouthOpen = 0.25; tg.browTilt = -0.7; tg.lowLid = 0.35;
      } else if (TB && fuseOnRim()) {
        const [sx, sy] = fuse.world(-31, -84), k = fuse.cfg.scale;
        tg.shake = Math.min(tg.shake, 0.3); tg.sweat = 0;
        /* fingers over the rim while it's open; on the lid itself while it's shut;
           lifted clear while it's swinging */
        const hy = TB.fingersIn ? TB.rim - 3 : TB.ang > -0.12 ? TB.rim - 25 : TB.rim - 48;
        tg.lhx = (TB.hinge[0] + TB.len - 10 - sx) / k; tg.lhy = (hy - sy) / k; d.lg = 'back'; tg.lroll = 0.2;
        tg.lean -= 5; tg.hipX -= 4; tg.turn -= 0.25;
        if (TB.ang < -0.4) { tg.lookX = -0.9; tg.lookY = 0.3; }
      } else if (TB && now < TB.shy) { tg.lhx = -10; tg.lhy = -40; d.lg = 'palm'; tg.lookX = -1; tg.lookY = 0.4; tg.browRaise = 1.2; d.mouth = 'grit'; tg.mouthOpen = 0.3; }
      if (PH.st !== 'hid' && PH.hole === HOLE2) { tg.shake += 2.5; tg.pupil = 0.35; tg.browRaise = 1.6; d.mouth = 'gasp'; tg.mouthOpen = 0.8; tg.lookY = -1; tg.hipX += 10; tg.lean += 8; tg.sweat = 1; }
      hoverStiff(fuse, tg, d);
    };
  }

  /* ---------- Sparky Junction (1.6) ----------
     His box is planted (the switches stand in it and the splices are in his
     belly), so everything he does is in his face plate, his brows, his tie,
     his monocle and his gloves. He has his own slow, put-upon rhythm, and his
     own fidgets: a polish of the monocle, a tug at the tie, drummed fingers, a
     tapping foot. Hands that reach across him come in front ('front!'). */
  const SPK = {
    grump: () => ({ d: 1.7, k: [[0.1, { lhx: 30, lhy: 76, rhx: -30, rhy: 76, lg: 'fist', rg: 'fist', lroll: 0.5, rroll: -0.5, browTilt: -1.4, browRaise: 0, mouth: 'grit', mouthOpen: 0.5, turn: 0.25, lookX: 0.3, shake: 0.5 }], [0.45, { mouthOpen: 0.2 }], [0.8, { turn: 0 }]] }),
    polish: () => ({ d: 1.7, k: [[0.15, { rhx: -98, rhy: -38, rg: 'fist', rroll: 0.6, rLayer: 'front!', lid: 0.6, browTilt: 0.2, lookY: -0.3 }], [0.3, { rhx: -92, rhy: -46 }], [0.45, { rhx: -100, rhy: -34 }], [0.6, { rhx: -93, rhy: -44 }], [0.85, { rhx: 16, rhy: 168, lid: 0.32 }]] }),
    tie: () => ({ d: 1.5, k: [[0.15, { lhx: 122, lhy: 16, rhx: -122, rhy: 16, lg: 'fist', rg: 'fist', lLayer: 'front!', rLayer: 'front!', lookY: 0.8, browTilt: 0.6, mouth: 'flat' }], [0.4, { lhx: 118, lhy: 20, rhx: -126, rhy: 12 }], [0.62, { lhx: 126, lhy: 12, rhx: -118, rhy: 20 }], [0.9, { lhx: -16, lhy: 168, rhx: 16, rhy: 168, lookY: 0 }]] }),
    drum: () => ({ d: 1.6, k: [[0.1, { rhx: 26, rhy: 118, rg: 'palm', rroll: 1.2, lookX: 0.6, browTilt: -0.8 }], [0.22, { rhy: 110 }], [0.32, { rhy: 118 }], [0.42, { rhy: 110 }], [0.52, { rhy: 118 }], [0.62, { rhy: 110 }], [0.9, { rhx: 16, rhy: 168 }]] }),
    tap: () => ({ d: 1.4, k: [[0.1, { rfy: 10, rtoe: 12, browTilt: -1, lookX: -0.4 }], [0.2, { rfy: 0 }], [0.3, { rfy: 10 }], [0.4, { rfy: 0 }], [0.5, { rfy: 10 }], [0.6, { rfy: 0 }]] }),
    nod: () => ({ d: 1.3, k: [[0.15, { lookY: 0.7, lid: 0.55, mouth: 'smile', mouthOpen: 0.12, browTilt: 0.2, faceY: 6 }], [0.4, { lookY: -0.1, faceY: 0 }], [0.6, { lookY: 0.6, faceY: 5 }], [0.85, { lookY: 0, faceY: 0 }]] }),
    wince: () => ({ d: 0.9, k: [[0.06, { lid: 0.9, mouth: 'grit', mouthOpen: 0.5, browTilt: 1, shake: 1.2, lhx: 14, lhy: 140, lg: 'claw' }], [0.6, { lid: 0.4, shake: 0.3 }]] }),
    startle: () => ({ d: 1.7, k: [[0.05, { pop: 1.3, lid: 0, pupil: 0.35, browRaise: 1.6, mouth: 'gasp', mouthOpen: 1, lhx: -60, lhy: -50, rhx: 60, rhy: -50, lg: 'palm', rg: 'palm', shake: 2.6 }], [0.4, { pop: 0.2, shake: 0.8 }], [0.8, { mouth: 'grit', mouthOpen: 0.3, browTilt: -1.2, browRaise: 0 }]] }),
    point: s => ({ d: 1.7, k: [[0.12, { [s < 0 ? 'lhx' : 'rhx']: 96 * s, [s < 0 ? 'lhy' : 'rhy']: -26, [s < 0 ? 'lg' : 'rg']: 'point', turn: 0.35 * s, lookX: s, browTilt: -0.6, mouth: 'flat', mouthOpen: 0.35 }], [0.8, {}]] }),
  };
  const SPK_FIDGETS = [SPK.polish, SPK.tie, SPK.drum, SPK.tap];
  const SPARKY_LINES = ['Hands off the merchandise.', 'Every splice in MY box gets a wire nut. No exceptions.', 'Push-in connectors. Hmph. Kids today.', 'I\'ve held more splices than you\'ve had hot dinners.'];
  if (sparky) {
    Object.assign(sparky.cfg.life, { breath: 4.8, beatMul: 0.29, beatOffset: 0.2 });
    sparky.brain = (t, dt, tg, d) => {
      /* a steel box doesn't sway or breathe much */
      tg.hipX = 0; tg.hipY = 0; tg.lean = 0; tg.sy = 1 + (tg.sy - 1) * 0.15; tg.sx = 1 + (tg.sx - 1) * 0.15;
      if (st.power) tg.shake = Math.max(tg.shake, 0.15);
      /* his own steel live: it shouldn't be, he's grounded... isn't he? */
      if (st.power && isHot('J.g')) { tg.shake += 2.4; tg.sweat = 1; tg.pupil = 0.4; tg.browRaise = 1.3; d.mouth = 'grit'; tg.mouthOpen = 0.6; }
      else if (LAMPS.every(l => l.t.lit > 0.9)) { d.mouth = 'smile'; tg.mouthOpen = 0.1; tg.browTilt = -0.1; tg.lid = 0.42; }
      /* pointer on him: he glares down his nose at it */
      if (sparky.hovered && !sparky.actions.length) { tg.browTilt = -1.5; tg.browRaise = 0.15; d.mouth = 'grit'; tg.mouthOpen = 0.22; tg.lid = 0.2; }
    };
    sparky.root.addEventListener('click', e => { e.stopPropagation(); if (busy()) return; const m = SPK.grump(); sparky.play(m.k, m.d); A.sfx.clunk(false); say(SPARKY_LINES[(st.spN = (st.spN || 0) + 1) % SPARKY_LINES.length], 3.2, 'sparky'); });
  }
  /* a switch in his box just worked its own light: he notices */
  function sparkyNod(s) {
    if (!sparky || sparky.actions.some(a => a.slot === 'big')) return;
    sparky.attn = s.toon.facePos(); const m = SPK.nod(); sparky.play(m.k, m.d, { slot: 'small' });
    if (st.worked) { st.worked[s.id] = true; if (SWS.every(x => st.worked[x.id])) once('sparkyBoth', () => setTimeout(() => say('Each to his own light. As it should be.', 3.2, 'sparky'), 900)); }
  }
  function sparkyApprove() { if (!sparky) return; const m = SPK.nod(); sparky.play(m.k, m.d); setTimeout(() => { const m2 = SPK.polish(); sparky.play(m2.k, m2.d); }, 1400); }

  /* ---------- actions ---------- */
  const POWER_ON_TEXT = SWS.length > 1 ? 'Breaker ON. Hands off the wires! Try BOTH switches (click them, or press S and D).'
    : SWS.length ? 'Breaker ON. Hands off the wires! Try the switch (click it, or press S).'
    : CHAIN ? 'Breaker ON. The chain works the light (click it, or press S).' : 'Breaker ON.';
  function setPower(on, silent) {
    if (st.blown && on) { say('No bulb in the socket! Wait for the new one.', 4, 'sw'); return; }
    st.power = on;
    if (on) st.trip = false;
    if (!silent) { A.sfx.clunk(on); brk.v += on ? 9 : -9; }
    /* any change at the breaker voids the last proof that the circuit is dead */
    st.tests = []; st.proven = false;
    status(on ? POWER_ON_TEXT : LEVEL.safety ? 'Breaker OFF.' : 'Breaker OFF. Safe to wire. Drag from one screw to another.');
    if (on) {
      cancelLead(); cancelJob();
      if (!st.inspecting) {
        const m = K.brace(); bulb.play(m.k, m.d);
        if (bulb2) setTimeout(() => { const m4 = K.brace(); bulb2.play(m4.k, m4.d); }, 230);
        if (sparky) setTimeout(() => { const m5 = SPK.wince(); sparky.play(m5.k, m5.d); }, 140);
        /* each covers up in its own time */
        SWS.forEach((s, i) => setTimeout(() => { const m2 = K.swCover(); s.toon.play(m2.k, m2.d); }, i * 170));
        if (fuse) setTimeout(() => { const m3 = K.brace(); fuse.play(m3.k, m3.d); }, 90);
      }
      glance(276 + PX, 240 + PY, 0.8);
      setTimeout(() => {
        if (!st.power || st.inspecting) return;
        const res = evaluate();
        if (res.short) return;
        const liveBox = SWS.find(s => isHot(s.id + '.g'));
        if (liveBox) once('tingle', () => setTimeout(() => say('Why do I feel... tingly? Is my BOX live?! Somebody check it with the tester!', 6, liveBox.id), 600));
        /* two lights glowing a dull orange: they're splitting the voltage */
        const dim = LAMPS.filter(l => l.t.lit > 0.05 && l.t.lit < 0.9);
        if (dim.length) {
          dim.forEach((l, i) => setTimeout(() => { const m3 = K.shaky(); l.t.play(m3.k, m3.d); }, i * 260));
          if (dim.length > 1) once('dim', () => { say('We\'re both on... sort of?', 3); setTimeout(() => { if (st.power) say('Feels like I\'m only getting HALF of something.', 3.6, 'L2'); }, 3200); });
        }
        if (LAMPS.some(l => l.t.lit > 0.9)) { A.sfx.select(); LAMPS.forEach((l, i) => { if (l.t.lit > 0.9) setTimeout(() => { const m3 = K.joy(); l.t.play(m3.k, m3.d); }, i * 200); }); glance(BULB.x, BULB.y - 175 * BULB.s, 1.5); }
        else if (st.wires.length === 0) { if (!LEVEL.startsLive) say('Nothing\'s even connected! Turn it off and wire me up first.'); }
        else if (bulb.lit === 0 && ((SWS[0] && swType(SWS[0].id) === 'sp' && st.sw.S1 === 1) || (CHAIN && st.sw.L1 === 1) || GUIDE)) { const m3 = K.confused(); bulb.play(m3.k, m3.d); cricket(); }
      }, 450);
    } else evaluate();
  }
  /* the two 3-ways each think the light is theirs */
  const QUIPS = {
    S1: ['Oh, so HE gets to do it too?!', 'I was here first! The stairs START down here!', 'Quit flipping MY light, you big stiff!', 'Fine. FINE. Two bosses. Great.'],
    S2: ['Excuse me! I had that light just how I liked it.', 'Who said YOU run the light, shorty?', 'I am the HEAD of the stairs. The HEAD.', 'Hmph. Apparently we share.'],
  };
  /* 1.2: the chain works the little switch inside the lampholder. One pull
     closes it, the next opens it (whether that lights the bulb is the circuit's
     answer: it only closes the loop if the loop is there) */
  function pullChain(quiet) {
    if (!App.running || !CHAIN) return;
    const litBefore = bulb.lit;
    st.sw.L1 = st.sw.L1 ? 0 : 1;
    chainPull = now;
    A.sfx.click(); setTimeout(() => A.sfx.tick(), 90);
    glance(CHAIN_AT.x, CHAIN_AT.y + CHAIN_AT.len, 0.8);
    if (!st.blown && !bulb.actions.length) { const m = K.swFlinch(); bulb.play(m.k, m.d, { slot: 'small' }); }
    evaluate();
    if (!st.power || quiet || (st.lastRes && st.lastRes.short)) {
      if (!st.power && !quiet) once('chainDead', () => say(st.sw.L1 ? 'Click! ...but the breaker\'s OFF.' : 'Click.', 3));
      return;
    }
    if (bulb.lit > 0.9 && litBefore < 0.9) { const m2 = K.joy(); bulb.play(m2.k, m2.d); once('loop', () => setTimeout(() => say('I\'m LIT! The loop is closed!', 3.5), 700)); }
    else if (bulb.lit < 0.05 && litBefore > 0.9) once('loopOpen', () => say('Chain open, lights out. That\'s all a switch does.', 4));
    else if (bulb.lit === 0 && st.sw.L1 === 1 && st.wires.length) { const m2 = K.confused(); bulb.play(m2.k, m2.d); cricket(); once('noLoop', () => say('Chain\'s pulled and... nothing?', 3.5)); }
  }
  let chainPull = -9;
  function flipSwitch(id, quiet) {
    if (!App.running) return;
    if (!SWS.length) { pullChain(quiet); return; }
    id = id || SWS[0].id;
    const s = SWS.find(x => x.id === id) || SWS[0], me = s.toon;
    const litBefore = bulb.lit, before = LAMPS.map(l => l.t.lit);
    st.sw[s.id] = st.sw[s.id] ? 0 : 1;
    me.base.lever = leverOf(s.id, st.sw[s.id]);
    A.sfx.click();
    const m = K.swFlinch(); me.play(m.k, m.d, { slot: 'small' });
    const [fx, fy] = me.facePos();
    glance(fx, fy, 0.8);
    if (st.power) {
      const res = evaluate();
      if (res.short || quiet) return;
      if (LEVEL.goal === 'threeway' || LEVEL.goal === 'multiway') { threeWayReact(s, litBefore); return; }
      /* each light answers for itself: whichever this flip lit up is glad */
      let changed = false;
      LAMPS.forEach((l, i) => {
        if (l.t.lit > 0.9 && before[i] < 0.9) { changed = true; setTimeout(() => { const m2 = K.joy(); l.t.play(m2.k, m2.d); }, i * 180); }
        else if ((l.t.lit > 0.05) !== (before[i] > 0.05)) changed = true;
      });
      if (changed) { if (sparky && SWS.length > 1) sparkyNod(s); return; }
      if (LAMPS.some(l => l.t.lit > 0.9)) {
        once('bypass' + (SWS.length > 1 ? s.id : ''), () => { const m2 = K.swShrug(); me.play(m2.k, m2.d); say(SWS.length > 1 ? 'I flip, and... nobody answers. Who do I even run?' : 'Hey... the switch isn\'t even in my path. Flipping it does nothing!', 6, SWS.length > 1 ? s.id : 'bulb'); });
      } else if (st.sw[s.id] === 1 && st.wires.length) { const m2 = K.confused(); bulb.play(m2.k, m2.d); cricket(); }
    }
  }
  /* Level 2: what a flip did to the light decides who argues and who shrugs.
     (Whether it changed is the circuit's answer, not a script.) */
  function threeWayReact(s, litBefore) {
    const other = SWS.find(o => o !== s);
    const changed = (bulb.lit > 0.9) !== (litBefore > 0.9);
    if (changed) {
      if (PH.waitSwap) { PH.waitSwap.flips++; PH.waitSwap.flipT = now; }
      if (bulb.lit > 0.9) { const m2 = K.joy(); bulb.play(m2.k, m2.d); }
      st.worked[s.id] = true;
      /* the other one takes it personally */
      other.glare = now + 2.2;
      setTimeout(() => { const m3 = K.huff(s.x > other.x ? 1 : -1); other.toon.play(m3.k, m3.d); A.sfx.hic(); }, 260 + rand(0, 160));
      if (st.worked.S1 && st.worked.S2 && !st.inspecting) {
        once('both', () => setTimeout(() => { say('You BOTH work the light, from either end, whatever the other one does. That\'s the whole point of 3-ways!', 6); const m4 = K.swCheer(); s.toon.play(m4.k, m4.d); }, 900));
        if (st.told.both && now - (st.quipT || 0) > 6 && Math.random() < 0.5) { st.quipT = now; const q = QUIPS[other.id]; setTimeout(() => say(q[(st.quipN = (st.quipN || 0) + 1) % q.length], 3, other.id), 700); }
      } else if (now - (st.quipT || 0) > 4) {
        st.quipT = now;
        const q = QUIPS[other.id];
        setTimeout(() => say(q[(st.quipN = (st.quipN || 0) + 1) % q.length], 3.4, other.id), 600);
      }
    } else if (st.wires.length) {
      /* a flip that does nothing: something's wrong, and they know it */
      const m2 = K.swShrug(); s.toon.play(m2.k, m2.d);
      if (bulb.lit > 0.9) once('stuckOn', () => say('I flipped and... nothing. The light doesn\'t care about me!', 5, s.id));
      else { const m3 = K.confused(); bulb.play(m3.k, m3.d); cricket(); once('dud' + s.id, () => say('Nothing?! Is it me, or is it HIM?', 4, s.id)); }
    }
  }
  function blockLive(id) {
    /* 1.1 and 1.2: no warning buzzer, just what really happens. A live screw
       bites; a dead one (the neutral bar, a loose screw) doesn't, but the
       Inspector will still hear you were in there with the power on */
    if (LEVEL.safety && id) {
      st.work.live++;
      if (C.touch(LEVEL, st.wires, st.sw, id).shock) { shockScare(id); return; }
      A.sfx.tick();
      if (!st.blown) { const m = K.whoa(); bulb.play(m.k, m.d); }
      status('Breaker ON.');
      return;
    }
    A.sfx.buzzer(); A.sfx.fizzle();
    const tm = TERMS[id] || TERMS['P.hot'];
    particles.spark(tm.x, tm.y, 7, 0.45);
    if (cursor) particles.bolt(tm.x, tm.y, cursor[0], cursor[1]);
    ev.pilot = now + 0.9; ev.kick = now;
    brk.v += 6;
    say('Breaker\'s ON! Kill the power before you touch any wires.', 4);
    if (!st.blown) { const m = K.whoa(); bulb.play(m.k, m.d); }
    SWS.forEach((s, i) => setTimeout(() => { const m2 = K.swFlinch(); s.toon.play(m2.k, m2.d, { slot: 'small' }); }, i * 120));
    glance(tm.x, tm.y, 1);
    status('The wires are LIVE. Flip the breaker OFF (click it, or press B) before touching them. The Tester shows what\'s live.');
  }

  /* ---------- 1.1 and 1.2: working safe, or not ----------
     Nothing stops you. Reach into it with the breaker ON and you find out the
     hard way (shockScare below). There is no proof-of-dead gate (owner, cp-v7):
     the neon tester is an optional tool for seeing what's live. */
  function workStarted() {}
  function freshBoard() {}
  function recepTap() {
    A.sfx.squeak();
    status('The circuit 2 outlet takes the tester\'s probes, not wires.');
    if (outlet) { const m = K.startle(0.4); outlet.play(m.k, m.d); }
    if (TB && !st.tester) TB.peekT = now + 0.8;
  }
  /* The player's own gloved hand, reaching in: a live screw throws a bolt up
     the arm, the X-ray shows every bone, and the hand yanks back smoking. A
     breaker never trips for this: a few milliamps through a person is nothing
     to a 15 A breaker and plenty to a heart. */
  const hand = el('g', { opacity: 0 }, L.fx);
  hand.setAttribute('pointer-events', 'none');
  const handG = el('g', {}, hand);
  el('path', { d: 'M-24,-46 L-84,-160', stroke: INK, 'stroke-width': 30, 'stroke-linecap': 'round' }, handG);
  el('path', { d: 'M-24,-46 L-84,-160', stroke: '#3a2a1a', 'stroke-width': 22, 'stroke-linecap': 'round' }, handG);
  el('use', { href: '#gl-point', transform: 'rotate(62) scale(1.25) translate(-44,0)' }, handG);
  const handBones = el('g', { opacity: 0 }, hand);
  el('path', { d: 'M-30,-54 L-82,-156 M-20,-50 L-72,-158', stroke: '#fbf6e6', 'stroke-width': 6, 'stroke-linecap': 'round' }, handBones);
  el('path', { d: 'M-16,-32 L2,4 M-26,-30 L-14,-8 M-6,-40 L4,-22', stroke: '#fbf6e6', 'stroke-width': 4.5, 'stroke-linecap': 'round' }, handBones);
  for (const [x, y] of [[2, 4], [-14, -8], [4, -22], [-16, -32]]) el('circle', { cx: x, cy: y, r: 3.2, fill: '#fbf6e6' }, handBones);
  const HS = { t0: -9, x: 0, y: 0 };
  function shockScare(id) {
    const tm = TERMS[id];
    st.work.shocks++;
    HS.t0 = now; HS.x = tm.x; HS.y = tm.y;
    cancelLead(); cancelJob();
    A.duck(3); A.sfx.zap(); A.sfx.neon(); setTimeout(() => A.sfx.ahh(), 120); setTimeout(() => A.sfx.buzzer(), 60);
    particles.spark(tm.x, tm.y, 16, 0.8); particles.bonk(tm.x, tm.y, 1.2);
    for (let i = 0; i < 3; i++) setTimeout(() => particles.bolt(tm.x, tm.y, tm.x - 70 + rand(-20, 20), tm.y - 150 + rand(-20, 20)), i * 110);
    ev.flash = now - 0.25; ev.shake = now - 0.1; ev.pilot = now + 0.6;
    if (!st.blown) { const m = K.scream(); bulb.play(m.k, m.d); }
    if (fuse) setTimeout(() => { const m = K.startle(0.9); fuse.play(m.k, m.d); }, 90);
    setTimeout(() => { particles.smoke(tm.x - 40, tm.y - 70, 3, 0.8, -20); }, 700);
    glance(tm.x, tm.y, 1.4);
    status(`ZAP! ${cap1(C.nameOf(LEVEL, id))} is live. The breaker didn't even notice.`);
    setTimeout(() => { if (App.current === SCREEN && !st.inspecting) once('zapped', () => say('The breaker\'s still ON! It doesn\'t trip for PEOPLE!', 3.6)); }, 1500);
  }
  /* the Hint button: what's actually wrong right now picks the topic; asking
     again on the same topic gets a clearer hint, then the rule itself */
  function hintTopic() {
    if (LEVEL.safety && st.power && !st.wires.length) return 'safety';
    if (!st.wires.length) return 'hot';
    const f = C.analyze(LEVEL, st.wires).primary;
    if (f) return HINT_TOPIC[f.code] || 'done';
    if (LEVEL.cables && C.cableFaults(LEVEL, namedWires()).length) return 'cable';
    if (LEVEL.colorCode && C.colorFaults(LEVEL, namedWires()).length) return 'color';
    return 'done';
  }
  const namedWires = () => st.wires.map(w => ({ a: w.a, b: w.b, color: COLOR_NAME[w.color] || 'black' }));
  function giveHint() {
    st.hint++;
    if (!LEVEL.hintSets) { say(LEVEL.hints[(st.hint - 1) % LEVEL.hints.length], 8); return; }
    const topic = hintTopic(), set = LEVEL.hintSets[topic] || GENERIC_HINTS[topic] || LEVEL.hintSets.done || GENERIC_HINTS.done;
    const n = st.hintTier[topic] = Math.min((st.hintTier[topic] || 0) + 1, set.length);
    /* (on 1.6 the boss of the box does the explaining) */
    if (LEVEL.hintVoice === 'sparky' && sparky) { const m = SPK.point(1); sparky.play(m.k, m.d); }
    say(set[n - 1], 7 + n, LEVEL.hintVoice && (LEVEL.hintVoice !== 'sparky' || sparky) ? LEVEL.hintVoice : 'bulb');
  }
  /* straight in, no questions: used when a wire is fully landed (and by tests) */
  function addWire(a, b, rope, landed) {
    if (a === b || !TERMS[a] || !TERMS[b]) return false;
    if (st.wires.some(w => (w.a === a && w.b === b) || (w.a === b && w.b === a))) { A.sfx.boing(); return false; }
    const w = { a, b, color: st.color };
    st.wires.push(w);
    syncWires(rope ? { w, rope } : null);
    if (!landed) { tighten(b, !!pig[b]); if (!rope) tighten(a, !!pig[a]); }
    evaluate();
    save();
    return true;
  }
  /* the screw runs down tight on the copper: a ratchet, a spark and a squirm from whoever owns it */
  function tighten(id, quiet) {
    const tm = TERMS[id];
    if (!quiet) { tm.spin = now; tm.spinDir = 1; A.sfx.ratchet(); particles.bonk(tm.x, tm.y, 0.75); particles.spark(tm.x, tm.y, 4, 0.28); }
    glance(tm.x, tm.y, 1.1);
    const who = ownerOf(id), lmp = lampOf(id);
    if (isSw(who)) { const me = swT(who), m = K.tickle(tm.x > me.cfg.x ? 1 : -1); me.play(m.k, m.d, { slot: 'small' }); }
    else if (lmp && !st.blown) { const m = K.tickle(tm.x > lmp.t.cfg.x ? 1 : -1); lmp.t.play(m.k, m.d, { slot: 'small' }); }
    else if (sparky && who === 'J') { const m = SPK.wince(); sparky.play(m.k, m.d, { slot: 'small' }); }
    else ev.pilot = Math.max(ev.pilot, now + 0.3);
  }
  function makeLoose(rope, k, color, pins, delay) {
    const P = rope.pts, n = P.length;
    const cut = clamp(k, 2, n - 3);
    const mk = (pts, pin) => {
      const r = { pts: pts.map(q => ({ x: q.x, y: q.y, px: q.px, py: q.py })), seg: rope.seg, still: 0, sleep: false };
      loose.push({ rope: r, o: wireEls(L.wires, color), pin, t0: now, drop: now + delay + rand(0.35, 0.55) });
    };
    mk(P.slice(0, cut + 1), pins[0] ? { end: 'a', at: pins[0] } : null);
    mk(P.slice(cut), pins[1] ? { end: 'b', at: pins[1] } : null);
  }
  const pinFor = id => ({ id, get x() { return pinOf(id)[0]; }, get y() { return pinOf(id)[1]; } });
  function cutWire(i, x, y) {
    if (i < 0 || i >= st.wires.length || st.inspecting || st.phBusy) return;
    if (st.power) { blockLive(st.wires[i].a); return; }
    if (lead || job) { cancelLead(); cancelJob(); return; }
    if (st.tester) return;
    workStarted();
    const w = st.wires[i], v = vis.get(w);
    let k = Math.floor(v.rope.pts.length / 2);
    if (x != null) { let bd = 1e9; v.rope.pts.forEach((q, j) => { const d = Math.hypot(q.x - x, q.y - y); if (d < bd) { bd = d; k = j; } }); }
    const cx = v.rope.pts[k].x, cy = v.rope.pts[k].y;
    makeLoose(v.rope, k, w.color, [pinFor(w.a), pinFor(w.b)], 0);
    st.wires.splice(i, 1);
    syncWires(); evaluate(); save(); freshBoard();
    A.sfx.snip();
    particles.bonk(cx, cy, 0.8); particles.spark(cx, cy, 3, 0.2);
    glance(cx, cy, 0.9);
  }
  function clearWires() {
    if (st.inspecting || st.phBusy) return;
    if (st.power) {
      if (!LEVEL.safety) { blockLive(); return; }
      /* snipping everything live: whichever wire is hot bites first */
      if (!st.wires.length) return;
      const ends = st.wires.flatMap(w => [w.a, w.b]);
      blockLive(ends.find(id => C.touch(LEVEL, st.wires, st.sw, id).shock) || ends[0]);
      return;
    }
    if (!st.wires.length) return;
    workStarted();
    cancelLead(); cancelJob();
    st.wires.forEach((w, i) => {
      const v = vis.get(w);
      makeLoose(v.rope, Math.floor(v.rope.pts.length / 2), w.color, [pinFor(w.a), pinFor(w.b)], i * 0.09);
      setTimeout(() => A.sfx.snip(), i * 90);
    });
    st.wires = []; syncWires(); evaluate(); save(); freshBoard();
  }
  function cricket() { if (!A.ready) return; setTimeout(() => { A.sfx.hover(); setTimeout(() => A.sfx.hover(), 90); }, 500); }

  /* ---------- running a wire: drag, or click one screw then another ---------- */
  let lead = null, cursor = null;
  const termAt = (x, y, r = 34, skip = null) => {
    let best = null, bd = r;
    for (const [id, tm] of Object.entries(TERMS)) { if (id === skip) continue; const dd = Math.hypot(tm.x - x, tm.y - y); if (dd < bd) { bd = dd; best = id; } }
    return best;
  };
  function startLead(id, mode) {
    cancelLead(true);
    const [x, y] = pinOf(id);
    const rope = makeRope(x, y, x + 1, y + 1, 16);
    lead = { from: id, mode, rope, o: wireEls(L.drag, st.color), hand: { x, y }, target: null, moved: false, retract: -1 };
    A.sfx.tick();
  }
  function cancelLead(instant) {
    if (!lead) return;
    if (instant) { removeEls(lead.o); lead = null; return; }
    if (lead.retract < 0) { lead.retract = now; A.sfx.boing(); }
  }

  /* ---------- C + F. landing a wire: wrap it round the screw, pigtail doubled screws ---------- */
  let job = null;
  /* the wrap control lives right on the screw: a dashed guide round the head and
     a brass grip on the end of the copper. Drag the grip round the screw and the
     copper wraps with it. Clockwise (the way a screw tightens) holds; the other
     way gets squeezed out when the screw goes down. */
  const WR = 38, WRAP_OK = 4.6, WRAP_BAD = -3.8;
  const wrapUI = el('g', { opacity: 0 }, L.ui);
  el('circle', { r: WR, fill: 'none', stroke: '#1a0c05', 'stroke-width': 7, opacity: 0.25 }, wrapUI);
  el('circle', { r: WR, fill: 'none', stroke: '#fff3a0', 'stroke-width': 3, 'stroke-dasharray': '6 8', opacity: 0.85 }, wrapUI);
  const wrapHint = el('path', { fill: 'none', stroke: '#9fe0a8', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0 }, wrapUI);
  const wrapGrip = el('g', { class: 'clicky wrapgrip', role: 'slider', tabindex: 0, 'aria-label': 'Wrap the copper round the screw: drag the grip around it, or use the arrow keys' }, wrapUI);
  el('circle', { r: (TOUCH ? 32 : 22) / KZ, fill: 'transparent' }, wrapGrip);
  el('circle', { r: 13, fill: 'url(#gGold)', stroke: INK, 'stroke-width': 3 }, wrapGrip);
  el('path', { d: 'M-6,-3 H6 M-6,1 H6 M-6,5 H6', stroke: '#7a5316', 'stroke-width': 1.6 }, wrapGrip);
  el('circle', { cx: -4, cy: -5, r: 2.4, fill: '#fff6d8', opacity: 0.8 }, wrapGrip);
  const angDiff = d => { while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };
  function askWrap(id) {
    return new Promise(res => {
      const t = TERMS[id], P = job.rope.pts, q = P[Math.max(0, P.length - 4)];
      job.wrap = { t, id, a0: Math.atan2(q.y - t.y, q.x - t.x), s: 0, res, drag: false, last: 0 };
      job.endB = { t, s: 0 };
      wrapUI.setAttribute('transform', `translate(${t.x},${t.y})`);
      wrapUI.style.display = ''; wrapUI.setAttribute('opacity', 1);
      const a = job.wrap.a0;
      /* after a slip, show which way the screw turns */
      wrapHint.setAttribute('d', `M${R(Math.cos(a) * (WR + 12))},${R(Math.sin(a) * (WR + 12))} A${WR + 12},${WR + 12} 0 1,1 ${R(Math.cos(a + 4.4) * (WR + 12))},${R(Math.sin(a + 4.4) * (WR + 12))} l-9,-4 m9,4 l1,-10`);
      wrapHint.setAttribute('opacity', st.wrapMissed ? 0.9 : 0);
      once('wrap', () => say('Now wrap the copper round the screw: drag the brass grip around it. Which way does a screw tighten?', 7, talker(id)));
      status('Wrap it: drag the brass grip around the screw' + (TOUCH ? ' with your finger.' : ' (arrow keys work too).'));
      try { wrapGrip.focus({ preventScroll: true }); } catch (e) { /* no focus */ }
    });
  }
  function hideWrap() { wrapUI.setAttribute('opacity', 0); wrapUI.style.display = 'none'; }
  hideWrap();
  function wrapBy(d) {
    const w = job && job.wrap;
    if (!w) return;
    w.s = clamp(w.s + d, -5.6, 5.6);
    job.endB = { t: w.t, s: w.s };
    if (Math.abs(d) > 0.02 && Math.floor(Math.abs(w.s) / 1.2) !== Math.floor(Math.abs(w.s - d) / 1.2)) A.sfx.tick();
    if (w.s >= WRAP_OK || w.s <= WRAP_BAD) {
      const r = w.res;
      job.wrap = null;
      hideWrap();
      r(w.s > 0);
    }
  }
  wrapGrip.addEventListener('pointerdown', e => {
    const w = job && job.wrap;
    if (!w) return;
    e.stopPropagation(); e.preventDefault();
    const [x, y] = toW(e);
    w.drag = true; w.last = Math.atan2(y - w.t.y, x - w.t.x);
    try { svg.setPointerCapture(e.pointerId); } catch (err) { /* capture unsupported */ }
  });
  wrapGrip.addEventListener('keydown', e => {
    if (!job || !job.wrap) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); wrapBy(Math.PI / 4); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); wrapBy(-Math.PI / 4); }
  });
  async function landWire(from, target, rope, o) {
    if (from === target || st.wires.some(w => (w.a === from && w.b === target) || (w.a === target && w.b === from))) {
      A.sfx.boing(); removeEls(o); return;
    }
    job = { from, target, rope, o, endB: 'free', pinB: [TERMS[target].x, TERMS[target].y] };
    const me = job;
    /* (a conductor end or a splice point is never wrapped round a screw: the
       conductors are twisted together under a wire nut, below) */
    if (countAt(target) === 0 && !TERMS[target].nut) {
      /* 1.1: every end gets stripped by hand first */
      if (GUIDE) {
        await askStrip(target);
        if (job !== me) return;
      }
      if (st.hookOk < 3 || GUIDE) {
        const ok = await askWrap(target);
        hideWrap();
        if (job !== me) return;
        if (!ok) { slipOff(); return; }
        st.hookOk++; st.wrapMissed = false;
        if (st.hookOk === 3 && !GUIDE) setTimeout(() => say('You\'ve got the hang of wrapping. I\'ll wrap them clockwise for you from now on.', 5), 700);
      }
      job.endB = TERMS[target];
      tighten(target);
    }
    for (const id of [target, from]) {
      if (countAt(id) === 0 && !TERMS[id].nut) continue;
      const pg = makePigtail(id, id === target ? from : target, false);
      if (id === target) { job.endB = 'nut'; job.pinB = pg.J; }
      else job.pinA = pg.J;
      const ok = await twistNut(id);
      if (job !== me || !ok) return;
    }
    const j = job;
    job = null;
    removeEls(j.o);
    addWire(from, target, j.rope, true);
    status(st.power ? 'Breaker ON.' : LEVEL.safety ? 'Wire landed.' : 'Wire landed. Breaker OFF, safe to keep wiring.');
  }
  /* ---------- 1.1: stripping the end. The strippers bite the insulation a
     little way back from the end; pull them off the end and the slug of
     insulation comes with them, leaving bare copper to wrap ---------- */
  const stripUI = el('g', { opacity: 0 }, L.ui);
  const stripGrip = el('g', { class: 'clicky wrapgrip', role: 'button', tabindex: 0, 'aria-label': 'Wire strippers: drag them off the end of the wire, or press Enter' }, stripUI);
  el('circle', { r: (TOUCH ? 36 : 26) / KZ, fill: 'transparent' }, stripGrip);
  el('path', { d: 'M8,-5 L64,-16 Q72,-17 72,-10 L72,-6 L10,4 Z M8,5 L64,16 Q72,17 72,10 L72,6 L10,-4 Z', fill: '#c7322b', stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round' }, stripGrip);
  el('path', { d: 'M-10,-9 H10 V9 H-10 Z', fill: 'url(#gSteel)', stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round' }, stripGrip);
  el('circle', { cx: 10, cy: 0, r: 4, fill: 'url(#gSteel)', stroke: INK, 'stroke-width': 2 }, stripGrip);
  el('path', { d: 'M-10,0 H-2', stroke: INK, 'stroke-width': 2.2 }, stripGrip);
  const stripArrow = el('path', { d: 'M-30,0 H-70 M-58,-9 L-72,0 L-58,9', fill: 'none', stroke: '#ffe27a', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, stripUI);
  const slugs = [];
  const STRIP_PULL = 46;
  function askStrip(id) {
    return new Promise(res => {
      const t = TERMS[id], P = job.rope.pts, q = P[Math.max(0, P.length - 5)];
      let dx = q.x - t.x, dy = q.y - t.y; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
      job.endB = 'jacket';
      job.strip = { t, id, dx, dy, x0: t.x + dx * 30, y0: t.y + dy * 30, p: 0, drag: false, res };
      stripUI.style.display = ''; stripUI.setAttribute('opacity', 1);
      once('strip', () => say('Strip it first! Copper can\'t touch a screw through plastic.', 4.5, talker(id)));
      status('Strip it: drag the red strippers off the end of the wire' + (TOUCH ? '.' : ' (or press Enter).'));
      try { stripGrip.focus({ preventScroll: true }); } catch (e) { /* no focus */ }
    });
  }
  function hideStrip() { stripUI.setAttribute('opacity', 0); stripUI.style.display = 'none'; }
  hideStrip();
  function stripDone() {
    const s = job && job.strip;
    if (!s) return;
    job.strip = null; hideStrip();
    job.endB = 'free';
    A.sfx.snip(); setTimeout(() => A.sfx.pop(), 60);
    const col = (WCOL[job.o.color] || WCOL['#1c1c1e'])[0];
    const g = el('g', {}, L.fx);
    el('rect', { x: -9, y: -5, width: 18, height: 10, rx: 4, fill: col, stroke: INK, 'stroke-width': 2.5 }, g);
    el('rect', { x: 5, y: -2.5, width: 3, height: 5, fill: '#d98a4a' }, g);
    slugs.push({ g, x: s.t.x, y: s.t.y, vx: -s.dx * 260 + rand(-40, 40), vy: -s.dy * 200 - 240, r: 0, vr: rand(-900, 900), t0: now });
    particles.bonk(s.t.x, s.t.y, 0.6);
    s.res(true);
  }
  function stripTo(p) {
    const s = job && job.strip;
    if (!s) return;
    s.p = clamp(p, 0, STRIP_PULL + 10);
    if (s.p >= STRIP_PULL) stripDone();
  }
  stripGrip.addEventListener('pointerdown', e => {
    const s = job && job.strip;
    if (!s) return;
    e.stopPropagation(); e.preventDefault();
    const [x, y] = toW(e);
    s.drag = true; s.px = x; s.py = y; s.p0 = s.p;
    try { svg.setPointerCapture(e.pointerId); } catch (err) { /* capture unsupported */ }
  });
  stripGrip.addEventListener('keydown', e => { if (job && job.strip && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); e.stopPropagation(); stripDone(); } });
  /* hooked backwards: tightening the screw squeezes the copper right out */
  function slipOff() {
    const j = job;
    job = null;
    const t = TERMS[j.target];
    t.spin = now; t.spinDir = 1;
    A.sfx.ratchet(); setTimeout(() => A.sfx.boing(), 180);
    particles.bonk(t.x, t.y, 0.9);
    const last = j.rope.pts[j.rope.pts.length - 1];
    last.px = last.x + 14; last.py = last.y + 10;
    loose.push({ rope: j.rope, o: j.o, pin: { end: 'a', at: pinFor(j.from) }, t0: now, drop: now + 0.9 });
    st.hookOk = 0; st.wrapMissed = true;
    if (LEVEL.hintSets) { say('It squeezed right out from under the screw!', 4, talker(j.target)); status('The wire slipped off the screw. Run it again.'); return; }
    say('Backwards! A screw tightens clockwise, so wire wrapped the other way gets squeezed right out. Wrap it clockwise.', 7, talker(j.target));
    status('The wire slipped off the screw. Run it again, and wrap it clockwise.');
  }
  function cancelJob() {
    if (!job) return;
    const j = job;
    job = null;
    hideWrap(); hideStrip();
    for (const [id, pg] of Object.entries(pig)) if (!pg.snug && pg.res) { pg.res = null; if (countAt(id) >= nutAt(id)) pg.snug = true; else dropPigtail(id); }
    loose.push({ rope: j.rope, o: j.o, pin: { end: 'a', at: pinFor(j.from) }, t0: now, drop: now + 0.4 });
    A.sfx.boing();
  }

  /* ---------- B. the two-lead neon tester ----------
     A real one: two probes on red and black leads, and the neon lamp in the
     little body between them. It only lights when there's a voltage BETWEEN
     the two probe tips (circuit.js neonBetween), so you test one point against
     another: hot to neutral, hot to ground. Touch one probe to a screw or a
     receptacle opening, then the other. */
  const testerG = el('g', { opacity: 0 }, L.ui);
  testerG.setAttribute('pointer-events', 'none');
  const leadEls = ['#c7322b', '#2c2c31'].map(c => [el('path', { fill: 'none', stroke: INK, 'stroke-width': 6.5, 'stroke-linecap': 'round' }, testerG), el('path', { fill: 'none', stroke: c, 'stroke-width': 3.4, 'stroke-linecap': 'round' }, testerG)]);
  const tBody = el('g', {}, testerG);
  const tGlow = el('circle', { cx: 0, cy: 0, r: 46, fill: 'url(#gNeon)', opacity: 0, style: 'mix-blend-mode:screen' }, tBody);
  let neonAt = null; /* where the tester's neon is glowing, for the light pass */
  el('rect', { x: -26, y: -10, width: 52, height: 20, rx: 9, fill: 'url(#gPen)', stroke: INK, 'stroke-width': 3 }, tBody);
  el('rect', { x: -11, y: -6, width: 22, height: 12, rx: 5, fill: '#3a2a1a', stroke: INK, 'stroke-width': 2 }, tBody);
  const tNeon = el('ellipse', { cx: 0, cy: 0, rx: 8, ry: 2.6, fill: '#6a3a22' }, tBody);
  el('path', { d: 'M-20,-5 H-14 M14,-5 H20', stroke: '#fff6d8', 'stroke-width': 2, opacity: 0.8, 'stroke-linecap': 'round' }, tBody);
  const probeEls = ['#c7322b', '#2c2c31'].map(c => {
    const g = el('g', {}, testerG);
    el('path', { d: 'M0,0 L-2.6,-9 H2.6 Z', fill: 'url(#gSteel)', stroke: INK, 'stroke-width': 1.8, 'stroke-linejoin': 'round' }, g);
    el('rect', { x: -2, y: -24, width: 4, height: 16, fill: 'url(#gSteel)', stroke: INK, 'stroke-width': 1.8 }, g);
    el('ellipse', { cx: 0, cy: -25, rx: 8.5, ry: 3.4, fill: c, stroke: INK, 'stroke-width': 2.2 }, g);
    el('rect', { x: -6, y: -70, width: 12, height: 45, rx: 5, fill: c, stroke: INK, 'stroke-width': 2.8 }, g);
    el('path', { d: 'M-2.5,-64 V-34', stroke: '#fff6d8', 'stroke-width': 2, opacity: 0.55, 'stroke-linecap': 'round' }, g);
    return g;
  });
  const tester = { a: null, b: null, glow: false, t: -9, hover: null, moved: -9 };
  const btnTester = document.getElementById('btnTester');
  /* every point a probe can touch: the screws, and the receptacle's openings */
  const cap1 = s => s.charAt(0).toUpperCase() + s.slice(1);
  const ptOf = id => ({ id, x: TERMS[id].x, y: TERMS[id].y, name: C.nameOf(LEVEL, id) });
  const allPts = () => Object.keys(TERMS).map(ptOf).concat(REC || []);
  const nearPt = (x, y, r) => { let best = null, bd = r; for (const p of allPts()) { const d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = p; } } return best; };
  /* what's under a probe tip, in volts: circuit 2 is always live; circuit 1 is
     whatever circuit.js says, breaker ON or OFF */
  const probeV = id => (id in C.RECEPTACLE ? C.RECEPTACLE[id] : C.probeVolts(LEVEL, st.wires, st.sw, st.power && !st.blown && !st.trip)[id]);
  function setTester(on) {
    st.tester = on;
    btnTester.setAttribute('aria-pressed', String(on));
    App.frame.classList.toggle('testing', on);
    tester.a = tester.b = tester.hover = null; tester.glow = false;
    if (on) {
      cancelLead(); cancelJob(); A.sfx.tick(); if (TB) A.sfx.clack();
      status('Tester in hand: touch one probe to a screw or a slot, then the other. (T puts it away.)');
      if (!LEVEL.safety) once('tester', () => say('The neon tester! It lights up when there\'s voltage BETWEEN its two probes.', 6));
    } else status(st.power ? 'Breaker ON.' : 'Breaker OFF.');
  }
  function probe(p) {
    if (!p) return;
    glance(p.x, p.y, 0.9);
    particles.bonk(p.x, p.y, 0.22);
    /* a probe in the outlet: it tickles */
    if (outlet && REC.includes(p)) { const m = K.tickle(p.lx > 0 ? 1 : -1); outlet.play(m.k, m.d, { slot: 'small' }); }
    if (!tester.a || tester.b) {
      tester.a = p; tester.b = null; tester.glow = false;
      A.sfx.tick();
      status(`Tester: one probe on ${p.name}. Now the other probe.`);
      return;
    }
    if (p.id === tester.a.id && p.x === tester.a.x && p.y === tester.a.y) { tester.a = null; A.sfx.tick(); status('Tester: probes lifted.'); return; }
    tester.b = p;
    readTester();
  }
  function readTester() {
    const a = tester.a, b = tester.b;
    const glow = C.neonBetween(probeV(a.id), probeV(b.id));
    tester.glow = glow; tester.t = now;
    if (glow) A.sfx.neon(); else A.sfx.tick();
    glance((a.x + b.x) / 2, (a.y + b.y) / 2, 1.1);
    const msg = `Tester: ${a.name} to ${b.name}: ${glow ? 'it GLOWS.' : 'no glow.'}`;
    status(cap1(msg.replace('Tester: t', 'Tester: T')));
    if (glow && !(a.id in C.RECEPTACLE && b.id in C.RECEPTACLE) && !st.blown && !bulb.actions.length) { const m = K.startle(0.35); bulb.play(m.k, m.d); }
  }
  /* a probe landing on whatever the pointer or keyboard picked */
  function probeFrom(g) {
    if (g.dataset.probe != null) return REC[+g.dataset.probe];
    return ptOf(g.dataset.term);
  }
  const testAt = id => probe(id in C.RECEPTACLE ? REC.find(p => p.id === id) : ptOf(id));

  /* ---------- the dead short: a set piece ---------- */
  function soot(x, y, r) { soots.push(el('ellipse', { cx: x, cy: y, rx: r, ry: r * 0.8, fill: 'url(#gSoot)', opacity: 0 }, L.soot)); }
  /* What a bolted fault really does: fault current, an arc where hot meets
     neutral (or ground), and the breaker trips instantly. The shop lamp is on
     another circuit, so it only dips as the voltage sags.
     The bulb (owner's rule, and what really happens): it blows ONLY when the
     fault lands right on its own socket terminals, the BRASS or SILVER screw
     (circuit.js atSocket(), from the fault location fault.at). Then the arc is
     inside the lampholder, and its heat and blast crack and burn the lamp, and
     a replacement has to be lowered in. A short anywhere else bypasses the
     lamp: no current through it, so it doesn't light or blow; it just screams.
     The cartoon part is the size of it all. */
  function arcBlast(fault) {
    const p1 = TERMS[fault.at[0]], p2 = TERMS[fault.at[1]] || p1;
    const inSocket = !st.blown && C.atSocket(LEVEL, fault);
    bubS.until = Math.min(bubS.until, now);
    cancelLead(); cancelJob();
    ev.arc = now + 0.5; ev.arcA = p1; ev.arcB = p2;
    particles.spark(p1.x, p1.y, 26, 1.2); particles.spark(p2.x, p2.y, 14, 0.9);
    particles.bonk(p1.x, p1.y, 2); particles.smoke(p1.x, p1.y, 5, 1);
    ev.flash = now; ev.shake = now; ev.dip = now;
    lamp.w += 1.6;
    shakeWires(1.4);
    for (const v of vis.values()) v.surge = now + 0.4;
    A.duck(4);
    A.sfx.zap(); A.sfx.boom();
    soot(p1.x, p1.y, 36);
    ev.sootOn = true; ev.soot = now;
    if (inSocket) blowBulb(lampOf(fault.at[0]) || LAMPS[0]);
    if (!st.blown || inSocket) for (const l of LAMPS) if (!inSocket || lampOf(fault.at[0]) !== l) { const m = K.scream(); l.t.play(m.k, m.d); }
    SWS.forEach((s, i) => setTimeout(() => { const m2 = K.startle(1 - i * 0.2); s.toon.play(m2.k, m2.d); }, i * 140));
    /* the bang pops Sparky's monocle clean out */
    if (sparky) setTimeout(() => { const m4 = SPK.startle(); sparky.play(m4.k, m4.d); }, 40);
    if (fuse) {
      setTimeout(() => { const m3 = K.startle(0.8); fuse.play(m3.k, m3.d); }, 60);
      once('fuseTrip', () => setTimeout(() => say('Back in MY day I\'d have BLOWN for that, and you\'d be buying a new me! A breaker just resets.', 5, 'fuse'), 2600));
    }
    /* the breaker trips: its handle snaps to the middle, the flag drops */
    setTimeout(() => {
      st.power = false; st.trip = true; ev.tripT = now;
      brk.v -= 14; A.sfx.clunk(false);
      evaluate();
    }, 90);
  }
  /* the blow-up, in three beats: the arc in the socket lifts him off his feet,
     the glass cracks, then it goes. What's left is his scorched brass base, with
     his face peering out over the broken collar. */
  /* (every light on the board carries its own cracks and scorched base) */
  for (const l of LAMPS) {
    const t = l.t;
    l.glass = t.parts.glass || [];
    l.cracks = el('g', { opacity: 0 }, t.bodyG);
    for (const [d, w] of [['M-8,-224 L0,-206 L-12,-194 L-4,-186 M0,-206 L16,-200 L22,-212', 3.4], ['M62,-160 L48,-150 L56,-134 L42,-120 M48,-150 L34,-156', 3.4], ['M-60,-128 L-48,-120 L-54,-106', 3]]) {
      el('path', { d, fill: 'none', stroke: INK, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, l.cracks);
      el('path', { d, fill: 'none', stroke: '#ffffff', 'stroke-width': 1.3, 'stroke-linecap': 'round', opacity: 0.8, transform: 'translate(1.5,1)' }, l.cracks);
    }
    const burnt = l.burnt = el('g', { style: 'display:none' }, t.bodyG);
    t.bodyG.insertBefore(burnt, t.faceG);
    /* the broken glass collar, the soot on the brass, the filament frizzled */
    el('path', { d: 'M-25,-57 L-30,-76 L-20,-68 L-15,-88 L-6,-70 L2,-84 L9,-68 L19,-80 L27,-57 Q0,-63 -25,-57 Z', fill: '#ede6d2', stroke: INK, 'stroke-width': 4.5, 'stroke-linejoin': 'round' }, burnt);
    el('path', { d: 'M-24,-60 Q0,-66 26,-60', fill: 'none', stroke: '#5a4a38', 'stroke-width': 5, opacity: 0.55 }, burnt);
    el('path', { d: 'M-8,-58 L-12,-80 L-4,-86 M8,-58 L13,-78 L6,-84', fill: 'none', stroke: '#4a3a2c', 'stroke-width': 2.8, 'stroke-linejoin': 'round' }, burnt);
    l.ember = el('path', { d: 'M-4,-86 q3,-6 5,0 t5,0', fill: 'none', stroke: '#ff9a3a', 'stroke-width': 3, 'stroke-linecap': 'round' }, burnt);
    el('ellipse', { cx: -8, cy: -30, rx: 16, ry: 10, fill: '#1a0f0a', opacity: 0.55 }, burnt);
    el('ellipse', { cx: 12, cy: -44, rx: 10, ry: 7, fill: '#1a0f0a', opacity: 0.45 }, burnt);
  }
  /* the light that blew (or is being replaced) */
  let BL = LAMPS[0];
  function setBurnt(on, l = BL) {
    l.t.burnt = on;
    st.burnt = LAMPS.some(x => x.t.burnt);
    for (const g of l.glass) g.style.display = on ? 'none' : '';
    l.burnt.style.display = on ? '' : 'none';
    l.cracks.setAttribute('opacity', 0);
  }
  function blowBulb(l = LAMPS[0]) {
    BL = l;
    const bulb = l.t, cracks = l.cracks;
    st.blown = true;
    const m = K.blowUp(); bulb.play(m.k, m.d);
    const [gx, gy] = bulb.world(0, -150);
    const [sx, sy] = bulb.world(0, -40);
    particles.spark(sx, sy, 22, 1.1); particles.bonk(sx, sy, 1.4);
    setTimeout(() => {
      if (!st.blown) return;
      cracks.setAttribute('opacity', 1);
      A.sfx.clack(); A.sfx.gulp();
      particles.bonk(bulb.world(-4, -206)[0], bulb.world(-4, -206)[1], 0.6);
      const m2 = K.crackLook(); bulb.play(m2.k, m2.d);
    }, 380);
    setTimeout(() => {
      if (!st.blown) return;
      const [cx, cy] = bulb.world(0, -150);
      setBurnt(true, l);
      A.sfx.shatter(); A.sfx.pop();
      particles.shards(cx, cy, 26, 590); particles.bonk(cx, cy, 2.2); particles.smoke(cx, cy, 7, 1.3);
      soot(cx, cy + 40, 60);
      ev.flash = now - 0.2; ev.shake = now - 0.15;
      SWS.forEach((s, i) => setTimeout(() => { const m3 = K.whoa(); s.toon.play(m3.k, m3.d); }, 80 + i * 150));
      /* the shards tinkle down onto the bench */
      for (const d of [0.9, 1.05, 1.25, 1.5]) setTimeout(() => A.sfx.tick(), d * 1000);
      /* smoke keeps curling off the base for a while */
      for (let i = 1; i <= 5; i++) setTimeout(() => { if (st.burnt) { const [ex, ey] = bulb.world(0, -90); particles.smoke(ex, ey, 1, 0.5, 8); } }, 400 + i * 450);
      const m4 = { d: 3, k: [[0.05, { sy: 0.86, sx: 1.08, hipY: 6, lid: 0.55, pupil: 0.4, browTilt: 1.3, mouth: 'worry', mouthOpen: 0.5, lhx: -40, lhy: 40, rhx: 40, rhy: 40, lg: 'back', rg: 'back', knee: 0.6, shake: 1.2 }], [0.5, { lean: -6 }], [0.9, { lean: 4 }]] };
      bulb.play(m4.k, m4.d);
      setTimeout(() => { if (st.burnt) say('...ow.', 2.2, l === LAMPS[0] ? 'husk' : l.id); }, 1500);
      setTimeout(() => { if (st.burnt && (SWS.length || outlet)) say(SWS.length > 1 ? 'He POPPED! Right in his own socket!' : 'He... he POPPED! Right in his own socket!', 3, SWS.length ? SWS[SWS.length - 1].id : 'sw'); }, 3000);
    }, 1000);
    glance(gx, gy, 2);
  }
  async function deadShort(res) {
    st.faultLock = true; st.shorts++;
    /* the fault exactly as it happens in the switch position the player chose */
    const fault = C.boltedAt(LEVEL, st.wires, st.sw) || { code: 'short', at: res.shortPairs[0], trips: true, state: Object.assign({}, st.sw) };
    arcBlast(fault);
    status(`Breaker TRIPPED: ${fault.code === 'ground-fault' ? 'hot touched ground' : 'hot met neutral'} at ${C.nameOf(LEVEL, fault.at[0])}. Reset it OFF, then fix the wiring.`);
    if (A.settings.scares) setTimeout(() => phantomAfterShort(), 900);
    await wait(0.5);
    if (!st.blown) { const m3 = K.shaky(); bulb.play(m3.k, m3.d); }
    await wait(st.blown ? 4.2 : A.settings.scares ? 3.6 : 2.2);
    if (App.current !== SCREEN) { st.faultLock = false; return; }
    const d = C.describe(LEVEL, fault);
    showResult({ pass: false, tripped: true, danger: true, title: d.title, msg: d.msg + ' The breaker did its job. Reset it by switching it fully OFF, fix the wiring, then try again.' });
  }
  /* "New bulb, please": a cord comes down, hooks the scorched one by the collar
     and hauls him up and out, then the fresh one is lowered in on it */
  function newBulb() {
    const bulb = BL.t;
    if (st.burnt) {
      st.faultLock = true;
      bulb.actions = [];
      ev.haul0 = now;
      A.sfx.slide(false);
      setTimeout(() => {
        const [hx, hy] = bulb.world(0, -96);
        A.sfx.clack(); particles.bonk(hx, hy, 0.8);
        if (SWS.length || outlet) say('So long, pal!', 2, 'sw');
        bulb.play([[0, { lhx: -16, lhy: -150, rhx: 16, rhy: -150, lg: 'fist', rg: 'fist', lLayer: 'front!', rLayer: 'front!', lookY: -1, mouth: 'worry', mouthOpen: 0.6 }], [0.2, { hipY: 20, sy: 0.9 }], [1, { hipY: -640, lfy: 660, rfy: 650, sy: 1.1, knee: 0.8 }]], 0.8, { cues: [[0.2, () => A.sfx.whoosh()]] });
      }, 550);
      setTimeout(() => { setBurnt(false); lowerBulb(); }, 1500);
      return;
    }
    lowerBulb();
  }
  function lowerBulb() {
    const bulb = BL.t, BULB = BL.def;
    st.blown = false; st.faultLock = false;
    ev.sootOn = false; ev.soot = now;
    status('Breaker OFF. Safe to wire. Drag from one screw to another.');
    bulb.root.style.display = '';
    bulb.actions = [];
    bulb.p.hipY = -600; bulb.p.lfy = 618; bulb.p.rfy = 608; bulb.v.hipY = bulb.v.lfy = bulb.v.rfy = 0;
    ev.cord0 = now; ev.cord1 = now + 2.8 * 0.62;
    const k = BULB.s / 0.8;
    const land = () => { A.sfx.thud(); particles.bonk(BULB.x, BULB.y, 1.1 * k); particles.smoke(BULB.x - 44 * k, BULB.y + 2, 2, 0.5 * k, -30); particles.smoke(BULB.x + 44 * k, BULB.y + 2, 2, 0.5 * k, 30); };
    bulb.play([
      /* feet dangle with the body (the rig's feet are measured up from the socket) */
      [0, { hipY: -600, lhx: 26, lhy: -196, rhx: -26, rhy: -196, lg: 'fist', rg: 'fist', lLayer: 'front!', rLayer: 'front!', lfy: 618, rfy: 608, knee: 0.7, lookY: 1, mouth: 'worry', browRaise: 1.1, sweat: 1, pupil: 0.6, shake: 0.8 }],
      [0.5, { hipY: -26, lfy: 38, rfy: 30 }],
      [0.56, { hipY: 0, sy: 0.8, sx: 1.14, lfy: 0, rfy: 0, lookY: 0.5 }],
      [0.64, { sy: 1.06, sx: 0.96, lhx: -22, lhy: 50, rhx: 22, rhy: 50, lg: 'fist', rg: 'fist', lookY: 0 }],
      [0.72, { turn: 0.55, sy: 1 }], [0.78, { turn: -0.55 }], [0.84, { turn: 0.5 }], [0.9, { turn: 0 }],
    ], 2.8, { cues: [[0.01, () => A.sfx.slide(false)], [0.56, land], [0.72, () => A.sfx.ratchet()], [0.78, () => A.sfx.ratchet()], [0.84, () => A.sfx.ratchet()], [0.95, () => { say('P-please get it right this time...', 5, BL.id === 'L1' ? 'bulb' : BL.id); const m = K.shaky(); bulb.play(m.k, m.d); }]] });
    evaluate();
  }

  /* ---------- A. the Inspector: traces the job terminal by terminal ---------- */
  const IN = { st: 'off', v: 0, dir: -1, ph: 0, goal: 820, skip: false, aim: null, fly: null, xray: -9, dazed: -9, capFly: null };
  const iwait = s => new Promise(r => {
    const t0 = now;
    const tick = () => { if (IN.skip || now - t0 >= s) r(); else setTimeout(tick, 50); };
    setTimeout(tick, 50);
  });
  const walkTo = x => new Promise(r => {
    if (Math.abs(x - insp.cfg.x) < 6) { r(); return; }
    IN.goal = x; IN.dir = x < insp.cfg.x ? -1 : 1; IN.st = 'walk'; IN.arrive = r;
  });
  /* where he stands on the bench to reach a terminal with his probe */
  const standAt = id => clamp(TERMS[id].x + (TERMS[id].x < 330 ? 74 : 36), 340, W - 170);
  const marks = el('g', {}, L.ui);
  marks.setAttribute('pointer-events', 'none');
  /* his cap, once it's knocked off: a contact shadow on the bench under it */
  const CAP_FLOOR = 586;
  const capShadow = el('ellipse', { cx: 0, cy: 595, rx: 42, ry: 7, fill: '#1a0c05', opacity: 0 }, L.fore);
  const capFly = el('g', { opacity: 0 }, L.fore);
  /* it lies on the bench behind his feet, so he can walk past it */
  L.fore.insertBefore(capShadow, inspWrap); L.fore.insertBefore(capFly, inspWrap);
  capShadow.setAttribute('pointer-events', 'none'); capFly.setAttribute('pointer-events', 'none');
  el('path', { d: 'M-31,-2 Q-29,-30 0,-32 Q29,-30 31,-2 Z', fill: '#2c3a52', stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round' }, capFly);
  el('path', { d: 'M-41,0 Q0,5 43,-1 Q44,4 40,6 Q0,11 -40,6 Q-44,4 -41,0 Z', fill: '#18202e', stroke: INK, 'stroke-width': 2.6 }, capFly);
  el('path', { d: 'M0,-26 L3,-20 L10,-19 L5,-15 L6,-8 L0,-12 L-6,-8 L-5,-15 L-10,-19 L-3,-20 Z', fill: 'url(#gGold)', stroke: INK, 'stroke-width': 1.4 }, capFly);
  const dizzy = [0, 1, 2].map(() => el('path', { d: 'M0,-8 L2.4,-2.4 L8,0 L2.4,2.4 L0,8 L-2.4,2.4 L-8,0 L-2.4,-2.4 Z', fill: '#ffe45a', stroke: INK, 'stroke-width': 2, opacity: 0 }, L.fx));
  function markOK(id) {
    const t = TERMS[id];
    el('path', { d: `M${t.x + 16},${t.y - 26} l6,7 l12,-16`, fill: 'none', stroke: '#1a0c05', 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.35 }, marks);
    el('path', { d: `M${t.x + 16},${t.y - 26} l6,7 l12,-16`, fill: 'none', stroke: '#b8f0a0', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, marks);
  }
  function markBad(id) {
    const t = TERMS[id];
    el('circle', { cx: t.x, cy: t.y, r: 27, fill: 'none', stroke: '#ff5a3a', 'stroke-width': 4, 'stroke-dasharray': '7 5' }, marks);
  }
  insp.brain = (t, dt, tg, d) => {
    insp.profile = IN.st === 'walk' ? IN.dir : 0;
    tg.browTilt = 0.9; tg.lid = 0.3;
    if (IN.st === 'walk') {
      const ph2 = IN.ph, cyc = Math.cos(2 * Math.PI * ph2);
      tg.hipY += -5 * (0.5 - 0.5 * Math.cos(4 * Math.PI * ph2));
      tg.turn = IN.dir * 0.55; tg.lean += IN.dir * 3; tg.knee = 0.25;
      tg.rhx = 24 + IN.dir * 14 * cyc; tg.rhy += 3 * Math.abs(Math.sin(2 * Math.PI * ph2));
      tg.lhx = -34; tg.lhy = 30; d.lg = 'fist'; d.rg = 'fist';
      d[IN.dir > 0 ? 'rLayer' : 'lLayer'] = 'back';
      insp.attn = null; tg.lookX = IN.dir * 0.7;
      return;
    }
    if (IN.st === 'fly' || IN.st === 'zap') return;
    /* clipboard hand tucked in; the red probe reaches for whatever he's examining */
    tg.lhx = -34; tg.lhy = 30;
    const aim = IN.aim;
    if (aim) {
      const [sx, sy] = insp.world(52, -134);
      const dx = aim[0] - sx, dy = aim[1] - sy, dd = Math.hypot(dx, dy) || 1, k = Math.max(0, dd - 34) / dd;
      tg.rhx = (dx * k) / insp.cfg.scale; tg.rhy = (dy * k) / insp.cfg.scale; d.rg = 'fist'; d.rLayer = 'front';
      tg.lean += clamp(dx / 16, -9, 9); tg.turn = clamp(dx / 200, -0.5, 0.5);
      insp.attn = aim; tg.browTilt = 1.1; tg.lid = 0.25; d.mouth = 'flat';
    }
    if (now < IN.dazed) { tg.shake += 1; tg.lid = 0.45; tg.pupil = 0.5; d.mouth = 'worry'; tg.mouthOpen = 0.4; }
  };
  insp.drive = p => {
    if (IN.st !== 'walk') return;
    const T0 = 0.5, A0 = (70 * T0) / (4 * insp.cfg.scale), H = 12, ph2 = IN.ph;
    [['lfx', 'lfy', 'ltoe', 0], ['rfx', 'rfy', 'rtoe', 0.5]].forEach(([kx, ky, kt, o]) => {
      const u = (((ph2 + o) % 1) + 1) % 1;
      let x, y;
      if (u < 0.5) { x = A0 * (1 - 4 * u); y = 0; } else { const q = (u - 0.5) * 2; x = A0 * (-1 + 2 * q); y = H * Math.sin(Math.PI * q); }
      p[kx] = IN.dir * x; p[ky] = y; p[kt] = y > 1 ? (u < 0.8 ? -14 : 12) : 0;
      insp.v[kx] = 0; insp.v[ky] = 0;
    });
  };
  /* the cap is a real little projectile: it flies, drops onto the bench,
     bounces twice with a thump and a puff of dust, skids and settles brim-down */
  function capTick(dt) {
    const c = IN.capFly;
    if (!c || c.held || c.rest) return;
    c.vy += 1400 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.rot += c.vr * dt;
    if (c.x < 40 || c.x > 1240) { c.x = clamp(c.x, 40, 1240); c.vx *= -0.5; }
    if (c.y < CAP_FLOOR) return;
    c.y = CAP_FLOOR;
    const flat = Math.round(c.rot / 360) * 360;
    if (c.vy > 170) {
      const hard = clamp(c.vy / 900);
      c.vy *= -0.34; c.vx *= 0.6; c.vr = (flat - c.rot) * 3;
      particles.bonk(c.x, CAP_FLOOR + 4, 0.4 + 0.5 * hard);
      particles.smoke(c.x - 22, CAP_FLOOR + 6, 1, 0.4 * hard + 0.2, -30); particles.smoke(c.x + 22, CAP_FLOOR + 6, 1, 0.4 * hard + 0.2, 30);
      A.sfx.thud();
    } else {
      c.vy = 0; c.vx *= Math.exp(-dt * 7); c.vr = 0;
      c.rot += (flat - c.rot) * Math.min(1, dt * 14);
      if (Math.abs(c.vx) < 6 && Math.abs(flat - c.rot) < 1) { c.rot = flat; c.rest = true; }
    }
  }
  function inspTick(dt) {
    capTick(dt);
    if (IN.st === 'fly') {
      const F = IN.fly, u = clamp((now - F.t0) / F.dur);
      insp.cfg.x = F.x0 + (F.x1 - F.x0) * u;
      insp.cfg.y = F.y0 - F.h * 4 * u * (1 - u);
      if (u >= 1) {
        insp.cfg.y = 594; IN.st = 'stand';
        inspWrap.removeAttribute('transform');
        A.sfx.thud(); A.sfx.boing();
        particles.bonk(insp.cfg.x, 560, 1.4); particles.smoke(insp.cfg.x - 20, 590, 2, 0.6, -30); particles.smoke(insp.cfg.x + 20, 590, 2, 0.6, 30);
        ev.shake = now - 0.3;
        if (F.done) F.done();
      }
      return;
    }
    if (IN.st !== 'walk') return;
    IN.ph += dt / 0.5;
    const step2 = (IN.skip ? 1200 : 240) * dt * IN.dir;
    insp.cfg.x += step2;
    if ((IN.dir < 0 && insp.cfg.x <= IN.goal) || (IN.dir > 0 && insp.cfg.x >= IN.goal)) {
      insp.cfg.x = IN.goal; IN.st = 'stand';
      insp.p.lfx = insp.p.rfx = insp.p.lfy = insp.p.rfy = 0;
      if (IN.arrive) { const r = IN.arrive; IN.arrive = null; r(); }
    } else if (Math.floor(IN.ph * 2) !== Math.floor((IN.ph - dt / 0.5) * 2)) A.sfx.tiptoe();
  }
  const inspScreen = s => { insp.d.screen = s; insp.baseD.screen = s; };
  /* a short line for the bubble; the full write-up goes on the report */
  const spoken = f => `${C.describe(LEVEL, f).title.replace(/!$/, '')}! Right here at ${C.nameOf(LEVEL, f.at[0])}.`;
  /* he tells the switches where he wants them, and they obey */
  async function setSwitchFor(state, why) {
    /* 1.2: he gives the chain a tug himself */
    if (CHAIN && state.L1 != null && st.sw.L1 !== state.L1) {
      say(state.L1 ? 'Chain ON!' : 'Chain OFF!', 1.6, 'insp');
      await iwait(0.5);
      pullChain(true);
      await iwait(0.4);
    }
    const todo = SWS.filter(s => state[s.id] != null && st.sw[s.id] !== state[s.id]);
    if (!todo.length) return;
    const word = s => (swType(s.id) === 'sp' ? (state[s.id] ? 'ON' : 'OFF') : C.posName(LEVEL.components, s.id, state[s.id]));
    const who = s => (LEVEL.swHeads ? LEVEL.swHeads[SWS.indexOf(s)] + ' switch' : SWS.length > 1 ? (s.id === 'S1' ? 'Bottom switch' : 'Top switch') : 'Switch');
    say(todo.map(s => `${who(s)}, ${word(s)}`).join('. ') + (why ? ': ' + why : '!'), 2.2, 'insp');
    await iwait(0.6);
    for (const s of todo) {
      st.sw[s.id] = state[s.id]; s.toon.base.lever = leverOf(s.id, state[s.id]); A.sfx.click();
      const m = K.swFlinch(); s.toon.play(m.k, m.d, { slot: 'small' });
      await iwait(0.15);
    }
    evaluate();
    await iwait(0.3);
  }
  /* the wire (if any) that runs straight between two terminals gets his chalk line */
  function traceBetween(a, b) {
    for (const [w, v] of vis) if ((w.a === a && w.b === b) || (w.a === b && w.b === a)) v.trace = now + 1.6;
  }
  async function inspectorRun() {
    if (st.inspecting || st.blown || App.cardOpen || App.busy || st.faultLock || st.phBusy) return;
    const an = C.analyze(LEVEL, st.wires);
    /* (he only walks to what's on the board: a switch grounded through its
       box's mounting screws has no screw of its own to visit) */
    const route = C.route(LEVEL, st.wires).filter(id => TERMS[id]);
    /* the fault he walks into first, following the job out from the HOT; a
       dangerous one always outranks a merely wrong one */
    let fault = null;
    const pool = an.faults.some(f => f.danger) ? an.faults.filter(f => f.danger) : an.faults;
    for (const id of route) { fault = pool.find(f => f.at[0] === id); if (fault) break; }
    fault = fault || an.primary;
    /* what's in the wall: a conductor with no cable to run in, or one too many */
    if (!fault && LEVEL.cables) fault = C.cableFaults(LEVEL, namedWires())[0] || null;
    /* a colour that lies is written up like any other fault */
    if (!fault && LEVEL.colorCode) fault = C.colorFaults(LEVEL, namedWires())[0] || null;
    const report = fault ? Object.assign({ pass: false, rows: an.rows, fault }, C.describe(LEVEL, fault))
      : { pass: true, title: 'Wired right!', msg: LEVEL.winText, rows: an.rows };
    /* the write-ups that ride along on any report (1.1 and 1.2): working it live */
    if (LEVEL.safety) {
      const notes = [];
      if (st.work.shocks) notes.push(`Write-up: you got zapped reaching into a live circuit${st.work.shocks > 1 ? ` (${st.work.shocks} times)` : ''}. The breaker never tripped: it protects the wire, not you.`);
      else if (st.work.live) notes.push('Write-up: you were in there with the breaker ON.');
      if (notes.length) report.msg += ' ' + notes.join(' ');
      report.writeUp = notes.length > 0;
    }
    cancelLead(true); cancelJob(); setTester(false);
    st.inspecting = true; IN.skip = false; IN.aim = null;
    while (marks.firstChild) marks.firstChild.remove();
    insp.root.style.display = ''; insp.cfg.x = OFFX; insp.cfg.y = 594; insp.actions = [];
    insp.cap.style.display = ''; insp.hair.setAttribute('opacity', 0);
    inspScreen('- - -'); insp.ticks.setAttribute('d', '');
    A.sfx.slide(true);
    status('The Inspector is tracing the job, screw by screw. (Tap or click to hurry him along.)');
    /* 1. the source: breaker first */
    await walkTo(340);
    say('Inspection! Breaker first.', 2, 'insp');
    IN.aim = BRK_AT;
    await iwait(0.9);
    if (st.power || st.trip) {
      say(st.trip ? 'Tripped? Reset it OFF.' : 'It\'s ON?! Nobody works on it live.', 2.4, 'insp');
      await iwait(0.5);
      st.trip = false; st.power = false; brk.v -= 9; A.sfx.clunk(false); evaluate();
      await iwait(0.6);
    } else { inspScreen('OFF'); A.sfx.beep(); await iwait(0.6); }
    IN.aim = null;
    /* 2. out along the wiring, one connection at a time */
    let prev = null, switched = false;
    const target = fault ? fault.at[0] : null;
    for (const id of route) {
      if (!switched && isSw(ownerOf(id)) && fault && fault.danger && fault.state && Object.keys(fault.state).length) {
        switched = true;
        const one = SWS.length === 1 ? fault.state.S1 : null;
        await setSwitchFor(fault.state, one == null ? 'let\'s see this way.' : one ? 'let\'s check it closed.' : 'the safe way.');
      }
      await walkTo(standAt(id));
      if (prev) traceBetween(prev, id);
      prev = id;
      IN.aim = [TERMS[id].x, TERMS[id].y];
      inspScreen('OHMS'); A.sfx.beep();
      await iwait(0.55);
      if (id === target) break;
      inspScreen('OK');
      markOK(id); A.sfx.typeKey();
      const n = route.indexOf(id);
      insp.ticks.setAttribute('d', (insp.ticks.getAttribute('d') || '') + ` M${-12 + (n % 2) * 14},${-18 + Math.floor(n / 2) * 10} l3,3 l6,-7`);
      await iwait(0.35);
    }
    /* 3. the problem, and what happens next */
    if (fault) {
      markBad(target);
      inspScreen('? ? ?');
      say('Hmm... now what have we got here?', 2.4, 'insp');
      await iwait(0.9);
      if (fault.danger && A.settings.scares) {
        report.danger = true;
        await accident(fault);
        if (App.current !== SCREEN || !st.inspecting) return;
      } else if (fault.danger) {
        report.danger = true;
        inspScreen('DANGER');
        say(spoken(fault) + ' Energized, that would be dangerous.', 4, 'insp');
        await iwait(2.6);
      } else {
        inspScreen('NO');
        say(spoken(fault), 3.2, 'insp');
        await iwait(2.4);
      }
    } else {
      /* 4. nothing wrong anywhere: energize and try every switch position, live */
      IN.aim = null;
      say('Every connection checks out. Energizing!', 2.2, 'insp');
      await iwait(0.8);
      insp.play(K.point(-1).k, K.point(-1).d);
      await iwait(0.4);
      st.power = true; st.trip = false; brk.v += 9; A.sfx.clunk(true); particles.bonk(BRK_AT[0], BRK_AT[1] - 20, 0.6);
      const m = K.brace(); bulb.play(m.k, m.d);
      for (let i = 0; i < an.rows.length; i++) {
        const row = an.rows[i];
        await iwait(0.4);
        await setSwitchFor(row.state);
        evaluate();
        inspScreen(LAMPS.length > 1 ? LAMPS.map(l => (row.lit[l.id] > 0.9 ? 'ON' : row.lit[l.id] > 0.05 ? 'DIM' : 'OFF')).join(' ') : row.lit.L1 > 0.9 ? 'LIT' : row.lit.L1 > 0.05 ? 'DIM' : 'DARK');
        insp.play(K.tick().k, K.tick().d, { slot: 'small' });
        A.sfx.typeKey();
        await iwait(0.7);
      }
      st.power = false; brk.v -= 9; A.sfx.clunk(false);
      await setSwitchFor(Object.fromEntries(Object.keys(st.sw).map(id => [id, 0])));
      evaluate();
      say(report.writeUp ? 'Works. But I\'m writing you up.' : 'Mm-hm. Mm-HM. Report\'s ready.', 2, 'insp');
      await iwait(1.2);
      /* 3-ways have no line or load side: feeding the other end works just as well */
      if (LEVEL.goal === 'threeway' && wireReach('P.hot', 'S2.com')) report.msg += ' You fed the top switch and ran the light from the bottom one. That works just as well: a 3-way has no line or load side.';
    }
    IN.skip = false; IN.aim = null;
    if (App.current !== SCREEN || !st.inspecting) return;
    showResult(report);
    if (report.pass) {
      st.won = true; st.passT = now; save();
      setTimeout(() => { particles.confetti(W / 2, 300, 60); A.sfx.fanfare(); }, (0.3 + an.rows.length * 0.28 + 0.35) * 1000);
      const m = K.joy(); bulb.play(m.k, m.d);
      if (bulb2) setTimeout(() => { const m4 = K.joy(); bulb2.play(m4.k, m4.d); }, 410);
      SWS.forEach((s, i) => setTimeout(() => { const m2 = K.swCheer(); s.toon.play(m2.k, m2.d); }, i * 220));
      if (fuse) setTimeout(() => { const m3 = K.joy(); fuse.play(m3.k, m3.d); }, 330);
      if (sparky) setTimeout(() => sparkyApprove(), 520);
    } else {
      const m = K.confused(); if (!st.blown) bulb.play(m.k, m.d);
      SWS.forEach((s, i) => setTimeout(() => { const m2 = K.swShrug(); s.toon.play(m2.k, m2.d); }, i * 260));
    }
  }
  /* are two screws joined by wire alone (no switch contacts in between)? */
  function wireReach(a, b) {
    const seen = new Set([a]), q = [a];
    while (q.length) {
      const n = q.shift();
      if (n === b) return true;
      for (const w of st.wires) { const m = w.a === n ? w.b : w.b === n ? w.a : null; if (m && !seen.has(m)) { seen.add(m); q.push(m); } }
    }
    return false;
  }
  /* 6. The accident: while he's bent over the fault with the power safely OFF,
     the Phantom slithers out of the hole by the panel and flips the breaker ON.
     circuit.js decides what that does; this only makes it big. */
  async function accident(fault) {
    const F = fault.at[0];
    inspScreen('HMM');
    await phantomSabotage();
    if (App.current !== SCREEN) return;
    st.power = true;
    const hit = C.touch(LEVEL, st.wires, st.sw, F);
    if (hit.trips) arcBlast(fault);
    else { evaluate(); particles.spark(TERMS[F].x, TERMS[F].y, 16, 0.9); }
    if (hit.shock) await zapAndLaunch(F, hit.arc);
    if (App.current !== SCREEN) return;
    /* back on his feet, right by the panel */
    say('WHO turned that breaker ON?!', 2.4, 'insp');
    const k = K.stomp(); insp.play(k.k, k.d);
    await wait(1.3);
    IN.aim = BRK_AT;
    await wait(0.5);
    if (st.trip) say('Tripped, at least. Good breaker. Resetting it OFF.', 2.6, 'insp');
    st.trip = false; st.power = false;
    brk.v -= 12; A.sfx.clunk(false); evaluate();
    particles.bonk(BRK_AT[0], BRK_AT[1], 0.8);
    await wait(1);
    IN.aim = null;
    inspScreen('DANGER');
    say(spoken(fault), 3.6, 'insp');
    await wait(2.6);
  }
  function zapAndLaunch(F, arc) {
    return new Promise(res => {
      IN.st = 'zap'; IN.aim = null; IN.xray = now + 0.7;
      const [hx, hy] = insp.world(0, -200);
      particles.bolt(TERMS[F].x, TERMS[F].y, hx, hy); particles.bolt(TERMS[F].x, TERMS[F].y, hx + 20, hy - 30);
      particles.spark(TERMS[F].x, TERMS[F].y, 18, 1);
      insp.hair.setAttribute('opacity', 1);
      const z = K.zapped(); insp.play(z.k, z.d);
      A.sfx.zap(); A.sfx.neon(); setTimeout(() => A.sfx.ahh(), 150);
      inspScreen(arc ? 'ARC!!' : '!!!!');
      setTimeout(() => {
        /* launched: the cap goes one way, he goes the other, and he lands by the panel */
        const x0 = insp.cfg.x, x1 = x0 > 520 ? 372 : x0 + 420;
        insp.cap.style.display = 'none';
        /* the cap sails on past him and comes down in the clear stretch of bench,
           away from the tools at the left end */
        const [cx0, cy0] = insp.world(0, -270);
        const tx = x1 < x0 ? clamp(x0 + 230, 660, 1180) : clamp(x1 + 190, 660, 1180);
        const T0 = (560 + Math.sqrt(560 * 560 + 2800 * Math.max(0, CAP_FLOOR - cy0))) / 1400;
        IN.capFly = { t0: now, x: cx0, y: cy0, vx: (tx - cx0) / (T0 + 0.3), vy: -560, rot: 0, vr: x1 < x0 ? 620 : -620, rest: false, held: false };
        IN.fly = { t0: now, dur: 1.05, x0, y0: 594, x1, h: 250, spin: x1 < x0 ? -720 : 720, done: () => { IN.dazed = now + 2.2; const dz = K.dazed(); insp.play(dz.k, dz.d); setTimeout(res, 900); } };
        IN.st = 'fly';
        A.sfx.whoosh();
      }, 650);
    });
  }
  async function inspectorLeave() {
    if (IN.st === 'off') return;
    const run = IN.run = (IN.run || 0) + 1;
    const alive = () => IN.run === run && App.current === SCREEN;
    while (marks.firstChild) marks.firstChild.remove();
    st.inspecting = false;
    status(st.won ? 'Approved! Keep tinkering, or head back to the menu.' : 'Breaker OFF. Fix the wiring, then call the Inspector again.');
    /* no inspector leaves a job without his cap: over to where it landed, bend
       down, grab it, dust it off, put it on */
    if (IN.capFly) {
      while (IN.capFly && !IN.capFly.rest && alive()) await wait(0.1);
      const c = IN.capFly;
      if (!alive() || !c) return;
      await wait(0.3);
      await walkTo(clamp(c.x + 62, 60, 1250));
      if (!alive()) return;
      insp.play(K.stoop().k, K.stoop().d, { cues: [[0.5, () => { c.held = true; A.sfx.pop(); particles.bonk(c.x, c.y - 6, 0.5); }]] });
      await wait(1.15);
      if (!alive()) return;
      insp.play(K.dust().k, K.dust().d, { cues: [0.28, 0.58].map(u => [u, () => { A.sfx.tick(); const [px, py] = capPos(); particles.smoke(px + rand(-10, 10), py - 10, 1, 0.45, rand(-30, 30)); }]) });
      await wait(1.15);
      if (!alive()) return;
      insp.play(K.capOn().k, K.capOn().d, { cues: [[0.56, () => { IN.capFly = null; insp.cap.style.display = ''; A.sfx.squeak(); const [hx, hy] = insp.world(0, -250); particles.bonk(hx, hy, 0.5); }]] });
      await wait(1.05);
      if (!alive()) return;
      if (!IN.capFly) say('Hmph. Now, where was I going.', 1.8, 'insp');
    }
    insp.play(K.capTip().k, K.capTip().d);
    await wait(0.9);
    if (!alive()) return;
    walkTo(OFFX).then(() => { if (IN.run !== run) return; insp.root.style.display = 'none'; IN.st = 'off'; insp.cap.style.display = ''; insp.hair.setAttribute('opacity', 0); capFly.setAttribute('opacity', 0); capShadow.setAttribute('opacity', 0); IN.capFly = null; });
  }
  /* where the cap is drawn: in flight or lying on the bench, or in his hand */
  function capPos() {
    const c = IN.capFly;
    if (!c) return [0, 0];
    if (c.held) { const hp = insp.handPoints(); if (hp.length) return [hp[0][0], hp[0][1] + 12]; }
    return [c.x, c.y];
  }

  /* ---------- D. the Frayed Phantom, who lives in the hole in the wall ---------- */
  /* he can use either hole: the big one low on the right, or the little one right
     beside the panel. His cord always runs back into whichever he came out of. */
  const PH = { st: 'hid', hole: HOLE, x: HOLE.x, y: HOLE.y + 90, gx: HOLE.x, gy: HOLE.y + 90, t0: 0, target: null, reach: 0, spd: 3, alpha: 1, alphaGoal: 1 };
  /* where he waits, behind the plaster, below each hole's opening */
  const inside = h => [h.x, h.y + (h === HOLE ? 90 : 112)];
  const phW = (wx, wy) => [(wx - PH.hole.x) / ph.cfg.scale, (wy - PH.hole.y) / ph.cfg.scale + ph.cfg.hipH];
  const phArm = (tg, side, px, py) => {
    const [sx, sy] = ph.world(side < 0 ? -16 : 16, -92), s = ph.cfg.scale;
    tg[side < 0 ? 'lhx' : 'rhx'] = (px - sx) / s; tg[side < 0 ? 'lhy' : 'rhy'] = (py - sy) / s;
  };
  const phGo = (x, y, spd = 3) => { PH.gx = x; PH.gy = y; PH.spd = spd; };
  ph.brain = (t, dt, tg, d) => {
    const k = 1 - Math.exp(-dt * PH.spd);
    PH.x += (PH.gx - PH.x) * k; PH.y += (PH.gy - PH.y) * k;
    const [hx, hy] = phW(PH.x, PH.y);
    tg.hipX += hx; tg.hipY += hy;
    tg.hipY += 6 * Math.sin(t * 0.8); tg.hipX += 3 * Math.sin(t * 0.53 + 1); tg.lean += 6 * Math.sin(t * 0.41);
    tg.lhx = -30; tg.lhy = 92; tg.rhx = 30; tg.rhy = 92; d.lg = 'back'; d.rg = 'back'; d.lLayer = d.rLayer = 'back';
    tg.turn = -0.3; tg.lookX = -0.8; tg.pupil = 0.3; tg.hood = 0.4;
    if (PH.st === 'peek') { d.mouth = 'wiregrin'; tg.mouthOpen = 0.45 + 0.2 * Math.sin(t * 9); tg.lean -= 10; tg.lid = 0.3; }
    else if (PH.st === 'creep' || PH.st === 'grab') {
      const p = PH.target;
      d.mouth = PH.st === 'grab' ? 'wiregrin' : 'seam'; tg.mouthOpen = PH.st === 'grab' ? 0.8 : 0.05; tg.lean -= 14; tg.turn = -0.45;
      if (p) {
        ph.attn = [p.x, p.y];
        const [sx, sy] = ph.world(-16, -92);
        const u = PH.reach;
        phArm(tg, -1, sx + (p.x - sx) * u, sy + (p.y - sy) * u);
        d.lg = PH.st === 'grab' ? 'fist' : 'claw'; d.lLayer = 'front!';
      }
    } else if (PH.st === 'hiss') {
      d.mouth = 'wiregrin'; tg.mouthOpen = 1; tg.lhx = -36; tg.lhy = 20; tg.rhx = 36; tg.rhy = 20; d.lg = d.rg = 'claw'; d.lLayer = d.rLayer = 'front'; tg.shake += 1.5; tg.hood = 1;
    } else if (PH.st === 'zap') {
      d.mouth = 'O'; tg.mouthOpen = 1; tg.shake += 4; tg.lhx = -40; tg.lhy = -20; tg.rhx = 40; tg.rhy = -20; d.lg = d.rg = 'palm'; d.lLayer = d.rLayer = 'front'; tg.pupil = 0.6;
    } else if (PH.st === 'flee') { d.mouth = 'O'; tg.mouthOpen = 0.6; }
    else if (PH.st === 'swap') {
      /* both bony hands at work on the screws, grinning */
      d.mouth = 'wiregrin'; tg.mouthOpen = 0.3 + 0.1 * Math.sin(t * 7); tg.lean -= 8; tg.turn = -0.4; tg.hood = 0.9; tg.lid = 0.3;
      for (const [side, tgt, u, g] of [[-1, PH.lt, PH.lr, PH.lg], [1, PH.rt, PH.rr, PH.rg]]) {
        if (!tgt || u <= 0) continue;
        const [sx, sy] = ph.world(side < 0 ? -16 : 16, -92);
        phArm(tg, side, sx + (tgt[0] - sx) * u, sy + (tgt[1] - sy) * u);
        d[side < 0 ? 'lg' : 'rg'] = g || 'claw'; d[side < 0 ? 'lLayer' : 'rLayer'] = 'front!';
      }
      ph.attn = PH.lr > 0 ? PH.lt : PH.rt;
    } else if (PH.st === 'baffled') {
      /* ...nothing? He scratches his skull with one copper finger */
      d.mouth = 'O'; tg.mouthOpen = 0.35; tg.pupil = 0.55; tg.browRaise = 0; tg.hood = 0.2; tg.turn = 0.1; tg.lean += 4;
      const [hx, hy] = ph.world(14, -104);
      phArm(tg, 1, hx + 6 * Math.sin(t * 16), hy - 4 + 4 * Math.cos(t * 16)); d.rg = 'point'; d.rLayer = 'front!';
      ph.attn = bulb.facePos();
    } else if (PH.st === 'sulk') { d.mouth = 'frown'; tg.mouthOpen = 0.1; tg.lid = 0.55; tg.hood = 0; tg.lean += 10; tg.lookY = 0.8; }
    else if (PH.st === 'sneak' || PH.st === 'flick') {
      /* one long bony finger for the breaker handle, and that grin */
      d.mouth = PH.st === 'flick' ? 'wiregrin' : 'seam'; tg.mouthOpen = PH.st === 'flick' ? 0.7 : 0.05;
      tg.lean -= 12; tg.turn = -0.45; tg.lid = 0.35; tg.hood = 0.9;
      const p = PH.target;
      if (p) {
        ph.attn = p;
        const [sx, sy] = ph.world(-16, -92);
        phArm(tg, -1, sx + (p[0] - sx) * PH.reach, sy + (p[1] - sy) * PH.reach);
        d.lg = 'point'; d.lLayer = 'front!';
      }
    }
  };
  function phShow(hole = HOLE) {
    if (ph.root.style.display === 'none' || PH.hole !== hole) {
      PH.hole = hole; ph.cfg.x = hole.x; ph.cfg.y = hole.y;
      ph.root.style.display = '';
      [PH.x, PH.y] = inside(hole); PH.gx = PH.x; PH.gy = PH.y;
      /* both holes mask him the same way: the wall hides him until he comes up
         through the opening */
      PH.alpha = 1; PH.alphaGoal = 1;
      L.phantom.setAttribute('clip-path', hole === HOLE ? CLIP1 : 'url(#phClip2)');
    }
  }
  function phHide() {
    PH.st = 'hid';
    const [x, y] = inside(PH.hole);
    phGo(x, y, 4);
    if (PH.hole === HOLE2) setTimeout(() => { if (PH.st === 'hid') particles.crumbs(HOLE2.x + 4, HOLE2.y + 30, 3); }, 250);
    setTimeout(() => { if (PH.st === 'hid') { ph.root.style.display = 'none'; PH.hole = HOLE; ph.cfg.x = HOLE.x; ph.cfg.y = HOLE.y; L.phantom.setAttribute('clip-path', CLIP1); } }, 1100);
  }
  /* out of the little hole by the panel: the cord slithers up out of the
     plaster (knocking crumbs off the lip), one bony finger, and the breaker
     goes ON; then he pours himself back down the hole */
  async function phantomSabotage() {
    phShow(HOLE2);
    PH.st = 'lurk'; PH.target = null; PH.reach = 0;
    A.sfx.freeze();
    /* first the mane and the skull come up into the opening... */
    phGo(HOLE2.x + 2, HOLE2.y + 34, 2.6);
    await wait(0.25);
    particles.crumbs(HOLE2.x, HOLE2.y + 30, 4); particles.smoke(HOLE2.x, HOLE2.y + 26, 1, 0.45, -10);
    await wait(0.45);
    PH.st = 'peek';
    await wait(0.35);
    /* ...then he squeezes out past the rim, shoulders scraping plaster */
    PH.st = 'lurk';
    phGo(HOLE2.x - 8, HOLE2.y - 16, 2.8);
    await wait(0.2);
    particles.crumbs(HOLE2.x - 16, HOLE2.y + 28, 4); particles.crumbs(HOLE2.x + 18, HOLE2.y + 26, 3);
    particles.bonk(HOLE2.x - 20, HOLE2.y + 20, 0.45); A.sfx.ratchet();
    await wait(0.45);
    PH.st = 'sneak'; phGo(302, 238, 2.2);
    PH.target = [BRK_AT[0] + 2, BRK_AT[1] + 22];
    await wait(0.9);
    for (let u = 0; u <= 1; u += 0.1) { PH.reach = u; await wait(0.05); }
    await wait(0.25);
    /* flick: the handle goes up */
    PH.st = 'flick';
    PH.target = [BRK_AT[0] + 2, BRK_AT[1] - 16];
    A.sfx.clunk(true); brk.v += 11;
    particles.bonk(BRK_AT[0], BRK_AT[1] - 10, 0.7);
    await wait(0.12);
    /* he's gone before anyone looks round */
    setTimeout(() => { A.sfx.laugh(false); PH.reach = 0; PH.st = 'flee'; phHide(); }, 350);
  }
  async function phantomAfterShort() {
    phShow();
    PH.st = 'lurk'; phGo(HOLE.x - 6, HOLE.y - 40, 2.2);
    await wait(2.1);
    PH.st = 'peek'; phGo(HOLE.x - 30, HOLE.y - 118, 3);
    A.sfx.laugh(false); A.sfx.fizzle();
    await wait(1.5);
    phHide();
  }
  async function phantomSwipe() {
    const cands = [];
    for (const [w, v] of vis) v.rope.pts.forEach((q, i) => { if (i > 1 && i < v.rope.pts.length - 2 && q.x > 780 + DX && q.y > 300) cands.push([w, q]); });
    if (!cands.length) return;
    const [w, q] = cands.reduce((a, b) => (b[1].x > a[1].x ? b : a));
    PH.target = q; PH.wire = w; PH.reach = 0;
    phShow();
    PH.st = 'lurk'; phGo(HOLE.x - 16, HOLE.y - 110, 2);
    A.sfx.freeze();
    await wait(1.4);
    if (PH.st !== 'lurk') return;
    PH.st = 'creep'; phGo(Math.max(1090 + DX, q.x + 150), clamp(q.y - 150, 250, 380), 1.2);
    once('phantom', () => setTimeout(() => say('Eek! Shoo him! Click him before he grabs a wire!', 4), 400));
    const t0 = now;
    while (PH.st === 'creep' && now - t0 < 5 && App.current === SCREEN) {
      PH.reach = clamp((now - t0) / 4.4);
      await wait(0.05);
    }
    if (PH.st !== 'creep') return;
    if (App.current !== SCREEN || lead || job || st.inspecting) { PH.st = 'flee'; phHide(); return; }
    PH.st = 'grab';
    if (!st.wires.includes(w)) { phHide(); return; }
    const v = vis.get(w);
    if (st.power && v && (v.hot || v.current)) {
      /* grabbed a live one: bitten */
      PH.st = 'zap';
      particles.bolt(q.x, q.y, PH.x, PH.y - 60); particles.spark(q.x, q.y, 14, 0.8); particles.smoke(PH.x, PH.y - 60, 3, 0.8);
      A.sfx.zap(); ev.flash = now - 0.3;
      await wait(0.8);
      PH.st = 'flee'; say('Ha! Live wires bite. Even him.', 4);
      await wait(0.4);
      phHide();
      return;
    }
    /* he yanks it off both screws and drags it down his hole */
    A.sfx.laugh(false);
    const i = st.wires.indexOf(w);
    st.wires.splice(i, 1);
    const k = v.rope.pts.indexOf(q);
    loose.push({ rope: v.rope, o: wireEls(L.wires, w.color), pin: { end: 'mid', k, at: { get x() { return PH.handX; }, get y() { return PH.handY; } } }, t0: now, drop: now + 2.2 });
    for (const id of [w.a, w.b]) { TERMS[id].spin = now; TERMS[id].spinDir = -1; }
    A.sfx.ratchet();
    syncWires(); evaluate(); save();
    status('The Phantom swiped a wire! Run it again.');
    await wait(0.5);
    PH.st = 'flee';
    phHide();
    setTimeout(() => say('He took one of my wires! The nerve!', 4), 300);
  }
  /* ---------- Level 2: the traveler swap ---------- */
  /* While you're idle with the breaker OFF, the Phantom sneaks up to the head
     switch and swaps its two travelers, expecting a disaster. circuit.js has to
     prove first that it's harmless (the job works before and after, no new
     fault), so he can never break a good board or leave you a wrong one. Then
     he waits at his hole for you to switch on... and it still works. */
  const qMark = el('text', { 'text-anchor': 'middle', 'font-family': 'Rye, Georgia, serif', 'font-size': 46, fill: '#ffe45a', stroke: INK, 'stroke-width': 3, 'paint-order': 'stroke', opacity: 0 }, L.fx);
  qMark.textContent = '?';
  function swapPlan() {
    if (!LEVEL.swap) return null;
    const bare = st.wires.map(w => ({ a: w.a, b: w.b }));
    const r = C.swapTravelers(LEVEL, bare, 'S2');
    if (!r || r.from.some(t => countAt(t) !== 1) || !C.swapHarmless(LEVEL, bare, r.wires)) return null;
    /* the colours stay just as right (or wrong) as they were */
    const col = ws => C.colorCheck(LEVEL, ws.map((w, i) => ({ a: w.a, b: w.b, color: COLOR_NAME[st.wires[i].color] || 'black' }))).ok;
    return col(bare) === col(r.wires) ? r : null;
  }
  const phHand = side => { const hp = ph.handPoints(); const p = hp[side < 0 ? 0 : 2] || hp[0]; return p ? [p[0], p[1]] : [PH.x, PH.y]; };
  const glide = async (key, from, to, secs, ok) => { const t0 = now; while (ok()) { const u = clamp((now - t0) / secs); PH[key] = [from[0] + (to[0] - from[0]) * u, from[1] + (to[1] - from[1]) * u - Math.sin(u * Math.PI) * 40]; if (u >= 1) return; await wait(0.03); } };
  const ramp = async (key, a, b, secs, ok) => { const t0 = now; while (ok()) { const u = clamp((now - t0) / secs); PH[key] = a + (b - a) * u; if (u >= 1) return; await wait(0.03); } };
  async function phantomTravelerSwap() {
    const plan = swapPlan();
    if (!plan) return;
    st.swapDone = true; st.phBusy = true;
    const run = PH.run = (PH.run || 0) + 1;
    const ok = () => App.current === SCREEN && PH.run === run;
    const [wA, wB] = plan.pair.map(i => st.wires[i]);
    const [idA, idB] = plan.from, tA = TERMS[idA], tB = TERMS[idB];
    const vA = vis.get(wA), vB = vis.get(wB);
    const endA = wA.a === idA ? 'a' : 'b', endB = wB.a === idB ? 'a' : 'b';
    const bail = () => { if (vA) delete vA.carry; if (vB) delete vB.carry; st.phBusy = false; PH.lt = PH.rt = null; PH.lr = PH.rr = 0; if (PH.run === run && PH.st !== 'hid') { PH.st = 'flee'; phHide(); } };
    PH.lt = PH.rt = null; PH.lr = PH.rr = 0; PH.lg = PH.rg = 'claw';
    phShow();
    PH.st = 'lurk'; phGo(HOLE.x - 10, HOLE.y - 100, 1.6);
    A.sfx.freeze();
    await wait(1.1); if (!ok()) return bail();
    /* up to the head switch, with a finger to his grin */
    PH.st = 'swap'; phGo(HOLE.x - 40, 318, 1.5);
    await wait(0.9); if (!ok()) return bail();
    /* left hand: back out the right-hand screw and lift its traveler off */
    PH.lt = [tB.x, tB.y]; await ramp('lr', 0, 1, 0.55, ok); if (!ok()) return bail();
    tB.spin = now; tB.spinDir = -1; A.sfx.ratchet(); particles.bonk(tB.x, tB.y, 0.5);
    PH.lg = 'fist'; vB.carry = { end: endB, at: () => phHand(-1) };
    await glide('lt', [tB.x, tB.y], [tB.x + 10, tB.y - 70], 0.4, ok); if (!ok()) return bail();
    /* right hand: the other traveler, carried across to the empty screw */
    PH.rt = [tA.x, tA.y]; await ramp('rr', 0, 1, 0.6, ok); if (!ok()) return bail();
    tA.spin = now; tA.spinDir = -1; A.sfx.ratchet(); particles.bonk(tA.x, tA.y, 0.5);
    PH.rg = 'fist'; vA.carry = { end: endA, at: () => phHand(1) };
    A.sfx.laugh(false);
    await glide('rt', [tA.x, tA.y], [tB.x, tB.y], 0.7, ok); if (!ok()) return bail();
    vA.carry = { end: endA, screw: idB, at: () => [tB.x, tB.y] };
    PH.rg = 'claw'; ramp('rr', 1, 0, 0.4, ok);
    /* ...and the first one down on the screw he just emptied */
    await glide('lt', [tB.x + 10, tB.y - 70], [tA.x, tA.y], 0.7, ok); if (!ok()) return bail();
    /* commit both at once: the board is never left half-swapped */
    wA[endA] = idB; wB[endB] = idA;
    delete vA.carry; delete vB.carry;
    syncWires(); evaluate();
    for (const t of [tA, tB]) { t.spin = now; t.spinDir = 1; particles.spark(t.x, t.y, 3, 0.25); }
    A.sfx.ratchet();
    PH.lg = 'claw'; await ramp('lr', 1, 0, 0.35, ok); if (!ok()) return bail();
    PH.lt = PH.rt = null;
    st.phBusy = false;
    /* he slinks to his hole and waits for the fireworks */
    A.sfx.laugh(false);
    PH.st = 'peek'; phGo(HOLE.x - 24, HOLE.y - 92, 2.2); ph.attn = bulb.facePos();
    PH.waitSwap = { t0: now, flips: 0 };
    const m = K.swFlinch(); SWS[1].toon.play(m.k, m.d, { slot: 'small' });
  }
  async function phantomBaffled() {
    PH.waitSwap = null;
    const run = PH.run = (PH.run || 0) + 1;
    PH.st = 'baffled'; phGo(HOLE.x - 20, HOLE.y - 112, 3);
    /* the double take */
    ph.play([[0.08, { turn: -0.7, lookX: -1 }], [0.3, { turn: 0.3, lookX: 0.5 }], [0.42, { turn: -0.8, lookX: -1, pop: 1.3, sy: 1.12, browRaise: 1.4, pupil: 0.3 }], [0.8, { sy: 1, pop: 0 }]], 1.1);
    A.sfx.hic(); PH.q = now;
    await wait(2.4);
    if (PH.run !== run || App.current !== SCREEN) return;
    PH.st = 'sulk'; phGo(HOLE.x - 8, HOLE.y - 40, 1.2); A.sfx.slide(false);
    await wait(0.9);
    if (PH.run !== run) return;
    phHide();
  }
  ph.root.addEventListener('click', e => {
    e.stopPropagation();
    if (PH.st !== 'creep' && PH.st !== 'lurk' && PH.st !== 'peek') return;
    PH.st = 'hiss'; A.sfx.fizzle(); A.sfx.buzzer();
    particles.bonk(PH.x, PH.y - 60, 1);
    setTimeout(() => { PH.st = 'flee'; phHide(); status('Shoo! He\'s back in his hole.'); }, 700);
  });

  /* ---------- the report, with the stamp and the Journeyman's card ---------- */
  const resultCard = document.getElementById('resultCard');
  const stamp = document.getElementById('resultStamp');
  const punch = document.getElementById('punchCard');
  function grade() {
    const named = st.wires.map(w => ({ a: w.a, b: w.b, color: COLOR_NAME[w.color] || 'black' }));
    return { noShort: st.shorts === 0, colors: C.colorCheck(LEVEL, named).ok, fewest: st.wires.length <= LEVEL.par, noHints: st.hint === 0 };
  }
  function showResult(r) {
    document.getElementById('resultTitle').textContent = r.title;
    document.getElementById('resultMsg').textContent = r.msg;
    const table = document.getElementById('resultTable');
    table.innerHTML = '';
    const nRows = r.rows ? r.rows.length : 0;
    if (r.rows) {
      table.hidden = false;
      const head = table.createTHead().insertRow();
      /* one column per switch, one per light */
      const swHeads = LEVEL.swHeads || (SWS.length > 1 ? ['Bottom', 'Top'] : SWS.length ? ['Switch'] : CHAIN ? ['Chain'] : []);
      const lampHeads = LAMPS.length > 1 ? LAMPS.map((l, i) => `Light ${i + 1}`) : [SWS.length > 1 ? 'Light' : 'Bulb'];
      swHeads.concat(lampHeads).forEach(h => { const th = document.createElement('th'); th.textContent = h; head.appendChild(th); });
      const body = table.createTBody();
      r.rows.forEach((row, i) => {
        const tr = body.insertRow();
        tr.style.setProperty('--i', i);
        for (const id of Object.keys(st.sw)) tr.insertCell().textContent = C.posName(LEVEL.components, id, row.state[id]);
        for (const l of LAMPS) {
          const b = row.res.short ? 'SHORT!' : row.lit[l.id] > 0.9 ? 'LIT' : row.lit[l.id] > 0.05 ? 'dim' : 'dark';
          const c = tr.insertCell(); c.textContent = b; c.className = b === 'LIT' ? 'lit' : b === 'SHORT!' ? 'bad' : '';
        }
        setTimeout(() => A.sfx.typeKey(), (0.25 + i * 0.28) * 1000);
      });
    } else table.hidden = true;
    const sd = 0.3 + nRows * 0.28;
    stamp.textContent = r.pass ? 'Approved' : r.tripped ? 'Tripped' : r.danger ? 'Danger!' : 'Rejected';
    stamp.className = 'stamp ' + (r.pass ? 'pass' : 'fail');
    stamp.style.setProperty('--d', sd + 's');
    void stamp.offsetWidth;
    stamp.classList.add('go');
    setTimeout(() => {
      A.sfx.stamp();
      /* the whole sheet takes the thump */
      const sheet = stamp.closest('.card');
      if (sheet) { sheet.classList.remove('thump'); void sheet.offsetWidth; sheet.classList.add('thump'); }
    }, (sd + 0.12) * 1000);
    /* E. the Journeyman's card, punched for every bit of craft */
    punch.hidden = !r.pass;
    const total = LEVEL.bonus ? 5 : 4;
    punch.querySelectorAll('li').forEach(li => { li.hidden = li.dataset.k === 'bonus' ? !LEVEL.bonus : false; });
    st.bonusGot = false;
    if (r.pass) {
      const g = grade();
      let n = 0;
      punch.querySelectorAll('li').forEach(li => {
        const got = !!g[li.dataset.k];
        li.classList.toggle('got', got);
        if (got) { li.style.setProperty('--pd', (sd + 0.5 + n * 0.25) + 's'); setTimeout(() => A.sfx.tick(), (sd + 0.5 + n * 0.25) * 1000); n++; }
      });
      let best = 0;
      /* (an older 5-hole best on 1.1/1.2 is capped to today's four holes) */
      try { best = Math.min(total, Math.max(n, +(localStorage.getItem(LEVEL.store + '.card') || 0))); localStorage.setItem(LEVEL.store + '.card', best); } catch (e) { best = n; }
      st.punchN = n;
      document.getElementById('punchScore').textContent = `${n}/${total}` + (best > n ? ` (best ${best}/${total})` : '');
    }
    /* Level 2: the Inspector's one quick bonus question (answers shuffled) */
    const bq = document.getElementById('bonusQ');
    bq.hidden = !(r.pass && LEVEL.bonus);
    if (!bq.hidden) {
      document.getElementById('bonusWhy').textContent = '';
      const btns = [...bq.querySelectorAll('.bonus-btn')];
      btns.forEach(b => { b.disabled = false; b.classList.remove('right'); });
      btns.sort(() => Math.random() - 0.5).forEach(b => b.parentNode.appendChild(b));
    }
    resultCard.classList.toggle('pass', !!r.pass);
    document.getElementById('resultRetry').textContent = st.blown ? 'New bulb, please' : r.pass ? 'Keep tinkering' : 'Back to the board';
    document.getElementById('resultMenu').hidden = !r.pass;
    /* passing Level 1 opens the stairway job */
    const nextBtn = document.getElementById('resultNext');
    nextBtn.hidden = !(r.pass && LEVEL.next);
    if (LEVEL.next) nextBtn.textContent = 'Next job: ' + LEVEL.nextName;
    App.showCard('resultCard', () => { st.faultLock = false; if (st.blown) newBulb(); if (st.inspecting) inspectorLeave(); });
    /* keyboard focus starts on the way out, never on an answer */
    try { document.getElementById('resultRetry').focus({ preventScroll: true }); } catch (e) { /* no focus */ }
  }
  if (LEVEL.bonus) {
    document.querySelectorAll('#bonusQ .bonus-btn').forEach(b => b.addEventListener('click', () => {
      if (App.current !== SCREEN || b.disabled) return;
      const right = b.dataset.ok === '1';
      document.querySelectorAll('#bonusQ .bonus-btn').forEach(x => { x.disabled = true; if (x.dataset.ok === '1') x.classList.add('right'); });
      document.getElementById('bonusWhy').textContent = right
        ? 'Right. Each flip just moves the hot to the other traveler.'
        : 'Nope: travelers carry the switched hot, and either one can carry it.';
      if (!right) { A.sfx.tick(); return; }
      /* the bonus punch */
      st.bonusGot = true; A.sfx.stamp();
      const li = punch.querySelector('li[data-k="bonus"]');
      li.style.setProperty('--pd', '0s'); li.classList.add('got');
      const n = (st.punchN || 0) + 1;
      let best = n;
      try { best = Math.max(n, +(localStorage.getItem(LEVEL.store + '.card') || 0)); localStorage.setItem(LEVEL.store + '.card', best); } catch (e) { best = n; }
      document.getElementById('punchScore').textContent = `${n}/5` + (best > n ? ` (best ${best}/5)` : '');
    }));
  }
  document.getElementById('resultMenu').addEventListener('click', () => { if (App.current !== SCREEN) return; App.closeCard(); App.go('menu', { from: [640, 360] }); });
  if (LEVEL.next) document.getElementById('resultNext').addEventListener('click', () => { if (App.current !== SCREEN) return; App.closeCard(); App.go(LEVEL.next, { from: [640, 360], picked: true }); });

  /* ---------- input ---------- */
  const busy = () => !App.running || App.cardOpen || App.busy || st.inspecting || st.phBusy;
  L.terms.addEventListener('pointerdown', e => {
    const g = e.target.closest('.term');
    if (!g || busy()) return;
    e.preventDefault();
    const id = g.dataset.term;
    cursor = toW(e);
    if (st.tester) { probe(probeFrom(g, e)); return; }
    if (!id) { recepTap(); return; }
    if (job) return;
    if (st.power) { blockLive(id); return; }
    if (st.blown) { say('Hang on, he\'s being replaced!', 3, 'sw'); return; }
    workStarted();
    if (lead && lead.mode === 'pending' && lead.retract < 0) {
      if (lead.from !== id) finishLead(id); else cancelLead();
      return;
    }
    startLead(id, 'drag');
    try { svg.setPointerCapture(e.pointerId); } catch (err) { /* capture unsupported */ }
  });
  function finishLead(target) {
    /* no second-guessing: whatever lands, lands. The power, the Inspector and
       the Hint button have the say on whether it was right */
    const l = lead;
    lead = null;
    landWire(l.from, target, l.rope, l.o);
  }
  svg.addEventListener('pointermove', e => {
    if (App.current !== SCREEN) return;
    cursor = toW(e);
    lastInput = now;
    /* dragging the wrap grip round the screw */
    const w = job && job.wrap;
    if (w && w.drag) {
      const ang = Math.atan2(cursor[1] - w.t.y, cursor[0] - w.t.x);
      const d = angDiff(ang - w.last);
      w.last = ang;
      wrapBy(d);
      return;
    }
    const sj = job && job.strip;
    if (sj && sj.drag) { stripTo(sj.p0 + (-(cursor[0] - sj.px) * sj.dx - (cursor[1] - sj.py) * sj.dy)); return; }
    if (st.tester) {
      const at = nearPt(cursor[0], cursor[1], HIT);
      if (at !== tester.hover) { tester.hover = at; if (at) A.sfx.hover(); }
      tester.moved = now;
      return;
    }
    if (!lead || lead.retract >= 0) return;
    const a = TERMS[lead.from];
    if (Math.hypot(cursor[0] - a.x, cursor[1] - a.y) > 12) lead.moved = true;
    const tg = termAt(cursor[0], cursor[1], SNAP, lead.from);
    if (tg !== lead.target) { lead.target = tg; if (tg) { A.sfx.tick(); TERMS[tg].pulse = now; } }
  });
  svg.addEventListener('pointercancel', () => {
    if (job && job.wrap) job.wrap.drag = false;
    if (job && job.strip) job.strip.drag = false;
    if (lead && lead.mode === 'drag') cancelLead();
  });
  svg.addEventListener('pointerup', e => {
    if (job && job.wrap && job.wrap.drag) { job.wrap.drag = false; return; }
    if (job && job.strip && job.strip.drag) { job.strip.drag = false; return; }
    if (!lead || lead.mode !== 'drag') return;
    cursor = toW(e);
    if (!lead.moved) { lead.mode = 'pending'; status((TOUCH ? 'Now tap' : 'Now click') + ' a second screw to connect them, or tap empty board to cancel.'); return; }
    const target = termAt(cursor[0], cursor[1], SNAP, lead.from);
    if (target) finishLead(target); else cancelLead();
  });
  svg.addEventListener('click', e => {
    if (App.current !== SCREEN) return;
    lastInput = now;
    if (st.inspecting && IN.st !== 'off') { IN.skip = true; return; }
    if (lead && lead.mode === 'pending' && !e.target.closest('.term')) { cancelLead(); status(st.power ? 'Breaker ON.' : 'Breaker OFF. Safe to wire.'); }
  });
  L.terms.addEventListener('keydown', e => {
    const g = e.target.closest('.term');
    if (!g || (e.key !== 'Enter' && e.key !== ' ') || busy()) return;
    e.preventDefault();
    const id = g.dataset.term;
    if (st.tester) { probe(probeFrom(g, null)); return; }
    if (!id) { recepTap(); return; }
    if (job) return;
    if (st.power) { blockLive(id); return; }
    if (st.blown) return;
    if (lead && lead.mode === 'pending' && lead.from !== id) finishLead(id);
    else if (lead && lead.from === id) cancelLead();
    else { workStarted(); startLead(id, 'pending'); const tm = TERMS[id]; cursor = [tm.x + 40, tm.y + 60]; }
  });
  /* a tripped breaker has to be pushed fully OFF to reset before it'll go ON */
  function resetBreaker() {
    st.trip = false; st.power = false;
    A.sfx.clunk(false); brk.v -= 9;
    evaluate();
    status('Breaker reset to OFF. Fix the wiring before you switch it back ON.');
  }
  const toggleBreaker = () => { if (busy() || st.faultLock) return; if (st.trip) resetBreaker(); else setPower(!st.power); };
  breaker.addEventListener('click', e => { e.stopPropagation(); toggleBreaker(); });
  breaker.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleBreaker(); } });
  for (const s of SWS) s.toon.root.addEventListener('click', e => { e.stopPropagation(); if (!busy()) flipSwitch(s.id); });
  bulb.root.addEventListener('click', e => { e.stopPropagation(); if (!busy() && !st.blown) { const m = K.startle(0.5); bulb.play(m.k, m.d); A.sfx.squeak(); } });
  const BULB2_LINES = ['Mmf. Five more minutes.', 'Easy. I\'m a hundred watts of patience.', 'Poke the OTHER one. He likes it.'];
  if (bulb2) bulb2.root.addEventListener('click', e => { e.stopPropagation(); if (busy() || st.blown) return; const m = K.startle(0.4); bulb2.play(m.k, m.d); A.sfx.squeak(); say(BULB2_LINES[(st.b2N = (st.b2N || 0) + 1) % BULB2_LINES.length], 2.8, 'L2'); });
  insp.root.addEventListener('click', e => { e.stopPropagation(); if (IN.st !== 'off') IN.skip = true; });
  const FUSE_LINES = ['Hey! Glass here! Careful!', 'Twenty years in a fuse box, kid. I\'ve seen things.', 'A breaker trips and resets. Me? I blow ONCE. Respect the classics.', 'Don\'t mind me. Just a spare.'];
  const OUTLET_LINES = ['Circuit 2! Never off. Somebody\'s gotta be.', 'Hey! Watch where you poke, pal.', 'Me? I\'m on another breaker entirely. Sleep well.'];
  if (outlet) outlet.root.addEventListener('click', e => {
    e.stopPropagation();
    if (busy()) return;
    /* tester in hand: a tap on him goes to whichever slot or screw is nearest */
    if (st.tester) { const [x, y] = toW(e); probe(REC.reduce((m, p) => (Math.hypot(p.x - x, p.y - y) < Math.hypot(m.x - x, m.y - y) ? p : m))); return; }
    const m = K.startle(0.5); outlet.play(m.k, m.d); A.sfx.squeak();
    say(OUTLET_LINES[(st.outN = (st.outN || 0) + 1) % OUTLET_LINES.length], 3.2, 'outlet');
  });
  if (fuse) fuse.root.addEventListener('click', e => { e.stopPropagation(); if (busy()) return; const m = K.startle(0.6); fuse.play(m.k, m.d); A.sfx.squeak(); say(FUSE_LINES[(st.fuseN = (st.fuseN || 0) + 1) % FUSE_LINES.length], 3.4, 'fuse'); });
  if (chainG) {
    chainG.addEventListener('click', e => { e.stopPropagation(); if (!busy()) pullChain(); });
    chainG.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && !busy()) { e.preventDefault(); pullChain(); } });
  }
  for (const toon of [...SWS.map(s => s.toon), bulb].concat(bulb2 ? [bulb2] : [], sparky ? [sparky] : [], fuse ? [fuse] : [], outlet ? [outlet] : [])) {
    toon.root.addEventListener('pointerenter', () => { toon.hovered = true; });
    toon.root.addEventListener('pointerleave', () => { toon.hovered = false; });
  }

  /* ---------- HUD ---------- */
  const hud = document.getElementById('hud');
  const statusEl = document.getElementById('status');
  function status(text) {
    if (statusEl.textContent === text) return;
    statusEl.textContent = text;
    statusEl.classList.remove('typed'); void statusEl.offsetWidth; statusEl.classList.add('typed');
    /* the work order flutters on its pin when it's updated */
    const tk = statusEl.closest('.ticket');
    if (tk) { tk.classList.remove('flutter'); void tk.offsetWidth; tk.classList.add('flutter'); }
  }
  /* the HUD is shared by both levels: only the level on screen answers it */
  const mine = () => App.current === SCREEN;
  document.querySelectorAll('.swatch').forEach(b => b.addEventListener('click', () => {
    if (!mine()) return;
    st.color = b.dataset.color;
    document.querySelectorAll('.swatch').forEach(s => s.setAttribute('aria-pressed', String(s === b)));
    A.sfx.tick();
  }));
  btnTester.addEventListener('click', () => { if (mine() && !busy()) setTester(!st.tester); });
  document.getElementById('btnHint').addEventListener('click', () => { if (!mine() || st.inspecting) return; giveHint(); });
  document.getElementById('btnInspect').addEventListener('click', () => { if (mine() && !App.cardOpen) inspectorRun(); });
  document.getElementById('btnClear').addEventListener('click', () => { if (mine()) clearWires(); });
  document.getElementById('btnMenu').addEventListener('click', () => { if (mine() && !App.busy && !st.inspecting && !st.faultLock) App.go('menu', { from: [640, 360] }); });
  window.addEventListener('keydown', e => {
    if (App.current !== SCREEN || App.cardOpen || !App.running) return;
    lastInput = now;
    if (st.inspecting) { if (e.key === 'Escape' || e.key === ' ') IN.skip = true; return; }
    if (job && job.wrap && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { wrapBy(e.key === 'ArrowRight' ? Math.PI / 4 : -Math.PI / 4); return; }
    if (e.key === 's' || e.key === 'S') { if (SWS.length || CHAIN) flipSwitch(SWS[0] && SWS[0].id); }
    else if ((e.key === 'd' || e.key === 'D') && SWS[1]) flipSwitch(SWS[1].id);
    else if (e.key === 'b' || e.key === 'B') toggleBreaker();
    else if (e.key === 't' || e.key === 'T') setTester(!st.tester);
    else if (e.key === 'Escape') { if (st.tester) setTester(false); cancelLead(); cancelJob(); }
  });

  /* Owner's rule: every visit starts on a clean board. Only progress is kept
     (the won flag, which unlocks the next level; the punch card's best score is
     stored separately). Wires saved by older versions are dropped. */
  function save() { try { localStorage.setItem(LEVEL.store, JSON.stringify({ won: st.won })); } catch (e) { /* storage unavailable */ } }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(LEVEL.store) || 'null');
      st.won = !!(s && s.won);
      if (s && s.wires) save();
    } catch (e) { /* storage unavailable */ }
  }

  /* ---------- per-frame work ---------- */
  let acc = 0;
  function physics(dt) {
    acc = Math.min(acc + dt, 0.1);
    const h = 1 / 120;
    while (acc >= h) {
      acc -= h;
      for (const [w, v] of vis) {
        /* an end the Phantom is carrying follows his hand */
        if (v.carry) {
          const pa = v.carry.end === 'a' ? v.carry.at() : pinOf(w.a), pb = v.carry.end === 'b' ? v.carry.at() : pinOf(w.b);
          fitRope(v.rope, pa[0], pa[1], pb[0], pb[1]); wake(v.rope);
          stepRope(v.rope, h, pa, pb);
        } else if (!v.rope.sleep) stepRope(v.rope, h, pinOf(w.a), pinOf(w.b));
      }
      for (const [id, pg] of Object.entries(pig)) if (pg.rope && !pg.rope.sleep) stepRope(pg.rope, h, [TERMS[id].x, TERMS[id].y], pg.J);
      for (const l of loose) {
        const pinned = l.pin && now < l.drop;
        if (l.pin && l.pin.end === 'mid') {
          if (pinned) { const q = l.rope.pts[l.pin.k]; q.x = l.pin.at.x; q.y = l.pin.at.y; }
          stepRope(l.rope, h, null, null);
          if (pinned) { const q = l.rope.pts[l.pin.k]; q.x = l.pin.at.x; q.y = l.pin.at.y; }
        } else {
          const pin = pinned ? [l.pin.at.x, l.pin.at.y] : null;
          stepRope(l.rope, h, l.pin && l.pin.end === 'a' ? pin : null, l.pin && l.pin.end === 'b' ? pin : null);
        }
      }
      if (lead) {
        const a = pinOf(lead.from);
        let tx, ty;
        if (lead.retract >= 0) { const u = clamp((now - lead.retract) / 0.28); tx = lead.hand.x + (a[0] - lead.hand.x) * u; ty = lead.hand.y + (a[1] - lead.hand.y) * u; }
        else if (lead.target) { tx = TERMS[lead.target].x; ty = TERMS[lead.target].y; }
        else if (cursor) { tx = cursor[0]; ty = cursor[1]; }
        else { tx = a[0] + 30; ty = a[1] + 50; }
        const k = 1 - Math.exp(-h * (lead.target ? 38 : 24));
        lead.hand.x += (tx - lead.hand.x) * k; lead.hand.y += (ty - lead.hand.y) * k;
        const d = Math.hypot(lead.hand.x - a[0], lead.hand.y - a[1]);
        lead.rope.seg = (d + (lead.retract >= 0 ? 2 : slackFor(d) * 0.7)) / (lead.rope.pts.length - 1) + 0.01;
        stepRope(lead.rope, h, a, [lead.hand.x, lead.hand.y]);
      }
      if (job) {
        const a = job.pinA || pinOf(job.from), b = job.pinB;
        const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
        job.rope.seg += ((d + slackFor(d)) / (job.rope.pts.length - 1) - job.rope.seg) * 0.02;
        stepRope(job.rope, h, a, b);
      }
    }
    if (lead && lead.retract >= 0 && now - lead.retract > 0.3) { removeEls(lead.o); lead = null; }
    for (let i = loose.length - 1; i >= 0; i--) {
      const l = loose[i], u = (now - l.drop) / 0.5;
      if (u >= 1) { removeEls(l.o); loose.splice(i, 1); }
    }
  }

  /* ---------- the camera (see cam above) ---------- */
  const REDUCE = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  function camPush(x, y, z, hold, rate) {
    if (REDUCE || (G && !G.on)) return;
    /* re-centre only from rest, so a push never slides sideways */
    if (Math.abs(cam.z - 1) < 0.01) { cam.cx = x; cam.cy = y; }
    cam.pz = z; cam.until = now + hold; cam.rate = rate;
  }
  /* the camera is one compositor transform on the stage, the light pass and all
     (App.camera): nothing is re-rasterized and the light can't lag the picture */
  function applyCam() { App.camera(cam.z, cam.x, cam.y, cam.cx, cam.cy); }
  function camTick(dt) {
    /* the light comes on: a slow push in on it (not every time) */
    const top = LAMPS.reduce((m, l) => (l.t.p.glow > m.t.p.glow ? l : m)).t;
    const lit = !st.blown && top.p.glow > 0.7;
    if (lit && !cam.lit && now > cam.nextPush) { const [bx, by] = LAMPS.length > 1 ? [(LAMPS[0].def.x + LAMPS[1].def.x) / 2, top.world(0, -110)[1]] : top.world(0, -110); camPush(bx * KZ, by * KZ, 1.045, 2.4, 1.4); cam.nextPush = now + 8; }
    cam.lit = top.p.glow > 0.4 && (cam.lit || lit);
    /* a short or a bang: a quick punch in on it */
    if (ev.shake !== cam.lastShake) {
      cam.lastShake = ev.shake;
      if (now - ev.shake < 0.7) { const at = now - ev.arc < 1 && ev.arcA ? ev.arcA : null; camPush(at ? at.x * KZ : 640, at ? at.y * KZ : 360, 1.06, 0.35, 9); }
    }
    /* hands busy (a wire, a strip, a wrap, the tester): the camera holds still */
    if (lead || job || st.tester) return;
    const push = now < cam.until;
    cam.z += ((push ? cam.pz : 1) - cam.z) * (1 - Math.exp(-dt * (push ? cam.rate : 1.8)));
    if (!push && Math.abs(cam.z - 1) < 0.0006) cam.z = 1;
    applyCam();
  }
  function render(t, f) {
    /* cables */
    for (const [w, v] of vis) {
      if (!v.rope.sleep || v.dirty !== false) {
        const cEnd = e => (v.carry && v.carry.end === e ? (v.carry.screw ? TERMS[v.carry.screw] : 'free') : endOf(e === 'a' ? w.a : w.b));
        drawRope(v.o, v.rope, cEnd('a'), cEnd('b')); v.dirty = !v.rope.sleep || !!v.carry;
      }
      const surge = now < (v.surge || 0);
      v.o.glow.setAttribute('opacity', surge ? (f % 2 ? 0.8 : 0.3) : v.current ? R((0.24 + 0.08 * Math.sin(t * 9)) * 100) / 100 : v.hot ? 0.16 : 0);
      v.o.flow.setAttribute('opacity', v.current ? 1 : 0);
      const tr2 = now < (v.trace || 0);
      v.o.trace.setAttribute('opacity', tr2 ? 0.9 : 0);
      if (tr2) v.o.trace.setAttribute('stroke-dashoffset', R((t * 60) % 22));
      if (v.current) v.o.flow.setAttribute('stroke-dashoffset', R(((-t * 90 * v.dir) % 30 + 30) % 30));
    }
    for (const [id, pg] of Object.entries(pig)) {
      if (pg.o) {
        drawRope(pg.o, pg.rope, TERMS[id], 'nut');
        pg.o.glow.setAttribute('opacity', pg.hot ? 0.16 : 0);
      }
      const tu = clamp((now - pg.turn) / 0.25);
      const rot = (pg.twists + (tu < 1 ? tu - 1 : 0)) * 120;
      const wob = pg.snug ? 0 : 8 * Math.sin(t * 6);
      pg.nut.setAttribute('transform', `translate(${R(pg.J[0])},${R(pg.J[1])}) rotate(${R(wob)})`);
      let rd = '';
      for (let i = 0; i < 4; i++) { const x = -9 + ((i * 6 + rot / 20) % 18); rd += `M${R(x)},${R(-2 - Math.abs(x) * 0.2)} L${R(x * 0.7)},${R(-20 + Math.abs(x) * 0.3)} `; }
      pg.ribs.setAttribute('d', rd);
      pg.arrow.setAttribute('opacity', !pg.snug && pg.res ? R((0.6 + 0.4 * Math.sin(t * 8)) * 100) / 100 : 0);
    }
    for (const l of loose) {
      const pinned = l.pin && now < l.drop && l.pin.end !== 'mid';
      const at = pinned ? (l.pin.at.id ? endOf(l.pin.at.id) : null) : null;
      drawRope(l.o, l.rope, pinned && l.pin.end === 'a' ? at : null, pinned && l.pin.end === 'b' ? at : null);
      const u = (now - l.drop) / 0.5;
      l.o.g.setAttribute('opacity', u > 0 ? R((1 - u) * 100) / 100 : 1);
      l.o.shadow.setAttribute('opacity', u > 0 ? 0 : 0.24);
    }
    if (lead) drawRope(lead.o, lead.rope, endOf(lead.from), 'free');
    if (job) drawRope(job.o, job.rope, endOf(job.from), job.endB);
    /* screws spin down tight (or back out); rings show where a wire can land */
    for (const [id, tm] of Object.entries(TERMS)) {
      const su = (now - tm.spin) / 0.42;
      const rot = tm.rot + (su >= 0 && su < 1 ? (1 - Math.pow(1 - su, 3)) * 540 * tm.spinDir : 0);
      if (su >= 1) { tm.rot = (tm.rot + 540 * tm.spinDir) % 360; tm.spin = -9; }
      /* (only screws turn: written when it changes) */
      if (tm.slot) { const tr = `translate(${tm.x},${tm.y}) rotate(${R(rot)})`; if (tr !== tm.slotT) { tm.slotT = tr; tm.slot.setAttribute('transform', tr); } }
      let op = 0, r = 23, sw2 = 4;
      if (lead && lead.retract < 0) {
        if (id === lead.from) { op = 0.95; r = 21; }
        else if (id === lead.target) { op = 1; r = 25 + 3 * Math.sin(t * 16); sw2 = 5.5; }
        else { op = 0.35 + 0.2 * Math.sin(t * 5 + tm.x * 0.01); }
      } else if (job && job.wrap && job.wrap.id === id) { op = 0.5; r = 18; }
      else if (st.tester) {
        /* with the tester in hand, everything it can touch shows */
        const on = (tester.a && tester.a.id === id) || (tester.b && tester.b.id === id);
        op = on ? 0.95 : tester.hover && tester.hover.id === id ? 0.8 : 0.28 + 0.14 * Math.sin(t * 4 + tm.x * 0.02); r = on ? 20 : 22;
      }
      const pu = (now - (tm.pulse || -9)) / 0.3;
      if (pu >= 0 && pu < 1) r += 10 * (1 - pu);
      sa(tm.ring, { opacity: R(op * 100) / 100, r: R(r), 'stroke-width': sw2 });
    }
    if (REC) for (const p of REC) {
      const on = tester.a === p || tester.b === p;
      const op = !st.tester ? 0 : on ? 0.95 : tester.hover === p ? 0.85 : 0.3 + 0.15 * Math.sin(t * 4 + p.ly * 0.05);
      sa(p.ring, { opacity: R(op * 100) / 100, r: on ? 11 : 13, cx: R(p.x), cy: R(p.y) });
      sa(p.hit, { cx: R(p.x), cy: R(p.y) });
    }
    toolboxTick(Math.min(0.05, 1 / 24));
    /* the wrap grip rides the end of the copper; let go early and it springs back */
    if (job && job.wrap) {
      const w = job.wrap;
      if (!w.drag && Math.abs(w.s) > 0.01) { w.s *= 0.8; job.endB = { t: w.t, s: w.s }; }
      const a = w.a0 + w.s;
      wrapGrip.setAttribute('transform', `translate(${R(Math.cos(a) * WR)},${R(Math.sin(a) * WR)})`);
    }
    /* the neon tester follows the pointer and snaps to a screw */
    if (chainG) {
      /* yanked down, then it springs back up and swings a little */
      const u = now - chainPull, pull = u < 0.12 ? 22 * (u / 0.12) : u < 0.9 ? 22 * Math.exp(-(u - 0.12) * 7) * Math.cos((u - 0.12) * 18) : 0;
      const sway = u < 2 ? 5 * Math.exp(-u * 2) * Math.sin(u * 9) : 1.2 * Math.sin(t * 1.3);
      const x0 = CHAIN_AT.x, y0 = CHAIN_AT.y, x1 = x0 + sway, y1 = y0 + CHAIN_AT.len + pull;
      chainBeads.setAttribute('d', `M${R(x0)},${R(y0)} Q${R(x0 + sway * 0.3)},${R((y0 + y1) / 2)} ${R(x1)},${R(y1)}`);
      chainPullG.setAttribute('transform', `translate(${R(x1)},${R(y1)}) rotate(${R(-sway * 2)})`);
    }
    if (job && job.strip) {
      const s = job.strip, gx = s.x0 - s.dx * s.p, gy = s.y0 - s.dy * s.p;
      if (!s.drag && s.p > 0.5) s.p *= 0.7;
      const ang = Math.atan2(s.dy, s.dx) * 57.3;
      stripGrip.setAttribute('transform', `translate(${R(gx)},${R(gy)}) rotate(${R(ang)})`);
      stripArrow.setAttribute('transform', `translate(${R(gx)},${R(gy)}) rotate(${R(ang)})`);
      stripArrow.setAttribute('opacity', R((0.55 + 0.45 * Math.sin(t * 8)) * 100) / 100);
    }
    for (let i = slugs.length - 1; i >= 0; i--) {
      const s = slugs[i], u = now - s.t0, y = Math.min(FLOOR - 4, s.y + s.vy * u + 0.5 * GRAV * u * u);
      s.g.setAttribute('transform', `translate(${R(s.x + s.vx * Math.min(u, 0.9))},${R(y)}) rotate(${R(s.r + s.vr * Math.min(u, 0.9))})`);
      if (u > 1.6) s.g.setAttribute('opacity', R(clamp(1 - (u - 1.6) / 0.4) * 100) / 100);
      if (u > 2) { s.g.remove(); slugs.splice(i, 1); }
    }
    /* the two-lead tester: a probe on each point it's touching; a free probe
       follows the pointer (and snaps to whatever it's over), or dangles on its
       lead on a touch screen; the neon body hangs between the two leads */
    if (st.tester) {
      const free = () => (!TOUCH && cursor && now - tester.moved < 2.5 ? (tester.hover ? [tester.hover.x, tester.hover.y] : cursor) : null);
      const home = TB ? [TB.hinge[0] + 100, TB.rim - 30] : [W / 2, 560];
      let pA = tester.a ? [tester.a.x, tester.a.y] : free() || home, pB;
      if (tester.b) pB = [tester.b.x, tester.b.y];
      else if (tester.a) pB = free() || [pA[0] + 34, Math.min(pA[1] + 96, FLOOR - 10)];
      else pB = [pA[0] + 34, Math.min(pA[1] + 96, FLOOR - 10)];
      /* a probe that's touching something sits exactly on it; a free one glides
         (two frames) instead of jumping between snaps or back to its rest */
      const sm = tester.sm || (tester.sm = {});
      const glide = (key, p, held) => { const q = sm[key]; if (!q || held) { sm[key] = p.slice(); return p; } q[0] += (p[0] - q[0]) * 0.6; q[1] += (p[1] - q[1]) * 0.6; return q.slice(); };
      pA = glide('a', pA, !!tester.a); pB = glide('b', pB, !!tester.b);
      /* each handle leans away from the other probe */
      const side = pA[0] <= pB[0] ? -1 : 1;
      const aA = (-90 + side * 28) * Math.PI / 180, aB = (-90 - side * 28) * Math.PI / 180;
      const tA = [pA[0] + Math.cos(aA) * 70, pA[1] + Math.sin(aA) * 70], tB = [pB[0] + Math.cos(aB) * 70, pB[1] + Math.sin(aB) * 70];
      const dist = Math.hypot(tB[0] - tA[0], tB[1] - tA[1]);
      /* the body hangs off to one side, below the tips, clear of what's being tested */
      const mx = (pA[0] + pB[0]) / 2, bx = mx + (mx + 170 < W - 20 ? 105 : -105), by = Math.min(FLOOR - 20, Math.max(pA[1], pB[1]) + 36 + dist * 0.1);
      const ba = 0.12 * Math.sin(t * 1.7);
      const eL = [bx - Math.cos(ba) * 26, by - Math.sin(ba) * 26], eR = [bx + Math.cos(ba) * 26, by + Math.sin(ba) * 26];
      /* each lead runs to the nearer end of the body */
      const aLeft = Math.hypot(tA[0] - eL[0], tA[1] - eL[1]) + Math.hypot(tB[0] - eR[0], tB[1] - eR[1]) <= Math.hypot(tA[0] - eR[0], tA[1] - eR[1]) + Math.hypot(tB[0] - eL[0], tB[1] - eL[1]);
      const eA = aLeft ? eL : eR, eB = aLeft ? eR : eL;
      const leadD = (p, q, dir) => `M${R(p[0])},${R(p[1])} C${R(p[0] + Math.cos(dir) * 30)},${R(p[1] + Math.sin(dir) * 30 + 20)} ${R(q[0] + (q === eL ? -30 : 30))},${R(q[1] + 30)} ${R(q[0])},${R(q[1])}`;
      const dA = leadD(tA, eA, aA), dB = leadD(tB, eB, aB);
      leadEls[0].forEach(p => p.setAttribute('d', dA)); leadEls[1].forEach(p => p.setAttribute('d', dB));
      probeEls[0].setAttribute('transform', `translate(${R(pA[0])},${R(pA[1])}) rotate(${R(aA * 57.3 + 90)})`);
      probeEls[1].setAttribute('transform', `translate(${R(pB[0])},${R(pB[1])}) rotate(${R(aB * 57.3 + 90)})`);
      tBody.setAttribute('transform', `translate(${R(bx)},${R(by)}) rotate(${R(ba * 57.3)})`);
      const lit = tester.glow && tester.b;
      tNeon.setAttribute('fill', lit ? (f % 3 ? '#ffb070' : '#ff8a3a') : '#6a3a22');
      tGlow.setAttribute('opacity', lit ? R((0.75 + 0.25 * Math.sin(t * 40)) * 100) / 100 : 0);
      testerG.setAttribute('opacity', 1);
      neonAt = lit ? [bx, by] : null;
    } else { testerG.setAttribute('opacity', 0); neonAt = null; }
    /* the player's own hand, zapped at a live screw */
    const hu = now - HS.t0;
    if (hu >= 0 && hu < 1.1) {
      const jit = hu < 0.7 ? rand(-3, 3) : 0, yank = clamp((hu - 0.72) / 0.3);
      hand.setAttribute('opacity', R((1 - yank) * 100) / 100);
      hand.setAttribute('transform', `translate(${R(HS.x + jit - yank * 110)},${R(HS.y + jit - yank * 210)})`);
      const xr = hu < 0.7 && f % 2 === 0;
      handG.setAttribute('filter', xr ? 'url(#xray)' : '');
      handBones.setAttribute('opacity', xr ? 1 : 0);
    } else hand.setAttribute('opacity', 0);
    if (bubS.who === 'insp' && now < bubS.until && IN.st === 'walk' && f % 3 === 0) {
      const [hx, hy] = insp.bodyCircles()[0];
      if (!bubS.at || Math.hypot(hx - bubS.at[0], hy - bubS.at[1]) > 12) layoutBubble();
    }
    /* the breaker handle: a sprung throw with a little overshoot */
    const bp = brk.p, fc = 271 - bp * 20, uh = Math.abs(bp) * 11;
    sa(hFace, { y: R(fc - 14) });
    sa(hUnder, { y: R(bp >= 0 ? fc + 12 : fc - 12 - uh), height: R(Math.max(0.1, uh)), opacity: uh > 1 ? 1 : 0 });
    hGrip.setAttribute('d', `M176,${R(fc - 5)} H206 M176,${R(fc + 3)} H206`);
    tripFlag.setAttribute('opacity', st.trip ? 1 : 0);
    tripFlag.setAttribute('transform', st.trip ? `translate(${R((1 - clamp((now - ev.tripT) / 0.25)) * -16)},0)` : '');
    /* pilot jewel */
    const blink = now < ev.pilot && f % 4 < 2;
    const pilotOn = (st.power && !blink) || (!st.power && blink);
    jewel.setAttribute('fill', pilotOn ? 'url(#gJewelOn)' : 'url(#gJewelOff)');
    jewelGlow.setAttribute('opacity', pilotOn ? R((0.75 + 0.15 * Math.sin(t * 13)) * 100) / 100 : 0);
    /* the lamp swings on its cord; the blackout kills it */
    const acc2 = (-9.8 / 2.2) * Math.sin(lamp.th) - 0.9 * lamp.w + 0.2 * Math.sin(t * 0.5);
    lamp.w += acc2 / 24; lamp.th += lamp.w / 24;
    const tr = `translate(${LX},22) rotate(${R(lamp.th * 57.3)})`;
    lamp.g.setAttribute('transform', tr); lamp.coneG.setAttribute('transform', tr);
    const black = now > ev.black0 && now < ev.black1;
    const stutter = black && (Math.random() < 0.08 || (now > ev.black1 - 0.35 && f % 3 === 0));
    /* the shop lamp is on another circuit: a fault only makes it dip and flicker */
    const dipping = now - ev.dip < 0.45;
    const lampOn = black && !stutter ? 0 : dipping ? (Math.random() < 0.5 ? 0.3 : 0.75) : 1;
    lamp.cone.setAttribute('opacity', lampOn);
    lamp.bulbE.setAttribute('fill', lampOn > 0.6 ? '#fff4c8' : lampOn > 0 ? '#c8b070' : '#5a4a30');
    /* with the GPU pass on (js/gfx.js) the room's light is real light, in world
       units scaled by this level's camera; the painted pools and glows step aside */
    const gl = !!(G && G.on);
    /* on a phone the GPU spot draws the beam (the SVG one is a big blended shape
       re-rasterized every frame as the lamp swings) */
    lamp.coneG.style.display = gl && G.touch ? 'none' : '';
    /* depth of field (High, phones too): the bare wall behind the board a touch
       soft. It's a once-baked blurred bitmap (GFX.dof), never a live filter */
    const dof = gl && G.q === 'high';
    if (dof !== cam.dof) { cam.dof = dof; if (!dofW && dof && G.dof) dofW = G.dof([L.wall], { x: -20, y: -20, w: W + 40, h: 620 }, { k: KZ }); if (dofW) dofW.set(dof); }
    lampPool.setAttribute('opacity', gl ? 0 : lampOn);
    benchPool.setAttribute('opacity', gl ? 0 : lampOn);
    benchPool.setAttribute('cx', R(LX + Math.sin(lamp.th) * 520));
    darkRect.setAttribute('opacity', black ? (stutter ? 0.5 : gl ? 0.9 : 0.96) : 0);
    /* the music follows the job: tense strings while it's live and dangerous or
       blacked out, the Phantom's theremin while he's out, brass when it's been
       approved, a sleepy pad when you've wandered off */
    if (A.mood) {
      const danger = black || now - ev.tripT < 3 || now - HS.t0 < 2.5 ? 1 : LEVEL.safety && st.power && st.wires.length && !st.inspecting ? 0.35 : 0;
      A.mood({ danger, phantom: ph.root.style.display !== 'none' ? 1 : 0, success: now - (st.passT || -99) < 24 ? 1 : 0, idle: !danger && now - lastInput > 15 ? 0.8 : 0 });
    }
    if (gl) {
      G.clear(); G.view(KZ);
      const bl = st.blown ? 0 : clamp(Math.max(...LAMPS.map(l => l.t.p.glow)));
      G.ambient(black ? [0.15, 0.15, 0.2] : [0.7 + bl * 0.06, 0.66 + bl * 0.05, 0.62 + bl * 0.03]);
      if (lampOn > 0) {
        /* the shop lamp: a wide spot down the shade's axis (it swings with the
           lamp), its hot spot on the bench, and bloom round the bulb */
        const sn = Math.sin(lamp.th), cs = Math.cos(lamp.th);
        G.cone(LX - sn * 32, 22 + cs * 32, 780, [0.5 * lampOn, 0.42 * lampOn, 0.3 * lampOn], [-sn, cs], 0.8, 0.58);
        G.light(LX - sn * (540 / cs), 578, 430 / KZ, 58, [0.26 * lampOn, 0.21 * lampOn, 0.14 * lampOn]);
        G.glow(LX - sn * 76, 22 + cs * 76, 70, [1, 0.93, 0.75], 1.5 * lampOn);
      }
      /* the light we're wiring: when it works, it lights up the whole corner (a
         filament starved of voltage only glows a dull orange) */
      for (const l of LAMPS) {
        const b = st.blown ? 0 : clamp(l.t.p.glow);
        if (b <= 0.02) continue;
        const [gx, gy] = l.t.world(0, -150), warm = clamp((b - 0.15) / 0.6), k = LAMPS.length > 1 ? 0.8 : 1;
        G.light(gx, gy + 30, 520 * k, 440 * k, [0.66 * b, 0.52 * b * (0.55 + 0.45 * warm), 0.3 * b * (0.3 + 0.7 * warm)]);
        G.glow(gx, gy, 140, [1, 0.62 + 0.28 * warm, 0.3 + 0.32 * warm], 1.8 * b);
      }
      const pilot = (st.power && !(now < ev.pilot && f % 4 < 2)) || (!st.power && now < ev.pilot && f % 4 < 2);
      if (pilot && !black) G.glow(276 + PX, 240 + PY, 46, [1, 0.28, 0.16], 0.9);
      if (neonAt) G.glow(neonAt[0], neonAt[1], 90, [1, 0.5, 0.2], 1.3 * (0.75 + 0.25 * Math.sin(t * 40)));
      /* soft contact shadows for whoever stands on the bench */
      if (!black) for (const c of [insp, fuse, sparky]) if (c && c.root.style.display !== 'none' && c.cur) G.shadowOf(c, 0.4, LX);
    }
    for (const de of darkEyes) {
      const c = de.c, F = c.cfg.face, evil = c === ph;
      if (!black || c.root.style.display === 'none') { de.g.setAttribute('opacity', 0); continue; }
      de.g.setAttribute('opacity', 1);
      const blinkNow = !evil && (f + Math.floor(c.phase * 10)) % 36 < 2;
      const turn = clamp(c.p.turn, -1, 1);
      [-1, 1].forEach((s, i) => {
        const [ex, ey] = c.world(F.x + turn * F.turnShift + s * F.spacing, F.y + c.p.faceY);
        const k = evil ? 1 : 1.2;
        const rx = F.rx * c.cfg.scale * k, ry = F.ry * c.cfg.scale * k * (blinkNow ? 0.12 : 1), jit = evil ? 0 : rand(-0.8, 0.8);
        sa(de.e[i].w, { cx: R(ex + jit), cy: R(ey), rx: R(rx), ry: R(ry) });
        sa(de.e[i].p, { cx: R(ex + jit + clamp(c.p.lookX, -1, 1) * rx * 0.4), cy: R(ey + clamp(c.p.lookY, -1, 1) * ry * 0.35), rx: R(rx * (evil ? 0.2 : 0.3)), ry: R(ry * (evil ? 0.18 : 0.34)) });
      });
      /* eyes in the dark glow: the Phantom's burn yellow */
      if (gl && !stutter) {
        const [mx, my] = c.world(F.x + turn * F.turnShift, F.y + c.p.faceY), sc = c.cfg.scale;
        if (evil) G.glow(mx, my, F.spacing * sc * 3.2, [1, 0.78, 0.3], 2.6);
        else G.glow(mx, my, F.spacing * sc * 3.4, [0.95, 0.92, 0.82], 1.05);
      }
    }
    /* the arc: lightning jumping between the shorted screws */
    if (now < ev.arc && ev.arcA) {
      if (f % 2 === 0) particles.bolt(ev.arcA.x, ev.arcA.y, ev.arcB.x + rand(-10, 10), ev.arcB.y + rand(-10, 10));
      if (Math.random() < 0.5) { const p = pick([ev.arcA, ev.arcB]); particles.spark(p.x, p.y, 3, 0.6); }
    }
    /* soot fades in with the bang and out when the new bulb arrives */
    const su2 = clamp((now - ev.soot) / (ev.sootOn ? 0.2 : 1.2));
    const sop = ev.sootOn ? su2 : 1 - su2;
    for (const s of soots) s.setAttribute('opacity', R(sop * 100) / 100);
    if (!ev.sootOn && su2 >= 1 && soots.length) { soots.forEach(s => s.remove()); soots.length = 0; }
    /* the lit bulb warms the whole corner of the room */
    let lit = 0;
    for (const l of LAMPS) {
      const b = st.blown ? 0 : clamp(l.t.p.glow), [blx, bly] = l.t.world(0, -150);
      lit = Math.max(lit, b);
      sa(l.glowEl, { cx: R(blx), cy: R(bly + 30), opacity: gl ? 0 : R(clamp(b - 0.12) * 80) / 100 });
    }
    vign.setAttribute('opacity', gl ? 0 : R((1 - lit * 0.35) * 100) / 100);
    /* the replacement bulb comes down on a cord */
    const cb = BL.t;
    if (now > ev.cord0 && now < ev.cord1 + 0.6) {
      const [hx, hy] = cb.world(0, -236);
      const up = clamp((now - ev.cord1) / 0.6);
      cord.setAttribute('d', `M${R(hx)},-20 L${R(hx)},${R(hy + (-20 - hy) * up)}`);
      cord.setAttribute('opacity', up < 1 ? 1 : 0);
    } else if (now > ev.haul0 && now < ev.haul0 + 1.5) {
      /* ...and before that, down it comes for the scorched one */
      const [hx, hy] = cb.world(0, -96);
      const u = clamp((now - ev.haul0) / 0.55);
      cord.setAttribute('d', `M${R(hx)},-20 L${R(hx)},${R(-20 + (hy + 20) * u)}`);
      cord.setAttribute('opacity', 1);
    } else cord.setAttribute('opacity', 0);
    for (const l of LAMPS) if (l.t.burnt) l.ember.setAttribute('opacity', R(clamp(0.35 + 0.5 * Math.sin(t * 11) + 0.3 * Math.random()) * 100) / 100);
    /* speech bubble pops in and fades out */
    const bu = (now - bubS.t0) / 0.22;
    const bs = bu < 1 ? 0.5 + 0.5 * easeOutBack(clamp(bu)) : 1;
    const bo = now < bubS.until ? 1 : clamp(1 - (now - bubS.until) / 0.25);
    bub.setAttribute('opacity', R(bo * 100) / 100);
    bub.setAttribute('transform', `translate(${R(bubS.tip[0])},${R(bubS.tip[1])}) scale(${R(bs * 100) / 100}) translate(${R(-bubS.tip[0])},${R(-bubS.tip[1])})`);
    flash.setAttribute('opacity', R(Math.max(0, 0.7 - (now - ev.flash) * 2.2) * 100) / 100);
    const sh = Math.max(0, 0.6 - (now - ev.shake)) * 20;
    shakeG.setAttribute('transform', sh > 0 ? `translate(${R(rand(-sh, sh))},${R(rand(-sh, sh))})` : '');
    breaker.setAttribute('transform', now - ev.kick < 0.4 ? `translate(${R(rand(-1.5, 1.5))},0)` : '');
    /* the Inspector: spinning through the air, X-ray flashes, a flying cap, stars */
    if (IN.st === 'fly' && IN.fly) {
      const u = clamp((now - IN.fly.t0) / IN.fly.dur);
      inspWrap.setAttribute('transform', `rotate(${R(IN.fly.spin * u)} ${R(insp.cfg.x)} ${R(insp.cfg.y - 90)})`);
    }
    inspWrap.setAttribute('filter', now < IN.xray && f % 2 ? 'url(#xray)' : '');
    if (IN.capFly) {
      const c = IN.capFly, [px, py] = capPos();
      capFly.setAttribute('opacity', 1);
      capFly.setAttribute('transform', `translate(${R(px)},${R(py)}) rotate(${R(c.held ? 0 : c.rot)})`);
      /* its contact shadow firms up as it comes down to the bench */
      const k = c.held ? 0 : clamp(1 - (CAP_FLOOR - py) / 260);
      sa(capShadow, { cx: R(px), rx: R(20 + 22 * k), opacity: R(k * 38) / 100 });
    } else { capFly.setAttribute('opacity', 0); capShadow.setAttribute('opacity', 0); }
    /* the Phantom's question mark, bobbing over his skull */
    const qu = now - (PH.q || -9);
    if (qu < 2.3 && ph.root.style.display !== 'none') {
      const [qx, qy] = ph.world(26, -150);
      qMark.setAttribute('opacity', R(clamp(qu / 0.15) * clamp((2.3 - qu) / 0.3) * 100) / 100);
      qMark.setAttribute('transform', `translate(${R(qx)},${R(qy - 8 * Math.abs(Math.sin(t * 6)))}) rotate(${R(8 * Math.sin(t * 3))}) scale(${R((0.6 + 0.4 * clamp(qu / 0.2)) * 100) / 100})`);
    } else qMark.setAttribute('opacity', 0);
    dizzy.forEach((s, i) => {
      if (now > IN.dazed || IN.st === 'off') { s.setAttribute('opacity', 0); return; }
      const [hx, hy] = insp.world(0, -250), a = t * 5 + (i * Math.PI * 2) / 3;
      s.setAttribute('opacity', 1);
      s.setAttribute('transform', `translate(${R(hx + Math.cos(a) * 44)},${R(hy + Math.sin(a) * 12)}) rotate(${R(t * 200)})`);
    });
  }

  /* ---------- screen lifecycle ---------- */
  let lastF = -1;
  /* the shared paperwork says which job this is */
  const PUNCH_TEXT = {
    1: { fewest: 'No spare wire (four will do)', colors: 'Right colours: white neutral, green ground, hot never white or green' },
    2: { fewest: 'No spare wire (eight will do)', colors: 'Right colours: white neutral, green ground, hot never white (unless taped) or green' },
    11: { fewest: 'No spare wire (three will do)', colors: 'Right colours: black hot, white neutral, green ground' },
    12: { fewest: 'No spare wire (three will do)', colors: 'Right colours: black hot, white neutral, green ground' },
  };
  function dressHud() {
    document.getElementById('objective').textContent = LEVEL.objective;
    document.getElementById('levelName').textContent = `Level ${LEVEL.num}: ${LEVEL.name}`;
    const form = document.querySelector('#resultCard .report-head span:last-child');
    if (form) form.textContent = LEVEL.form;
    /* the first jobs keep it to black, white and green (a 2-wire cable has no red) */
    const red = document.querySelector('.swatch[data-color="#c7322b"]');
    if (red) red.hidden = !!LEVEL.noRed;
    if (LEVEL.noRed && st.color === '#c7322b') st.color = '#1c1c1e';
    const pt = LEVEL.punch || PUNCH_TEXT[ID];
    punch.querySelectorAll('li').forEach(li => { const t = pt[li.dataset.k]; if (t) li.lastChild.textContent = t; });
    punch.querySelector('li[data-k="bonus"]').hidden = !LEVEL.bonus;
    /* the re-taped white only comes out for the jobs that need one */
    const taped = document.querySelector(`.swatch[data-color="${TAPED}"]`);
    if (taped) taped.hidden = !LEVEL.taped;
    if (!LEVEL.taped && st.color === TAPED) st.color = '#1c1c1e';
    document.querySelectorAll('.swatch').forEach(s => s.setAttribute('aria-pressed', String(s.dataset.color === st.color)));
  }
  App.register(SCREEN, {
    /* the title card App.go shows while the iris is shut */
    title: { num: `Job ${LEVEL.num}`, name: LEVEL.name },
    enter() {
      root.style.display = ''; hud.hidden = false;
      now = performance.now() / 1000; lastInput = now;
      cam.z = 1; cam.until = -9; cam.lit = false; cam.lastShake = ev.shake; applyCam();
      st.blown = false; st.faultLock = false; st.trip = false; st.inspecting = false; st.worked = {};
      st.swapDone = false; st.phBusy = false; st.swapCheck = 0; PH.waitSwap = null; PH.run = (PH.run || 0) + 1; PH.q = -9; PH.lt = PH.rt = null; ph.actions = [];
      for (const l of LAMPS) { setBurnt(false, l); l.t.root.style.display = ''; l.t.actions = []; }
      BL = LAMPS[0]; ev.haul0 = -9;
      for (const s of SWS) { st.sw[s.id] = 0; s.toon.base.lever = leverOf(s.id, 0); s.toon.actions = []; s.glare = -9; }
      if (fuse) fuse.actions = [];
      if (sparky) sparky.actions = [];
      IN.run = (IN.run || 0) + 1;
      insp.root.style.display = 'none'; IN.st = 'off'; IN.aim = null; IN.capFly = null; IN.dazed = -9; IN.xray = -9;
      insp.cfg.y = 594; inspWrap.removeAttribute('transform'); inspWrap.removeAttribute('filter');
      insp.cap.style.display = ''; insp.hair.setAttribute('opacity', 0); capFly.setAttribute('opacity', 0); capShadow.setAttribute('opacity', 0);
      while (marks.firstChild) marks.firstChild.remove();
      ph.root.style.display = 'none'; PH.st = 'hid'; PH.hole = HOLE; ph.cfg.x = HOLE.x; ph.cfg.y = HOLE.y; L.phantom.setAttribute('clip-path', CLIP1);
      ev.sootOn = false; soots.forEach(s => s.remove()); soots.length = 0;
      ev.black0 = ev.black1 = ev.arc = -9;
      /* a clean board every time: no wires, no loose ends, no pigtails, and a
         fresh count for the punch card */
      cancelLead(true); if (job) { removeEls(job.o); job = null; hideWrap(); hideStrip(); }
      st.wires = [];
      loose.forEach(l => removeEls(l.o)); loose.length = 0;
      slugs.forEach(s => s.g.remove()); slugs.length = 0;
      for (const id of Object.keys(pig)) dropPigtail(id);
      st.shorts = 0; st.hint = 0; st.hintTier = {};
      st.work = { unproven: false, shocks: 0, live: 0 };
      if (CHAIN) st.sw.L1 = 0;
      if (outlet) outlet.actions = [];
      if (TB) { TB.ang = 0; TB.vel = 0; TB.closeAt = -9; TB.shy = -9; TB.ouch = -9; TB.bitten = false; TB.peek = false; TB.prank = -9; TB.prankAt = now + rand(8, 12); TB.fingersIn = false; }
      HS.t0 = -9;
      load(); syncWires();
      setPower(false, true);
      brk.p = -1; brk.v = 0;
      /* 1.1 and 1.2 start the way real jobs do: the circuit is LIVE */
      if (LEVEL.startsLive) { st.power = true; evaluate(); brk.p = 1; }
      setTester(false);
      status(st.power ? 'Breaker ON.' : 'Breaker OFF.');
      dressHud();
      st.visits = (st.visits || 0) + 1;
    },
    shown() {
      if (LEVEL.intro) { say(LEVEL.intro[st.visits > 1 ? 1 : 0], 5, LEVEL.introVoice && (LEVEL.introVoice !== 'sparky' || sparky) ? LEVEL.introVoice : 'bulb'); return; }
      if (ID === 11) { say(st.visits > 1 ? 'Clean board. And that breaker\'s ON again...' : 'A brand-new lampholder! Uh... that breaker\'s still ON, y\'know.', 5); return; }
      if (ID === 12) { say(st.visits > 1 ? 'Clean board. Breaker\'s ON again...' : 'See my chain? No wall switch this time. Oh, and the breaker\'s ON.', 5); return; }
      if (ID === 1) say(st.visits > 1 ? 'Clean board! Fresh start. The breaker\'s off, I checked. Twice.' : 'Oh! You\'re wiring ME? Okay. Okay. Hint button\'s down on the bench if you need it.', 6);
      else if (st.visits > 1) say('Back on the stairs! Clean board, breaker\'s off. Those two are STILL arguing.', 5);
      else {
        say('A light with TWO switches! One at the foot of the stairs, one at the head. Either one should work me.', 6);
        setTimeout(() => { if (App.current === SCREEN && !st.inspecting) { const m = K.huff(1); SWS[0].toon.play(m.k, m.d); say('Which means ME. I\'m in charge.', 3, 'S1'); } }, 6400);
        setTimeout(() => { if (App.current === SCREEN && !st.inspecting) { const m = K.huff(-1); SWS[1].toon.play(m.k, m.d); say('Hmph. We\'ll see about that, down there.', 3.4, 'S2'); } }, 9800);
      }
    },
    exit() { root.style.display = 'none'; hud.hidden = true; A.sfx.hum(false); particles.clear(); cancelLead(true); if (job) { removeEls(job.o); job = null; hideWrap(); hideStrip(); } setTester(false); },
    update(t, dt) {
      now = t;
      physics(dt);
      inspTick(dt);
      camTick(dt);
      /* the breaker handle springs toward where it's been thrown */
      const bt = st.power ? 1 : st.trip ? 0 : -1;
      brk.v += (bt - brk.p) * 520 * dt; brk.v *= Math.exp(-18 * dt); brk.p += brk.v * dt;
      const cast = [...SWS.map(s => s.toon), bulb].concat(bulb2 ? [bulb2] : [], sparky ? [sparky] : [], fuse ? [fuse] : [], outlet ? [outlet] : []);
      const fresh = cursor && (lead || cast.some(c => c.hovered) || st.tester);
      const goal = fresh ? cursor : st.inspecting && IN.st !== 'off' ? insp.facePos() : now < look.until ? [look.x, look.y] : null;
      cast.forEach((toon, i) => {
        /* each pair of eyes catches up at its own speed */
        if (!goal) toon.la = null;
        else if (!toon.la) toon.la = goal.slice();
        else { const k = 1 - Math.exp(-dt * [7, 3.2, 5, 2.4][i % 4]); toon.la[0] += (goal[0] - toon.la[0]) * k; toon.la[1] += (goal[1] - toon.la[1]) * k; }
        toon.attn = toon.la;
        toon.update(t, dt);
      });
      /* nobody idles in step: each of them fidgets on his own clock (a weight
         shift, a look round, a wring of the hands, a big breath) */
      for (const c of cast) {
        if (!c.nextFid) c.nextFid = now + rand(2, 8);
        if (now < c.nextFid) continue;
        c.nextFid = now + rand(4.5, 11);
        if (c.actions.length || st.inspecting || c.root.style.display === 'none' || (c === fuse && TB && (TB.prank >= 0 || fuseOnRim()))) continue;
        const m = c === sparky ? pick(SPK_FIDGETS)() : pick(FIDGETS)(Math.random() < 0.5 ? -1 : 1);
        c.play(m.k, m.d, { slot: 'small' });
      }
      /* the outlet's probe points ride along with him */
      if (REC && outlet && outlet.cur) for (const p of REC) { const [x, y] = outlet.world(p.lx, p.ly); p.x = x; p.y = y; }
      if (IN.st !== 'off') { insp.attn = IN.st === 'walk' ? null : IN.aim || bulb.facePos(); insp.update(t, dt); }
      if (ph.root.style.display !== 'none') {
        PH.alpha += (PH.alphaGoal - PH.alpha) * Math.min(1, dt * 5);
        ph.root.style.opacity = R(PH.alpha * 100) / 100;
        ph.update(t, dt);
        const hp = ph.handPoints();
        if (hp.length) { PH.handX = hp[1][0]; PH.handY = hp[1][1]; }
      }
      /* Level 2: idle with the breaker off and the travelers in? He has a plan
         (checked at most once a second, done at most once a visit) */
      if (LEVEL.swap && A.settings.scares && !st.swapDone && PH.st === 'hid' && ph.root.style.display === 'none' && now - lastInput > 14 && now > (st.swapCheck || 0)
        && !st.power && !st.trip && !busy() && !lead && !job && !st.blown && !st.faultLock) {
        st.swapCheck = now + 1;
        if (swapPlan()) { lastInput = now; phantomTravelerSwap(); }
      }
      /* ...then waits for the disaster: once the player flips a switch with the
         power on (or he gets bored), it's plain nothing went wrong */
      if (PH.waitSwap) {
        if (PH.st !== 'peek') PH.waitSwap = null;
        else if ((PH.waitSwap.flips > 0 && now - PH.waitSwap.flipT > 0.5) || now - PH.waitSwap.t0 > 25) phantomBaffled();
      }
      /* the Phantom gets ideas when the player wanders off */
      if (A.settings.scares && PH.st === 'hid' && ph.root.style.display === 'none' && now - lastInput > 28 && st.wires.length && !busy() && !lead && !job && !st.blown) {
        lastInput = now;
        phantomSwipe();
      }
      particles.update(dt);
      const f = Math.floor(t * 24);
      if (f === lastF) return;
      lastF = f;
      render(t, f);
    },
  });

  /* read progress now, which also clears wires an older version saved */
  load();
  return { LEVEL, st, TERMS, addWire, setPower, toggleBreaker, flipSwitch, inspect: inspectorRun, clearWires, cutWire, newBulb, blowBulb, landWire, setTester, testAt, probe, tester, TB, REC, giveHint, hintTopic, layoutBubble, bubS, phantomSwipe, phantomSabotage, wrapBy, sw, SWS, fuse, bulb, insp, ph, PH, IN, vis, pig, ev, K, say, get job() { return job; }, get lead() { return lead; } };
  }

  /* test hooks: window.CircuitLevel (1.3 Flip the Switch), CircuitLevel2 (1.7
     Stairway Lights), CircuitLevel11 (1.1 Toolbox), CircuitLevel12 (1.2 Pull
     Chain), CircuitLevel14 (1.4 Switch Loop) */
  window.CircuitLevel11 = buildLevel(LEVEL11);
  window.CircuitLevel12 = buildLevel(LEVEL12);
  window.CircuitLevel = buildLevel(LEVEL1);
  window.CircuitLevel14 = buildLevel(LEVEL14);
  window.CircuitLevel15 = buildLevel(LEVEL15);
  window.CircuitLevel16 = buildLevel(LEVEL16);
  window.CircuitLevel2 = buildLevel(LEVEL2);
  /* Unlocks. Nothing a player has already reached is ever taken away: 1.1 and
     Flip the Switch (the old first job) are always open, and each job opens
     once the one before it on the sign is approved (or anything after it
     already has been). Stairway Lights also stays open to anyone who'd passed
     Flip the Switch before the jobs between them were built. */
  const won = store => { try { return !!(JSON.parse(localStorage.getItem(store) || 'null') || {}).won; } catch (e) { return false; } };
  const ORDER = [LEVEL11, LEVEL12, LEVEL1, LEVEL14, LEVEL15, LEVEL16, LEVEL2];
  const ALWAYS = new Set(['lvl11', 'level']);
  const openAt = i => ALWAYS.has(ORDER[i].screen) || ORDER.some((L, j) => j >= i - 1 && won(L.store)) || (ORDER[i].screen === 'level2' && won(LEVEL1.store));
  window.CircuitLevels = {
    ORDER,
    open: screen => { const i = ORDER.findIndex(L => L.screen === screen); return i >= 0 && openAt(i); },
    /* the job sign lists Chapter 1 in order: a painted check for a job that's
       been approved, a padlock for one that isn't open yet */
    refresh() {
      const row = document.querySelector('#levelCard .jobs');
      if (!row) return;
      const LOCK = '<svg viewBox="0 0 24 28"><path d="M6.5 12.5 V8.5 a5.5 5.5 0 0 1 11 0 v4" fill="none" stroke="currentColor" stroke-width="3.4"/><rect x="3" y="12" width="18" height="14" rx="2.5" fill="currentColor"/><circle cx="12" cy="18" r="2.3" fill="#e8d7ae"/><path d="M12 19 v4" stroke="#e8d7ae" stroke-width="2.2"/></svg>';
      const CHECK = '<svg viewBox="0 0 28 24"><path d="M3 13 L10.5 20 L25 3.5" fill="none" stroke="currentColor" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      for (const L of ORDER) {
        const b = row.querySelector(`[data-level="${L.screen}"]`);
        if (!b) continue;
        const open = this.open(L.screen), done = open && won(L.store);
        b.disabled = !open;
        b.classList.toggle('done', done);
        b.innerHTML = `<span class="jn">${L.num}</span><span class="jt">${L.name}</span><span class="js" aria-hidden="true">${open ? (done ? CHECK : '') : LOCK}</span>`;
        b.setAttribute('aria-label', `${L.num} ${L.name}${open ? (done ? ', approved' : '') : ', locked'}`);
        row.appendChild(b);
      }
    },
  };
})();
