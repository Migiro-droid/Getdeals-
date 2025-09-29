import { MessageCircle } from 'lucide-react';
import { WHATSAPP_URL } from '@/config/support';
import React from 'react';

interface ChatSupportButtonProps {
  variant?: 'floating' | 'inline';
  labelPrimary?: string;
  labelSecondary?: string;
  className?: string;
}

/**
 * Unified WhatsApp chat trigger.
 * - Floating: circular FAB that gently expands on hover to show label (desktop) while staying compact on mobile.
 * - Inline: row layout for use inside contact sections.
 */
export const ChatSupportButton: React.FC<ChatSupportButtonProps> = ({
  variant = 'floating',
  labelPrimary = 'Chat with us',
  labelSecondary = 'We usually reply in minutes',
  className = ''
}) => {
  if (variant === 'inline') {
    return (
      <div className={`flex items-start gap-4 ${className}`}>        
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="Open WhatsApp chat"
          className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-white shadow-md transition hover:shadow-lg hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <MessageCircle className="h-7 w-7" />
          <span className="absolute -top-1 -right-1 inline-block h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white animate-pulse" />
        </a>
        <div className="pt-0.5">
          <div className="font-medium text-base flex items-center gap-2">
            Talk to us
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-700 text-[10px] px-2 py-0.5 font-medium border border-emerald-500/30">Live</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1 leading-snug">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline font-medium"
            >{labelPrimary}</a>
          </p>
          <p className="text-xs text-muted-foreground mt-1">{labelSecondary}</p>
        </div>
      </div>
    );
  }

  // Floating variant
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Need help? Chat with us"
      className={`fixed z-50 bottom-6 right-6 group ${className}`}
    >
      <div className="flex items-center gap-3 bg-background/90 backdrop-blur-md border rounded-full shadow-lg px-3 pr-4 py-2 hover:shadow-xl transition">
        <div className="relative h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center">
          <MessageCircle className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 inline-block h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white animate-pulse" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-xs font-semibold text-primary tracking-wide">NEED HELP?</span>
          <span className="text-sm font-medium text-muted-foreground">Chat with us</span>
        </div>
      </div>
    </a>
  );
};

export default ChatSupportButton;
