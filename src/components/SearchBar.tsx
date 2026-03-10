import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const SearchBar = ({ value, onChange, className }: SearchBarProps) => {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="BUSCAR MÚSICA..."
        className="w-full bg-muted border border-border rounded pl-11 pr-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:neon-box-primary transition-all"
      />
    </div>
  );
};

export default SearchBar;
