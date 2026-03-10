import MidiParser from "midi-parser-js";
import { LyricLine } from "@/data/songs";

export interface ParsedKaraokeFile {
  title: string;
  artist: string;
  lyrics: LyricLine[];
  durationSeconds: number;
}

/**
 * Parse karaoke files (MK1, ST3, KAR, MID)
 * MK1/ST3 are proprietary RealOrche formats that embed MIDI + lyrics.
 * We scan the binary for the MIDI header "MThd" and also extract text content.
 */
export function parseKaraokeFile(file: File): Promise<ParsedKaraokeFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer) throw new Error("Falha ao ler arquivo");

        const bytes = new Uint8Array(buffer);
        const ext = file.name.split(".").pop()?.toLowerCase() || "";

        let lyrics: LyricLine[] = [];
        let title = file.name.replace(/\.(mk1|st3|kar|mid|midi)$/i, "");
        let artist = "Artista Desconhecido";
        let durationSeconds = 180;

        // Try to extract title/artist from filename "Artist - Title"
        const fileNameClean = file.name.replace(/\.\w+$/i, "");
        const dashMatch = fileNameClean.match(/^(.+?)\s*[-–—]\s*(.+)$/);
        if (dashMatch) {
          artist = dashMatch[1].trim();
          title = dashMatch[2].trim();
        } else {
          // Try "(Artist) Title" pattern
          const parenMatch = fileNameClean.match(/^\((.+?)\)\s*(.+)$/);
          if (parenMatch) {
            artist = parenMatch[1].trim();
            title = parenMatch[2].trim();
          }
        }

        // Strategy 1: Find MIDI data within the file (look for "MThd" magic bytes)
        const midiOffset = findMidiOffset(bytes);
        
        if (midiOffset >= 0) {
          // Extract MIDI portion
          const midiData = bytes.slice(midiOffset);
          try {
            const midi = MidiParser.parse(midiData);
            if (midi && midi.track) {
              const result = extractLyricsFromMidi(midi);
              if (result.lyrics.length > 0) lyrics = result.lyrics;
              if (result.title) title = result.title;
              if (result.artist) artist = result.artist;
              durationSeconds = result.durationSeconds || 180;
            }
          } catch {
            // MIDI parsing failed, continue with text extraction
          }
        }

        // Strategy 2: Extract readable text from the binary (for proprietary formats)
        if (lyrics.length === 0) {
          const textLyrics = extractTextFromBinary(bytes, ext);
          if (textLyrics.length > 0) {
            lyrics = textLyrics;
          }
        }

        // Strategy 3: Try parsing the entire file as MIDI (for .kar and .mid)
        if (lyrics.length === 0 && (ext === "kar" || ext === "mid" || ext === "midi")) {
          try {
            const midi = MidiParser.parse(bytes);
            if (midi && midi.track) {
              const result = extractLyricsFromMidi(midi);
              if (result.lyrics.length > 0) lyrics = result.lyrics;
              if (result.title) title = result.title;
              if (result.artist) artist = result.artist;
              durationSeconds = result.durationSeconds || 180;
            }
          } catch {
            // ignore
          }
        }

        if (lyrics.length === 0) {
          lyrics = [{ time: 0, text: "Letras não encontradas — tente um arquivo .kar ou .mid padrão" }];
        }

        resolve({ title, artist, lyrics, durationSeconds });
      } catch (err) {
        reject(new Error(`Erro ao processar arquivo: ${(err as Error).message}`));
      }
    };

    reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
    reader.readAsArrayBuffer(file);
  });
}

/** Scan binary data for MIDI header "MThd" (0x4D546864) */
function findMidiOffset(bytes: Uint8Array): number {
  const M = 0x4D, T = 0x54, h = 0x68, d = 0x64;
  for (let i = 0; i < bytes.length - 4; i++) {
    if (bytes[i] === M && bytes[i+1] === T && bytes[i+2] === h && bytes[i+3] === d) {
      return i;
    }
  }
  return -1;
}

/** Extract lyrics from parsed MIDI data */
function extractLyricsFromMidi(midi: any): {
  lyrics: LyricLine[];
  title: string | null;
  artist: string | null;
  durationSeconds: number;
} {
  const lyrics: LyricLine[] = [];
  let title: string | null = null;
  let artist: string | null = null;
  let totalTicks = 0;
  const timeDivision = midi.timeDivision || 480;
  let microsecondsPerBeat = 500000;

  for (const track of midi.track) {
    let tickAccum = 0;

    for (const event of track.event) {
      tickAccum += event.deltaTime || 0;

      if (event.type === 255) {
        const timeSeconds = ticksToSeconds(tickAccum, microsecondsPerBeat, timeDivision);

        switch (event.metaType) {
          case 1: // Text event
          case 5: // Lyric event
            {
              const text = decodeEventData(event.data);
              if (text && text.trim().length > 0) {
                const cleanText = cleanLyricText(text);
                if (cleanText) {
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
              const name = decodeEventData(event.data);
              if (name?.trim() && !title) title = name.trim();
            }
            break;
          case 2: // Copyright
            {
              const cr = decodeEventData(event.data);
              if (cr?.trim()) artist = cr.trim();
            }
            break;
          case 81: // Tempo
            if (typeof event.data === "number") {
              microsecondsPerBeat = event.data;
            }
            break;
        }
      }
      totalTicks = Math.max(totalTicks, tickAccum);
    }
  }

  const merged = mergeSyllablesIntoLines(lyrics);
  const durationSeconds = ticksToSeconds(totalTicks, microsecondsPerBeat, timeDivision);

  return { lyrics: merged, title, artist, durationSeconds };
}

/**
 * Extract readable text/lyrics from binary data (for MK1/ST3 proprietary formats).
 * These formats often store lyrics as plain text blocks within the binary.
 */
function extractTextFromBinary(bytes: Uint8Array, ext: string): LyricLine[] {
  const lines: LyricLine[] = [];

  // Decode the entire file as latin1/iso-8859-1 (common for Brazilian karaoke files)
  let fullText = "";
  for (let i = 0; i < bytes.length; i++) {
    fullText += String.fromCharCode(bytes[i]);
  }

  // Look for text blocks that look like lyrics
  // Common patterns: lines separated by CR/LF, syllables separated by /
  // Try to find a contiguous block of readable text

  // Extract all printable text sequences (min 3 chars)
  const textBlocks: { offset: number; text: string }[] = [];
  let currentBlock = "";
  let blockStart = 0;

  for (let i = 0; i < fullText.length; i++) {
    const code = fullText.charCodeAt(i);
    // Printable ASCII + common accented chars (latin1 range)
    const isPrintable = (code >= 32 && code <= 126) ||
      (code >= 160 && code <= 255) ||
      code === 10 || code === 13 || code === 9;

    if (isPrintable) {
      if (currentBlock.length === 0) blockStart = i;
      currentBlock += fullText[i];
    } else {
      if (currentBlock.trim().length >= 3) {
        textBlocks.push({ offset: blockStart, text: currentBlock });
      }
      currentBlock = "";
    }
  }
  if (currentBlock.trim().length >= 3) {
    textBlocks.push({ offset: blockStart, text: currentBlock });
  }

  // Find the largest text block that looks like lyrics
  // Lyrics typically have newlines, slashes (syllable separators), and common words
  let bestBlock = "";
  let bestScore = 0;

  for (const block of textBlocks) {
    const text = block.text.trim();
    if (text.length < 20) continue;

    let score = text.length;
    // Bonus for newlines (structured text)
    score += (text.match(/\n/g) || []).length * 10;
    // Bonus for slashes (syllable markers in RealOrche format)
    score += (text.match(/\//g) || []).length * 5;
    // Bonus for common Portuguese words
    const ptWords = ["que", "não", "você", "pra", "com", "uma", "mas", "por", "meu", "seu"];
    for (const w of ptWords) {
      if (text.toLowerCase().includes(w)) score += 20;
    }
    // Bonus for common English words
    const enWords = ["the", "you", "love", "and", "was", "her", "his"];
    for (const w of enWords) {
      if (text.toLowerCase().includes(w)) score += 15;
    }

    if (score > bestScore) {
      bestScore = score;
      bestBlock = text;
    }
  }

  if (bestBlock) {
    // Parse the text block into lyrics lines
    // Handle RealOrche syllable format: "To/dos/ os/ di/as/"
    // Join syllables and split by newlines
    const joinedText = bestBlock.replace(/\//g, "");
    const rawLines = joinedText.split(/[\r\n]+/).filter((l) => l.trim().length > 0);

    // Estimate timing: distribute evenly, ~3 seconds per line
    const timePerLine = 3;
    for (let i = 0; i < rawLines.length; i++) {
      const text = rawLines[i].trim();
      if (text.length > 0) {
        lines.push({ time: i * timePerLine, text });
      }
    }
  }

  return lines;
}

function ticksToSeconds(ticks: number, microsecondsPerBeat: number, timeDivision: number): number {
  return (ticks / timeDivision) * (microsecondsPerBeat / 1_000_000);
}

function decodeEventData(data: unknown): string {
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
    const gap = lyrics[i].time - lyrics[i - 1].time;

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
