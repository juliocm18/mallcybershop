import React, {useState} from "react";
import {View, Text, TouchableOpacity, Linking, StyleSheet} from "react-native";
import Modal from "react-native-modal";
import {Ionicons, FontAwesome} from "@expo/vector-icons";

const App = () => {
  const [isModalVisible, setModalVisible] = useState(false);
  const links = {
    "Página Web": "https://example.com",
    App: "myapp://home",
    Facebook: "https://facebook.com/example",
    Instagram: "https://instagram.com/example",
    TikTok: "https://tiktok.com/@example",
    Twitter: "https://twitter.com/example",
    YouTube: "https://youtube.com/@example",
  };

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  const handleLinkPress = async (url) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      alert("No se pudo abrir el enlace");
    }
    toggleModal();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggleModal} style={styles.iconButton}>
        <Ionicons name="link" size={30} color="black" />
      </TouchableOpacity>

      <Modal isVisible={isModalVisible} onBackdropPress={toggleModal}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Selecciona un enlace:</Text>
          <View style={styles.linksContainer}>
            {Object.keys(links).map((key) => (
              <TouchableOpacity
                key={key}
                style={styles.linkButton}
                onPress={() => handleLinkPress(links[key])}
              >
                <FontAwesome name="instagram" size={20} color="#C13584" />
                <Text style={styles.linkText}>{key}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconButton: {
    padding: 10,
    backgroundColor: "#ddd",
    borderRadius: 50,
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  linksContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
  },
  linkButton: {
    flexBasis: "48%", // Dos columnas
    padding: 10,
    marginVertical: 5,
    backgroundColor: "#eee",
    borderRadius: 5,
    alignItems: "center",
  },
  linkText: {
    fontSize: 16,
  },
});

export default App;
