import { useState, useEffect, useRef } from "react";
import { Mic2 } from "lucide-react";
import { onAudienceMessage, AudienceMessage } from "@/lib/audienceBridge";
import { QueueEntry } from "@/stores/useQueue";

const AudienceScreen = () => {
  const [currentEntry, setCurrentEntry] = useState<QueueEntry | null>(null);
  const [nextSingerName, setNextSingerName] = useState<string | undefined>();
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const unsub = onAudienceMessage((msg: AudienceMessage) => {
      switch (msg.type) {
        case "state":
          setCurrentEntry(msg.currentEntry ?? null);
          if (msg.nextSingerName !== undefined) setNextSingerName(msg.nextSingerName);
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
          if (videoRef.current && msg.currentTime !== undefined) {
            const diff = Math.abs(videoRef.current.currentTime - msg.currentTime);
            if (diff > 1) videoRef.current.currentTime = msg.currentTime;
          }
          break;
        case "skip":
        case "ended":
          setIsPlaying(false);
          break;
      }
    });
    return unsub;
  }, []);

  const isVideo = currentEntry?.song.fileType === "mp4";
  const hasMedia = currentEntry?.song.fileUrl != null;

  return (
    <div className="h-screen w-screen bg-background flex flex-col overflow-hidden cursor-none">
      {/* Video / Visual Area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <div className="vhs-scanlines absolute inset-0 z-10 pointer-events-none" />

        {currentEntry ? (
          <>
            {isVideo && hasMedia ? (
              <video
                ref={videoRef}
                src={currentEntry.song.fileUrl}
                className="w-full h-full object-contain"
                autoPlay={isPlaying}
                muted
              />
            ) : (
              <div className="relative z-20 text-center px-12">
                <Mic2 className="h-24 w-24 text-primary mx-auto mb-8 animate-pulse-neon" />
                <h2 className="font-display text-4xl md:text-6xl lg:text-7xl text-primary neon-text-primary animate-flicker mb-4">
                  {currentEntry.song.title}
                </h2>
                <p className="text-xl md:text-2xl text-muted-foreground font-mono mb-10">
                  {currentEntry.song.artist}
                </p>
                <div className="py-4 px-8 rounded bg-secondary/10 border border-secondary/30 inline-block">
                  <p className="font-display text-2xl md:text-4xl text-secondary neon-text-secondary">
                    🎤 {currentEntry.singerName}
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center">
            <Mic2 className="h-32 w-32 text-primary/20 mx-auto mb-6 animate-pulse-neon" />
            <h2
              className="font-display text-4xl md:text-6xl text-primary/40 neon-text-primary glitch-text"
              data-text="RUÍDO ROSA"
            >
              RUÍDO ROSA
            </h2>
            <p className="text-lg text-muted-foreground/40 font-mono mt-4">
              AGUARDANDO PRÓXIMO CANTOR...
            </p>
          </div>
        )}
      </div>

      {/* Next up bar */}
      {nextSingerName && (
        <div className="px-6 py-3 bg-card/80 border-t border-border flex items-center justify-center gap-3">
          <span className="text-xs text-muted-foreground font-mono uppercase tracking-widest">PRÓXIMO:</span>
          <span className="font-display text-sm text-secondary neon-text-secondary">{nextSingerName}</span>
        </div>
      )}
    </div>
  );
};

export default AudienceScreen;
