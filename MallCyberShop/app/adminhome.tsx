import {Link, useRouter} from "expo-router";
import React from "react";
import {View, Text, StyleSheet, TouchableOpacity} from "react-native";
import {FontAwesome} from "@expo/vector-icons";

const Home: React.FC = () => {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <Link
          href="./dashboard/"
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
          href="./link/"
          style={[styles.button, {backgroundColor: "#4CAF"}]}
        >
          <View style={styles.iconLabelContainer}>
            <FontAwesome
              style={styles.icon}
              name="warning"
              size={30}
              color="white"
            />
            <Text style={styles.label}>Administración de Links</Text>
          </View>
        </Link>

        <Link
          href="./user/"
          style={[styles.button, {backgroundColor: "purple"}]}
        >
          <View style={styles.iconLabelContainer}>
            <FontAwesome
              style={styles.icon}
              name="warning"
              size={30}
              color="white"
            />
            <Text style={styles.label}>Administración de Usuarios</Text>
          </View>
        </Link>
      </View>
      <TouchableOpacity
        style={styles.bottonButton}
        onPress={() => router.push("../home/home")}
      >
        <Text style={styles.buttonText}>Ir a la Tienda</Text>
      </TouchableOpacity>
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
    width: "100%",
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
    fontSize: 16,
    textAlign: "center",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "bold",
  },
  icon: {
    marginTop: 10,
    fontSize: 40,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  bottonButton: {
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
});

export default Home;
