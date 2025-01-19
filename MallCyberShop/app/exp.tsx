import React, {useState, useEffect} from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Image,
  ActivityIndicator,
  Modal,
  ScrollView,
} from "react-native";
import {Ionicons, FontAwesome} from "@expo/vector-icons";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import DraggableFlatList from "react-native-draggable-flatlist";
import BouncyCheckbox from "react-native-bouncy-checkbox";

import RNModal from "react-native-modal";

const fetchRemoteJson = async (url: string) => {
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

const openWhatsApp = () => {
  const phoneNumber = "+51997528065";
  const message = "Hola";
  const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
    message
  )}`;
  Linking.openURL(url).catch((err) =>
    console.error("Error opening WhatsApp:", err)
  );
};

const App = () => {
  const links = {
    web: "https://example.com",
    App: "myapp://home",
    Facebook: "https://facebook.com/example",
    Instagram: "https://instagram.com/example",
    TikTok: "https://tiktok.com/@example",
    Twitter: "https://twitter.com/example",
    YouTube: "https://youtube.com/@example",
  };

  const [search, setSearch] = useState("");
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const [isModalSocialVisible, setModalSocialVisible] = useState(false);
  3;

  const toggleModalSocial = () => {
    setModalSocialVisible(!isModalSocialVisible);
  };

  const handleLinkPress = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      alert("No se pudo abrir el enlace");
    }
    toggleModalSocial();
  };

  useEffect(() => {
    const loadRemoteJson = async () => {
      try {
        const remoteData = await fetchRemoteJson(
          "https://burbitstudio.com/cyber-shop-mall/database.json"
        );
        console.log(remoteData);
        setApps(remoteData);

        const tempCategories = ["Moda", "Tecnología", "Hogar", "Deportes"];

        // Extraer categorías únicas
        // const uniqueCategories: string[] = Array.from(
        //   new Set(remoteData.flatMap((app: any) => app.categories || []))
        // );

        const uniqueCategories: string[] = tempCategories;
        setCategories(uniqueCategories);
      } catch (err) {
        console.log(err);
        setError(JSON.stringify(err));
      } finally {
        setLoading(false);
      }
    };
    loadRemoteJson();
  }, []);

  // Filtrar aplicaciones por nombre y categoría
  const filteredApps = apps.filter((app: any) => {
    const matchesSearch = app.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategories.length === 0 ||
      app.categories?.some((category: string) =>
        selectedCategories.includes(category)
      );

    return matchesSearch && matchesCategory;
  });

  // Manejo de apertura de aplicaciones
  const handleOpenApp = async (app: any) => {
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

  // Manejo de selección de categorías
  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={{color: "red", textAlign: "center"}}>{error}</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={24}
          color="#ccc"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchBar}
          placeholder="Buscar aplicación"
          placeholderTextColor="#ccc"
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity
          style={styles.categoryButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="filter" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <DraggableFlatList
        data={filteredApps}
        keyExtractor={(item: any) => item.package}
        numColumns={3}
        renderItem={({item, drag}) => (
          <TouchableOpacity
            style={styles.logoContainer}
            // onPress={() => handleOpenApp(item)} Se deshabilita abrir directamente la web
            onPress={toggleModalSocial}
            onLongPress={drag} // Activa el arrastre al mantener presionado
          >
            <View style={styles.logoWrapper}>
              <Image
                source={{uri: item.logo}}
                style={styles.logo}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.logoLabel}>{item.name}</Text>
          </TouchableOpacity>
        )}
        onDragEnd={({data}) => setApps([...data])} // Guardar nueva posición
      />

      {/* MODAL DE CATEGORÍAS */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filtrar por Categoría</Text>
            <ScrollView>
              {categories.map((category) => (
                <View key={category} style={styles.checkboxContainer}>
                  <BouncyCheckbox
                    size={30}
                    fillColor="#ff9f61"
                    unFillColor="#FFFFFF"
                    text={category}
                    isChecked={selectedCategories.includes(category)}
                    onPress={() => toggleCategory(category)}
                    textStyle={styles.checkboxText}
                    iconStyle={styles.checkboxIcon}
                  />
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL DE rEDES SOCIALES */}

      <RNModal
        isVisible={isModalSocialVisible}
        onBackdropPress={toggleModalSocial}
      >
        <View style={styles.modalContent}>
          <Text style={styles.socialModaltitle}>Selecciona un enlace:</Text>
          <View style={styles.socialModallinksContainer}>
            {Object.keys(links).map((key) => (
              <TouchableOpacity
                key={key}
                style={styles.socialModallinkButton}
                onPress={() =>
                  handleLinkPress(links[key as keyof typeof links].toString())
                }
              >
                <FontAwesome name="instagram" size={20} color="#C13584" />
                <Text style={styles.socialModallinkText}>{key}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </RNModal>
      <TouchableOpacity
        style={styles.floatingWhatsAppButton}
        onPress={openWhatsApp}
      >
        <FontAwesome name="whatsapp" size={30} color="white" />
      </TouchableOpacity>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ff9f61",
    padding: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#faf7f7",
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchBar: {
    flex: 1,
    height: 50,
    color: "#000",
    fontSize: 16,
  },
  categoryButton: {
    marginLeft: 10,
    padding: 10,
    backgroundColor: "#ff5a5f",
    borderRadius: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  closeButton: {
    marginTop: 10,
    backgroundColor: "#ff5a5f",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  logoContainer: {
    flex: 1,
    alignItems: "center",
    margin: 10,
  },
  logoWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoLabel: {
    color: "#000",
    marginTop: 5,
    textAlign: "center",
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  checkboxContainer: {
    marginVertical: 10, // Espacio vertical entre checkboxes
    paddingVertical: 5, // Más espacio para mejorar la interacción
  },
  checkboxText: {
    fontSize: 16,
    textDecorationLine: "none",
    color: "#333",
    fontWeight: "bold",
  },
  checkboxIcon: {
    borderRadius: 5, // Bordes más suaves
  },
  floatingWhatsAppButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#25D366",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
  },
  socialModaltitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  socialModallinksContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
  },
  socialModallinkButton: {
    flexBasis: "48%", // Dos columnas
    padding: 10,
    marginVertical: 5,
    backgroundColor: "#eee",
    borderRadius: 5,
    alignItems: "center",
  },
  socialModallinkText: {
    fontSize: 16,
  },
});

export default App;
