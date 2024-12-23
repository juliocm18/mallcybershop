// Importa las dependencias necesarias
import React, {useState, useEffect} from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Linking,
  Image,
  ActivityIndicator,
} from "react-native";

const fetchRemoteJson = async (url: string) => {
  const uniqueUrl = `${url}?_=${Date.now()}`;

  const response = await fetch(uniqueUrl, {
    headers: {
      "Cache-Control": "no-cache", // Indica explícitamente que no se debe usar caché
      Pragma: "no-cache", // Para compatibilidad adicional con algunos navegadores
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch JSON: ${response.statusText}`);
  }

  return response.json();
};

const App = () => {
  const [search, setSearch] = useState("");
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRemoteJson = async () => {
      try {
        const remoteData = await fetchRemoteJson(
          "https://burbitstudio.com/cyber-shop-mall/database.json"
        );
        setApps(remoteData); // Solo usamos datos remotos
      } catch (err) {
        console.log(err);
        setError(JSON.stringify(err));
      } finally {
        setLoading(false);
      }
    };
    loadRemoteJson();
  }, []);

  // Filtrar aplicaciones según el texto del buscador
  const filteredApps = apps.filter((app: any) =>
    app.name.toLowerCase().includes(search.toLowerCase())
  );

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
    <View style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder="Buscar aplicación"
        placeholderTextColor="#ccc"
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={filteredApps}
        numColumns={3}
        keyExtractor={(item: any) => item.package}
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.logoContainer}
            onPress={() => handleOpenApp(item)}
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
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ff9f61",
    padding: 10,
  },
  searchBar: {
    height: 50,
    backgroundColor: "#faf7f7",
    borderRadius: 8,
    paddingHorizontal: 15,
    color: "#000",
    marginBottom: 20,
    fontSize: 16,
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
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  logoLabel: {
    color: "#000",
    marginTop: 5,
    textAlign: "center",
  },
});

export default App;
