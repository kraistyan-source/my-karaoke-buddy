import { useState, useRef } from "react";
import { Upload, FileMusic, X, AlertCircle } from "lucide-react";
import { parseKaraokeFile, getAcceptedFormats, ParsedKaraokeFile } from "@/lib/karaokeParser";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileLoaded: (parsed: ParsedKaraokeFile) => void;
}

const FileUpload = ({ onFileLoaded }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setFileName(file.name);
    setIsLoading(true);

    try {
      const parsed = await parseKaraokeFile(file);
      onFileLoaded(parsed);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const clear = () => {
    setFileName(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <h3 className="font-display text-xs text-secondary neon-text-secondary">
        IMPORTAR ARQUIVO
      </h3>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded p-6 text-center cursor-pointer transition-all",
          isDragging
            ? "border-secondary bg-secondary/5 neon-box-secondary"
            : "border-border hover:border-muted-foreground",
          isLoading && "opacity-50 pointer-events-none"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={getAcceptedFormats()}
          onChange={handleChange}
          className="hidden"
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-2">
            <FileMusic className="h-8 w-8 text-primary animate-pulse-neon" />
            <p className="text-sm text-muted-foreground font-mono">PROCESSANDO...</p>
          </div>
        ) : fileName ? (
          <div className="flex flex-col items-center gap-2">
            <FileMusic className="h-8 w-8 text-secondary" />
            <p className="text-sm text-foreground font-mono">{fileName}</p>
            <button
              onClick={(e) => { e.stopPropagation(); clear(); }}
              className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
            >
              <X className="h-3 w-3" /> REMOVER
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground font-mono">
              ARRASTE UM ARQUIVO MK1, ST3 OU KAR
            </p>
            <p className="text-xs text-muted-foreground/60 font-mono">
              OU CLIQUE PARA SELECIONAR
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-destructive font-mono">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
