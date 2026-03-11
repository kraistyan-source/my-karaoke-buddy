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
    <div className="h-screen w-screen bg-background flex flex-col overflow-hidden cursor-none">
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
              className="font-display text-4xl md:text-6xl glitch-text"
              style={{ color: `hsl(${theme.colors.glow1} / 0.4)` }}
              data-text="RUÍDO ROSA"
            >
              RUÍDO ROSA
            </h2>
            <p className="text-lg font-mono mt-4" style={{ color: `hsl(${theme.colors.glow1} / 0.3)` }}>
              AGUARDANDO PRÓXIMO CANTOR...
            </p>
          </div>
        )}
      </div>

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
