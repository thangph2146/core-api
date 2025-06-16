import { IPaginationParams, IPaginatedResponse } from './index';

export interface IRepository<T, CreateDto, UpdateDto> {
  create(data: CreateDto): Promise<T>;
  findAll(params: IPaginationParams): Promise<IPaginatedResponse<T>>;
  findById(id: number): Promise<T | null>;
  findBySlug?(slug: string): Promise<T | null>;
  update(id: number, data: UpdateDto): Promise<T>;
  delete(id: number): Promise<T>;
  softDelete?(id: number): Promise<T>;
}
