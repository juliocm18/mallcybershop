import {Linking, Alert} from "react-native";
import {Ionicons, FontAwesome} from "@expo/vector-icons";

export const fetchRemoteJson = async (url: string) => {
  const uniqueUrl = `${url}?_=${Date.now()}`;

  const response = await fetch(uniqueUrl, {
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch JSON: ${response.statusText}`);
  }

  return response.json();
};

export const openWhatsApp = () => {
  const phoneNumber = "+51997528065";
  const message = "Hola";
  const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
    message
  )}`;
  Linking.openURL(url).catch((err) =>
    console.error("Error opening WhatsApp:", err)
  );
};

export const handleLinkPress = async (url: string, toggleModal: () => void) => {
  const supported = await Linking.canOpenURL(url);
  if (supported) {
    await Linking.openURL(url);
  } else {
    alert("No se pudo abrir el enlace");
  }
  toggleModal();
};

export const handleOpenApp = async (app: {package: string; url: string}) => {
  try {
    const supported = await Linking.canOpenURL(app.package);
    if (supported) {
      await Linking.openURL(app.package);
    } else {
      Alert.alert(
        "Aplicación no encontrada",
        "La aplicación no está instalada. Se abrirá en el navegador.",
        [{text: "OK", onPress: () => Linking.openURL(app.url)}]
      );
    }
  } catch (error) {
    Alert.alert("Error", "Hubo un problema al intentar abrir el enlace.");
  }
};
