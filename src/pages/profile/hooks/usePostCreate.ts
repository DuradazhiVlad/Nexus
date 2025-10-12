import { useState, useCallback } from 'react';
import { createPost } from '../../../lib/postService';

/**
 * Хук для керування логікою створення нового посту.
 * Взаємодіє безпосередньо з PostCreate.tsx.
 */
export const usePostCreate = () => {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]); // Для мультимедійних файлів
  const [isCreating, setIsCreating] = useState(false);

  const MAX_FILES = 10;
  const MAX_CHARACTERS = 280;

  const handleAddFile = useCallback((file: File) => {
    if (files.length >= MAX_FILES) {
      // toast.error("Максимум 10 файлів за раз."); // Можна використати toast тут
      return false;
    }
    setFiles(prev => [...prev, file]);
    return true;
  }, [files.length]);

  const handleRemoveFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleCreatePost = useCallback(async () => {
    // Перевірка: має бути або текст, або файли
    if (!text.trim() && files.length === 0) {
      throw new Error("Додайте текст або медіа для поста.");
    }
    
    if (text.length > MAX_CHARACTERS) {
        throw new Error(`Текст перевищує ліміт ${MAX_CHARACTERS} символів.`);
    }

    setIsCreating(true);

    try {
      // Припускаємо, що createPost тепер приймає content і files
      // і сам обробляє завантаження файлів до Supabase Storage.
      const { error } = await createPost({ content: text, files }); 

      if (error) {
        throw new Error(error.message || "Не вдалося створити пост.");
      }

      // Очищення стану після успішної публікації
      setText("");
      setFiles([]);
      return true; // Успіх
    } catch (error) {
      console.error('❌ Error creating post:', error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, [text, files]);

  return {
    text,
    setText,
    files,
    setFiles, // Можна надати для прямого встановлення, якщо потрібно
    isCreating,
    MAX_CHARACTERS,
    handleAddFile,
    handleRemoveFile,
    handleCreatePost,
  };
};
