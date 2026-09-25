export type Role = 'Admin' | 'FleetManager' | 'Dispatcher' | 'Driver' | 'Mechanic';
export interface AuthUser { id: number; role: Role; name: string; }
export interface ApiResult<T> { data: T; message: string; }
