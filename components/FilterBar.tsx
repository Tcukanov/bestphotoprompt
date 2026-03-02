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
  { value: 'MIDJOURNEY', label: 'Midjourney' },
  { value: 'FLUX', label: 'Flux' },
  { value: 'SDXL', label: 'SDXL' },
  { value: 'STABLE_DIFFUSION', label: 'SD' },
  { value: 'DALLE', label: 'DALL-E' },
  { value: 'CHATGPT', label: 'GPT' },
];

export function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get('sort') || 'new';
  const currentModel = searchParams.get('model') || '';

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
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      {/* Sort Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {SORT_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => updateParams('sort', option.value)}
            className={`pill whitespace-nowrap ${
              currentSort === option.value ? 'pill-active' : ''
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Model Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider mr-1">Model</span>
        {MODEL_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => updateParams('model', option.value)}
            className={`pill whitespace-nowrap text-xs ${
              currentModel === option.value ? 'pill-active' : ''
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
