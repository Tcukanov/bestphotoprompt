import { Suspense } from 'react';
import { PromptFeed } from '@/components/PromptFeed';
import { FilterBar } from '@/components/FilterBar';

export default function HomePage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <FilterBar />
      </Suspense>

      <Suspense fallback={null}>
        <PromptFeed />
      </Suspense>
    </div>
  );
}
