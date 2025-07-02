// Auth interfaces for core-api

export interface IUserProfile {
  id: number;
  userId: number;
  bio?: string;
  avatarUrl?: string;
  socialLinks?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUser {
  id: number;
  email: string;
  name?: string;
  image?: string;
  avatarUrl?: string;
  provider?: string;
  providerId?: string;
  roleId?: number;
  createdAt: Date;
  updatedAt: Date;
  profile?: IUserProfile;
  role?: {
    id: number;
    name: string;
    description?: string;
    permissions?: string[];
  };
}

export interface CreateUserDto {
  email: string;
  password?: string;
  name?: string;
  image?: string;
  avatarUrl?: string;
  provider?: string;
  providerId?: string;
  bio?: string;
  socialLinks?: any;
}

export interface UpdateUserDto {
  email?: string;
  name?: string;
  image?: string;
  avatarUrl?: string;
  bio?: string;
  socialLinks?: any;
}

export interface AuthCredentialsDto {
  email: string;
  password: string;
}

export interface GoogleUserDto {
  email: string;
  name?: string;
  image?: string;
  provider: string;
  providerId: string;
}
