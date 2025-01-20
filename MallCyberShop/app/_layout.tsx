import {Stack, useRouter} from "expo-router";
import {useEffect} from "react";
import {AuthProvider, useAuth} from "./context/AuthContext";

function MainLayout() {
  const {session, loading} = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (session) {
        router.replace("./adminhome");
      } else {
        router.replace("./home");
      }
    }
  }, [session, loading]);

  return <Stack screenOptions={{headerShown: false}} />;
}

export default function Layout() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
