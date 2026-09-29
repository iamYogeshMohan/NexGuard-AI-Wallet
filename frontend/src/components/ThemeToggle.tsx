'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Moon, Sun, Laptop, Check } from 'lucide-react';
import { useTheme, Theme } from '@/lib/theme';

interface ThemeToggleProps {
  variant?: 'dropdown' | 'segmented' | 'icon-only';
  className?: string;
}

export default function ThemeToggle({ variant = 'dropdown', className = '' }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const options: { value: Theme; label: string; icon: React.ElementType; desc: string }[] = [
    { value: 'dark', label: 'Dark', icon: Moon, desc: 'Deep black theme' },
    { value: 'light', label: 'Light', icon: Sun, desc: 'Clean white theme' },
    { value: 'system', label: 'System', icon: Laptop, desc: 'Follow OS setting' },
  ];

  // Segmented control style (for settings / sidebar)
  if (variant === 'segmented') {
    return (
      <div
        className={`theme-segmented-control flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 ${className}`}
        style={{
          background: 'var(--bg-surface-2)',
          borderColor: 'var(--border-dim)',
        }}
      >
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = theme === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all duration-150 relative cursor-pointer"
              style={{
                background: isActive ? 'var(--bg-card)' : 'transparent',
                color: isActive ? 'var(--primary-text)' : 'var(--text-muted)',
                boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                border: isActive ? '1px solid var(--border-active)' : '1px solid transparent',
              }}
              title={opt.desc}
            >
              <Icon size={13} className={isActive ? 'text-blue-500' : 'text-slate-400'} />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Active Icon for dropdown / icon button
  const ActiveIcon = resolvedTheme === 'dark' ? Moon : Sun;

  return (
    <div className={`relative inline-block text-left ${className}`} ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer focus:outline-none"
        style={{
          background: isOpen ? 'var(--bg-card-hover)' : 'var(--bg-surface)',
          border: '1px solid var(--border-dim)',
          color: 'var(--text-primary)',
        }}
        aria-label="Select Theme (Dark, Light, System)"
        title={`Theme: ${theme.toUpperCase()} (${resolvedTheme === 'dark' ? 'Black' : 'White'})`}
      >
        <div className="relative flex items-center justify-center">
          {theme === 'system' ? (
            <Laptop size={14} className="text-blue-400" />
          ) : resolvedTheme === 'dark' ? (
            <Moon size={14} className="text-indigo-400" />
          ) : (
            <Sun size={14} className="text-amber-500" />
          )}
        </div>
        <span className="hidden sm:inline capitalize text-[11px] font-semibold text-slate-400">
          {theme === 'system' ? 'System' : theme === 'dark' ? 'Dark' : 'Light'}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-48 rounded-xl shadow-2xl z-50 py-1.5 animate-scale-in"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-card)',
            boxShadow: 'var(--shadow-lg)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div className="px-3 py-1.5 border-b mb-1" style={{ borderColor: 'var(--border-subtle)' }}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400" style={{ color: 'var(--text-dim)' }}>
              Appearance Theme
            </p>
          </div>

          {options.map((opt) => {
            const Icon = opt.icon;
            const isSelected = theme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setTheme(opt.value);
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors duration-120 cursor-pointer group"
                style={{
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: isSelected ? 'var(--primary-light)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-card-hover)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center transition-colors"
                    style={{
                      background: isSelected ? 'var(--primary)' : 'var(--bg-surface-2)',
                      color: isSelected ? '#ffffff' : 'var(--text-muted)',
                    }}
                  >
                    <Icon size={13} />
                  </div>
                  <div>
                    <div className="font-semibold text-xs leading-tight">
                      {opt.value === 'dark' ? 'Black / Dark' : opt.value === 'light' ? 'White / Light' : 'System Default'}
                    </div>
                    <div className="text-[10px] leading-tight" style={{ color: 'var(--text-dim)' }}>
                      {opt.desc}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <Check size={14} className="text-blue-500 font-bold ml-2 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
