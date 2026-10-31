"use client";

import { useReducedMotion } from "framer-motion";
import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import AudioToggle from "@/components/AudioToggle";
import StarIcon from "@/components/StarIcon";
import TownWorld from "@/components/TownWorld";
import { getTownTime, phaseLabel, type TownTime } from "@/lib/town/clock";
import { memorial } from "@/lib/memorial";

export default function Home() {
  const motionPreference = useReducedMotion();
  const [reducedMotion, setReducedMotion] = useState(false);
  const [time, setTime] = useState<TownTime | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dedicationOpen, setDedicationOpen] = useState(false);
  const [prayerPulse, setPrayerPulse] = useState(0);
  const [prayerSent, setPrayerSent] = useState(false);
  const starButton = useRef<HTMLButtonElement>(null);
  const dedication = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const prayerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Match the server's first render; the real local time is sampled on mount.
  useEffect(() => { setReducedMotion(!!motionPreference); }, [motionPreference]);
  useEffect(() => {
    const sampleTime = () => setTime(getTownTime());
    sampleTime();
    const timer = setInterval(sampleTime, 1_000);
    const onVisibility = () => { if (!document.hidden) sampleTime(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", onVisibility); };
  }, []);
  useEffect(() => () => { if (prayerTimer.current) clearTimeout(prayerTimer.current); }, []);

  const onReady = useCallback(() => setReady(true), []);
  const onError = useCallback((message: string) => setError(message), []);
  const closeDedication = useCallback(() => {
    setDedicationOpen(false);
    starButton.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!dedicationOpen) return;
    closeButton.current?.focus({ preventScroll: true });
    const dismissOutside = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && !dedication.current?.contains(target) && !starButton.current?.contains(target)) closeDedication();
    };
    const dismissWithKey = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); closeDedication(); } };
    document.addEventListener("pointerdown", dismissOutside);
    document.addEventListener("keydown", dismissWithKey);
    return () => { document.removeEventListener("pointerdown", dismissOutside); document.removeEventListener("keydown", dismissWithKey); };
  }, [dedicationOpen, closeDedication]);

  function offerPrayer() {
    setPrayerPulse(value => value + 1);
    setPrayerSent(true);
    if (prayerTimer.current) clearTimeout(prayerTimer.current);
    prayerTimer.current = setTimeout(() => setPrayerSent(false), 6000);
    if (dedicationOpen) closeDedication();
  }

  const night = time?.night ?? 1;
  const theme = night > .5 ? "theme-night" : "theme-day";
  const sceneStyle = { "--night": night } as CSSProperties;

  return <main className={`town-page ${theme}${reducedMotion ? " reduced-motion" : ""}`} style={sceneStyle} data-world-ready={ready} data-phase={time?.phase ?? "loading"}>
    <div className="town-stage" aria-label="Insha’s little world">
      {time && <TownWorld time={time} reducedMotion={reducedMotion} prayerPulse={prayerPulse} onReady={onReady} onError={onError} />}
    </div>
    <div className="town-atmosphere" aria-hidden="true" />
    <div className="town-footer-shade" aria-hidden="true" />

    <header className="town-header">
      <div className="town-identity">
        <p className="memorial-kicker">IN LOVING MEMORY</p>
        <h1 className="town-name">{memorial.name}</h1>
      </div>
      <AudioToggle />
    </header>

    <div className="star-place">
      <button ref={starButton} className="insha-star" type="button" aria-label="Insha’s star" aria-expanded={dedicationOpen} aria-haspopup="dialog" aria-controls="star-dedication" onClick={() => dedicationOpen ? closeDedication() : setDedicationOpen(true)}>
        <span className="star-halo" aria-hidden="true" />
        <span className="star-ray star-ray-vertical" aria-hidden="true" />
        <span className="star-ray star-ray-horizontal" aria-hidden="true" />
        <span className="star-core" aria-hidden="true" />
        <span className="star-whisper">Insha’s star</span>
      </button>
      {dedicationOpen && <div ref={dedication} className="star-dedication" id="star-dedication" role="dialog" aria-modal="false" aria-labelledby="star-dedication-name" aria-describedby="star-dedication-line">
        <button ref={closeButton} className="dedication-close" type="button" aria-label="Close dedication" onClick={closeDedication}><svg aria-hidden="true" width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="m5 5 10 10M5 15 15 5" /></svg></button>
        <StarIcon size={16} className="dedication-spark" />
        <h2 id="star-dedication-name">Insha</h2>
        <p id="star-dedication-line">The brightest star in our sky.</p>
        <button className="dedication-prayer" type="button" aria-label="Offer a prayer for Insha" onClick={offerPrayer}>Offer a quiet prayer <StarIcon size={11} /></button>
      </div>}
    </div>

    {!ready && !error && <p className="town-loading" role="status">A little world is waking up<span aria-hidden="true">…</span></p>}
    {error && <p className="town-error" role="alert">{error}</p>}

    <footer className="town-footer">
      <div className="town-remembrance">
        <p className="town-dedication">{memorial.line}</p>
        <p className="pakistan-time" aria-label={time ? `${time.timeLabel}, ${phaseLabel(time.phase)}` : "Connecting to Pakistan time"}>
          <span className="clock-light" aria-hidden="true" />
          <time suppressHydrationWarning>{time?.timeLabel ?? "PAKISTAN TIME"}</time>
          <span className="clock-divider" aria-hidden="true">·</span>
          <span>{time ? phaseLabel(time.phase) : "A world that stays awake"}</span>
        </p>
      </div>
      <div className="prayer-place">
        <p role="status" aria-live="polite" aria-atomic="true" className={`prayer-feedback${prayerSent ? " is-visible" : ""}`}>{prayerSent ? "Your prayer joins her light." : ""}</p>
        <button className="offer-prayer" type="button" onClick={offerPrayer}><StarIcon size={14} /><span>{prayerSent ? "Held in her light" : "Offer a quiet prayer"}</span></button>
      </div>
    </footer>
  </main>;
}
