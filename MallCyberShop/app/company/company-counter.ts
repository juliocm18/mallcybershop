import {supabase, SUPABASE_URL} from "../supabase";

export const createCompanyCounter = async (companyCounter: CompanyCounter) => {
  const {data, error} = await supabase
    .from("company_counter")
    .insert(companyCounter)
    .select();
  if (error) throw new Error(error.message);
  return data ? data[0] : null;
};
