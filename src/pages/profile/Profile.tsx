import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { getUserProfile, updateUserProfile } from '../../lib/userProfileService';

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        setError('Не авторизовано');
        setLoading(false);
        return;
      }
      try {
        const data = await getUserProfile(user.data.user.id);
        setProfile(data);
        setForm(data);
      } catch (err: any) {
        setError(err.message);
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const user = await supabase.auth.getUser();
    try {
      const updated = await updateUserProfile(user.data.user.id, form);
      setProfile(updated);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  if (loading) return <div>Завантаження...</div>;
  if (error) return <div>Помилка: {error}</div>;
  if (!profile) return <div>Профіль не знайдено</div>;

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '0 auto' }}>
      <label>
        Ім'я:
        <input name="name" value={form.name || ''} onChange={handleChange} />
      </label>
      <br />
      <label>
        Прізвище:
        <input name="last_name" value={form.last_name || ''} onChange={handleChange} />
      </label>
      <br />
      <label>
        Місто:
        <input name="city" value={form.city || ''} onChange={handleChange} />
      </label>
      <br />
      <label>
        Біо:
        <textarea name="bio" value={form.bio || ''} onChange={handleChange} />
      </label>
      <br />
      {/* Додайте інші поля за потреби */}
      <button type="submit">Зберегти</button>
    </form>
  );
} 