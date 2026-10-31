"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import LivingWorld from "@/components/LivingWorld";
import AudioToggle from "@/components/AudioToggle";
import QuietDialog from "@/components/QuietDialog";
import StarIcon from "@/components/StarIcon";
import DiagonalArrow from "@/components/DiagonalArrow";
import { chapters, memorial } from "@/lib/memorial";

const sceneDurations = [0, 10000, 10000, 11000];
const Arrow = () => <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M4 12h15m-5-5 5 5-5 5" /></svg>;
const ReplayIcon = () => <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M4 10a8 8 0 1 1 1 7M4 4v6h6" /></svg>;

export default function Home() {
  const motionPreference = useReducedMotion();
  // CSS handles the initial preference while the first client render matches SSR.
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => { setReducedMotion(!!motionPreference); }, [motionPreference]);
  const [scene, setScene] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dialog, setDialog] = useState<"about" | "prayer" | null>(null);
  const [prayers, setPrayers] = useState<number[]>([]);
  const [prayerSent, setPrayerSent] = useState(false);
  const [worldReady, setWorldReady] = useState(false);
  const prayerTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const prayerStatusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remainingTime = useRef(0);
  const night = scene >= 2;
  const handleWorldReady = useCallback(() => setWorldReady(true), []);

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
    setScene(next); setPrayerSent(false); setPrayers([]); setPaused(false);
    prayerTimers.current.forEach(clearTimeout);
    prayerTimers.current = [];
    if (prayerStatusTimer.current) clearTimeout(prayerStatusTimer.current);
  }, []);

  function sendPrayer() {
    const id = Date.now();
    setPrayers(items => [...items.slice(-4), id]);
    setPrayerSent(true);
    prayerTimers.current.push(setTimeout(() => setPrayers(items => items.filter(item => item !== id)), 4200));
    if (prayerStatusTimer.current) clearTimeout(prayerStatusTimer.current);
    prayerStatusTimer.current = setTimeout(() => setPrayerSent(false), 7500);
  }

  const playbackControls = <div className="playback-controls">
    {!reducedMotion && <button className="icon-text-button" onClick={() => setPaused(value => !value)} aria-label={paused ? "Resume story" : "Pause story"}>
      {paused ? <svg aria-hidden="true" width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><path d="m3 1 8 5-8 5Z" /></svg> : <svg aria-hidden="true" width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><path d="M2 1h2v10H2zm6 0h2v10H8z" /></svg>}
      <span>{paused ? "Resume story" : "Pause story"}</span>
    </button>}
    <button className="continue-button" onClick={() => goTo(scene + 1)}>Continue <Arrow /></button>
  </div>;

  return <main className={`memorial scene-${scene}${night ? " is-night" : ""}${reducedMotion ? " reduced-motion" : ""}`} data-world-ready={worldReady}>
    <header className="site-header">
      <a href="#" className="memory-mark" onClick={event => { event.preventDefault(); goTo(0); }} aria-label="Insha, return to opening"><StarIcon size={23} /><span>IN LOVING MEMORY<span className="mark-name">A little world, held in her light.</span></span></a>
      <div className="header-actions"><AudioToggle /><button className="about-button" aria-label="About this memorial" onClick={() => setDialog("about")}><span aria-hidden="true">i</span></button></div>
    </header>

    <div className={`world-stage${worldReady ? " world-ready" : ""}`}>
      <LivingWorld chapter={scene} reducedMotion={reducedMotion} prayerPulse={prayers.length} onReady={handleWorldReady} />
    </div>

    <div className="story" aria-live="polite" aria-atomic="true">
      <AnimatePresence mode="wait" initial={false}>
        <motion.section key={scene} className={`story-content story-content-${scene}`} initial={{ opacity: 0, y: reducedMotion ? 0 : 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reducedMotion ? 0 : -4 }} transition={{ duration: reducedMotion ? 0 : 1.25, ease: [.22, 1, .36, 1] }} aria-label={scene === 0 ? "In loving memory of Insha" : chapters[scene - 1]}>
          {scene === 0 && <>
            <div className="title-group"><h1 className="name-title">{memorial.name}</h1><p className="subtitle">{memorial.subtitle}</p></div>
            <p className="memorial-line">Some stars leave the earth,<br />but never leave our sky.</p>
            <div className="story-actions"><button className="begin-button" onClick={() => goTo(1)}><span>Enter the meadow</span><Arrow /></button><p className="begin-note">A quiet journey. Take your time.</p></div>
          </>}
          {scene === 1 && <>
            <div className="title-group"><p className="eyebrow">I &nbsp; / &nbsp; THE MEADOW</p><h1 className="chapter-title">Here, the world<br />slows down.</h1></div>
            <p className="chapter-copy">Let the quiet hold you for a moment.<br />There is nowhere else you need to be.</p>
            <div className="story-actions">{playbackControls}</div>
          </>}
          {scene === 2 && <>
            <div className="title-group"><p className="eyebrow">II &nbsp; / &nbsp; NIGHTFALL</p><h1 className="chapter-title">And softly,<br />the stars arrive.</h1></div>
            <p className="chapter-copy">The light we love never really leaves.<br />Sometimes, it finds another way to shine.</p>
            <div className="story-actions">{playbackControls}</div>
          </>}
          {scene === 3 && <>
            <div className="title-group"><p className="eyebrow">III &nbsp; / &nbsp; YOUR LIGHT</p><h1 className="chapter-title">Among the stars,<br />there is you.</h1></div>
            <p className="chapter-copy">A little brighter. A little closer.<br />Always, Insha.</p>
            <div className="story-actions">{playbackControls}</div>
          </>}
          {scene === 4 && <>
            <div className="title-group"><p className="eyebrow">FOREVER IN OUR SKY</p><h1 className="name-title final-name">{memorial.name}</h1><p className="subtitle">{memorial.subtitle}</p></div>
            <p className="memorial-line final-line">{memorial.line}</p>
            <div className="story-actions"><button className="begin-button prayer-button" onClick={sendPrayer}><span className="prayer-icon"><StarIcon size={15} />{prayers.map(id => <span key={id} className="prayer-spark" aria-hidden="true" />)}</span><span>{prayerSent ? "Held in the light" : "Send a little prayer"}</span></button><button className="text-button read-prayer" onClick={() => setDialog("prayer")}>A moment of prayer <DiagonalArrow /></button></div>
          </>}
        </motion.section>
      </AnimatePresence>
    </div>

    <div role="status" className={`prayer-status${prayerSent ? " visible" : ""}`}>{prayerSent ? "Your prayer joins the light." : ""}</div>
    <footer className="scene-footer">
      <p className="footer-dedication"><StarIcon size={11} /> A LIFE OF LOVE. AN ENDLESS LIGHT.</p>
      <nav className="chapter-nav" aria-label="Journey chapters">
        {chapters.map((chapter, index) => <button key={chapter} className={`chapter-button${(scene === 0 && index === 0) || scene === index + 1 ? " current" : ""}${scene > index + 1 ? " visited" : ""}`} onClick={() => goTo(index + 1)} aria-current={scene === index + 1 ? "step" : undefined} aria-label={`Go to ${chapter}`}>
          <span className="chapter-track"><span key={scene} className={scene === index + 1 && scene < 4 && !reducedMotion ? "track-progress" : ""} style={{ animationDuration: `${sceneDurations[scene] || 1}ms`, animationPlayState: paused || dialog ? "paused" : "running" }} /></span>
          <span className="chapter-label"><span className="chapter-number">0{index + 1}</span>{chapter}</span>
        </button>)}
      </nav>
      {scene === 4 ? <button className="icon-text-button replay-button" onClick={() => goTo(0)}><ReplayIcon />Experience again</button> : <p className="footer-note">Drag to explore<span />Scroll to look closer</p>}
    </footer>
    <QuietDialog kind={dialog} onClose={() => setDialog(null)} />
  </main>;
}
