import {Link} from "../link/model";

export interface Company {
  id?: number;
  key: string;
  name: string;
  package: string;
  logo: string;
  categories: string[];
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
