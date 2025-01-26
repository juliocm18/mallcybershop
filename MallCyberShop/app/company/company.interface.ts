interface Company {
  id?: number;
  key: string;
  name: string;
  package: string;
  logo: string;
  categories: string[];
}

interface CompanyLink {
  id?: number;
  link: string;
  identificador: string;
  companyId: number;
}

interface CompanyCounter {
  imei: string;
  company_id: number;
}
