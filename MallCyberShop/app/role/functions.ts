import {supabase} from "../supabase";
import {Role} from "./model";

export default class RoleFunctions {
  static getAll = async (): Promise<Role[] | null> => {
    const {data, error} = await supabase.from("role").select("*");
    if (error) throw new Error(error.message);
    return data as Role[];
  };

  static getByUser = async (userId: string): Promise<Role[] | null> => {
    const {data, error} = await supabase
      .from("user_role")
      .select("role(id,name)")
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return data.map((item: any) => ({
      id: item.role.id,
      name: item.role.name,
    })) as Role[];
  };

  static save = async (role: Role): Promise<Role | null> => {
    const {data, error} = await supabase.from("role").insert([role]).select();
    if (error) throw new Error(error.message);
    return data ? (data[0] as Role) : null;
  };

  static update = async (
    roleId: number,
    partialRole: Partial<Role>
  ): Promise<Role | null> => {
    const {data, error} = await supabase
      .from("role")
      .update(partialRole)
      .eq("id", roleId)
      .select();
    if (error) throw new Error(error.message);
    return data ? data[0] : null;
  };

  static remove = async (roleId: number) => {
    const {data, error} = await supabase.from("role").delete().eq("id", roleId);
    if (error) throw new Error(error.message);
    return data;
  };
}
