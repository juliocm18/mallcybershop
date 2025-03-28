import React, {useState, useEffect} from "react";
import {View, StyleSheet} from "react-native";
import {Text, Button} from "react-native-paper";

import continentsData from "./data/continents.json";
import countriesData from "./data/countries.json";
import departmentsData from "./data/departments.json";
import Select from "./components/select";
import {useRouter} from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";

const LocationHome = () => {
  const router = useRouter();
  const [continent, setContinent] = useState("");
  const [country, setCountry] = useState<{id: string; name: string} | null>(null);
  const [department, setDepartment] = useState("");

  const [countries, setCountries] = useState<{id: string; name: string}[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    if (continent) {
      setCountries(
        (countriesData as Record<string, {id: string; name: string}[]>)[
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

  const handleConfirm = async () => {
    if (department) {
      await AsyncStorage.setItem("department", department);
      await AsyncStorage.setItem("country", country?.name || "");
      router.push({
        pathname: "/home/home",
        params: {country: country?.name || "", department},
      });
    } else {
      alert("Por favor, selecciona un departamento");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('locationHome.title')}</Text>

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
          items={departments.map((dep) => ({id: dep, name: dep}))}
        />
      )}

      <Button
        mode="contained"
        style={styles.button}
        disabled={!department}
        onPress={handleConfirm}
      >
        {t('common.enterButton')}
      </Button>

      <Button
        mode="contained"
        style={styles.button}
        onPress={() => router.push("/auth/login")}
      >
        {t('locationHome.goToLogin')}
      </Button>
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
  },
});

export default LocationHome;
