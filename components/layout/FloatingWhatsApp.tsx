"use client";

import { useEffect, useState } from "react";
import { WhatsAppIcon } from "@/components/ui/BrandIcons";
import { whatsappLink, WHATSAPP_MESSAGES } from "@/lib/utils/whatsapp";
import { cn } from "@/lib/utils";

export function FloatingWhatsApp({ whatsapp }: { whatsapp: string }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 320);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <a
      href={whatsappLink(whatsapp, WHATSAPP_MESSAGES.floating)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Saim on WhatsApp"
      className={cn(
        "group fixed z-40 flex items-center gap-2.5 rounded-full border border-white/10 bg-[#0b1426]/90 py-2 pl-2 pr-2 text-white shadow-[0_12px_40px_-10px_rgb(37_99_235/0.9)] backdrop-blur-xl transition-all duration-500 hover:border-electric/60 sm:pr-5",
        // stay clear of iOS home indicator / browser chrome
        "bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 sm:bottom-6 sm:right-6",
        shown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0",
      )}
    >
      <span className="animate-pulse-ring grid size-11 place-items-center rounded-full bg-[#25D366] text-white sm:size-12">
        <WhatsAppIcon size={24} />
      </span>
      <span className="hidden text-sm font-bold sm:inline">Let&apos;s Chat</span>
    </a>
  );
}
