export interface Todo {
  id: string;
  title: string;
  deadlineHour: number; // 0-23
  deadlineMinute: number; // 0-59
  completed: boolean;
  completedDate?: string; // YYYY-MM-DD when it was completed
  completedHour?: number; // 0-23
  completedMinute?: number; // 0-59
  completedSecond?: number; // 0-59
  createdAt: Date;
}
