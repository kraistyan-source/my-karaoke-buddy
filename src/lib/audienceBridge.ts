/**
 * BroadcastChannel bridge for syncing host ↔ audience screen.
 */

import { QueueEntry } from "@/stores/useQueue";
import { ThemeId } from "@/lib/themes";

export interface AudienceMessage {
  type: "state" | "play" | "pause" | "skip" | "time" | "ended" | "request-state" | "theme" | "score" | "live-score";
  currentEntry?: QueueEntry | null;
  nextSingerName?: string;
  currentTime?: number;
  duration?: number;
  isPlaying?: boolean;
  themeId?: ThemeId;
  score?: { singerName: string; songTitle: string; score: number; stars: number };
  liveScore?: { score: number; isScoring: boolean };
}

export interface AudienceStateSnapshot {
  currentEntry: QueueEntry | null;
  nextSingerName?: string;
  currentTime?: number;
  duration?: number;
  isPlaying?: boolean;
  themeId?: ThemeId;
  updatedAt: number;
}

const CHANNEL_NAME = "ruido-rosa-audience";
const SNAPSHOT_KEY = "ruido-rosa-audience-state";

// Each window gets its own channel instance — BroadcastChannel sends to OTHER contexts
let hostChannel: BroadcastChannel | null = null;
let audienceChannel: BroadcastChannel | null = null;

function getHostChannel(): BroadcastChannel {
  if (!hostChannel) hostChannel = new BroadcastChannel(CHANNEL_NAME);
  return hostChannel;
}

function getAudienceChannel(): BroadcastChannel {
  if (!audienceChannel) audienceChannel = new BroadcastChannel(CHANNEL_NAME);
  return audienceChannel;
}

function readSnapshot(): AudienceStateSnapshot | null {
  try {
    const raw = window.localStorage.getItem(SNAPSHOT_KEY);
    return raw ? (JSON.parse(raw) as AudienceStateSnapshot) : null;
  } catch {
    return null;
  }
}

function writeSnapshot(snapshot: AudienceStateSnapshot) {
  try {
    window.localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {}
}

function syncSnapshot(msg: AudienceMessage) {
  const previous = readSnapshot();
  const next: AudienceStateSnapshot = {
    currentEntry:
      msg.currentEntry !== undefined ? msg.currentEntry : (previous?.currentEntry ?? null),
    nextSingerName:
      msg.nextSingerName !== undefined ? msg.nextSingerName : previous?.nextSingerName,
    currentTime:
      msg.currentTime !== undefined
        ? msg.currentTime
        : msg.type === "state" && msg.currentEntry === null
          ? 0
          : previous?.currentTime,
    duration:
      msg.duration !== undefined
        ? msg.duration
        : msg.type === "state" && msg.currentEntry === null
          ? 0
          : previous?.duration,
    isPlaying:
      msg.type === "play"
        ? true
        : msg.type === "pause" || msg.type === "ended"
          ? false
          : msg.isPlaying !== undefined
            ? msg.isPlaying
            : previous?.isPlaying ?? false,
    themeId: msg.themeId !== undefined ? msg.themeId : previous?.themeId,
    updatedAt: Date.now(),
  };

  writeSnapshot(next);
}

// Host sends to audience
export function sendToAudience(msg: AudienceMessage) {
  syncSnapshot(msg);

  try {
    getHostChannel().postMessage(msg);
  } catch {}
}

// Host listens for audience requests (like "request-state")
export function onHostMessage(handler: (msg: AudienceMessage) => void): () => void {
  const ch = getHostChannel();
  const listener = (e: MessageEvent<AudienceMessage>) => handler(e.data);
  ch.addEventListener("message", listener);
  return () => ch.removeEventListener("message", listener);
}

// Audience listens for host messages
export function onAudienceMessage(handler: (msg: AudienceMessage) => void): () => void {
  const ch = getAudienceChannel();
  const listener = (e: MessageEvent<AudienceMessage>) => handler(e.data);
  ch.addEventListener("message", listener);
  return () => ch.removeEventListener("message", listener);
}

export function getAudienceStateSnapshot(): AudienceStateSnapshot | null {
  return readSnapshot();
}

export function onAudienceStateSnapshotChange(
  handler: (snapshot: AudienceStateSnapshot) => void,
): () => void {
  const listener = (event: StorageEvent) => {
    if (event.key !== SNAPSHOT_KEY || !event.newValue) return;

    try {
      handler(JSON.parse(event.newValue) as AudienceStateSnapshot);
    } catch {}
  };

  window.addEventListener("storage", listener);
  return () => window.removeEventListener("storage", listener);
}

// Audience requests current state from host
export function requestStateFromHost() {
  try {
    getAudienceChannel().postMessage({ type: "request-state" });
  } catch {}
}

export function openAudienceWindow() {
  const w = window.open(
    "/audience",
    "ruido-rosa-audience",
    "popup=yes,width=1280,height=720"
  );
  if (w) {
    try {
      w.moveTo(window.screen.availWidth, 0);
      w.resizeTo(1280, 720);
    } catch {}
  }
  return w;
}
