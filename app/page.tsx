"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import AnimatedSky from "@/components/AnimatedSky";
import MeadowScene from "@/components/MeadowScene";
import AudioToggle from "@/components/AudioToggle";
import QuietDialog from "@/components/QuietDialog";
import StarIcon from "@/components/StarIcon";
import DiagonalArrow from "@/components/DiagonalArrow";
import { chapters, memorial } from "@/lib/memorial";

const sceneDurations = [0, 10000, 10000, 11000];
const Arrow = () => <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M4 12h15m-5-5 5 5-5 5" /></svg>;

export default function Home() {
  const motionPreference = useReducedMotion();
  // Keep the server and first client render identical, then apply the visitor's
  // preference. The CSS media query already prevents motion before hydration.
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => { setReducedMotion(!!motionPreference); }, [motionPreference]);
  const [scene, setScene] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dialog, setDialog] = useState<"about" | "prayer" | null>(null);
  const [prayers, setPrayers] = useState<number[]>([]);
  const [prayerSent, setPrayerSent] = useState(false);
  const landscapeRef = useRef<HTMLDivElement>(null);
  const prayerTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const prayerStatusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remainingTime = useRef(0);
  const night = scene >= 2;

  useEffect(() => { remainingTime.current = sceneDurations[scene] || 0; }, [scene]);

  useEffect(() => {
    if (scene === 0 || scene >= 4 || paused || dialog || reducedMotion) return;
    const started = performance.now();
    const timer = setTimeout(() => setScene(s => Math.min(s + 1, 4)), remainingTime.current);
    return () => {
      clearTimeout(timer);
      remainingTime.current = Math.max(0, remainingTime.current - (performance.now() - started));
    };
  }, [scene, paused, dialog, reducedMotion]);

  useEffect(() => () => {
    prayerTimers.current.forEach(clearTimeout);
    if (prayerStatusTimer.current) clearTimeout(prayerStatusTimer.current);
  }, []);

  const goTo = useCallback((next: number) => {
    setScene(next);
    setPrayerSent(false);
    setPrayers([]);
    prayerTimers.current.forEach(clearTimeout);
    prayerTimers.current = [];
    if (prayerStatusTimer.current) clearTimeout(prayerStatusTimer.current);
    setPaused(false);
  }, []);

  function sendPrayer() {
    const id = Date.now();
    setPrayers(items => [...items.slice(-4), id]);
    setPrayerSent(true);
    prayerTimers.current.push(setTimeout(() => setPrayers(items => items.filter(item => item !== id)), 4200));
    if (prayerStatusTimer.current) clearTimeout(prayerStatusTimer.current);
    prayerStatusTimer.current = setTimeout(() => setPrayerSent(false), 7500);
  }

  const fade = reducedMotion ? 0 : 1.6;

  return <main className={`memorial scene-${scene}${night ? " is-night" : ""}${reducedMotion ? " reduced-motion" : ""}`} onPointerMove={event => {
    if (reducedMotion || event.pointerType === "touch") return;
    if (landscapeRef.current) {
      const x = (event.clientX / window.innerWidth - .5) * -5.5;
      const y = (event.clientY / window.innerHeight - .5) * -2;
      landscapeRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1.015)`;
    }
  }} onPointerLeave={() => { if (landscapeRef.current) landscapeRef.current.style.transform = "scale(1.015)"; }}>
    <div className="sky-base" />
    <div className="night-wash" />
    <div className="horizon-light" />
    <div className="sky-cloud cloud-one" />
    <div className="sky-cloud cloud-two" />
    <div className="moon" aria-hidden="true" />

    <div ref={landscapeRef} className="landscape-wrap">
      <MeadowScene night={night} />
    </div>
    <AnimatedSky night={night} reducedMotion={!!reducedMotion} />
    <div className="vignette" />
    <div className="film-grain" />
    {scene === 0 && <div className="opening-veil" aria-hidden="true" />}

    <header className="site-header">
      <a href="#" className="memory-mark" onClick={event => { event.preventDefault(); goTo(0); }} aria-label="Insha, return to opening">
        <StarIcon size={25} />
        <span>IN LOVING MEMORY<span className="mark-name">A little closer to the stars</span></span>
      </a>
      <div className="header-actions"><AudioToggle /><button className="about-button" aria-label="About this memorial" onClick={() => setDialog("about")}><span aria-hidden="true">i</span></button></div>
    </header>

    <button className={`brightest-star${scene >= 3 ? " star-awake" : ""}${prayers.length ? " star-prayer" : ""}`} onClick={() => { if (scene < 3) goTo(3); else sendPrayer(); }} aria-label={scene < 3 ? "Look to Insha’s star" : "Send a prayer to Insha’s star"}>
      <span className="star-halo" /><span className="star-halo-inner" /><StarIcon size={45} className="star-shape" /><span className="star-heart" />
      <span className="star-label">{scene < 3 ? "A light that stays" : "Insha’s star"}</span>
    </button>

    <div className="story" aria-live="polite" aria-atomic="true">
      <AnimatePresence mode="wait" initial={false}>
        <motion.section key={scene} className={`story-content story-content-${scene}`} initial={{ opacity: 0, y: reducedMotion ? 0 : 12, filter: reducedMotion ? "none" : "blur(5px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: reducedMotion ? 0 : -8, filter: reducedMotion ? "none" : "blur(4px)" }} transition={{ duration: fade, ease: [.22, 1, .36, 1] }} aria-label={scene === 0 ? "In loving memory of Insha" : chapters[scene - 1]}>
          {scene === 0 && <>
            <p className="eyebrow intro-eyebrow"><span /> FOREVER LOVED. FOREVER LIGHT. <span /></p>
            <h1 className="name-title">{memorial.name}</h1>
            <p className="subtitle">{memorial.subtitle}</p>
            <div className="little-rule" />
            <p className="memorial-line">Some stars leave the earth,<br />but never leave our sky.</p>
            <button className="begin-button" onClick={() => goTo(1)}><span>Enter the meadow</span><Arrow /></button>
            <p className="begin-note">A quiet journey, in her light.</p>
          </>}
          {scene === 1 && <>
            <p className="eyebrow">I &nbsp; / &nbsp; THE MEADOW</p>
            <h1 className="chapter-title">Here, the world<br />slows down.</h1>
            <p className="chapter-copy">Let the quiet hold you for a moment.<br />There is nowhere else you need to be.</p>
          </>}
          {scene === 2 && <>
            <p className="eyebrow">II &nbsp; / &nbsp; NIGHTFALL</p>
            <h1 className="chapter-title">And softly,<br />the stars arrive.</h1>
            <p className="chapter-copy">The light we love never really leaves.<br />Sometimes, it finds another way to shine.</p>
          </>}
          {scene === 3 && <>
            <p className="eyebrow">III &nbsp; / &nbsp; YOUR LIGHT</p>
            <h1 className="chapter-title">Among the stars,<br />there is you.</h1>
            <p className="chapter-copy">A little brighter. A little closer.<br />Always, Insha.</p>
          </>}
          {scene === 4 && <>
            <p className="eyebrow">FOREVER IN OUR SKY</p>
            <h1 className="name-title final-name">{memorial.name}</h1>
            <p className="subtitle">{memorial.subtitle}</p>
            <p className="memorial-line final-line">{memorial.line}</p>
            <button className="begin-button prayer-button" onClick={sendPrayer}><StarIcon size={17} /><span>{prayerSent ? "Held in the light" : "Send a little prayer"}</span></button>
            <button className="text-button read-prayer" onClick={() => setDialog("prayer")}>A moment of prayer <DiagonalArrow /></button>
          </>}
        </motion.section>
      </AnimatePresence>
    </div>

    <AnimatePresence>{prayers.map(id => <motion.div key={id} className="prayer-spark" aria-hidden="true" initial={{ opacity: 0, top: "76%", left: "50%", scale: .4 }} animate={reducedMotion ? { opacity: [0, 1, 0] } : { opacity: [0, .9, .9, 0], top: ["76%", "55%", "28%", "19%"], left: ["50%", "55%", "68%", "73%"], scale: [.4, 1, .6, .2] }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 1 : 4, ease: "easeInOut" }}><StarIcon size={15} /></motion.div>)}</AnimatePresence>
    <div role="status" className={`prayer-status${prayerSent ? " visible" : ""}`}>{prayerSent ? "Your prayer joins the light." : ""}</div>

    {scene > 0 && <div className="playback-controls">
      {scene < 4 ? <>
        {!reducedMotion && <button className="icon-text-button" onClick={() => setPaused(value => !value)} aria-label={paused ? "Resume story" : "Pause story"}>{paused ? <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="m3 1 8 5-8 5Z" /></svg> : <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M2 1h2v10H2zm6 0h2v10H8z" /></svg>}<span>{paused ? "Resume story" : "Pause story"}</span></button>}
        <button className="icon-text-button" onClick={() => goTo(scene + 1)}>Continue <Arrow /></button>
      </> : <button className="icon-text-button" onClick={() => goTo(0)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M4 10a8 8 0 1 1 1 7M4 4v6h6" /></svg>Experience again</button>}
    </div>}

    <footer className="scene-footer">
      <p className="footer-dedication"><span className="tiny-star">✧</span> A LIFE OF LOVE.<br /><span className="footer-second">AN ENDLESS LIGHT.</span></p>
      <nav className="chapter-nav" aria-label="Journey chapters">
        {chapters.map((chapter, index) => <button key={chapter} className={`chapter-button${(scene === 0 && index === 0) || scene === index + 1 ? " current" : ""}${scene > index + 1 ? " visited" : ""}`} onClick={() => goTo(index + 1)} aria-current={scene === index + 1 ? "step" : undefined} aria-label={`Go to ${chapter}`}>
          <span className="chapter-track"><span key={scene} className={scene === index + 1 && scene < 4 && !reducedMotion ? "track-progress" : ""} style={{ animationDuration: `${sceneDurations[scene] || 1}ms`, animationPlayState: paused || dialog ? "paused" : "running" }} /></span>
          <span className="chapter-label"><span className="chapter-number">0{index + 1}</span>{chapter}</span>
        </button>)}
      </nav>
      <p className="footer-note">Take a breath. Stay a while.<span>THIS LITTLE SKY IS ALWAYS HERE.</span></p>
    </footer>
    <QuietDialog kind={dialog} onClose={() => setDialog(null)} />
  </main>;
}
