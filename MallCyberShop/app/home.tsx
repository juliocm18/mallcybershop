import React, {useState, useEffect, useRef} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import {Ionicons, FontAwesome} from "@expo/vector-icons";
import {DraggableGrid} from "react-native-draggable-grid";
import {
  fetchRemoteJson,
  openWhatsApp,
  handleLinkPress,
  getDeviceIdentifier,
} from "./functions";
import {useRouter} from "expo-router";
import {styles} from "./styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CategoryModal from "./CategoryModal";
import SocialLinksModal from "./SocialLinksModal";
import {useAuth} from "./context/AuthContext";
import {supabase} from "./supabase";

type IconItem = {
  id: string;
  name: string;
  logo: string;
};

interface GridItem {
  id: string;
  label: string;
  color: string;
}

const STORAGE_KEY = "icon_order";

const saveIconOrder = async (icons: IconItem[]): Promise<void> => {
  try {
    console.log("voy a guardar");
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(icons));
  } catch (error) {
    console.error("Error saving icon order:", error);
  }
};

const getIconOrder = async (): Promise<IconItem[] | null> => {
  try {
    const storedIcons = await AsyncStorage.getItem(STORAGE_KEY);
    return storedIcons ? JSON.parse(storedIcons) : null;
  } catch (error) {
    console.error("Error retrieving icon order:", error);
    return null;
  }
};

const registerCompanyCounter = async (companyId: number) => {
  const deviceId = await getDeviceIdentifier();

  const {error} = await supabase.from("company_counter").insert([
    {
      imei: deviceId,
      companyId,
    },
  ]);

  if (error) {
    console.error("Error inserting data:", error);
  }
};

export default function Home() {
  const {signIn} = useAuth();
  const router = useRouter();
  const links = {
    web: "https://example.com",
    App: "myapp://home",
    Facebook: "https://facebook.com/example",
    Instagram: "https://instagram.com/example",
    TikTok: "https://tiktok.com/@example",
    Twitter: "https://twitter.com/example",
    YouTube: "https://youtube.com/@example",
  };

  const [data, setData] = useState<any[]>([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isModalSocialVisible, setModalSocialVisible] = useState(false);
  const [isAllowReorder, setAllowReorder] = useState(true);

  const toggleModalSocial = (item: GridItem) => {
    console.log(item);
    //registerCompanyCounter(+item.id)
    setModalSocialVisible(!isModalSocialVisible);
  };

  useEffect(() => {
    const loadRemoteJson = async () => {
      try {
        const storedIcons = await getIconOrder();
        const remoteData = await fetchRemoteJson(
          "https://burbitstudio.com/cyber-shop-mall/database.json"
        );

        if (!storedIcons) {
          setData(remoteData);
        } else {
          // Crear un mapa de remoteData para acceso rápido por id
          const remoteMap = new Map(
            remoteData.map((icon: any) => [icon.id, icon])
          );

          // Filtrar íconos almacenados que siguen existiendo en remoteData
          const filteredIcons = storedIcons.filter((icon: any) =>
            remoteMap.has(icon.id)
          );
          // Fusionar ambas listas sin duplicados
          const mergedIcons = Array.from(
            new Map(
              [...filteredIcons, ...remoteData].map((icon: any) => [
                icon.id,
                icon,
              ])
            ).values()
          );
          setData(mergedIcons);
        }

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
  const filteredApps = data.filter((app: any) => {
    const matchesSearch = app.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategories.length === 0 ||
      app.categories?.some((category: string) =>
        selectedCategories.includes(category)
      );
    return matchesSearch && matchesCategory;
  });

  // Manejo de selección de categorías
  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) => {
      const updatedCategories = prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category];
      const allowReorder = updatedCategories.length === 0;
      // Validar si hay categorías seleccionadas para actualizar isAllowReorder
      setAllowReorder(allowReorder);
      return updatedCategories;
    });
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
  const render_item = (item: IconItem) => (
    // <View style={styles.item} key={item.key}>
    //   <Text style={styles.item_text}>{item.name}</Text>
    // </View>

    <View
      style={styles.logoContainer}
      // onPress={() => handleOpenApp(item)} Se deshabilita abrir directamente la web
      //onPress={toggleModalSocial}
    >
      <View style={styles.logoWrapper}>
        <Image
          source={{uri: item.logo}}
          style={styles.logo}
          resizeMode="cover"
        />
      </View>
      <Text style={styles.logoLabel}>{item.name}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-end",
          paddingBottom: 5,
        }}
      >
        <Text
          style={{
            color: "white",
            fontSize: 16,
            marginRight: 8,
            fontWeight: "bold",
          }}
        >
          Zona Admin
        </Text>
        <FontAwesome
          name="user-circle-o"
          size={24} // Tamaño mediano
          color="white" // Color blanco
          onPress={() => router.push("./login")}
        />
      </View>
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
          onChangeText={(text) => {
            setSearch(text);
            if (text.length > 0 || selectedCategories.length > 0) {
              setAllowReorder(false);
            } else {
              setAllowReorder(true);
            }
          }}
        />
        <TouchableOpacity
          style={styles.categoryButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="filter" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{flexGrow: 1}}>
        <DraggableGrid
          numColumns={4}
          renderItem={render_item}
          // data={data} se reemplaza por filtered apps
          data={filteredApps}
          onItemPress={toggleModalSocial}
          onDragRelease={(newData) => {
            if (isAllowReorder) {
              setData(newData);
              saveIconOrder(newData);
            }
          }}
          //onDragRelease={(newData) => setData(newData)} // Update data on drag release
        />
      </ScrollView>

      <CategoryModal
        visible={modalVisible}
        categories={categories}
        selectedCategories={selectedCategories}
        toggleCategory={toggleCategory}
        onClose={() => setModalVisible(false)}
      />

      <SocialLinksModal
        visible={isModalSocialVisible}
        links={links}
        handleLinkPress={handleLinkPress}
        onClose={() => setModalSocialVisible(false)}
      />

      <TouchableOpacity
        style={styles.floatingWhatsAppButton}
        onPress={openWhatsApp}
      >
        <FontAwesome name="whatsapp" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
}
