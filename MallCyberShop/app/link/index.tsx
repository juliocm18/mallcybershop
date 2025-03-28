import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";

import { Link } from "./model";
import LinkFunctions from "./functions";
import { styles } from "./styles";
import { FontAwesome } from "@expo/vector-icons";
import { globalStyles } from "../styles";
import ConfirmationModal from "../components/confirmation-modal";

export default function Index() {
  const [links, setLinks] = useState<Link[]>([]);
  const [prefix, setPrefix] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [editingImage, setEditingImage] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [logoUri, setLogoUri] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [deletingName, setDeletingName] = useState<string>();

  /* Pagination */
  const [page, setPage] = useState(0);
  const pageSize = 10; // Cantidad de registros por página
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  /* pagination end */

  useEffect(() => {
    loadLinks(true);
  }, []);

  const loadLinks = async (reset = false) => {
    if (loadingMore) return;
    setLoadingMore(true);
    const from = reset ? 0 : page * pageSize;
    const to = from + pageSize - 1;

    const data = await LinkFunctions.getAllPaged(from, to);

    if (reset) {
      if (data) setLinks(data);
      setPage(1);
    } else {
      setLinks((prevLinks) => [...prevLinks, ...(data || [])]);
      setPage((prevPage) => prevPage + 1);
    }

    setHasMore((data?.length || 0) === pageSize); // Si no hay más datos, detenemos la carga
    setLoadingMore(false);

  };

  const loadMore = () => {
    if (hasMore) {
      loadLinks();
    }
  };

  const handleAdd = () => {
    clearFields();
    setModalVisible(true);
  };

  const clearFields = async () => {
    setEditingImage(false);
    setLogoUri(null);
    setName("");
    setPrefix("");
    setEditingId(null);
  };

  const handleEdit = (link: Link) => {
    setEditingId(link.id || 0);
    setName(link.name || "");
    setPrefix(link.prefix || "");
    setEditingImage(false);
    setLogoUri(link.icon || "");
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await LinkFunctions.remove(id);
      await loadLinks(true);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setDeletingId(null);
      setConfirmModalVisible(false)
    }
  };

  const handlePickImage = async () => {
    if (editingId) {
      setEditingImage(true);
    }
    const uri = await LinkFunctions.pickImage();
    if (uri) {
      setLogoUri(uri);
    }
  };

  const handleSave = async () => {
    if (!name || !prefix) {
      Alert.alert("Error", "Campos requeridos");
      return;
    }
    setLoading(true);

    try {
      if (editingId) {
        let uploadedUrl: string | null = "";
        if (editingImage && logoUri) {
          uploadedUrl = await LinkFunctions.uploadImage(logoUri);
        } else {
          uploadedUrl = logoUri;
        }
        const newLink: Link = {
          name,
          icon: uploadedUrl || "",
          prefix
        };
        const responseUpdateLink = await LinkFunctions.update(
          editingId,
          newLink
        );

        if (responseUpdateLink) {
          clearFields();
          setModalVisible(false);
          loadLinks(true);
          Alert.alert("Aviso", "Registro actualizado");
        }
      } else {
        if (!logoUri) {
          Alert.alert("Error", "Seleccione un logo");
          return;
        }
        const uploadedUrl = await LinkFunctions.uploadImage(logoUri);
        if (uploadedUrl) {
          console.log("📤 Imagen subida con éxito:", uploadedUrl);
        } else {
          return;
        }

        const newLink: Link = {
          name,
          icon: uploadedUrl || "",
          prefix
        };

        await LinkFunctions.save(newLink);
        Alert.alert("Aviso", "Registro creado con éxito");
        // Limpiar los campos después de un registro exitoso
        clearFields();
        setModalVisible(false);
        loadLinks(true);
      }
    } catch (error: any) {
      console.error("Error creating company:", error.message);
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (link: Link) => {
    setDeletingId(link.id || 0);
    setDeletingName(link.name);
    setConfirmModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <Text style={globalStyles.pageTitle}>Administración de Contactos</Text>
      <TouchableOpacity
        style={globalStyles.globalButton}
        onPress={handleAdd}
        disabled={loading}
      >
        <Text style={globalStyles.globalButtonText}>
          Agregar registro
        </Text>
        <FontAwesome style={globalStyles.globalButtonIcon} name="plus" size={24} color="white" />
      </TouchableOpacity>


      <FlatList
        style={{ height: "90%" }}
        data={links}
        keyExtractor={(item) => Math.random().toString()}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flexDirection: "column" }}>
              <Text style={styles.cell}>{item.name}</Text>
              <Image source={{ uri: item.icon }} style={styles.logoPreview} />
            </View>

            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleEdit(item)}
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
              {editingId ? "Actualizar" : "Guardar"} Contacto
            </Text>

            <TextInput
              placeholder="Nombre"
              style={styles.input}
              value={name}
              onChangeText={setName}
            />

            <TextInput
              placeholder="Prefijo"
              style={styles.input}
              value={prefix}
              onChangeText={setPrefix}
            />

            <TouchableOpacity
              style={styles.imagePicker}
              onPress={handlePickImage}
            >
              <Text style={styles.imagePickerText}>Seleccione el logotipo</Text>
            </TouchableOpacity>

            {logoUri && (
              <Image
                source={{
                  uri: logoUri,
                }}
                style={styles.logoPreview} // Ajusta el tamaño según necesites
                resizeMode="contain" // Opcional, ajusta la forma en que se muestra la imagen
              />
            )}
            <View style={[styles.modalButtonContainer, { paddingTop: 10 }]}>
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

      <ConfirmationModal
        visible={confirmModalVisible}
        alias={deletingName || "el registro"}
        onConfirm={() => { handleDelete(deletingId || 0); }}
        onCancel={() => { setDeletingId(null); setConfirmModalVisible(false) }}
      />
    </View>
  );
}
