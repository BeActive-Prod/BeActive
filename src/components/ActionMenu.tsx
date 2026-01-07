'use client';

import { useState, useEffect, useRef } from 'react';

interface ActionMenuProps {
  onNewTask: () => void;
  onShare: () => void;
  onSettings: () => void;
}

export default function ActionMenu({ onNewTask, onShare, onSettings }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const menuItems = [
    { icon: '🔗', label: 'Share', action: onShare },
    { icon: '⚙️', label: 'Settings', action: onSettings },
  ];

  const handleMenuItemClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      {/* Floating menu (desktop style always visible) */}
      <div ref={menuRef} className="fixed bottom-4 sm:bottom-8 right-4 sm:right-8 z-40 flex flex-col items-end gap-3 min-w-[180px]">
        {isOpen && (
          <div className="flex flex-col gap-2 w-full">
            {menuItems.map((item, index) => (
              <button
                key={item.label}
                onClick={() => handleMenuItemClick(item.action)}
                className="h-16 w-full flex items-center gap-3 px-5 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl backdrop-blur-md border bg-slate-800/90 border-slate-700/60 hover:border-slate-600 text-gray-200 hover:text-white font-semibold"
                style={{
                  animation: `slideInUp 0.35s ease-out ${index * 60}ms forwards`,
                  opacity: 0,
                }}
              >
                <span className="text-lg w-5 flex items-center justify-center flex-shrink-0">{item.icon}</span>
                <span className="text-sm whitespace-nowrap">{item.label}</span>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={onNewTask}
          className={`relative overflow-hidden transition-all duration-300 shadow-xl hover:shadow-2xl ${
            isOpen
              ? 'h-16 w-full flex items-center gap-3 px-5 rounded-full bg-gradient-to-br from-purple-600 to-purple-500 text-white font-semibold'
              : 'w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-purple-500 text-white hover:scale-110'
          }`}
          title="New Task (shortcut: N)"
        >
          {isOpen ? (
            <>
              <span className="text-2xl w-5 flex items-center justify-center flex-shrink-0 font-bold">+</span>
              <span className="text-sm whitespace-nowrap">New Task</span>
            </>
          ) : (
            <span className="text-4xl font-bold leading-none drop-shadow-lg">+</span>
          )}
        </button>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl hover:shadow-2xl transform ${
            isOpen
              ? 'bg-gradient-to-br from-slate-800 to-slate-700 scale-95'
              : 'bg-gradient-to-br from-slate-800 to-slate-700 hover:scale-110'
          } text-white group`}
          title={isOpen ? 'Close menu' : 'Open menu'}
        >
          <span
            className="text-3xl font-bold transition-transform duration-300 leading-none inline-block text-white drop-shadow-lg"
            style={{
              transform: isOpen ? 'rotate(0deg)' : 'rotate(0deg)',
            }}
          >
            {isOpen ? '✕' : '≡'}
          </span>
        </button>
      </div>

      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
