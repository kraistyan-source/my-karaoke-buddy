import { useState, useEffect, useCallback } from "react";

export interface AudioDevice {
  deviceId: string;
  label: string;
  kind: "audioinput" | "audiooutput";
}

export function useAudioDevices() {
  const [inputs, setInputs] = useState<AudioDevice[]>([]);
  const [outputs, setOutputs] = useState<AudioDevice[]>([]);
  const [selectedInput, setSelectedInput] = useState<string>("");
  const [selectedOutput, setSelectedOutput] = useState<string>("");
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const enumerate = useCallback(async () => {
    try {
      // Request permission first so labels are visible
      await navigator.mediaDevices.getUserMedia({ audio: true }).then((s) => s.getTracks().forEach((t) => t.stop()));
      const devices = await navigator.mediaDevices.enumerateDevices();
      const ins = devices
        .filter((d) => d.kind === "audioinput")
        .map((d) => ({ deviceId: d.deviceId, label: d.label || `Mic ${d.deviceId.slice(0, 6)}`, kind: "audioinput" as const }));
      const outs = devices
        .filter((d) => d.kind === "audiooutput")
        .map((d) => ({ deviceId: d.deviceId, label: d.label || `Saída ${d.deviceId.slice(0, 6)}`, kind: "audiooutput" as const }));
      setInputs(ins);
      setOutputs(outs);
      if (!selectedInput && ins.length) setSelectedInput(ins[0].deviceId);
      if (!selectedOutput && outs.length) setSelectedOutput(outs[0].deviceId);
    } catch {
      // permission denied
    }
  }, [selectedInput, selectedOutput]);

  useEffect(() => {
    enumerate();
    navigator.mediaDevices?.addEventListener("devicechange", enumerate);
    return () => navigator.mediaDevices?.removeEventListener("devicechange", enumerate);
  }, [enumerate]);

  const startMic = useCallback(async (deviceId?: string) => {
    // Stop previous
    micStream?.getTracks().forEach((t) => t.stop());

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: deviceId || selectedInput ? { exact: deviceId || selectedInput } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const node = ctx.createAnalyser();
      node.fftSize = 256;
      source.connect(node);
      setMicStream(stream);
      setAnalyser(node);
      return node;
    } catch {
      return null;
    }
  }, [selectedInput, micStream]);

  const stopMic = useCallback(() => {
    micStream?.getTracks().forEach((t) => t.stop());
    setMicStream(null);
    setAnalyser(null);
  }, [micStream]);

  const setOutputDevice = useCallback(async (deviceId: string, mediaEl?: HTMLMediaElement) => {
    setSelectedOutput(deviceId);
    if (mediaEl && "setSinkId" in mediaEl) {
      try {
        await (mediaEl as any).setSinkId(deviceId);
      } catch {}
    }
  }, []);

  return {
    inputs,
    outputs,
    selectedInput,
    selectedOutput,
    setSelectedInput,
    setOutputDevice,
    startMic,
    stopMic,
    micStream,
    analyser,
    enumerate,
  };
}
