export interface Company {
    id: string;
    name: string;
    code: string;
    currency: string;
    timezone: string;
    logoUrl?: string | null;
    isActive?: boolean;
  }
  
  export interface Role {
    id: string;
    name: string;
    code: string;
  }
  
  export interface AuthUser {
    id: string;
    companyId: string;
    firstName: string;
    lastName?: string | null;
    fullName: string;
    email: string;
    username: string;
    mobile?: string | null;
    avatarUrl?: string | null;
    status: string;
    isSuperAdmin: boolean;
    lastLoginAt?: string | null;
    company: Company;
    roles: Role[];
    permissions: string[];
  }
  
  export interface LoginRequest {
    companyCode: string;
    login: string;
    password: string;
  }
  
  export interface LoginResponse {
    success: boolean;
    data: {
      user: AuthUser;
      accessToken: string;
    };
  }