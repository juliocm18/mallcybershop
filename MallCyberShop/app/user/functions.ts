import {useAuth} from "../context/AuthContext";
import RoleFunctions from "../role/functions";
import {Role} from "../role/model";
import {supabase} from "../supabase";
import {clientProfile, User} from "./model";

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
    //console.log(data?.session?.access_token);
    // token example: "eyJhbGciOiJIUzI1NiIsImtpZCI6IllBZi8rQzVYUEcvYVdyb04iLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL210bWlrcG9ibGZzbHpoYXN0Y3lqLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJiYjM1M2UwOS0zMGIyLTQ2ZDYtOWNmNy0yYzg4YTJlNTU0MzQiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzQxMjI2MjcyLCJpYXQiOjE3NDEyMjI2NzIsImVtYWlsIjoianVsaW9jZXNhcm0xOTkwQGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJqdWxpb2Nlc2FybTE5OTBAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwic3ViIjoiYmIzNTNlMDktMzBiMi00NmQ2LTljZjctMmM4OGEyZTU1NDM0In0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NDEyMjI2NzJ9XSwic2Vzc2lvbl9pZCI6ImJhNTI4ODRhLTU3ZjEtNDFkYS1hMjliLWM1ZDA3OGIxYzRlZiIsImlzX2Fub255bW91cyI6ZmFsc2V9.UXleh3BlslUmPmpah-H5R3wE1gUMwO6ci5b4GkiHNkU";
    const userToken = data?.session?.access_token;

    const usersFetch = await fetch(
      "https://mtmikpoblfslzhastcyj.supabase.co/functions/v1/list-users",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${userToken}`, // Enviar JWT en la cabecera
          "Content-Type": "application/json",
        },
      }
    );
    const users = await usersFetch.json();
    const response1 = await Promise.all(
      users.users.map(async (user: any) => {
        const [roles, departments] = await Promise.all([
          RoleFunctions.getByUser(user.id),
          UserFunctions.getDepartmentsByUser(user.id),
        ]);

        return {
          id: user.id,
          email: user.email,
          roles,
          departments,
        };
      })
    );
    return response1;
  };

  static remove = async (userId: string) => {
    const {data, error} = await supabase.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);
    return data;
  };

  // Por el momento solo hay un Rol, se modifica un solo rol
  static updateRole = async (
    userId: string,
    roleId: number,
    userRoles: Role[]
  ): Promise<User | null> => {
    if (!userRoles || (userRoles[0].id || 0) < roleId) {
      throw new Error("No tienes permisos para realizar esta acción");
    }
    const {data, error} = await supabase
      .from("user_role")
      .update({role_id: roleId})
      .eq("user_id", userId)
      .select();
    if (error) throw new Error(error.message);
    return data ? data[0] : null;
  };

  static getDepartmentsByUser = async (
    userId: string
  ): Promise<string[] | []> => {
    const {data, error} = await supabase
      .from("profile")
      .select("departments")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data?.departments ? data.departments : [];
  };

  static updateDepartments = async (
    userId: string,
    departments: string[]
  ): Promise<boolean> => {
    const {error} = await supabase.from("profile").upsert(
      {
        user_id: userId,
        departments: departments,
      },
      {onConflict: "user_id"}
    );

    if (error) throw new Error(error.message);
    return true;
  };

  static saveClient = async (email: string, password: string): Promise<User> => {
    const CLIENTE = 4;
    const {data, error} = await supabase.auth.signUp({email, password});
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("No hay data de usuario");
    await supabase
      .from("user_role")
      .insert({user_id: data.user.id, role_id: CLIENTE});
    return {
      id: data.user.id,
      email: data.user.email || "",
    };
  };


  static saveClientProfile = async (clientProfile: clientProfile): Promise<boolean> => {
    const {error} = await supabase.from("profiles").insert(clientProfile);
    if (error) throw new Error(error.message);
    return true;
  };


}


