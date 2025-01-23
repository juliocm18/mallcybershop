import {Link, useRouter} from "expo-router";
import React from "react";
import {View, Text, TouchableOpacity, StyleSheet} from "react-native";
import {FontAwesome, Ionicons} from "@expo/vector-icons";

const Home: React.FC = () => {
  const router = useRouter(); // Usamos useRouter para manejar la navegación

  const handleGoBack = () => {
    router.back(); // Navega a la pantalla anterior
  };

  return (
    <View style={styles.container}>
      {/* Botón Atrás */}
      <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
        <Ionicons name="arrow-back" size={30} color="white" />
        <Text style={styles.backButtonText}>Atrás</Text>
      </TouchableOpacity>

      <View style={styles.buttonContainer}>
        <Link
          href="./dashboard"
          style={[styles.button, {backgroundColor: "#2196F3"}]}
        >
          <View style={styles.iconLabelContainer}>
            <FontAwesome
              style={styles.icon}
              name="dashboard"
              size={30}
              color="white"
            />
            <Text style={styles.label}>Panel de Control</Text>
          </View>
        </Link>

        <Link
          href="./category/gestion-categorias"
          style={[styles.button, {backgroundColor: "#4CAF50"}]}
        >
          <View style={styles.iconLabelContainer}>
            <FontAwesome
              style={styles.icon}
              name="edit"
              size={24}
              color="white"
            />
            <Text style={styles.label}>Administración de Categorías</Text>
          </View>
        </Link>

        <Link
          href="./company/gestion-socios"
          style={[styles.button, {backgroundColor: "#FF9800"}]}
        >
          <View style={styles.iconLabelContainer}>
            <FontAwesome
              style={styles.icon}
              name="users"
              size={30}
              color="white"
            />
            <Text style={styles.label}>Administración de Socios</Text>
          </View>
        </Link>

        <Link
          href="./administrar-datos"
          style={[styles.button, {backgroundColor: "#ed2004"}]}
        >
          <View style={styles.iconLabelContainer}>
            <FontAwesome
              style={styles.icon}
              name="warning"
              size={30}
              color="white"
            />
            <Text style={styles.label}>Administración de Datos</Text>
          </View>
        </Link>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f4f4f4",
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 5,
    zIndex: 1,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    marginLeft: 5,
  },
  buttonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    width: "80%",
    gap: 20,
    marginTop: 50,
  },
  button: {
    width: 150,
    height: 150,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  iconLabelContainer: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    width: "100%",
  },
  label: {
    marginTop: 10,
    color: "white",
    fontSize: 16, // Ajusté el tamaño de la fuente para que no sea tan grande
    textAlign: "center", // Asegura que el texto esté centrado
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "bold",
  },
  icon: {
    marginTop: 10,
    fontSize: 40,
  },
});

export default Home;
