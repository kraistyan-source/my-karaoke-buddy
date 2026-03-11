import { useState, useCallback, useRef, useEffect } from "react";

export interface SingScore {
  singerName: string;
  songTitle: string;
  score: number; // 0-100
  stars: number; // 1-5
  timestamp: number;
}

/**
 * Fun/entertainment scoring based on volume consistency, presence, and a bit of randomness.
 * NOT a real pitch-accuracy system — designed for party vibes.
 */
export function useScoring() {
  const [currentScore, setCurrentScore] = useState(0);
  const [isScoring, setIsScoring] = useState(false);
  const [scores, setScores] = useState<SingScore[]>([]);

  const analyserRef = useRef<AnalyserNode | null>(null);
  const samplesRef = useRef<number[]>([]);
  const intervalRef = useRef<number | null>(null);

  const startScoring = useCallback((analyser: AnalyserNode) => {
    analyserRef.current = analyser;
    samplesRef.current = [];
    setCurrentScore(0);
    setIsScoring(true);

    // Sample volume every 200ms
    intervalRef.current = window.setInterval(() => {
      if (!analyserRef.current) return;
      const data = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(data);
      // RMS volume
      const rms = Math.sqrt(data.reduce((sum, v) => sum + v * v, 0) / data.length);
      samplesRef.current.push(rms);

      // Live score preview (updates in real-time)
      const liveSamples = samplesRef.current;
      if (liveSamples.length > 5) {
        const avg = liveSamples.reduce((a, b) => a + b, 0) / liveSamples.length;
        const singing = liveSamples.filter((v) => v > 15).length;
        const presence = (singing / liveSamples.length) * 100;
        const energy = Math.min(avg / 60, 1) * 100;
        const raw = presence * 0.5 + energy * 0.3 + Math.random() * 20;
        setCurrentScore(Math.min(100, Math.round(raw)));
      }
    }, 200);
  }, []);

  const stopScoring = useCallback((singerName: string, songTitle: string): SingScore | null => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsScoring(false);

    const samples = samplesRef.current;
    if (samples.length < 10) return null; // Too short

    // Calculate final score
    const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
    const singing = samples.filter((v) => v > 15).length;
    const presence = (singing / samples.length) * 100;
    const energy = Math.min(avg / 60, 1) * 100;
    // Consistency: lower std dev = more consistent
    const mean = avg;
    const variance = samples.reduce((sum, v) => sum + (v - mean) ** 2, 0) / samples.length;
    const consistency = Math.max(0, 100 - Math.sqrt(variance));

    const raw = presence * 0.35 + energy * 0.25 + consistency * 0.2 + Math.random() * 20;
    const score = Math.min(100, Math.max(10, Math.round(raw)));
    const stars = score >= 90 ? 5 : score >= 75 ? 4 : score >= 55 ? 3 : score >= 35 ? 2 : 1;

    const result: SingScore = { singerName, songTitle, score, stars, timestamp: Date.now() };
    setScores((prev) => [result, ...prev].slice(0, 50));
    setCurrentScore(score);

    return result;
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return {
    currentScore,
    isScoring,
    scores,
    startScoring,
    stopScoring,
  };
}
