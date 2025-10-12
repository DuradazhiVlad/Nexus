import React, { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Image, Video, Music2, X } from "lucide-react";
import { createPost } from "../../../../lib/postService";
import { VideoPlayer } from "../../../../components/players/VideoPlayer";
import { AudioPlayer } from "../../../../components/players/AudioPlayer";

interface PostCreateProps {
  onAdded: () => void;
}

export const PostCreate: React.FC<PostCreateProps> = ({ onAdded }) => {
  const [text, setText] = useState("");
  // Зберігаємо масив файлів, але для API беремо лише перший
  const [files, setFiles] = useState<File[]>([]); 
  const [isCreating, setIsCreating] = useState(false);

  const handleAddFile = (file: File) => {
    // Оскільки `createPost` підтримує лише один файл, ми замінюємо його, якщо він є
    if (files.length >= 1) {
      toast.error("Додайте лише один файл (фото, відео або аудіо) за раз.");
      setFiles([file]);
      return;
    }
    setFiles([file]); // Замінюємо попередній файл
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleAddPost = async () => {
    if (!text.trim() && files.length === 0) {
      toast.error("Додайте текст або медіа для поста.");
      return;
    }
    setIsCreating(true);

    // >>> КЛЮЧОВЕ ВИПРАВЛЕННЯ: Надсилаємо лише перший файл або null
    const fileToSend = files.length > 0 ? files[0] : null;

    const { error } = await createPost({ content: text, file: fileToSend });
    setIsCreating(false);

    if (error) {
      console.error("Post creation error:", error);
      toast.error("Не вдалося створити пост. Перевірте консоль для деталей.");
    } else {
      toast.success("Пост успішно створено!");
      setText("");
      setFiles([]);
      onAdded();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      {/* Текст з ефектом по букві */}
      <textarea
        className="w-full border rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={4}
        placeholder="Що у вас нового?"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      {/* Медіа */}
      <div className="flex flex-wrap gap-2">
        {files.map((file, i) => (
          <div key={i} className="relative w-full max-w-sm h-auto rounded-lg overflow-hidden border border-gray-300">
            {file.type.startsWith("image/") && <img src={URL.createObjectURL(file)} className="w-full h-auto object-contain" alt="Preview" />}
            {file.type.startsWith("video/") && <VideoPlayer src={URL.createObjectURL(file)} />}
            {file.type.startsWith("audio/") && <AudioPlayer src={URL.createObjectURL(file)} />}
            <button onClick={() => handleRemoveFile(i)} className="absolute top-2 right-2 bg-black bg-opacity-60 text-white rounded-full p-1.5 hover:bg-opacity-80 transition-opacity z-10">
              <X className="w-4 h-4"/>
            </button>
          </div>
        ))}
      </div>

      {/* Кнопки */}
      <div className="flex justify-between items-center">
        <label className="cursor-pointer p-2 rounded-full hover:bg-gray-100 transition-colors flex items-center space-x-2">
          <Image className="w-6 h-6 text-green-500" />
          <span className="text-sm text-gray-600">Додати медіа ({files.length}/1)</span>
          <input 
            type="file" 
            // Прибираємо `multiple`
            accept="image/*,video/*,audio/*" 
            className="hidden" 
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleAddFile(e.target.files[0]);
              }
              // Скидаємо значення інпуту, щоб можна було повторно завантажити той самий файл
              e.target.value = ''; 
            }} 
          />
        </label>
        <button
          onClick={handleAddPost}
          disabled={isCreating || (!text.trim() && files.length === 0)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isCreating ? "Публікація..." : "Опублікувати"}
        </button>
      </div>
    </div>
  );
};
