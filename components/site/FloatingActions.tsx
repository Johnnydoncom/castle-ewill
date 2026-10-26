"use client";
import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, Phone } from "lucide-react";

import { MessageSquareText, Mail, PhoneCall, X } from "lucide-react";
import { COMPANY } from "@/lib/company";

const MessengerIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="18" cy="18" r="18" fill="#4B77F6" />
    <path
      d="M18 9C12.477 9 8 13.048 8 18.04c0 2.85 1.442 5.397 3.692 7.037v4.135l3.385-1.872c.93.262 1.91.4 2.923.4 5.523 0 10-4.04 10-9.04S23.523 9 18 9zm.914 12.35l-2.34-2.518-4.574 2.518 5.032-5.367 2.39 2.517 4.52-2.517-5.03 5.367z"
      fill="white"
    />
  </svg>
);

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
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


export const FloatingActions = () => {
  const [isOpen, setIsOpen] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const CHAT_OPTIONS = [
    // {
    //   id: "messenger",
    //   name: "Messenger",
    //   icon: <MessengerIcon className="h-10 w-10" />,
    //   href: BRAND.messenger || "#",
    // },
    {
      id: "whatsapp",
      name: "WhatsApp",
      icon: <WhatsAppIcon className="h-10 w-10" />,
      href: `https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent(`Hello, I'm interested in your services. Can you help me with an eWill?`)}`,
    },
    {
      id: "live-chat",
      name: "Live Chat",
      icon: (
        <div className="h-10 w-10 rounded-full bg-[#03A84E] flex items-center justify-center text-white">
          <MessageSquareText className="h-5 w-5" />
        </div>
      ),
      action: () => {
        if (typeof window !== "undefined" && (window as any).Tawk_API) {
          (window as any).Tawk_API.toggle();
        }
      },
    },
    {
      id: "email",
      name: "Email us",
      icon: (
        <div className="h-10 w-10 rounded-full bg-[#FF5A36] flex items-center justify-center text-white">
          <Mail className="h-5 w-5" />
        </div>
      ),
      href: `mailto:${COMPANY.email}`,
    },
    {
      id: "callback",
      name: "Call us",
      icon: (
        <div className="h-10 w-10 rounded-full bg-[#4CAF50] flex items-center justify-center text-white">
          <PhoneCall className="h-5 w-5" />
        </div>
      ),
      href: `${COMPANY.phoneHref}`,
    },
  ];



  return (
    <div ref={widgetRef} className="fixed bottom-5 right-5 z-40 flex flex-col gap-3">

      {/* Menu Options Container */}
      <div
        className={`absolute bottom-[70px] right-0 w-44 md:w-64 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] origin-bottom-right transition-all duration-300 ease-out flex flex-col py-2 ${isOpen
          ? "scale-100 opacity-100 pointer-events-auto translate-y-0"
          : "scale-90 opacity-0 pointer-events-none translate-y-4"
          }`}
      >
        {/* Downward pointing triangle (tail) */}
        <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white rotate-45 shadow-[4px_4px_10px_rgba(0,0,0,0.05)]" />

        {/* White overlay to cover the shadow of the triangle pointing up inside the box */}
        <div className="absolute bottom-0 right-4 w-8 h-4 bg-white z-10" />

        <div className="relative z-20 flex flex-col">
          {CHAT_OPTIONS.map((option) => (
            <a
              key={option.id}
              href={option.href || "#"}
              target={option.href?.startsWith("http") ? "_blank" : undefined}
              rel={option.href?.startsWith("http") ? "noopener noreferrer" : undefined}
              className="flex items-center gap-4 px-5 py-1.5 hover:bg-slate-50 transition-colors cursor-pointer group"
              onClick={(e) => {
                if (option.action) {
                  e.preventDefault();
                  option.action();
                }
                setIsOpen(false);
              }}
            >
              <div className="transition-transform group-hover:scale-110">{option.icon}</div>
              <span className="text-slate-700 font-medium text-[15px]">{option.name}</span>
            </a>
          ))}
        </div>
      </div>


      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Chat on WhatsApp"
        className="relative h-13 w-13 grid place-items-center rounded-full bg-gradient-brand text-primary-foreground shadow-brand transition-smooth hover:scale-110"
        style={{ height: 56, width: 56 }}
      >
        <span className="absolute inset-0 rounded-full bg-primary-glow animate-pulse-ring" />

        <X className={`h-7 w-7 ${isOpen ? "block rotate-0 scale-100" : "hidden -rotate-90 scale-50"
          }`} />

        <MessageCircle className={`relative h-6 w-6 ${isOpen ? "hidden" : "block"
          }`} />
      </button>
    </div>
  );
};
