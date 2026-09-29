/* Circuit Panic! — circuit engine.
   Simplified educational model of a US residential 120 V branch circuit: wires
   and closed switch contacts are perfect conductors, bulbs are identical
   resistive loads, and the service panel holds fixed voltages (AC treated as its
   RMS magnitude, the two 240 V legs given opposite signs). The panel's NEUTRAL
   bar and GROUND bar are both at earth potential (0 V) because they are bonded
   together inside the service panel, and nowhere else.

   Everything here is pure data in / data out so it can be tested without a
   browser. The game's animation only ever acts out what this file decides:
   whether a bulb lights, whether a fault trips the breaker, whether a metal part
   is live, and exactly which terminal a mistake is at. */
(function (root) {
  'use strict';

  /* role: what each terminal is for, so faults can be named the way the trade names them */
  const TYPES = {
    source:    { terminals: ['hot', 'neu', 'gnd'], fixed: { hot: 120, neu: 0, gnd: 0 }, role: { hot: 'hot', neu: 'neutral', gnd: 'ground' } },
    source240: { terminals: ['hotA', 'hotB', 'neu', 'gnd'], fixed: { hotA: 120, hotB: -120, neu: 0, gnd: 0 }, role: { hotA: 'hot', hotB: 'hot', neu: 'neutral', gnd: 'ground' } },
    bulb:      { terminals: ['brass', 'silver'], load: true, role: { brass: 'brass', silver: 'shell' } },
    /* a single-pole switch: two brass screws, plus the green ground screw on its metal strap/box */
    sp:        { terminals: ['a', 'b', 'g'], states: 2, links: s => (s ? [['a', 'b']] : []), role: { a: 'switch', b: 'switch', g: 'bond' } },
    threeway:  { terminals: ['com', 't1', 't2', 'g'], states: 2, links: s => (s === 0 ? [['com', 't1']] : [['com', 't2']]), role: { com: 'common', t1: 'traveler', t2: 'traveler', g: 'bond' } },
  };
  const LIVE = 1;   /* volts: anything above this is "live" to a tester or a fingertip */

  function makeUF() {
    const parent = new Map();
    const find = x => {
      if (!parent.has(x)) parent.set(x, x);
      let r = x;
      while (parent.get(r) !== r) r = parent.get(r);
      while (parent.get(x) !== r) { const n = parent.get(x); parent.set(x, r); x = n; }
      return r;
    };
    const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) parent.set(ra, rb); };
    return { find, union };
  }

  function solve(A, b) {
    const n = b.length;
    for (let c = 0; c < n; c++) {
      let p = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      [A[c], A[p]] = [A[p], A[c]]; [b[c], b[p]] = [b[p], b[c]];
      const d = A[c][c];
      if (Math.abs(d) < 1e-12) continue;
      for (let r = 0; r < n; r++) {
        if (r === c) continue;
        const f = A[r][c] / d;
        if (!f) continue;
        for (let k = c; k < n; k++) A[r][k] -= f * A[c][k];
        b[r] -= f * b[c];
      }
    }
    return b.map((v, i) => (Math.abs(A[i][i]) < 1e-12 ? 0 : v / A[i][i]));
  }

  const termsOf = comps => { const out = []; for (const c of comps) for (const t of TYPES[c.type].terminals) out.push(c.id + '.' + t); return out; };
  const compOf = (comps, term) => comps.find(c => c.id === term.split('.')[0]);
  function roleOf(comps, term) {
    const c = compOf(comps, term);
    return c ? (TYPES[c.type].role || {})[term.split('.')[1]] || null : null;
  }

  /* comps: [{id,type}]  wires: [{a:'S1.a', b:'L1.brass'}]  state: {S1:1}  */
  function evaluate(comps, wires, state, powered) {
    const uf = makeUF();
    const allTerms = termsOf(comps);
    allTerms.forEach(t => uf.find(t));
    for (const w of wires) uf.union(w.a, w.b);
    for (const c of comps) {
      const T = TYPES[c.type];
      if (T.links) for (const [x, y] of T.links(state[c.id] || 0)) uf.union(c.id + '.' + x, c.id + '.' + y);
    }

    const res = { powered, short: false, groundFault: false, shortPairs: [], bonds: [], overvolt: [], V: {}, bulbs: {}, rootOf: {}, groundCurrent: 0 };
    for (const t of allTerms) res.rootOf[t] = uf.find(t);

    const bulbs = comps.filter(c => TYPES[c.type].load);
    const dark = () => { for (const t of allTerms) res.V[t] = null; for (const b of bulbs) res.bulbs[b.id] = { dv: 0, bright: 0, reversed: false }; return res; };
    if (!powered) return dark();

    const srcTerms = [];
    for (const c of comps) {
      const T = TYPES[c.type];
      if (!T.fixed) continue;
      for (const [t, v] of Object.entries(T.fixed)) srcTerms.push({ term: c.id + '.' + t, v, role: T.role[t] });
    }
    /* two panel terminals joined out in the field: at different voltages that's a
       bolted fault (a short, or a ground fault if one of them is the ground); at the
       same voltage it's neutral and ground bonded together downstream of the panel */
    for (let i = 0; i < srcTerms.length; i++) {
      for (let j = i + 1; j < srcTerms.length; j++) {
        const a = srcTerms[i], b = srcTerms[j];
        if (uf.find(a.term) !== uf.find(b.term)) continue;
        if (Math.abs(a.v - b.v) > LIVE) {
          res.short = true;
          res.shortPairs.push([a.term, b.term]);
          if (a.role === 'ground' || b.role === 'ground') res.groundFault = true;
        } else res.bonds.push([a.term, b.term]);
      }
    }
    if (res.short) return dark();

    const fixed = new Map();
    for (const s of srcTerms) fixed.set(uf.find(s.term), s.v);
    const edges = bulbs.map(b => [uf.find(b.id + '.brass'), uf.find(b.id + '.silver')]).filter(([u, v]) => u !== v);
    const adj = new Map();
    for (const [u, v] of edges) {
      if (!adj.has(u)) adj.set(u, []);
      if (!adj.has(v)) adj.set(v, []);
      adj.get(u).push(v); adj.get(v).push(u);
    }
    const reach = new Set(fixed.keys());
    const queue = [...fixed.keys()];
    while (queue.length) {
      const n = queue.shift();
      for (const m of adj.get(n) || []) if (!reach.has(m)) { reach.add(m); queue.push(m); }
    }
    const unknown = [...reach].filter(n => !fixed.has(n));
    const idx = new Map(unknown.map((n, i) => [n, i]));
    const A = unknown.map(() => unknown.map(() => 0));
    const bv = unknown.map(() => 0);
    for (const [u, v] of edges) {
      for (const [p, q] of [[u, v], [v, u]]) {
        if (!idx.has(p)) continue;
        const i = idx.get(p);
        A[i][i] += 1;
        if (idx.has(q)) A[i][idx.get(q)] -= 1;
        else if (fixed.has(q)) bv[i] += fixed.get(q);
      }
    }
    const sol = unknown.length ? solve(A, bv) : [];
    const nodeV = new Map(fixed);
    unknown.forEach((n, i) => nodeV.set(n, sol[i]));

    for (const t of allTerms) {
      const r = uf.find(t);
      res.V[t] = nodeV.has(r) ? nodeV.get(r) : null;
    }
    for (const b of bulbs) {
      const vb = res.V[b.id + '.brass'], vs = res.V[b.id + '.silver'];
      const dv = vb == null || vs == null ? 0 : Math.abs(vb - vs);
      const bright = dv / 120;
      const reversed = bright > 0.05 && Math.abs(vs) > Math.abs(vb) + 0.5;
      res.bulbs[b.id] = { dv, bright, reversed };
      if (bright > 1.3) res.overvolt.push(b.id);
    }
    /* load current coming home on the GROUND instead of the neutral */
    const neuRoots = new Set(srcTerms.filter(s => s.role === 'neutral').map(s => uf.find(s.term)));
    const gndRoots = new Set(srcTerms.filter(s => s.role === 'ground').map(s => uf.find(s.term)).filter(r => !neuRoots.has(r)));
    for (const b of bulbs) {
      const rb = uf.find(b.id + '.brass'), rs = uf.find(b.id + '.silver');
      for (const [mine, other] of [[rb, rs], [rs, rb]]) {
        if (gndRoots.has(mine) && nodeV.has(other)) res.groundCurrent += Math.abs(nodeV.get(other) - nodeV.get(mine)) / 120;
      }
    }
    return res;
  }

  /* Wire-level display info: which wires are hot, and which carry current. */
  function wireInfo(res, comps, wires) {
    const liveNodes = new Set();
    for (const c of comps) {
      if (TYPES[c.type].load && res.bulbs[c.id] && res.bulbs[c.id].bright > 0.02) {
        liveNodes.add(res.rootOf[c.id + '.brass']);
        liveNodes.add(res.rootOf[c.id + '.silver']);
      }
    }
    return wires.map(w => {
      const v = res.V[w.a];
      return {
        hot: v != null && Math.abs(v) > LIVE,
        current: res.powered && !res.short && liveNodes.has(res.rootOf[w.a]),
        volts: v,
      };
    });
  }

  function switchIds(comps) { return comps.filter(c => TYPES[c.type].states).map(c => c.id); }

  function combos(ids) {
    const out = [];
    const n = ids.length;
    for (let m = 0; m < 1 << n; m++) {
      const s = {};
      ids.forEach((id, i) => { s[id] = (m >> i) & 1; });
      out.push(s);
    }
    return out;
  }

  const posName = (comps, id, s) => {
    const c = comps.find(x => x.id === id);
    if (c.type === 'sp') return s ? 'ON' : 'OFF';
    return s ? 'DOWN' : 'UP';
  };

  /* The shortest conductor path between two terminals (wires and CLOSED switch
     contacts only; a lamp is a load, not a conductor). Steps: [{term, via}] with
     via = wire index, 'switch', or null for the start. */
  function pathBetween(comps, wires, state, from, to) {
    const adj = new Map();
    const add = (a, b, via) => { if (!adj.has(a)) adj.set(a, []); adj.get(a).push([b, via]); };
    wires.forEach((w, i) => { add(w.a, w.b, i); add(w.b, w.a, i); });
    for (const c of comps) {
      const T = TYPES[c.type];
      if (T.links) for (const [x, y] of T.links(state[c.id] || 0)) { add(c.id + '.' + x, c.id + '.' + y, 'switch'); add(c.id + '.' + y, c.id + '.' + x, 'switch'); }
    }
    const prev = new Map([[from, null]]);
    const q = [from];
    while (q.length) {
      const n = q.shift();
      if (n === to) break;
      for (const [m, via] of adj.get(n) || []) if (!prev.has(m)) { prev.set(m, [n, via]); q.push(m); }
    }
    if (!prev.has(to)) return null;
    const steps = [];
    for (let t = to; t != null;) { const p = prev.get(t); steps.unshift({ term: t, via: p ? p[1] : null }); t = p ? p[0] : null; }
    return steps;
  }

  /* The order an inspector walks the job: out from the panel's HOT along every
     wire and through every device (switch screw to switch screw, BRASS to SILVER),
     then home along the NEUTRAL, then the GROUND, then anything left unwired. */
  function route(level, wires) {
    const comps = level.components;
    const order = [], seen = new Set();
    const wiredTo = t => wires.map((w, i) => [w, i]).filter(([w]) => w.a === t || w.b === t).map(([w]) => (w.a === t ? w.b : w.a));
    const partners = t => {
      const c = compOf(comps, t), T = TYPES[c.type];
      if (T.fixed) return [];
      const r = T.role[t.split('.')[1]];
      if (r === 'bond') return [];
      return T.terminals.map(x => c.id + '.' + x).filter(x => x !== t && T.role[x.split('.')[1]] !== 'bond');
    };
    const visit = t => {
      if (seen.has(t)) return;
      seen.add(t); order.push(t);
      for (const n of wiredTo(t)) visit(n);
      for (const p of partners(t)) visit(p);
    };
    const byRole = r => termsOf(comps).filter(t => roleOf(comps, t) === r);
    for (const r of ['hot', 'neutral', 'ground']) for (const t of byRole(r)) visit(t);
    for (const t of termsOf(comps)) visit(t);
    return order;
  }

  /* ---------- fault analysis ---------- */
  /* Faults that are dangerous the moment the circuit is energized: a bolted fault
     (short or ground fault) that throws an arc and trips the breaker, a metal part
     or screw shell sitting at line voltage, or a lamp across 240 V. Everything
     else is a wrong-but-not-dangerous job the Inspector simply writes up. */
  const DANGER = new Set(['short', 'ground-fault', 'overvolt', 'hot-enclosure', 'reversed', 'switched-neutral']);
  const TRIPS = new Set(['short', 'ground-fault']);
  const PRIORITY = ['short', 'ground-fault', 'overvolt', 'hot-enclosure', 'series', 'neutral-missing', 'no-hot', 'switch-arrangement',
    'hot-on-traveler', 'traveler-on-common', 'not-3way', 'bypass', 'inverted', 'reversed', 'switched-neutral', 'ground-as-neutral', 'neutral-ground-bond', 'no-ground'];
  const WHY = {
    'short': 'short', 'ground-fault': 'short', 'overvolt': 'overvolt', 'hot-enclosure': 'ground', 'series': 'series',
    'neutral-missing': 'open', 'no-hot': 'open', 'switch-arrangement': 'open', 'hot-on-traveler': 'threeway', 'traveler-on-common': 'threeway',
    'not-3way': 'threeway', 'bypass': 'bypass', 'inverted': 'inverted', 'reversed': 'polarity', 'switched-neutral': 'neutral',
    'ground-as-neutral': 'ground', 'neutral-ground-bond': 'ground', 'no-ground': 'ground',
  };

  function analyze(level, wires) {
    const comps = level.components;
    const sw = switchIds(comps);
    const lamps = comps.filter(c => TYPES[c.type].load).map(c => c.id);
    const all = termsOf(comps);
    const byRole = r => all.filter(t => roleOf(comps, t) === r);
    const hots = byRole('hot'), neus = byRole('neutral'), gnds = byRole('ground'), bondsT = byRole('bond');
    const states = combos(sw);
    const offState = states[0];
    const rows = states.map(state => {
      const r = evaluate(comps, wires, state, true);
      return { state, res: r, lit: Object.fromEntries(lamps.map(l => [l, r.bulbs[l].bright])) };
    });
    const on = (row, l) => row.lit[l] > 0.9;
    const faults = [];
    const has = code => faults.some(f => f.code === code);
    const add = (code, at, extra = {}) => {
      if (has(code) && !extra.multi) return;
      faults.push(Object.assign({ code, at, state: offState, wire: null, danger: DANGER.has(code), trips: TRIPS.has(code) }, extra));
    };
    /* the device terminal where a path finally lands on a panel terminal */
    const landing = steps => {
      for (let i = steps.length - 2; i >= 0; i--) if (!TYPES[compOf(comps, steps[i].term).type].fixed) return steps[i].term;
      return steps[0].term;
    };

    /* 1. bolted faults */
    for (const row of rows) {
      for (const [ta, tb] of row.res.shortPairs) {
        const ground = roleOf(comps, ta) === 'ground' || roleOf(comps, tb) === 'ground';
        const hotT = roleOf(comps, ta) === 'hot' ? ta : tb, other = hotT === ta ? tb : ta;
        const steps = pathBetween(comps, wires, row.state, hotT, other) || [{ term: hotT }, { term: other }];
        const at = landing(steps);
        const last = steps[steps.length - 1];
        add(ground ? 'ground-fault' : 'short', [at, other], { state: row.state, wire: typeof last.via === 'number' ? last.via : null, from: hotT, to: other, path: steps.map(s => s.term) });
      }
    }
    const clean = rows.filter(r => !r.res.short);
    /* 2. a lamp across both hot legs */
    for (const row of clean) for (const l of row.res.overvolt) add('overvolt', [l + '.brass', l + '.silver'], { state: row.state });
    /* 3. a metal part (a green ground screw's strap or box) sitting at line voltage */
    for (const g of bondsT) {
      const row = clean.find(r => r.res.V[g] != null && Math.abs(r.res.V[g]) > LIVE);
      if (row) add('hot-enclosure', [g], { state: row.state, grounded: false, multi: true });
    }
    /* 4. what the lamps actually do */
    const rootIn = (row, t, list) => list.some(x => row.res.rootOf[x] === row.res.rootOf[t]);
    const dimRow = clean.find(r => lamps.some(l => r.lit[l] > 0.05 && r.lit[l] < 0.9));
    if (dimRow) add('series', lamps.filter(l => dimRow.lit[l] > 0.05).map(l => l + '.brass'), { state: dimRow.state });
    if (!faults.some(f => f.code === 'overvolt' || f.code === 'series')) {
      for (const l of lamps) {
        const litRows = clean.filter(r => on(r, l));
        if (litRows.length === 0) {
          const brass = l + '.brass', silver = l + '.silver';
          const home = rows.some(r => rootIn(r, silver, neus.concat(gnds)));
          const fed = rows.some(r => rootIn(r, brass, hots));
          if (!home && !rows.some(r => rootIn(r, brass, neus.concat(gnds)) && rootIn(r, silver, hots))) add('neutral-missing', [silver]);
          else if (!fed && !rows.some(r => rootIn(r, silver, hots))) add('no-hot', [brass]);
          else add('switch-arrangement', sw.map(id => comps.find(c => c.id === id)).map(c => c.id + '.' + TYPES[c.type].terminals[0]));
          continue;
        }
        if (level.goal === 'switch' && sw.length) {
          const S = sw[0];
          if (litRows.length === rows.length) add('bypass', [l + '.brass']);
          else if (litRows.every(r => r.state[S] === 0)) add('inverted', [S + '.' + TYPES[compOf(comps, S + '.a').type].terminals[0]]);
        } else if (level.goal === 'threeway' && sw.length >= 2) {
          const [A, B] = sw;
          const base = rows.find(r => r.state[A] === 0 && r.state[B] === 0);
          const c = on(base, l) ? 1 : 0;
          const ok = rows.every(r => (on(r, l) ? 1 : 0) === (r.state[A] ^ r.state[B] ^ c));
          if (litRows.length === rows.length) add('bypass', [l + '.brass']);
          else if (!ok) {
            const trav = byRole('traveler'), coms = byRole('common');
            const hotTrav = trav.find(t => rootIn(rows[0], t, hots) && rootIn(rows[1] || rows[0], t, hots));
            const wrongCom = coms.find(cm => wires.some(w => (w.a === cm || w.b === cm) && trav.includes(w.a === cm ? w.b : w.a) && compOf(comps, w.a === cm ? w.b : w.a).id !== compOf(comps, cm).id));
            if (hotTrav) add('hot-on-traveler', [hotTrav]);
            else if (wrongCom) add('traveler-on-common', [wrongCom]);
            else add('not-3way', coms.slice(0, 1));
          }
        }
        /* the screw shell: live while the lamp is lit means hot and neutral are
           reversed; live while it's off means the switch is in the neutral */
        const rev = litRows.find(r => r.res.bulbs[l].reversed);
        if (rev) add('reversed', [l + '.silver', l + '.brass'], { state: rev.state });
        const liveOff = clean.find(r => !on(r, l) && [l + '.brass', l + '.silver'].some(t => r.res.V[t] != null && Math.abs(r.res.V[t]) > LIVE));
        if (liveOff && sw.length && litRows.length < rows.length && !rev) {
          const swT = sw.flatMap(id => TYPES[compOf(comps, id + '.a').type].terminals.map(x => id + '.' + x))
            .filter(t => roleOf(comps, t) !== 'bond' && liveOff.res.V[t] != null && Math.abs(liveOff.res.V[t]) > LIVE && !rootIn(liveOff, t, hots));
          add('switched-neutral', swT.length ? [swT[0], l + '.silver'] : [l + '.silver'], { state: liveOff.state });
        }
      }
    }
    /* 5. the grounding system */
    const ref = clean[0] || rows[0];
    if (clean.some(r => r.res.groundCurrent > 0.05)) {
      const r = clean.find(x => x.res.groundCurrent > 0.05);
      const l = lamps.find(x => rootIn(r, x + '.silver', gnds) || rootIn(r, x + '.brass', gnds));
      add('ground-as-neutral', l ? [rootIn(r, l + '.silver', gnds) ? l + '.silver' : l + '.brass'] : gnds, { state: r.state });
    }
    for (const row of clean) {
      for (const [ta, tb] of row.res.bonds) {
        const steps = pathBetween(comps, wires, row.state, ta, tb) || [{ term: ta }, { term: tb }];
        add('neutral-ground-bond', [landing(steps)], { state: row.state, path: steps.map(s => s.term) });
      }
    }
    for (const g of bondsT) {
      if (rootIn(ref, g, neus) && !rootIn(ref, g, gnds)) add('neutral-ground-bond', [g], { multi: true });
    }
    if (level.requireGround) {
      for (const g of bondsT) {
        if (!rootIn(ref, g, gnds) && !faults.some(f => f.at[0] === g)) add('no-ground', [g], { multi: true });
      }
    }
    faults.sort((a, b) => PRIORITY.indexOf(a.code) - PRIORITY.indexOf(b.code));
    return { pass: faults.length === 0, faults, primary: faults[0] || null, rows, sw, lamps };
  }

  /* What a fingertip (or an Inspector's probe) on a terminal would meet if the
     breaker were switched ON in the given switch state. A bolted fault trips the
     breaker, but anyone touching the faulted conductor takes the arc first. */
  function touch(level, wires, state, term) {
    const r = evaluate(level.components, wires, state, true);
    if (r.short) {
      const faulted = new Set(r.shortPairs.map(p => r.rootOf[p[0]]));
      const onFault = faulted.has(r.rootOf[term]);
      return { trips: true, kind: r.groundFault ? 'ground-fault' : 'short', arc: onFault, shock: onFault, volts: onFault ? 120 : 0, res: r };
    }
    const v = r.V[term], volts = v == null ? 0 : Math.abs(v);
    return { trips: false, kind: r.overvolt.length ? 'overvolt' : volts > LIVE ? 'live' : null, arc: false, shock: volts > LIVE, volts, res: r };
  }

  /* ---------- plain-English write-ups ---------- */
  function nameOf(level, t) {
    if (level.names && level.names[t]) return level.names[t];
    const comps = level.components, c = compOf(comps, t), term = t.split('.')[1];
    const role = roleOf(comps, t);
    if (TYPES[c.type].fixed) return { hot: 'the panel HOT', neutral: 'the panel NEUTRAL', ground: 'the panel GROUND' }[role] || 'the panel ' + term;
    if (role === 'bond') return `${c.id}'s green GROUND screw`;
    if (role === 'brass') return `${c.id}'s BRASS screw`;
    if (role === 'shell') return `${c.id}'s SILVER screw (the screw shell)`;
    if (role === 'common') return `${c.id}'s COMMON screw`;
    if (role === 'traveler') return `${c.id}'s traveler screw`;
    return `${c.id}'s ${term} screw`;
  }
  function describe(level, f) {
    const comps = level.components, n = t => nameOf(level, t);
    const swWord = Object.keys(f.state || {}).length === 1 ? `with the switch ${posName(comps, Object.keys(f.state)[0], f.state[Object.keys(f.state)[0]])}, ` : '';
    const at = f.at && f.at[0];
    switch (f.code) {
      case 'short': return { title: 'Short circuit!', msg: `This connection creates a short circuit: ${swWord}${n(at)} connects straight to ${n(f.to)} with no bulb in between, so hot meets neutral. Energized, that's a huge fault current, an arc and a tripped breaker.` };
      case 'ground-fault': return { title: 'Ground fault!', msg: `Hot is connected to ground at ${n(at)}: ${swWord}the hot runs straight onto the grounding path. Energized, fault current races down the ground wire and trips the breaker, with an arc where it lands.` };
      case 'overvolt': return { title: 'Overvoltage!', msg: `${swWord.replace(/^w/, 'W')}the bulb sits across both hot legs: 240 volts on a 120-volt bulb. It flashes and burns out. A 120-volt light goes between ONE hot and the neutral.` };
      case 'hot-enclosure': return { title: 'Live metal!', msg: `Ground is improperly connected: ${n(at)} is carrying the HOT, and that metal box isn't grounded. Energized, the whole box sits at 120 volts waiting for a hand, and nothing trips. The green screw is only for the bare or green ground wire.` };
      case 'series': return { title: 'Dim bulbs', msg: 'The bulbs glow at half brightness. They are wired in series, so they split the 120 volts between them. Give each bulb its own hot-to-neutral path (parallel) so each one gets the full 120.' };
      case 'neutral-missing': return { title: 'Neutral is missing', msg: `Neutral is missing from the fixture: ${n(at)} isn't connected back to the panel NEUTRAL. The current has no way home, so the bulb can't light.` };
      case 'no-hot': return { title: 'No hot at the bulb', msg: `No hot reaches ${n(at)}. Trace it: panel HOT, through the switch, to the BRASS screw. There's a gap before the bulb.` };
      case 'switch-arrangement': return { title: 'Can\'t complete the circuit', msg: 'This switch arrangement can\'t complete the circuit: hot reaches the bulb and neutral comes home, but no switch position ever connects them into one loop.' };
      case 'hot-on-traveler': return { title: 'Hot on a traveler', msg: `The hot landed on a traveler screw (${n(at)}) instead of the COMMON. On a 3-way, the dark COMMON screw takes the hot (or feeds the bulb); the two brass screws are the travelers.` };
      case 'traveler-on-common': return { title: 'Traveler on the common', msg: `A traveler landed on the common terminal at ${n(at)}. The travelers run brass-to-brass between the two 3-ways; the COMMON screws take the hot and the bulb feed.` };
      case 'not-3way': return { title: 'Not quite three-way', msg: 'This switch arrangement can\'t control the light from both switches: flipping either switch should ALWAYS change the light. Hot to one COMMON, bulb feed from the other COMMON, travelers brass-to-brass.' };
      case 'bypass': return { title: 'Switch bypassed', msg: `The switch isn't in the bulb's path: ${n(at)} gets hot without going through the switch, so the switch has nothing to interrupt and the bulb stays on.` };
      case 'inverted': return { title: 'Upside down?', msg: 'The bulb lights when the switch says OFF. The switch should close the path when it is ON.' };
      case 'reversed': return { title: 'Reversed polarity', msg: `Hot and neutral are reversed at the lampholder: the switched hot is on ${n(at)}, so the screw shell, the part your fingers touch changing a bulb, is live whenever the switch is ON. Hot goes to BRASS, neutral to SILVER.` };
      case 'switched-neutral': return { title: 'Switched the neutral', msg: `The switch is in the NEUTRAL, not the hot. With the switch OFF, ${n(at)} and the socket are still live at 120 volts. A switch must interrupt the HOT conductor.` };
      case 'ground-as-neutral': return { title: 'Ground used as neutral', msg: `Ground is improperly connected: ${n(at)} comes home on the GROUND instead of the NEUTRAL, so normal current is flowing on the ground wire. The light works, but the ground must carry no current unless something is wrong.` };
      case 'neutral-ground-bond': return { title: 'Neutral bonded to ground', msg: `Neutral and ground are joined out here at ${n(at)}. They may only be bonded together at the service panel; anywhere else it puts normal current on the grounding path.` };
      case 'no-ground': return { title: 'Missing ground', msg: `The light works, but ${n(at)} isn't connected to the panel GROUND. Without that bare or green ground wire, a fault on that metal box would have nowhere safe to go.` };
      default: return { title: 'Something\'s off', msg: 'The wiring doesn\'t do what it should.' };
    }
  }

  /* Inspector: checks the wiring against the level goal in EVERY switch position. */
  function checkGoal(level, wires) {
    const a = analyze(level, wires);
    const base = { rows: a.rows, sw: a.sw, lamps: a.lamps, faults: a.faults };
    if (a.pass) return Object.assign({ pass: true, title: 'Wired right!', msg: level.winText || 'Every switch position does exactly what it should.' }, base);
    const f = a.primary, d = describe(level, f);
    return Object.assign({ pass: false, title: d.title, msg: d.msg, why: WHY[f.code], code: f.code, fault: f }, base);
  }

  /* Conductor colours, checked the way the trade does it. Wires carry a colour
     name ('black', 'white', 'red' or 'green'). A wire landing on a GROUND terminal
     is an equipment grounding conductor and must be green (or bare). With the
     power on, a wire on the neutral in EVERY switch position must be white; a wire
     that is hot in ANY position (switch legs and travelers included) must never be
     white or green. Wires with no voltage at all are ignored. */
  function colorCheck(level, wires) {
    const comps = level.components;
    const runs = combos(switchIds(comps)).map(state => evaluate(comps, wires, state, true));
    const bad = [];
    if (runs.some(r => r.short)) return { ok: true, bad };
    wires.forEach((w, i) => {
      const grounding = [w.a, w.b].some(t => ['ground', 'bond'].includes(roleOf(comps, t)));
      const vs = runs.map(r => r.V[w.a]);
      const hotAny = vs.some(v => v != null && Math.abs(v) > LIVE);
      const zeroAll = vs.every(v => v != null && Math.abs(v) <= LIVE);
      if (grounding) { if (w.color !== 'green' && w.color !== 'bare') bad.push({ i, why: 'ground-not-green' }); }
      else if (hotAny && (w.color === 'white' || w.color === 'green')) bad.push({ i, why: w.color === 'white' ? 'white-hot' : 'green-hot' });
      else if (zeroAll && w.color !== 'white') bad.push({ i, why: w.color === 'green' ? 'green-neutral' : 'neutral-not-white' });
    });
    return { ok: bad.length === 0, bad };
  }

  const api = { TYPES, DANGER, TRIPS, evaluate, wireInfo, checkGoal, analyze, describe, nameOf, route, touch, pathBetween, roleOf, switchIds, combos, posName, colorCheck };
  root.Circuit = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
