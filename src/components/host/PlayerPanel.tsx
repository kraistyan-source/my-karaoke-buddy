import { useState, useRef, useEffect, useCallback } from "react";
import {
  Play, Pause, SkipForward, SkipBack, Square, Volume2, VolumeX,
  Maximize, Mic2, Tv, Gauge, Music, Settings2
} from "lucide-react";
import { QueueEntry } from "@/stores/useQueue";
import { sendToAudience, openAudienceWindow, onHostMessage } from "@/lib/audienceBridge";
import { cn } from "@/lib/utils";
import { useTheme } from "@/stores/useTheme";
import SingerOverlay from "@/components/overlays/SingerOverlay";
import ProgressOverlay from "@/components/overlays/ProgressOverlay";
import AudioDeviceSelector from "./AudioDeviceSelector";
import ScoreDisplay from "./ScoreDisplay";
import { useAudioDevices } from "@/stores/useAudioDevices";
import { useScoring, SingScore } from "@/stores/useScoring";

interface PlayerPanelProps {
  currentEntry: QueueEntry | null;
  nextSingerName?: string;
  onSkip: () => void;
  eventMode?: boolean;
}

const PlayerPanel = ({ currentEntry, nextSingerName, onSkip, eventMode = false }: PlayerPanelProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const [audienceOpen, setAudienceOpen] = useState(false);
  const [pitch, setPitch] = useState(0);
  const [speed, setSpeed] = useState(100);
  const [showControls, setShowControls] = useState(false);
  const [showDevices, setShowDevices] = useState(false);
  const [lastScore, setLastScore] = useState<SingScore | null>(null);

  const audioDevices = useAudioDevices();
  const scoring = useScoring();

  const isVideo = currentEntry?.song.fileType === "mp4" || currentEntry?.song.fileType === "mkv";
  const hasMedia = currentEntry?.song.fileUrl != null;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const getMedia = useCallback((): HTMLMediaElement | null => {
    return isVideo ? videoRef.current : audioRef.current;
  }, [isVideo]);

  const { theme, themeId } = useTheme();

  const broadcastState = useCallback((overrides: Partial<Parameters<typeof sendToAudience>[0]> = {}) => {
    const media = getMedia();

    sendToAudience({
      type: "state",
      currentEntry: overrides.currentEntry !== undefined ? overrides.currentEntry : currentEntry,
      nextSingerName: overrides.nextSingerName !== undefined ? overrides.nextSingerName : nextSingerName,
      currentTime: overrides.currentTime !== undefined ? overrides.currentTime : media?.currentTime,
      duration:
        overrides.duration !== undefined
          ? overrides.duration
          : media?.duration && Number.isFinite(media.duration)
            ? media.duration
            : undefined,
      isPlaying: overrides.isPlaying !== undefined ? overrides.isPlaying : isPlaying,
      themeId,
    });
  }, [currentEntry, nextSingerName, isPlaying, getMedia, themeId]);

  // Reset on entry change
  useEffect(() => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime("0:00");
    setDuration("0:00");
    setPitch(0);
    setSpeed(100);
    broadcastState({ currentEntry, nextSingerName, currentTime: 0, duration: 0, isPlaying: false });
  }, [currentEntry?.id]);

  // Broadcast nextSinger and theme changes
  useEffect(() => {
    broadcastState();
  }, [nextSingerName, themeId]);

  // Listen for audience requests
  useEffect(() => {
    const unsub = onHostMessage((msg) => {
      if (msg.type === "request-state") {
        broadcastState();
      }
    });
    return unsub;
  }, [broadcastState]);

  // Apply volume & output device
  useEffect(() => {
    const media = getMedia();
    if (!media) return;
    media.volume = isMuted ? 0 : volume / 100;
    if (audioDevices.selectedOutput && "setSinkId" in media) {
      (media as any).setSinkId(audioDevices.selectedOutput).catch(() => {});
    }
  }, [volume, isMuted, getMedia, audioDevices.selectedOutput]);

  // Apply speed via playbackRate
  useEffect(() => {
    const media = getMedia();
    if (!media) return;
    media.playbackRate = speed / 100;
  }, [speed, getMedia]);

  // Apply pitch via Web Audio API (preservesPitch = false + playbackRate for pitch shift)
  useEffect(() => {
    const media = getMedia();
    if (!media) return;
    // Pitch shift: adjust playbackRate and use preservesPitch
    // When pitch != 0, we shift playback rate and disable preservesPitch
    const pitchMultiplier = Math.pow(2, pitch / 12);
    const speedMultiplier = speed / 100;
    media.playbackRate = speedMultiplier * pitchMultiplier;
    // @ts-ignore
    media.preservesPitch = pitch === 0;
    // @ts-ignore  
    media.mozPreservesPitch = pitch === 0;
    // @ts-ignore
    media.webkitPreservesPitch = pitch === 0;
  }, [pitch, speed, getMedia]);

  const handleTimeUpdate = () => {
    const media = getMedia();
    if (!media || !media.duration) return;
    const pct = (media.currentTime / media.duration) * 100;
    setProgress(pct);
    setCurrentTime(formatTime(media.currentTime));
    setDuration(formatTime(media.duration));
    if (Math.floor(media.currentTime * 10) % 20 === 0) {
      sendToAudience({ type: "time", currentTime: media.currentTime, duration: media.duration });
    }
  };

  const togglePlay = async () => {
    const media = getMedia();
    if (!media) return;
    if (isPlaying) {
      media.pause();
      sendToAudience({ type: "pause" });
    } else {
      await media.play();
      sendToAudience({ type: "play" });
      // Start scoring if mic is available
      if (!scoring.isScoring) {
        const analyser = await audioDevices.startMic(audioDevices.selectedInput);
        if (analyser) scoring.startScoring(analyser);
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    const media = getMedia();
    if (!media) return;
    media.pause();
    media.currentTime = 0;
    setIsPlaying(false);
    sendToAudience({ type: "pause", currentTime: 0, isPlaying: false });
  };

  const handleRestart = () => {
    const media = getMedia();
    if (!media) return;
    media.currentTime = 0;
    sendToAudience({ type: "time", currentTime: 0 });
  };

  const handleSkip = () => {
    // Stop scoring and save result
    if (scoring.isScoring && currentEntry) {
      const result = scoring.stopScoring(currentEntry.singerName, currentEntry.song.title);
      if (result) {
        setLastScore(result);
        sendToAudience({ type: "score" as any, score: result });
      }
    }
    audioDevices.stopMic();
    sendToAudience({ type: "skip", isPlaying: false });
    onSkip();
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const media = getMedia();
    if (!media || !media.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    media.currentTime = pct * media.duration;
    sendToAudience({ type: "time", currentTime: media.currentTime });
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  const handleOpenAudience = () => {
    openAudienceWindow();
    setAudienceOpen(true);
    setTimeout(() => {
      broadcastState();
    }, 300);
    setTimeout(() => {
      broadcastState();
    }, 1500);
  };

  const btnSize = eventMode ? "w-16 h-16" : "w-14 h-14";
  const iconSize = eventMode ? "h-7 w-7" : "h-6 w-6";

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-background">
      {/* Video / Visual Area */}
      <div className="flex-1 relative flex items-center justify-center bg-card overflow-hidden">
        {/* Simplified overlay - singer info + progress only */}
        {currentEntry && (
          <>
            {!isVideo && (
              <SingerOverlay
                singerName={currentEntry.singerName}
                songTitle={currentEntry.song.title}
                artist={currentEntry.song.artist}
                theme={theme}
              />
            )}
            <ProgressOverlay progress={progress} color={theme.colors.glow1} />
          </>
        )}
        
        {currentEntry ? (
          <>
            {isVideo && hasMedia ? (
              <video
                ref={videoRef}
                src={currentEntry.song.fileUrl}
                className="w-full h-full object-contain relative"
                style={{ zIndex: 3 }}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleSkip}
              />
            ) : (
              <>
                {hasMedia && (
                  <audio
                    ref={audioRef}
                    src={currentEntry.song.fileUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleSkip}
                  />
                )}
                <div className="relative z-20 text-center px-8">
                  <Mic2 className="h-16 w-16 text-primary mx-auto mb-6" />
                  <h2 className={cn(
                    "font-display text-primary mb-2",
                    eventMode ? "text-3xl md:text-5xl" : "text-2xl md:text-4xl"
                  )}>
                    {currentEntry.song.title}
                  </h2>
                  <p className="text-lg text-muted-foreground font-mono">{currentEntry.song.artist}</p>
                  <div className="mt-8 py-3 px-6 rounded bg-secondary/10 border border-secondary/30 inline-block">
                    <p className={cn(
                      "font-display text-secondary",
                      eventMode ? "text-2xl" : "text-xl"
                    )}>
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
      <div className="h-2 bg-muted cursor-pointer" onClick={handleSeek}>
        <div
          className="h-full bg-primary transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main Controls */}
      <div className={cn("px-4 py-3 border-t border-border flex items-center gap-3", eventMode && "py-4 gap-4")}>
        {/* Restart */}
        <button
          onClick={handleRestart}
          disabled={!currentEntry}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
          title="Reiniciar"
        >
          <SkipBack className={iconSize} />
        </button>

        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          disabled={!currentEntry}
          className={cn(
            "rounded-full border-2 flex items-center justify-center transition-all",
            btnSize,
            currentEntry
              ? isPlaying
                ? "border-primary bg-primary/10 neon-box-primary hover:bg-primary/20"
                : "border-secondary bg-secondary/10 neon-box-secondary hover:bg-secondary/20"
              : "border-border bg-muted cursor-not-allowed"
          )}
        >
          {isPlaying ? (
            <Pause className={cn(iconSize, "text-primary")} />
          ) : (
            <Play className={cn(iconSize, "text-secondary ml-0.5")} />
          )}
        </button>

        {/* Stop */}
        <button
          onClick={handleStop}
          disabled={!currentEntry}
          className="p-2 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30"
          title="Parar"
        >
          <Square className={cn(eventMode ? "h-6 w-6" : "h-5 w-5")} />
        </button>

        {/* Skip */}
        <button
          onClick={handleSkip}
          disabled={!currentEntry}
          className="p-2 text-muted-foreground hover:text-secondary transition-colors disabled:opacity-30"
          title="Pular"
        >
          <SkipForward className={iconSize} />
        </button>

        {/* Time */}
        <span className="text-xs text-muted-foreground font-mono min-w-[80px]">
          {currentTime} / {duration}
        </span>

        <div className="flex-1">
          {/* Score display inline */}
          <ScoreDisplay score={lastScore} currentScore={scoring.currentScore} isScoring={scoring.isScoring} />
        </div>

        {/* Audio Devices Toggle */}
        <button
          onClick={() => setShowDevices(!showDevices)}
          className={cn(
            "p-2 transition-colors",
            showDevices ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
          title="Dispositivos de áudio"
        >
          <Settings2 className="h-5 w-5" />
        </button>

        {/* Advanced Controls Toggle */}
        <button
          onClick={() => setShowControls(!showControls)}
          className={cn(
            "p-2 transition-colors",
            showControls ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
          title="Controles avançados"
        >
          <Gauge className="h-5 w-5" />
        </button>

        {/* Audience Screen */}
        <button
          onClick={handleOpenAudience}
          className={cn(
            "p-2 transition-colors",
            audienceOpen ? "text-secondary neon-text-secondary" : "text-muted-foreground hover:text-secondary"
          )}
          title="Tela do público (TV)"
        >
          <Tv className="h-5 w-5" />
        </button>

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
          className="w-20 accent-primary"
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

      {/* Advanced Controls: Pitch & Speed */}
      {showControls && (
        <div className="px-4 py-3 border-t border-border bg-muted/30 flex items-center gap-6">
          {/* Pitch */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-mono w-12">TOM</span>
            <button
              onClick={() => setPitch((p) => Math.max(-6, p - 1))}
              className="w-7 h-7 rounded border border-border text-foreground hover:border-primary hover:text-primary font-mono text-sm flex items-center justify-center transition-colors"
            >
              -
            </button>
            <span className={cn(
              "text-sm font-mono w-8 text-center",
              pitch > 0 ? "text-secondary" : pitch < 0 ? "text-primary" : "text-foreground"
            )}>
              {pitch > 0 ? `+${pitch}` : pitch}
            </span>
            <button
              onClick={() => setPitch((p) => Math.min(6, p + 1))}
              className="w-7 h-7 rounded border border-border text-foreground hover:border-secondary hover:text-secondary font-mono text-sm flex items-center justify-center transition-colors"
            >
              +
            </button>
            {pitch !== 0 && (
              <button onClick={() => setPitch(0)} className="text-[10px] text-muted-foreground hover:text-foreground font-mono">
                RESET
              </button>
            )}
          </div>

          <div className="w-px h-6 bg-border" />

          {/* Speed */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-mono w-16">VELOCIDADE</span>
            <input
              type="range"
              min={90}
              max={110}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-24 accent-secondary"
            />
            <span className={cn(
              "text-sm font-mono w-10 text-center",
              speed !== 100 ? "text-secondary" : "text-foreground"
            )}>
              {speed}%
            </span>
            {speed !== 100 && (
              <button onClick={() => setSpeed(100)} className="text-[10px] text-muted-foreground hover:text-foreground font-mono">
                RESET
              </button>
            )}
          </div>
        </div>
      )}

      {/* Audio Device Selector */}
      {showDevices && (
        <div className="px-4 py-3 border-t border-border bg-muted/30">
          <AudioDeviceSelector
            inputs={audioDevices.inputs}
            outputs={audioDevices.outputs}
            selectedInput={audioDevices.selectedInput}
            selectedOutput={audioDevices.selectedOutput}
            onSelectInput={audioDevices.setSelectedInput}
            onSelectOutput={(id) => audioDevices.setOutputDevice(id, getMedia() ?? undefined)}
            onRefresh={audioDevices.enumerate}
          />
        </div>
      )}
    </div>
  );
};

export default PlayerPanel;
