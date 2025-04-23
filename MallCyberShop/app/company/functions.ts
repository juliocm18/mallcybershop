import {Alert} from "react-native";
import {supabase, SUPABASE_URL} from "../supabase";
import * as ImagePicker from "expo-image-picker";
import {manipulateAsync, SaveFormat} from "expo-image-manipulator";
import {Company, CompanyLink} from "./company.interface";

export const pickImage = async (): Promise<string | null> => {
  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,
    aspect: [10, 10], // Ajustado para mantener la proporción 10:1
    quality: 1,
    selectionLimit: 1, // Solo permite una imagen
    mediaTypes: ["images"], // Solo imágenes
  });

  if (result.canceled || result.assets.length === 0) {
    return null;
  }

  const image = result.assets[0];

  // console.log("🖼️ Imagen seleccionada:", image.width, image.height);
  // Validar dimensiones de la imagen
  if (image.width >= 1000) {
    try {
      const manipResult = await manipulateAsync(
        image.uri,
        [{resize: {width: 1000, height: 1000}}],
        {compress: 0.7, format: SaveFormat.JPEG}
      );
      // console.log(
      //   "🖼️ Imagen comprimida:",
      //   manipResult.width,
      //   manipResult.height
      // );
      return manipResult.uri;
    } catch (error) {
      console.error("Error comprimiendo imagen:", error);
      Alert.alert("Error", "No se pudo comprimir la imagen");
      return null;
    }
  }

  // 🔍 Validar tipo de imagen
  if (!["image/jpeg", "image/png"].includes(image.mimeType || "")) {
    Alert.alert("Error", "Solo son permitidos JPG, JPEG, y PNG.");
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
    //console.log("✅ Imagen subida con éxito:", publicUrl);
    return publicUrl;
  } catch (error) {
    console.error("❌ Error al subir la imagen:", error);
    return null;
  }
};

// 🆕 Crear una empresa
export const createCompany = async (company: Partial<Company>) => {
  const {data, error} = await supabase.from("company").insert([company]);
  if (error) throw new Error(error.message);
  return data;
};

// 📖 Obtener empresas
export const fetchCompanies = async (order: string) => {
  const {data, error} = await supabase
    .from("company")
    .select("*")
    .order(order, {ascending: true});
  if (error) throw new Error(error.message);
  return data;
};

export const getAllPaged = async (from: number, to: number, order: string) => {
  const {data, error} = await supabase
    .from("company")
    .select("*")
    .range(from, to)
    .order(order, {ascending: true});
  if (error) throw new Error(error.message);
  return data;
};

export const getAllPagedByCategory = async (from: number, to: number, order: string, categoryName: string) => {
  const {data, error} = await supabase
    .from("company")
    .select("*")
    .range(from, to)
    .overlaps("categories", [categoryName])
    .order(order, {ascending: true});
  if (error) { 
    console.log(error);
    throw new Error(error.message)};
  return data;
};

export const fetchCompaniesByDepartments = async (
  order: string,
  departments: string[],
  from: number,
  to: number
): Promise<Company[]> => {
  const {data, error} = await supabase
    .from("company")
    .select("*")
    .filter("departments", "overlaps", departments)
    .range(from, to)
    .order(order, {ascending: true});
  if (error) throw new Error(error.message);
  return data;
};


export const fetchCompaniesByDepartmentsOrNull = async (
  order: string,
  departments: string[],
  from: number,
  to: number
): Promise<Company[]> => {
  const {data: matchData, error: matchError} = await supabase
    .from("company")
    .select("*")
    .range(from, to)
    .order(order, {ascending: true});
    //.overlaps("departments", departments).order("name", {ascending: true});

  const data = [...(matchData || [])];
  if (matchError)
    throw new Error(matchError?.message);
  return data;
};

// ✏️ Actualizar empresa
export const updateCompany = async (
  companyId: number,
  updatedCompany: Partial<Company>
) => {
  const {data, error} = await supabase
    .from("company")
    .update(updatedCompany)
    .eq("id", companyId)
    .select();
  if (error) throw new Error(error.message);
  return data ? data[0] : null;
};

// ❌ Eliminar empresa
export const deleteCompany = async (companyId: number) => {
  const {data, error} = await supabase
    .from("company")
    .delete()
    .eq("id", companyId);
  if (error) throw new Error(error.message);
  return data;
};

export const fetchCompanyLinks = async (
  companyId: number
): Promise<CompanyLink[]> => {
  const {data, error} = await supabase
    .from("company_link")
    .select("id,companyId,url,link:link!inner(id, name, icon)")
    .eq("companyId", companyId);
  if (error) throw new Error(error.message);
  const response = data.map((item) => ({
    id: item.id,
    companyId: item.companyId,
    url: item.url,
    link: item.link as any,
  })) as CompanyLink[];
  return response;
};

export const deleteCompanyLink = async (companyLinkId: number) => {
  const {data, error} = await supabase
    .from("company_link")
    .delete()
    .eq("id", companyLinkId);
  if (error) throw new Error(error.message);
  return data;
};

export const updateCompanyLink = async (
  companyLinkId: number,
  updatedCompanyLink: Partial<CompanyLink>
) => {
  const {data, error} = await supabase
    .from("company_link")
    .update({
      url: updatedCompanyLink.url,
      linkId: updatedCompanyLink.link?.id,
    })
    .eq("id", companyLinkId)
    .select();
  if (error) throw new Error(error.message);
  return data ? data[0] : null;
};

export const createCompanyLink = async (companyLink: CompanyLink) => {
  const {data, error} = await supabase
    .from("company_link")
    .insert({
      url: companyLink.url,
      companyId: companyLink.companyId,
      linkId: companyLink.link?.id,
    })
    .select();
  if (error) throw new Error(error.message);
  return data ? data[0] : null;
};
