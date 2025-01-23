import React, {useState} from "react";
import {
  View,
  Button,
  Image,
  Text,
  TextInput,
  Alert,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import {createCompany, pickImage, uploadImage} from "./company/company";

const CreateCompanyScreen = () => {
  const [key, setKey] = useState("test");
  const [name, setName] = useState("test");
  const [packageType, setPackageType] = useState("test");
  const [url, setUrl] = useState("test");
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [categories, setCategories] = useState("Moda, Tecnología, Hogar");

  const handlePickImage = async () => {
    const uri = await pickImage(); // 📥 Llamamos a la función externa
    if (uri) {
      setLogoUri(uri); // ✅ Guardamos la imagen en useState
    }
  };

  // ✅ Validaciones antes de enviar el formulario
  const handleSubmit = async () => {
    if (!key || !name || !packageType || !url || !categories) {
      Alert.alert("Error", "All fields are required");
      return;
    }
    if (!logoUri) {
      Alert.alert("Error", "Please select a logo");
      return;
    }

    try {
      const uploadedUrl = await uploadImage(logoUri);
      console.log("uploadedUrl", uploadedUrl);
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
        logo: uploadedUrl || "",
        categories: categories.split(",").map((c) => c.trim()),
      };

      await createCompany(newCompany);
      Alert.alert("Success", "Company created successfully");

      // Limpiar los campos después de un registro exitoso
      setKey("");
      setName("");
      setPackageType("");
      setUrl("");
      setLogoUri(null);
      setCategories("");
    } catch (error: any) {
      console.error("Error creating company:", error.message);
      Alert.alert("Error", error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Company Key</Text>
      <TextInput style={styles.input} value={key} onChangeText={setKey} />

      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>Package</Text>
      <TextInput
        style={styles.input}
        value={packageType}
        onChangeText={setPackageType}
      />

      <Text style={styles.label}>Website URL</Text>
      <TextInput style={styles.input} value={url} onChangeText={setUrl} />

      <Text style={styles.label}>Categories (comma separated)</Text>
      <TextInput
        style={styles.input}
        value={categories}
        onChangeText={setCategories}
      />

      <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
        <Text style={styles.imagePickerText}>Seleccione el logotipo</Text>
      </TouchableOpacity>

      {logoUri && <Image source={{uri: logoUri}} style={styles.logoPreview} />}

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Crear Socio Estratégico</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {padding: 20},
  label: {fontSize: 16, fontWeight: "bold", marginBottom: 5},
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  imagePicker: {
    backgroundColor: "#ddd",
    padding: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  imagePickerText: {color: "#555"},
  logoPreview: {width: 100, height: 100, marginBottom: 15},
  button: {
    backgroundColor: "#ff9f61",
    padding: 15,
    alignItems: "center",
    borderRadius: 5,
  },
  buttonText: {color: "white", fontWeight: "bold"},
});

export default CreateCompanyScreen;
