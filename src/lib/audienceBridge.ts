/**
 * BroadcastChannel bridge for syncing host ↔ audience screen.
 */

import { QueueEntry } from "@/stores/useQueue";

export interface AudienceMessage {
  type: "state" | "play" | "pause" | "skip" | "time" | "ended" | "request-state";
  currentEntry?: QueueEntry | null;
  nextSingerName?: string;
  currentTime?: number;
  duration?: number;
}

const CHANNEL_NAME = "ruido-rosa-audience";

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

// Host sends to audience
export function sendToAudience(msg: AudienceMessage) {
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
