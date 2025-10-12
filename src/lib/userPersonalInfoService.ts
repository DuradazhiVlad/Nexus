import { supabase } from './supabase';

export interface UserPersonalInfo {
  education?: string;
  work_place?: string;
  work_position?: string;
  languages?: string[];
  interests?: string[];
  phone?: string;
  website?: string;
  social_links?: Record<string, string>;
  family_members?: Array<{
    name: string;
    relationship: string;
  }>;
  life_events?: Array<{
    title: string;
    date: string;
    description?: string;
  }>;
}

export class UserPersonalInfoService {
  async loadPersonalInfo(userId: string): Promise<UserPersonalInfo | null> {
    try {
      const { data, error } = await supabase
        .from('user_personal_info')
        .select(`
          education,
          work_place,
          work_position,
          languages,
          interests,
          phone,
          website,
          social_links,
          family_members,
          life_events
        `)
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error loading personal info:', error);
        throw error;
      }
      
      return data || null;
    } catch (error) {
      console.error('Error loading personal info:', error);
      throw error;
    }
  }

  async updatePersonalInfo(userId: string, info: Partial<UserPersonalInfo>): Promise<UserPersonalInfo> {
    try {
      const { data, error } = await supabase
        .from('user_personal_info')
        .upsert({
          user_id: userId,
          ...info
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating personal info:', error);
      throw error;
    }
  }

  async addLifeEvent(userId: string, event: { title: string; date: string; description?: string }): Promise<void> {
    try {
      // First get current life events
      const currentInfo = await this.loadPersonalInfo(userId);
      const currentEvents = currentInfo?.life_events || [];
      
      // Add new event
      const updatedEvents = [...currentEvents, event];
      
      // Update the record
      await this.updatePersonalInfo(userId, { life_events: updatedEvents });
    } catch (error) {
      console.error('Error adding life event:', error);
      throw error;
    }
  }

  async removeLifeEvent(userId: string, eventIndex: number): Promise<void> {
    try {
      // Get current life events
      const currentInfo = await this.loadPersonalInfo(userId);
      const currentEvents = currentInfo?.life_events || [];
      
      // Remove event at index
      const updatedEvents = currentEvents.filter((_, index) => index !== eventIndex);
      
      // Update the record
      await this.updatePersonalInfo(userId, { life_events: updatedEvents });
    } catch (error) {
      console.error('Error removing life event:', error);
      throw error;
    }
  }

  async addFamilyMember(userId: string, member: { name: string; relationship: string }): Promise<void> {
    try {
      // First get current family members
      const currentInfo = await this.loadPersonalInfo(userId);
      const currentMembers = currentInfo?.family_members || [];
      
      // Add new member
      const updatedMembers = [...currentMembers, member];
      
      // Update the record
      await this.updatePersonalInfo(userId, { family_members: updatedMembers });
    } catch (error) {
      console.error('Error adding family member:', error);
      throw error;
    }
  }

  async removeFamilyMember(userId: string, memberIndex: number): Promise<void> {
    try {
      // Get current family members
      const currentInfo = await this.loadPersonalInfo(userId);
      const currentMembers = currentInfo?.family_members || [];
      
      // Remove member at index
      const updatedMembers = currentMembers.filter((_, index) => index !== memberIndex);
      
      // Update the record
      await this.updatePersonalInfo(userId, { family_members: updatedMembers });
    } catch (error) {
      console.error('Error removing family member:', error);
      throw error;
    }
  }

  async getUserPersonalInfo(userId: string): Promise<UserPersonalInfo | null> {
    try {
      const { data, error } = await supabase
        .from('user_personal_info')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  async updateUserPersonalInfo(userId: string, info: Partial<UserPersonalInfo>): Promise<UserPersonalInfo> {
    try {
      const { data, error } = await supabase
        .from('user_personal_info')
        .upsert({
          user_id: userId,
          ...info,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      throw error;
    }
  }
}