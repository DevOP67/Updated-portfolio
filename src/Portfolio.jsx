import { useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Float,
  MeshDistortMaterial,
  Sphere,
  Torus,
  TorusKnot,
  Octahedron,
  Icosahedron,
} from "@react-three/drei";
import * as THREE from "three";
import emailjs from "@emailjs/browser";

/* ─────────────────────────────────────────────
   THEME TOKENS
───────────────────────────────────────────── */
const C = {
  bg: "#060a14",
  surface: "#0d1526",
  accent: "#00f5c8",
  accent2: "#7c3aed",
  accent3: "#f97316",
  text: "#e2e8f0",
  muted: "#64748b",
  border: "rgba(255,255,255,0.08)",
};

/* ─────────────────────────────────────────────
   GLOBAL STYLES (injected once)
───────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Mono:wght@300;400&family=Instrument+Serif:ital@1&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: ${C.bg}; color: ${C.text}; font-family: 'DM Mono', 'Courier New', monospace; overflow-x: hidden; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: ${C.bg}; }
  ::-webkit-scrollbar-thumb { background: ${C.accent2}; border-radius: 2px; }

  @keyframes fadeUp   { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes marquee  { from { transform:translateX(0); } to { transform:translateX(-50%); } }
  @keyframes pulse    { 0%,100% { opacity:.3; } 50% { opacity:1; } }
  @keyframes spin     { to { transform: rotate(360deg); } }

  .fade-up { animation: fadeUp .7s both; }
  .d1 { animation-delay:.15s; } .d2 { animation-delay:.3s; }
  .d3 { animation-delay:.45s; } .d4 { animation-delay:.6s; }
  .d5 { animation-delay:.75s; } .d6 { animation-delay:.9s; }

  section { position: relative; z-index: 2; }

  /* NAV */
  nav {
    position: fixed; top:0; left:0; right:0; z-index:500;
    display:flex; justify-content:space-between; align-items:center;
    padding:.85rem 5vw;
    background: rgba(6,10,20,.92); backdrop-filter:blur(20px);
    border-bottom:1px solid ${C.border};
  }
  .nav-logo { font-family:'Syne',sans-serif; font-size:1.1rem; font-weight:800; color:${C.text}; text-decoration:none; letter-spacing:-.02em; }
  .nav-logo span { color:${C.accent}; }

  /* Desktop links */
  .nav-desktop { display:flex; gap:2rem; list-style:none; margin:0; padding:0; }
  .nav-desktop a { font-size:.68rem; letter-spacing:.15em; text-transform:uppercase; color:${C.muted}; text-decoration:none; transition:color .2s; }
  .nav-desktop a:hover { color:${C.accent}; }

  /* Hamburger button */
  .nav-toggle {
    display:none; flex-direction:column; justify-content:center; gap:5px;
    background:none; border:none; cursor:pointer; padding:6px; z-index:900;
  }
  .nav-toggle span { display:block; width:22px; height:2px; background:${C.text}; border-radius:2px; transition:transform .35s, opacity .25s, width .25s; transform-origin:center; }
  .nav-toggle.open span:nth-child(1) { transform:translateY(7px) rotate(45deg); }
  .nav-toggle.open span:nth-child(2) { opacity:0; width:0; }
  .nav-toggle.open span:nth-child(3) { transform:translateY(-7px) rotate(-45deg); }

  /* Mobile drawer — small glassmorphism panel from top-right */
  .mobile-drawer {
    display: none;
  }
  @media(max-width:768px){
    .nav-toggle  { display:flex; }
    .nav-desktop { display:none; }

    .mobile-drawer {
      display: block;
      position: fixed;
      top: 4.5rem;
      right: 1.25rem;
      z-index: 800;
      pointer-events: none;
      opacity: 0;
      transform: scale(0.92) translateY(-8px);
      transform-origin: top right;
      transition: opacity .25s ease, transform .25s ease;
    }
    .mobile-drawer.open {
      pointer-events: all;
      opacity: 1;
      transform: scale(1) translateY(0);
    }

    /* Glass panel */
    .mobile-drawer-bg {
      position: absolute; inset: 0;
      border-radius: 16px;
      background: rgba(10,16,32,0.35);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(0,245,200,0.12);
      box-shadow: 0 8px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03) inset;
    }

    /* Links list */
    .drawer-links {
      position: relative;
      display: flex; flex-direction: column;
      list-style: none; margin: 0;
      padding: 1.25rem 1.75rem 1.25rem 1.5rem;
      gap: 0;
      min-width: 200px;
      z-index: 1;
    }
    .drawer-links li {
      opacity: 0; transform: translateX(10px);
      transition: opacity .2s, transform .2s;
    }
    .mobile-drawer.open .drawer-links li:nth-child(1) { opacity:1; transform:translateX(0); transition-delay:.05s; }
    .mobile-drawer.open .drawer-links li:nth-child(2) { opacity:1; transform:translateX(0); transition-delay:.10s; }
    .mobile-drawer.open .drawer-links li:nth-child(3) { opacity:1; transform:translateX(0); transition-delay:.15s; }
    .mobile-drawer.open .drawer-links li:nth-child(4) { opacity:1; transform:translateX(0); transition-delay:.20s; }
    .mobile-drawer.open .drawer-links li:nth-child(5) { opacity:1; transform:translateX(0); transition-delay:.25s; }

    .drawer-links a {
      display: flex; align-items: center; gap: .6rem;
      font-family: 'DM Mono', monospace;
      font-size: .75rem; letter-spacing: .18em; text-transform: uppercase;
      color: rgba(226,232,240,0.75); text-decoration: none;
      padding: .75rem .5rem;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      transition: color .2s, padding-left .2s;
      text-shadow: 0 1px 8px rgba(0,0,0,0.8);
    }
    .drawer-links li:last-child a { border-bottom: none; }
    .drawer-links a::before {
      content: '';
      width: 4px; height: 4px; border-radius: 50%;
      background: ${C.accent}; flex-shrink: 0;
      opacity: 0; transition: opacity .2s;
    }
    .drawer-links a:hover {
      color: ${C.accent};
      padding-left: .85rem;
    }
    .drawer-links a:hover::before { opacity: 1; }
  }

  /* MARQUEE */
  .marquee-wrap { overflow:hidden; border-top:1px solid ${C.border}; border-bottom:1px solid ${C.border}; padding:.8rem 0; background:rgba(6,10,20,.5); position:relative; z-index:2; }
  .marquee-track { display:flex; gap:2.5rem; width:max-content; animation:marquee 30s linear infinite; }
  .marquee-item { font-size:.65rem; letter-spacing:.18em; text-transform:uppercase; color:${C.muted}; white-space:nowrap; display:flex; align-items:center; gap:.7rem; }
  .marquee-dot { width:4px; height:4px; border-radius:50%; background:${C.accent}; flex-shrink:0; }

  /* SHARED */
  .section-inner { max-width:1200px; margin:0 auto; padding:4rem 5vw; }
  .sec-label { font-size:.64rem; letter-spacing:.3em; text-transform:uppercase; color:${C.accent}; margin-bottom:1rem; display:flex; align-items:center; gap:.6rem; }
  .sec-label::before { content:''; width:18px; height:1px; background:${C.accent}; flex-shrink:0; }
  .sec-title { font-family:'Syne',sans-serif; font-size:clamp(1.8rem,3.5vw,2.8rem); font-weight:800; line-height:1.05; margin-bottom:1.25rem; letter-spacing:-.03em; }
  .hl  { color:${C.accent}; }
  .hl2 { color:${C.accent2}; }
  .divider { height:1px; background:${C.border}; max-width:1200px; margin:0 auto; position:relative; z-index:2; }

  /* GLASS CARD */
  .glass {
    background:rgba(13,21,38,.35); backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px);
    border:1px solid rgba(255,255,255,.1); border-radius:16px;
    transition:border-color .3s, box-shadow .3s;
  }
  .glass:hover { border-color:rgba(0,245,200,.22); box-shadow:0 16px 48px rgba(0,0,0,.4), 0 0 28px rgba(0,245,200,.07); }

  /* HERO */
  #hero { min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:8rem 2rem 4rem; position:relative; }
  .hero-eyebrow { font-size:.66rem; letter-spacing:.3em; text-transform:uppercase; color:${C.accent}; margin-bottom:1.5rem; display:flex; align-items:center; gap:1rem; }
  .hero-eyebrow::before,.hero-eyebrow::after { content:''; width:30px; height:1px; background:${C.accent}; opacity:.5; }
  .hero-name { font-family:'Syne',sans-serif; font-size:clamp(3rem,9vw,7.5rem); font-weight:800; line-height:.9; letter-spacing:-.05em; }
  .hero-name .ghost { display:block; color:transparent; -webkit-text-stroke:1px rgba(255,255,255,.22); }
  .hero-role { font-family:'Instrument Serif',serif; font-style:italic; font-size:clamp(1rem,2.5vw,1.5rem); color:${C.muted}; margin-top:1.25rem; }
  .hero-desc { max-width:500px; font-size:.78rem; line-height:1.9; color:${C.muted}; margin:1rem auto 0; }
  .hero-pills { display:flex; flex-wrap:wrap; gap:.45rem; justify-content:center; margin-top:1.5rem; }
  .pill { font-size:.65rem; padding:.28rem .85rem; border:1px solid rgba(0,245,200,.25); border-radius:999px; color:${C.accent}; background:rgba(0,245,200,.06); letter-spacing:.05em; }
  .hero-btns { display:flex; gap:1rem; margin-top:2.25rem; flex-wrap:wrap; justify-content:center; }
  .btn { font-family:'DM Mono',monospace; font-size:.7rem; letter-spacing:.12em; text-transform:uppercase; padding:.75rem 1.9rem; border-radius:4px; text-decoration:none; transition:all .22s; cursor:pointer; border:none; display:inline-block; }
  .btn-fill { background:${C.accent}; color:#060a14; font-weight:700; }
  .btn-fill:hover { filter:brightness(1.1); transform:translateY(-2px); }
  .btn-ghost { border:1px solid ${C.border}; color:${C.text}; background:transparent; }
  .btn-ghost:hover { border-color:${C.accent}; color:${C.accent}; }
  .scroll-cue { position:absolute; bottom:2.5rem; display:flex; flex-direction:column; align-items:center; gap:.4rem; font-size:.6rem; letter-spacing:.2em; text-transform:uppercase; color:${C.muted}; }
  .scroll-bar { width:1px; height:40px; background:linear-gradient(to bottom,${C.accent},transparent); animation:pulse 2.2s ease-in-out infinite; }

  /* ABOUT */
  .about-grid { display:grid; grid-template-columns:1fr 1fr; gap:4rem; align-items:center; }
  .about-canvas-wrap { height:380px; border-radius:12px; border:1px solid ${C.border}; overflow:hidden; }
  .about-p { font-size:.78rem; line-height:2; color:${C.muted}; margin-bottom:.8rem; }
  .stats { display:flex; gap:2rem; margin-top:1.5rem; }
  .stat { border-left:2px solid ${C.accent}; padding-left:.85rem; }
  .stat-n { font-family:'Syne',sans-serif; font-size:2rem; font-weight:800; }
  .stat-l { font-size:.64rem; color:${C.muted}; letter-spacing:.08em; margin-top:.1rem; }

  /* SKILLS */
  .skills-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(250px,1fr)); gap:1.1rem; }
  .sk-card {
  position: relative;
  overflow: hidden;
  padding: 1.4rem;
  border-radius: 16px;

  /* GLASS EFFECT */
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);

  border: 1px solid rgba(255,255,255,0.12);

  box-shadow:
    0 8px 32px rgba(0,0,0,0.45),
    inset 0 1px 0 rgba(255,255,255,0.08);

  transition: all 0.3s ease;
}
  .sk-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,${C.accent},${C.accent2}); transform:scaleX(0); transform-origin:left; transition:transform .35s; }
  .sk-card::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    120deg,
    transparent,
    rgba(255,255,255,0.08),
    transparent
  );
  opacity: 0;
  transition: opacity 0.3s;
}

.sk-card:hover::after {
  opacity: 1;
}
  .sk-card:hover {
  transform: translateY(-6px);

  border-color: rgba(0,245,200,0.4);

  box-shadow:
    0 20px 60px rgba(0,0,0,0.6),
    0 0 30px rgba(0,245,200,0.15),
    inset 0 1px 0 rgba(255,255,255,0.15);
}
  .sk-card:hover::before { transform:scaleX(1); }
  .sk-cat { font-size:.6rem; letter-spacing:.25em; text-transform:uppercase; color:${C.accent}; margin-bottom:.8rem; }
  .sk-tags { display:flex; flex-wrap:wrap; gap:.35rem; }
  .sk-tag { font-size:.68rem; padding:.22rem .6rem; border:1px solid ${C.border}; border-radius:4px; color:${C.text}; transition:all .18s; }
  .sk-tag:hover { border-color:${C.accent}; color:${C.accent}; }

  /* BUILDING */
  .building-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:1.1rem; margin-top:2rem; }
  .build-card {
  position: relative;
  overflow: hidden;

  padding: 1.4rem;
  display: flex;
  flex-direction: column;
  gap: .65rem;

  border-radius: 16px;

  /* GLASSMORPHISM */
  background: rgba(13, 21, 38, 0.35);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);

  border: 1px solid rgba(255,255,255,0.12);

  box-shadow:
    0 8px 32px rgba(0,0,0,0.5),
    inset 0 1px 0 rgba(255,255,255,0.06);

  transition: all 0.3s ease;
}
  .build-card:hover {
  transform: translateY(-6px);

  border-color: rgba(0,245,200,0.4);

  box-shadow:
    0 20px 60px rgba(0,0,0,0.7),
    0 0 35px rgba(0,245,200,0.15),
    inset 0 1px 0 rgba(255,255,255,0.1);
}
    .build-card::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    120deg,
    transparent,
    rgba(255,255,255,0.08),
    transparent
  );
  opacity: 0;
  transition: opacity 0.3s;
}

.build-card:hover::after {
  opacity: 1;
}
  .build-icon { font-size:1.4rem; }
  .build-title { font-family:'Syne',sans-serif; font-size:.95rem; font-weight:700; }
  .build-desc { font-size:.74rem; line-height:1.75; color:${C.muted}; flex:1; }
  .build-status { display:inline-flex; align-items:center; gap:.4rem; font-size:.6rem; letter-spacing:.15em; text-transform:uppercase; }
  .sdot { width:6px; height:6px; border-radius:50%; flex-shrink:0; animation:pulse 1.8s ease-in-out infinite; }

  /* EXPERIENCE TIMELINE */
  .timeline { position:relative; padding-left:2rem; margin-top:2rem; }
  .timeline::before { content:''; position:absolute; left:0; top:0; bottom:0; width:1px; background:${C.border}; }
  .tl-item { position:relative; margin-bottom:2.5rem; padding-left:2rem; opacity:0; transform:translateX(-16px); transition:opacity .5s, transform .5s; }
  .tl-item.vis { opacity:1; transform:translateX(0); }
  .tl-dot { position:absolute; left:-2.4rem; top:.2rem; width:10px; height:10px; border-radius:50%; background:${C.accent}; box-shadow:0 0 0 3px rgba(0,245,200,.15); }
  .tl-date { font-size:.66rem; letter-spacing:.12em; color:${C.accent}; margin-bottom:.35rem; }
  .tl-role { font-family:'Syne',sans-serif; font-size:1.15rem; font-weight:700; margin-bottom:.2rem; }
  .tl-company { font-size:.74rem; color:${C.muted}; margin-bottom:.85rem; }
  .tl-list { list-style:none; display:flex; flex-direction:column; gap:.4rem; }
  .tl-list li { font-size:.76rem; line-height:1.7; color:${C.muted}; padding-left:1.1rem; position:relative; }
  .tl-list li::before { content:'→'; position:absolute; left:0; color:${C.accent}; font-size:.68rem; }

  /* PROJECTS */
  .proj-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:1.75rem; margin-top:2rem; }
  .proj-card { border-radius:16px; overflow:hidden; opacity:0; transform:translateY(24px); transition:opacity .5s, transform .5s; }
  .proj-card.vis { opacity:1; transform:translateY(0); }
  .proj-canvas-wrap { height:190px; position:relative; overflow:hidden; }
  .proj-canvas-wrap canvas, .proj-canvas-wrap > div { width:100%!important; height:100%!important; }
  .proj-body { padding:1.4rem; background:linear-gradient(to bottom,rgba(6,10,20,.05),rgba(6,10,20,.65)); }
  .proj-yr { font-size:.6rem; letter-spacing:.2em; color:${C.accent}; margin-bottom:.35rem; }
  .proj-title { font-family:'Syne',sans-serif; font-size:1.15rem; font-weight:700; margin-bottom:.55rem; }
  .proj-desc { font-size:.74rem; line-height:1.8; color:${C.muted}; margin-bottom:1rem; }
  .proj-stack { display:flex; flex-wrap:wrap; gap:.3rem; }
  .proj-tag { font-size:.6rem; padding:.16rem .5rem; border-radius:3px; background:rgba(0,245,200,.08); color:${C.accent}; border:1px solid rgba(0,245,200,.18); }

  /* EDUCATION */
  .edu-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(250px,1fr)); gap:1.1rem; margin-top:2rem; }
  .edu-card {
  position: relative;
  overflow: hidden;

  padding: 1.6rem;
  display: flex;
  flex-direction: column;

  border-radius: 16px;

  /* GLASSMORPHISM */
  background: rgba(13, 21, 38, 0.35);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);

  border: 1px solid rgba(255,255,255,0.12);

  box-shadow:
    0 8px 32px rgba(0,0,0,0.5),
    inset 0 1px 0 rgba(255,255,255,0.06);

  /* KEEP YOUR ANIMATION */
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.4s ease;
}
  .edu-card.vis { opacity:1; transform:translateY(0); }
  .edu-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    120deg,
    transparent,
    rgba(255,255,255,0.08),
    transparent
  );
  opacity: 0;
  transition: opacity 0.3s;
}

.edu-card:hover::before {
  opacity: 1;
}
  .edu-card::after { content:''; position:absolute; bottom:0; left:0; right:0; height:2px; background:linear-gradient(90deg,${C.accent2},${C.accent}); transform:scaleX(0); transform-origin:left; transition:transform .35s; }
  .edu-card:hover {
  transform: translateY(-6px);

  border-color: rgba(0,245,200,0.4);

  box-shadow:
    0 20px 60px rgba(0,0,0,0.7),
    0 0 35px rgba(0,245,200,0.15),
    inset 0 1px 0 rgba(255,255,255,0.1);
}
  .edu-card:hover::after { transform:scaleX(1); }
  .edu-deg { font-family:'Syne',sans-serif; font-size:.95rem; font-weight:700; margin-bottom:.4rem; }
  .edu-school { font-size:.72rem; color:${C.muted}; margin-bottom:.2rem; }
  .edu-yr { font-size:.64rem; color:${C.accent}; letter-spacing:.1em; }
  .edu-score-wrap { margin-top:auto; padding-top:1.25rem; }
  .edu-score { font-family:'Syne',sans-serif; font-size:2rem; font-weight:800; }
  .edu-slabel { font-size:.6rem; color:${C.muted}; margin-top:.1rem; }

  /* DSA */
  .dsa-inner { display:grid; grid-template-columns:1fr 1fr; gap:1.25rem; margin-top:2rem; }
  .dsa-card { padding:1.6rem; opacity:0; transform:translateY(20px); transition:opacity .5s, transform .5s; }
  .dsa-card.vis { opacity:1; transform:translateY(0); }
  .dsa-platform { font-size:.6rem; letter-spacing:.25em; text-transform:uppercase; color:${C.accent}; margin-bottom:.65rem; }
  .dsa-title { font-family:'Syne',sans-serif; font-size:1.05rem; font-weight:700; margin-bottom:.45rem; }
  .dsa-desc { font-size:.74rem; line-height:1.8; color:${C.muted}; margin-bottom:1.1rem; }
  .dsa-badges { display:flex; flex-wrap:wrap; gap:.35rem; }
  .dsa-badge { font-size:.62rem; padding:.18rem .6rem; border-radius:4px; background:rgba(0,245,200,.07); color:${C.accent}; border:1px solid rgba(0,245,200,.15); }
  .dsa-badge.p { background:rgba(124,58,237,.08); color:${C.accent2}; border-color:rgba(124,58,237,.2); }

  /* CONTACT */
  .contact-wrap { text-align:center; max-width:700px; margin:0 auto; }
  .contact-title { font-family:'Syne',sans-serif; font-size:clamp(2rem,6vw,4.5rem); font-weight:800; line-height:.95; letter-spacing:-.04em; margin-bottom:1.25rem; }
  .contact-title .outline { display:block; color:transparent; -webkit-text-stroke:1px rgba(255,255,255,.2); }
  .contact-email { display:inline-block; font-family:'Instrument Serif',serif; font-style:italic; font-size:1.2rem; color:${C.accent}; text-decoration:none; margin:1.25rem 0; transition:opacity .2s; }
  .contact-email:hover { opacity:.7; }
  .cinfo-grid { display:grid; grid-template-columns:1fr 1fr; gap:.9rem; max-width:480px; margin:1.25rem auto; }
  .cinfo-card { padding:1rem 1.1rem; text-align:left; }
  .cinfo-label { font-size:.58rem; letter-spacing:.2em; text-transform:uppercase; color:${C.muted}; margin-bottom:.3rem; }
  .cinfo-val { font-size:.78rem; color:${C.text}; }
  .socials { display:flex; gap:.9rem; justify-content:center; flex-wrap:wrap; margin-top:1.5rem; }
  .soc { font-size:.66rem; letter-spacing:.14em; text-transform:uppercase; color:${C.muted}; text-decoration:none; border:1px solid ${C.border}; padding:.5rem 1.1rem; border-radius:4px; transition:all .2s; }
  .soc:hover { color:${C.accent}; border-color:${C.accent}; }

  /* CONTACT FORM */
  .cf-form { width:100%; max-width:520px; margin:1.75rem auto 0; display:flex; flex-direction:column; gap:.85rem; }
  .cf-row { display:grid; grid-template-columns:1fr 1fr; gap:.85rem; }
  .cf-field { display:flex; flex-direction:column; gap:.35rem; }
  .cf-label { font-size:.6rem; letter-spacing:.2em; text-transform:uppercase; color:${C.muted}; }
  .cf-input, .cf-textarea {
    width:100%; background:rgba(13,21,38,.5); border:1px solid rgba(255,255,255,.1);
    border-radius:8px; padding:.75rem 1rem; font-family:'DM Mono',monospace;
    font-size:.78rem; color:${C.text}; outline:none; resize:none;
    transition:border-color .2s, box-shadow .2s;
    -webkit-appearance:none;
  }
  .cf-input::placeholder, .cf-textarea::placeholder { color:${C.muted}; }
  .cf-input:focus, .cf-textarea:focus {
    border-color:rgba(0,245,200,.45);
    box-shadow:0 0 0 3px rgba(0,245,200,.07);
  }
  .cf-textarea { min-height:110px; }
  .cf-submit {
    width:100%; padding:.9rem; border-radius:8px; border:none; cursor:pointer;
    font-family:'DM Mono',monospace; font-size:.75rem; font-weight:700;
    letter-spacing:.12em; text-transform:uppercase;
    background:${C.accent}; color:#060a14;
    transition:filter .2s, transform .2s, opacity .2s;
    display:flex; align-items:center; justify-content:center; gap:.6rem;
  }
  .cf-submit:hover:not(:disabled) { filter:brightness(1.1); transform:translateY(-1px); }
  .cf-submit:disabled { opacity:.6; cursor:not-allowed; }
  .cf-msg { font-size:.72rem; text-align:center; padding:.6rem; border-radius:6px; margin-top:.25rem; }
  .cf-msg.ok  { background:rgba(0,245,200,.1); color:${C.accent}; border:1px solid rgba(0,245,200,.2); }
  .cf-msg.err { background:rgba(239,68,68,.1); color:#f87171; border:1px solid rgba(239,68,68,.2); }

  /* FOOTER */
  footer { padding:1.5rem 5vw; border-top:1px solid ${C.border}; display:flex; justify-content:space-between; align-items:center; font-size:.66rem; color:${C.muted}; position:relative; z-index:2; }

  /* ── MOBILE FIXES ── */
  @media(max-width:768px){

    /* HERO */
    #hero { padding:7rem 1.5rem 5rem; min-height:100svh; }
    .hero-eyebrow { font-size:.58rem; gap:.6rem; }
    .hero-eyebrow::before,.hero-eyebrow::after { width:20px; }
    .hero-name { font-size:clamp(2.6rem,13vw,4.5rem); letter-spacing:-.04em; }
    .hero-role { font-size:1rem; margin-top:1rem; }
    .hero-desc { font-size:.76rem; padding:0 .5rem; }
    .hero-pills { gap:.35rem; }
    .pill { font-size:.6rem; padding:.24rem .7rem; }
    .hero-btns { flex-direction:column; align-items:center; gap:.75rem; width:100%; }
    .btn { width:100%; max-width:260px; text-align:center; padding:.85rem 1.5rem; }
    .scroll-cue { display:none; }

    /* SECTION INNER */
    .section-inner { padding:3rem 1.25rem; }

    /* SEC TITLES */
    .sec-title { font-size:clamp(1.5rem,7vw,2.2rem); }

    /* ABOUT */
    .about-grid { grid-template-columns:1fr; gap:2rem; }
    .about-canvas-wrap { height:260px; }
    .stats { gap:1.25rem; flex-wrap:wrap; }
    .stat-n { font-size:1.6rem; }

    /* SKILLS */
    .skills-grid { grid-template-columns:1fr; }
    .sk-card { padding:1.1rem; }

    /* BUILDING */
    .building-grid { grid-template-columns:1fr; }
    .build-card { padding:1.2rem; }

    /* EXPERIENCE */
    .timeline { padding-left:1.5rem; }
    .tl-item { padding-left:1.5rem; margin-bottom:2rem; }
    .tl-dot { left:-1.85rem; }
    .tl-role { font-size:1rem; }
    .tl-list li { font-size:.73rem; }

    /* PROJECTS */
    .proj-grid { grid-template-columns:1fr; gap:1.25rem; }
    .proj-canvas-wrap { height:160px; }
    .proj-body { padding:1.1rem; }
    .proj-title { font-size:1rem; }
    .proj-desc { font-size:.72rem; }

    /* EDUCATION */
    .edu-grid { grid-template-columns:1fr; }
    .edu-card { padding:1.25rem; }
    .edu-deg { font-size:.88rem; }
    .edu-score { font-size:1.7rem; }
    .edu-score-wrap { padding-top:1rem; }

    /* DSA */
    .dsa-inner { grid-template-columns:1fr; }
    .dsa-card { padding:1.25rem; }
    .dsa-title { font-size:.95rem; }

    /* CONTACT */
    .contact-title { font-size:clamp(1.8rem,9vw,3rem); letter-spacing:-.03em; }
    .contact-email { font-size:1rem; word-break:break-all; }
    .cinfo-grid { grid-template-columns:1fr 1fr; max-width:100%; }
    .socials { gap:.6rem; }
    .soc { font-size:.6rem; padding:.45rem .9rem; }
    .cf-row { grid-template-columns:1fr; }

    /* FOOTER */
    footer { flex-direction:column; gap:.5rem; text-align:center; padding:1.25rem 1.5rem; }

    /* DIVIDER */
    .divider { margin:0 1.25rem; }

    /* GLASS CARD hover off on mobile (no hover on touch) */
    .glass:hover { border-color:rgba(255,255,255,.1); box-shadow:none; }
    .sk-card:hover { transform:none; border-color:${C.border}; }
    .sk-card:hover::before { transform:scaleX(0); }
  }

  @media(max-width:380px){
    .hero-name { font-size:clamp(2.2rem,11vw,3rem); }
    .cinfo-grid { grid-template-columns:1fr; }
    .hero-eyebrow { font-size:.52rem; letter-spacing:.2em; }
  }

  /* SAFE AREA for notched phones */
  @supports(padding:env(safe-area-inset-bottom)){
    footer { padding-bottom:calc(1.5rem + env(safe-area-inset-bottom)); }
    nav    { padding-top:calc(.85rem + env(safe-area-inset-top)); }
  }

  /* Touch — remove tap highlight */
  @media(hover:none){
    a, button { -webkit-tap-highlight-color: transparent; }
    .btn:active { transform:scale(.97); }
    .soc:active { color:${C.accent}; border-color:${C.accent}; }
    .drawer-links a:active { color:${C.accent}; }
  }
`;

/* ─────────────────────────────────────────────
   3D SCENES
───────────────────────────────────────────── */

/* ── PLANET CONFIG ── */
const PLANETS = [
  {
    id: "hero",
    name: "Sun",
    color: "#FDB813",
    emissive: "#f97316",
    size: 2.4,
    orbitR: 0,
    speed: 0,
    rings: false,
  },
  {
    id: "about",
    name: "Mercury",
    color: "#b5b5b5",
    emissive: "#777",
    size: 0.3,
    orbitR: 4.5,
    speed: 1.6,
    rings: false,
  },
  {
    id: "skills",
    name: "Venus",
    color: "#e8cda0",
    emissive: "#b8802a",
    size: 0.5,
    orbitR: 6.8,
    speed: 1.17,
    rings: false,
  },
  {
    id: "building",
    name: "Mars",
    color: "#c1440e",
    emissive: "#6a1e04",
    size: 0.38,
    orbitR: 9.2,
    speed: 0.8,
    rings: false,
  },
  {
    id: "experience",
    name: "Jupiter",
    color: "#c88b3a",
    emissive: "#6a4010",
    size: 1.2,
    orbitR: 12.5,
    speed: 0.43,
    rings: false,
  },
  {
    id: "projects",
    name: "Saturn",
    color: "#e4d191",
    emissive: "#9a8030",
    size: 0.95,
    orbitR: 16.0,
    speed: 0.32,
    rings: true,
  },
  {
    id: "education",
    name: "Uranus",
    color: "#7de8e8",
    emissive: "#208080",
    size: 0.7,
    orbitR: 19.5,
    speed: 0.22,
    rings: true,
  },
  {
    id: "dsa",
    name: "Neptune",
    color: "#4b70dd",
    emissive: "#1a3090",
    size: 0.65,
    orbitR: 23.0,
    speed: 0.18,
    rings: false,
  },
  {
    id: "contact",
    name: "Earth",
    color: "#2a7fd4",
    emissive: "#0a3060",
    size: 0.55,
    orbitR: 7.8,
    speed: 1.0,
    rings: false,
  },
];

/* Store live orbital angles so camera can track them */
const orbitalAngles = PLANETS.reduce(
  (acc, p) => ({ ...acc, [p.id]: Math.random() * Math.PI * 2 }),
  {},
);

/** Single planet — self-orbiting in XZ plane */
function Planet({ planet, active }) {
  const meshRef = useRef();
  const groupRef = useRef();
  const ringRef = useRef();
  const ring2Ref = useRef();
  const glowRef = useRef();
  const pinGroupRef = useRef();
  const isEarth = planet.name === "Earth";
  const isSun = planet.name === "Sun";

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    // Advance orbital angle
    orbitalAngles[planet.id] += planet.speed * 0.001;
    const a = orbitalAngles[planet.id];

    if (groupRef.current && !isSun) {
      groupRef.current.position.x = Math.cos(a) * planet.orbitR;
      groupRef.current.position.z = Math.sin(a) * planet.orbitR;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += isSun ? 0.003 : 0.008;
    }
    if (ringRef.current) ringRef.current.rotation.z += 0.001;
    if (ring2Ref.current) ring2Ref.current.rotation.z -= 0.0008;
    if (glowRef.current) {
      const p = Math.sin(t * (isSun ? 2 : 1.5)) * 0.05 + 1;
      glowRef.current.scale.setScalar(p);
    }
    if (pinGroupRef.current) {
      pinGroupRef.current.rotation.y = t * 1.2;
    }
  });

  const s = planet.size;

  const content = (
    <>
      {/* Outer glow halo */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[s * 1.7, 16, 16]} />
        <meshBasicMaterial
          color={planet.color}
          transparent
          opacity={active ? 0.05 : isSun ? 0.04 : 0.02}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Earth atmosphere */}
      {isEarth && (
        <mesh>
          <sphereGeometry args={[s * 1.12, 20, 20]} />
          <meshBasicMaterial
            color="#88bbff"
            transparent
            opacity={0.06}
            side={THREE.BackSide}
          />
        </mesh>
      )}

      {/* Main sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[s, 36, 36]} />
        <meshStandardMaterial
          color={planet.color}
          emissive={planet.emissive}
          emissiveIntensity={isSun ? 0.5 : active ? 0.7 : 0.25}
          roughness={isSun ? 0.3 : 0.8}
          metalness={0.05}
        />
      </mesh>

      {/* Earth — green landmass blobs */}
      {isEarth &&
        [
          [0.55, 0.2, 0.55],
          [-0.5, 0.3, 0.45],
          [0.2, -0.5, 0.55],
          [0.6, -0.1, 0.4],
        ].map(([x, y, z], i) => (
          <mesh key={i} position={[x * s, y * s, z * s]}>
            <icosahedronGeometry args={[s * 0.22, 0]} />
            <meshStandardMaterial
              color="#2d9e47"
              emissive="#1a5c28"
              emissiveIntensity={0.4}
              roughness={0.9}
            />
          </mesh>
        ))}

      {/* Saturn rings */}
      {planet.rings && planet.name === "Saturn" && (
        <>
          <mesh ref={ringRef} rotation={[Math.PI / 2.6, 0, 0]}>
            <torusGeometry args={[s * 1.9, s * 0.25, 2, 80]} />
            <meshBasicMaterial
              color="#d4b870"
              transparent
              opacity={0.45}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh rotation={[Math.PI / 2.6, 0, 0]}>
            <torusGeometry args={[s * 2.3, s * 0.1, 2, 80]} />
            <meshBasicMaterial
              color="#c8a850"
              transparent
              opacity={0.25}
              side={THREE.DoubleSide}
            />
          </mesh>
        </>
      )}

      {/* Uranus rings (tilted differently) */}
      {planet.rings && planet.name === "Uranus" && (
        <mesh ref={ring2Ref} rotation={[0, 0, Math.PI / 2.2]}>
          <torusGeometry args={[s * 1.8, s * 0.1, 2, 64]} />
          <meshBasicMaterial
            color="#7de8e8"
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Sun corona rays */}
      {isSun &&
        Array.from({ length: 12 }, (_, i) => (
          <mesh key={i} rotation={[0, (i / 12) * Math.PI * 2, 0]}>
            <planeGeometry args={[0.04, s * 0.9]} />
            <meshBasicMaterial
              color="#FDB813"
              transparent
              opacity={0.06}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}

      {/* Earth Bengaluru pin — visible when contact section active */}
      {isEarth && active && (
        <group ref={pinGroupRef} position={[s * 0.6, s * 0.4, s * 0.65]}>
          <mesh position={[0, s * 0.35, 0]}>
            <cylinderGeometry args={[0.015, 0.005, s * 0.55, 6]} />
            <meshBasicMaterial color="#00f5c8" />
          </mesh>
          <mesh position={[0, s * 0.65, 0]}>
            <sphereGeometry args={[s * 0.12, 10, 10]} />
            <meshBasicMaterial color="#00f5c8" />
          </mesh>
          <mesh position={[0, s * 0.65, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[s * 0.22, 0.018, 6, 24]} />
            <meshBasicMaterial color="#00f5c8" transparent opacity={0.55} />
          </mesh>
        </group>
      )}
    </>
  );

  if (isSun) return <group>{content}</group>;
  return <group ref={groupRef}>{content}</group>;
}

/** Orbit path ring in XZ plane */
function OrbitPath({ radius, active }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius - 0.015, radius + 0.015, 128]} />
      <meshBasicMaterial
        color={active ? "#00f5c8" : "#ffffff"}
        transparent
        opacity={active ? 0.22 : 0.055}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/** Star field — static deep background */
function StarField() {
  const ref = useRef();
  const count = 3000;
  const pos = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const r = 60 + Math.random() * 80;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i * 3 + 2] = r * Math.cos(phi);
    sizes[i] = 0.3 + Math.random() * 0.7;
  }
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.003;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pos, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#ffffff"
        size={0.055}
        transparent
        opacity={0.65}
        sizeAttenuation
      />
    </points>
  );
}

/** Rocket spacecraft — travels planet-to-planet as user scrolls */
function Rocket({ activePlanet }) {
  const rocketRef = useRef();
  const flameRef = useRef();
  const flame2Ref = useRef();

  // Persistent rocket state — NOT in React state to avoid re-renders
  const s = useRef({
    phase: "idle", // idle | flying
    t: 0,
    speed: 0.38,
    fromPos: new THREE.Vector3(7.8, 0.3, 0), // start near Earth
    toPos: new THREE.Vector3(7.8, 0.3, 0),
    curPos: new THREE.Vector3(7.8, 0.3, 0), // where rocket IS right now
    prevPlanet: "hero", // last planet we were at
  });

  // Helper — get a planet's current world position
  const getPlanetPos = (id) => {
    const p = PLANETS.find((pl) => pl.id === id);
    if (!p) return new THREE.Vector3();
    const a = orbitalAngles[id];
    return new THREE.Vector3(
      p.orbitR === 0 ? 0 : Math.cos(a) * p.orbitR,
      0.3,
      p.orbitR === 0 ? 0 : Math.sin(a) * p.orbitR,
    );
  };

  useFrame(({ clock }) => {
    if (!rocketRef.current) return;
    const dt = 0.016;
    const r = s.current;

    // Detect section change → trigger new flight from CURRENT position
    if (r.prevPlanet !== activePlanet) {
      // fromPos = where rocket currently IS (mid-flight or landed)
      r.fromPos.copy(r.curPos);
      r.toPos.copy(getPlanetPos(activePlanet));
      r.prevPlanet = activePlanet;
      r.phase = "flying";
      r.t = 0;
      // Speed based on distance — farther = a bit slower
      const dist = r.fromPos.distanceTo(r.toPos);
      r.speed = Math.max(0.18, Math.min(0.55, 3.5 / dist));
    }

    if (r.phase === "flying") {
      r.t += dt * r.speed;

      // Update target pos continuously (planet is moving!)
      r.toPos.copy(getPlanetPos(activePlanet));

      if (r.t >= 1) {
        r.t = 1;
        r.phase = "idle";
      }

      // Smooth ease in-out
      const e = r.t < 0.5 ? 2 * r.t * r.t : -1 + (4 - 2 * r.t) * r.t;

      const arcHeight = r.fromPos.distanceTo(r.toPos) * 0.55;
      const x = r.fromPos.x + (r.toPos.x - r.fromPos.x) * e;
      const z = r.fromPos.z + (r.toPos.z - r.fromPos.z) * e;
      const y = 0.3 + Math.sin(r.t * Math.PI) * arcHeight;

      rocketRef.current.position.set(x, y, z);
      r.curPos.set(x, y, z);

      // Orient nose toward direction of travel
      const dx = r.toPos.x - r.fromPos.x;
      const dz = r.toPos.z - r.fromPos.z;
      rocketRef.current.rotation.y = Math.atan2(dx, dz);
      rocketRef.current.rotation.x = Math.cos(r.t * Math.PI) * 0.55;

      // Flame on full during flight
      const pulse = 0.85 + Math.sin(clock.elapsedTime * 22) * 0.15;
      if (flameRef.current) {
        flameRef.current.scale.setScalar(pulse);
        flameRef.current.material.opacity = 0.85;
      }
      if (flame2Ref.current) {
        flame2Ref.current.scale.setScalar(pulse);
        flame2Ref.current.material.opacity = 0.95;
      }
    } else {
      // Idle — hover slowly near current destination planet
      const dest = getPlanetPos(activePlanet);
      const t2 = clock.elapsedTime * 0.28;
      const hx = dest.x + Math.cos(t2) * 1.6;
      const hz = dest.z + Math.sin(t2) * 1.6;
      const hy = 0.3 + Math.sin(t2 * 0.6) * 0.25;
      rocketRef.current.position.set(hx, hy, hz);
      r.curPos.set(hx, hy, hz);
      rocketRef.current.rotation.y = t2 + Math.PI / 2;
      rocketRef.current.rotation.x = Math.sin(t2 * 0.4) * 0.1;

      // Dim idle flame
      if (flameRef.current) flameRef.current.material.opacity = 0.2;
      if (flame2Ref.current) flame2Ref.current.material.opacity = 0.25;
    }
  });

  // Scale: 3× larger than before — clearly visible from top-down camera
  const SC = 2.5;

  return (
    <group ref={rocketRef} scale={[0.7, 0.7, 0.7]}>
      {/* Main body */}
      <mesh>
        <cylinderGeometry args={[0.19 * SC, 0.32 * SC, 1.7 * SC, 10]} />
        <meshStandardMaterial
          color="#dde6f0"
          emissive="#8899aa"
          emissiveIntensity={0.35}
          metalness={0.85}
          roughness={0.15}
        />
      </mesh>
      {/* Upper fuselage taper */}
      <mesh position={[0, 0.9 * SC, 0]}>
        <cylinderGeometry args={[0.13 * SC, 0.19 * SC, 0.5 * SC, 10]} />
        <meshStandardMaterial
          color="#c8d8e8"
          emissive="#778899"
          emissiveIntensity={0.3}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      {/* Nose cone */}
      <mesh position={[0, 1.3 * SC, 0]}>
        <coneGeometry args={[0.13 * SC, 0.7 * SC, 10]} />
        <meshStandardMaterial
          color="#00f5c8"
          emissive="#00c8a0"
          emissiveIntensity={0.9}
          metalness={0.5}
          roughness={0.25}
        />
      </mesh>
      {/* Nose tip glow */}
      <mesh position={[0, 1.72 * SC, 0]}>
        <sphereGeometry args={[0.06 * SC, 8, 8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
      </mesh>

      {/* Fins — 4 symmetrical */}
      {[0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].map((angle, i) => (
        <mesh
          key={i}
          position={[
            Math.sin(angle) * 0.38 * SC,
            -0.65 * SC,
            Math.cos(angle) * 0.38 * SC,
          ]}
          rotation={[0, angle, 0.42]}
        >
          <boxGeometry args={[0.36 * SC, 0.55 * SC, 0.07 * SC]} />
          <meshStandardMaterial
            color="#7c3aed"
            emissive="#4a1a99"
            emissiveIntensity={0.6}
            metalness={0.4}
            roughness={0.4}
          />
        </mesh>
      ))}

      {/* Engine cluster — 3 nozzles */}
      {[
        [-0.15 * SC, 0],
        [0.15 * SC, 0],
        [0, 0.18 * SC],
      ].map(([nx, nz], i) => (
        <mesh key={i} position={[nx, -0.95 * SC, nz]}>
          <cylinderGeometry args={[0.09 * SC, 0.16 * SC, 0.28 * SC, 8]} />
          <meshStandardMaterial color="#333" metalness={0.95} roughness={0.1} />
        </mesh>
      ))}

      {/* Main exhaust flame */}
      <mesh ref={flameRef} position={[0, -1.35 * SC, 0]}>
        <coneGeometry args={[0.22 * SC, 1.1 * SC, 10]} />
        <meshBasicMaterial color="#f97316" transparent opacity={0.8} />
      </mesh>
      {/* Inner hot core flame */}
      <mesh ref={flame2Ref} position={[0, -1.1 * SC, 0]}>
        <coneGeometry args={[0.12 * SC, 0.65 * SC, 8]} />
        <meshBasicMaterial color="#FDB813" transparent opacity={0.95} />
      </mesh>
      {/* Flame glow halo */}
      <mesh position={[0, -1.25 * SC, 0]}>
        <sphereGeometry args={[0.35 * SC, 8, 8]} />
        <meshBasicMaterial color="#f97316" transparent opacity={0.06} />
      </mesh>

      {/* Porthole windows — 2 */}
      {[0.28, -0.15].map((yOff, i) => (
        <mesh key={i} position={[0.2 * SC, yOff * SC, 0.195 * SC]}>
          <circleGeometry args={[0.075 * SC, 10]} />
          <meshBasicMaterial color="#88ddff" transparent opacity={0.88} />
        </mesh>
      ))}

      {/* Teal accent stripe */}
      <mesh position={[0, 0.28 * SC, 0]}>
        <cylinderGeometry args={[0.195 * SC, 0.195 * SC, 0.12 * SC, 10]} />
        <meshBasicMaterial color="#00f5c8" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

/** Main solar system — top-down view, camera tracks active planet */
function SolarSystemScene({ activePlanet }) {
  const { camera } = useThree();
  const camPos = useRef(new THREE.Vector3(0, 55, 0.1));
  const camLook = useRef(new THREE.Vector3(0, 0, 0));
  const isHero = activePlanet === "hero";

  useFrame(() => {
    const idx = PLANETS.findIndex((p) => p.id === activePlanet);
    const planet = PLANETS[idx];
    if (!planet) return;

    const a = orbitalAngles[planet.id];
    const px = planet.orbitR === 0 ? 0 : Math.cos(a) * planet.orbitR;
    const pz = planet.orbitR === 0 ? 0 : Math.sin(a) * planet.orbitR;

    let targetH, targetX, targetZ, lookX, lookZ;

    if (isHero) {
      // Hero — wide enough to show entire solar system incl. Neptune at orbitR 23
      targetH = 78;
      targetX = 0;
      targetZ = 5;
      lookX = 0;
      lookZ = 0;
    } else {
      // Follow active planet — zoom in progressively for outer planets
      const baseH = 26 + idx * 3.2;
      targetH = Math.min(baseH, 72);
      targetX = px * 0.45;
      targetZ = pz * 0.45 + 2;
      lookX = px * 0.25;
      lookZ = pz * 0.25;
    }

    camPos.current.set(targetX, targetH, targetZ);
    camLook.current.set(lookX, 0, lookZ);

    camera.position.lerp(camPos.current, isHero ? 0.04 : 0.022);
    camera.lookAt(camLook.current);
  });

  return (
    <>
      <StarField />
      <pointLight
        position={[0, 2, 0]}
        intensity={4}
        color="#FDB813"
        distance={150}
        decay={1.2}
      />
      <ambientLight intensity={0.1} />
      <directionalLight
        position={[0, 40, 0]}
        intensity={0.25}
        color="#ffffff"
      />

      {PLANETS.filter((p) => p.orbitR > 0).map((p) => (
        <OrbitPath
          key={p.id}
          radius={p.orbitR}
          active={p.id === activePlanet}
        />
      ))}

      {PLANETS.map((p) => (
        <Planet key={p.id} planet={p} active={p.id === activePlanet} />
      ))}

      {/* Rocket spacecraft */}
      <Rocket activePlanet={activePlanet} />
    </>
  );
}

/** Scroll hook — returns which section is currently in view */
function useActivePlanet() {
  const [active, setActive] = useState("hero");
  useEffect(() => {
    const sectionIds = PLANETS.map((p) => p.id);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { threshold: 0.3 },
    );
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);
  return active;
}

/** Planet HUD badge — bottom center */
function PlanetHUD({ active }) {
  const planet = PLANETS.find((p) => p.id === active);
  if (!planet || planet.name === "Sun") return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: "1.75rem",
        right: "20px",
        left: "auto",
        transform: "none",
        zIndex: 10,
        pointerEvents: "none",
        textAlign: "center",
        animation: "fadeUp .4s both",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: ".65rem",
          background: "rgba(6,10,20,0.55)",
          backdropFilter: "blur(14px)",
          border: `1px solid ${planet.color}55`,
          borderRadius: "999px",
          padding: ".42rem 1.2rem",
          boxShadow: `0 0 20px ${planet.color}22`,
        }}
      >
        <span
          style={{
            width: 9,
            height: 9,
            borderRadius: "50%",
            flexShrink: 0,
            display: "inline-block",
            background: planet.color,
            boxShadow: `0 0 10px ${planet.color}`,
          }}
        />
        <span
          style={{
            fontFamily: "'DM Mono',monospace",
            fontSize: ".63rem",
            letterSpacing: ".16em",
            textTransform: "uppercase",
            color: "#e2e8f0",
          }}
        >
          {planet.name}
        </span>
        <span
          style={{
            width: 1,
            height: 12,
            background: "rgba(255,255,255,0.15)",
            display: "inline-block",
          }}
        />
        <span
          style={{
            fontFamily: "'DM Mono',monospace",
            fontSize: ".6rem",
            color: planet.color,
            letterSpacing: ".08em",
          }}
        >
          {planet.name === "Earth"
            ? "📍 Bengaluru, India"
            : planet.desc || active.replace("-", " ")}
        </span>
      </div>
    </div>
  );
}

/** Animated particle field + 2 floating tori for the hero bg — KEPT for fallback */
function HeroScene() {
  const pts = useRef();
  const t1 = useRef();
  const t2 = useRef();
  const mouseRef = useRef([0, 0]);

  useEffect(() => {
    const handler = (e) => {
      mouseRef.current = [
        (e.clientX / window.innerWidth - 0.5) * 0.5,
        -(e.clientY / window.innerHeight - 0.5) * 0.5,
      ];
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  const count = 1800;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
  }

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const [mx, my] = mouseRef.current;
    if (pts.current) {
      pts.current.rotation.y = t * 0.04 + mx * 0.3;
      pts.current.rotation.x = t * 0.02 + my * 0.2;
    }
    if (t1.current) {
      t1.current.rotation.x = t * 0.3;
      t1.current.rotation.y = t * 0.5;
    }
    if (t2.current) {
      t2.current.rotation.x = -t * 0.4;
      t2.current.rotation.z = t * 0.3;
    }
  });

  return (
    <>
      <points ref={pts}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#00f5c8"
          size={0.025}
          transparent
          opacity={0.55}
        />
      </points>
      <mesh ref={t1} position={[3, 1, -4]}>
        <torusGeometry args={[1.5, 0.4, 12, 60]} />
        <meshBasicMaterial
          color="#7c3aed"
          wireframe
          transparent
          opacity={0.12}
        />
      </mesh>
      <mesh ref={t2} position={[-4, -2, -3]}>
        <torusGeometry args={[1, 0.25, 12, 50]} />
        <meshBasicMaterial
          color="#00f5c8"
          wireframe
          transparent
          opacity={0.08}
        />
      </mesh>
    </>
  );
}

/** Icosahedron + orbiting spheres for the About section */
function AboutScene() {
  const ico1 = useRef(),
    ico2 = useRef();
  const orbs = useRef(
    Array.from({ length: 5 }, (_, i) => ({
      ref: { current: null },
      angle: (i / 5) * Math.PI * 2,
      radius: 2.2,
      speed: 0.3 + i * 0.1,
      color: i % 2 === 0 ? "#00f5c8" : "#f97316",
    })),
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ico1.current) {
      ico1.current.rotation.x = t * 0.3;
      ico1.current.rotation.y = t * 0.5;
    }
    if (ico2.current) {
      ico2.current.rotation.x = -t * 0.15;
      ico2.current.rotation.z = t * 0.2;
    }
    orbs.current.forEach((o) => {
      o.angle += o.speed * 0.01;
      if (o.ref.current) {
        o.ref.current.position.set(
          Math.cos(o.angle) * o.radius,
          Math.sin(o.angle * 0.7) * 0.8,
          Math.sin(o.angle) * o.radius,
        );
      }
    });
  });

  return (
    <>
      <mesh ref={ico1}>
        <icosahedronGeometry args={[1.5, 1]} />
        <meshBasicMaterial
          color="#00f5c8"
          wireframe
          transparent
          opacity={0.25}
        />
      </mesh>
      <mesh ref={ico2}>
        <icosahedronGeometry args={[2, 1]} />
        <meshBasicMaterial
          color="#7c3aed"
          wireframe
          transparent
          opacity={0.1}
        />
      </mesh>
      {orbs.current.map((o, i) => (
        <mesh key={i} ref={o.ref}>
          <sphereGeometry args={[0.08, 6, 6]} />
          <meshBasicMaterial color={o.color} />
        </mesh>
      ))}
    </>
  );
}

/** Torus knot for MLOps project card */
function TorusKnotScene() {
  const mesh = useRef(),
    mesh2 = useRef();
  useFrame(() => {
    if (mesh.current) {
      mesh.current.rotation.x += 0.008;
      mesh.current.rotation.y += 0.012;
    }
    if (mesh2.current) {
      mesh2.current.rotation.x += 0.005;
      mesh2.current.rotation.y += 0.008;
    }
  });
  return (
    <>
      <mesh ref={mesh}>
        <torusKnotGeometry args={[0.9, 0.28, 100, 16]} />
        <meshBasicMaterial
          color="#00f5c8"
          wireframe
          transparent
          opacity={0.55}
        />
      </mesh>
      <mesh ref={mesh2}>
        <torusKnotGeometry args={[1.2, 0.1, 60, 8]} />
        <meshBasicMaterial
          color="#7c3aed"
          wireframe
          transparent
          opacity={0.2}
        />
      </mesh>
    </>
  );
}

/** Octahedron cluster for QuantForge project card */
function OctaClusterScene() {
  const refs = useRef(
    Array.from({ length: 6 }, (_, i) => ({
      ref: { current: null },
      pos: [
        (Math.random() - 0.5) * 2.5,
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 1,
      ],
      size: 0.3 + Math.random() * 0.3,
      color: i % 2 === 0 ? "#f97316" : "#7c3aed",
      sx: 0.5 + i * 0.1,
      sy: 0.3 + i * 0.15,
    })),
  );
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    refs.current.forEach((o) => {
      if (o.ref.current) {
        o.ref.current.rotation.x = t * o.sx;
        o.ref.current.rotation.y = t * o.sy;
      }
    });
  });
  return (
    <>
      {refs.current.map((o, i) => (
        <mesh key={i} ref={o.ref} position={o.pos}>
          <octahedronGeometry args={[o.size, 0]} />
          <meshBasicMaterial
            color={o.color}
            wireframe
            transparent
            opacity={0.65}
          />
        </mesh>
      ))}
    </>
  );
}

/** Concentric rings for Movie platform project card */
function RingsScene() {
  const ringRefs = useRef([]);
  const config = [
    { r: 0.5, tilt: 0.3, speed: 0.022, color: "#00f5c8", op: 0.75 },
    { r: 0.88, tilt: 0.7, speed: -0.015, color: "#f97316", op: 0.55 },
    { r: 1.25, tilt: 1.1, speed: 0.012, color: "#7c3aed", op: 0.4 },
    { r: 1.6, tilt: 1.45, speed: -0.019, color: "#00f5c8", op: 0.25 },
  ];
  useFrame(() => {
    ringRefs.current.forEach((r, i) => {
      if (r) r.rotation.z += config[i].speed;
    });
  });
  return (
    <>
      {config.map((c, i) => (
        <mesh
          key={i}
          ref={(el) => (ringRefs.current[i] = el)}
          rotation={[Math.PI / 2 + c.tilt, 0, 0]}
        >
          <torusGeometry args={[c.r, 0.04, 8, 64]} />
          <meshBasicMaterial color={c.color} transparent opacity={c.op} />
        </mesh>
      ))}
      <mesh>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial color="#00f5c8" />
      </mesh>
    </>
  );
}

/* ─────────────────────────────────────────────
   REUSABLE CANVAS WRAPPER
───────────────────────────────────────────── */
function R3FCanvas({
  children,
  camera = { position: [0, 0, 4], fov: 60 },
  style,
}) {
  return (
    <Canvas
      camera={camera}
      gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
      style={{ background: "transparent", ...style }}
      dpr={Math.min(window.devicePixelRatio, 1.5)}
    >
      <Suspense fallback={null}>{children}</Suspense>
    </Canvas>
  );
}

/* ─────────────────────────────────────────────
   SCROLL REVEAL HOOK
───────────────────────────────────────────── */
function useReveal(selector) {
  useEffect(() => {
    const els = document.querySelectorAll(selector);
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("vis");
        });
      },
      { threshold: 0.12 },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [selector]);
}

/* ─────────────────────────────────────────────
   MARQUEE DATA
───────────────────────────────────────────── */
const MARQUEE_ITEMS = [
  "React.js",
  "Node.js",
  "TypeScript",
  "MongoDB",
  "PostgreSQL",
  "Docker",
  "MLflow",
  "LangChain",
  "HuggingFace",
  "Agentic AI",
  "CI/CD",
  "REST APIs",
  "JWT & OAuth",
  "Tailwind CSS",
  "Next.js",
  "Express",
  "Prisma ORM",
];

/* ─────────────────────────────────────────────
   CONTACT FORM — EmailJS
   Replace the three constants below with your
   actual EmailJS credentials from emailjs.com
───────────────────────────────────────────── */
const EJS_SERVICE_ID = "service_bilgko9";
const EJS_TEMPLATE_ID = "template_cd9bipe";
const EJS_PUBLIC_KEY = "xkGUVR99aXXAnn7oD";

function ContactForm() {
  const formRef = useRef();
  const [fields, setFields] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState(null); // null | "sending" | "ok" | "err"

  const set = (k) => (e) => setFields((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fields.name || !fields.email || !fields.message) {
      setStatus("err-empty");
      return;
    }
    setStatus("sending");
    try {
      await emailjs.sendForm(
        EJS_SERVICE_ID,
        EJS_TEMPLATE_ID,
        formRef.current,
        EJS_PUBLIC_KEY,
      );
      setStatus("ok");
      setFields({ name: "", email: "", subject: "", message: "" });
    } catch {
      setStatus("err");
    }
  };

  return (
    <form ref={formRef} className="cf-form" onSubmit={handleSubmit} noValidate>
      <div className="cf-row">
        <div className="cf-field">
          <label className="cf-label">Your Name</label>
          <input
            className="cf-input"
            name="name"
            type="text"
            placeholder="John Doe"
            value={fields.name}
            onChange={set("name")}
            required
          />
        </div>
        <div className="cf-field">
          <label className="cf-label">Your Email</label>
          <input
            className="cf-input"
            name="email"
            type="email"
            placeholder="john@example.com"
            value={fields.email}
            onChange={set("email")}
            required
          />
        </div>
      </div>
      <div className="cf-field">
        <label className="cf-label">Subject</label>
        <input
          className="cf-input"
          name="title"
          type="text"
          placeholder="Let's collaborate on something cool"
          value={fields.subject}
          onChange={set("subject")}
        />
      </div>
      <div className="cf-field">
        <label className="cf-label">Message</label>
        <textarea
          className="cf-textarea"
          name="message"
          placeholder="Tell me about your project or opportunity..."
          value={fields.message}
          onChange={set("message")}
          required
        />
      </div>

      {/* Hidden field so EmailJS knows who to send to */}
      <input type="hidden" name="to_name" value="Subha" />

      <button
        className="cf-submit"
        type="submit"
        disabled={status === "sending"}
      >
        {status === "sending" ? (
          <>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              style={{ animation: "spin .8s linear infinite" }}
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="#060a14"
                strokeWidth="3"
                strokeDasharray="40"
                strokeDashoffset="10"
              />
            </svg>
            Sending…
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
                stroke="#060a14"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Send Message
          </>
        )}
      </button>

      {status === "ok" && (
        <div className="cf-msg ok">
          ✓ Message sent! I'll get back to you soon.
        </div>
      )}
      {status === "err" && (
        <div className="cf-msg err">
          ✗ Something went wrong. Try again or email me directly.
        </div>
      )}
      {status === "err-empty" && (
        <div className="cf-msg err">
          ✗ Please fill in your name, email and message.
        </div>
      )}
    </form>
  );
}

/* ─────────────────────────────────────────────
   MAIN PORTFOLIO COMPONENT
───────────────────────────────────────────── */
export default function Portfolio() {
  const [menuOpen, setMenuOpen] = useState(false);
  const activePlanet = useActivePlanet();

  // Inject global CSS once
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = GLOBAL_CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Scroll reveal
  useReveal(".tl-item, .proj-card, .edu-card, .build-card, .dsa-card");

  // Smooth scroll nav — closes menu first, scrolls after drawer animation completes
  const scrollTo = (e, id) => {
    e.preventDefault();
    const wasOpen = menuOpen;
    setMenuOpen(false);

    const doScroll = () => {
      const el = document.querySelector(id);
      if (!el) return;
      const navH = document.querySelector("nav")?.offsetHeight ?? 70;
      const top = el.getBoundingClientRect().top + window.scrollY - navH - 12;
      window.scrollTo({ top, behavior: "smooth" });
    };

    // If menu was open, wait for the slide-out animation (400ms) before scrolling
    if (wasOpen) {
      setTimeout(doScroll, 420);
    } else {
      doScroll();
    }
  };

  const toggleMenu = () => {
    setMenuOpen((v) => !v);
  };

  // Sync body overflow — never lock scroll since drawer is a floating panel
  useEffect(() => {
    document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      {/* ── SOLAR SYSTEM BG (fixed, full-screen, scroll-reactive) ── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        <Canvas
          camera={{ position: [0, 78, 0.1], fov: 48, near: 0.1, far: 700 }}
          gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
          style={{ background: "transparent", width: "100%", height: "100%" }}
          dpr={Math.min(window.devicePixelRatio, 1.5)}
        >
          <Suspense fallback={null}>
            <SolarSystemScene activePlanet={activePlanet} />
          </Suspense>
        </Canvas>
      </div>

      {/* ── PLANET HUD LABEL ── */}
      <PlanetHUD active={activePlanet} />

      {/* ── NAV (desktop only links inside) ── */}
      <nav>
        <a
          className="nav-logo"
          href="#hero"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          SP<span>.</span>
        </a>
        {/* Desktop links */}
        <ul className="nav-desktop">
          {[
            ["#about", "About"],
            ["#skills", "Skills"],
            ["#experience", "Experience"],
            ["#projects", "Projects"],
            ["#contact", "Contact"],
          ].map(([id, label]) => (
            <li key={id}>
              <a href={id} onClick={(e) => scrollTo(e, id)}>
                {label}
              </a>
            </li>
          ))}
        </ul>
        {/* Hamburger — mobile only */}
        <button
          className={`nav-toggle${menuOpen ? " open" : ""}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      {/* ── MOBILE DRAWER — glassmorphism panel top-right ── */}
      <div
        className={`mobile-drawer${menuOpen ? " open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <div className="mobile-drawer-bg" />
        <ul className="drawer-links">
          {[
            ["#about", "About"],
            ["#skills", "Skills"],
            ["#experience", "Experience"],
            ["#projects", "Projects"],
            ["#contact", "Contact"],
          ].map(([id, label]) => (
            <li key={id}>
              <a href={id} onClick={(e) => scrollTo(e, id)}>
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* ── HERO ── */}
      <section id="hero">
        <div className="hero-eyebrow fade-up d1">
          Final Year CS Engineer · Class of 2026
        </div>
        <h1 className="hero-name fade-up d2">
          Subha
          <span className="ghost">Pattanayak</span>
        </h1>
        <p className="hero-role fade-up d3">
          Full-Stack Developer &amp; AI Builder
        </p>
        <p className="hero-desc fade-up d3">
          Building intelligent, scalable, user-centric web systems — from sleek
          frontends to resilient backends and agentic AI pipelines.
        </p>
        <div className="hero-pills fade-up d4">
          {[
            "React.js",
            "Node.js",
            "TypeScript",
            "MongoDB",
            "Agentic AI",
            "MLOps",
            "Docker",
          ].map((p) => (
            <span key={p} className="pill">
              {p}
            </span>
          ))}
        </div>
        <div className="hero-btns fade-up d5">
          <a
            href="#projects"
            className="btn btn-fill"
            onClick={(e) => scrollTo(e, "#projects")}
          >
            View Projects
          </a>
          <a
            href="#contact"
            className="btn btn-ghost"
            onClick={(e) => scrollTo(e, "#contact")}
          >
            Get In Touch
          </a>
        </div>
        <div className="scroll-cue fade-up d6">
          <div className="scroll-bar" />
          <span>Scroll</span>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="marquee-wrap">
        <div className="marquee-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="marquee-item">
              <span className="marquee-dot" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── ABOUT ── */}
      <section id="about">
        <div className="section-inner">
          <div className="about-grid">
            <div className="about-canvas-wrap">
              <R3FCanvas
                camera={{ position: [0, 0, 5], fov: 50 }}
                style={{ width: "100%", height: "100%" }}
              >
                <AboutScene />
              </R3FCanvas>
            </div>
            <div>
              <div className="sec-label">About Me</div>
              <h2 className="sec-title">
                Crafting <span className="hl">experiences</span>
                <br />
                through code &amp; AI
              </h2>
              <p className="about-p">
                I'm a final-year Computer Science student at Jain University,
                Bengaluru, passionate about building end-to-end systems that
                solve real problems — from REST APIs to trading dashboards to ML
                experiment trackers.
              </p>
              <p className="about-p">
                Exploring Agentic AI with LangChain, LangFlow &amp; HuggingFace,
                while sharpening DSA skills on LeetCode with Java. I thrive at
                the intersection of great UX and solid engineering.
              </p>
              <div className="stats">
                {[
                  ["3+", "Full-Stack Projects"],
                  ["2", "Industry Roles"],
                  ["7.4", "CGPA"],
                ].map(([n, l]) => (
                  <div key={l} className="stat">
                    <div className="stat-n">{n}</div>
                    <div className="stat-l">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ── SKILLS ── */}
      <section id="skills">
        <div className="section-inner">
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <div className="sec-label" style={{ justifyContent: "center" }}>
              Technical Arsenal
            </div>
            <h2 className="sec-title">
              Skills &amp; <span className="hl">Technologies</span>
            </h2>
          </div>
          <div className="skills-grid">
            {[
              [
                "Languages",
                [
                  "JavaScript",
                  "TypeScript",
                  "Java",
                  "Python",
                  "C",
                  "PHP",
                  "HTML",
                  "CSS",
                ],
              ],
              [
                "Frameworks",
                [
                  "React.js",
                  "Next.js",
                  "Node.js",
                  "Express",
                  "Django",
                  "Tailwind CSS",
                ],
              ],
              ["Databases", ["MongoDB", "PostgreSQL", "SQL", "Prisma ORM"]],
              [
                "Auth & APIs",
                ["JWT", "OAuth", "NextAuth.js", "REST APIs", "TanStack Query"],
              ],
              [
                "DevOps & MLOps",
                ["Docker", "GitHub Actions", "MLflow", "CI/CD", "Cloud Deploy"],
              ],
              [
                "AI & ML",
                ["LangChain", "LangFlow", "HuggingFace", "RAG", "Agentic AI"],
              ],
            ].map(([cat, tags]) => (
              <div key={cat} className="sk-card glass fade-up">
                <div className="sk-cat">{cat}</div>
                <div className="sk-tags">
                  {tags.map((t) => (
                    <span key={t} className="sk-tag">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ── CURRENTLY BUILDING ── */}
      <section id="building">
        <div className="section-inner">
          <div className="sec-label">Right Now</div>
          <h2 className="sec-title">
            Currently <span className="hl">Building &amp; Learning</span>
          </h2>
          <div className="building-grid">
            {[
              {
                icon: "🤖",
                title: "Agentic AI with LangChain",
                desc: "Building RAG-powered agents using LangChain and LangFlow — multi-step pipelines that reason, retrieve, and respond autonomously.",
                color: C.accent,
                label: "Active",
              },
              {
                icon: "⚔️",
                title: "DSA in Java — LeetCode",
                desc: "Consistently solving DSA problems on LeetCode with Java, covering trees, graphs, DP, sliding window, and two-pointer patterns.",
                color: C.accent3,
                label: "Daily Practice",
              },
              {
                icon: "🧠",
                title: "HuggingFace & Fine-tuning",
                desc: "Exploring open-source models on HuggingFace — embeddings, tokenizers, and lightweight fine-tuning for custom use cases.",
                color: C.accent,
                label: "Exploring",
              },
            ].map(({ icon, title, desc, color, label }, i) => (
              <div key={i} className="build-card glass">
                <div className="build-icon">{icon}</div>
                <div className="build-title">{title}</div>
                <div className="build-desc">{desc}</div>
                <div className="build-status">
                  <span className="sdot" style={{ background: color }} />
                  <span style={{ color }}>{label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ── EXPERIENCE ── */}
      <section id="experience">
        <div className="section-inner">
          <div className="sec-label">Work History</div>
          <h2 className="sec-title">
            Professional <span className="hl">Experience</span>
          </h2>
          <div className="timeline">
            <div className="tl-item">
              <div className="tl-dot" />
              <div className="tl-date">May 2025 – Oct 2025</div>
              <div className="tl-role">Full Stack Developer</div>
              <div className="tl-company">
                RegistrationWallah.com · Freelance · Remote
              </div>
              <ul className="tl-list">
                <li>
                  Built the official website from scratch using the MERN Stack
                  with JWT authentication
                </li>
                <li>
                  Integrated WhatsApp API for real-time customer chat
                  communication
                </li>
                <li>
                  Built a custom ChatBot trained on company data for handling
                  routine queries
                </li>
              </ul>
            </div>
            <div className="tl-item">
              <div
                className="tl-dot"
                style={{
                  background: C.accent2,
                  boxShadow: `0 0 0 3px rgba(124,58,237,.15)`,
                }}
              />
              <div className="tl-date" style={{ color: C.accent2 }}>
                Jun 2024 – Jul 2024
              </div>
              <div className="tl-role">Backend Developer Intern</div>
              <div className="tl-company">
                Zortech Solutions Pvt. Ltd. · Remote
              </div>
              <ul className="tl-list">
                <li>
                  Developed REST APIs for internal services using Node.js and
                  Express
                </li>
                <li>
                  Implemented JWT-based authentication and MongoDB queries for
                  secure data retrieval
                </li>
                <li>
                  Collaborated with frontend team to define request structures
                  and improve performance
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ── PROJECTS ── */}
      <section id="projects">
        <div className="section-inner">
          <div className="sec-label">Selected Work</div>
          <h2 className="sec-title">
            Featured <span className="hl">Projects</span>
          </h2>
          <div className="proj-grid">
            {[
              {
                id: "pc1",
                yr: "2026",
                title: "MLOps — Experiment Tracker",
                desc: "ML experiment tracking with MLflow Model Registry, lifecycle management, versioning & reproducibility. Docker-deployed with REST API triggers.",
                stack: ["Python", "MLflow", "Docker", "REST APIs", "Cloud"],
                Scene: TorusKnotScene,
              },
              {
                id: "pc2",
                yr: "2025",
                title: "QuantForge — AI Trading Platform",
                desc: "Crypto dashboard with AI-generated BUY/SELL/HOLD signals across 15+ pairs. Strategy Builder with CRUD, backtesting & live TanStack Query feed.",
                stack: ["React.js", "TypeScript", "PostgreSQL", "Recharts"],
                Scene: OctaClusterScene,
              },
              {
                id: "pc3",
                yr: "2024",
                title: "Movie Streaming Platform",
                desc: "Full-stack streaming site with personalized recommendation engine based on watch history & genre preferences. TMDB API for real-time data & metadata.",
                stack: ["React.js", "TypeScript", "MongoDB", "TMDB API"],
                Scene: RingsScene,
              },
            ].map(({ id, yr, title, desc, stack, Scene }) => (
              <div key={id} className="proj-card glass">
                <div className="proj-canvas-wrap">
                  <R3FCanvas
                    camera={{ position: [0, 0, 4], fov: 60 }}
                    style={{ width: "100%", height: "100%" }}
                  >
                    <Scene />
                  </R3FCanvas>
                </div>
                <div className="proj-body">
                  <div className="proj-yr">{yr}</div>
                  <div className="proj-title">{title}</div>
                  <p className="proj-desc">{desc}</p>
                  <div className="proj-stack">
                    {stack.map((s) => (
                      <span key={s} className="proj-tag">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ── EDUCATION ── */}
      <section id="education">
        <div className="section-inner">
          <div className="sec-label">Academic Background</div>
          <h2 className="sec-title">Education</h2>
          <div className="edu-grid">
            {[
              {
                deg: "B.Tech — Computer Science Engineering",
                school: "Jain (Deemed-to-be) University, Bengaluru",
                yr: "2022 – 2026",
                score: "7.4",
                unit: "CGPA",
                label: "Current Score",
              },
              {
                deg: "Class XII — Science Stream",
                school: "DAV Public School, Raniganj",
                yr: "2021",
                score: "83",
                unit: "%",
                label: "Final Score",
              },
              {
                deg: "Class X",
                school: "Hem Sheela Model School, Durgapur",
                yr: "2019",
                score: "89",
                unit: "%",
                label: "Final Score",
              },
            ].map(({ deg, school, yr, score, unit, label }) => (
              <div key={deg} className="edu-card glass">
                <div className="edu-deg">{deg}</div>
                <div className="edu-school">{school}</div>
                <div className="edu-yr">{yr}</div>
                <div className="edu-score-wrap">
                  <div className="edu-score">
                    {score}
                    <span style={{ fontSize: "1rem", color: C.muted }}>
                      {unit}
                    </span>
                  </div>
                  <div className="edu-slabel">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ── DSA ── */}
      <section id="dsa">
        <div className="section-inner">
          <div className="sec-label">Coding Practice</div>
          <h2 className="sec-title">
            Competitive <span className="hl">Programming</span>
          </h2>
          <div className="dsa-inner">
            <div className="dsa-card glass">
              <div className="dsa-platform">LeetCode</div>
              <div className="dsa-title">Data Structures &amp; Algorithms</div>
              <div className="dsa-desc">
                Actively solving DSA problems with Java — focusing on arrays,
                linked lists, binary trees, dynamic programming, graphs, and
                two-pointer techniques.
              </div>
              <div className="dsa-badges">
                {[
                  "Arrays",
                  "Trees",
                  "Graphs",
                  "Dynamic Programming",
                  "Sliding Window",
                  "Java",
                ].map((b) => (
                  <span key={b} className="dsa-badge">
                    {b}
                  </span>
                ))}
              </div>
            </div>
            <div className="dsa-card glass">
              <div className="dsa-platform">CodeChef</div>
              <div className="dsa-title">Competitive Programming</div>
              <div className="dsa-desc">
                Participating in rated contests on CodeChef to sharpen
                algorithmic thinking under time pressure — greedy algorithms,
                number theory, and binary search.
              </div>
              <div className="dsa-badges">
                {[
                  "Greedy",
                  "Binary Search",
                  "Maths",
                  "Sorting",
                  "Contest Rated",
                ].map((b) => (
                  <span key={b} className="dsa-badge p">
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ── CONTACT ── */}
      <section id="contact">
        <div className="section-inner">
          <div className="contact-wrap">
            <div className="sec-label" style={{ justifyContent: "center" }}>
              Let's Connect
            </div>
            <h2 className="contact-title">
              Got an idea?
              <span className="outline">Let's build it.</span>
            </h2>
            <p
              style={{
                fontSize: ".78rem",
                color: C.muted,
                maxWidth: "400px",
                margin: "0 auto",
                lineHeight: 1.9,
              }}
            >
              Open to internships, full-time roles, freelance work &amp;
              exciting collaborations. I reply fast.
            </p>

            <ContactForm />
            <div className="cinfo-grid">
              {[
                ["Phone", "+91 9883891806"],
                ["Location", "Bengaluru, Karnataka"],
                ["Availability", "Open to Opportunities", C.accent],
                ["Graduating", "May 2026 · B.Tech CS"],
              ].map(([label, val, color]) => (
                <div key={label} className="cinfo-card glass">
                  <div className="cinfo-label">{label}</div>
                  <div className="cinfo-val" style={color ? { color } : {}}>
                    {val}
                  </div>
                </div>
              ))}
            </div>
            <div className="socials">
              {[
                [
                  "LinkedIn",
                  "https://www.linkedin.com/in/subha-pattanayak-8a8165254",
                ],
                ["GitHub", "https://github.com/DevOP67?tab=repositories"],
                ["LeetCode", "https://leetcode.com/subha_pattanayak"],
              ].map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  className="soc"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer>
        <span>
          © 2026 Subha Pattanayak <p>Built with React &amp; R3F </p>
        </span>
        {/* <span>Built with React &amp; R3F</span> */}
      </footer>
    </div>
  );
}
//https://github.com/DevOP67
//https://www.linkedin.com/in/subha-pattanayak-8a8165254/
//https://leetcode.com/subha_pattanayak/
