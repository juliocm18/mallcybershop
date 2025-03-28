import React, { useEffect, useState } from "react";
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
  ScrollView,
} from "react-native";
import {
  fetchCompanies,
  fetchCompaniesByDepartments,
  fetchCompaniesByDepartmentsOrNull,
  fetchCompanyLinks,
  getAllPaged,
  pickImage,
  updateCompany,
} from "./functions";
import { styles } from "./styles";
import { Company, CompanyLink } from "./company.interface";
import { TerritoryCompanyItem } from "./territory-company.item";
import continentsData from "../data/continents.json";
import countriesData from "../data/countries.json";
import departmentsData from "../data/departments.json";
import Select from "../components/select";
import UserFunctions from "../user/functions";
import { useAuth } from "../context/AuthContext";
import { globalStyles } from "../styles";
const GestionTerritorios = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [modalTerritoryVisible, setModalTerritoryVisible] = useState(false);
  const [continent, setContinent] = useState("");
  const [country, setCountry] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState<{ id: string; name: string }[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);

  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const { session } = useAuth();


  /* Modal Country*/
  const [modalCountryVisible, setModalCountryVisible] = useState(false);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);

  /* Pagination */
  const [page, setPage] = useState(0);
  const pageSize = 20; // Cantidad de registros por página
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  /* pagination end */

  const toggleSelection = (department: string) => {
    setSelectedDepartments(
      (prevSelected) =>
        prevSelected.includes(department)
          ? prevSelected.filter((dep) => dep !== department) // Quita si está seleccionado
          : [...prevSelected, department] // Agrega si no está seleccionado
    );
  };

  const toggleCountrySelection = (countryName: string) => {
    setSelectedCountries(
      (prevSelected) =>
        prevSelected.includes(countryName)
          ? prevSelected.filter((country) => country !== countryName) // Quita si está seleccionado
          : [...prevSelected, countryName] // Agrega si no está seleccionado
    );
  };

  useEffect(() => {
    if (continent) {
      setCountries(
        (countriesData as Record<string, { id: string; name: string }[]>)[
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
    loadCompanies(true);
  }, []);

  const loadCompanies = async (reset: boolean) => {
    if (loadingMore) return;
    setLoadingMore(true);
    const from = reset ? 0 : page * pageSize;
    const to = from + pageSize - 1;

    // const userDepartments = await UserFunctions.getDepartmentsByUser(
    //   session?.user?.id || ""
    // );
    console.log("Loading companies from", from, "to", to);
    const data = await getAllPaged(from, to, "name");

    if (reset) {
      if (data) setCompanies(data);
      setPage(1);
    } else {
      setCompanies((prevCompanies) => [...prevCompanies, ...(data || [])]);
      setPage((prevPage) => prevPage + 1);
    }

    setHasMore((data?.length || 0) === pageSize); // Si no hay más datos, detenemos la carga
    setLoadingMore(false);
  };
  const loadMore = () => {
    if (hasMore) {
      loadCompanies(false);
    }
  };

  const handleTerritory = async (company: Company) => {
    clearFields();
    setModalTerritoryVisible(true);
    setSelectedDepartments(company.departments || []);
    setEditingId(company.id || null);
    setCompanyName(company.name || "");
  };

  const clearFields = () => {
    setContinent("");
    setCountry("");
    setDepartments([]);
    setCountries([]);
    setEditingId(null);
    setSelectedCountries([]);
    setSelectedDepartments([]);
  };

  const handleSaveTerritory = async () => {
    try {
      setLoading(true);
      if (editingId) {
        const companyObj: Partial<Company> = {
          departments: selectedDepartments.length > 0 ? selectedDepartments : [],
          id: editingId,
        };

        if (!session?.user?.id) {
          Alert.alert("Error", "Usuario no identificado");
          return;
        }      

        const userDepartments : string[] = await UserFunctions.getDepartmentsByUser(session?.user?.id);

        if (!Array.isArray(userDepartments)) {
            Alert.alert("Error", "No se pudieron obtener los departamentos del usuario");
            return;
        }

        if (!Array.isArray(companyObj.departments)) {
            Alert.alert("Error", "Los departamentos de la empresa no son válidos");
            return;
        }

        let hasPermission = true;
        

        for (const dep of companyObj.departments) {
          if (!userDepartments.includes(dep)) {
            hasPermission = false;
            break;
          }
        }          


        if (!hasPermission) {
            Alert.alert("Error", "El territorio que desea asignar no le corresponde");
            return;
}

        
        const updatedCompany = await updateCompany(editingId, companyObj);
        if (updatedCompany) {
          clearFields();
          setModalTerritoryVisible(false);
          loadCompanies(true);
          Alert.alert("Aviso", "Registro actualizado");
        }
      } else {
        Alert.alert("Error", "Error al actualizar");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };


  const handleSaveTerritoryCountry = async () => {
    try {
      setLoading(true);
      if (editingId) {
        const companyObj: Partial<Company> = {
          countries: selectedCountries,
          id: editingId,
        };
        const updatedCompany = await updateCompany(editingId, companyObj);
        if (updatedCompany) {
          clearFields();
          setModalCountryVisible(false);
          loadCompanies(true);
          Alert.alert("Aviso", "Registro actualizado");
        }
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTerritoryCountry = async (company: Company) => {
    clearFields();
    setModalCountryVisible(true);
    setSelectedCountries(company.countries || []);
    setEditingId(company.id || null);
    setCompanyName(company.name || "");
  };

  return (
    <View style={styles.container}>
      <Text style={globalStyles.pageTitle}>Asignación de Territorios a S.E</Text>
      <FlatList
        style={{ height: "92%" }}
        data={companies}
        keyExtractor={(item, index) => (index).toString()}
        renderItem={({ item }) => (
          <TerritoryCompanyItem item={item} onOpenTerritory={handleTerritory} onOpenCountry={handleTerritoryCountry} />
        )}
        getItemLayout={(data, index) => ({
          length: 80,
          offset: 80 * index,
          index,
        })}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loadingMore ? <ActivityIndicator size="large" /> : null}
        removeClippedSubviews={true} // Elimina elementos fuera de pantalla
        windowSize={5}
      />

      <Modal visible={modalTerritoryVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContent}
          >
            <View>
              <Text style={styles.title}>{companyName}</Text>
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
                    <Text style={{ color: "#ccc" }}>
                      Lista de Departamentos...
                    </Text>
                  ) : (
                    <FlatList
                      data={departments}
                      keyExtractor={(item) => item}
                      showsHorizontalScrollIndicator={true}
                      renderItem={({ item }) => {
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
                                  style={{ color: "white", fontWeight: "bold" }}
                                >
                                  ✔
                                </Text>
                              )}
                            </View>
                            <Text style={{ marginLeft: 10, fontSize: 16 }}>
                              {item}
                            </Text>
                          </TouchableOpacity>
                        );
                      }}
                    />
                  )}

                  <View style={{ marginTop: 20, maxHeight: 150, borderWidth: 1, borderColor: "#ccc", borderRadius: 3 }}>
                    <ScrollView>
                      <Text style={{ fontWeight: "bold", padding: 10, fontSize: 11, color: "#898989" }}>
                        Seleccionados: {selectedDepartments.join(", ")}
                      </Text>
                    </ScrollView>
                  </View>
                </View>

                <View style={styles.modalButtonContainer}>

                  <TouchableOpacity
                    style={styles.modalUpdateButton}
                    onPress={handleSaveTerritory}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.modalButtonText}>
                        {editingId ? "Actualizar" : "Guardar"}
                      </Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => setModalTerritoryVisible(false)}
                    disabled={loading}
                  >
                    <Text style={styles.modalButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>


      <Modal visible={modalCountryVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContent}
          >
            <View>
              <Text style={styles.title}>{companyName}</Text>
              <>
                <Select
                  label="Continente"
                  selectedValue={continent}
                  onValueChange={setContinent}
                  items={continentsData}
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
                  {countries.length === 0 ? (
                    <Text style={{ color: "#ccc" }}>
                      Lista de  Países...
                    </Text>
                  ) : (
                    <FlatList
                      data={countries}
                      keyExtractor={(item) => item.id}
                      showsHorizontalScrollIndicator={true}
                      renderItem={({ item }) => {
                        const isSelected = selectedCountries.includes(item.name);
                        return (
                          <TouchableOpacity
                            onPress={() => toggleCountrySelection(item.name)}
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
                                  style={{ color: "white", fontWeight: "bold" }}
                                >
                                  ✔
                                </Text>
                              )}
                            </View>
                            <Text style={{ marginLeft: 10, fontSize: 16 }}>
                              {item.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      }}
                    />
                  )}

                  <View style={{ marginTop: 20, maxHeight: 150, borderWidth: 1, borderColor: "#ccc", borderRadius: 3 }}>
                    <ScrollView>
                      <Text style={{ fontWeight: "bold", padding: 10, fontSize: 11, color: "#898989" }}>
                        Seleccionados: {selectedCountries.join(", ")}
                      </Text>
                    </ScrollView>
                  </View>
                </View>

                <View style={styles.modalButtonContainer}>

                  <TouchableOpacity
                    style={styles.modalUpdateButton}
                    onPress={handleSaveTerritoryCountry}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.modalButtonText}>
                        {editingId ? "Actualizar" : "Guardar"}
                      </Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => setModalCountryVisible(false)}
                    disabled={loading}
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
