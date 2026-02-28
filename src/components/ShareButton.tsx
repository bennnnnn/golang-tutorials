"use client";

interface Props {
  text: string;
  url?: string;
  className?: string;
}

export default function ShareButton({ text, url, className = "" }: Props) {
  const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");

  const handleShare = async () => {
    const fullUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;

    // Use Web Share API when available (mobile), fall back to Twitter/X intent
    if (navigator.share) {
      try {
        await navigator.share({ title: text, url: shareUrl });
        return;
      } catch {
        // User cancelled or not supported — fall through to Twitter
      }
    }

    window.open(fullUrl, "_blank", "noopener,noreferrer,width=600,height=400");
  };

  return (
    <button
      onClick={handleShare}
      className={`flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-800 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-200 ${className}`}
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
      Share
    </button>
  );
}
