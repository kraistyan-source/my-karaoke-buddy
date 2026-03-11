import { Mic, Speaker, RefreshCw } from "lucide-react";
import { AudioDevice } from "@/stores/useAudioDevices";
import { cn } from "@/lib/utils";

interface AudioDeviceSelectorProps {
  inputs: AudioDevice[];
  outputs: AudioDevice[];
  selectedInput: string;
  selectedOutput: string;
  onSelectInput: (id: string) => void;
  onSelectOutput: (id: string) => void;
  onRefresh: () => void;
}

const AudioDeviceSelector = ({
  inputs,
  outputs,
  selectedInput,
  selectedOutput,
  onSelectInput,
  onSelectOutput,
  onRefresh,
}: AudioDeviceSelectorProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
          DISPOSITIVOS DE ÁUDIO
        </h4>
        <button
          onClick={onRefresh}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          title="Atualizar dispositivos"
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>

      {/* Microphone input */}
      <div className="space-y-1">
        <label className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
          <Mic className="h-3 w-3" />
          MICROFONE
        </label>
        <select
          value={selectedInput}
          onChange={(e) => onSelectInput(e.target.value)}
          className={cn(
            "w-full text-xs font-mono rounded px-2 py-1.5 border transition-colors",
            "bg-card border-border text-foreground",
            "focus:outline-none focus:border-primary"
          )}
        >
          {inputs.length === 0 && <option value="">Nenhum microfone encontrado</option>}
          {inputs.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      {/* Audio output */}
      <div className="space-y-1">
        <label className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
          <Speaker className="h-3 w-3" />
          SAÍDA DE ÁUDIO
        </label>
        <select
          value={selectedOutput}
          onChange={(e) => onSelectOutput(e.target.value)}
          className={cn(
            "w-full text-xs font-mono rounded px-2 py-1.5 border transition-colors",
            "bg-card border-border text-foreground",
            "focus:outline-none focus:border-primary"
          )}
        >
          {outputs.length === 0 && <option value="">Padrão do sistema</option>}
          {outputs.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default AudioDeviceSelector;
