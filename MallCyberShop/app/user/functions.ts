import {useAuth} from "../context/AuthContext";
import RoleFunctions from "../role/functions";
import {supabase} from "../supabase";
import {User} from "./model";

export default class UserFunctions {
  static save = async (email: string, password: string): Promise<User> => {
    const OPERADOR = 1;
    const {data, error} = await supabase.auth.signUp({email, password});
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("No hay data de usuario");
    await supabase
      .from("user_role")
      .insert({user_id: data.user.id, role_id: OPERADOR});
    return {
      id: data.user.id,
      email: data.user.email || "",
    };
  };

  static getAll = async (): Promise<User[]> => {
    const {data} = await supabase.auth.getSession();
    const usersFetch = await fetch(
      "https://mtmikpoblfslzhastcyj.supabase.co/functions/v1/list-users",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${data?.session?.access_token}`, // Enviar JWT en la cabecera
          "Content-Type": "application/json",
        },
      }
    );
    const users = await usersFetch.json();
    //if (error) throw new Error(error.message);
    //if (!data) throw new Error("No hay data de usuario");
    const response1 = await Promise.all(
      users.users.map(async (user: any) => ({
        id: user.id,
        email: user.email,
        roles: await RoleFunctions.getByUser(user.id),
      }))
    );

    return response1;
  };

  static remove = async (userId: string) => {
    const {data, error} = await supabase.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);
    return data;
  };

  // Por el momento solo hay un Rol, se modifica un solo rol
  static update = async (
    userId: string,
    roleId: number
  ): Promise<User | null> => {
    console.log("userId", userId, roleId);
    const {data, error} = await supabase
      .from("user_role")
      .update({role_id: roleId})
      .eq("user_id", userId)
      .select();
    if (error) throw new Error(error.message);
    return data ? data[0] : null;
  };
}
