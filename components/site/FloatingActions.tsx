"use client";

import { Mail, MessageCircle, MessageSquareText, PhoneCall, X } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { COMPANY } from "@/lib/company";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
    <circle cx="18" cy="18" r="18" fill="#1EBEA5" />
    <path
      d="M15.412 11.235c-.244-.537-.5-.547-.733-.556-.19-.008-.41-.008-.63-.008s-.574.08-.873.403c-.3.323-1.146 1.118-1.146 2.72s1.173 3.15 1.336 3.366c.164.215 2.292 3.66 5.553 4.962.776.31 1.38.496 1.85.635.776.228 1.482.196 2.04.118.625-.087 1.917-.78 2.188-1.533.272-.754.272-1.4.19-1.534-.08-.134-.3-.214-.735-.43-.22-.108-1.285-.635-1.485-.707-.2-.072-.346-.108-.492.108-.146.215-.563.708-.69.85-.128.144-.255.162-.475.054-.22-.108-.916-.338-1.745-1.077-.645-.575-1.08-1.286-1.206-1.503-.127-.216-.014-.333.096-.44.098-.097.22-.252.33-.378.11-.126.146-.216.22-.36.073-.144.037-.27-.018-.378-.055-.108-.492-1.187-.674-1.623z"
      fill="white"
      transform="matrix(.9 0 0 .9 2 2)"
    />
    <path
      d="M18 8a9.95 9.95 0 0 0-8.5 15.17l-1.4 4.14 4.26-1.38A9.95 9.95 0 1 0 18 8zm0 18.2a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-2.5.8.66-2.43-.2-.31A8.25 8.25 0 1 1 18 26.2z"
      fill="white"
    />
  </svg>
);

type ChatOption = {
  id: string;
  name: string;
  icon: ReactNode;
  href?: string;
  action?: () => void;
};

/*
 * Every tile but WhatsApp wears a brand colour. WhatsApp keeps its own green
 * because that circle is the service's mark, not ours, and recolouring it
 * makes the row harder to scan rather than more consistent.
 */
const tile = "grid h-10 w-10 place-items-center rounded-full text-white shadow-soft";

export const FloatingActions = () => {
  const [isOpen, setIsOpen] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const CHAT_OPTIONS: ChatOption[] = [
    {
      id: "whatsapp",
      name: "WhatsApp",
      icon: <WhatsAppIcon className="h-10 w-10" />,
      href: `https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent("Hello, I'm interested in your services. Can you help me with an eWill?")}`,
    },
    {
      id: "live-chat",
      name: "Live Chat",
      icon: (
        <div className={`${tile} bg-gradient-teal`}>
          <MessageSquareText className="h-5 w-5" />
        </div>
      ),
      action: () => {
        const tawk = (window as unknown as { Tawk_API?: { toggle?: () => void } }).Tawk_API;
        tawk?.toggle?.();
      },
    },
    {
      id: "email",
      name: "Email us",
      icon: (
        <div className={`${tile} bg-navy`}>
          <Mail className="h-5 w-5" />
        </div>
      ),
      href: `mailto:${COMPANY.email}`,
    },
    {
      id: "callback",
      name: "Call us",
      icon: (
        <div className={`${tile} bg-gold text-gold-foreground`}>
          <PhoneCall className="h-5 w-5" />
        </div>
      ),
      href: COMPANY.phoneHref,
    },
  ];

  return (
    <div ref={widgetRef} className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {/* Menu options */}
      <div
        role="menu"
        aria-label="Ways to reach us"
        inert={!isOpen}
        className={`absolute bottom-[70px] right-0 flex w-48 origin-bottom-right flex-col rounded-xl border border-navy/10 bg-card py-2 shadow-elegant transition-smooth md:w-64 ${
          isOpen
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-4 scale-90 opacity-0"
        }`}
      >
        {/* Tail. The second span masks the part of the rotated square that
            would otherwise show its edge inside the panel. */}
        <span className="absolute -bottom-2 right-6 h-4 w-4 rotate-45 rounded-[2px] border border-navy/10 bg-card" />
        <span className="absolute bottom-0 right-4 z-10 h-4 w-8 bg-card" />

        <div className="relative z-20 flex flex-col">
          {CHAT_OPTIONS.map((option) => (
            <a
              key={option.id}
              role="menuitem"
              href={option.href ?? "#"}
              target={option.href?.startsWith("http") ? "_blank" : undefined}
              rel={option.href?.startsWith("http") ? "noopener noreferrer" : undefined}
              className="group flex cursor-pointer items-center gap-4 px-5 py-1.5 transition-colors hover:bg-accent"
              onClick={(event) => {
                if (option.action) {
                  event.preventDefault();
                  option.action();
                }
                setIsOpen(false);
              }}
            >
              <span className="transition-transform group-hover:scale-110">{option.icon}</span>
              <span className="text-[15px] font-medium text-navy">{option.name}</span>
            </a>
          ))}
        </div>
      </div>

      {/*
       * The halos are siblings that precede the button rather than children of
       * it, so the button's own background paints over them. As children they
       * covered the gradient face entirely, which is what made the control read
       * as a flat cyan disc.
       */}
      <div className="relative h-14 w-14">
        {!isOpen && (
          <>
            <span
              aria-hidden
              className="absolute inset-0 rounded-full bg-primary-glow animate-pulse-ring"
            />
            <span
              aria-hidden
              className="absolute inset-0 rounded-full bg-gold-glow animate-pulse-ring [animation-delay:1.2s]"
            />
          </>
        )}

        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-label={isOpen ? "Close contact options" : "Contact us"}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          className="relative grid h-14 w-14 place-items-center rounded-full bg-gradient-teal text-primary-foreground shadow-brand ring-1 ring-gold/40 transition-smooth hover:-translate-y-0.5 hover:scale-105 hover:shadow-brand-strong hover:ring-gold/70"
        >
          {/* A light caught on the top-left edge, so the circle reads as a
              raised button rather than a flat swatch. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_22%,color-mix(in_oklab,white_32%,transparent),transparent_62%)]"
          />

          <span className="relative grid h-7 w-7 place-items-center">
            <MessageCircle
              className={`absolute h-6 w-6 transition-smooth ${
                isOpen ? "scale-50 -rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"
              }`}
            />
            <X
              className={`absolute h-6 w-6 transition-smooth ${
                isOpen ? "scale-100 rotate-0 opacity-100" : "scale-50 rotate-90 opacity-0"
              }`}
            />
          </span>
        </button>
      </div>
    </div>
  );
};
