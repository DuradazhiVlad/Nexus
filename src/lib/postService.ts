import { supabase } from "./supabase";
import { toast } from "sonner";

// ===== Типи =====
export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author: {
    id: string;
    name: string;
    last_name: string;
    avatar: string | null;
  };
};

export type Post = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  author: {
    id: string;
    name: string;
    last_name: string;
    avatar: string | null;
  };
  post_photos: { id: string; url: string }[];
  post_videos: { id: string; url: string }[];
  post_audio: { id: string; url: string }[];
  post_comments: Comment[];
  post_likes: { id: string; user_id: string }[];
};

// ===== Створення поста =====
interface CreatePostParams {
  content: string;
  file?: File | null;
}

export const createPost = async ({ content, file }: CreatePostParams) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    toast.error("Користувач не авторизований.");
    return { data: null, error: new Error("User not authenticated.") };
  }

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (profileError || !profile?.id) {
    toast.error("Не вдалося знайти профіль користувача.");
    return { data: null, error: new Error("User profile not found.") };
  }

  let mediaType: "photo" | "video" | "audio" | null = null;
  if (file) {
    if (file.type.startsWith("image/")) mediaType = "photo";
    else if (file.type.startsWith("video/")) mediaType = "video";
    else if (file.type.startsWith("audio/")) mediaType = "audio";
    else {
      toast.error("Підтримуються лише фото, відео та аудіо.");
      return { data: null, error: new Error("Unsupported file type.") };
    }
  }

  try {
    const { data: postData, error: postError } = await supabase
      .from("posts")
      .insert({ user_id: profile.id, content, media_type: mediaType })
      .select()
      .maybeSingle();

    if (postError || !postData) throw postError || new Error("Post creation failed");

    if (file && postData) {
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { data: storageData, error: storageError } = await supabase.storage
        .from("media")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (storageError) throw storageError;

      const { data: publicUrlData, error: urlError } = supabase.storage.from("media").getPublicUrl(storageData.path);
      if (urlError || !publicUrlData?.publicUrl) throw urlError || new Error("Cannot get public URL");

      const mediaUrl = publicUrlData.publicUrl;

      const tableMap: Record<"photo" | "video" | "audio", string> = {
        photo: "post_photos",
        video: "post_videos",
        audio: "post_audio",
      };

      const { error: mediaError } = await supabase.from(tableMap[mediaType]).insert({ post_id: postData.id, url: mediaUrl });
      if (mediaError) throw mediaError;
    }

    return { data: postData, error: null };
  } catch (error) {
    console.error("Failed to create post:", error);
    return { data: null, error };
  }
};

// ===== Коментарі =====
export const addCommentToPost = async (postId: string, content: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: new Error("User not authenticated.") };

  const { data, error } = await supabase
    .from("post_comments")
    .insert({ post_id: postId, user_id: user.id, content })
    .select("*, author:user_profiles(id,name,last_name,avatar)")
    .maybeSingle();

  return { data, error };
};

export const getCommentsForPost = async (postId: string) => {
  const { data, error } = await supabase
    .from("post_comments")
    .select("*, author:user_profiles(id,name,last_name,avatar)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  return { data, error };
};

// ===== Лайки =====
export const likePost = async (postId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: new Error("User not authenticated.") };

  const { data, error } = await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id }).select().maybeSingle();
  return { data, error };
};

export const unlikePost = async (postId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: new Error("User not authenticated.") };

  const { data, error } = await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id).select().maybeSingle();
  return { data, error };
};

// ===== Отримання постів =====
export const getAllPosts = async () => {
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      author:user_profiles(id,name,last_name,avatar),
      post_photos(id,url),
      post_videos(id,url),
      post_audio(id,url),
      post_likes(id,user_id),
      post_comments(
        id, content, user_id, created_at,
        author:user_profiles(id,name,last_name,avatar)
      )
    `)
    .order("created_at", { ascending: false });

  return { data, error };
};

export const getPostsByUser = async (userId: string) => {
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      author:user_profiles(id,name,last_name,avatar),
      post_photos(id,url),
      post_videos(id,url),
      post_audio(id,url),
      post_likes(id,user_id),
      post_comments(
        id, content, user_id, created_at,
        author:user_profiles(id,name,last_name,avatar)
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return { data, error };
};

// ===== Оновлення / Видалення постів =====
export const updatePost = async (postId: string, newContent: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: new Error("User not authenticated.") };

  const { data, error } = await supabase.from("posts").update({ content: newContent }).eq("id", postId).eq("user_id", user.id).maybeSingle();
  return { success: !error, error, data };
};

export const deletePost = async (postId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: new Error("User not authenticated.") };

  const { error } = await supabase.from("posts").delete().eq("id", postId).eq("user_id", user.id);
  return { success: !error, error };
};
