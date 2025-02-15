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
} from "react-native";
import {supabase} from "../supabase";
import {
  createCompany,
  createCompanyLink,
  deleteCompany,
  deleteCompanyLink,
  fetchCompanyLinks,
  pickImage,
  updateCompany,
  updateCompanyLink,
  uploadImage,
} from "./company";
import {styles} from "./styles";
import {FontAwesome} from "@expo/vector-icons";
import {Picker} from "@react-native-picker/picker";

const options = [
  "comestibles",
  "email",
  "facebook",
  "instagram",
  "line",
  "linkedin",
  "meet",
  "messenger",
  "online",
  "paginaweb",
  "panaderia",
  "pinterest",
  "snapchat",
  "telefono",
  "telegram",
  "threads",
  "tienda",
  "tiktok",
  "wechat",
  "whatssapp",
  "whatssappb",
  "x",
  "youtube",
  "zoom",
];

const CompanyScreen = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyLinks, setCompanyLinks] = useState<CompanyLink[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalLinkVisible, setModalLinkVisible] = useState(false);
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [packageType, setPackageType] = useState("");
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [categories, setCategories] = useState("");
  const [editingImage, setEditingImage] = useState(false);

  const [companyId, setCompanyId] = useState<number>(0);
  const [editingLinkId, setEditingLinkId] = useState<number | null>(null);
  const [identificador, setIdentificador] = useState(options[0]);
  const [link, setLink] = useState("");

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

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
    if (!key || !name || !packageType || !categories) {
      Alert.alert("Error", "Campos requeridos");
      return;
    }
    setLoading(true);

    try {
      if (editingId) {
        let uploadedUrl: string | null = "";
        if (editingImage && logoUri) {
          uploadedUrl = await uploadImage(logoUri);
          console.log("uploadedUrl", uploadedUrl);
          if (uploadedUrl) {
            //console.log("📤 Imagen subida con éxito:", uploadedUrl);
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
          logo: uploadedUrl || "",
          categories: categories.split(",").map((c) => c.trim()),
        };
        const updatedCategory = await updateCompany(editingId, newCompany);

        if (updatedCategory) {
          clearFields();
          setModalVisible(false);
          fetchCompanies();
          Alert.alert("Aviso", "Registro actualizado");
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
          logo: uploadedUrl,
          categories: categories.split(",").map((c) => c.trim()),
        };

        await createCompany(newCompany);
        Alert.alert("Aviso", "Registro creado con éxito");

        // Limpiar los campos después de un registro exitoso
        clearFields();

        setModalVisible(false);
        fetchCompanies();
      }
    } catch (error: any) {
      console.error("Error creating company:", error.message);
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (company: Company) => {
    setEditingId(company.id || 0);
    setKey(company.key);
    setName(company.name);
    setPackageType(company.package);
    setLogoUri(company.logo);
    setCategories(company.categories.join(", "));
    setEditingImage(false);
    setModalVisible(true);
  };

  const handleSaveCompanyLink = async () => {
    if (!identificador || !link) {
      Alert.alert("Error", "Campos requeridos");
      return;
    }
    try {
      if (editingLinkId) {
        const companyObj = {
          identificador: identificador,
          link: link,
        };
        const companyLinlUpdated = await updateCompanyLink(
          editingLinkId,
          companyObj
        );
        if (companyLinlUpdated) {
          setIdentificador("");
          setLink("");
          setEditingLinkId(null);
          const companyLinks = await fetchCompanyLinks(companyId);
          setCompanyLinks(companyLinks);
        }
      } else {
        const companyObj = {
          identificador: identificador,
          link: link,
          companyId: companyId,
        };
        const companyLinlInserted = await createCompanyLink(companyObj);
        if (companyLinlInserted) {
          setIdentificador("");
          setLink("");
          setEditingLinkId(null);
          const companyLinks = await fetchCompanyLinks(companyId);
          setCompanyLinks(companyLinks);
        }
      }
    } catch (error: any) {
      console.error("Error creating/updating company link:", error.message);
      Alert.alert("Error", error.message);
    }
  };

  const handleEditLink = (companyLink: CompanyLink) => {
    setEditingLinkId(companyLink.id || 0);
    setIdentificador(companyLink.identificador);
    setLink(companyLink.link);
  };

  const handleLinks = async (company: Company) => {
    setModalLinkVisible(true);
    setEditingLinkId(null);
    setIdentificador("");
    setLink("");
    setCompanyId(company.id || 0);
    try {
      const companyLinks = await fetchCompanyLinks(company.id || 0);
      setCompanyLinks(companyLinks);
    } catch (error: any) {
      console.error("Error fetching company links:", error.message);
    }
  };

  const handleDeleteLink = async (companyLink: CompanyLink) => {
    setDeleting(companyLink.id || 0);
    try {
      deleteCompanyLink(companyLink.id || 0);
      const companyLinks = await fetchCompanyLinks(companyId);
      setCompanyLinks(companyLinks);
      setIdentificador("");
      setLink("");
      setEditingLinkId(null);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleting(id);
    try {
      await deleteCompany(id);
      await fetchCompanies();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <View style={styles.container}>
      <Button
        title="Agregar Socio Estratégico"
        onPress={() => handleAddCompany()}
        color="#ff9f61"
      />
      <FlatList
        data={companies}
        keyExtractor={(item) => (item.id || 0).toString()}
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
                style={styles.LinkButton}
                onPress={() => handleLinks(item)}
              >
                <Text style={styles.editButtonText}>Links</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item.id || 0)}
                disabled={deleting === item.id}
              >
                {deleting === item.id ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>Eliminar</Text>
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
              {editingId ? "Actualizar" : "Guardar"} Socio Estratégico
            </Text>
            <Text style={styles.label}>Identificador</Text>
            <TextInput style={styles.input} value={key} onChangeText={setKey} />

            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Código de Aplicación</Text>
            <TextInput
              style={styles.input}
              value={packageType}
              onChangeText={setPackageType}
            />

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

      <Modal visible={modalLinkVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.socialModaltitle}>Administrar Links</Text>

            <FlatList
              data={companyLinks}
              keyExtractor={(item) => (item.id || 0).toString()}
              renderItem={({item}) => (
                <View style={styles.row}>
                  <View style={{flexDirection: "column"}}>
                    <Text style={styles.cell}>Tipo: {item.identificador}</Text>
                    <Text style={[styles.cell, {maxWidth: 200}]}>
                      {item.link}
                    </Text>
                  </View>
                  <View style={styles.buttonsContainer}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEditLink(item)}
                    >
                      <FontAwesome name="edit" size={24} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteLink(item)}
                    >
                      <FontAwesome name="trash" size={24} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />

            <View style={styles.modalContent}>
              <Text style={styles.label}>Identificador</Text>
              <View style={styles.input}>
                <Picker
                  selectedValue={identificador}
                  onValueChange={(itemValue) => setIdentificador(itemValue)}
                >
                  {options.map((option) => (
                    <Picker.Item key={option} label={option} value={option} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.label}>Link</Text>
              <TextInput
                style={styles.input}
                value={link}
                onChangeText={setLink}
              />

              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={styles.modalUpdateButton}
                  onPress={handleSaveCompanyLink}
                >
                  <Text style={styles.modalButtonText}>Guardar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setModalLinkVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CompanyScreen;
