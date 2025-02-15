import React, {useState, useEffect} from "react";
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
} from "react-native";

import {Link} from "./model";
import LinkFunctions from "./functions";
import {styles} from "./styles";

export default function Index() {
  const [links, setLinks] = useState<Link[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [editingImage, setEditingImage] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [logoUri, setLogoUri] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    const data = await LinkFunctions.getAll();
    if (data) setLinks(data);
  };

  const handleAdd = () => {
    clearFields();
    setModalVisible(true);
  };

  const clearFields = async () => {
    setEditingImage(false);
    setLogoUri(null);
    setName("");
    setEditingId(null);
  };

  const handleEdit = (link: Link) => {
    setEditingId(link.id || 0);
    setName(link.name);
    setEditingImage(false);
    setLogoUri(link.icon);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    setDeleting(id);
    try {
      await LinkFunctions.remove(id);
      await loadLinks();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setDeleting(null);
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
    if (!name) {
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
        };
        const responseUpdateLink = await LinkFunctions.update(
          editingId,
          newLink
        );

        if (responseUpdateLink) {
          clearFields();
          setModalVisible(false);
          loadLinks();
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
        };

        await LinkFunctions.save(newLink);
        Alert.alert("Aviso", "Registro creado con éxito");
        // Limpiar los campos después de un registro exitoso
        clearFields();
        setModalVisible(false);
        loadLinks();
      }
    } catch (error: any) {
      console.error("Error creating company:", error.message);
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Button
        title="Agregar Social Link"
        onPress={() => handleAdd()}
        color="#ff9f61"
      />
      <FlatList
        data={links}
        keyExtractor={(item) =>
          item.id ? item.id.toString() : Math.random().toString()
        }
        renderItem={({item}) => (
          <View style={styles.row}>
            <View style={{flexDirection: "column"}}>
              <Text style={styles.cell}>{item.name}</Text>
              <Image source={{uri: item.icon}} style={styles.logoPreview} />
            </View>

            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleEdit(item)}
              >
                <Text style={styles.editButtonText}>Editar</Text>
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
              {editingId ? "Actualizar" : "Guardar"} Social Link
            </Text>

            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
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
    </View>
  );
}
