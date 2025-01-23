import {supabase} from "../supabase";
import {Category} from "../functions/types";

export const getCategories = async (): Promise<Category[] | null> => {
  try {
    const {data, error} = await supabase.from("category").select("*");

    if (error) throw error;

    return data;
  } catch (error: any) {
    console.error("Error fetching categories:", error.message);
    return null;
  }
};

export const createCategory = async (
  name: string
): Promise<Category | null> => {
  try {
    //const {data, error} = await supabase.from("category").insert([{name}]);
    const {data, error} = await supabase
      .from("category")
      .upsert({name})
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
  name: string
): Promise<Category | null> => {
  try {
    const {data, error} = await supabase
      .from("category")
      .update({name})
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
