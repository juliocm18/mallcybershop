import { TabView, TabBar } from "react-native-tab-view";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import { DraggableGrid } from "react-native-draggable-grid";
import { handleLinkPress, getDeviceIdentifier } from "../functions";
import { useRouter } from "expo-router";
import { globalStyles } from "../styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SocialLinksModal from "../SocialLinksModal";
import { fetchCompanies, fetchCompanyLinks } from "../company/functions";
import { getCategoryNames, getFormattedRoutes } from "../category/functions";
import { createCompanyCounter } from "../company/company-counter";
import { Link } from "../link/model";
import AdminZone from "./adminZone";
import { useLocalSearchParams } from "expo-router";
import { confirmButtonStyles } from "react-native-modal-datetime-picker";
import LocationHome from "../locationhome";
import LocationZoneHome from "./location-home";
import ChatButton from "./chat-button";

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
  const [error, setError] = useState<string | null>(null);
  const [isModalSocialVisible, setModalSocialVisible] = useState(false);
  const [isAllowReorder, setAllowReorder] = useState(true);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [links, setLinks] = useState<Link[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any>();
  const [companyByCategory, setCompanyByCategory] = useState<
    Map<string, any[]>
  >(new Map());
  const [initialized, setInitialized] = useState(false);
  const [routes, setRoutes] = useState<{ key: string; title: string }[]>([]);
  const [currentDepartment, setCurrentDepartment] = useState<string>("");
  const [currentCountry, setCurrentCountry] = useState<string>("");
  

  let { department } = useLocalSearchParams<{ department?: string }>();
  let { country } = useLocalSearchParams<{ country?: string }>();

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
      setScrollEnabled(true);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(icons));
    } catch (error) {
      console.error("Error saving icon order:", error);
    }
  };

  useEffect(() => {
    if (initialized) return; // Evita múltiples ejecuciones
    const loadRemoteJson = async () => {
      try {
        if (!department || !country) {
          department = (await AsyncStorage.getItem("department") || "La Libertad");
          country = (await AsyncStorage.getItem("country") || "Perú");
        }
        // const storedIcons = await getIconOrder();
        const remoteData = await fetchCompanies("priority");

        //console.log("remoteData", remoteData);

        const uniqueCategories = await getCategoryNames();
        const companyByCategory = new Map<string, any[]>();

        const companiesByCountry = remoteData.filter((company) =>
          company.countries?.includes(country)
        );
        

        const companiesByDepartment = remoteData.filter((company) =>        
          company.departments?.includes(department) || company.is_global         
        );


        const mergedCompanies = [
          ...new Map(
            [...companiesByCountry, ...companiesByDepartment].map((company) => [company.id, company])
          ).values(),
        ];

        setCurrentDepartment(department);
        setCurrentCountry(country);

        //if (!storedIcons) {
        let formattedRoutes: categoryHashMap[] = [];
        const usedCategories: string[] = [];

        await Promise.all(
          uniqueCategories.map(async (category) => {

            const companies = mergedCompanies.filter((app) =>
              app.categories?.includes(category)
            );

            if (companies.length > 0) {
              usedCategories.push(category);
              companyByCategory.set(category, companies);
              setCompanyByCategory(new Map(companyByCategory)); // Clonamos el Map para actualizar el estado correctamente
            }
          })
        );

        formattedRoutes = await getFormattedRoutes(usedCategories);
        // } else {
        //   // Crear un mapa de remoteData para acceso rápido por id
        //   const remoteMap = new Map(
        //     remoteData.map((icon: any) => [icon.id, icon])
        //   );

        //   // Filtrar íconos almacenados que siguen existiendo en remoteData
        //   const filteredIcons = storedIcons.filter((icon: any) =>
        //     remoteMap.has(icon.id)
        //   );
        //   // Fusionar ambas listas sin duplicados
        //   const mergedIcons = Array.from(
        //     new Map(
        //       [...filteredIcons, ...remoteData].map((icon: any) => [
        //         icon.id,
        //         icon,
        //       ])
        //     ).values()
        //   );

        //   const newCompanyByCategory = new Map<string, any[]>();
        //   for (const category of uniqueCategories) {
        //     newCompanyByCategory.set(
        //       category,
        //       mergedIcons.filter((app) => app.categories?.includes(category))
        //     );
        //   }
        //   setCompanyByCategory(newCompanyByCategory);
        // }

        setRoutes(formattedRoutes);
      } catch (err) {
        console.log(err);
        setError(JSON.stringify(err));
      } finally {
        //setLoading(false);
      }
    };
    loadRemoteJson();
    setInitialized(true);
  }, []);

  if (error) {
    return (
      <View style={globalStyles.container}>
        <Text style={{ color: "red", textAlign: "center" }}>{error}</Text>
      </View>
    );
  }

  /* Tabs management */
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);

  const renderScene = ({ route }: { route: { key: string; title: string } }) => (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      scrollEnabled={scrollEnabled}
    >
      <View style={{ flex: 1, backgroundColor: "#ffdcbf" }}>
        <DraggableGrid
          numColumns={4}
          renderItem={(item: IconItem) => (
            <View style={globalStyles.logoContainer}>
              <View style={globalStyles.logoWrapper}>
                <Image
                  source={{ uri: item.logo }}
                  style={globalStyles.logo}
                  resizeMode="cover"
                />
              </View>
              <Text
                style={globalStyles.logoLabel}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {item.name}
              </Text>
            </View>
          )}
          data={companyByCategory.get(route.title) || []}
          onItemPress={toggleModalSocial}
          onDragStart={() => setScrollEnabled(false)} // Deshabilita el scroll al arrastrar
          onDragRelease={(newData) => {
            if (isAllowReorder) {
              saveIconOrder(newData);
            }
          }}
        />
      </View>
    </ScrollView>
  );
  /* Tabs management */
  return (
    <View style={globalStyles.container}>
        <LocationZoneHome country={currentCountry} department={currentDepartment} />
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        lazy // Solo renderiza la pestaña activa
        lazyPreloadDistance={1} // Precarga solo la siguiente pestaña
        renderTabBar={(props) => (
          <TabBar
            {...props}
            scrollEnabled
            style={globalStyles.tabBar}
            indicatorStyle={globalStyles.indicator}
            tabStyle={globalStyles.tab}
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
      {/* <TouchableOpacity
        style={styles.floatingWhatsAppButton}
        onPress={openWhatsApp}
      >
        <FontAwesome name="whatsapp" size={30} color="white" />
      </TouchableOpacity> */}
    </View>
  );
};

export default DynamicTabsScreen;
