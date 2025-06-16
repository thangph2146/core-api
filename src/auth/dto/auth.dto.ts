// Auth interfaces for core-api

export interface IUser {
  id: number;
  email: string;
  name?: string;
  image?: string;
  emailVerified?: Date;
  password?: string;
  provider?: string;
  providerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  email: string;
  password?: string;
  name?: string;
  image?: string;
  provider?: string;
  providerId?: string;
  emailVerified?: Date;
}

export interface UpdateUserDto {
  email?: string;
  name?: string;
  image?: string;
  emailVerified?: Date;
}

export interface AuthCredentialsDto {
  email: string;
  password: string;
}

export interface GoogleUserDto {
  email: string;
  name?: string;
  image?: string;
  emailVerified?: Date;
  provider: string;
  providerId: string;
}
