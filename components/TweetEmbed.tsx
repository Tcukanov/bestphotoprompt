'use client';

import { useEffect, useRef } from 'react';

interface TweetEmbedProps {
  html: string;
}

export function TweetEmbed({ html }: TweetEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Load Twitter widget script if not already loaded
    if (!(window as any).twttr) {
      const script = document.createElement('script');
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        if ((window as any).twttr?.widgets) {
          (window as any).twttr.widgets.load(containerRef.current);
        }
      };
    } else {
      // Script already loaded, just load widgets
      (window as any).twttr.widgets.load(containerRef.current);
    }
  }, [html]);

  return (
    <div
      ref={containerRef}
      className="tweet-embed-container"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
