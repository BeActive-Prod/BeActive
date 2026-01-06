'use client';

interface TimePickerProps {
  value: { hour: number; minute: number };
  onChange: (time: { hour: number; minute: number }) => void;
}

export default function TimePicker({ value, onChange }: TimePickerProps) {
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hourStr, minuteStr] = e.target.value.split(':');
    const hour = parseInt(hourStr);
    const minute = parseInt(minuteStr);
    
    onChange({ hour, minute });
  };

  const displayValue = `${String(value.hour).padStart(2, '0')}:${String(value.minute).padStart(2, '0')}`;

  return (
    <input
      type="time"
      value={displayValue}
      onChange={handleTimeChange}
      className="px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
    />
  );
}
