import logoAsset from "@/assets/castle-ewill-logo.png.asset.json";
import { Link } from "@tanstack/react-router";

interface LogoProps {
  size?: number;
  withWordmark?: boolean;
  variant?: "default" | "light";
  linked?: boolean;
  className?: string;
}

export function Logo({
  size = 40,
  withWordmark = true,
  variant = "default",
  linked = true,
  className = "",
}: LogoProps) {
  const content = (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <img
        src={logoAsset.url}
        alt="Castle eWill & Trust"
        width={size}
        height={size}
        className="rounded-full"
        style={{ width: size, height: size }}
      />
      {withWordmark && (
        <span className="flex flex-col leading-none">
          <span
            className={`font-serif text-lg tracking-tight ${
              variant === "light" ? "text-navy-foreground" : "text-navy"
            }`}
          >
            Castle
          </span>
          <span
            className={`text-[10px] uppercase tracking-[0.2em] ${
              variant === "light" ? "text-gold" : "text-gold"
            }`}
          >
            eWill & Trust
          </span>
        </span>
      )}
    </span>
  );

  if (!linked) return content;
  return (
    <Link to="/" className="inline-flex items-center">
      {content}
    </Link>
  );
}
