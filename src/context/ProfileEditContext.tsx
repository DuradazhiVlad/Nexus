import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "../lib/supabase";

// Типи для профілю (Використовуючи вашу структуру)
export interface UserProfile {
    id: string;
    auth_user_id: string;
    name: string;
    last_name?: string;
    avatar?: string;
    city?: string;
    bio?: string;
    online_status?: "online" | "offline";
    birth_date?: string;
    phone?: string;
    education?: string;
    work?: string;
    website?: string;
    languages?: string[];
    hobbies?: string[];
    relationship_status?: string;
    friendsCount?: number;
    photosCount?: number;
    videosCount?: number;
    postsCount?: number;
    suggestedFriends?: UserProfile[];
}

interface ProfileEditContextValue {
    // profile - профіль, який відображається/редагується на цій сторінці (зараз це профіль поточного користувача)
    profile: UserProfile | null;
    setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
    // currentUser - авторизований користувач (може знадобитися для лайків/прав)
    currentUser: UserProfile | null; 
    setCurrentUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

const ProfileEditContext = createContext<ProfileEditContextValue | undefined>(undefined);

export const ProfileEditProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true);
            try {
                // 1. Отримати авторизованого користувача
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    // 2. Отримати повний профіль з бази даних (user_profiles)
                    const { data: profileData, error } = await supabase
                        .from("user_profiles")
                        .select("*")
                        .eq("auth_user_id", user.id)
                        .single();

                    if (error) throw error;
                    
                    // Встановлюємо обидва стани, оскільки на цій сторінці ми, ймовірно, переглядаємо свій профіль
                    if (profileData) {
                        const userProfile: UserProfile = profileData as UserProfile;
                        setCurrentUser(userProfile);
                        setProfile(userProfile);
                    }
                }
            } catch (error) {
                console.error("Помилка завантаження профілю:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();

        // Додаємо слухача змін авторизації
        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
             // Перезавантажити дані, якщо стан авторизації змінився
             fetchUserData();
        });

        // Очищення
        return () => {
            subscription.unsubscribe();
        };

    }, []);

    // Показуємо завантаження, доки не отримаємо дані
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">...</svg>
                <p className="ml-3 text-gray-600">Завантаження даних профілю...</p>
            </div>
        );
    }

    return (
        <ProfileEditContext.Provider value={{ profile, setProfile, currentUser, setCurrentUser }}>
            {children}
        </ProfileEditContext.Provider>
    );
};

// Хук для зручного використання контексту
export const useProfileEdit = () => {
    const context = useContext(ProfileEditContext);
    // Рядок 70: викидає помилку, якщо контекст не було надано
    if (!context) {
        throw new Error("useProfileEdit must be used within a ProfileEditProvider");
    }
    return context;
};
