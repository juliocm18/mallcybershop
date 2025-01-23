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
} from "react-native";
import {supabase} from "../supabase";
import {
  createCompany,
  deleteCompany,
  pickImage,
  updateCompany,
  uploadImage,
} from "./company";
import {styles} from "./styles";

const CompanyScreen = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [packageType, setPackageType] = useState("");
  const [url, setUrl] = useState("");
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [categories, setCategories] = useState("");
  const [editingImage, setEditingImage] = useState(false);

  const handlePickImage = async () => {
    if (editingId) {
      setEditingImage(true);
    }
    const uri = await pickImage(); // 📥 Llamamos a la función externa
    if (uri) {
      setLogoUri(uri); // ✅ Guardamos la imagen en useState
    }
  };

  const clearFields = async () => {
    setEditingImage(false);
    setKey("");
    setName("");
    setPackageType("");
    setUrl("");
    setLogoUri(null);
    setCategories("");
    setEditingId(null);
  };

  const handleAddCompany = () => {
    clearFields();
    setModalVisible(true);
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    const {data, error} = await supabase.from("company").select("*");
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      setCompanies(data);
    }
  };

  const handleSave = async () => {
    if (!key || !name || !packageType || !url || !categories) {
      Alert.alert("Error", "Campos reequeridos");
      return;
    }

    try {
      if (editingId) {
        let uploadedUrl: string | null = "";
        if (editingImage && logoUri) {
          uploadedUrl = await uploadImage(logoUri);
          console.log("uploadedUrl", uploadedUrl);
          if (uploadedUrl) {
            console.log("📤 Imagen subida con éxito:", uploadedUrl);
          } else {
            console.log("error al subir imagen");
            return;
          }
        } else {
          uploadedUrl = logoUri;
        }
        const newCompany = {
          key,
          name,
          package: packageType,
          url,
          logo: uploadedUrl || "",
          categories: categories.split(",").map((c) => c.trim()),
        };
        const updatedCategory = await updateCompany(editingId, newCompany);
        console.log(updatedCategory);
        if (updatedCategory) {
          clearFields();
          setModalVisible(false);
          fetchCompanies();
          Alert.alert("Success", "Registro actualizado");
        }
      } else {
        if (!logoUri) {
          Alert.alert("Error", "Seleccione un logo");
          return;
        }
        const uploadedUrl = await uploadImage(logoUri);
        // console.log("uploadedUrl", uploadedUrl);
        if (uploadedUrl) {
          console.log("📤 Imagen subida con éxito:", uploadedUrl);
        } else {
          return;
        }

        const newCompany = {
          key,
          name,
          package: packageType,
          url,
          logo: uploadedUrl,
          categories: categories.split(",").map((c) => c.trim()),
        };

        await createCompany(newCompany);
        Alert.alert("Success", "Empresa creada con éxito");

        // Limpiar los campos después de un registro exitoso
        clearFields();

        setModalVisible(false);
        fetchCompanies();
      }
    } catch (error: any) {
      console.error("Error creating company:", error.message);
      Alert.alert("Error", error.message);
    }
  };

  const handleEdit = (company: Company) => {
    setEditingId(company.id);
    setKey(company.key);
    setName(company.name);
    setPackageType(company.package);
    setUrl(company.url);
    setLogoUri(company.logo);
    setCategories(company.categories.join(", "));
    setEditingImage(false);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    deleteCompany(id);
    fetchCompanies();
  };

  return (
    <View style={styles.container}>
      <Button
        title="Agregar Empresa"
        onPress={() => handleAddCompany()}
        color="#ff9f61"
      />
      <FlatList
        data={companies}
        keyExtractor={(item) => item.id}
        renderItem={({item}) => (
          <View style={styles.row}>
            <Text style={styles.cell}>{item.name}</Text>
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleEdit(item)}
              >
                <Text style={styles.editButtonText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item.id)}
              >
                <Text style={styles.modalButtonText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.socialModaltitle}>
              {editingId ? "Actualizar" : "Guardar"} Empresa
            </Text>
            <Text style={styles.label}>Identificador</Text>
            <TextInput style={styles.input} value={key} onChangeText={setKey} />

            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Código de Applicación</Text>
            <TextInput
              style={styles.input}
              value={packageType}
              onChangeText={setPackageType}
            />

            <Text style={styles.label}>Página web</Text>
            <TextInput style={styles.input} value={url} onChangeText={setUrl} />

            <Text style={styles.label}>Categorías (separados por coma)</Text>
            <TextInput
              style={styles.input}
              value={categories}
              onChangeText={setCategories}
            />

            <TouchableOpacity
              style={styles.imagePicker}
              onPress={handlePickImage}
            >
              <Text style={styles.imagePickerText}>Seleccione el logotipo</Text>
            </TouchableOpacity>

            {logoUri && (
              <Image source={{uri: logoUri}} style={styles.logoPreview} />
            )}
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.modalUpdateButton}
                onPress={handleSave}
              >
                <Text style={styles.modalButtonText}>
                  {editingId ? "Actualizar" : "Guardar"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CompanyScreen;
