import { useState, useEffect, useRef } from "react";
import { Mic2, Star, Trophy } from "lucide-react";
import {
  onAudienceMessage,
  requestStateFromHost,
  AudienceMessage,
  getAudienceStateSnapshot,
  onAudienceStateSnapshotChange,
} from "@/lib/audienceBridge";
import { QueueEntry } from "@/stores/useQueue";
import { ThemeId, themes } from "@/lib/themes";
import ThemeOverlay from "@/components/overlays/ThemeOverlay";
import { cn } from "@/lib/utils";

const AudienceScreen = () => {
  const [currentEntry, setCurrentEntry] = useState<QueueEntry | null>(null);
  const [nextSingerName, setNextSingerName] = useState<string | undefined>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [themeId, setThemeId] = useState<ThemeId>("neon");
  const [progress, setProgress] = useState(0);
  const [scoreDisplay, setScoreDisplay] = useState<{ singerName: string; score: number; stars: number } | null>(null);
  const [liveScore, setLiveScore] = useState<{ score: number; isScoring: boolean } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pendingSeekRef = useRef<number | null>(null);

  const theme = themes[themeId];

  useEffect(() => {
    const applyState = (msg: AudienceMessage) => {
      setCurrentEntry(msg.currentEntry ?? null);
      if (msg.nextSingerName !== undefined) setNextSingerName(msg.nextSingerName);
      if (msg.themeId !== undefined) setThemeId(msg.themeId);

      if (msg.currentTime !== undefined && msg.duration) {
        setProgress((msg.currentTime / msg.duration) * 100);
      }

      if (msg.currentTime !== undefined) {
        pendingSeekRef.current = msg.currentTime;
        if (videoRef.current && videoRef.current.readyState >= 1) {
          videoRef.current.currentTime = msg.currentTime;
        }
      }

      if (msg.isPlaying !== undefined) {
        setIsPlaying(msg.isPlaying);
        if (msg.isPlaying) {
          videoRef.current?.play().catch(() => {});
        } else {
          videoRef.current?.pause();
        }
      }
    };

    const unsub = onAudienceMessage((msg: AudienceMessage) => {
      switch (msg.type) {
        case "state":
          applyState(msg);
          break;
        case "theme":
          if (msg.themeId) setThemeId(msg.themeId);
          break;
        case "play":
          setIsPlaying(true);
          videoRef.current?.play().catch(() => {});
          break;
        case "pause":
          setIsPlaying(false);
          videoRef.current?.pause();
          break;
        case "time":
          if (msg.currentTime !== undefined && msg.duration) {
            setProgress((msg.currentTime / msg.duration) * 100);
          }
          if (videoRef.current && msg.currentTime !== undefined) {
            const diff = Math.abs(videoRef.current.currentTime - msg.currentTime);
            if (diff > 1) videoRef.current.currentTime = msg.currentTime;
          } else if (msg.currentTime !== undefined) {
            pendingSeekRef.current = msg.currentTime;
          }
          break;
        case "skip":
        case "ended":
          setIsPlaying(false);
          setProgress(0);
          setLiveScore(null);
          break;
        case "score":
          if (msg.score) {
            setLiveScore(null);
            setScoreDisplay(msg.score);
            setTimeout(() => setScoreDisplay(null), 8000);
          }
          break;
        case "live-score":
          if (msg.liveScore) {
            setLiveScore(msg.liveScore);
          }
          break;
      }
    });

    const unsubSnapshot = onAudienceStateSnapshotChange((snapshot) => {
      applyState({ type: "state", ...snapshot });
    });

    const storedSnapshot = getAudienceStateSnapshot();
    if (storedSnapshot) {
      applyState({ type: "state", ...storedSnapshot });
    }

    requestStateFromHost();
    const retryInterval = setInterval(() => requestStateFromHost(), 2000);
    const stopRetry = setTimeout(() => clearInterval(retryInterval), 15000);

    return () => {
      unsub();
      unsubSnapshot();
      clearInterval(retryInterval);
      clearTimeout(stopRetry);
    };
  }, []);

  const isVideo = currentEntry?.song.fileType === "mp4";
  const hasMedia = currentEntry?.song.fileUrl != null;

  return (
    <div className="h-screen w-screen bg-background flex flex-col overflow-hidden cursor-none relative">
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* Theme overlays */}
        <ThemeOverlay
          theme={theme}
          singerName={currentEntry?.singerName}
          songTitle={currentEntry?.song.title}
          artist={currentEntry?.song.artist}
          progress={progress}
          showSingerInfo={!!currentEntry && !isVideo}
        />

        {currentEntry ? (
          <>
            {isVideo && hasMedia ? (
              <video
                ref={videoRef}
                src={currentEntry.song.fileUrl}
                className="w-full h-full object-contain relative"
                style={{ zIndex: 3 }}
                autoPlay={isPlaying}
                muted
                onTimeUpdate={() => {
                  if (videoRef.current && videoRef.current.duration) {
                    setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
                  }
                }}
                onLoadedMetadata={() => {
                  if (pendingSeekRef.current !== null && videoRef.current) {
                    videoRef.current.currentTime = pendingSeekRef.current;
                  }
                  if (isPlaying) {
                    videoRef.current?.play().catch(() => {});
                  }
                }}
              />
            ) : (
              <div className="relative z-20 text-center px-12">
                <Mic2 className="h-24 w-24 mx-auto mb-8 animate-pulse-neon" style={{ color: `hsl(${theme.colors.glow1})` }} />
                <h2
                  className="font-display text-4xl md:text-6xl lg:text-7xl mb-4"
                  style={{
                    color: `hsl(${theme.colors.glow1})`,
                    textShadow: `0 0 10px hsl(${theme.colors.glow1} / 0.6), 0 0 30px hsl(${theme.colors.glow1} / 0.3)`,
                  }}
                >
                  {currentEntry.song.title}
                </h2>
                <p className="text-xl md:text-2xl font-mono mb-10" style={{ color: theme.colors.text, opacity: 0.7 }}>
                  {currentEntry.song.artist}
                </p>
                <div
                  className="py-4 px-8 rounded inline-block"
                  style={{
                    background: `hsl(${theme.colors.glow2} / 0.1)`,
                    border: `1px solid hsl(${theme.colors.glow2} / 0.3)`,
                  }}
                >
                  <p
                    className="font-display text-2xl md:text-4xl"
                    style={{
                      color: `hsl(${theme.colors.glow2})`,
                      textShadow: `0 0 10px hsl(${theme.colors.glow2} / 0.6)`,
                    }}
                  >
                    🎤 {currentEntry.singerName}
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center">
            <Mic2 className="h-32 w-32 mx-auto mb-6 animate-pulse-neon" style={{ color: `hsl(${theme.colors.glow1} / 0.2)` }} />
            <h2
              className="font-display text-4xl md:text-6xl"
              style={{ color: `hsl(${theme.colors.glow1} / 0.4)` }}
            >
              STARSING
            </h2>
            <p className="text-lg font-mono mt-4" style={{ color: `hsl(${theme.colors.glow1} / 0.3)` }}>
              AGUARDANDO PRÓXIMO CANTOR...
            </p>
          </div>
        )}
      </div>

      {/* Live Score HUD */}
      {liveScore && liveScore.isScoring && !scoreDisplay && (
        <div
          className="absolute top-6 right-6 z-40 flex items-center gap-3 px-5 py-3 rounded-lg"
          style={{
            background: `hsl(${theme.colors.glow2} / 0.15)`,
            border: `1px solid hsl(${theme.colors.glow2} / 0.4)`,
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">AO VIVO</span>
          </div>
          <span
            className="font-display text-3xl font-bold tabular-nums"
            style={{
              color: `hsl(${theme.colors.glow1})`,
              textShadow: `0 0 12px hsl(${theme.colors.glow1} / 0.5)`,
            }}
          >
            {liveScore.score}
          </span>
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn("h-4 w-4", i < (liveScore.score >= 90 ? 5 : liveScore.score >= 75 ? 4 : liveScore.score >= 55 ? 3 : liveScore.score >= 35 ? 2 : 1) ? "fill-current" : "opacity-20")}
                style={{ color: `hsl(${theme.colors.glow2})` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Score Overlay */}
      {scoreDisplay && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 animate-in fade-in duration-500">
          <div className="text-center space-y-4">
            <Trophy className="h-16 w-16 mx-auto" style={{ color: `hsl(${theme.colors.glow1})` }} />
            <p className="font-mono text-lg text-muted-foreground">{scoreDisplay.singerName}</p>
            <p
              className="font-display text-7xl md:text-9xl font-bold"
              style={{
                color: `hsl(${theme.colors.glow1})`,
                textShadow: `0 0 20px hsl(${theme.colors.glow1} / 0.6), 0 0 60px hsl(${theme.colors.glow1} / 0.3)`,
              }}
            >
              {scoreDisplay.score}
            </p>
            <div className="flex justify-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-8 w-8 transition-all",
                    i < scoreDisplay.stars ? "fill-current" : "opacity-20"
                  )}
                  style={{ color: `hsl(${theme.colors.glow2})` }}
                />
              ))}
            </div>
            <p className="font-display text-xl" style={{ color: `hsl(${theme.colors.glow2})` }}>
              {scoreDisplay.score >= 90 ? "ESPETACULAR! 🔥" : scoreDisplay.score >= 75 ? "ARRASOU! 🎤" : scoreDisplay.score >= 55 ? "MANDOU BEM! 👏" : scoreDisplay.score >= 35 ? "BOA TENTATIVA! 😄" : "VALEU A CORAGEM! 💪"}
            </p>
          </div>
        </div>
      )}

      {nextSingerName && (
        <div className="px-6 py-3 bg-card/80 border-t border-border flex items-center justify-center gap-3">
          <span className="text-xs text-muted-foreground font-mono uppercase tracking-widest">PRÓXIMO:</span>
          <span
            className="font-display text-sm"
            style={{
              color: `hsl(${theme.colors.glow2})`,
              textShadow: `0 0 8px hsl(${theme.colors.glow2} / 0.5)`,
            }}
          >
            {nextSingerName}
          </span>
        </div>
      )}
    </div>
  );
};

export default AudienceScreen;
