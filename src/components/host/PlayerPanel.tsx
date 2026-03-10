import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, SkipForward, Volume2, VolumeX, Maximize, Mic2 } from "lucide-react";
import { QueueEntry } from "@/stores/useQueue";
import { cn } from "@/lib/utils";

interface PlayerPanelProps {
  currentEntry: QueueEntry | null;
  onSkip: () => void;
}

const PlayerPanel = ({ currentEntry, onSkip }: PlayerPanelProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");

  const isVideo = currentEntry?.song.fileType === "mp4";
  const hasMedia = currentEntry?.song.fileUrl != null;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const getMedia = useCallback((): HTMLMediaElement | null => {
    return isVideo ? videoRef.current : audioRef.current;
  }, [isVideo]);

  useEffect(() => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime("0:00");
    setDuration("0:00");
  }, [currentEntry?.id]);

  useEffect(() => {
    const media = getMedia();
    if (!media) return;
    media.volume = isMuted ? 0 : volume / 100;
  }, [volume, isMuted, getMedia]);

  const handleTimeUpdate = () => {
    const media = getMedia();
    if (!media || !media.duration) return;
    setProgress((media.currentTime / media.duration) * 100);
    setCurrentTime(formatTime(media.currentTime));
    setDuration(formatTime(media.duration));
  };

  const togglePlay = async () => {
    const media = getMedia();
    if (!media) return;
    if (isPlaying) {
      media.pause();
    } else {
      await media.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const media = getMedia();
    if (!media || !media.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    media.currentTime = pct * media.duration;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-background">
      {/* Video / Visual Area */}
      <div className="flex-1 relative flex items-center justify-center bg-card overflow-hidden">
        <div className="vhs-scanlines absolute inset-0 z-10 pointer-events-none" />
        
        {currentEntry ? (
          <>
            {isVideo && hasMedia ? (
              <video
                ref={videoRef}
                src={currentEntry.song.fileUrl}
                className="w-full h-full object-contain"
                onTimeUpdate={handleTimeUpdate}
                onEnded={onSkip}
              />
            ) : (
              <>
                {hasMedia && (
                  <audio
                    ref={audioRef}
                    src={currentEntry.song.fileUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={onSkip}
                  />
                )}
                <div className="relative z-20 text-center px-8">
                  <Mic2 className="h-16 w-16 text-primary mx-auto mb-6 animate-pulse-neon" />
                  <h2 className="font-display text-2xl md:text-4xl text-primary neon-text-primary animate-flicker mb-2">
                    {currentEntry.song.title}
                  </h2>
                  <p className="text-lg text-muted-foreground font-mono">{currentEntry.song.artist}</p>
                  <div className="mt-8 py-3 px-6 rounded bg-secondary/10 border border-secondary/30 inline-block">
                    <p className="font-display text-xl text-secondary neon-text-secondary">
                      🎤 {currentEntry.singerName}
                    </p>
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="text-center">
            <Mic2 className="h-20 w-20 text-muted-foreground/20 mx-auto mb-4" />
            <p className="font-display text-lg text-muted-foreground/40">AGUARDANDO CANTOR</p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div
        className="h-1.5 bg-muted cursor-pointer"
        onClick={handleSeek}
      >
        <div
          className="h-full bg-primary neon-box-primary transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls */}
      <div className="px-6 py-4 border-t border-border flex items-center gap-4">
        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          disabled={!currentEntry}
          className={cn(
            "w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all",
            currentEntry
              ? isPlaying
                ? "border-primary bg-primary/10 neon-box-primary hover:bg-primary/20"
                : "border-secondary bg-secondary/10 neon-box-secondary hover:bg-secondary/20"
              : "border-border bg-muted cursor-not-allowed"
          )}
        >
          {isPlaying ? (
            <Pause className="h-6 w-6 text-primary" />
          ) : (
            <Play className="h-6 w-6 text-secondary ml-0.5" />
          )}
        </button>

        {/* Skip */}
        <button
          onClick={onSkip}
          disabled={!currentEntry}
          className="p-2 text-muted-foreground hover:text-secondary transition-colors disabled:opacity-30"
          title="Pular"
        >
          <SkipForward className="h-6 w-6" />
        </button>

        {/* Time */}
        <span className="text-xs text-muted-foreground font-mono min-w-[80px]">
          {currentTime} / {duration}
        </span>

        <div className="flex-1" />

        {/* Volume */}
        <button
          onClick={() => setIsMuted((m) => !m)}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
        <input
          type="range"
          min={0}
          max={100}
          value={isMuted ? 0 : volume}
          onChange={(e) => { setVolume(Number(e.target.value)); setIsMuted(false); }}
          className="w-24 accent-primary"
        />

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          title="Tela cheia"
        >
          <Maximize className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default PlayerPanel;
