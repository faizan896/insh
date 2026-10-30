"use client";

import { useEffect, useRef, useState } from "react";

type SoundGraph = {
  context: AudioContext;
  master: GainNode;
  oscillators: OscillatorNode[];
  nodes: AudioNode[];
};

function disposeGraph(graph: SoundGraph) {
  graph.oscillators.forEach((oscillator) => {
    try {
      oscillator.stop();
    } catch {
      // A browser may already have stopped a node when closing its context.
    }
  });
  graph.nodes.forEach((node) => node.disconnect());
  void graph.context.close().catch(() => undefined);
}

/** A quiet, original ambient chord. Audio is only created after a user gesture. */
export default function AudioToggle() {
  const [enabled, setEnabled] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [pending, setPending] = useState(false);
  const graphRef = useRef<SoundGraph | null>(null);
  const mounted = useRef(true);
  const busy = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (graphRef.current) disposeGraph(graphRef.current);
      graphRef.current = null;
    };
  }, []);

  async function toggleSound() {
    if (busy.current || unavailable) return;
    busy.current = true;
    setPending(true);

    try {
      if (!graphRef.current) {
        const AudioContextConstructor = window.AudioContext ||
          (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextConstructor) throw new Error("Web Audio is unavailable");

        const context = new AudioContextConstructor();
        const master = context.createGain();
        master.gain.value = 0;
        master.connect(context.destination);

        const graph: SoundGraph = { context, master, oscillators: [], nodes: [master] };
        graphRef.current = graph;

        // Soft sine tones, with independent slow breathing rather than a loop.
        [130.8128, 196, 261.6256, 329.6276].forEach((frequency, index) => {
          const voice = context.createOscillator();
          const volume = context.createGain();
          const drift = context.createOscillator();
          const depth = context.createGain();

          voice.type = "sine";
          voice.frequency.value = frequency;
          voice.detune.value = [-2, 1, 2, -1][index];
          volume.gain.value = 0.055 - index * 0.006;
          drift.frequency.value = 0.035 + index * 0.013;
          depth.gain.value = 0.012;

          drift.connect(depth);
          depth.connect(volume.gain);
          voice.connect(volume);
          volume.connect(master);
          voice.start();
          drift.start();
          graph.oscillators.push(voice, drift);
          graph.nodes.push(voice, volume, drift, depth);
        });
      }

      const { context, master } = graphRef.current;
      await context.resume();
      if (!mounted.current) return;

      const nextEnabled = !enabled;
      const now = context.currentTime;
      // Hold the current envelope so rapid toggles never produce a sharp edge.
      if (typeof master.gain.cancelAndHoldAtTime === "function") {
        master.gain.cancelAndHoldAtTime(now);
      } else {
        const currentGain = master.gain.value;
        master.gain.cancelScheduledValues(now);
        master.gain.setValueAtTime(currentGain, now);
      }
      master.gain.linearRampToValueAtTime(nextEnabled ? 0.18 : 0, now + 1.5);
      setEnabled(nextEnabled);
    } catch {
      if (graphRef.current) disposeGraph(graphRef.current);
      graphRef.current = null;
      if (mounted.current) {
        setEnabled(false);
        setUnavailable(true);
      }
    } finally {
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  }

  return (
    <button
      type="button"
      className="audio-toggle"
      onClick={toggleSound}
      aria-pressed={enabled}
      aria-label={unavailable ? "Ambient sound is unavailable in this browser" : `${enabled ? "Mute" : "Enable"} ambient sound`}
      disabled={pending || unavailable}
      title={unavailable ? "This browser could not start ambient audio." : "A quiet ambient chord, composed in your browser"}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 5 6 9H3v6h3l5 4V5Z" />
        {enabled ? (
          <>
            <path d="M15 8a6 6 0 0 1 0 8" />
            <path d="M18 5a10 10 0 0 1 0 14" />
          </>
        ) : (
          <>
            <path d="m16 9 5 6" />
            <path d="m21 9-5 6" />
          </>
        )}
      </svg>
      <span>{unavailable ? "Sound unavailable" : `Sound ${enabled ? "on" : "off"}`}</span>
    </button>
  );
}
