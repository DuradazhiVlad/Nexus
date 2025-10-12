import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../../../../lib/supabase";
import { PostItem } from "./PostItem";
import { toast } from "sonner";
// ШЛЯХ ВИПРАВЛЕНО: тепер коректно вказує на src/context/ProfileEditContext.tsx
import { useProfileEdit } from "../../context/ProfileEditContext"; 
import { Post } from "../../../../lib/postService"; 

export const PostList: React.FC = () => {
  // Хук, який викликав помилку
  const { profile } = useProfileEdit();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Використовуємо useCallback, щоб забезпечити стабільність функції для підписки
  const fetchPosts = useCallback(async () => {
    if (!profile) return;
    setLoading(true);

    try {
      // Використовуємо коректний select для отримання всіх необхідних даних
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          author:user_profiles(id, name, last_name, avatar),
          post_photos(id, url),
          post_videos(id, url),
          post_audio(id, url),
          post_likes(id, user_id),
          post_comments(id)
        `)
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase Error:", error);
        throw error;
      }
      setPosts(data as Post[]);
    } catch (err: any) {
      console.error("Failed to load posts:", err);
      toast.error("Не вдалося завантажити пости.");
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (!profile?.id) return;
    
    // 1. Початкове завантаження
    fetchPosts();

    // 2. Підписка на real-time зміни
    const channel = supabase
      .channel(`user_posts_${profile.id}`) // Унікальна назва каналу
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts", filter: `user_id=eq.${profile.id}` },
        (payload) => {
          console.log("Realtime change received:", payload);
          fetchPosts(); 
        }
      )
      .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Subscribed to user ${profile.id} posts`);
          }
      });

    // 3. Функція очищення (cleanup function)
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, fetchPosts]);

  // Показуємо null лише якщо профіль ще не завантажений
  if (!profile) {
     return <div className="text-center py-10 text-gray-400">Очікування даних профілю...</div>;
  }

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="text-center text-gray-500 py-10">
          <svg className="animate-spin h-5 w-5 mr-3 inline text-blue-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Завантаження...
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center text-gray-500 py-10 border-2 border-dashed border-gray-200 p-6 rounded-xl">
          <p className="font-medium">Поки що немає постів.</p>
          <p className="text-sm mt-1">Будьте першим, хто поділиться новинами!</p>
        </div>
      ) : (
        posts.map((post) => (
          <PostItem 
            key={post.id} 
            post={post} 
            onUpdate={fetchPosts} 
            isOwner={post.author.id === profile.id}
          />
        ))
      )}
    </div>
  );
};
