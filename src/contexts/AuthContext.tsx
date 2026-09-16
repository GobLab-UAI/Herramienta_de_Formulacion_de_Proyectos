import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type AppRole = "FORMULADOR" | "CONSULTOR" | "DOCENTE" | "ADMIN" | "USER";

interface Profile {
  id: string;
  username: string;
  full_name: string;
  email: string;
  cargo: string | null;
  entidad: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole;
  isConsultor: boolean;
  isDocente: boolean;
  isSuperadmin: boolean;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  role: "FORMULADOR",
  isConsultor: false,
  isDocente: false,
  isSuperadmin: false,
  loading: true,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole>("FORMULADOR");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Defer fetching to avoid deadlocks
        setTimeout(() => fetchUserData(session.user.id), 0);
      } else {
        setProfile(null);
        setRole("FORMULADOR");
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserData(userId: string) {
    try {
      const [profileRes, roleRes] = await Promise.all([
        supabase.from("profiles").select("id, username, full_name, email, cargo, entidad").eq("id", userId).single(),
        supabase.from("user_roles").select("role").eq("user_id", userId).single(),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data as Profile);
      }

      if (roleRes.data) {
        setRole(roleRes.data.role as AppRole);
      }
    } catch (e) {
      console.error("Error fetching user data:", e);
    } finally {
      setLoading(false);
    }
  }

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole("FORMULADOR");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        isConsultor: role === "CONSULTOR",
        isDocente: role === "DOCENTE",
        isSuperadmin: role === "ADMIN",
        loading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
