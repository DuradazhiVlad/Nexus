import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../../lib/supabase";
import { toast } from "sonner";
import { Edit, Trash2 } from "lucide-react";

interface Comment {
  id: string;
  user_id: string;
  author: { id: string, name: string; last_name: string; avatar?: string };
  content: string;
  created_at: string;
}

interface PostCommentsProps {
  postId: string;
  onUpdate: () => void; // Для оновлення поста після змін у коментарях
}

export const PostComments: React.FC<PostCommentsProps> = ({ postId, onUpdate }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // 1. Отримання ID поточного користувача при завантаженні
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });
  }, []);

  // Завантаження коментарів
  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      // Запит тепер повинен працювати, якщо Foreign Key встановлено
      const { data, error } = await supabase
        .from("post_comments")
        .select(`
          id, 
          user_id, 
          content, 
          created_at, 
          author:user_profiles (id, name, last_name, avatar)
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Supabase 400 Error:", error);
        throw error;
      }
      setComments(data as Comment[]);
    } catch {
      toast.error("Не вдалося завантажити коментарі");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
    
    const channel = supabase
      .channel(`comments-${postId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "post_comments", filter: `post_id=eq.${postId}` }, fetchComments)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [postId, fetchComments]);

  // Додавання коментаря
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    if (!currentUserId) {
      toast.error("Ви не авторизовані для додавання коментарів.");
      return;
    }
    try {
      const { error } = await supabase.from("post_comments").insert({ 
        post_id: postId, 
        content: newComment,
        user_id: currentUserId 
      }); 
      if (error) throw error;
      setNewComment("");
      onUpdate(); 
    } catch (e) {
      console.error("Error adding comment:", e);
      toast.error("Не вдалося додати коментар. Перевірте RLS політики!");
    }
  };

  // Видалення коментаря
  const handleDelete = async (id: string) => {
    if (!window.confirm("Видалити коментар?")) return; 
    try {
      const { error } = await supabase.from("post_comments").delete().eq("id", id);
      if (error) throw error;
      onUpdate();
    } catch (e) {
      console.error("Error deleting comment:", e);
      toast.error("Не вдалося видалити коментар. Перевірте RLS політики!");
    }
  };

  // Редагування коментаря
  const handleEdit = async (id: string, content: string) => {
    const newContent = window.prompt("Редагувати коментар", content); 
    if (!newContent || newContent.trim() === content.trim()) return;

    try {
      const { error } = await supabase.from("post_comments").update({ content: newContent }).eq("id", id);
      if (error) throw error;
      setComments(prev => prev.map(c => c.id === id ? { ...c, content: newContent } : c));
    } catch (e) {
      console.error("Error editing comment:", e);
      toast.error("Не вдалося редагувати коментар. Перевірте RLS політики!");
    }
  };

  return (
    <div className="mt-4 space-y-2">
      {loading ? (
        <p className="text-gray-400 text-sm">Завантаження коментарів...</p>
      ) : comments.length === 0 ? (
        <p className="text-gray-400 text-sm">Поки що немає коментарів.</p>
      ) : (
        comments.map((c) => {
          // Перевірка на існування автора для уникнення помилок
          const authorName = `${c.author?.name || "Невідомий"} ${c.author?.last_name || ""}`;
          const isCommentOwner = c.user_id === currentUserId;
          return (
            <div key={c.id} className="flex items-start gap-2 bg-gray-50 p-2 rounded">
              <img
                // *** FIX 404: Використовуємо безпечний CDN-заповнювач ***
                src={c.author?.avatar || "https://placehold.co/32x32/E5E7EB/6B7280?text=Ав"}
                alt="avatar"
                className="w-8 h-8 rounded-full object-cover mt-1"
              />
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-semibold">{authorName}</span>{" "}
                  <span className="text-gray-500 text-xs">{new Date(c.created_at).toLocaleString("uk-UA")}</span>
                </p>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{c.content}</p>
              </div>
              {isCommentOwner && (
                <div className="flex flex-col gap-1">
                  <button onClick={() => handleEdit(c.id, c.content)}><Edit className="w-4 h-4 text-gray-500 hover:text-blue-500"/></button>
                  <button onClick={() => handleDelete(c.id)}><Trash2 className="w-4 h-4 text-gray-500 hover:text-red-500"/></button>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Додати коментар */}
      {currentUserId && (
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            className="flex-1 border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Написати коментар..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
          />
          <button
            onClick={handleAddComment}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
          >
            Додати
          </button>
        </div>
      )}
    </div>
  );
};
