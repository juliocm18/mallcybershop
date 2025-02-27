import {TabView, SceneMap, TabBar} from "react-native-tab-view";
import React, {useState, useEffect, useRef} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  useWindowDimensions,
  StyleSheet,
  ScrollView,
} from "react-native";
import {Ionicons, FontAwesome} from "@expo/vector-icons";
import {DraggableGrid} from "react-native-draggable-grid";
import {openWhatsApp, handleLinkPress, getDeviceIdentifier} from "./functions";
import {useRouter} from "expo-router";
import {styles} from "./styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CategoryModal from "./CategoryModal";
import SocialLinksModal from "./SocialLinksModal";
import {fetchCompanies, fetchCompanyLinks} from "./company/company";
import {getCategoryNames} from "./category/category";
import {createCompanyCounter} from "./company/company-counter";
import {Link} from "./link/model";

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

const getIconOrder = async (): Promise<IconItem[] | null> => {
  try {
    const storedIcons = await AsyncStorage.getItem(STORAGE_KEY);
    return storedIcons ? JSON.parse(storedIcons) : null;
  } catch (error) {
    console.error("Error retrieving icon order:", error);
    return null;
  }
};

const handleCreateCompanyCounter = async (companyId: number) => {
  const deviceId = await getDeviceIdentifier();
  try {
    await createCompanyCounter({
      imei: deviceId,
      company_id: companyId,
    });
  } catch (error) {
    console.error("Error inserting data:", error);
  }
};

const DynamicTabsScreen = () => {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isModalSocialVisible, setModalSocialVisible] = useState(false);
  const [isAllowReorder, setAllowReorder] = useState(true);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [links, setLinks] = useState<Link[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any>();

  const [byCat, setByCat] = useState<any[]>([]);

  const [routes, setRoutes] = useState<{key: string; title: string}[]>([]);

  const toggleModalSocial = async (item: GridItem) => {
    const companyId = +item.id;
    await handleCreateCompanyCounter(companyId);
    const companyLinks = await fetchCompanyLinks(companyId);
    setSelectedCompany(item);
    setLinks(companyLinks);
    setModalSocialVisible(!isModalSocialVisible);
  };

  const saveIconOrder = async (icons: IconItem[]): Promise<void> => {
    try {
      console.log("voy a guardar");
      setScrollEnabled(true);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(icons));
    } catch (error) {
      console.error("Error saving icon order:", error);
    }
  };

  useEffect(() => {
    const loadRemoteJson = async () => {
      try {
        const storedIcons = await getIconOrder();
        const remoteData = await fetchCompanies();

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

        const uniqueCategories = await getCategoryNames();
        setCategories(uniqueCategories);
        const formattedRoutes = uniqueCategories.map((obj, i) => ({
          key: `tab${i}`,
          title: obj,
        }));
        setRoutes(formattedRoutes);

        const gg = remoteData.filter((app) =>
          app.categories?.includes("TIENDAS")
        );
        setByCat(gg);
        //console.log("hoaaaaaaaaaaaaaaaaa", gg);
      } catch (err) {
        console.log(err);
        setError(JSON.stringify(err));
      } finally {
        setLoading(false);
      }
    };
    loadRemoteJson();
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={{color: "red", textAlign: "center"}}>{error}</Text>
      </View>
    );
  }

  const render_item = (item: IconItem) => (
    <View style={styles.logoContainer}>
      <View style={styles.logoWrapper}>
        <Image
          source={{uri: item.logo}}
          style={styles.logo}
          resizeMode="cover"
        />
      </View>
      <Text style={styles.logoLabel} numberOfLines={2} ellipsizeMode="tail">
        {item.name}
      </Text>
    </View>
  );
  /* Tabs management */
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);

  const renderScene = ({route}: {route: {key: string; title: string}}) => (
    <ScrollView
      contentContainerStyle={{flexGrow: 1}}
      keyboardShouldPersistTaps="handled"
      scrollEnabled={scrollEnabled}
    >
      <View style={{flex: 1, backgroundColor: "#ffb77c"}}>
        <DraggableGrid
          numColumns={4}
          renderItem={render_item}
          data={data.filter((app) => app.categories?.includes(route.title))}
          onItemPress={toggleModalSocial}
          onDragStart={() => setScrollEnabled(false)} // Deshabilita el scroll al arrastrar
          onDragRelease={(newData) => {
            if (isAllowReorder) {
              setData(newData);
              saveIconOrder(newData);
            }
          }}
        />
      </View>
    </ScrollView>
  );
  /* Tabs management */

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
          onPress={() => router.push("./auth/login")}
        />
      </View>
      <TabView
        navigationState={{index, routes}}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{width: layout.width}}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            scrollEnabled
            style={styles.tabBar}
            indicatorStyle={styles.indicator}
            tabStyle={styles.tab}
          />
        )}
      />

      <SocialLinksModal
        visible={isModalSocialVisible}
        companyLinks={links}
        company={selectedCompany}
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
};

export default DynamicTabsScreen;
