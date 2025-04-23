import React, { useEffect, useState } from "react";
import { Checkbox } from "react-native-paper";

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
  getAllPaged,
  getAllPagedByCategory,
  pickImage,
  updateCompany,
  updateCompanyLink,
  uploadImage,
} from "./functions";
import { styles } from "./styles";
import { FontAwesome } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { Link } from "../link/model";
import LinkFunctions from "../link/functions";
import { Company, CompanyLink } from "./company.interface";
import PriorityInput from "./priority";
import { CompanyItem } from "./company.item";
import { useAuth } from "../context/AuthContext";
import UserFunctions from "../user/functions";
import RoleFunctions from "../role/functions";
import { globalStyles } from "../styles";
import ConfirmationModal from "../components/confirmation-modal";
import Select from "../components/select";
import { getCategories, getCategoriesOrderByName } from "../category/functions";
import { Category } from "../category/types";

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

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [deletingName, setDeletingName] = useState<string>();
  const [confirmModalLinkVisible, setConfirmModalLinkVisible] = useState(false);
  const [isGlobal, setIsGlobal] = useState(false);

  const [link, setLink] = useState<Link>();

  const [selectedLinkId, setSelectedLinkId] = useState<number>();
  const [priority, setPriority] = useState("");
  const { session } = useAuth();

  /* Pagination */
  const [page, setPage] = useState(0);
  const pageSize = 50; // Cantidad de registros por página
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const [selectedCategoyListItem, setSelectedCategoyListItem] = useState<string>("INTELIGENCIAS ARTIFICIALES");
  /* pagination end */


  const handlePickImage = async () => {
    if (editingId) {
      setEditingImage(true);
    }
    const uri = await pickImage(); // 
    if (uri) {
      setLogoUri(uri); // 
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
    setIsGlobal(false);
  };

  const handleAddCompany = () => {
    clearFields();
    setModalVisible(true);
  };

  useEffect(() => {
    loadCompanies(true, selectedCategoyListItem);
    loadLinks();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const categories = await getCategoriesOrderByName();
    if (categories) setCategoryList(categories);
  };

  const loadCompanies = async (reset: boolean = false, categoryName?: string) => {
    if (!categoryName && !selectedCategoyListItem) console.log("no hay categoria seleccionada");
    if (loadingMore) return;
    setLoadingMore(true);
    const from = reset ? 0 : page * pageSize;
    const to = from + pageSize - 1;


    const userDepartments = await UserFunctions.getDepartmentsByUser(
      session?.user?.id || ""
    );
    const userRoles = await RoleFunctions.getByUser(session?.user?.id || "");
    if (
      userRoles?.some(
        (role) => role.name === "CEO" || role.name === "Superadministrador"
      )
    ) {
      const data = await getAllPagedByCategory(from, to, "name", categoryName || selectedCategoyListItem);

      if (reset) {
        if (data) setCompanies(data);
        setPage(1);
      } else {
        setCompanies((prevCompanies) => [...prevCompanies, ...(data || [])]);
        setPage((prevPage) => prevPage + 1);
      }

      setHasMore((data?.length || 0) === pageSize); // Si no hay más datos, detenemos la carga
      setLoadingMore(false);



    } else {
      const data = await fetchCompaniesByDepartments("name", userDepartments, from, to);

      if (reset) {
        if (data) setCompanies(data);
        setPage(1);
      } else {
        setCompanies((prevCompanies) => [...prevCompanies, ...(data || [])]);
        setPage((prevPage) => prevPage + 1);
      }

      setHasMore((data?.length || 0) === pageSize); // Si no hay más datos, detenemos la carga
      setLoadingMore(false);


    }
  };

  const loadMore = () => {
    //console.log("....hasMore", hasMore);
    if (hasMore) {
      loadCompanies(false, selectedCategoyListItem);
    }
  };

  const loadLinks = async () => {
    const data = await LinkFunctions.getAll();
    if (data) setLinks(data);
  };

  const handleSave = async () => {
    if (!name || !categories) {
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
        console.log("isGlobal", isGlobal);
        const newCompany = {
          //key,
          name,
          //package: packageType,
          is_global: isGlobal,
          logo: uploadedUrl || "",
          categories: categories.split(",").map((c) => c.trim()),
          priority: parseInt(priority),
        };
        const updatedCategory = await updateCompany(editingId, newCompany);

        if (updatedCategory) {
          clearFields();
          setModalVisible(false);
          loadCompanies(true, selectedCategoyListItem);
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
          console.log(" Imagen subida con éxito:", uploadedUrl);
        } else {
          return;
        }

        console.log("isGlobal", isGlobal);
        const newCompany = {
          //key,
          name,
          //package: packageType,
          logo: uploadedUrl,
          categories: categories.split(",").map((c) => c.trim()),
          priority: parseInt(priority),
          is_global: isGlobal,
        };

        await createCompany(newCompany);
        Alert.alert("Aviso", "Registro creado con éxito");

        // Limpiar los campos después de un registro exitoso
        clearFields();

        setModalVisible(false);
        loadCompanies(true, selectedCategoyListItem);
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
    setLoading(true);
    try {
      if (editingLinkId) {
        const companyObj = {
          url: url,
          link: { id: selectedLinkId },
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
          link: { id: selectedLinkId },
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
    } finally {
      setLoading(false);
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


  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteCompany(id);
      loadCompanies(true, selectedCategoyListItem);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setDeletingId(null);
      setConfirmModalVisible(false);
    }
  };

  const confirmDelete = (companyId: number, companyName: string) => {
    setDeletingId(companyId);
    setDeletingName(companyName);
    setConfirmModalVisible(true);
  };

  const handleDeleteLink = async (companyLinkId: number) => {
    try {
      deleteCompanyLink(companyLinkId);
      const companyLinks = await fetchCompanyLinks(companyId);
      setCompanyLinks(companyLinks);
      setLink(undefined);
      setUrl("");
      setEditingLinkId(null);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setDeletingId(null);
      setConfirmModalLinkVisible(false);
    }
  };

  const confirmDeleteLink = (companyLink: CompanyLink) => {
    setDeletingId(companyLink.id || 0);
    setDeletingName(companyLink.link?.name || "");
    setConfirmModalLinkVisible(true);
  };

  const handleChangeCategoryFilter = (categoryName: string) => {
    setSelectedCategoyListItem(categoryName);
    loadCompanies(true, categoryName); // Pass categoryName directly instead of using state
  };

  const handleSelectedLink = (linkId: number) => {
    const link = links.find((link) => link.id === linkId);
    setUrl(link?.prefix || "");
  };

  return (
    <View style={styles.container}>
      <Text style={globalStyles.pageTitle}>Administración de S.E.</Text>
      
      <TouchableOpacity
        style={globalStyles.globalButton}
        onPress={handleAddCompany}
        disabled={loading}
      >
        <Text style={globalStyles.globalButtonText}>
          Agregar registro
        </Text>
        <FontAwesome style={globalStyles.globalButtonIcon} name="plus" size={24} color="white" />
      </TouchableOpacity>

      <Select
        label="Filtrar por Categoría"
        selectedValue={ selectedCategoyListItem }
        onValueChange={(itemValue) => handleChangeCategoryFilter(itemValue)}
        items={categoryList.map((category) => ({ id: category.name || "", name: category.name || "" }))}
      />

      

      <FlatList
        style={{ height: "80%" }}
        data={companies}
        keyExtractor={(item, index) => (index).toString()}
        renderItem={({ item }) => (
          <CompanyItem
            item={item}
            onEdit={handleEdit}
            onLinks={handleLinks}
            confirmDelete={() => confirmDelete(item.id || 0, item.name)}
            deletingId={deletingId}
          />
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
        windowSize={3}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.socialModaltitle}>
              {editingId ? "Actualizar" : "Guardar"} S.E.
            </Text>
            {/* <Text style={styles.label}>Identificador</Text>
            <TextInput style={styles.input} value={key} onChangeText={setKey} /> */}

            <Text style={globalStyles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
            />

            <PriorityInput priority={priority} setPriority={setPriority} />

            {/* <Text style={styles.label}>Código de Aplicación</Text>
            <TextInput
              style={styles.input}
              value={packageType}
              onChangeText={setPackageType}
            /> */}



            <Text style={globalStyles.label}>Categorías (separados por coma)</Text>
            <TextInput
              style={styles.input}
              value={categories}
              onChangeText={setCategories}
            />

            <View style={{ marginTop: 15 }}>
              <Text style={globalStyles.label}>¿Es global?</Text>
              <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "center", marginTop: 5 }}
                onPress={() => setIsGlobal(!isGlobal)}
              >
                <Checkbox
                  status={isGlobal ? 'checked' : 'unchecked'}
                  onPress={() => setIsGlobal(!isGlobal)}
                  color="#fb8436"
                  uncheckedColor="#aaa"
                />
                <Text style={{ fontSize: 16, color: "#333", marginLeft: 10 }}>
                  {isGlobal ? "Sí" : "No"}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.imagePicker}
              onPress={handlePickImage}
            >
              <Text style={styles.imagePickerText}>Seleccione el logotipo</Text>
            </TouchableOpacity>


            {logoUri && (
              <Image source={{ uri: logoUri }} style={styles.logoPreview} />
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
                <Select
                  label="Tipo de Contacto"
                  selectedValue={link ? (link.id)?.toString() || "" : ""}
                  onValueChange={(itemValue) => handleSelectedLink(Number(itemValue))}
                  items={links.map((link) => ({ id: link.id?.toString() || "", name: link.name || "" }))}
                />
                <TextInput
                  placeholder="Enlace"
                  style={styles.input}
                  value={url}
                  onChangeText={setUrl}
                />


                <View style={[styles.modalButtonContainer]}>
                  <TouchableOpacity
                    style={styles.modalUpdateButton}
                    onPress={handleSaveCompanyLink}
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
                    onPress={() => setModalLinkVisible(false)}
                    disabled={loading}
                  >
                    <Text style={styles.modalButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </>
              <FlatList
                data={companyLinks}
                keyExtractor={(item) => (item.id || 0).toString()}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <View style={styles.row}>
                    <View style={{ flexDirection: "column" }}>
                      <Text style={styles.cell}>Tipo: {item.link?.name}</Text>
                      <Text style={[styles.cell, { maxWidth: 200 }]}>
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
                        onPress={() => confirmDeleteLink(item)}
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
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <ConfirmationModal
        visible={confirmModalVisible}
        alias={deletingName || "el registro"}
        onConfirm={() => { handleDelete(deletingId || 0); }}
        onCancel={() => { setDeletingId(null); setConfirmModalVisible(false) }}
      />

      {/* Mensaje de confirmacipon para eliminar enlaces de contacto */}
      <ConfirmationModal
        visible={confirmModalLinkVisible}
        alias={deletingName || "el registro"}
        onConfirm={() => { handleDeleteLink(deletingId || 0); }}
        onCancel={() => { setDeletingId(null); setConfirmModalLinkVisible(false) }}
      />
    </View>
  );
};

export default CompanyScreen;
