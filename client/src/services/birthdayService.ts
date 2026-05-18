import { getFriendsBirthdays as getFriendsBirthdaysApi, getFriendsBirthdaysForYear as getFriendsBirthdaysForYearApi, getUpcomingBirthdays as getUpcomingBirthdaysApi, getTodaysBirthdays as getTodaysBirthdaysApi } from '../api/birthdayApi';
import { Profile } from '../types';

export interface BirthdayEvent {
  id: string;
  label: string;
  dateStart: string; // ISO date string
  dateEnd: string; // ISO date string
  description: string;
  class: string;
  friend: Profile;
}

export class BirthdayService {
  /**
   * Fetch connected friends' birthdays for the current user
   * @param userId - The current user's ID
   * @returns Promise<BirthdayEvent[]> - Array of birthday events
   */
  static async fetchFriendsBirthdays(userId: string): Promise<BirthdayEvent[]> {
    try {
      return await getFriendsBirthdaysApi(userId);
    } catch (error) {
      console.error('Error fetching friends birthdays:', error);
      throw error;
    }
  }

  /**
   * Fetch friends' birthdays for a specific year
   * @param userId - The current user's ID
   * @param year - The year to fetch birthdays for
   * @returns Promise<BirthdayEvent[]> - Array of birthday events
   */
  static async fetchFriendsBirthdaysForYear(userId: string, year: number): Promise<BirthdayEvent[]> {
    try {
      return await getFriendsBirthdaysForYearApi(userId, year);
    } catch (error) {
      console.error('Error fetching friends birthdays for year:', error);
      throw error;
    }
  }

  /**
   * Fetch upcoming birthdays (next 30 days)
   * @param userId - The current user's ID
   * @returns Promise<BirthdayEvent[]> - Array of birthday events
   */
  static async getUpcomingBirthdays(userId: string): Promise<BirthdayEvent[]> {
    try {
      return await getUpcomingBirthdaysApi(userId);
    } catch (error) {
      console.error('Error fetching upcoming birthdays:', error);
      throw error;
    }
  }

  /**
   * Fetch today's birthdays
   * @param userId - The current user's ID
   * @returns Promise<BirthdayEvent[]> - Array of birthday events
   */
  static async getTodaysBirthdays(userId: string): Promise<BirthdayEvent[]> {
    try {
      return await getTodaysBirthdaysApi(userId);
    } catch (error) {
      console.error('Error fetching today\'s birthdays:', error);
      throw error;
    }
  }
} 