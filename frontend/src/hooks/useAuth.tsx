import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, getSavedUser, getToken, clearToken, type ApiUser } from "@/lib/api";

interface AuthContextType {
  user: ApiUser | null;
  profile: { full_name: string; phone: string | null } | null;
  roles: ApiUser["role"][];
  loading: boolean;
  isAdmin: boolean;
  isAgent: boolean;
  signIn: (user: ApiUser) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  roles: [],
  loading: true,
  isAdmin: false,
  isAgent: false,
  signIn: () => {},
  signOut: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const saved = getSavedUser();
    if (token && saved) setUser(saved);
    setLoading(false);
  }, []);

  const signIn = (u: ApiUser) => setUser(u);

  const signOut = () => {
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile: user ? { full_name: user.full_name, phone: user.phone ?? null } : null,
        roles: user ? [user.role] : [],
        loading,
        isAdmin: user?.role === "admin",
        isAgent: user?.role === "agent",
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
