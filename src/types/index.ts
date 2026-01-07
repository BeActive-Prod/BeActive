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

export interface List {
  id: string;
  name: string;
  todos: Todo[];
  rolloverHour: number;
  rolloverMinute: number;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  isAdmin: boolean;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  setup: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUserAdmin: (isAdmin: boolean) => void;
}
