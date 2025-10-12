export interface Profile {
  id: string;
  auth_user_id: string;
  name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
  posts?: { text?: string; photos?: string[]; video?: string; music?: string }[];
  // Додайте інші поля профілю, якщо вони є
}