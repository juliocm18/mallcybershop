import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  Button,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

import { User } from "./model";

import { styles } from "./styles";
import UserFunctions from "./functions";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { Role } from "../role/model";
import RoleFunctions from "../role/functions";
import Select from "../components/select";
import continentsData from "../data/continents.json";
import countriesData from "../data/countries.json";
import departmentsData from "../data/departments.json";
import { useAuth } from "../context/AuthContext";
export default function Index() {
  const [users, setUsers] = useState<User[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [roleId, setRoleId] = useState<number | null>(null);

  const [roles, setRoles] = useState<Role[]>([]);

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  const [modalTerritoryVisible, setModalTerritoryVisible] = useState(false);
  const [continent, setContinent] = useState("");
  const [country, setCountry] = useState("");
  const [countries, setCountries] = useState<{ id: string; name: string }[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const { session } = useAuth();
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

  const loadUsers = async () => {
    const data = await UserFunctions.getAll();
    if (data) setUsers(data);
  };

  const loadRoles = async () => {
    const data = await RoleFunctions.getAll();
    if (data) setRoles(data);
  };

  const handleAdd = () => {
    clearFields();
    setModalVisible(true);
  };

  const clearFields = async () => {
    setEmail("");
    setPassword("");
    setEditingId(null);
  };

  const handleEdit = (user: User) => {
    setEditingId(user.id || "");
    setEmail(user.email);
    setPassword(user.password || "");

    const tmpRoleId =
      user.roles && user.roles.length > 0 ? user.roles[0].id ?? 0 : 0;
    setRoleId(tmpRoleId);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await UserFunctions.remove(id);
      await loadUsers();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      if (editingId) {
        const userRoles = await RoleFunctions.getByUser(
          session?.user?.id || ""
        );
        const responseUpdate = await UserFunctions.updateRole(
          editingId,
          roleId || 0,
          userRoles || []
        );

        if (responseUpdate) {
          clearFields();
          setModalVisible(false);
          loadUsers();
          Alert.alert("Aviso", "Registro actualizado");
        } else {
          Alert.alert("Error", "No se pudo actualizar el registro");
        }
      } else {
        if (!email || !password) {
          Alert.alert("Error", "Campos requeridos");
          return;
        }
        await UserFunctions.save(email, password);
        Alert.alert("Aviso", "Registro creado con éxito");

        clearFields();
        setModalVisible(false);
        loadUsers();
      }
    } catch (error: any) {
      console.error("Error creating user:", error.message);
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTerritory = async () => {
    try {
      setLoading(true);
      if (editingId) {
        const updatedCompany = await UserFunctions.updateDepartments(
          editingId,
          selectedDepartments
        );
        if (updatedCompany) {
          clearFields();
          setModalTerritoryVisible(false);
          loadUsers();
          Alert.alert("Aviso", "Registro actualizado");
        }
      }
    } catch (error: any) {
      console.error("Error al agregar territorios", error.message);
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTerritory = async (user: User) => {
    clearFields();
    setModalTerritoryVisible(true);
    setSelectedDepartments(user.departments || []);
    setEditingId(user.id || null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Administración de Usuarios</Text>
      <Button
        title="Agregar Usuario"
        onPress={() => handleAdd()}
        color="#ff9f61"
      />
      <FlatList
        data={users}
        keyExtractor={(item) =>
          item.id ? item.id.toString() : Math.random().toString()
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flexDirection: "column", maxWidth: 180 }}>
              <Text style={styles.cell}>{item.email}</Text>
              {item.roles && item.roles.length > 0 ? (
                <Text style={[styles.cell, { fontWeight: "bold" }]}>
                  {item.roles[0].name}
                </Text>
              ) : (
                <Text style={styles.cell}>Rol sin asignar</Text>
              )}
            </View>

            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleEdit(item)}
              >
                <FontAwesome name="edit" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.LinkButton}
                onPress={() => handleTerritory(item)}
              >
                <FontAwesome name="globe" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item.id || "")}
                disabled={deleting === item.id}
              >
                {deleting === item.id ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <FontAwesome name="trash" size={24} color="white" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.socialModaltitle}>
              {editingId ? "Actualizar" : "Guardar"} Usuario
            </Text>

            {!editingId && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                />

                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={24}
                    />
                  </TouchableOpacity>
                </View>
              </>
            )}

            {editingId && (
              <>
                <Text style={styles.label}>{email}</Text>
                <View style={styles.input}>
                  <Text style={styles.label}>Rol</Text>
                  <Picker
                    selectedValue={roleId}
                    onValueChange={(itemValue) => setRoleId(itemValue)}
                  >
                    {roles.map((role) => (
                      <Picker.Item
                        key={role.id}
                        label={role.name}
                        value={role.id}
                      />
                    ))}
                  </Picker>
                </View>
              </>
            )}

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.modalUpdateButton}
                onPress={handleSave}
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
                onPress={() => setModalVisible(false)}
                disabled={loading}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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

                <View style={[styles.modalButtonContainer, { paddingTop: 10 }]}>
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
    </View>
  );
}
