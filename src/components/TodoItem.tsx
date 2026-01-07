'use client';

import { useState, useEffect, useRef } from 'react';
import { Todo } from '@/types';
import Countdown from './Countdown';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  isNextDue?: boolean;
  rolloverHour?: number;
  rolloverMinute?: number;
  readOnly?: boolean;
}

export default function TodoItem({ todo, onToggle, onDelete, isNextDue = false, rolloverHour = 4, rolloverMinute = 0, readOnly = false }: TodoItemProps) {
  const [timeUntilDeadline, setTimeUntilDeadline] = useState<number>(0);
  const [isCaution, setIsCaution] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const [isVeryUrgent, setIsVeryUrgent] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [isPopping, setIsPopping] = useState(false);
  const [isPopingIn, setIsPopingIn] = useState(true);
  const soundPlayedRef = useRef<Record<string, boolean>>({
    every10min: false,
    everyMin: false,
    every10sec: false,
    everySec: false,
    crazy: false,
    notif1h: false,
    notif10m: false,
    notif5m: false,
    notif1m: false,
  });
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodesRef = useRef<GainNode[]>([]);

  useEffect(() => {
    // Remove pop-in animation after it completes
    const timer = setTimeout(() => {
      setIsPopingIn(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);
 
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentSeconds = now.getSeconds();

      // Calculate current time in seconds since rollover
      const rolloverInSeconds = rolloverHour * 3600 + rolloverMinute * 60;
      const nowInSeconds = currentHour * 3600 + currentMinute * 60 + currentSeconds;
      const deadlineInSeconds = todo.deadlineHour * 3600 + todo.deadlineMinute * 60;

      let difference;
      
      // Determine if we're before or after rollover time
      if (nowInSeconds < rolloverInSeconds) {
        // We're before rollover (e.g., 2 AM when rollover is 4 AM)
        // We're still in yesterday's app-day (started at rollover yesterday)
        if (deadlineInSeconds >= rolloverInSeconds) {
          // Deadline is after rollover (e.g., 8 PM)
          // This task belongs to yesterday, so subtract 24 hours for comparison
          difference = (deadlineInSeconds - 24 * 3600) - nowInSeconds;
        } else {
          // Deadline is before rollover (e.g., 1 AM)
          // This task is from today (before we hit rollover)
          difference = deadlineInSeconds - nowInSeconds;
        }
      } else {
        // We're after rollover (e.g., 10 AM when rollover is 4 AM)
        // This is "today" in app terms
        if (deadlineInSeconds >= rolloverInSeconds) {
          // Deadline is also after rollover, so it's today
          difference = deadlineInSeconds - nowInSeconds;
        } else {
          // Deadline is before rollover, so it's tomorrow
          // Add 24 hours to the deadline
          difference = (deadlineInSeconds + 24 * 3600) - nowInSeconds;
        }
      }

      setTimeUntilDeadline(difference);

      if (!todo.completed) {
        // Format remaining time for notifications
        const remainingMinutes = Math.ceil(difference / 60);
        const remainingHours = Math.ceil(difference / 3600);

        // Notifications at specific thresholds
        if (difference <= 60 * 60 && difference > 0 && !soundPlayedRef.current.notif1h) {
          const displayTime = remainingMinutes > 60 
            ? `${remainingHours}h` 
            : `${remainingMinutes}m`;
          triggerNotification('BeActive', `${todo.title} due in ${displayTime}`);
          soundPlayedRef.current.notif1h = true;
        }
        if (difference <= 10 * 60 && difference > 0 && !soundPlayedRef.current.notif10m) {
          triggerNotification('BeActive', `${todo.title} due in ${remainingMinutes}m`);
          soundPlayedRef.current.notif10m = true;
        }
        if (difference <= 5 * 60 && difference > 0 && !soundPlayedRef.current.notif5m) {
          triggerNotification('BeActive', `${todo.title} due in ${remainingMinutes}m`);
          soundPlayedRef.current.notif5m = true;
        }
        if (difference <= 60 && difference > 0 && !soundPlayedRef.current.notif1m) {
          triggerNotification('BeActive', `${todo.title} due in ${remainingMinutes}m`);
          soundPlayedRef.current.notif1m = true;
        }

        // Sound alerts based on time remaining
        if (difference <= 10 && difference > 0) {
          // Crazy sound for last 10 seconds only (not when already overdue)
          if (!soundPlayedRef.current.crazy) {
            playCrazyAlert();
            soundPlayedRef.current.crazy = true;
          }
        } else if (difference < 60 && difference > 0) {
          // Every second for last 1 minute
          playAlert('tick');
        } else if (difference < 5 * 60 && difference > 0) {
          // Every 10 seconds for last 5 minutes (except final minute handled above)
          if (Math.floor(difference) % 10 === 0 && !soundPlayedRef.current.every10sec) {
            playAlert('beep');
            soundPlayedRef.current.every10sec = true;
            setTimeout(() => {
              soundPlayedRef.current.every10sec = false;
            }, 100);
          }
        } else if (difference < 10 * 60 && difference > 0) {
          // Every minute for 10 to 5 minutes
          if (Math.floor(difference) % 60 === 0 && !soundPlayedRef.current.everyMin) {
            playAlert('beep');
            soundPlayedRef.current.everyMin = true;
            setTimeout(() => {
              soundPlayedRef.current.everyMin = false;
            }, 100);
          }
        } else if (difference < 60 * 60 && difference > 0) {
          // Every 10 minutes from 1 hour to 10 minutes
          if (Math.floor(difference) % 600 === 0 && !soundPlayedRef.current.every10min) {
            playAlert('beep');
            soundPlayedRef.current.every10min = true;
            setTimeout(() => {
              soundPlayedRef.current.every10min = false;
            }, 100);
          }
        }
      }

      if (difference < 0) {
        setIsExpired(true);
        setIsVeryUrgent(false);
        setIsUrgent(false);
        setIsCaution(false);
      } else if (difference < 5 * 60) {
        // Less than 5 minutes
        setIsVeryUrgent(true);
        setIsUrgent(false);
        setIsCaution(false);
      } else if (difference < 15 * 60) {
        // 5 to 15 minutes
        setIsUrgent(true);
        setIsVeryUrgent(false);
        setIsCaution(false);
      } else if (difference < 60 * 60) {
        // 15 minutes to 1 hour
        setIsCaution(true);
        setIsUrgent(false);
        setIsVeryUrgent(false);
      } else {
        setIsCaution(false);
        setIsUrgent(false);
        setIsVeryUrgent(false);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [todo, todo.completed, rolloverHour, rolloverMinute]);

  const triggerNotification = (title: string, body: string) => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;

    const show = () => new Notification(title, { body });

    if (Notification.permission === 'granted') {
      show();
    } else if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') show();
      }).catch(() => {});
    }
  };

  // Mute sound when task is completed
  useEffect(() => {
    if (todo.completed) {
      // Immediately silence all active audio by setting gain to 0
      gainNodesRef.current.forEach(gainNode => {
        try {
          gainNode.gain.setValueAtTime(0, gainNode.context.currentTime);
        } catch (e) {
          // Already stopped, ignore
        }
      });
      gainNodesRef.current = [];

      // Only reset non-crazy flags. Keep crazy flag so alert doesn't repeat if unchecked
      soundPlayedRef.current.every10min = false;
      soundPlayedRef.current.everyMin = false;
      soundPlayedRef.current.every10sec = false;
      soundPlayedRef.current.everySec = false;
      soundPlayedRef.current.notif1h = false;
      soundPlayedRef.current.notif10m = false;
      soundPlayedRef.current.notif5m = false;
      soundPlayedRef.current.notif1m = false;
    }
  }, [todo.completed]);

  // When task becomes uncompleted (unchecked), silence audio but don't reset crazy flag
  useEffect(() => {
    if (!todo.completed && soundPlayedRef.current.crazy) {
      // If the crazy sound has already played for this task, mute any ongoing audio
      gainNodesRef.current.forEach(gainNode => {
        try {
          gainNode.gain.setValueAtTime(0, gainNode.context.currentTime);
        } catch (e) {
          // Already stopped, ignore
        }
      });
      gainNodesRef.current = [];
    }
  }, [todo.completed]);

  const playAlert = (type: 'beep' | 'tick' = 'beep') => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      if (type === 'tick') {
        // Quick tick sound
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 1200;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.35, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
        // Notification removed as per new requirements
      } else {
        // 4-note arpeggio ringtone (distinct pattern)
        const notes = [
          784, // G5
          659, // E5
          988, // B5
          880, // A5
        ];
        const noteDuration = 0.09;
        const gapDuration = 0.035;

        notes.forEach((frequency, index) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.frequency.value = frequency;
          oscillator.type = 'triangle';

          const startTime = audioContext.currentTime + index * (noteDuration + gapDuration);
          gainNode.gain.setValueAtTime(0.5, startTime);
          gainNode.gain.exponentialRampToValueAtTime(0.02, startTime + noteDuration);

          oscillator.start(startTime);
          oscillator.stop(startTime + noteDuration);
        });
      }
    } catch (e) {
      console.log('Could not play alert sound', e);
    }
  };

  const playCrazyAlert = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)() as AudioContext;
      audioContextRef.current = audioContext;
      
      // Clear previous gain nodes before starting new alert
      gainNodesRef.current = [];
      
      // Repeat the pleasant 4-note arpeggio faster for 10 seconds
      const notes = [784, 659, 988, 880]; // G5, E5, B5, A5
      const noteDuration = 0.07;
      const gapDuration = 0.03;
      const cycleTime = noteDuration + gapDuration;
      const totalCycles = Math.floor(10 / (notes.length * cycleTime));

      for (let cycle = 0; cycle < totalCycles; cycle++) {
        notes.forEach((frequency, index) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.frequency.value = frequency;
          oscillator.type = 'triangle';

          const startTime = audioContext.currentTime + cycle * notes.length * cycleTime + index * cycleTime;
          gainNode.gain.setValueAtTime(0.45, startTime);
          gainNode.gain.exponentialRampToValueAtTime(0.02, startTime + noteDuration);

          oscillator.start(startTime);
          oscillator.stop(startTime + noteDuration);
          
          // Track gain nodes so we can silence them immediately if task is completed
          gainNodesRef.current.push(gainNode);
        });
      }
    } catch (e) {
      console.log('Could not play final alert sound', e);
    }
  };

  const getBgColor = () => {
    if (todo.completed) return 'bg-slate-800/50 border-slate-700';
    if (isExpired) return 'border-red-500';
    if (isVeryUrgent) return 'bg-red-900/50 border-red-400 animate-pulse';
    if (isUrgent) return 'bg-orange-900/40 border-orange-500';
    if (isCaution) return 'bg-yellow-900/30 border-yellow-600';
    return 'bg-slate-800/50 border-slate-700';
  };

  const expiredPattern = !todo.completed && isExpired
    ? {
        backgroundImage:
          'repeating-linear-gradient(45deg, rgba(239,68,68,0.35) 0, rgba(239,68,68,0.35) 12px, rgba(15,23,42,0.85) 12px, rgba(15,23,42,0.85) 24px)',
      }
    : undefined;

  const popStyle = isPopping
    ? {
        animation: 'pop-burst 0.4s cubic-bezier(0.36, 0, 0.66, -0.56) forwards',
      } as React.CSSProperties & { animation: string }
    : isPopingIn
    ? {
        animation: 'pop-in 0.4s cubic-bezier(0.36, 0, 0.66, -0.56) forwards',
      } as React.CSSProperties & { animation: string }
    : undefined;

  const getTextColor = () => {
    if (todo.completed) return 'text-gray-500 line-through';
    if (isExpired) return 'text-red-200';
    if (isVeryUrgent) return 'text-red-100';
    if (isUrgent) return 'text-orange-100';
    if (isCaution) return 'text-yellow-100';
    return 'text-gray-100';
  };

  const getCountdownColor = () => {
    if (isExpired) return 'text-red-400';
    if (isVeryUrgent) return 'text-red-300 font-bold';
    if (isUrgent) return 'text-orange-300 font-semibold';
    if (isCaution) return 'text-yellow-300 font-semibold';
    return 'text-gray-400';
  };

  const formatTime = (hour: number, minute: number) => {
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  };

  const playRewardSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Short pop/click sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // Pop frequency
      oscillator.type = 'sine';

      const now = audioContext.currentTime;
      const duration = 0.08; // Very short - 80ms
      
      gainNode.gain.setValueAtTime(0.25, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

      oscillator.start(now);
      oscillator.stop(now + duration);
    } catch (e) {
      console.log('Could not play reward sound', e);
    }
  };

  const triggerRainbowEffect = () => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
    const particleCount = 80;

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      const angle = (Math.PI * 2 * i) / particleCount;
      const velocity = 300 + Math.random() * 300;
      const size = 15 + Math.random() * 20;

      particle.style.position = 'fixed';
      particle.style.left = '50%';
      particle.style.top = '50%';
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
      particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      particle.style.pointerEvents = 'none';
      particle.style.zIndex = '9999';
      particle.style.boxShadow = '0 0 20px rgba(255,255,255,1), 0 0 40px currentColor';
      particle.style.filter = 'brightness(1.5)';

      document.body.appendChild(particle);

      const tx = Math.cos(angle) * velocity;
      const ty = Math.sin(angle) * velocity;

      particle.animate([
        { transform: 'translate(-50%, -50%) scale(1.5)', opacity: 1 },
        { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0) rotate(${Math.random() * 1080}deg)`, opacity: 0 }
      ], {
        duration: 1200 + Math.random() * 600,
        easing: 'cubic-bezier(0, .9, .57, 1)'
      }).onfinish = () => particle.remove();
    }
  };

  return (
    <div
      className={`flex flex-row items-center gap-3 sm:gap-5 rounded-xl border-2 transition-all ${getBgColor()} ${
        isNextDue 
          ? 'p-6 sm:p-8 border-purple-400 shadow-2xl shadow-purple-500/40 sm:scale-110 ring-2 ring-purple-500/30' 
          : 'p-3 sm:p-5'
      }`}
      style={popStyle || expiredPattern}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => {
          if (readOnly) return;
          if (!todo.completed) {
            setIsPopping(true);
            playRewardSound();
            setTimeout(() => {
              onToggle(todo.id);
            }, 400);
          } else {
            onToggle(todo.id);
          }
        }}
        disabled={readOnly}
        className={`w-5 h-5 sm:w-6 sm:h-6 rounded ${readOnly ? 'cursor-default' : 'cursor-pointer'} accent-purple-500 flex-shrink-0`}
      />

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1 sm:space-y-2">
        <h3 className={`font-semibold leading-tight ${getTextColor()} ${isNextDue ? 'text-lg sm:text-2xl' : 'text-sm sm:text-lg'}`}>
          {todo.title}
        </h3>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
          <span className="text-gray-400">
            ⏰ {formatTime(todo.deadlineHour, todo.deadlineMinute)}
          </span>
          {!todo.completed && (
            <Countdown
              timeUntilDeadline={timeUntilDeadline}
              deadlineHour={todo.deadlineHour}
              deadlineMinute={todo.deadlineMinute}
              className={getCountdownColor()}
            />
          )}
          {todo.completed && (
            <Countdown
              timeUntilDeadline={0}
              deadlineHour={todo.deadlineHour}
              deadlineMinute={todo.deadlineMinute}
              completed={true}
              completedHour={todo.completedHour}
              completedMinute={todo.completedMinute}
              completedSecond={todo.completedSecond}
              rolloverHour={rolloverHour}
              rolloverMinute={rolloverMinute}
            />
          )}
        </div>
      </div>

      {/* Delete Button */}
      {!readOnly && (
        <button
          onClick={() => onDelete(todo.id)}
          className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-900/30 transition-colors flex-shrink-0"
          aria-label="Delete task"
        >
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
