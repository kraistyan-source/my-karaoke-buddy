import MidiParser from "midi-parser-js";
import { LyricLine } from "@/data/songs";

export interface ParsedKaraokeFile {
  title: string;
  artist: string;
  lyrics: LyricLine[];
  durationSeconds: number;
}

/**
 * Parse MIDI-based karaoke files (MK1, ST3, KAR)
 * These formats embed lyrics as MIDI text events (meta events) in the MIDI stream.
 */
export function parseKaraokeFile(file: File): Promise<ParsedKaraokeFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error("Falha ao ler arquivo");

        const midi = MidiParser.parse(new Uint8Array(data as ArrayBuffer));
        if (!midi || !midi.track) throw new Error("Arquivo MIDI inválido");

        const lyrics: LyricLine[] = [];
        let title = file.name.replace(/\.(mk1|st3|kar|mid|midi)$/i, "");
        let artist = "Artista Desconhecido";
        let totalTicks = 0;
        const timeDivision = midi.timeDivision || 480;
        // Default tempo 120 BPM
        let microsecondsPerBeat = 500000;

        for (const track of midi.track) {
          let tickAccum = 0;

          for (const event of track.event) {
            tickAccum += event.deltaTime || 0;

            // Meta events
            if (event.type === 255) {
              const timeSeconds = ticksToSeconds(tickAccum, microsecondsPerBeat, timeDivision);

              switch (event.metaType) {
                case 1: // Text event - lyrics in some formats
                case 5: // Lyric event
                  {
                    const text = decodeText(event.data);
                    if (text && text.trim().length > 0) {
                      const cleanText = cleanLyricText(text);
                      if (cleanText) {
                        // Merge with previous line if same timestamp (within 0.1s)
                        const last = lyrics[lyrics.length - 1];
                        if (last && Math.abs(last.time - timeSeconds) < 0.1) {
                          last.text += cleanText;
                        } else {
                          lyrics.push({ time: timeSeconds, text: cleanText });
                        }
                      }
                    }
                  }
                  break;
                case 3: // Track name
                  {
                    const trackName = decodeText(event.data);
                    if (trackName && trackName.trim()) {
                      // Often contains song title
                      if (!title || title === file.name.replace(/\.\w+$/, "")) {
                        title = trackName.trim();
                      }
                    }
                  }
                  break;
                case 2: // Copyright - sometimes has artist
                  {
                    const copyright = decodeText(event.data);
                    if (copyright && copyright.trim()) {
                      artist = copyright.trim();
                    }
                  }
                  break;
                case 81: // Tempo change
                  if (typeof event.data === "number") {
                    microsecondsPerBeat = event.data;
                  }
                  break;
              }
            }

            totalTicks = Math.max(totalTicks, tickAccum);
          }
        }

        // Merge fragmented syllables into full lines
        const mergedLyrics = mergeSyllablesIntoLines(lyrics);

        const durationSeconds = ticksToSeconds(totalTicks, microsecondsPerBeat, timeDivision);

        // Try to extract title/artist from filename pattern "Artist - Title"
        const fileNameClean = file.name.replace(/\.(mk1|st3|kar|mid|midi)$/i, "");
        const dashMatch = fileNameClean.match(/^(.+?)\s*[-–]\s*(.+)$/);
        if (dashMatch) {
          artist = dashMatch[1].trim();
          title = dashMatch[2].trim();
        }

        resolve({
          title,
          artist,
          lyrics: mergedLyrics.length > 0 ? mergedLyrics : [{ time: 0, text: "Sem letras encontradas neste arquivo" }],
          durationSeconds,
        });
      } catch (err) {
        reject(new Error(`Erro ao processar arquivo: ${(err as Error).message}`));
      }
    };

    reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
    reader.readAsArrayBuffer(file);
  });
}

function ticksToSeconds(ticks: number, microsecondsPerBeat: number, timeDivision: number): number {
  return (ticks / timeDivision) * (microsecondsPerBeat / 1_000_000);
}

function decodeText(data: unknown): string {
  if (typeof data === "string") return data;
  if (Array.isArray(data)) {
    return data.map((c: number) => String.fromCharCode(c)).join("");
  }
  if (data instanceof Uint8Array) {
    return new TextDecoder("utf-8").decode(data);
  }
  return "";
}

function cleanLyricText(text: string): string {
  // Remove common karaoke control chars
  return text
    .replace(/\//g, "\n")
    .replace(/\\/g, "\n")
    .replace(/\r/g, "")
    .trim();
}

function mergeSyllablesIntoLines(lyrics: LyricLine[]): LyricLine[] {
  if (lyrics.length === 0) return [];

  const merged: LyricLine[] = [];
  let currentLine: LyricLine = { ...lyrics[0] };

  for (let i = 1; i < lyrics.length; i++) {
    const gap = lyrics[i].time - (lyrics[i - 1].time);

    // If gap is small (< 2 seconds) and text is short, it's likely a syllable
    if (gap < 2 && lyrics[i].text.length < 15 && !lyrics[i].text.includes("\n")) {
      currentLine.text += lyrics[i].text;
    } else {
      if (currentLine.text.trim()) {
        merged.push({ time: currentLine.time, text: currentLine.text.trim() });
      }
      currentLine = { ...lyrics[i] };
    }
  }

  if (currentLine.text.trim()) {
    merged.push({ time: currentLine.time, text: currentLine.text.trim() });
  }

  return merged;
}

export function isKaraokeFile(filename: string): boolean {
  return /\.(mk1|st3|kar|mid|midi)$/i.test(filename);
}

export function getAcceptedFormats(): string {
  return ".mk1,.st3,.kar,.mid,.midi";
}
