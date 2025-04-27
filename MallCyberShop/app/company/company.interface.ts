import {Link} from "../link/model";

export interface Company {
  id?: number;
  key: string;
  name: string;
  package: string;
  logo: string;
  categories: string[];
  priority: number;
  is_global: boolean;
  departments: string[] | [];
  countries?: string[];
}

export interface CompanyLink {
  id?: number;
  url: string;
  link?: Link;
  companyId: number;
}

export interface CompanyCounter {
  imei: string;
  company_id: number;
}
