'use client';

import { useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

interface GeneratedPrompt {
  model: string;
  prompt: string;
  style: string;
}

export function ImageUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GeneratedPrompt[] | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Send to API
    setLoading(true);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to analyze image');
      }

      const data = await response.json();
      setResults(data.prompts);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to analyze image');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const copyPrompt = useCallback(async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      toast.success('Prompt copied!');
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  }, []);

  const reset = useCallback(() => {
    setPreview(null);
    setResults(null);
    setLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const modelColors: Record<string, string> = {
    'Midjourney': 'from-blue-500 to-blue-700',
    'DALL-E': 'from-green-500 to-emerald-700',
    'Stable Diffusion': 'from-orange-500 to-red-600',
    'Flux': 'from-purple-500 to-violet-700',
    'SDXL': 'from-pink-500 to-rose-700',
    'General': 'from-gray-500 to-gray-700',
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      {!preview ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 ${
            isDragging
              ? 'border-[var(--accent)] bg-[var(--accent-soft)] scale-[1.02]'
              : 'border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-secondary)]'
          }`}
        >
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-6">
            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 transition-all duration-300 ${
              isDragging ? 'bg-[var(--accent)] scale-110' : 'bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)]'
            }`}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-10 sm:h-10">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-semibold mb-2 text-center">
              {isDragging ? 'Drop your image here' : 'Upload your photo'}
            </h3>
            <p className="text-sm text-[var(--text-muted)] text-center max-w-sm">
              Drag & drop an image or click to browse. We'll generate the perfect AI prompts to recreate it.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              <span className="px-3 py-1 text-[11px] font-medium bg-[var(--bg-secondary)] rounded-full text-[var(--text-muted)]">JPG</span>
              <span className="px-3 py-1 text-[11px] font-medium bg-[var(--bg-secondary)] rounded-full text-[var(--text-muted)]">PNG</span>
              <span className="px-3 py-1 text-[11px] font-medium bg-[var(--bg-secondary)] rounded-full text-[var(--text-muted)]">WEBP</span>
              <span className="px-3 py-1 text-[11px] font-medium bg-[var(--bg-secondary)] rounded-full text-[var(--text-muted)]">Max 10MB</span>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      ) : (
        /* Preview + Results */
        <div className="space-y-6">
          {/* Image Preview */}
          <div className="relative rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--bg-card)]">
            <img
              src={preview}
              alt="Uploaded"
              className="w-full max-h-[300px] sm:max-h-[400px] object-contain bg-black/50"
            />
            <button
              onClick={reset}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white hover:bg-black/80 transition"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="card p-8 sm:p-12 text-center">
              <div className="relative w-16 h-16 mx-auto mb-5">
                <div className="absolute inset-0 rounded-full border-2 border-[var(--border)]" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--accent)] animate-spin" />
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] opacity-20 animate-pulse" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-2">Analyzing your image...</h3>
              <p className="text-sm text-[var(--text-muted)]">AI is generating the perfect prompts for you</p>
            </div>
          )}

          {/* Results */}
          {results && results.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold">Generated Prompts</h3>
                <span className="text-xs text-[var(--text-muted)]">{results.length} variations</span>
              </div>
              <div className="grid gap-4">
                {results.map((result, idx) => (
                  <div key={idx} className="card p-4 sm:p-5 hover:transform-none">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                      <span className={`inline-flex items-center self-start px-3 py-1 text-xs font-bold text-white rounded-full bg-gradient-to-r ${modelColors[result.model] || modelColors['General']}`}>
                        {result.model}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">{result.style}</span>
                    </div>
                    <div className="relative">
                      <div className="bg-[var(--bg-secondary)] rounded-xl p-3 sm:p-4 border border-[var(--border)] pr-12">
                        <pre className="whitespace-pre-wrap font-mono text-xs sm:text-sm leading-relaxed text-[var(--text-primary)] break-words">
                          {result.prompt}
                        </pre>
                      </div>
                      <button
                        onClick={() => copyPrompt(result.prompt, idx)}
                        className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center hover:border-[var(--accent)] hover:text-[var(--accent)] transition"
                      >
                        {copiedIdx === idx ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Try another */}
              <button
                onClick={reset}
                className="w-full btn-ghost border border-[var(--border)] py-3 text-sm"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Upload another photo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
