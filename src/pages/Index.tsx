import { useState, useMemo } from "react";
import { Mic2 } from "lucide-react";
import { songs, Song } from "@/data/songs";
import SearchBar from "@/components/SearchBar";
import GenreFilter from "@/components/GenreFilter";
import SongCard from "@/components/SongCard";
import SingScreen from "@/components/SingScreen";

const Index = () => {
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState<string | null>(null);
  const [activeSong, setActiveSong] = useState<Song | null>(null);

  const genres = useMemo(() => {
    return [...new Set(songs.map((s) => s.genre))];
  }, []);

  const filtered = useMemo(() => {
    return songs.filter((s) => {
      const matchSearch =
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.artist.toLowerCase().includes(search.toLowerCase());
      const matchGenre = !genre || s.genre === genre;
      return matchSearch && matchGenre;
    });
  }, [search, genre]);

  if (activeSong) {
    return <SingScreen song={activeSong} onBack={() => setActiveSong(null)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative overflow-hidden border-b border-border">
        <div className="vhs-scanlines absolute inset-0" />
        <div className="relative z-10 px-6 pt-12 pb-8 max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Mic2 className="h-8 w-8 text-primary animate-pulse-neon" />
            <h1
              className="font-display text-3xl md:text-5xl text-primary neon-text-primary animate-flicker glitch-text"
              data-text="RUÍDO ROSA"
            >
              RUÍDO ROSA
            </h1>
          </div>
          <p className="text-muted-foreground text-sm font-mono mt-2">
            SEM PONTUAÇÃO. SEM FILTROS. SÓ VOCÊ E A MÚSICA.
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-6 py-6 space-y-6">
        <SearchBar value={search} onChange={setSearch} />
        <GenreFilter genres={genres} selected={genre} onSelect={setGenre} />

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground font-mono text-sm">
                NENHUMA MÚSICA ENCONTRADA
              </p>
            </div>
          ) : (
            filtered.map((song, i) => (
              <SongCard key={song.id} song={song} onPlay={setActiveSong} index={i} />
            ))
          )}
        </div>

        <footer className="text-center py-8 border-t border-border">
          <p className="text-muted-foreground text-xs font-mono">
            ESTÚDIO RUÍDO ROSA © 2026 — CANTE COM A ALMA
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
