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
} from "./category";
import {useRouter} from "expo-router";
export type Category = {
  id: number;
  name: string;
};

const GestionCategorias = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState<string>("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

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
    console.log("newCategory", newCategory);
    if (!newCategory.trim()) {
      Alert.alert("Error", "Campos requeridos");
      return;
    }
    setLoading(true);

    if (editingCategory) {
      // Actualizar categoría
      const updatedCategory = await updateCategory(
        editingCategory.id,
        newCategory
      );
      if (updatedCategory) {
        setNewCategory("");
        setEditingCategory(null);
        loadCategories();
        Alert.alert("Aviso", "Categoría actualizada");
        setLoading(false);
      }
    } else {
      const createdCategory = await createCategory(newCategory);
      if (createdCategory) {
        setNewCategory("");
        loadCategories();
        Alert.alert("Aviso", "Categoría creada");

        setLoading(false);
      }
    }
  };

  // Eliminar categoría
  const handleDeleteCategory = async (id: number) => {
    setDeleting(id);
    try {
      const success = await deleteCategory(id);
      if (success) {
        loadCategories(); // Recargar categorías
        Alert.alert("Aviso", "Categoría eliminada");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setDeleting(null);
    }
  };

  // Habilitar edición de categoría
  const handleEditCategory = (category: Category) => {
    setNewCategory(category.name);
    setEditingCategory(category);
  };

  return (
    <View style={styles.container}>
      <TextInput
        value={newCategory}
        onChangeText={setNewCategory}
        placeholder="Nombre de la categoría"
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
            {editingCategory ? "Actualizar" : "Guardar"}
          </Text>
        )}
      </TouchableOpacity>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({item}) => (
          <View style={styles.row}>
            <Text style={styles.cell}>{item.name}</Text>
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleEditCategory(item)}
              >
                <Text style={styles.editButtonText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteCategory(item.id || 0)}
                disabled={deleting === item.id}
              >
                {deleting === item.id ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.deleteButtonText}>Eliminar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
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
});

export default GestionCategorias;
