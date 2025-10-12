// src/components/posts/PostLikeButton.tsx
import React, { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabase";
import { Heart } from "lucide-react";

interface Props {
  postId: string;
  userId: string;
  initialLiked?: boolean;
  initialCount?: number;
}

export const PostLikeButton: React.FC<Props> = ({ postId, userId, initialLiked, initialCount }) => {
  const [liked, setLiked] = useState(initialLiked || false);
  const [count, setCount] = useState(initialCount || 0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLiked(initialLiked || false);
    setCount(initialCount || 0);
  }, [initialLiked, initialCount]);

  const toggleLike = async () => {
    if (loading) return;
    setLoading(true);

    try {
      if (liked) {
        await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId);
        setCount((c) => c - 1);
      } else {
        await supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
        setCount((c) => c + 1);
      }
      setLiked(!liked);
    } catch (e) {
      console.error("Помилка лайку:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleLike}
      disabled={loading}
      className={`flex items-center gap-1 ${liked ? "text-red-500" : "text-gray-500"} hover:text-red-600 transition-colors`}
    >
      <Heart fill={liked ? "red" : "none"} className="w-5 h-5" />
      <span>{count}</span>
    </button>
  );
};
