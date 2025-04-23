import {supabase} from "../supabase";
import {Category} from "./types";

export const getCategories = async (): Promise<Category[] | null> => {
  try {
    const {data, error} = await supabase.from("category").select("*").order("priority", {ascending: true});
    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error("Error fetching categories:", error.message);
    return null;
  }
};


export const getFormattedRoutes = async (
  categoryNames: string[]
): Promise<categoryHashMap[]> => {
  const formattedRoutes = categoryNames.map((obj, i) => ({
    key: `tab${i}`,
    title: `${obj}`,
  }));
  return formattedRoutes;
};

export const getCategoryNames = async (): Promise<string[]> => {
  const {data, error} = await supabase.from("category").select("name").order("priority", {ascending: true});
  if (error) throw new Error(error.message);
  return data.map((category) => category.name);
};

export const createCategory = async (
  name: string,
  priority: number
): Promise<Category | null> => {
  try {
    //const {data, error} = await supabase.from("category").insert([{name}]);
    const {data, error} = await supabase
      .from("category")
      .upsert({name, priority})
      .select();

    if (error) throw error;
    return data ? data[0] : null;
  } catch (error: any) {
    console.error("Error creating category:", error.message);
    return null;
  }
};

export const updateCategory = async (
  id: number,
  name: string,
  priority: number
): Promise<Category | null> => {
  try {
    const {data, error} = await supabase
      .from("category")
      .update({name, priority})
      .match({id})
      .select();

    if (error) throw error;
    return data ? data[0] : null;
  } catch (error: any) {
    console.error("Error updating category:", error.message);
    return null;
  }
};

export const deleteCategory = async (id: number): Promise<boolean> => {
  try {
    const {error} = await supabase.from("category").delete().match({id});

    if (error) throw error;

    return true;
  } catch (error: any) {
    console.error("Error deleting category:", error.message);
    return false;
  }
};

export default {
  getCategories,
  getCategoryNames,
  createCategory,
  updateCategory,
  deleteCategory,
};
