'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const SORT_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'trending', label: 'Trending' },
  { value: 'top-week', label: 'Top Week' },
  { value: 'top-all', label: 'All Time' },
];

const MODEL_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'GEMINI', label: 'Gemini' },
  { value: 'MIDJOURNEY', label: 'Midjourney' },
  { value: 'FLUX', label: 'Flux' },
  { value: 'SDXL', label: 'SDXL' },
  { value: 'STABLE_DIFFUSION', label: 'SD' },
  { value: 'DALLE', label: 'DALL-E' },
  { value: 'CHATGPT', label: 'GPT' },
];

const CATEGORY_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'portrait', label: 'Portrait' },
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'editorial', label: 'Editorial' },
  { value: 'photography', label: 'Photography' },
  { value: 'realistic', label: 'Realistic' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'landscape', label: 'Landscape' },
  { value: 'product', label: 'Product' },
  { value: 'abstract', label: 'Abstract' },
  { value: 'surreal', label: 'Surreal' },
  { value: '3d', label: '3D' },
  { value: 'noir', label: 'Noir' },
];

export function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get('sort') || 'new';
  const currentModel = searchParams.get('model') || '';
  const currentCategory = searchParams.get('tag') || '';

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="space-y-3">
      {/* Sort tabs */}
      <div className="flex items-center gap-1">
        {SORT_OPTIONS.map((option) => {
          const isActive = currentSort === option.value;
          return (
            <button
              key={option.value}
              onClick={() => updateParams('sort', option.value)}
              className={[
                'relative px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-150',
                isActive
                  ? 'text-[var(--text-primary)] bg-[var(--bg-elevated)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]/50',
              ].join(' ')}
            >
              {option.label}
              {isActive && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-[var(--accent)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Chip rows */}
      <div className="space-y-2">
        {/* Model chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">
          <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest shrink-0 w-10">
            Model
          </span>
          {MODEL_OPTIONS.map((option) => {
            const isActive = currentModel === option.value;
            return (
              <button
                key={option.value}
                onClick={() => updateParams('model', option.value)}
                className={[
                  'px-3 py-1 text-xs font-medium rounded-full border transition-all duration-150 whitespace-nowrap shrink-0',
                  isActive
                    ? 'bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]'
                    : 'bg-transparent border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-hover)] hover:text-[var(--text-secondary)]',
                ].join(' ')}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {/* Style chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">
          <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest shrink-0 w-10">
            Style
          </span>
          {CATEGORY_OPTIONS.map((option) => {
            const isActive = currentCategory === option.value;
            return (
              <button
                key={option.value}
                onClick={() => updateParams('tag', option.value)}
                className={[
                  'px-3 py-1 text-xs font-medium rounded-full border transition-all duration-150 whitespace-nowrap shrink-0',
                  isActive
                    ? 'bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]'
                    : 'bg-transparent border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-hover)] hover:text-[var(--text-secondary)]',
                ].join(' ')}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
