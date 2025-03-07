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
  createCompany,
  createCompanyLink,
  deleteCompany,
  deleteCompanyLink,
  fetchCompanies,
  fetchCompaniesByDepartments,
  fetchCompanyLinks,
  pickImage,
  updateCompany,
  updateCompanyLink,
  uploadImage,
} from "./functions";
import {styles} from "./styles";
import {FontAwesome} from "@expo/vector-icons";
import {Picker} from "@react-native-picker/picker";
import {Link} from "../link/model";
import LinkFunctions from "../link/functions";
import {Company, CompanyLink} from "./company.interface";
import PriorityInput from "./priority";
import {CompanyItem} from "./company.item";
import {useAuth} from "../context/AuthContext";
import UserFunctions from "../user/functions";
import RoleFunctions from "../role/functions";

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
  const [url, setUrl] = useState("");
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const [link, setLink] = useState<Link>();

  const [selectedLinkId, setSelectedLinkId] = useState<number>();
  const [priority, setPriority] = useState("");
  const {session} = useAuth();
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
    setPriority("");
    setEditingId(null);
  };

  const handleAddCompany = () => {
    clearFields();
    setModalVisible(true);
  };

  useEffect(() => {
    loadCompanies();
    loadLinks();
  }, []);

  const loadCompanies = async () => {
    const userDepartments = await UserFunctions.getDepartmentsByUser(
      session?.user?.id || ""
    );
    const userRoles = await RoleFunctions.getByUser(session?.user?.id || "");
    if (
      userRoles?.some(
        (role) => role.name === "CEO" || role.name === "Superadministrador"
      )
    ) {
      const data = await fetchCompanies("name");
      if (data) setCompanies(data);
    } else {
      const data = await fetchCompaniesByDepartments("name", userDepartments);
      if (data) setCompanies(data);
    }
  };

  const loadLinks = async () => {
    const data = await LinkFunctions.getAll();
    if (data) setLinks(data);
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
          if (!uploadedUrl) {
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
          priority: parseInt(priority),
        };
        const updatedCategory = await updateCompany(editingId, newCompany);

        if (updatedCategory) {
          clearFields();
          setModalVisible(false);
          loadCompanies();
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
          priority: parseInt(priority),
        };

        await createCompany(newCompany);
        Alert.alert("Aviso", "Registro creado con éxito");

        // Limpiar los campos después de un registro exitoso
        clearFields();

        setModalVisible(false);
        loadCompanies();
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
    setPriority(company.priority.toString());
    setPackageType(company.package);
    setLogoUri(company.logo);
    setCategories(company.categories.join(", "));
    setEditingImage(false);
    setModalVisible(true);
  };

  const handleSaveCompanyLink = async () => {
    if (!selectedLinkId || !url) {
      Alert.alert("Error", "Campos requeridos");
      return;
    }
    try {
      if (editingLinkId) {
        const companyObj = {
          url: url,
          link: {id: selectedLinkId},
        };
        const companyLinlUpdated = await updateCompanyLink(
          editingLinkId,
          companyObj
        );
        if (companyLinlUpdated) {
          setLink(undefined);
          setUrl("");
          setEditingLinkId(null);
          const companyLinks = await fetchCompanyLinks(companyId);
          setCompanyLinks(companyLinks);
        }
      } else {
        const companyObj = {
          //identificador: identificador,
          url: url,
          companyId: companyId,
          link: {id: selectedLinkId},
        };
        const companyLinlInserted = await createCompanyLink(companyObj);
        if (companyLinlInserted) {
          setLink(undefined);
          setUrl("");
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
    setLink(companyLink.link);
    setSelectedLinkId(companyLink.link?.id || 0);
    setUrl(companyLink.url);
  };

  const handleLinks = async (company: Company) => {
    setModalLinkVisible(true);
    setEditingLinkId(null);
    setLink(undefined);
    setUrl("");
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
      setLink(undefined);
      setUrl("");
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
      await fetchCompanies("name");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Administración de Socios Estratégicos</Text>
      <Button
        title="Agregar Socio Estratégico"
        onPress={handleAddCompany}
        color="#ff9f61"
      />

      <FlatList
        data={companies}
        keyExtractor={(item) => (item.id || 0).toString()}
        renderItem={({item}) => (
          <CompanyItem
            item={item}
            onEdit={handleEdit}
            onLinks={handleLinks}
            onDelete={handleDelete}
            deleting={deleting}
          />
        )}
        getItemLayout={(data, index) => ({
          length: 80,
          offset: 80 * index,
          index,
        })}
        windowSize={10}
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

            <PriorityInput priority={priority} setPriority={setPriority} />

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
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={[styles.modalContent]}
          >
            <View
              style={{
                minHeight: 300,
                maxHeight: 600,
              }}
            >
              <>
                <Text style={styles.socialModalFooterTitle}>
                  Agregar Contacto:
                </Text>
                <Picker
                  selectedValue={link?.id}
                  onValueChange={(itemValue) => setSelectedLinkId(itemValue)}
                >
                  {links.map((link) => (
                    <Picker.Item
                      key={link.id}
                      label={link.name}
                      value={link.id}
                    />
                  ))}
                </Picker>
                <Text style={styles.label}>Enlace</Text>
                <TextInput
                  style={styles.input}
                  value={url}
                  onChangeText={setUrl}
                />
                <View
                  style={[styles.modalButtonContainer, {paddingBottom: 10}]}
                >
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
              </>
              <FlatList
                data={companyLinks}
                keyExtractor={(item) => (item.id || 0).toString()}
                keyboardShouldPersistTaps="handled"
                renderItem={({item}) => (
                  <View style={styles.row}>
                    <View style={{flexDirection: "column"}}>
                      <Text style={styles.cell}>Tipo: {item.link?.name}</Text>
                      <Text style={[styles.cell, {maxWidth: 200}]}>
                        {item.url}
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
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
};

export default CompanyScreen;
