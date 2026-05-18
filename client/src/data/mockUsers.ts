import { User } from '../types';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Alex Johnson',
    age: 28,
    bio: 'Software developer by day, amateur photographer by night. Love hiking and exploring new places.',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80',
    interests: [
      { id: 'photography', label: 'Photography' },
      { id: 'hiking', label: 'Hiking' },
      { id: 'coding', label: 'Coding' },
      { id: 'travel', label: 'Travel' }
    ],
    location: {
      latitude: 37.7749,
      longitude: -122.4194
    },
    contactInfo: {
      email: 'alex@example.com',
      phone: '+1 (555) 123-4567'
    },
    createdAt: '2023-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Jamie Smith',
    age: 31,
    bio: 'Foodie and fitness enthusiast. I spend my weekends trying new restaurants and hiking trails.',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80',
    interests: [
      { id: 'cooking', label: 'Cooking' },
      { id: 'fitness', label: 'Fitness' },
      { id: 'hiking', label: 'Hiking' },
      { id: 'food', label: 'Food' }
    ],
    location: {
      latitude: 37.7833,
      longitude: -122.4167
    },
    contactInfo: {
      email: 'jamie@example.com'
    },
    createdAt: '2023-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: 'Taylor Williams',
    age: 26,
    bio: 'Music lover, vinyl collector, and concert-goer. Always looking for new bands to check out!',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80',
    interests: [
      { id: 'music', label: 'Music' },
      { id: 'concerts', label: 'Concerts' },
      { id: 'art', label: 'Art' },
      { id: 'nightlife', label: 'Nightlife' }
    ],
    location: {
      latitude: 37.7694,
      longitude: -122.4862
    },
    contactInfo: {
      phone: '+1 (555) 987-6543'
    },
    createdAt: '2023-01-01T00:00:00Z'
  },
  {
    id: '4',
    name: 'Jordan Lee',
    age: 33,
    bio: 'Tech entrepreneur working on AI startups. I enjoy discussing future technologies and sci-fi.',
    photoUrl: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1064&q=80',
    interests: [
      { id: 'technology', label: 'Technology' },
      { id: 'ai', label: 'AI' },
      { id: 'startups', label: 'Startups' },
      { id: 'sci-fi', label: 'Sci-Fi' }
    ],
    location: {
      latitude: 37.7837,
      longitude: -122.4090
    },
    contactInfo: {
      email: 'jordan@example.com',
      phone: '+1 (555) 222-3333'
    },
    createdAt: '2023-01-01T00:00:00Z'
  },
  {
    id: '5',
    name: 'Morgan Chen',
    age: 29,
    bio: 'Passionate about sustainability and zero-waste living. Love outdoor activities and sustainable fashion.',
    photoUrl: 'https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=776&q=80',
    interests: [
      { id: 'sustainability', label: 'Sustainability' },
      { id: 'fashion', label: 'Fashion' },
      { id: 'outdoors', label: 'Outdoors' },
      { id: 'veganism', label: 'Veganism' }
    ],
    location: {
      latitude: 37.7954,
      longitude: -122.3942
    },
    contactInfo: {
      email: 'morgan@example.com'
    },
    createdAt: '2023-01-01T00:00:00Z'
  },
  {
    id: '6',
    name: 'Riley Cooper',
    age: 27,
    bio: 'Coffee enthusiast and bookworm. I enjoy quiet cafes, interesting novels, and deep conversations.',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80',
    interests: [
      { id: 'reading', label: 'Reading' },
      { id: 'coffee', label: 'Coffee' },
      { id: 'philosophy', label: 'Philosophy' },
      { id: 'writing', label: 'Writing' }
    ],
    location: {
      latitude: 37.7648,
      longitude: -122.4200
    },
    contactInfo: {
      phone: '+1 (555) 444-5555'
    },
    createdAt: '2023-01-01T00:00:00Z'
  }
];
