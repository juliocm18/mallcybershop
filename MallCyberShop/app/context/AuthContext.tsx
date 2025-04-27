import {createContext, useContext, useEffect, useState} from "react";
import {supabase} from "../supabase";
import {Session} from "@supabase/supabase-js";
import {User} from "../user/model";

type AuthContextType = {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      const {data, error} = await supabase.auth.getSession();
      if (error) console.error(error);
      setSession(data.session);
      setLoading(false);
    };

    fetchSession();

    const {data: authListener} = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => authListener.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<User> => {
    const {data, error} = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    return {
      id: data.user.id,
      email: data.user.email || "noemail@mail.com",
      email_confirmed_at: data.user.email_confirmed_at,
      last_sign_in_at: data.user.last_sign_in_at,
      phone: data.user.phone,
      //role: data.user.role,
    };
  };

  const signUp = async (email: string, password: string) => {
    const {error} = await supabase.auth.signUp({email, password});
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{session, loading, signIn, signUp, signOut}}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  //console.log("🚀 ~ useAuth ~ context:", context)
  return context;
}
