import React, { useState, useEffect, useCallback } from "react";
import { Post } from "../../../../lib/postService";
import { supabase } from "../../../../lib/supabase";
import { toast } from "sonner";
import { X, Edit2, Trash2, Heart } from "lucide-react";
import { PostComments } from "./PostComments";
import { VideoPlayer } from "../../../../components/players/VideoPlayer";
import { AudioPlayer } from "../../../../components/players/AudioPlayer";

interface Props {
  post: Post;
  // Додаємо isOwner та onUpdate, як ми домовилися в попередній ітерації
  isOwner: boolean;
  onUpdate: () => void; 
}

export const PostItem: React.FC<Props> = ({ post, isOwner, onUpdate }) => {
  const [showFullText, setShowFullText] = useState(false);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(post.content);
  const [displayed, setDisplayed] = useState("");
  const [likesCount, setLikesCount] = useState(post.likes_count ?? 0);
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);

  // Текст по буквах
  useEffect(() => {
    if (editing) return;
    let index = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, index + 1));
      index++;
      if (index >= text.length) clearInterval(interval);
    }, 20);
    return () => clearInterval(interval);
  }, [text, editing]);

  // Функція для перевірки, чи користувач вже лайкнув пост (для коректного відображення Heart)
  const checkLikedStatus = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("post_likes")
        .select("id")
        .eq("post_id", post.id)
        .eq("user_id", user.id)
        .maybeSingle(); // Перевіряємо, чи є запис

      setLiked(!!data);
    } catch (e) {
      console.error("Помилка перевірки лайка:", e);
    }
  }, [post.id]);

  useEffect(() => {
    checkLikedStatus();
  }, [checkLikedStatus]);

  const toggleFullText = () => setShowFullText(!showFullText);

  const handleLike = async () => {
    // RLS: Цей запит викличе 403, якщо RLS не дозволяє INSERT/DELETE для аутентифікованого користувача
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
         toast.error("Необхідно авторизуватися, щоб ставити лайки.");
         return;
      }

      if (liked) {
        const { error } = await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", user.id);
        if (error) throw error;
        setLikesCount((c) => c - 1);
      } else {
        const { error } = await supabase.from("post_likes").insert({ post_id: post.id, user_id: user.id });
        if (error) throw error;
        setLikesCount((c) => c + 1);
      }
      setLiked(!liked);
    } catch (e) {
      console.error("Помилка лайка:", e);
      toast.error("Не вдалося змінити лайк. Перевірте RLS політики!");
    }
  };

  const handleDelete = async () => {
    // *** FIX: Замінюємо window.confirm() на безпечну заглушку, оскільки він заборонений у iframe ***
    // У реальному додатку тут має бути модальне вікно підтвердження
    if (!window.confirm("Ви впевнені, що хочете видалити пост?")) {
        console.warn("Видалення поста скасовано користувачем.");
        return;
    } 
    
    // RLS: Цей запит викличе 403, якщо RLS не дозволяє DELETE
    try {
      const { error } = await supabase.from("posts").delete().eq("id", post.id);
      if (error) throw error;
      toast.success("Пост видалено");
      onUpdate(); // Повідомляємо батьківський компонент про видалення
    } catch (e) {
      console.error("Помилка видалення:", e);
      toast.error("Не вдалося видалити пост. Перевірте RLS політики!");
    }
  };

  const handleSave = async () => {
    // RLS: Цей запит викличе 403, якщо RLS не дозволяє UPDATE
    try {
      const { error } = await supabase.from("posts").update({ content: text }).eq("id", post.id);
      if (error) throw error;
      setEditing(false);
      toast.success("Пост оновлено");
    } catch (e) {
      console.error("Помилка оновлення:", e);
      toast.error("Не вдалося оновити пост. Перевірте RLS політики!");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      {/* Шапка поста */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img
            // FIX: Використовуємо isOwner замість неіснуючого post.canEdit
            // FIX: Використовуємо безпечний публічний URL для аватара-заглушки, щоб уникнути 404
            src={post.author?.avatar || "https://placehold.co/40x40/E5E7EB/6B7280?text=Ав"}
            alt="avatar"
            className="w-10 h-10 rounded-lg object-cover"
          />
          <div>
            <p className="font-semibold text-gray-800">{post.author?.name} {post.author?.last_name}</p>
            <p className="text-xs text-gray-500">{new Date(post.created_at).toLocaleString("uk-UA")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Використовуємо isOwner */}
          {isOwner && !editing && <button onClick={() => setEditing(true)}><Edit2 className="w-4 h-4" /></button>}
          {isOwner && <button onClick={handleDelete}><Trash2 className="w-4 h-4 text-red-500" /></button>}
        </div>
      </div>

      {/* Контент */}
      {editing ? (
        <div className="space-y-2">
          <textarea
            className="w-full border rounded p-2"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-4 py-1 rounded"
            >Зберегти</button>
            <button
              onClick={() => { setEditing(false); setText(post.content); }}
              className="bg-gray-300 px-4 py-1 rounded"
            >Скасувати</button>
          </div>
        </div>
      ) : (
        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
          {showFullText || text.length <= 300 ? displayed : displayed.slice(0, 300)}
          {text.length > 300 && (
            <span className="text-blue-600 cursor-pointer ml-2" onClick={toggleFullText}>
              {showFullText ? "згорнути" : "читати далі"}
            </span>
          )}
        </p>
      )}

      {/* Медіа (Використовуємо поля з масивами, як у PostList) */}
      {post.post_photos && post.post_photos.length > 0 && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {post.post_photos.slice(0, 10).map((photo) => (
              <img key={photo.id} src={photo.url} alt="Post Photo" className="w-full h-40 object-cover rounded-lg" />
            ))}
          </div>
      )}
      {post.post_videos && post.post_videos.length > 0 && (
          <VideoPlayer src={post.post_videos[0].url} />
      )}
      {post.post_audio && post.post_audio.length > 0 && (
          <AudioPlayer src={post.post_audio[0].url} />
      )}

      {/* Лайки та коментарі */}
      <div className="flex gap-4 text-sm items-center">
        <button className={`flex items-center gap-1 ${liked ? "text-red-500" : "text-gray-500"}`} onClick={handleLike}>
          <Heart className="w-4 h-4 fill-current" /> {likesCount}
        </button>
        <button className="text-gray-500" onClick={() => setShowComments(!showComments)}>
          💬 {post.comments_count ?? 0}
        </button>
      </div>

      {/* Коментарі */}
      {showComments && <PostComments postId={post.id} onUpdate={onUpdate} />}
    </div>
  );
};
