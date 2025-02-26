import {Role} from "../role/model";

export type User = {
  id?: string;
  email: string;
  email_confirmed_at?: string;
  last_sign_in_at?: string;
  phone?: string;
  roles?: Role[];
  password?: string;
};

// aud: string;
// confirmation_sent_at: string;
// confirmed_at: string;
// created_at: string;
//   user_metadata: {
//     email: string;
//     email_verified: boolean;
//     phone_verified: boolean;
//     sub: string;
//   };
// role: string;
// updated_at: string;
// is_anonymous: boolean;
