import React, {useState, useEffect} from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import {
  getCategories,
  createCategory,
  deleteCategory,
  updateCategory, // Asumir que tienes una función para actualizar categorías
} from "./functions";
import {FontAwesome} from "@expo/vector-icons";
import { globalStyles } from "../styles";
import {Category} from "./types";
import ConfirmationModal from "../components/confirmation-modal";

const Index = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState<string>("");
  const [newPriority, setNewPriority] = useState<number>(0);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingName, setDeletingName] = useState<string>();

  // Cargar categorías
  const loadCategories = async () => {
    const data = await getCategories();
    if (data) setCategories(data);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Crear o actualizar categoría
  const handleSaveCategory = async () => {
    if (!newCategory.trim() || newPriority <= 0) {
      Alert.alert("Error", "Campos requeridos");
      return;
    }
    setLoading(true);

    if (editingCategory) {
      // Actualizar categoría
      const updatedCategory = await updateCategory(
        editingCategory.id,
        newCategory,
        newPriority
      );
      if (updatedCategory) {
        setNewCategory("");
        setNewPriority(0);
        setEditingCategory(null);
        loadCategories();
        Alert.alert("Aviso", "Categoría actualizada");
        setLoading(false);
      }
    } else {
      const createdCategory = await createCategory(newCategory, newPriority);
      if (createdCategory) {
        setNewCategory("");
        setNewPriority(0);
        loadCategories();
        Alert.alert("Aviso", "Categoría creada");
        setLoading(false);
      }
    }
  };

  // Eliminar categoría
  const handleDeleteCategory = async (id: number) => {
    setDeletingId(id);
    try {
      const success = await deleteCategory(id);
      if (success) {
        loadCategories(); // Recargar categorías
        Alert.alert("Aviso", "Categoría eliminada");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setDeletingId(null);
      setConfirmModalVisible(false)
    }
  };

  // Habilitar edición de categoría
  const handleEditCategory = (category: Category) => {
    setNewCategory(category.name);
    setNewPriority(category.priority);
    setEditingCategory(category);
  };

  const confirmDelete = (category: Category) => {
    setDeletingId(category.id);
    setDeletingName(category.name);
    setConfirmModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <Text style={globalStyles.pageTitle}>Administración de Categorías</Text>
      <TextInput
        value={newCategory}
        onChangeText={setNewCategory}
        placeholder="Nombre de la categoría"
        style={styles.input}
      />
      <TextInput
      keyboardType="numeric"
        value={newPriority.toString()}
        onChangeText={(text) => setNewPriority(Number(text))}
        placeholder="prioridad"
        style={styles.input}
      />
      <TouchableOpacity
        style={styles.button}
        onPress={handleSaveCategory}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {editingCategory ? "Actualizar registro" : "Guardar registro"}
          </Text>          
        )}
        <FontAwesome style={globalStyles.globalButtonIcon} name="plus" size={24} color="white" />
      </TouchableOpacity>

      <FlatList
        style={{height: "92%"}}
        data={categories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({item}) => (
          <View style={styles.row}>
            <Text style={styles.cell}>{item.priority} - {item.name}</Text>
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleEditCategory(item)}
              >
                <FontAwesome name="edit" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => confirmDelete(item)}
                disabled={deletingId === item.id}
              >
                {deletingId === item.id ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <FontAwesome name="trash" size={24} color="white" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      <ConfirmationModal
        visible={confirmModalVisible}
        alias={deletingName || "el registro"}
        onConfirm={() => {handleDeleteCategory(deletingId || 0);}}
        onCancel={() => {setDeletingId(null); setConfirmModalVisible(false)}}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 35,
    padding: 20,
    paddingBottom: 40,
    backgroundColor: "#fff",
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    paddingLeft: 10,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#ff9f61",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  cell: {flex: 1},
  buttonsContainer: {
    flexDirection: "row",
  },
  editButton: {
    backgroundColor: "#ff9f61",
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 10,
    borderRadius: 5,
  },
  editButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  deleteButton: {
    backgroundColor: "#e74c3c",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#fb8436",
  },
});

export default Index;
