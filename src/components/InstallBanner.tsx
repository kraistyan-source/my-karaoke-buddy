import { useState } from "react";
import { Download, Check, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

const InstallBanner = () => {
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);

  // Check if app is already installed (standalone mode)
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;

  if (dismissed || isStandalone) return null;

  const handleInstall = async () => {
    // Try to use the beforeinstallprompt event if available
    const deferredPrompt = (window as any).__pwaInstallPrompt;
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === "accepted") {
        setInstalled(true);
      }
    } else {
      // Fallback: show instructions
      setInstalled(true);
    }
  };

  return (
    <div className="border border-secondary/30 bg-secondary/5 rounded p-4 flex items-center gap-4">
      <Smartphone className="h-8 w-8 text-secondary flex-shrink-0 animate-pulse-neon" />
      <div className="flex-1 min-w-0">
        <p className="font-display text-xs text-secondary">INSTALE O APP</p>
        <p className="text-xs text-muted-foreground font-mono mt-1">
          {installed
            ? "USE O MENU DO NAVEGADOR → ADICIONAR À TELA INICIAL"
            : "TENHA O STARSING NA SUA TELA INICIAL"}
        </p>
      </div>
      <button
        onClick={installed ? () => setDismissed(true) : handleInstall}
        className={cn(
          "flex-shrink-0 border rounded px-3 py-2 font-display text-xs transition-all",
          installed
            ? "border-muted text-muted-foreground"
            : "border-secondary text-secondary neon-box-secondary hover:bg-secondary/10"
        )}
      >
        {installed ? (
          <Check className="h-4 w-4" />
        ) : (
          <Download className="h-4 w-4" />
        )}
      </button>
    </div>
  );
};

export default InstallBanner;

// Capture the install prompt globally
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    (window as any).__pwaInstallPrompt = e;
  });
}
