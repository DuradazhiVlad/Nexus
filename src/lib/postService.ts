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
  media_url: string | null;
  media_type: "photo" | "video" | "document" | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    name: string;
    last_name: string;
    avatar: string | null;
  };
  post_likes: { id: string; user_id: string }[];
  post_photos?: { id: string; url: string }[];
  post_videos?: { id: string; url: string }[];
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

  // -------------------------------------------------------------------
  // Крок 1: Отримати ID профілю (user_profiles.id) за auth.user.id
  // -------------------------------------------------------------------
  const { data: profileData, error: profileError } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('auth_user_id', user.id) // Шукаємо ID профілю, використовуючи ID автентифікації
    .maybeSingle();

  if (profileError || !profileData) {
    console.error("Failed to fetch user profile ID:", profileError);
    toast.error("Помилка: Не вдалося знайти профіль користувача.");
    return { data: null, error: profileError || new Error("User profile not found.") };
  }

  const profileId = profileData.id; // Це ID, який потрібен таблиці posts
  // -------------------------------------------------------------------

  let mediaType: "photo" | "video" | "document" | null = null;
  let mediaUrl: string | null = null;

  if (file) {
    // Логіка визначення типу медіа
    if (file.type.startsWith("image/")) {
      mediaType = "photo";
    } else if (file.type.startsWith("video/")) {
      mediaType = "video";
    } else if (file.type.startsWith("audio/") || file.type.startsWith("application/")) {
      mediaType = "document";
    } else {
      toast.error("Підтримуються лише фото, відео та документи.");
      return { data: null, error: new Error("Unsupported file type.") };
    }
    
    // 🔥🔥 ДОДАТКОВА ДІАГНОСТИКА 🔥🔥
    console.log("File MIME Type:", file.type);
    console.log("Calculated mediaType:", mediaType);
    // 🔥🔥

    try {
      // Використовуємо profileId для шляху завантаження
      const filePath = `${profileId}/${Date.now()}-${file.name}`; 
      const { data: storageData, error: storageError } = await supabase.storage
        .from("media")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (storageError) throw storageError;

      const { data: publicUrlData } = supabase.storage
        .from("media")
        .getPublicUrl(storageData.path);

      if (!publicUrlData?.publicUrl) throw new Error("Cannot get public URL");

      mediaUrl = publicUrlData.publicUrl;
    } catch (error) {
      console.error("Failed to upload file:", error);
      toast.error("Не вдалося завантажити файл.");
      return { data: null, error };
    }
  }

  try {
    // === 1. Створюємо сам пост ===
    const { data: postData, error: postError } = await supabase
      .from("posts")
      .insert({
        user_id: profileId, // ✅ ВИКОРИСТОВУЄМО ЗНАЙДЕНИЙ profileId
        content,
        media_type: mediaType,
        media_url: mediaUrl,
      })
      .select()
      .maybeSingle();

    if (postError || !postData) throw postError || new Error("Post creation failed");

    // === 2. Якщо є медіа, додаємо у відповідну таблицю ===
    if (mediaUrl && mediaType) {
      // Оновлена логіка визначення targetTable
      let targetTable: "post_photos" | "post_videos" | null = null;
      
      if (mediaType === "photo") {
        targetTable = "post_photos";
      } else if (mediaType === "video") {
        targetTable = "post_videos";
      } 
      // "document" не має окремої таблиці, тому targetTable = null

      if (targetTable) {
        const { error: mediaError } = await supabase
          .from(targetTable)
          .insert({
            post_id: postData.id,
            url: mediaUrl,
          });

        if (mediaError) {
          console.error(`Failed to insert into ${targetTable}:`, mediaError);
          toast.error(`Помилка запису медіафайлу в таблицю ${targetTable}.`);
        } else {
          console.log(`Successfully inserted into ${targetTable}.`);
        }
      }
    }

    toast.success("Пост успішно створено!");
    return { data: postData, error: null };
  } catch (error) {
    console.error("Failed to create post:", error);
    toast.error("Не вдалося створити пост.");
    return { data: null, error };
  }
};

// ===== Коментарі =====
export const addCommentToPost = async (postId: string, content: string) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return { data: null, error: new Error("User not authenticated.") };
  
  // Крок 1: Знайти ID профілю
  const { data: profileData } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle();
  
  const profileId = profileData?.id;
  if (!profileId) return { data: null, error: new Error("User profile not found.") };


  const { data, error } = await supabase
    .from("post_comments")
    .insert({ post_id: postId, user_id: profileId, content }) // Використовуємо profileId
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return { data: null, error: new Error("User not authenticated.") };

  // Крок 1: Знайти ID профілю
  const { data: profileData } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle();
  
  const profileId = profileData?.id;
  if (!profileId) return { data: null, error: new Error("User profile not found.") };

  const { data, error } = await supabase
    .from("post_likes")
    .insert({ post_id: postId, user_id: profileId }) // Використовуємо profileId
    .select()
    .maybeSingle();

  return { data, error };
};

export const unlikePost = async (postId: string) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return { data: null, error: new Error("User not authenticated.") };

  // Крок 1: Знайти ID профілю
  const { data: profileData } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle();
  
  const profileId = profileData?.id;
  if (!profileId) return { data: null, error: new Error("User profile not found.") };

  const { data, error } = await supabase
    .from("post_likes")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", profileId) // Використовуємо profileId
    .select()
    .maybeSingle();

  return { data, error };
};

// ===== Отримання постів =====
export const getAllPosts = async () => {
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      author:user_profiles(id,name,last_name,avatar),
      post_likes(id,user_id),
      post_photos(id,url),
      post_videos(id,url)
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
      post_likes(id,user_id),
      post_photos(id,url),
      post_videos(id,url)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return { data, error };
};

// ===== Оновлення / Видалення постів =====
export const updatePost = async (postId: string, newContent: string) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return { success: false, error: new Error("User not authenticated.") };

  // Крок 1: Знайти ID профілю
  const { data: profileData } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle();
  
  const profileId = profileData?.id;
  if (!profileId) return { success: false, error: new Error("User profile not found.") };

  const { data, error } = await supabase
    .from("posts")
    .update({ content: newContent })
    .eq("id", postId)
    .eq("user_id", profileId) // Використовуємо profileId
    .maybeSingle();

  return { success: !error, error, data };
};

export const deletePost = async (postId: string) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return { success: false, error: new Error("User not authenticated.") };

  // Крок 1: Знайти ID профілю
  const { data: profileData } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle();
  
  const profileId = profileData?.id;
  if (!profileId) return { success: false, error: new Error("User profile not found.") };

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("user_id", profileId); // Використовуємо profileId

  return { success: !error, error };
};