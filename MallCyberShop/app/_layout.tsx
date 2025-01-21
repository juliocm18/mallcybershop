import {Stack, useRouter} from "expo-router";
import {useEffect, useRef, useState} from "react";
import {AuthProvider, useAuth} from "./context/AuthContext";
import {AppState, AppStateStatus} from "react-native";
import {supabase} from "./supabase";
import {getDeviceIdentifier} from "./functions";
import AsyncStorage from "@react-native-async-storage/async-storage";

function MainLayout() {
  const {session, loading} = useAuth();
  const router = useRouter();
  const [coldStartDetected, setColdStartDetected] = useState(false);
  const appState = useRef(AppState.currentState);
  const sessionStartTime = useRef<number>(0); // 🔹 Inicializar con 0

  useEffect(() => {
    if (!loading) {
      if (session) {
        router.replace("./adminhome");
      } else {
        router.replace("./home");
      }
    }
  }, [session, loading]);
  // console.log("🔄 App cargada por primera vez");

  // const registerColdStart = async () => {
  //   if (coldStartDetected) return; // Evitar múltiples registros
  //   setColdStartDetected(true);

  //   console.log("🔵 Cold Start Detectado");
  //   const deviceId = await getDeviceIdentifier();

  //   const {error} = await supabase.from("counter").insert({
  //     imei: deviceId,
  //   });

  //   if (error) {
  //     console.error("❌ Error registrando login:", error.message);
  //   } else {
  //     console.log("✅ Login registrado exitosamente (Cold Start)");
  //   }
  // };

  // registerColdStart(); // Llamar al inicio de la app

  useEffect(() => {
    // Guardar la hora de inicio de sesión correctamente
    sessionStartTime.current = Date.now();
    console.log("⏳ Sesión iniciada en:", sessionStartTime.current);

    // Manejar cambios de estado para calcular tiempo de uso
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      console.log("📢 Estado cambiado:", appState.current, "➡", nextAppState);

      // Verificar que el estado haya cambiado realmente
      if (appState.current !== nextAppState) {
        if (appState.current === "active" && nextAppState !== "active") {
          // La app pasó a background o se cerró
          if (sessionStartTime.current > 0) {
            // 🔹 Ahora se asegura de que no sea null
            const sessionEndTime = Date.now();
            const timeSpent = Math.round(
              (sessionEndTime - sessionStartTime.current) / 1000
            ); // Convertir a segundos
            console.log(
              `⏳ Tiempo de permanencia en la app: ${timeSpent} segundos`
            );

            setTimeout(async () => {
              const deviceId = await getDeviceIdentifier();
              const {error} = await supabase.from("session_logs").insert({
                imei: deviceId,
                start_time: new Date(sessionStartTime.current).toISOString(),
                end_time: new Date(sessionEndTime).toISOString(),
                duration_seconds: timeSpent,
              });

              if (error) {
                console.error("❌ Error registrando tiempo de sesión:", error);
              } else {
                console.log("✅ Tiempo de sesión registrado correctamente");
              }

              // Reiniciar el tiempo de sesión
              sessionStartTime.current = Date.now();
            }, 0); // Usamos un pequeño timeout para delegar la tarea de registro sin bloquear

            // Reiniciar el tiempo de sesión
            sessionStartTime.current = Date.now();
          } else {
            console.warn(
              "⚠ sessionStartTime no estaba inicializado correctamente."
            );
          }
        }

        // Actualizar el estado del app
        appState.current = nextAppState;
      } else {
        console.log("🔄 Estado repetido, no se registró el cambio.");
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => subscription.remove();
  }, []);

  return <Stack screenOptions={{headerShown: false}} />;
}

export default function Layout() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
