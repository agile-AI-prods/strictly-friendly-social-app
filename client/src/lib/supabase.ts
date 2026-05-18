// This file is deprecated - Supabase has been replaced with MongoDB
// The application now uses Socket.io for real-time communication

// import { createClient } from '@supabase/supabase-js';

// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// if (!supabaseUrl || !supabaseAnonKey) {
//   throw new Error('Missing Supabase environment variables');
// }

// export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
//   realtime: {
//     params: {
//       eventsPerSecond: 10
//     },
//     timeout: 20000,
//     heartbeatIntervalMs: 30000,
//     reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 10000),
//   },
//   auth: {
//     persistSession: true,
//     autoRefreshToken: true,
//     detectSessionInUrl: true
//   },
//   db: {
//     schema: 'public'
//   },
//   global: {
//     headers: {
//       'X-Client-Info': 'supabase-js-react'
//     }
//   }
// });

// MongoDB-based system is now active
// Real-time updates are handled via Socket.io
// Authentication is handled via JWT tokens and HTTP-only cookies

export const supabase = null; // Placeholder for backward compatibility 