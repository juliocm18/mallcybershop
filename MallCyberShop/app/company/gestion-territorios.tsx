import React, {useEffect, useState} from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Modal,
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  fetchCompanies,
  fetchCompanyLinks,
  pickImage,
  updateCompany,
} from "./functions";
import {styles} from "./styles";
import {Company, CompanyLink} from "./company.interface";
import {TerritoryCompanyItem} from "./territory-company.item";
import continentsData from "../data/continents.json";
import countriesData from "../data/countries.json";
import departmentsData from "../data/departments.json";
import Select from "../components/select";
const GestionTerritorios = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [modalTerritoryVisible, setModalTerritoryVisible] = useState(false);
  const [continent, setContinent] = useState("");
  const [country, setCountry] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [countries, setCountries] = useState<{id: string; name: string}[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);

  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);

  const toggleSelection = (department: string) => {
    setSelectedDepartments(
      (prevSelected) =>
        prevSelected.includes(department)
          ? prevSelected.filter((dep) => dep !== department) // Quita si está seleccionado
          : [...prevSelected, department] // Agrega si no está seleccionado
    );
  };

  useEffect(() => {
    if (continent) {
      setCountries(
        (countriesData as Record<string, {id: string; name: string}[]>)[
          continent
        ] || []
      );
      setCountry("");
      setDepartments([]);
    }
  }, [continent]);

  useEffect(() => {
    if (country) {
      setDepartments(
        (departmentsData as Record<string, string[]>)[country] || []
      );
    }
  }, [country]);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    const data = await fetchCompanies("name");
    if (data) setCompanies(data);
  };

  const handleTerritory = async (company: Company) => {
    clearFields();
    setModalTerritoryVisible(true);
    setSelectedDepartments(company.departments || []);
    setEditingId(company.id || null);
  };

  const clearFields = () => {
    setSelectedDepartments([]);
    setContinent("");
    setCountry("");
    setDepartments([]);
    setEditingId(null);
  };

  const handleSaveTerritory = async () => {
    try {
      if (editingId) {
        const companyObj: Partial<Company> = {
          departments: selectedDepartments,
          id: editingId,
        };
        const updatedCompany = await updateCompany(editingId, companyObj);
        if (updatedCompany) {
          clearFields();
          setModalTerritoryVisible(false);
          loadCompanies();
          Alert.alert("Aviso", "Registro actualizado");
        }
      }
    } catch (error: any) {
      console.error("Error al agregar territorios", error.message);
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestión de Territorios</Text>
      <FlatList
        data={companies}
        keyExtractor={(item) => (item.id || 0).toString()}
        renderItem={({item}) => (
          <TerritoryCompanyItem item={item} onOpenTerritory={handleTerritory} />
        )}
        getItemLayout={(data, index) => ({
          length: 80,
          offset: 80 * index,
          index,
        })}
        windowSize={10}
      />

      <Modal visible={modalTerritoryVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContent}
          >
            <View>
              <Text style={styles.title}>Asignar Territorios</Text>
              <>
                <Select
                  label="Continente"
                  selectedValue={continent}
                  onValueChange={setContinent}
                  items={continentsData}
                />
                <Select
                  label="País"
                  selectedValue={country}
                  onValueChange={setCountry}
                  items={countries}
                />

                <View
                  style={{
                    minHeight: 120,
                    borderWidth: 1,
                    borderColor: "#ddd",
                    borderRadius: 5,
                    padding: 20,
                    maxHeight: 500,
                  }}
                >
                  {departments.length === 0 ? (
                    <Text style={{color: "#ccc"}}>
                      Lista de Departamentos...
                    </Text>
                  ) : (
                    <FlatList
                      data={departments}
                      keyExtractor={(item) => item}
                      showsHorizontalScrollIndicator={true}
                      renderItem={({item}) => {
                        const isSelected = selectedDepartments.includes(item);
                        return (
                          <TouchableOpacity
                            onPress={() => toggleSelection(item)}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              paddingVertical: 8,
                            }}
                          >
                            <View
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: 4,
                                borderWidth: 2,
                                borderColor: "#ff9f61",
                                justifyContent: "center",
                                alignItems: "center",
                                backgroundColor: isSelected
                                  ? "#ff9f61"
                                  : "transparent",
                              }}
                            >
                              {isSelected && (
                                <Text
                                  style={{color: "white", fontWeight: "bold"}}
                                >
                                  ✔
                                </Text>
                              )}
                            </View>
                            <Text style={{marginLeft: 10, fontSize: 16}}>
                              {item}
                            </Text>
                          </TouchableOpacity>
                        );
                      }}
                    />
                  )}

                  <Text style={{marginTop: 20, fontWeight: "bold"}}>
                    Seleccionados: {selectedDepartments.join(", ")}
                  </Text>
                </View>

                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={styles.modalUpdateButton}
                    onPress={handleSaveTerritory}
                  >
                    <Text style={styles.modalButtonText}>Guardar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => setModalTerritoryVisible(false)}
                  >
                    <Text style={styles.modalButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
};

export default GestionTerritorios;
