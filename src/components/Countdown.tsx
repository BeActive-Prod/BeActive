'use client';

interface CountdownProps {
  timeUntilDeadline: number; // in seconds
  className?: string;
  completed?: boolean;
  completedHour?: number;
  completedMinute?: number;
  completedSecond?: number;
  deadlineHour: number;
  deadlineMinute: number;
  rolloverHour?: number;
  rolloverMinute?: number;
}

export default function Countdown({ 
  timeUntilDeadline, 
  className = '', 
  completed = false,
  completedHour,
  completedMinute,
  completedSecond = 0,
  deadlineHour,
  deadlineMinute,
  rolloverHour = 4,
  rolloverMinute = 0,
}: CountdownProps) {
  const formatTime = (seconds: number) => {
    if (seconds > 0) {
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;

      if (days > 0) {
        return `${days}d ${hours}h ${minutes}m left`;
      } else if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s left`;
      } else if (minutes > 0) {
        return `${minutes}m ${secs}s left`;
      } else {
        return `${secs}s left`;
      }
    } else if (seconds < 0) {
      const absSeconds = Math.abs(seconds);
      const days = Math.floor(absSeconds / 86400);
      const hours = Math.floor((absSeconds % 86400) / 3600);
      const minutes = Math.floor((absSeconds % 3600) / 60);
      const secs = absSeconds % 60;

      if (days > 0) {
        return `${days}d ${hours}h ${minutes}m overdue`;
      } else if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s overdue`;
      } else if (minutes > 0) {
        return `${minutes}m ${secs}s overdue`;
      } else {
        return `${secs}s overdue`;
      }
    } else {
      return 'Time is up!';
    }
  };

  // If task is completed, show completion status
  if (completed && completedHour !== undefined && completedMinute !== undefined) {
    const rolloverInSeconds = rolloverHour * 3600 + rolloverMinute * 60;
    const completedInSeconds = completedHour * 3600 + completedMinute * 60 + completedSecond;
    const deadlineInSeconds = deadlineHour * 3600 + deadlineMinute * 60;
    
    // Calculate time difference accounting for rollover
    let timeDiff;
    
    // Determine if completed time was before or after rollover
    if (completedInSeconds < rolloverInSeconds) {
      // Completed before rollover (e.g., 2 AM when rollover is 4 AM)
      // This is still "yesterday's day"
      if (deadlineInSeconds >= rolloverInSeconds) {
        // Deadline is after rollover (e.g., 8 PM)
        // This deadline belongs to yesterday, so subtract 24 hours
        timeDiff = (deadlineInSeconds - 24 * 3600) - completedInSeconds;
      } else {
        // Deadline is before rollover (e.g., 1 AM)
        // Same app-day, simple comparison
        timeDiff = deadlineInSeconds - completedInSeconds;
      }
    } else {
      // Completed after rollover (e.g., 10 AM when rollover is 4 AM)
      // This is "today"
      if (deadlineInSeconds >= rolloverInSeconds) {
        // Deadline is also after rollover, simple comparison
        timeDiff = deadlineInSeconds - completedInSeconds;
      } else {
        // Deadline is before rollover, so it was "tomorrow"
        // Add 24 hours to deadline for comparison
        timeDiff = (deadlineInSeconds + 24 * 3600) - completedInSeconds;
      }
    }

    if (timeDiff >= 0) {
      // Completed before deadline
      const days = Math.floor(timeDiff / 86400);
      const hours = Math.floor((timeDiff % 86400) / 3600);
      const minutes = Math.floor((timeDiff % 3600) / 60);
      const seconds = timeDiff % 60;

      let timeText = '';
      if (days > 0) {
        timeText = `${days}d ${hours}h ${minutes}m ${seconds}s`;
      } else if (hours > 0) {
        timeText = `${hours}h ${minutes}m ${seconds}s`;
      } else if (minutes > 0) {
        timeText = `${minutes}m ${seconds}s`;
      } else {
        timeText = `${seconds}s`;
      }

      return (
        <span className="text-sm font-mono text-green-400 font-semibold">
          ✅ Completed {timeText} early
        </span>
      );
    } else {
      // Completed after deadline
      const absSeconds = Math.abs(timeDiff);
      const days = Math.floor(absSeconds / 86400);
      const hours = Math.floor((absSeconds % 86400) / 3600);
      const minutes = Math.floor((absSeconds % 3600) / 60);
      const seconds = absSeconds % 60;

      let timeText = '';
      if (days > 0) {
        timeText = `${days}d ${hours}h ${minutes}m ${seconds}s`;
      } else if (hours > 0) {
        timeText = `${hours}h ${minutes}m ${seconds}s`;
      } else if (minutes > 0) {
        timeText = `${minutes}m ${seconds}s`;
      } else {
        timeText = `${seconds}s`;
      }

      return (
        <span className="text-sm font-mono text-red-400 font-semibold">
          ✅ Completed {timeText} late
        </span>
      );
    }
  }

  return (
    <span className={`text-sm font-mono ${className}`}>
      ⏱️ {formatTime(timeUntilDeadline)}
    </span>
  );
}
