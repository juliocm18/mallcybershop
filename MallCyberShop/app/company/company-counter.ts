import {supabase} from "../supabase";
import {CompanyCounter} from "./company.interface";

export const createCompanyCounter = async (companyCounter: CompanyCounter) => {
  const {data, error} = await supabase
    .from("company_counter")
    .insert(companyCounter)
    .select();
  if (error) throw new Error(error.message);
  return data ? data[0] : null;
};

export default {
  createCompanyCounter,
};
