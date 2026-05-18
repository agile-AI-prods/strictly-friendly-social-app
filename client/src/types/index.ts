export type ConnectionStatus = 'pending' | 'accepted' | 'rejected';
//  User related types
export interface Profile {
  id: string;
  email: string;
  name: string;
  photo_url?: string;
  cover_url?: string;
  bio?: string;
  pronouns?: string;
  age?: number;
  birthday?: string; // ISO date string (YYYY-MM-DD)
  reason_for_joining?: string;
  interests?: Array<{
    id: string;
    label: string;
  }>;
  location?: {
    latitude: number;
    longitude: number;
    city?: string;
  };
  social_preferences?: {
    looking_for: string[];
    relationship_type: string[];
    // communication_style: string[];
    socialSetting?: string;
    times?: string[];
    availability?: string;
    communicationStyle?: string[];
  };
  lifestyle?: {
    hobbies: string[];
    activities: string[];
    schedule: string;
  };
  boundaries?: {
    dealbreakers: string[];
    preferences: string[];
  };
  lightning_round?: {
    questions: Array<{
      question: string;
      answer: string;
    }>;
  };
  created_at: string;
  updated_at: string;
  friends_count?: number;
  friends_avatars?: { id: string; name: string; photo_url: string }[];
}

export interface User {
  id: string;
  email?: string;
  name: string;
  photo_url?: string;
  age?: number;
  bio?: string;
  interests?: Array<{ id: string; label: string }>;
  location?: {
    latitude: number;
    longitude: number;
    city: string;
  };
  contactInfo?: {
    email?: string;
    phone?: string;
  };
  user_metadata?: {
    name?: string;
  };
  app_metadata?: {
    provider?: string;
  };
  pronouns?: string;
  created_at: string;
  updated_at: string;
  birthday?: string;
  reason_for_joining?: string;
  other_reason?: string;
  social_preferences?: {
    looking_for: string[];
    relationship_type: string[];
    socialSetting?: string;
    times?: string[];
    availability?: string;
    communicationStyle?: string[];
  };
  lifestyle?: {
    hobbies: string[];
    activities: string[];
    schedule: string;
    lifeStage?: string[];
  };
  boundaries?: {
    dealbreakers: string[];
    preferences: string[];
  };
  lightning_round?: {
    questions: Array<{
      question: string;
      answer: string;
    }>;
    fictionalCharacter?: string;
  };
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

// Connection related types
export interface Connection {
  id: string;
  sender: Profile;
  receiver: Profile;
  status: ConnectionStatus;
  created_at: string;
  updated_at: string;
  sender_id: string;
  receiver_id: string;
}

export interface ConnectionState {
  connections: Connection[];
}

// Message related types
export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
  emotion?: string;
  status?: 'sent' | 'read';
  imageUrl?: string;
}

export interface MessageState {
  messages: Record<string, Message[]>;
}

export interface Location {
  latitude: number;
  longitude: number;
  city?: string;
}
export interface Notification {
  id: string;
  to_user_id: string;
  from_user_id: string;
  type: string;
  content: string;
  read: boolean;
  created_at: string;
  updated_at: string;

}
