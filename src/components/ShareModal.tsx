'use client';

import { useState } from 'react';

interface ShareModalProps {
  shareLink: string;
  onClose: () => void;
}

export default function ShareModal({ shareLink, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareLink);
      } else {
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = shareLink;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      alert('Failed to copy link to clipboard');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border-2 border-slate-700 rounded-xl p-6 sm:p-7 max-w-lg w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-white mb-3">Share Your Task List</h2>
        
        <p className="text-gray-300 mb-4 text-sm sm:text-base">
          Share this link with someone to sync your task list:
        </p>

        <div className="bg-slate-700 rounded-lg p-4 mb-4 break-all">
          <p className="text-sm text-purple-300 font-mono">{shareLink}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={copyToClipboard}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-purple-600 transition-all"
          >
            {copied ? '✓ Copied!' : 'Copy Link'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-slate-700 text-gray-300 font-semibold rounded-lg hover:bg-slate-600 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
