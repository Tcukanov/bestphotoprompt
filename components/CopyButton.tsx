'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { copyToClipboard } from '@/lib/utils';

interface CopyButtonProps {
  text: string;
  size?: 'sm' | 'md';
}

export function CopyButton({ text, size = 'sm' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      toast.success('Prompt copied!');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Failed to copy');
    }
  };

  const isSm = size === 'sm';

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 font-medium rounded-lg transition-all ${
        copied
          ? 'text-[var(--success)] bg-green-500/10'
          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
      } ${isSm ? 'px-2.5 py-1.5 text-xs' : 'px-4 py-2 text-sm'}`}
    >
      {copied ? (
        <svg width={isSm ? 14 : 16} height={isSm ? 14 : 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width={isSm ? 14 : 16} height={isSm ? 14 : 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}
