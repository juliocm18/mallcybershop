import { Stack, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppState, AppStateStatus, View, StyleSheet , Image} from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { getDeviceIdentifier } from "./functions";
import { supabase } from "./supabase";
import './i18n/i18n';
import LanguageSelector from './components/LanguageSelector';
import { useTranslation } from "react-i18next";
import * as WebBrowser from 'expo-web-browser';

const videoSource = require("../assets/video/splash1.mp4");
const splashImage = require("../assets/images/splash.png");

WebBrowser.maybeCompleteAuthSession();

function MainLayout() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [showSplashImage, setShowSplashImage] = useState(true);
  const [isVideoFinished, setIsVideoFinished] = useState(false);
  const [coldStartDetected, setColdStartDetected] = useState(false);
  const appState = useRef(AppState.currentState);
  const sessionStartTime = useRef<number>(0); // Inicializar con 0
  const { i18n } = useTranslation();

  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = false; // No queremos que el video se repita
    //player.play();
  });

  // useEffect(() => {
  //   const registerColdStart = async () => {
  //     if (coldStartDetected) return; // Evitar múltiples registros
  //     setColdStartDetected(true);

  //     console.log(" Cold Start Detectado");
  //     const deviceId = await getDeviceIdentifier();
  //     const { error } = await supabase.from("counter").insert({
  //       imei: deviceId,
  //     });
  //     if (error) {
  //       console.error(" Error registrando login:", error.message);
  //     } else {
  //       console.log(" Login registrado exitosamente (Cold Start)");
  //     }
  //   };

  //   registerColdStart(); // Llamar al inicio de la app

  //   // Guardar la hora de inicio de sesión correctamente
  //   sessionStartTime.current = Date.now();
  //   // console.log(" Sesión iniciada en:", sessionStartTime.current);
  //   i18n.changeLanguage("es");

  //   // Manejar cambios de estado para calcular tiempo de uso
  //   const handleAppStateChange = async (nextAppState: AppStateStatus) => {
  //     //console.log(" Estado cambiado:", appState.current, "➡", nextAppState);

  //     // Verificar que el estado haya cambiado realmente
  //     if (appState.current !== nextAppState) {
  //       if (appState.current === "active" && nextAppState !== "active") {
  //         // La app pasó a background o se cerró
  //         if (sessionStartTime.current > 0) {
  //           // Ahora se asegura de que no sea null
  //           const sessionEndTime = Date.now();
  //           const timeSpent = Math.round(
  //             (sessionEndTime - sessionStartTime.current) / 1000
  //           ); // Convertir a segundos
  //           // console.log(
  //           //   ` Tiempo de permanencia en la app: ${timeSpent} segundos`
  //           // );

  //           setTimeout(async () => {
  //             const deviceId = await getDeviceIdentifier();
  //             const { error } = await supabase.from("session_logs").insert({
  //               imei: deviceId,
  //               start_time: new Date(sessionStartTime.current).toISOString(),
  //               end_time: new Date(sessionEndTime).toISOString(),
  //               duration_seconds: timeSpent,
  //             });

  //             if (error) {
  //               console.error(" Error registrando tiempo de sesión:", error);
  //             } else {
  //               //console.log(" Tiempo de sesión registrado correctamente");
  //             }

  //             // Reiniciar el tiempo de sesión
  //             sessionStartTime.current = Date.now();
  //           }, 0); // Usamos un pequeño timeout para delegar la tarea de registro sin bloquear

  //           // Reiniciar el tiempo de sesión
  //           sessionStartTime.current = Date.now();
  //         } else {
  //           console.warn(
  //             " sessionStartTime no estaba inicializado correctamente."
  //           );
  //         }
  //       }

  //       // Actualizar el estado del app
  //       appState.current = nextAppState;
  //     } else {
  //       console.log(" Estado repetido, no se registró el cambio.");
  //     }
  //   };

  //   const subscription = AppState.addEventListener(
  //     "change",
  //     handleAppStateChange
  //   );

  //   return () => subscription.remove();
  // }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowSplashImage(false);
      player?.play();
    }, 2500);

    return () => clearTimeout(timeout);
  }, []);


  useEffect(() => {
    const checkPlaybackStatus = setInterval(() => {
      if (player?.duration && player?.currentTime) {
        if (player.currentTime >= player.duration - 0.1) {
          setIsVideoFinished(true);
          clearInterval(checkPlaybackStatus);
        }
      }
    }, 500);
    return () => clearInterval(checkPlaybackStatus);
  }, [player]);


  useEffect(() => {
    if (!loading && isVideoFinished) {
      if (session) {
        router.replace("/locationhome");
      } else {
        router.replace("/locationhome");
      }
    }
  }, [session, loading, isVideoFinished]);


  useEffect(() => {
    const checkPlaybackStatus = setInterval(() => {
      if (player?.duration && player?.currentTime) {
        if (player.currentTime >= player.duration - 0.1) {
          setIsVideoFinished(true);
          clearInterval(checkPlaybackStatus);
        }
      }
    }, 500);

    return () => clearInterval(checkPlaybackStatus);
  }, []);

  return (
    <View style={styles.container}>
      {showSplashImage ? (
        <Image source={splashImage} style={styles.imageSplash} resizeMode="cover" />
      ) : !isVideoFinished ? (
        <VideoView
          style={styles.video}
          player={player}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
          nativeControls={false}
        />
      ) : (
        <Stack screenOptions={{headerShown: false}} />
      )}
    </View>
  );
}

export default function Layout() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    justifyContent: "center",
    backgroundColor: "white",
  },
  video: { width: "100%", height: "100%" },
  imageSplash: {
    width: "100%",
    height: "100%",
  },
});