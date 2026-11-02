import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "file:///C:/Users/admin/.workbuddy/skills/anatomy/kit/iso-kit.mjs";
import { tubePieces, tubeSvg } from "file:///C:/Users/admin/.workbuddy/skills/anatomy/kit/tube.mjs";
import { solidOf, frameAlong, fillet } from "file:///C:/Users/admin/.workbuddy/skills/anatomy/kit/lathe.mjs";
import { kitScript } from "file:///C:/Users/admin/.workbuddy/skills/anatomy/scripts/inline-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";

const WIDTH = 620;
const HEIGHT = 430;

const PLATE = { x: -124, y: -56, w: 248, d: 112, r: 8 };
const PLATE_H = 10;
const FOOT_H = 5;

const POST = [-100, 0];
const POST_TOP = 64;
const SHAFT_Z = 40;
const KNOB_REST = -88;
const KNOB_TRAVEL = 6;
const COLLAR_X = -70;
const SPRING_FROM = -84;
const SPRING_TO = -72;

const MC = { x: -46, y: -12, w: 30, d: 24, r: 3 };
const MC_Z = 28;
const MC_H = 22;
const RES = { x: -42, y: -8, w: 14, d: 16, r: 2 };
const RES_Z = MC_Z + MC_H;
const RES_H = 10;
const OUTLET = [-31, -6];

const GAUGE = [-8, 30];
const GAUGE_R = 11;
const GAUGE_Z = 32;
const GAUGE_H = 11;
const GAUGE_TOP = GAUGE_Z + GAUGE_H;
const BAR_MAX = 120;

const DISC = [80, 0];
const DISC_R = 40;
const DISC_Z = 30;
const DISC_H = 6;
const DISC_TOP = DISC_Z + DISC_H;
const PAD_REST_Z = 37.5;
const PAD = { x: 88, y: -8, w: 14, d: 16, r: 2 };
const HOUSING = [95, 0];

const TUBE_Z = 70;
const TUBE_R = 1.2;
const TEE = [GAUGE[0], GAUGE[1], TUBE_Z];
const INLET = [HOUSING[0], HOUSING[1]];

const P = k.fitProjection(
  [
    ...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0),
    [POST[0], POST[1], POST_TOP + 3],
    [OUTLET[0], OUTLET[1], TUBE_Z + 2],
    [INLET[0], INLET[1], TUBE_Z + 2],
    [DISC[0] + DISC_R, DISC[1], DISC_TOP],
  ],
  WIDTH,
  HEIGHT,
  { pad: 26, azimuth: 42 },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));

function lengthAlong(points) {
  const out = [0];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    out.push(out[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]));
  }
  return out;
}
function gapNear(points, target, half) {
  let best = 0, bestD = Infinity;
  const cum = lengthAlong(points);
  for (let i = 0; i < points.length; i++) {
    const d = Math.hypot(points[i][0] - target[0], points[i][1] - target[1], points[i][2] - target[2]);
    if (d < bestD) { bestD = d; best = cum[i]; }
  }
  return [best - half, best + half];
}

function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(PLATE, 20))) {
    out.push(S(k.cylinder(x, y, 6.5, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 9);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.1, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  const strip = { x: -112, y: PLATE.y + PLATE.d - 14, w: 104, d: 7, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [2, 3.6], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(D([at([strip.x + 2, strip.y + 3.5, 0.6]), at([strip.x + strip.w - 2, strip.y + 3.5, 0.6])], { size: 0.45 }));
  const label = { x: 24, y: PLATE.y + PLATE.d - 15, w: 74, d: 9, r: 1 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 3), { tone: "lo", crease: "none" }));
  out.push(L([0, 2.2, 4.4].map((o) => k.lineOnTop([label.x + 8, label.y + 3 + o], [label.x + label.w - 8, label.y + 3 + o], 0.8, P)).join(""), { tone: "mid", free: "both" }));
  return out.join("");
}

function pedalSide() {
  const out = [];
  out.push(S(k.cylinder(POST[0], POST[1], 4.5, 0, POST_TOP, P, 28), { tone: "mid", crease: "none" }));
  out.push(L([14, 26, 38, 50].map((z) => k.sideArc(POST[0], POST[1], 4.5, z, P, 16)).join(""), { tone: "faint" }));
  out.push(S(k.cylinder(POST[0], POST[1], 5.2, POST_TOP, 3, P, 28), { tone: "mid" }));
  const clamp = { x: POST[0] - 8, y: -8, w: 16, d: 16, r: 2.5 };
  out.push(S(k.slabOf(clamp, SHAFT_Z - 4, 8, P, 4, 0.6), { tone: "mid" }));
  out.push(D([at([clamp.x + 4, clamp.y + 4, SHAFT_Z + 4]), at([clamp.x + 4, clamp.y + clamp.d - 4, SHAFT_Z + 4])], { size: 0.45 }));
  out.push(S(k.cylinder(POST[0] + 7, POST[1], 3, SHAFT_Z - 2, 4, P, 20), { tone: "mid" }));
  out.push(S(solidOf([[0, 1.6], [56, 1.6]], frameAlong([POST[0], POST[1], SHAFT_Z], [1, 0, 0]), P), { tone: "mid" }));
  out.push(S(k.cylinder(COLLAR_X, POST[1], 2.6, SHAFT_Z - 2, 4, P, 20), { tone: "mid" }));
  out.push(L(k.knurl(COLLAR_X, POST[1], 2.6, SHAFT_Z - 2, SHAFT_Z + 2, 18, P), { tone: "lo" }));
  const helix = [];
  const turns = 7;
  for (let i = 0; i <= turns * 12; i++) {
    const t = i / (turns * 12);
    const angle = t * turns * Math.PI * 2;
    helix.push([SPRING_FROM + t * (SPRING_TO - SPRING_FROM), POST[1] + Math.sin(angle) * 3.2, SHAFT_Z + Math.cos(angle) * 3.2]);
  }
  out.push(tubePieces(helix, 0.55, P, { maxLength: 30, caps: false }).map((piece) => tubeSvg(piece, { tone: "mid" })).join(""));
  return out.join("");
}

function pedalGroup() {
  const parts = [];
  parts.push(S(k.cylinder(KNOB_REST, POST[1], 5, SHAFT_Z - 6, 12, P, 28), { tone: "hi", lit: true }));
  parts.push(L(k.knurl(KNOB_REST, POST[1], 5, SHAFT_Z - 6, SHAFT_Z + 6, 40, P), { tone: "lo" }));
  parts.push(L(k.lineOnTop([KNOB_REST - 5, POST[1]], [KNOB_REST + 5, POST[1]], SHAFT_Z + 6, P), { tone: "mid" }));
  parts.push(S(solidOf([[0, 1.6], [37, 1.6]], frameAlong([KNOB_REST + 3, POST[1], SHAFT_Z], [1, 0, 0]), P), { tone: "hi", lit: true }));
  return parts.join("");
}

function gland() {
  const out = [];
  out.push(S(solidOf([[0, 4], [4, 4]], frameAlong([MC.x - 4, 0, SHAFT_Z], [1, 0, 0]), P), { tone: "mid" }));
  out.push(L(k.ring(MC.x - 2, 0, 4, SHAFT_Z, P, 20), { tone: "lo" }));
  out.push(S(k.cylinder(MC.x - 6, 0, 1.9, SHAFT_Z - 0.8, 1.6, P, 16), { tone: "lo" }));
  return out.join("");
}

function masterCylinder() {
  const out = [];
  out.push(S(k.slabOf(MC, MC_Z, MC_H, P, 6, 0.8), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(MC, 3), MC_Z + MC_H, P), { tone: "faint" }));
  out.push(D([at([MC.x + 5, MC.y + 5, MC_Z]), at([MC.x + 5, MC.y + MC.d - 5, MC_Z]), at([MC.x + MC.w - 5, MC.y + 5, MC_Z]), at([MC.x + MC.w - 5, MC.y + MC.d - 5, MC_Z])], { size: 0.45 }));
  out.push(S(k.slabOf({ x: MC.x - 2, y: -8, w: 4, d: 16, r: 1.5 }, 0, MC_Z, P, 4, 0.6), { tone: "mid" }));
  out.push(S(k.slabOf({ x: MC.x + MC.w - 2, y: -8, w: 4, d: 16, r: 1.5 }, 0, MC_Z, P, 4, 0.6), { tone: "mid" }));
  out.push(S(k.slabOf(RES, RES_Z, RES_H, P, 5, 0.8), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(RES, 2), RES_Z + RES_H, P), { tone: "faint" }));
  out.push(S(k.cylinder(RES.x + RES.w / 2, RES.y + RES.d / 2, 4, RES_Z + RES_H, 4, P, 28), { tone: "mid" }));
  out.push(L(k.knurl(RES.x + RES.w / 2, RES.y + RES.d / 2, 4, RES_Z + RES_H, RES_Z + RES_H + 4, 28, P), { tone: "lo" }));
  out.push(S(k.cylinder(OUTLET[0], OUTLET[1], 2.7, RES_Z + RES_H, 3, P, 20), { tone: "hi" }));
  out.push(L(k.knurl(OUTLET[0], OUTLET[1], 2.7, RES_Z + RES_H, RES_Z + RES_H + 3, 20, P), { tone: "lo" }));
  return out.join("");
}

const routeRaw = [
  [OUTLET[0], OUTLET[1], RES_Z + RES_H + 3],
  [OUTLET[0], OUTLET[1], TUBE_Z],
  TEE,
  [30, 38, TUBE_Z],
  [INLET[0], 38, TUBE_Z],
  [INLET[0], INLET[1], TUBE_Z],
];
const route = fillet(routeRaw, 3.2, 8, { P, tube: TUBE_R });
const teeGap = gapNear(route, TEE, 5.2);
const stub = fillet([[TEE[0], TEE[1], TUBE_Z - 2], [GAUGE[0], GAUGE[1], GAUGE_TOP + 3]], 3, 6, { P, tube: TUBE_R });

function plumbing() {
  const out = [];
  out.push(tubePieces(route, TUBE_R, P, { maxLength: 26, gaps: [teeGap] }).map((piece) => tubeSvg(piece, { tone: "hi" })).join(""));
  out.push(tubePieces(stub, TUBE_R, P, { maxLength: 26 }).map((piece) => tubeSvg(piece, { tone: "hi" })).join(""));
  out.push(S(k.cylinder(TEE[0], TEE[1], 3.4, TUBE_Z - 5, 10, P, 20), { tone: "hi" }));
  out.push(L(k.knurl(TEE[0], TEE[1], 3.4, TUBE_Z - 5, TUBE_Z + 5, 24, P), { tone: "lo" }));
  const nutAt = [[OUTLET[0], OUTLET[1], RES_Z + RES_H], [GAUGE[0], GAUGE[1], GAUGE_TOP], [INLET[0], INLET[1], 66]];
  for (const [x, y, z] of nutAt) {
    out.push(S(k.cylinder(x, y, 2.8, z, 3.6, P, 20), { tone: "hi" }));
    out.push(L(k.knurl(x, y, 2.8, z, z + 3.6, 20, P), { tone: "lo" }));
  }
  return out.join("");
}

function gauge() {
  const out = [];
  const [x, y] = GAUGE;
  out.push(S(k.cylinder(x, y, 2.8, 0, GAUGE_Z, P, 20), { tone: "mid", crease: "none" }));
  out.push(S(k.slabOf({ x: x - 6, y: y - 6, w: 12, d: 12, r: 2 }, GAUGE_Z - 4, 4, P, 3, 0.5), { tone: "mid" }));
  out.push(S(k.cylinder(x, y, GAUGE_R, GAUGE_Z, GAUGE_H, P, 56, 0.8), { tone: "hi", crease: "lo" }));
  out.push(L(k.knurl(x, y, GAUGE_R, GAUGE_Z, GAUGE_TOP, 64, P, 0.3), { tone: "lo" }));
  out.push(L(k.ring(x, y, GAUGE_R - 1.6, GAUGE_TOP, P, 56), { tone: "lo" }));
  const ticks = k.radialTicks(x, y, GAUGE_R - 3, 36, 6, GAUGE_TOP, [1.1, 2.4], P, -Math.PI * 0.75, Math.PI * 1.5);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(k.faceTextSvg(k.topMatrix([x, y + GAUGE_R - 6], GAUGE_TOP, P, "x"), "bar", { size: 2.1, tone: "lo", anchor: "middle" }));
  out.push(D([at([x, y, GAUGE_TOP + 0.2])], { size: 0.55, tone: "hi" }));
  return out.join("");
}

const needleAt = (bar) => {
  const angle = -Math.PI * 0.75 + (Math.min(bar, BAR_MAX) / BAR_MAX) * Math.PI * 1.5;
  const [x, y] = GAUGE;
  return k.lineOnTop([x - Math.cos(angle) * 2.2, y - Math.sin(angle) * 2.2], [x + Math.cos(angle) * (GAUGE_R - 3.6), y + Math.sin(angle) * (GAUGE_R - 3.6)], GAUGE_TOP + 0.2, P);
};

function brakeDisc() {
  const out = [];
  const [x, y] = DISC;
  out.push(S(k.cylinder(x, y, 5, 0, 24, P, 28), { tone: "mid", crease: "none" }));
  out.push(L([8, 16].map((z) => k.sideArc(x, y, 5, z, P, 16)).join(""), { tone: "faint" }));
  out.push(S(k.cylinder(x, y, 2.6, 24, DISC_Z - 24, P, 20), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(x, y, DISC_R, DISC_Z, DISC_H, P, 96, 0.8), { tone: "hi" }));
  out.push(L(k.knurl(x, y, DISC_R, DISC_Z, DISC_TOP, 120, P, 0.22), { tone: "lo" }));
  out.push(L(k.ring(x, y, 26, DISC_TOP, P, 72), { tone: "lo" }));
  out.push(L(k.ring(x, y, 36.6, DISC_TOP, P, 84), { tone: "lo" }));
  const vents = Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * Math.PI * 2 + 0.13;
    return k.lineOnTop([x + Math.cos(angle) * 26.2, y + Math.sin(angle) * 26.2], [x + Math.cos(angle) * 36.3, y + Math.sin(angle) * 36.3], DISC_TOP, P);
  });
  out.push(L(vents.join(""), { tone: "lo" }));
  out.push(S(k.cylinder(x, y, 9, DISC_TOP, 2, P, 32), { tone: "mid" }));
  out.push(L(k.ring(x, y, 6.6, DISC_TOP + 2, P, 40), { tone: "faint" }));
  out.push(D([0, 1, 2, 3, 4].map((i) => at([x + Math.cos(i * Math.PI * 2 / 5 + 0.4) * 6.6, y + Math.sin(i * Math.PI * 2 / 5 + 0.4) * 6.6, DISC_TOP + 2])), { size: 0.42 }));
  out.push(S(k.cylinder(x, y, 4, DISC_TOP + 2, 3, P, 24), { tone: "mid" }));
  out.push(L(k.knurl(x, y, 4, DISC_TOP + 2, DISC_TOP + 5, 22, P), { tone: "lo" }));
  return out.join("");
}

function caliper() {
  const out = [];
  out.push(S(k.slabOf({ x: 96, y: -9, w: 26, d: 18, r: 2 }, 26, 2, P, 3, 0.5), { tone: "mid" }));
  out.push(D([at([100, -6, 26]), at([118, 6, 26])], { size: 0.42 }));
  out.push(S(k.slabOf({ x: 99, y: -8, w: 16, d: 16, r: 2 }, 28, 2, P, 3, 0.4), { tone: "hi", crease: "none" }));
  for (const y of [-7, 1]) {
    out.push(S(k.slabOf({ x: 122, y, w: 6, d: 6, r: 1.5 }, 26, 22, P, 3, 0.5), { tone: "mid" }));
    out.push(S(k.slabOf({ x: 104, y, w: 24, d: 6, r: 1.5 }, 44, 4, P, 3, 0.5), { tone: "mid" }));
  }
  out.push(D([at([123, -4, 48]), at([123, 4, 48])], { size: 0.42 }));
  out.push(S(k.slabOf({ x: 81, y: -13, w: 22, d: 26, r: 2.5 }, 48, 12, P, 5, 0.8), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan({ x: 81, y: -13, w: 22, d: 26, r: 2.5 }, 2.5), 60, P), { tone: "faint" }));
  out.push(D([at([85, -9, 60]), at([99, 9, 60])], { size: 0.45 }));
  out.push(S(k.cylinder(HOUSING[0], HOUSING[1], 6, 60, 6, P, 28), { tone: "hi" }));
  out.push(L(k.knurl(HOUSING[0], HOUSING[1], 6, 60, 66, 30, P), { tone: "lo" }));
  out.push(S(k.cylinder(HOUSING[0], HOUSING[1], 2.5, PAD_REST_Z + 1.5, 48 - PAD_REST_Z - 1.5, P, 16), { tone: "hi", crease: "none" }));
  return out.join("");
}

const REST = 0;
const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A bench hydraulic brake rig. A sliding pedal knob drives a pushrod into a master cylinder; pressure runs through a copper line with a tee to a pressure gauge and into a single-piston caliper, whose pad pinches a ventilated disc on a stand. The disc slows under pressure and spins back up when the pedal is released.",
  body: [
    base(),
    pedalSide(),
    `<g data-part="pedal" transform="${k.translateAlong(P, [0, 0, 0])}">${pedalGroup()}</g>`,
    masterCylinder(),
    gland(),
    plumbing(),
    gauge(),
    `<path data-part="needle" class="iso-line" data-tone="lit" data-free="start" d="${needleAt(0)}" style="stroke-width:1.35"/>`,
    brakeDisc(),
    caliper(),
    `<g data-part="pad" transform="${k.translateAlong(P, [0, 0, 0])}">${S(k.slabOf(PAD, PAD_REST_Z, 1.5, P, 3, 0.4), { tone: "hi", lit: true, crease: "none" })}</g>`,
    `<line data-part="index" class="iso-line" data-tone="mid" data-free="both" x1="0" y1="0" x2="0" y2="0"/>`,
    `<circle data-part="hubdot" r="0.9" fill="var(--anatomy-dot,#e6e6e6)"/>`,
  ].join(""),
});

const live = `
const P = ${JSON.stringify(P)};
const KNOB_TRAVEL = ${KNOB_TRAVEL};
const PAD_TRAVEL = 1.5;
const GAUGE = ${JSON.stringify(GAUGE)};
const GAUGE_R = ${GAUGE_R}, GAUGE_TOP = ${GAUGE_TOP}, BAR_MAX = ${BAR_MAX};
const DISC = ${JSON.stringify(DISC)}, DISC_TOP = ${DISC_TOP};
const IDLE_W = 4.19, DECEL = 3.0;
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const pedal = svg.querySelector('[data-part="pedal"]');
const pad = svg.querySelector('[data-part="pad"]');
const needle = svg.querySelector('[data-part="needle"]');
const index = svg.querySelector('[data-part="index"]');
const hubdot = svg.querySelector('[data-part="hubdot"]');
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const isoPt = (p) => { const az = P.azimuth * Math.PI / 180, c = Math.cos(az), s = Math.sin(az), el = P.elevation * Math.PI / 180, ce = Math.cos(el), se = Math.sin(el); return [P.origin[0] + (p[0] * c - p[1] * s) * P.scale, P.origin[1] + (p[0] * s + p[1] * c) * P.scale * se - p[2] * P.scale * ce]; };
const lineTop = (a, b, z) => { const A = isoPt([a[0], a[1], z]), B = isoPt([b[0], b[1], z]); return "M" + A[0].toFixed(1) + " " + A[1].toFixed(1) + "L" + B[0].toFixed(1) + " " + B[1].toFixed(1); };
const needleAt = (bar) => { const ang = -Math.PI * 0.75 + (clamp(bar, 0, BAR_MAX) / BAR_MAX) * Math.PI * 1.5; const cx = GAUGE[0], cy = GAUGE[1]; return lineTop([cx - Math.cos(ang) * 2.2, cy - Math.sin(ang) * 2.2], [cx + Math.cos(ang) * (GAUGE_R - 3.6), cy + Math.sin(ang) * (GAUGE_R - 3.6)], GAUGE_TOP + 0.2); };
let target = ${REST}, u = 0, omega = IDLE_W, theta = 0;
let frame = 0, last = 0, visible = false, hold = false, idleTimer = 0, touring = !still.matches, tourClock = 0;
const tourAt = (t) => { const c = t % 7; return c < 2.6 ? 0 : c < 4.6 ? 0.85 : 0; };
function draw() {
  const bar = u * 100;
  pedal.setAttribute("transform", translateAlong(P, [u * KNOB_TRAVEL, 0, 0]));
  pad.setAttribute("transform", translateAlong(P, [0, 0, -u * PAD_TRAVEL]));
  needle.setAttribute("d", needleAt(bar));
  const p1 = isoPt([DISC[0] + Math.cos(theta) * 13, DISC[1] + Math.sin(theta) * 13, DISC_TOP + 0.2]);
  const p2 = isoPt([DISC[0] + Math.cos(theta) * 31, DISC[1] + Math.sin(theta) * 31, DISC_TOP + 0.2]);
  index.setAttribute("x1", p1[0].toFixed(1)); index.setAttribute("y1", p1[1].toFixed(1));
  index.setAttribute("x2", p2[0].toFixed(1)); index.setAttribute("y2", p2[1].toFixed(1));
  const pd = isoPt([DISC[0] + Math.cos(theta + 2.1) * 22, DISC[1] + Math.sin(theta + 2.1) * 22, DISC_TOP + 0.2]);
  hubdot.setAttribute("cx", pd[0].toFixed(1)); hubdot.setAttribute("cy", pd[1].toFixed(1));
  const text = "踏板 " + (u * 100).toFixed(0) + " N · 油压 " + bar.toFixed(0) + " bar · 夹紧 " + (u * 1200).toFixed(0) + " N · 转速 " + (omega * 9.549).toFixed(0) + " rpm";
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-valuenow", String(Math.round(u * 100)));
  stage.setAttribute("aria-valuetext", text);
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  if (touring) { tourClock += dt; target = tourAt(tourClock); }
  u = calm ? target : u + (target - u) * (1 - Math.exp(-dt / 0.14));
  if (Math.abs(target - u) < 0.002) u = target;
  omega = omega - (u > 0.02 ? DECEL * u : 0) * dt;
  if (u < 0.1) omega += (IDLE_W - omega) * Math.min(1, dt * 0.9);
  if (omega < 0) omega = 0;
  theta += omega * dt;
  draw();
  const settled = !touring && u === target && Math.abs(omega - IDLE_W) < 0.02;
  frame = visible && !settled ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const steer = (next) => { touring = false; target = clamp(next, 0, 1); clearTimeout(idleTimer); if (!hold) idleTimer = setTimeout(() => { touring = !still.matches; tourClock = 2.6; run(); }, 4200); run(); };
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
if (still.matches) touring = false;
stage.addEventListener("pointermove", (event) => {
  const box = svg.getBoundingClientRect();
  const share = clamp(((event.clientX - box.left) / box.width - 0.16) / 0.66, 0, 1);
  steer(share);
});
stage.addEventListener("pointerleave", () => { if (!hold) steer(target); });
stage.addEventListener("pointerdown", (event) => { hold = true; steer(1); event.preventDefault(); });
window.addEventListener("pointerup", () => { if (hold) { hold = false; steer(0.4); } });
stage.addEventListener("keydown", (event) => {
  let to = null;
  if (event.key === "ArrowRight" || event.key === "ArrowUp" || event.key === " ") to = Math.min(1, target + 0.25);
  if (event.key === "ArrowLeft" || event.key === "ArrowDown") to = Math.max(0, target - 0.25);
  if (event.key === "Home") to = 0;
  if (event.key === "End") to = 1;
  if (to === null) return;
  event.preventDefault();
  steer(to);
});
draw();
`;

const body = k.plateHtml({
  fig: "Fig 1",
  title: "液压制动系统",
  hint: "移动或按住指针踩下踏板 · 空格与方向键可用",
  readout: `踏板 0 N · 油压 0 bar · 夹紧 0 N · 转速 40 rpm`,
  keys: [
    { mark: "lit", label: "踏板推杆、单活塞与摩擦片：踩下时一起前移" },
    { mark: "hi", label: "制动盘与卡钳：摩擦把车的动能变成热" },
  ],
  caption:
    "台式液压制动演示仪。踩下踏板，推杆推动制动总泵，油压经铜管与三通传到压力表和卡钳（帕斯卡原理：密闭油液压强处处相等）。卡钳活塞把摩擦片压向旋转的通风盘——动能变成热，盘转速随油压下降；松开踏板，回位弹簧归位，发动机带盘重新转起来。",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="液压制动系统：左右方向键或空格踩踏板" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">${svg}</div>`,
});

writeFileSync(join(HERE, theme === "light" ? "brake-system-light.html" : "brake-system.html"), k.pageHtml({ title: "液压制动系统", theme, body, script: kitScript() + live }));
console.log("wrote", theme === "light" ? "brake-system-light.html" : "brake-system.html");
