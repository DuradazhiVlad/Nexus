import React, { useEffect, useState } from "react";
import { postService } from "../../../lib/postService";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author?: { name: string; avatar: string | null }; // замінив user_profiles на author
}

interface Props {
  postId: string;
  currentUserId: string;
  commentsCount: number;
  onCommentsCountChange?: (newCount: number) => void;
}

export const PostComments: React.FC<Props> = ({
  postId,
  currentUserId,
  commentsCount,
  onCommentsCountChange,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadComments = async () => {
    try {
      const data = await postService.getCommentsForPost(postId); // правильний метод
      setComments(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      await postService.addCommentToPost(postId, currentUserId, newComment); // правильний метод
      setNewComment("");
      await loadComments();
      if (onCommentsCountChange) onCommentsCountChange(comments.length + 1);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (showComments) loadComments();
  }, [showComments]);

  return (
    <div className="mt-3">
      <button
        onClick={() => setShowComments(!showComments)}
        className="text-blue-500 text-sm mb-2"
      >
        {showComments ? "Сховати коментарі" : `Показати коментарі (${commentsCount})`}
      </button>

      {showComments && (
        <div className="space-y-2">
          {error && <p className="text-red-500">{error}</p>}

          {comments.map((c) => (
            <div key={c.id} className="border-t pt-2 text-sm">
              <strong>{c.author?.name || "Користувач"}</strong>: {c.content}
            </div>
          ))}

          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Написати коментар..."
              className="flex-1 border rounded p-1"
            />
            <button
              onClick={handleAddComment}
              className="bg-gray-200 px-3 py-1 rounded"
            >
              Додати
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
