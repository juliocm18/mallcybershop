import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Text, Button, ActivityIndicator } from "react-native-paper";

import continentsData from "./data/continents.json";
import countriesData from "./data/countries.json";
import departmentsData from "./data/departments.json";
import Select from "./components/select";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { FontAwesome5 } from "@expo/vector-icons";
import { globalStyles } from "./styles";

const LocationHome = () => {
  const router = useRouter();
  const [continent, setContinent] = useState("");
  const [country, setCountry] = useState<{ id: string; name: string } | null>(null);
  const [department, setDepartment] = useState("");

  const [countries, setCountries] = useState<{ id: string; name: string }[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const { t } = useTranslation();
  const [clickCount, setClickCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (continent) {
      setCountries(
        (countriesData as Record<string, { id: string; name: string }[]>)[
        continent
        ] || []
      );
      setCountry(null);
      setDepartments([]);
    }
  }, [continent]);

  useEffect(() => {
    if (country) {
      setDepartments(
        (departmentsData as unknown as Record<string, string[]>)[country.id] || []
      );
      setDepartment("");
    }
  }, [country]);

  const handleGoLoginPress = () => {
    setClickCount((prev) => prev + 1);

    setTimeout(() => {
      setClickCount(0); // Resetea el contador si no hay 3 clics seguidos
    }, 1000);

    if (clickCount + 1 === 3) {
      setClickCount(0); // Reinicia el contador después de los 3 clics
      router.push("../auth/login"); // Cambia "OtraPantalla" por el nombre de tu pantalla
    }
  };

  const handleConfirm = async () => {
    if (department) {
      await AsyncStorage.setItem("department", department);
      await AsyncStorage.setItem("country", country?.name || "");
      router.push({
        pathname: "/home/home",
        params: { country: country?.name || "", department },
      });
    } else {
      Alert.alert(
        "Atención", // 👉 Título
        "Por favor, selecciona un departamento", // 👉 Mensaje
        [
          { text: "Entendido" }
        ]
      );
    }
  };



  return (
    <View style={styles.container}>

      <TouchableOpacity onPress={handleGoLoginPress} activeOpacity={1}>
        <Text style={globalStyles.pageTitle}>{t('locationHome.title')}</Text>
      </TouchableOpacity>



      <Select
        label={t('common.continent')}
        selectedValue={continent}
        onValueChange={setContinent}
        items={continentsData}
      />
      <Select
        label={t('common.country')}
        selectedValue={country?.id || ""}
        onValueChange={(value) => {
          const selectedCountry = countries.find(c => c.id === value);
          setCountry(selectedCountry || null);
        }}
        items={countries}
      />

      {departments.length > 0 && (
        <Select
          label={t('common.department')}
          selectedValue={department}
          onValueChange={setDepartment}
          items={departments.map((dep) => ({ id: dep, name: dep }))}
        />
      )}


      <TouchableOpacity
        style={styles.button}
        onPress={handleConfirm}
      //disabled={!department}
      >

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 10 }}>
          <Text style={styles.buttonText}>
            {t('common.enterButton')} <Text style={{ fontWeight: "bold", color: "white" }}>Mall & Cyber Shop</Text>
          </Text>
          <FontAwesome5
            name="shopping-cart"
            size={20}
            color="white"
            style={{ marginLeft: 10 }}
          />
        </View>

      </TouchableOpacity>


      {/* <Button
        mode="contained"
        buttonColor="#ff9f61" // Color de fondo
        textColor="#ffffff"   // Color de texto
        icon={({ size, color }) => (
          <FontAwesome5 name="shopping-cart" size={20} color="white" style={{ marginLeft: 10 }} />
        )}
        contentStyle={{ flexDirection: 'row-reverse' }}
        style={styles.button}
        disabled={!department}
        onPress={handleConfirm}
      >
        {t('common.enterButton')}
      </Button> */}


    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  button: {
    marginTop: 20,
    backgroundColor: "#ff9f61",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    //textAlign: "center",
  },
});

export default LocationHome;
