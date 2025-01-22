import {Alert} from "react-native";
import {supabase, SUPABASE_URL} from "../supabase";
import * as ImagePicker from "expo-image-picker";

export interface Company {
  key: string;
  name: string;
  package: string;
  url: string;
  logo: string;
  categories: string[];
}
export const pickImage = async (): Promise<string | null> => {
  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,
    aspect: [8, 8], // Mantener proporción
    quality: 1,
    selectionLimit: 1, // Solo permite una imagen
    mediaTypes: ImagePicker.MediaTypeOptions.Images, // Solo imágenes
  });

  if (result.canceled || result.assets.length === 0) {
    return null;
  }

  const image = result.assets[0];

  // 🔍 Validar tipo de imagen
  if (!["image/jpeg", "image/png"].includes(image.mimeType || "")) {
    Alert.alert("Error", "Only JPG, JPEG, and PNG images are allowed");
    return null;
  }

  console.log("🖼️ Imagen seleccionada:", image.uri);
  return image.uri; // Retornar la URI para la subida
};

const uriToFormData = async (uri: string): Promise<FormData> => {
  const fileExt = uri.split(".").pop() || "jpg"; // Extraer la extensión
  const fileName = `${Date.now()}.${fileExt}`; // Nombre único

  const formData = new FormData();
  formData.append("file", {
    uri,
    name: fileName,
    type: `image/${fileExt}`, // Tipo MIME correcto
  } as any); // `as any` evita errores de tipado en React Native

  return formData;
};

export const uploadImage = async (uri: string): Promise<string | null> => {
  try {
    const formData = await uriToFormData(uri); // ✅ Convertir URI a FormData

    const fileExt = uri.split(".").pop() || "jpg";
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `company-logos/${fileName}`; // Ruta en Supabase
    console.log("📤 Subiendo imagen a:", filePath);
    const {data, error} = await supabase.storage
      .from("company-logos")
      .upload(filePath, formData, {
        contentType: `image/${fileExt}`,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    // ✅ Obtener la URL pública correctamente
    const publicUrl = supabase.storage
      .from("company-logos")
      .getPublicUrl(filePath).data.publicUrl;
    console.log("✅ Imagen subida con éxito:", publicUrl);
    return publicUrl;
  } catch (error) {
    console.error("❌ Error al subir la imagen:", error);
    return null;
  }
};

// 🆕 Crear una empresa
export const createCompany = async (company: Company) => {
  const {data, error} = await supabase.from("company").insert([company]);
  if (error) throw new Error(error.message);
  return data;
};

// 📖 Obtener empresas
export const fetchCompanies = async () => {
  const {data, error} = await supabase.from("company").select("*");
  if (error) throw new Error(error.message);
  return data;
};

// ✏️ Actualizar empresa
export const updateCompany = async (
  companyId: string,
  updatedCompany: Partial<Company>
) => {
  const {data, error} = await supabase
    .from("company")
    .update(updatedCompany)
    .eq("id", companyId);
  if (error) throw new Error(error.message);
  return data;
};

// ❌ Eliminar empresa
export const deleteCompany = async (companyId: string) => {
  const {data, error} = await supabase
    .from("company")
    .delete()
    .eq("id", companyId);
  if (error) throw new Error(error.message);
  return data;
};
