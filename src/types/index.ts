export type UserRole = 'mentor' | 'participant';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  created_at: string;
}

export interface Class {
  id: string;
  title: string;
  description: string;
  mentor_id: string;
  start_time: string;
  end_time: string;
  created_at: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  mentor?: User;
}

export interface Message {
  id: string;
  class_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: User;
}

export interface Enrollment {
  id: string;
  user_id: string;
  class_id: string;
  created_at: string;
  user?: User;
  class?: Class;
}