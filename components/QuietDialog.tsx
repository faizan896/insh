"use client";

import { useEffect, useRef } from "react";
import { memorial } from "@/lib/memorial";
import StarIcon from "./StarIcon";
import DiagonalArrow from "./DiagonalArrow";

export default function QuietDialog({ kind, onClose }: { kind: "about" | "prayer" | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (kind && dialog && !dialog.open) dialog.showModal();
    if (!kind && dialog?.open) dialog.close();
  }, [kind]);

  return <dialog ref={ref} className="quiet-dialog" onCancel={onClose} onClick={event => {
    if (event.target === event.currentTarget) {
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
    }
  }} aria-labelledby="dialog-title">
    <button className="dialog-close" onClick={onClose} aria-label="Close dialog"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="m6 6 12 12M6 18 18 6" /></svg></button>
    <StarIcon size={28} />
    <p className="eyebrow">{kind === "prayer" ? "A MOMENT OF PRAYER" : "A LITTLE ABOUT THIS PLACE"}</p>
    <h2 id="dialog-title">{kind === "prayer" ? "Held in His mercy." : "A light that stays."}</h2>
    {kind === "prayer" ? <>
      <p className="arabic" lang="ar" dir="rtl">إِنَّا لِلَّٰهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ</p>
      <p className="prayer-transliteration">{memorial.prayer}</p>
      <p>{memorial.prayerTranslation}</p>
      <div className="dialog-rule" />
      <p>May Allah grant Insha peace, surround her with mercy, and bring comfort to everyone who loves her.</p>
    </> : <>
      <p>A small, quiet corner of the world, made in loving memory of Insha.</p>
      <p>Wander through the meadow. Watch the sky change. Leave a prayer, or simply stay a while. There is no right way to remember.</p>
      <div className="dialog-rule" />
      <p className="dialog-note">Your prayers are a private moment of remembrance. Nothing is collected or shared.</p>
    </>}
    <button className="text-button dialog-return" onClick={onClose}>Back to the meadow <DiagonalArrow /></button>
  </dialog>;
}
