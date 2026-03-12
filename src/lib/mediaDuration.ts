/**
 * Probe media file duration using a temporary HTML element.
 * Works with both blob URLs and file:// URLs.
 */

export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function probeDuration(url: string, isVideo: boolean): Promise<number> {
  return new Promise((resolve) => {
    const el = isVideo
      ? document.createElement("video")
      : document.createElement("audio");
    el.preload = "metadata";

    const cleanup = () => {
      el.removeAttribute("src");
      el.load();
    };

    el.addEventListener("loadedmetadata", () => {
      const dur = isFinite(el.duration) ? el.duration : 0;
      cleanup();
      resolve(Math.round(dur));
    }, { once: true });

    el.addEventListener("error", () => {
      cleanup();
      resolve(0);
    }, { once: true });

    // Timeout after 5s
    setTimeout(() => {
      cleanup();
      resolve(0);
    }, 5000);

    el.src = url;
  });
}
