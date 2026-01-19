'use client';

import { useTheme } from 'next-themes';
import { Shield, User, Moon, Sun, Lock } from 'lucide-react';
// Avoid duplicate symbol issues with next/link in this module
import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function AppHeader() {
  const { theme, setTheme } = useTheme();
  const [preferredModel, setPreferredModel] = useState<string>('gpt-4o');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('preferred-model');
      if (saved) setPreferredModel(saved);
    } catch {}
  }, []);

  const updateModel = (m: string) => {
    setPreferredModel(m);
    try { localStorage.setItem('preferred-model', m); } catch {}
  };

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xl border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="size-8 rounded-lg bg-black grid place-items-center">
            <svg className="size-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3C10.5 3 9 3.5 8 4.5C7 3.5 5.5 3 4 3C3 3 2 3.5 2 5C2 6 2.5 7 3.5 8C3 9 3 10 3 11C3 14.5 5 17 8 18.5V21H10V18.5C10.5 18.7 11 18.8 11.5 18.9V21H12.5V18.9C13 18.8 13.5 18.7 14 18.5V21H16V18.5C19 17 21 14.5 21 11C21 10 21 9 20.5 8C21.5 7 22 6 22 5C22 3.5 21 3 20 3C18.5 3 17 3.5 16 4.5C15 3.5 13.5 3 12 3Z" fill="#FBBF24"/>
              <circle cx="9" cy="12" r="1.5" fill="#FBBF24"/>
              <circle cx="15" cy="12" r="1.5" fill="#FBBF24"/>
              <path d="M12 14C11 14 10 14.5 10 15.5C10 16 10.5 16.5 11 16.8C11.3 17 11.6 17 12 17C12.4 17 12.7 17 13 16.8C13.5 16.5 14 16 14 15.5C14 14.5 13 14 12 14Z" fill="#FBBF24"/>
            </svg>
          </div>
          <span className="font-bold text-lg">Coco</span>
        </a>
        <div className="flex items-center gap-4">
          <a href="/docs" className="hover:opacity-80 transition-opacity">
            <div className="inline-flex items-center h-8 px-3 rounded-md border border-gray-200 bg-white text-sm">
              Docs
            </div>
          </a>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-200 bg-white text-sm font-medium">
            <Select value={preferredModel} onValueChange={updateModel}>
              <SelectTrigger className="h-7 w-[120px] text-sm border-none shadow-none px-0">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                <SelectItem value="gpt-4o-mini">GPT-4o-mini</SelectItem>
                <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-200 bg-white text-sm">
            <Lock className="size-3 text-gray-500" />
            <span className="text-gray-600">Private</span>
          </div>
          <button
            aria-label="Toggle theme"
            className="size-9 grid place-items-center rounded-full border border-gray-200 hover:bg-gray-100 transition-colors"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          {/* User avatar button removed */}
        </div>
      </div>
    </header>
  );
}
