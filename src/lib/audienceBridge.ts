/**
 * BroadcastChannel bridge for syncing host → audience screen.
 * Sends current entry, playback state, and time updates.
 */

import { QueueEntry } from "@/stores/useQueue";

export interface AudienceMessage {
  type: "state" | "play" | "pause" | "skip" | "time" | "ended";
  currentEntry?: QueueEntry | null;
  nextSingerName?: string;
  currentTime?: number;
  duration?: number;
}

const CHANNEL_NAME = "ruido-rosa-audience";

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel {
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }
  return channel;
}

export function sendToAudience(msg: AudienceMessage) {
  try {
    getChannel().postMessage(msg);
  } catch {}
}

export function onAudienceMessage(handler: (msg: AudienceMessage) => void): () => void {
  const ch = getChannel();
  const listener = (e: MessageEvent<AudienceMessage>) => handler(e.data);
  ch.addEventListener("message", listener);
  return () => ch.removeEventListener("message", listener);
}

export function openAudienceWindow() {
  const w = window.open(
    "/audience",
    "ruido-rosa-audience",
    "popup=yes,width=1280,height=720"
  );
  if (w) {
    // Try to move to second monitor (if available, browser may block this)
    try {
      w.moveTo(window.screen.availWidth, 0);
      w.resizeTo(1280, 720);
    } catch {}
  }
  return w;
}
