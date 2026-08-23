export abstract class BaseRepository<T, CreateDto, UpdateDto> {
  abstract findMany(params: any): Promise<T[]>;
  abstract findOne(id: string): Promise<T | null>;
  abstract create(data: CreateDto): Promise<T>;
  abstract update(id: string, data: UpdateDto): Promise<T>;
  abstract delete(id: string): Promise<T>;
  abstract softDelete(id: string): Promise<T>;
}
