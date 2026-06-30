interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  as?: "div" | "button" | "section";
  onClick?: () => void;
}

export default function GlassCard({
  children,
  className = "",
  hover = true,
  as: Component = "div",
  onClick,
}: GlassCardProps) {
  return (
    <Component
      onClick={onClick}
      className={`glass-card rounded-2xl ${hover ? "glass-card-hover" : ""} ${className}`}
    >
      {children}
    </Component>
  );
}
