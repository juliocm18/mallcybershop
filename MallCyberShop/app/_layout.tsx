import {Stack, useRouter} from "expo-router";
import {useEffect, useRef, useState} from "react";
import {AuthProvider, useAuth} from "./context/AuthContext";
import {AppState, AppStateStatus, View, StyleSheet} from "react-native";
import {getDeviceIdentifier} from "./functions";
import {useVideoPlayer, VideoView} from "expo-video";

//import * as SplashScreen from "expo-splash-screen";

// Mantiene el splash hasta que el video termine
//SplashScreen.preventAutoHideAsync();

const videoSource = require("../assets/video/splash3.mp4"); // ✅ Importa correctamente

function MainLayout() {
  const {session, loading} = useAuth();
  const router = useRouter();
  const [isVideoFinished, setIsVideoFinished] = useState(false);

  useEffect(() => {
    if (!loading && isVideoFinished) {
      //SplashScreen.hideAsync(); // Oculta el splash cuando termina el video

      if (session) {
        router.replace("./adminhome");
      } else {
        router.replace("./home");
      }
    }
  }, [session, loading, isVideoFinished]);

  // Configuración del video
  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = false; // ❌ No queremos que el video se repita
    player.play();
  });

  // Detecta cuándo finaliza el video
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

  if (!isVideoFinished) {
    return (
      <View style={styles.container}>
        <VideoView
          style={styles.video}
          player={player}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
          nativeControls={false}
        />
      </View>
    );
  }

  return <Stack screenOptions={{headerShown: false}} />;
}

export default function Layout() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: "white", justifyContent: "center"},
  video: {width: "100%", height: "100%"},
});
