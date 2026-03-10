interface GlowBorderProps {
  color1: string; // HSL values
  color2: string;
}

const GlowBorder = ({ color1, color2 }: GlowBorderProps) => {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 6 }}>
      {/* Animated border */}
      <div
        className="absolute inset-2 rounded-lg animate-glow-border"
        style={{
          border: `2px solid hsl(${color1} / 0.4)`,
          boxShadow: `
            inset 0 0 20px hsl(${color1} / 0.05),
            0 0 15px hsl(${color1} / 0.15),
            0 0 40px hsl(${color1} / 0.08)
          `,
        }}
      />
      {/* Corner accents */}
      {["top-2 left-2", "top-2 right-2", "bottom-2 left-2", "bottom-2 right-2"].map((pos, i) => (
        <div
          key={i}
          className={`absolute ${pos} w-6 h-6`}
          style={{
            borderColor: `hsl(${i % 2 === 0 ? color1 : color2} / 0.7)`,
            borderWidth: "2px",
            borderStyle: "solid",
            borderRadius: "2px",
            ...(pos.includes("top") && pos.includes("left") ? { borderRight: "none", borderBottom: "none" } : {}),
            ...(pos.includes("top") && pos.includes("right") ? { borderLeft: "none", borderBottom: "none" } : {}),
            ...(pos.includes("bottom") && pos.includes("left") ? { borderRight: "none", borderTop: "none" } : {}),
            ...(pos.includes("bottom") && pos.includes("right") ? { borderLeft: "none", borderTop: "none" } : {}),
            boxShadow: `0 0 8px hsl(${i % 2 === 0 ? color1 : color2} / 0.5)`,
          }}
        />
      ))}
    </div>
  );
};

export default GlowBorder;
