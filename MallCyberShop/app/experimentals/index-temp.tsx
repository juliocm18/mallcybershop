// import React, {useState, useEffect} from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   Image,
//   ActivityIndicator,
// } from "react-native";
// import {Ionicons, FontAwesome} from "@expo/vector-icons";
// import {GestureHandlerRootView} from "react-native-gesture-handler";
// import DraggableFlatList from "react-native-draggable-flatlist";

// import {fetchRemoteJson, openWhatsApp, handleLinkPress} from "./functions";

// import {styles} from "./styles";

// import CategoryModal from "./CategoryModal";
// import SocialLinksModal from "./SocialLinksModal";

// const App = () => {
//   const links = {
//     web: "https://example.com",
//     App: "myapp://home",
//     Facebook: "https://facebook.com/example",
//     Instagram: "https://instagram.com/example",
//     TikTok: "https://tiktok.com/@example",
//     Twitter: "https://twitter.com/example",
//     YouTube: "https://youtube.com/@example",
//   };

//   const [search, setSearch] = useState("");
//   const [apps, setApps] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [categories, setCategories] = useState<string[]>([]);
//   const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
//   const [modalVisible, setModalVisible] = useState(false);

//   const [isModalSocialVisible, setModalSocialVisible] = useState(false);

//   const toggleModalSocial = () => {
//     setModalSocialVisible(!isModalSocialVisible);
//   };

//   useEffect(() => {
//     const loadRemoteJson = async () => {
//       try {
//         const remoteData = await fetchRemoteJson(
//           "https://burbitstudio.com/cyber-shop-mall/database.json"
//         );
//         //console.log(remoteData);
//         setApps(remoteData);

//         const tempCategories = ["Moda", "Tecnología", "Hogar", "Deportes"];

//         // Extraer categorías únicas
//         // const uniqueCategories: string[] = Array.from(
//         //   new Set(remoteData.flatMap((app: any) => app.categories || []))
//         // );

//         const uniqueCategories: string[] = tempCategories;
//         setCategories(uniqueCategories);
//       } catch (err) {
//         console.log(err);
//         setError(JSON.stringify(err));
//       } finally {
//         setLoading(false);
//       }
//     };
//     loadRemoteJson();
//   }, []);

//   // Filtrar aplicaciones por nombre y categoría
//   const filteredApps = apps.filter((app: any) => {
//     const matchesSearch = app.name.toLowerCase().includes(search.toLowerCase());
//     const matchesCategory =
//       selectedCategories.length === 0 ||
//       app.categories?.some((category: string) =>
//         selectedCategories.includes(category)
//       );

//     return matchesSearch && matchesCategory;
//   });

//   // Manejo de selección de categorías
//   const toggleCategory = (category: string) => {
//     setSelectedCategories((prev) =>
//       prev.includes(category)
//         ? prev.filter((c) => c !== category)
//         : [...prev, category]
//     );
//   };

//   if (loading) {
//     return (
//       <View style={styles.container}>
//         <ActivityIndicator size="large" color="#0000ff" />
//       </View>
//     );
//   }

//   if (error) {
//     return (
//       <View style={styles.container}>
//         <Text style={{color: "red", textAlign: "center"}}>{error}</Text>
//       </View>
//     );
//   }

//   return (
//     <GestureHandlerRootView style={styles.container}>
//       <View style={styles.searchContainer}>
//         <Ionicons
//           name="search"
//           size={24}
//           color="#ccc"
//           style={styles.searchIcon}
//         />
//         <TextInput
//           style={styles.searchBar}
//           placeholder="Buscar aplicación"
//           placeholderTextColor="#ccc"
//           value={search}
//           onChangeText={setSearch}
//         />
//         <TouchableOpacity
//           style={styles.categoryButton}
//           onPress={() => setModalVisible(true)}
//         >
//           <Ionicons name="filter" size={24} color="#fff" />
//         </TouchableOpacity>
//       </View>

//       <DraggableFlatList
//         data={filteredApps}
//         keyExtractor={(item: any) => item.package}
//         numColumns={3}
//         renderItem={({item, drag}) => (
//           <TouchableOpacity
//             style={styles.logoContainer}
//             // onPress={() => handleOpenApp(item)} Se deshabilita abrir directamente la web
//             onPress={toggleModalSocial}
//             onLongPress={drag} // Activa el arrastre al mantener presionado
//           >
//             <View style={styles.logoWrapper}>
//               <Image
//                 source={{uri: item.logo}}
//                 style={styles.logo}
//                 resizeMode="cover"
//               />
//             </View>
//             <Text style={styles.logoLabel}>{item.name}</Text>
//           </TouchableOpacity>
//         )}
//         onDragEnd={({data}) => setApps([...data])} // Guardar nueva posición
//       />

//       <CategoryModal
//         visible={modalVisible}
//         categories={categories}
//         selectedCategories={selectedCategories}
//         toggleCategory={toggleCategory}
//         onClose={() => setModalVisible(false)}
//       />

//       <SocialLinksModal
//         visible={isModalSocialVisible}
//         links={links}
//         handleLinkPress={handleLinkPress}
//         onClose={() => setModalSocialVisible(false)}
//       />

//       <TouchableOpacity
//         style={styles.floatingWhatsAppButton}
//         onPress={openWhatsApp}
//       >
//         <FontAwesome name="whatsapp" size={30} color="white" />
//       </TouchableOpacity>
//     </GestureHandlerRootView>
//   );
// };

// export default App;
