import {supabase} from "../supabase";
import {Link} from "./model";
import * as ImagePicker from "expo-image-picker";
import {manipulateAsync, SaveFormat} from "expo-image-manipulator";

export default class LinkFunctions {
  static getAll = async (): Promise<Link[] | null> => {
    const {data, error} = await supabase.from("link").select("*").order("name");
    if (error) throw new Error(error.message);
    return data as Link[];
  };

  static save = async (link: Link): Promise<Link | null> => {
    const {data, error} = await supabase.from("link").insert([link]).select();
    if (error) throw new Error(error.message);
    return data ? (data[0] as Link) : null;
  };

  static update = async (
    linkId: number,
    partialLink: Partial<Link>
  ): Promise<Link | null> => {
    const {data, error} = await supabase
      .from("link")
      .update(partialLink)
      .eq("id", linkId)
      .select();
    if (error) throw new Error(error.message);
    return data ? data[0] : null;
  };

  static remove = async (linkId: number) => {
    const {data, error} = await supabase.from("link").delete().eq("id", linkId);
    if (error) throw new Error(error.message);
    return data;
  };

  static pickImage = async (): Promise<string | null> => {
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

    if (image.width > 128) {
      try {
        const manipResult = await manipulateAsync(
          image.uri,
          [{resize: {width: 128, height: 128}}],
          {compress: 0.7, format: SaveFormat.PNG}
        );
        return manipResult.uri;
      } catch (error) {
        throw new Error("No se pudo comprimir la imagen");
      }
    }

    // 🔍 Validar tipo de imagen
    if (!["image/png"].includes(image.mimeType || "")) {
      throw new Error("Solo son permitidos PNG.");
    }
    return image.uri; // Retornar la URI para la subida
  };

  static uploadImage = async (uri: string): Promise<string> => {
    const formData = await this.uriToFormData(uri); // ✅ Convertir URI a FormData

    const fileExt = uri.split(".").pop() || "png";
    const fileName = `${Date.now()}.${fileExt}`;
    const storageName = "link-logos";
    const filePath = `${storageName}/${fileName}`; // Ruta en Supabase
    const {data, error} = await supabase.storage
      .from(storageName)
      .upload(filePath, formData, {
        contentType: `image/${fileExt}`,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw new Error("No se pudo comprimir la imagen");

    // ✅ Obtener la URL pública correctamente
    const publicUrl = supabase.storage.from(storageName).getPublicUrl(filePath)
      .data.publicUrl;
    //console.log("✅ Imagen subida con éxito:", publicUrl);
    return publicUrl;
  };

  static uriToFormData = async (uri: string): Promise<FormData> => {
    const fileExt = uri.split(".").pop() || "png"; // Extraer la extensión
    const fileName = `${Date.now()}.${fileExt}`; // Nombre único

    const formData = new FormData();
    formData.append("file", {
      uri,
      name: fileName,
      type: `image/${fileExt}`, // Tipo MIME correcto
    } as any); // `as any` evita errores de tipado en React Native

    return formData;
  };
}
