import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const PptxGenJS = require("pptxgenjs");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "docs", "sales-training");
const cards = path.join(root, "public", "brand", "onyx-email-cards.png");
const sihle = path.join(root, "public", "about", "sihle-simelane.png");
const lihle = path.join(root, "public", "about", "lihle-simelane.png");

const INK = "0A0A0A";
const MUTED = "5C5C5C";
const WASH = "F7F7F5";
const WHITE = "FFFFFF";
const GRID = "E8E8E6";
const FAINT = "A3A3A0";

const W = 13.333;
const H = 7.5;

function addGrid(slide, line = GRID) {
  for (let x = 0; x <= W; x += 0.5) {
    slide.addShape("rect", { x, y: 0, w: 0.008, h: H, fill: { color: line } });
  }
  for (let y = 0; y <= H; y += 0.5) {
    slide.addShape("rect", { x: 0, y, w: W, h: 0.008, fill: { color: line } });
  }
}

function wordmark(slide, { dark = false, y = 0.16 } = {}) {
  slide.addText("onyxwebsystems", {
    x: 0.5,
    y,
    w: 3.7,
    h: 0.3,
    fontFace: "Arial",
    fontSize: 13,
    bold: true,
    color: dark ? WHITE : INK,
    charSpacing: 2.4,
    margin: 0,
  });
  if (!dark) {
    slide.addImage({ path: cards, x: 4.15, y: y - 0.04, w: 0.34, h: 0.34 });
  }
}

function footer(slide, n, total, dark = false) {
  slide.addShape("rect", { x: 0, y: 7.18, w: W, h: 0.012, fill: { color: dark ? "2A2A2A" : INK } });
  slide.addText("onyxwebsystems  ·  create. connect. convert.", {
    x: 0.5,
    y: 7.26,
    w: 9.6,
    h: 0.2,
    fontFace: "Arial",
    fontSize: 10,
    color: dark ? FAINT : MUTED,
    charSpacing: 1.4,
    margin: 0,
  });
  slide.addText(String(n).padStart(2, "0"), {
    x: 11.4,
    y: 7.26,
    w: 1.4,
    h: 0.2,
    fontFace: "Arial",
    fontSize: 10,
    color: dark ? FAINT : MUTED,
    align: "right",
    margin: 0,
  });
}

function kicker(slide, text, y = 0.52) {
  slide.addText(text.toUpperCase(), {
    x: 0.55,
    y,
    w: 12.2,
    h: 0.26,
    fontFace: "Arial",
    fontSize: 11,
    color: MUTED,
    bold: true,
    charSpacing: 3.4,
    margin: 0,
  });
}

function heading(slide, text, y = 0.8) {
  const lines = String(text).split("\n").length;
  slide.addText(text, {
    x: 0.55,
    y,
    w: 12.2,
    h: lines > 1 ? 1.15 : 0.62,
    fontFace: "Arial",
    fontSize: 30,
    bold: true,
    color: INK,
    margin: 0,
  });
}

function rule(slide, y = 1.52) {
  slide.addShape("rect", { x: 0.55, y, w: 1.55, h: 0.03, fill: { color: INK } });
}

function whiteSlide(pres) {
  const s = pres.addSlide();
  s.addShape("rect", { x: 0, y: 0, w: W, h: H, fill: { color: WHITE } });
  addGrid(s);
  s.addShape("rect", { x: 0, y: 0, w: W, h: 0.012, fill: { color: INK } });
  wordmark(s);
  s.addText("SALES TRAINING", {
    x: 8.2,
    y: 0.18,
    w: 4.6,
    h: 0.26,
    fontFace: "Arial",
    fontSize: 10,
    color: MUTED,
    align: "right",
    bold: true,
    charSpacing: 2.2,
    margin: 0,
  });
  return s;
}

function darkSlide(pres) {
  const s = pres.addSlide();
  s.addShape("rect", { x: 0, y: 0, w: W, h: H, fill: { color: INK } });
  addGrid(s, "1C1C1C");
  wordmark(s, { dark: true });
  return s;
}

async function buildPptx() {
  const pres = new PptxGenJS();
  pres.defineLayout({ name: "ONYX", width: W, height: H });
  pres.layout = "ONYX";
  pres.author = "Onyx Web Systems";
  pres.title = "Onyx Web Systems — Salesperson Training";
  pres.subject = "Internal sales enablement";
  pres.company = "Onyx Web Systems";

  const slides = [];
  const add = (fn) => slides.push(fn);

  add((n, total) => {
    const s = whiteSlide(pres);
    kicker(s, "Create. Connect. Convert.");
    s.addText("Salesperson\ntraining", {
      x: 0.55,
      y: 1.55,
      w: 12.2,
      h: 2.2,
      fontFace: "Arial",
      fontSize: 52,
      bold: true,
      color: INK,
      margin: 0,
    });
    s.addShape("rect", { x: 0.55, y: 3.95, w: 1.55, h: 0.03, fill: { color: INK } });
    s.addText(
      "Who we are. What we build. How each module works.\nHow we price: 13% of the annual salary for that role, plus a monthly retainer sized to the project.",
      {
        x: 0.55,
        y: 4.2,
        w: 11.4,
        h: 0.9,
        fontFace: "Arial",
        fontSize: 16,
        color: MUTED,
        margin: 0,
      },
    );
    s.addShape("rect", { x: 0, y: 6.45, w: W, h: 1.05, fill: { color: INK } });
    s.addText("onyxwebsystems.co.za     ·     confidential     ·     september 2026", {
      x: 0.55,
      y: 6.78,
      w: 12.2,
      h: 0.35,
      fontFace: "Arial",
      fontSize: 12,
      color: FAINT,
      charSpacing: 1.6,
      margin: 0,
    });
  });

  add((n, total) => {
    const s = whiteSlide(pres);
    kicker(s, "Agenda");
    heading(s, "What you will leave knowing");
    rule(s);
    const items = [
      ["01", "Who we are", "Founders, philosophy, how we think"],
      ["02", "What we sell", "BOS, websites, applications"],
      ["03", "How we price", "13% module fee + monthly retainer"],
      ["04", "The modules", "What is inside each, how it works"],
      ["05", "How you sell", "Discovery, language, checklist"],
    ];
    items.forEach((row, i) => {
      const y = 1.7 + i * 0.95;
      s.addShape("rect", { x: 0.55, y, w: 12.2, h: 0.85, fill: { color: i % 2 ? WASH : WHITE }, line: { color: INK, width: 1 } });
      s.addText(row[0], { x: 0.75, y: y + 0.18, w: 0.8, h: 0.5, fontFace: "Arial", fontSize: 18, bold: true, color: INK, margin: 0 });
      s.addText(row[1], { x: 1.7, y: y + 0.12, w: 4.5, h: 0.32, fontFace: "Arial", fontSize: 18, bold: true, color: INK, margin: 0 });
      s.addText(row[2], { x: 1.7, y: y + 0.44, w: 10.5, h: 0.28, fontFace: "Arial", fontSize: 13, color: MUTED, margin: 0 });
    });
    footer(s, n, total);
  });

  add((n, total) => {
    const s = whiteSlide(pres);
    kicker(s, "01  ·  Company");
    heading(s, "We’re building the systems\nbehind modern businesses.");
    s.addShape("rect", { x: 0.55, y: 2.35, w: 1.6, h: 0.035, fill: { color: INK } });
    s.addText(
      "Onyx Web Systems is a technology partner. We build Business Operating Systems, custom applications, and premium web experiences.\n\nBusinesses don’t need more tools. They need better systems.",
      { x: 0.55, y: 2.6, w: 12.1, h: 1.7, fontFace: "Arial", fontSize: 18, color: INK, margin: 0 },
    );
    const facts = [
      ["Founded", "16 November 2025"],
      ["Tagline", "CREATE. CONNECT. CONVERT."],
      ["Hours", "Mon–Fri 09:00–17:00 SAST"],
      ["Email", "onyxwebsystems@gmail.com"],
    ];
    facts.forEach((f, i) => {
      const x = 0.55 + (i % 4) * 3.15;
      s.addShape("rect", { x, y: 4.55, w: 3.0, h: 1.45, line: { color: INK, width: 1 } });
      s.addText(f[0].toUpperCase(), { x: x + 0.18, y: 4.7, w: 2.65, h: 0.28, fontFace: "Arial", fontSize: 10, color: MUTED, bold: true, charSpacing: 1.5, margin: 0 });
      s.addText(f[1], { x: x + 0.18, y: 5.05, w: 2.65, h: 0.7, fontFace: "Arial", fontSize: 14, bold: true, color: INK, margin: 0 });
    });
    footer(s, n, total);
  });

  add((n, total) => {
    const s = whiteSlide(pres);
    kicker(s, "01  ·  Company");
    heading(s, "Two brothers. One vision.");
    rule(s);
    s.addImage({ path: sihle, x: 0.55, y: 1.7, w: 2.55, h: 3.2 });
    s.addImage({ path: lihle, x: 3.3, y: 1.7, w: 2.55, h: 3.2 });
    s.addText("Sihle Nathi Simelane", { x: 0.55, y: 4.98, w: 2.55, h: 0.28, fontFace: "Arial", fontSize: 12, bold: true, color: INK, margin: 0 });
    s.addText("Founder  ·  builds the technology", { x: 0.55, y: 5.24, w: 2.55, h: 0.4, fontFace: "Arial", fontSize: 11, color: MUTED, margin: 0 });
    s.addText("Lihle Simelane", { x: 3.3, y: 4.98, w: 2.55, h: 0.28, fontFace: "Arial", fontSize: 12, bold: true, color: INK, margin: 0 });
    s.addText("Growth & Partnerships", { x: 3.3, y: 5.24, w: 2.55, h: 0.4, fontFace: "Arial", fontSize: 11, color: MUTED, margin: 0 });
    s.addText(
      "Sihle founded Onyx while studying Computer Science at Emeris. The company started with websites, then expanded into systems that connect operations, automate repetitive work, and help businesses grow.\n\nLihle joined to grow the business — relationships, client needs, partnerships.\n\n“Don’t just build what a business needs today. Build what it needs to become tomorrow.”",
      { x: 6.2, y: 1.7, w: 6.5, h: 4.9, fontFace: "Arial", fontSize: 15, color: INK, margin: 0 },
    );
    footer(s, n, total);
  });

  add((n, total) => {
    const s = whiteSlide(pres);
    kicker(s, "01  ·  Philosophy");
    heading(s, "CREATE. CONNECT. CONVERT.");
    rule(s);
    const cols = [
      ["CREATE.", "We build digital experiences, applications, and systems that solve real business problems."],
      ["CONNECT.", "We connect people, processes, data, and technology so the different parts of a business can work together."],
      ["CONVERT.", "We turn complexity into efficiency, opportunities into customers, and systems into growth."],
    ];
    cols.forEach((c, i) => {
      const x = 0.55 + i * 4.15;
      s.addShape("rect", { x, y: 1.75, w: 3.95, h: 3.5, fill: { color: i === 1 ? INK : WHITE }, line: { color: INK, width: 1 } });
      s.addText(c[0], { x: x + 0.28, y: 2.05, w: 3.4, h: 0.5, fontFace: "Arial", fontSize: 20, bold: true, color: i === 1 ? WHITE : INK, margin: 0 });
      s.addText(c[1], { x: x + 0.28, y: 2.7, w: 3.4, h: 2.1, fontFace: "Arial", fontSize: 15, color: i === 1 ? "D4D4D0" : MUTED, margin: 0 });
    });
    s.addText("The Onyx standard: Simple  ·  Intelligent  ·  Connected  ·  Scalable  ·  Human", {
      x: 0.55,
      y: 5.5,
      w: 12.2,
      h: 0.4,
      fontFace: "Arial",
      fontSize: 14,
      color: INK,
      margin: 0,
    });
    s.addText("Automation should empower people, not remove judgment where it matters.", {
      x: 0.55,
      y: 5.9,
      w: 12.2,
      h: 0.35,
      fontFace: "Arial",
      fontSize: 14,
      color: MUTED,
      margin: 0,
    });
    footer(s, n, total);
  });

  add((n, total) => {
    const s = whiteSlide(pres);
    kicker(s, "01  ·  How we think");
    heading(s, "We don’t start with technology.");
    rule(s);
    s.addText("We start with the business. If you cannot answer these, you are not ready to quote.", {
      x: 0.55,
      y: 1.6,
      w: 12.2,
      h: 0.4,
      fontFace: "Arial",
      fontSize: 16,
      color: MUTED,
      margin: 0,
    });
    const qs = [
      "How do leads enter?",
      "How are customers managed?",
      "Where is time being wasted?",
      "What tasks are repetitive?",
      "Where are teams losing information?",
      "What systems are disconnected?",
      "What could be automated?",
      "What could be improved?",
    ];
    qs.forEach((q, i) => {
      const x = 0.55 + (i % 2) * 6.35;
      const y = 2.2 + Math.floor(i / 2) * 1.05;
      s.addShape("rect", { x, y, w: 6.15, h: 0.9, line: { color: INK, width: 1 } });
      s.addText(q, { x: x + 0.25, y: y + 0.25, w: 5.65, h: 0.4, fontFace: "Arial", fontSize: 16, color: INK, margin: 0 });
    });
    footer(s, n, total);
  });

  add((n, total) => {
    const s = whiteSlide(pres);
    kicker(s, "02  ·  What we sell");
    heading(s, "Three ways we work with you");
    rule(s);
    const lanes = [
      ["01", "Business Operating Systems", "Connected modules that run sales, customers, finance, people, operations, and reporting as one system."],
      ["02", "Websites", "Premium sites that carry a brand and convert. Proof: Thrift Rotate and about.secnightlife.com."],
      ["03", "Applications", "Custom web and mobile software around how they actually operate. Proof: SEC Nightlife."],
    ];
    lanes.forEach((l, i) => {
      const y = 1.7 + i * 1.6;
      s.addShape("rect", { x: 0.55, y, w: 12.2, h: 1.45, line: { color: INK, width: 1 } });
      s.addText(l[0], { x: 0.8, y: y + 0.35, w: 1.1, h: 0.7, fontFace: "Arial", fontSize: 22, bold: true, color: INK, margin: 0 });
      s.addText(l[1], { x: 2.1, y: y + 0.22, w: 10.2, h: 0.4, fontFace: "Arial", fontSize: 20, bold: true, color: INK, margin: 0 });
      s.addText(l[2], { x: 2.1, y: y + 0.7, w: 10.2, h: 0.5, fontFace: "Arial", fontSize: 14, color: MUTED, margin: 0 });
    });
    footer(s, n, total);
  });

  add((n, total) => {
    const s = whiteSlide(pres);
    kicker(s, "02  ·  What we sell");
    heading(s, "Your job is not “sell a website.”");
    rule(s);
    s.addText("Find where people, time, and money are leaking. Sell the system that replaces that leak.", {
      x: 0.55,
      y: 1.65,
      w: 12.2,
      h: 0.55,
      fontFace: "Arial",
      fontSize: 18,
      color: MUTED,
      margin: 0,
    });
    const steps = [
      ["01", "Discovery", "Understand the business"],
      ["02", "Strategy", "Identify opportunities"],
      ["03", "Architecture", "Map workflows and tech"],
      ["04", "Design", "Design the experience"],
      ["05", "Development", "Build the system"],
      ["06", "Testing", "Test real workflows"],
      ["07", "Launch", "Deploy"],
      ["08", "Optimization", "Keep improving"],
    ];
    steps.forEach((st, i) => {
      const x = 0.55 + (i % 4) * 3.15;
      const y = 2.45 + Math.floor(i / 4) * 2.05;
      s.addShape("rect", { x, y, w: 3.0, h: 1.85, fill: { color: i === 0 ? INK : WHITE }, line: { color: INK, width: 1 } });
      s.addText(st[0], { x: x + 0.18, y: y + 0.2, w: 2.6, h: 0.3, fontFace: "Arial", fontSize: 12, color: i === 0 ? "A3A3A0" : MUTED, bold: true, margin: 0 });
      s.addText(st[1], { x: x + 0.18, y: y + 0.55, w: 2.6, h: 0.45, fontFace: "Arial", fontSize: 16, bold: true, color: i === 0 ? WHITE : INK, margin: 0 });
      s.addText(st[2], { x: x + 0.18, y: y + 1.1, w: 2.6, h: 0.45, fontFace: "Arial", fontSize: 13, color: i === 0 ? "D4D4D0" : MUTED, margin: 0 });
    });
    footer(s, n, total);
  });

  add((n, total) => {
    const s = darkSlide(pres);
    s.addText("03  ·  PRICING", {
      x: 0.55,
      y: 2.15,
      w: 12,
      h: 0.32,
      fontFace: "Arial",
      fontSize: 13,
      color: FAINT,
      bold: true,
      charSpacing: 3.2,
      margin: 0,
    });
    s.addText("Two numbers.\nNever one.", {
      x: 0.55,
      y: 2.55,
      w: 12,
      h: 1.9,
      fontFace: "Arial",
      fontSize: 48,
      bold: true,
      color: WHITE,
      margin: 0,
    });
    s.addText("A 13% module fee. Then a monthly retainer sized to the project.", {
      x: 0.55,
      y: 4.7,
      w: 12,
      h: 0.45,
      fontFace: "Arial",
      fontSize: 18,
      color: "D4D4D0",
      margin: 0,
    });
    footer(s, n, total, true);
  });

  add((n, total) => {
    const s = whiteSlide(pres);
    kicker(s, "03  ·  Pricing");
    heading(s, "Every BOS deal has two layers");
    rule(s);
    s.addShape("rect", { x: 0.55, y: 1.75, w: 6.0, h: 4.5, fill: { color: INK } });
    s.addText("LAYER 1", { x: 0.85, y: 2.05, w: 5.4, h: 0.3, fontFace: "Arial", fontSize: 12, color: "A3A3A0", bold: true, charSpacing: 2, margin: 0 });
    s.addText("Module fee\n13%", { x: 0.85, y: 2.45, w: 5.4, h: 1.4, fontFace: "Arial", fontSize: 36, bold: true, color: WHITE, margin: 0 });
    s.addText("Price to put that function into the operating system.\n\n13% of what that role would cost as an employee for one year.", {
      x: 0.85,
      y: 4.05,
      w: 5.4,
      h: 1.8,
      fontFace: "Arial",
      fontSize: 15,
      color: "D4D4D0",
      margin: 0,
    });
    s.addShape("rect", { x: 6.75, y: 1.75, w: 6.0, h: 4.5, line: { color: INK, width: 1.5 } });
    s.addText("LAYER 2", { x: 7.05, y: 2.05, w: 5.4, h: 0.3, fontFace: "Arial", fontSize: 12, color: MUTED, bold: true, charSpacing: 2, margin: 0 });
    s.addText("Monthly\nretainer", { x: 7.05, y: 2.45, w: 5.4, h: 1.4, fontFace: "Arial", fontSize: 36, bold: true, color: INK, margin: 0 });
    s.addText("Ongoing run, improve, support, keep it alive.\n\nCalculated from how big the project is — not a flat fee, and not 13% again.", {
      x: 7.05,
      y: 4.05,
      w: 5.4,
      h: 1.8,
      fontFace: "Arial",
      fontSize: 15,
      color: MUTED,
      margin: 0,
    });
    footer(s, n, total);
  });

  add((n, total) => {
    const s = whiteSlide(pres);
    kicker(s, "03  ·  The 13% fee");
    heading(s, "Price the module against the human.");
    rule(s);
    const steps = [
      "1. Name the job the module is doing.",
      "2. Get the annual salary for that seat.",
      "3. Charge 13% of that annual amount.",
    ];
    steps.forEach((t, i) => {
      s.addText(t, { x: 0.55, y: 1.7 + i * 0.45, w: 12.2, h: 0.4, fontFace: "Arial", fontSize: 18, color: INK, margin: 0 });
    });
    s.addShape("rect", { x: 0.55, y: 3.2, w: 12.2, h: 1.15, fill: { color: WASH }, line: { color: INK, width: 1 } });
    s.addText("Charge  =  annual salary of that role  ×  0.13", {
      x: 0.8,
      y: 3.5,
      w: 11.7,
      h: 0.55,
      fontFace: "Arial",
      fontSize: 24,
      bold: true,
      color: INK,
      margin: 0,
    });
    s.addShape("rect", { x: 0.55, y: 4.55, w: 6.0, h: 1.7, line: { color: INK, width: 1 } });
    s.addText("SALES MODULE", { x: 0.8, y: 4.7, w: 5.5, h: 0.28, fontFace: "Arial", fontSize: 11, color: MUTED, bold: true, charSpacing: 1.5, margin: 0 });
    s.addText("R240,000 × 0.13  =  R31,200", { x: 0.8, y: 5.1, w: 5.5, h: 0.8, fontFace: "Arial", fontSize: 20, bold: true, color: INK, margin: 0 });
    s.addShape("rect", { x: 6.75, y: 4.55, w: 6.0, h: 1.7, line: { color: INK, width: 1 } });
    s.addText("FINANCE MODULE", { x: 7.0, y: 4.7, w: 5.5, h: 0.28, fontFace: "Arial", fontSize: 11, color: MUTED, bold: true, charSpacing: 1.5, margin: 0 });
    s.addText("R180,000 × 0.13  =  R23,400", { x: 7.0, y: 5.1, w: 5.5, h: 0.8, fontFace: "Arial", fontSize: 20, bold: true, color: INK, margin: 0 });
    footer(s, n, total);
  });

  add((n, total) => {
    const s = whiteSlide(pres);
    kicker(s, "03  ·  The 13% fee");
    heading(s, "How to say it");
    rule(s);
    s.addShape("rect", { x: 0.55, y: 1.75, w: 12.2, h: 2.6, fill: { color: INK } });
    s.addText(
      "“Instead of hiring another person to run this all year, we put that function in the system. The module fee is 13% of what that seat would cost you annually. Then there is a monthly retainer to keep it running, sized to the size of the build.”",
      { x: 0.9, y: 2.1, w: 11.5, h: 2.0, fontFace: "Arial", fontSize: 20, color: WHITE, margin: 0 },
    );
    const notes = [
      ["Several modules", "Calculate 13% per module, then add. A full OS is a stack, not a mystery lump sum."],
      ["Public line", "Custom Solutions. Custom Pricing. Do not publish 13% on the website, ads, or social."],
    ];
    notes.forEach((note, i) => {
      const x = 0.55 + i * 6.2;
      s.addShape("rect", { x, y: 4.55, w: 6.0, h: 1.7, line: { color: INK, width: 1 } });
      s.addText(note[0].toUpperCase(), { x: x + 0.25, y: 4.7, w: 5.5, h: 0.3, fontFace: "Arial", fontSize: 11, color: MUTED, bold: true, charSpacing: 1.2, margin: 0 });
      s.addText(note[1], { x: x + 0.25, y: 5.1, w: 5.5, h: 0.9, fontFace: "Arial", fontSize: 14, color: INK, margin: 0 });
    });
    footer(s, n, total);
  });

  add((n, total) => {
    const s = whiteSlide(pres);
    kicker(s, "03  ·  Monthly retainer");
    heading(s, "Sized to how big the project is");
    rule(s);
    s.addText("The retainer is not 13% again. It is not the same for every client. Score size first — then the monthly follows.", {
      x: 0.55,
      y: 1.6,
      w: 12.2,
      h: 0.45,
      fontFace: "Arial",
      fontSize: 15,
      color: MUTED,
      margin: 0,
    });
    s.addTable(
      [
        [
          { text: "Signal", options: { fill: { color: INK }, color: WHITE, bold: true } },
          { text: "Smaller", options: { fill: { color: INK }, color: WHITE, bold: true } },
          { text: "Bigger", options: { fill: { color: INK }, color: WHITE, bold: true } },
        ],
        ["Modules", "One module", "Several connected modules"],
        ["Team", "1–10 people", "11–50 / 51–200 / 200+"],
        ["Channels", "One form", "Phone, WhatsApp, IG, Facebook, email"],
        ["Workflows", "One simple path", "Approvals, payments, multi-location"],
        ["Custom", "Standard module", "Custom agents and specialised systems"],
      ],
      {
        x: 0.55,
        y: 2.15,
        w: 12.2,
        h: 3.6,
        colW: [2.4, 4.5, 5.3],
        border: [{ pt: 0.75, color: INK }],
        fontFace: "Arial",
        fontSize: 13,
        color: INK,
        align: "left",
        valign: "middle",
      },
    );
    footer(s, n, total);
  });

  add((n, total) => {
    const s = whiteSlide(pres);
    kicker(s, "03  ·  Monthly retainer");
    heading(s, "What the retainer pays for");
    rule(s);
    const pays = [
      "Keeping the system live",
      "Improving workflows as the business changes",
      "Support when staff get stuck",
      "Channel monitoring (WhatsApp, web, Instagram…)",
      "Knowledge updates and small scope that is not a new module",
      "Reporting the client actually uses",
    ];
    pays.forEach((p, i) => {
      const y = 1.65 + i * 0.7;
      s.addShape("rect", { x: 0.55, y, w: 0.12, h: 0.55, fill: { color: INK } });
      s.addText(p, { x: 0.9, y, w: 11.7, h: 0.55, fontFace: "Arial", fontSize: 18, color: INK, valign: "middle", margin: 0 });
    });
    footer(s, n, total);
  });

  add((n, total) => {
    const s = whiteSlide(pres);
    kicker(s, "03  ·  Monthly retainer");
    heading(s, "Size bands — then confirm the number");
    rule(s);
    const bands = [
      ["Small", "One module · small team · one channel", "Lower monthly"],
      ["Mid", "Two or three modules · 11–50 staff · WhatsApp + web", "Mid monthly"],
      ["Large", "Full OS · many locations · many channels · custom", "Highest monthly"],
    ];
    bands.forEach((b, i) => {
      const x = 0.55 + i * 4.15;
      s.addShape("rect", { x, y: 1.75, w: 3.95, h: 3.35, fill: { color: i === 1 ? INK : WHITE }, line: { color: INK, width: 1.5 } });
      s.addText(b[0].toUpperCase(), { x: x + 0.25, y: 2.05, w: 3.45, h: 0.35, fontFace: "Arial", fontSize: 12, color: i === 1 ? "A3A3A0" : MUTED, bold: true, charSpacing: 2, margin: 0 });
      s.addText(b[1], { x: x + 0.25, y: 2.55, w: 3.45, h: 1.4, fontFace: "Arial", fontSize: 16, color: i === 1 ? WHITE : INK, margin: 0 });
      s.addText(b[2], { x: x + 0.25, y: 4.2, w: 3.45, h: 0.5, fontFace: "Arial", fontSize: 16, bold: true, color: i === 1 ? WHITE : INK, margin: 0 });
    });
    s.addText("Until leadership gives exact retainer bands, size the project correctly. Do not invent a rand amount on the call.", {
      x: 0.55,
      y: 5.35,
      w: 12.2,
      h: 0.7,
      fontFace: "Arial",
      fontSize: 15,
      color: MUTED,
      margin: 0,
    });
    footer(s, n, total);
  });

  add((n, total) => {
    const s = whiteSlide(pres);
    kicker(s, "03  ·  Pricing");
    heading(s, "Websites and apps are different");
    rule(s);
    s.addShape("rect", { x: 0.55, y: 1.75, w: 6.0, h: 4.4, fill: { color: INK } });
    s.addText("BOS MODULES", { x: 0.85, y: 2.05, w: 5.4, h: 0.3, fontFace: "Arial", fontSize: 12, color: "A3A3A0", bold: true, charSpacing: 2, margin: 0 });
    s.addText("13% + retainer", { x: 0.85, y: 2.5, w: 5.4, h: 0.7, fontFace: "Arial", fontSize: 28, bold: true, color: WHITE, margin: 0 });
    s.addText("Use the employee-salary method. One 13% per module. Retainer from project size.", {
      x: 0.85,
      y: 3.4,
      w: 5.4,
      h: 2.2,
      fontFace: "Arial",
      fontSize: 16,
      color: "D4D4D0",
      margin: 0,
    });
    s.addShape("rect", { x: 6.75, y: 1.75, w: 6.0, h: 4.4, line: { color: INK, width: 1.5 } });
    s.addText("WEB  ·  APP", { x: 7.05, y: 2.05, w: 5.4, h: 0.3, fontFace: "Arial", fontSize: 12, color: MUTED, bold: true, charSpacing: 2, margin: 0 });
    s.addText("Scope, then quote", { x: 7.05, y: 2.5, w: 5.4, h: 0.7, fontFace: "Arial", fontSize: 28, bold: true, color: INK, margin: 0 });
    s.addText("Do not apply 13% of a designer’s salary to a brochure site unless leadership says so. Budget ranges on the site are signals, not published fees.", {
      x: 7.05,
      y: 3.4,
      w: 5.4,
      h: 2.2,
      fontFace: "Arial",
      fontSize: 16,
      color: MUTED,
      margin: 0,
    });
    footer(s, n, total);
  });

  add((n, total) => {
    const s = whiteSlide(pres);
    kicker(s, "03  ·  Guardrails");
    heading(s, "Never do this");
    rule(s);
    const never = [
      "Quote 13% and forget the retainer — or a retainer with no module fee",
      "Use the same monthly for a one-module shop and a full operating system",
      "Publish 13% or retainers on the website, ads, or social captions",
      "Invent discounts, timelines, features, or website/app prices",
      "Let the front desk or AI invent numbers",
      "Quote before you know the job the module replaces",
    ];
    never.forEach((t, i) => {
      const y = 1.65 + i * 0.8;
      s.addShape("rect", { x: 0.55, y, w: 12.2, h: 0.7, fill: { color: i % 2 ? WASH : WHITE }, line: { color: INK, width: 1 } });
      s.addText(t, { x: 0.8, y, w: 11.7, h: 0.7, fontFace: "Arial", fontSize: 16, color: INK, valign: "middle", margin: 0 });
    });
    footer(s, n, total);
  });

  add((n, total) => {
    const s = darkSlide(pres);
    s.addText("04  ·  MODULES", {
      x: 0.55,
      y: 2.15,
      w: 12,
      h: 0.32,
      fontFace: "Arial",
      fontSize: 13,
      color: FAINT,
      bold: true,
      charSpacing: 3.2,
      margin: 0,
    });
    s.addText("One business.\nOne connected system.", {
      x: 0.55,
      y: 2.55,
      w: 12,
      h: 1.9,
      fontFace: "Arial",
      fontSize: 44,
      bold: true,
      color: WHITE,
      margin: 0,
    });
    s.addText("Always name the job it replaces, what is inside, and how work flows.", {
      x: 0.55,
      y: 4.7,
      w: 12,
      h: 0.45,
      fontFace: "Arial",
      fontSize: 18,
      color: "D4D4D0",
      margin: 0,
    });
    footer(s, n, total, true);
  });

  add((n, total) => {
    const s = whiteSlide(pres);
    kicker(s, "04  ·  Onyx OS");
    heading(s, "Seven modules");
    rule(s);
    const mods = [
      ["01", "Sales", "Capture, qualify, CRM, follow-ups, appointments, pipeline"],
      ["02", "Customer Experience", "Communication, support, onboarding, feedback, workflows"],
      ["03", "Finance", "Invoices, payments, approvals, financial workflows"],
      ["04", "HR", "Recruitment, onboarding, employee workflows, documents"],
      ["05", "Office Operations", "Tasks, scheduling, documents, internal admin"],
      ["06", "Reporting", "Dashboards, KPIs, reports, performance"],
      ["07", "Custom", "Custom workflows, AI agents, integrations"],
    ];
    mods.forEach((m, i) => {
      const col = i < 4 ? 0 : 1;
      const row = i < 4 ? i : i - 4;
      const x = 0.55 + col * 6.35;
      const y = 1.65 + row * 1.2;
      s.addShape("rect", { x, y, w: 6.15, h: 1.08, line: { color: INK, width: 1 } });
      s.addText(m[0], { x: x + 0.2, y: y + 0.18, w: 0.7, h: 0.7, fontFace: "Arial", fontSize: 16, bold: true, color: INK, margin: 0 });
      s.addText(m[1], { x: x + 1.0, y: y + 0.14, w: 4.9, h: 0.35, fontFace: "Arial", fontSize: 16, bold: true, color: INK, margin: 0 });
      s.addText(m[2], { x: x + 1.0, y: y + 0.52, w: 4.9, h: 0.4, fontFace: "Arial", fontSize: 12, color: MUTED, margin: 0 });
    });
    footer(s, n, total);
  });

  function moduleSlide(num, title, line, job, items, ask) {
    add((n, total) => {
      const s = whiteSlide(pres);
      kicker(s, `04  ·  Module ${num}`);
      heading(s, title);
      rule(s);
      s.addText(line, { x: 0.55, y: 1.55, w: 12.2, h: 0.35, fontFace: "Arial", fontSize: 16, italic: true, color: MUTED, margin: 0 });
      s.addShape("rect", { x: 0.55, y: 2.05, w: 12.2, h: 0.7, fill: { color: WASH }, line: { color: INK, width: 1 } });
      s.addText(`13% job:  ${job}`, { x: 0.75, y: 2.18, w: 11.8, h: 0.45, fontFace: "Arial", fontSize: 15, color: INK, margin: 0 });
      items.forEach((item, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = 0.55 + col * 6.35;
        const y = 2.95 + row * 0.95;
        s.addShape("rect", { x, y, w: 6.15, h: 0.85, line: { color: INK, width: 1 } });
        s.addText(item[0], { x: x + 0.22, y: y + 0.08, w: 5.7, h: 0.28, fontFace: "Arial", fontSize: 14, bold: true, color: INK, margin: 0 });
        s.addText(item[1], { x: x + 0.22, y: y + 0.38, w: 5.7, h: 0.38, fontFace: "Arial", fontSize: 12, color: MUTED, margin: 0 });
      });
      s.addText(`Ask:  ${ask}`, { x: 0.55, y: 6.65, w: 12.2, h: 0.35, fontFace: "Arial", fontSize: 13, color: INK, margin: 0 });
      footer(s, n, total);
    });
  }

  moduleSlide(
    "01",
    "Sales",
    "Turn more opportunities into revenue.",
    "salesperson, sales admin, or junior closer",
    [
      ["Lead capture", "Web, WhatsApp, Instagram, Facebook, forms — one place"],
      ["Qualification", "Need, budget signal, timeline, team size"],
      ["CRM", "Identity, history, notes, stage"],
      ["Follow-ups", "Automatic and human so leads do not go cold"],
      ["Appointments", "Book the meeting from the same thread"],
      ["Pipeline", "First contact to closed — what is moving, what is stuck"],
    ],
    "Who follows up leads today, and what would that person cost for the year?",
  );

  add((n, total) => {
    const s = whiteSlide(pres);
    kicker(s, "04  ·  Module 01  ·  Sales");
    heading(s, "How Sales works");
    rule(s);
    const flow = ["Capture", "Qualify", "Follow up", "Book", "Convert", "Report"];
    flow.forEach((step, i) => {
      const x = 0.55 + i * 2.12;
      s.addShape("oval", { x: x + 0.7, y: 2.15, w: 0.28, h: 0.28, fill: { color: WHITE }, line: { color: INK, width: 1.5 } });
      if (i < flow.length - 1) {
        s.addShape("rect", { x: x + 1.05, y: 2.26, w: 1.7, h: 0.04, fill: { color: INK } });
      }
      s.addText(String(i + 1).padStart(2, "0"), { x, y: 2.6, w: 2.0, h: 0.3, fontFace: "Arial", fontSize: 12, color: MUTED, align: "center", margin: 0 });
      s.addText(step.toUpperCase(), { x, y: 2.95, w: 2.0, h: 0.7, fontFace: "Arial", fontSize: 14, bold: true, color: INK, align: "center", margin: 0 });
    });
    s.addShape("rect", { x: 0.55, y: 4.0, w: 12.2, h: 2.2, fill: { color: WASH }, line: { color: INK, width: 1 } });
    s.addText(
      "If they tick Lead Management & Speed-to-Lead, Follow-Ups, or Sales & CRM on the booking form — that is this module.\n\nSpeed-to-lead is the promise: the business answers fast, in one system, not three hours later on someone’s WhatsApp.",
      { x: 0.85, y: 4.25, w: 11.6, h: 1.75, fontFace: "Arial", fontSize: 16, color: INK, margin: 0 },
    );
    footer(s, n, total);
  });

  moduleSlide(
    "02",
    "Customer Experience",
    "The digital front desk — how the business talks to people.",
    "receptionist, front-desk admin, or all-day customer-service seat",
    [
      ["Communication", "One inbox: web, WhatsApp, SMS, voice, Instagram, Facebook"],
      ["Support", "Approved knowledge; misses become tickets + human"],
      ["Onboarding", "Identify, create the record, next step"],
      ["Feedback", "What customers said — not what staff remember"],
      ["Workflows", "Greet, hours, book, reschedule, remind, escalate"],
      ["After hours", "Still captures the lead and books the next slot"],
    ],
    "Who answers customers all day, on which channels, and what does that seat cost per year?",
  );

  add((n, total) => {
    const s = whiteSlide(pres);
    kicker(s, "04  ·  Module 02  ·  Customer Experience");
    heading(s, "This is the live Onyx product");
    rule(s);
    s.addText("When you demo CX, you are showing Conversations, Calendar, Customers, Appointments, Tickets, Knowledge, and Live Activity.", {
      x: 0.55,
      y: 1.6,
      w: 12.2,
      h: 0.7,
      fontFace: "Arial",
      fontSize: 16,
      color: MUTED,
      margin: 0,
    });
    const steps = [
      ["1", "Customer messages or calls"],
      ["2", "System identifies them — or creates them"],
      ["3", "Answers from knowledge, books, or captures the request"],
      ["4", "Angry / legal / billing / safety / “a person” → handoff"],
      ["5", "Staff see the same thread. They do not start from zero."],
    ];
    steps.forEach((st, i) => {
      const y = 2.4 + i * 0.8;
      s.addShape("rect", { x: 0.55, y, w: 0.7, h: 0.65, fill: { color: INK } });
      s.addText(st[0], { x: 0.55, y, w: 0.7, h: 0.65, fontFace: "Arial", fontSize: 18, bold: true, color: WHITE, align: "center", valign: "middle", margin: 0 });
      s.addText(st[1], { x: 1.5, y, w: 11.2, h: 0.65, fontFace: "Arial", fontSize: 18, color: INK, valign: "middle", margin: 0 });
    });
    footer(s, n, total);
  });

  moduleSlide(
    "03",
    "Finance",
    "Money in, money out, approvals, and a clean trail.",
    "bookkeeper, finance admin, or the owner invoicing at midnight",
    [
      ["Invoices", "Create, send, paid vs overdue"],
      ["Payments", "Tied to the customer and the job"],
      ["Approvals", "Spend, discount, refund, payout — a path"],
      ["Workflows", "Quote → invoice → payment → receipt → reminder"],
      ["Reporting", "In, outstanding, stuck in approval"],
      ["Connection", "Uses the same customer record as Sales / CX"],
    ],
    "Who chases invoices and payments today? What would that person cost for a year?",
  );

  moduleSlide(
    "04",
    "HR",
    "People in, people through, documents and internal processes.",
    "HR admin, office manager, or whoever onboards staff on WhatsApp",
    [
      ["Recruitment", "Applications, screening, interviews, status"],
      ["Onboarding", "Documents, access, how the company works"],
      ["Employee workflows", "Leave, role changes, repeat HR tasks"],
      ["Documents", "Contracts, IDs, policies on the person"],
      ["Internal processes", "This company’s rules — not generic HR"],
      ["Flow", "Apply → stages → hire → onboarding → employee record"],
    ],
    "Who runs hiring and staff paperwork, and what is that annual salary?",
  );

  moduleSlide(
    "05",
    "Office Operations",
    "The running of the office — work that lives in the owner’s head.",
    "office admin, operations coordinator, or PA",
    [
      ["Tasks", "Assigned, tracked, closed — not a forgetful group chat"],
      ["Scheduling", "Internal who / where / due (customer bookings sit in CX)"],
      ["Documents", "SOPs and files the office needs every day"],
      ["Internal workflows", "When X happens, do Y"],
      ["Admin processes", "Repetitive work that still eats a salary"],
      ["Form labels", "Operations, Internal Comms, Document / Data Processing"],
    ],
    "If you hired an office admin for a year, what would you pay them?",
  );

  moduleSlide(
    "06",
    "Reporting & Analytics",
    "See the business. Don’t guess.",
    "analyst, ops spreadsheet owner, or Sunday CSV exports",
    [
      ["Dashboards", "Live view of whatever modules they bought"],
      ["KPIs", "Speed-to-lead, show-up, conversion, outstanding"],
      ["Reports", "Weekly / monthly packs leadership can use"],
      ["Performance", "Channels, staff, modules that are working"],
      ["Intelligence", "Where leads die and time is wasted"],
      ["Rule", "Do not sell a dashboard of nothing — it reads other modules"],
    ],
    "Who builds the reports today? What would that seat cost per year?",
  );

  moduleSlide(
    "07",
    "Custom",
    "The thing their industry needs that a standard module does not cover.",
    "specialist seat or the contractor they keep hiring",
    [
      ["Custom workflows", "Their process — nightlife, HVAC, drop commerce"],
      ["AI agents", "Front desk, qualifier, follow-up — scoped, not a buzzword"],
      ["Integrations", "Official APIs only — WhatsApp, Meta, calendar, payments"],
      ["Specialized systems", "A module named for them"],
      ["Retainer", "Almost always bigger — unique and still changing"],
      ["Form labels", "Custom Agents / Workflows, Custom module, often Marketing"],
    ],
    "Show me the workflow no off-the-shelf tool has got right. Who runs it today?",
  );

  add((n, total) => {
    const s = whiteSlide(pres);
    kicker(s, "04  ·  How they connect");
    heading(s, "Sell the system, not a shopping list");
    rule(s);
    const boxes = [
      ["CX", "Catches the person"],
      ["Sales", "Moves the pipeline"],
      ["Finance", "Takes the money"],
      ["Ops + HR", "Runs the company"],
      ["Reporting", "Shows if it works"],
      ["Custom", "Their industry engine"],
    ];
    boxes.forEach((b, i) => {
      const x = 0.55 + (i % 3) * 4.15;
      const y = 1.75 + Math.floor(i / 3) * 2.15;
      s.addShape("rect", { x, y, w: 3.95, h: 1.95, fill: { color: i === 0 ? INK : WHITE }, line: { color: INK, width: 1.5 } });
      s.addText(b[0], { x: x + 0.25, y: y + 0.35, w: 3.45, h: 0.5, fontFace: "Arial", fontSize: 22, bold: true, color: i === 0 ? WHITE : INK, margin: 0 });
      s.addText(b[1], { x: x + 0.25, y: y + 1.0, w: 3.45, h: 0.5, fontFace: "Arial", fontSize: 14, color: i === 0 ? "D4D4D0" : MUTED, margin: 0 });
    });
    footer(s, n, total);
  });

  add((n, total) => {
    const s = whiteSlide(pres);
    kicker(s, "05  ·  How you sell");
    heading(s, "Discovery script");
    rule(s);
    const script = [
      "How do leads enter?",
      "Who answers, and on which channels?",
      "How are customers managed today?",
      "Where is time wasted / what is repetitive?",
      "Which modules match that waste?",
      "For each module: annual salary of that role → 13%.",
      "Size the project: modules × team × channels × custom → retainer.",
      "Book the 30-minute consultation. Proposal after scope.",
    ];
    script.forEach((line, i) => {
      const y = 1.6 + i * 0.62;
      s.addText(String(i + 1).padStart(2, "0"), { x: 0.55, y, w: 0.7, h: 0.5, fontFace: "Arial", fontSize: 16, bold: true, color: INK, margin: 0 });
      s.addText(line, { x: 1.4, y, w: 11.3, h: 0.5, fontFace: "Arial", fontSize: 16, color: INK, margin: 0 });
    });
    footer(s, n, total);
  });

  add((n, total) => {
    const s = whiteSlide(pres);
    kicker(s, "05  ·  How you sell");
    heading(s, "The motion");
    rule(s);
    const motion = [
      ["Open", "“Walk me through how a lead becomes a paying customer today.”"],
      ["Find the expensive human", "Every BOS sale lands on a role."],
      ["Show the OS", "One system. Connected modules. Not another app."],
      ["Book /book", "Lane, modules, timeline, team size, budget signal."],
      ["Quote after scope", "13% per module + retainer from size. Web/app separate."],
    ];
    motion.forEach((m, i) => {
      const y = 1.65 + i * 0.95;
      s.addShape("rect", { x: 0.55, y, w: 0.85, h: 0.8, fill: { color: INK } });
      s.addText(String(i + 1), { x: 0.55, y, w: 0.85, h: 0.8, fontFace: "Arial", fontSize: 22, bold: true, color: WHITE, align: "center", valign: "middle", margin: 0 });
      s.addText(m[0], { x: 1.65, y: y + 0.05, w: 10.8, h: 0.32, fontFace: "Arial", fontSize: 18, bold: true, color: INK, margin: 0 });
      s.addText(m[1], { x: 1.65, y: y + 0.4, w: 10.8, h: 0.32, fontFace: "Arial", fontSize: 14, color: MUTED, margin: 0 });
    });
    footer(s, n, total);
  });

  add((n, total) => {
    const s = whiteSlide(pres);
    kicker(s, "05  ·  How you sell");
    heading(s, "Language");
    rule(s);
    s.addTable(
      [
        [
          { text: "Use", options: { fill: { color: INK }, color: WHITE, bold: true } },
          { text: "Avoid", options: { fill: { color: INK }, color: WHITE, bold: true } },
        ],
        ["We build the systems behind modern businesses.", "Our packages start at…"],
        ["We don’t start with technology. We start with the business.", "The AI will give you a price."],
        ["Businesses don’t need more tools. They need better systems.", "Fake discounts, dates, or features"],
        ["Custom solutions. Custom pricing.", "“Just a web design company”"],
        ["13% of that seat for the year, plus a retainer sized to the project.", "Publishing 13% or retainers in ads"],
      ],
      {
        x: 0.55,
        y: 1.7,
        w: 12.2,
        colW: [6.1, 6.1],
        border: [{ pt: 0.75, color: INK }],
        fontFace: "Arial",
        fontSize: 13,
        color: INK,
        valign: "middle",
      },
    );
    footer(s, n, total);
  });

  add((n, total) => {
    const s = whiteSlide(pres);
    kicker(s, "05  ·  How you sell");
    heading(s, "Quote only when");
    rule(s);
    const checks = [
      "Module(s) named",
      "Role named per module",
      "Annual salary (or agreed estimate) per role",
      "13% calculated per module",
      "Project size scored (team, channels, modules, custom)",
      "Retainer band confirmed with leadership (until official bands exist)",
      "Website / app quoted separately if needed",
      "Consultation booked",
    ];
    checks.forEach((c, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 0.55 + col * 6.35;
      const y = 1.7 + row * 1.15;
      s.addShape("rect", { x, y, w: 6.15, h: 1.0, line: { color: INK, width: 1 } });
      s.addShape("rect", { x: x + 0.22, y: y + 0.32, w: 0.36, h: 0.36, line: { color: INK, width: 1.25 } });
      s.addText(c, { x: x + 0.75, y: y + 0.22, w: 5.15, h: 0.56, fontFace: "Arial", fontSize: 14, color: INK, valign: "middle", margin: 0 });
    });
    footer(s, n, total);
  });

  add((n, total) => {
    const s = whiteSlide(pres);
    kicker(s, "05  ·  Proof");
    heading(s, "Know these cold");
    rule(s);
    const proof = [
      ["onyxwebsystems.co.za", "Company story and services"],
      ["/services", "BOS modules and project intake"],
      ["/about", "Founders and philosophy"],
      ["/book", "30-minute consultation"],
      ["Thrift Rotate", "Website proof — Pretoria streetwear"],
      ["SEC Nightlife", "App + website proof — secnightlife.com"],
      ["Dashboard Conversations", "Read the thread before you call"],
      ["@onyxwebsystems", "Instagram and TikTok"],
    ];
    proof.forEach((p, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 0.55 + col * 6.35;
      const y = 1.65 + row * 1.2;
      s.addShape("rect", { x, y, w: 6.15, h: 1.08, line: { color: INK, width: 1 } });
      s.addText(p[0], { x: x + 0.25, y: y + 0.16, w: 5.65, h: 0.35, fontFace: "Arial", fontSize: 16, bold: true, color: INK, margin: 0 });
      s.addText(p[1], { x: x + 0.25, y: y + 0.55, w: 5.65, h: 0.35, fontFace: "Arial", fontSize: 13, color: MUTED, margin: 0 });
    });
    footer(s, n, total);
  });

  add((n, total) => {
    const s = whiteSlide(pres);
    kicker(s, "Still to lock with leadership");
    heading(s, "Do not invent these three");
    rule(s);
    const open = [
      ["01", "Is 13% once-off, year-one, or charged again each year?"],
      ["02", "What are the actual retainer bands in rand?"],
      ["03", "Does “salary” mean basic pay or cost to company?"],
    ];
    open.forEach((o, i) => {
      const y = 1.85 + i * 1.5;
      s.addShape("rect", { x: 0.55, y, w: 12.2, h: 1.3, line: { color: INK, width: 1 } });
      s.addText(o[0], { x: 0.85, y: y + 0.35, w: 1.1, h: 0.55, fontFace: "Arial", fontSize: 22, bold: true, color: INK, margin: 0 });
      s.addText(o[1], { x: 2.2, y: y + 0.35, w: 10.1, h: 0.6, fontFace: "Arial", fontSize: 20, color: INK, margin: 0 });
    });
    footer(s, n, total);
  });

  add((n, total) => {
    const s = darkSlide(pres);
    s.addText("Let’s build\nwhat’s next.", {
      x: 0.55,
      y: 2.15,
      w: 12,
      h: 2.0,
      fontFace: "Arial",
      fontSize: 48,
      bold: true,
      color: WHITE,
      margin: 0,
    });
    s.addShape("rect", { x: 0.55, y: 4.35, w: 1.55, h: 0.03, fill: { color: WHITE } });
    s.addText("onyxwebsystems.co.za     ·     onyxwebsystems@gmail.com     ·     /book", {
      x: 0.55,
      y: 4.6,
      w: 12,
      h: 0.4,
      fontFace: "Arial",
      fontSize: 16,
      color: "D4D4D0",
      margin: 0,
    });
    footer(s, n, total, true);
  });

  const numbered = slides.filter((fn) => fn.length >= 2);
  const total = numbered.length;
  let page = 0;
  slides.forEach((fn) => {
    if (fn.length >= 2) {
      page += 1;
      fn(page, total);
    } else {
      fn();
    }
  });

  const pptxPath = path.join(outDir, "Onyx-Web-Systems-Sales-Training.pptx");
  const buf = await pres.write({ outputType: "nodebuffer" });
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(pptxPath, buf);
  return pptxPath;
}

function findBrowser() {
  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ];
  return candidates.find((file) => fs.existsSync(file));
}

function buildPdf() {
  const htmlPath = path.join(outDir, "handbook.html");
  const pdfPath = path.join(outDir, "Onyx-Web-Systems-Sales-Training.pdf");
  const browser = findBrowser();
  if (!browser) {
    throw new Error("Chrome or Edge not found for PDF export.");
  }
  if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
  execFileSync(
    browser,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-pdf-header-footer",
      "--virtual-time-budget=35000",
      `--print-to-pdf=${pdfPath}`,
      pathToFileURL(htmlPath).href,
    ],
    { timeout: 90000, stdio: "pipe" },
  );
  if (!fs.existsSync(pdfPath)) {
    throw new Error("PDF was not created.");
  }
  return pdfPath;
}

const pptxPath = await buildPptx();
console.log(`Wrote ${pptxPath}`);
const pdfPath = buildPdf();
console.log(`Wrote ${pdfPath}`);
