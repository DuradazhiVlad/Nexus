// src/components/posts/PostEditModal.tsx
import React, { useState } from "react";
import { supabase } from "../../../../lib/supabase";
import { toast } from "sonner";

interface Props {
  postId: string;
  initialContent: string;
  onClose: () => void;
}

export const PostEditModal: React.FC<Props> = ({ postId, initialContent, onClose }) => {
  const [text, setText] = useState(initialContent);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!text.trim()) return;
    setSaving(true);

    const { error } = await supabase.from("posts").update({ content: text }).eq("id", postId);

    setSaving(false);
    if (error) toast.error("Не вдалося оновити пост");
    else {
      toast.success("Пост оновлено!");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-3">Редагування поста</h3>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <div className="flex justify-end mt-4 gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">Скасувати</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Збереження..." : "Зберегти"}
          </button>
        </div>
      </div>
    </div>
  );
};
