export type Role = 'Admin' | 'FleetManager' | 'Dispatcher' | 'Driver' | 'Mechanic';
export interface AuthUser { id: number; role: Role; name: string; }
export interface ApiResult<T> { data: T; message: string; }

export interface AssignDispatchPayload {
  vehicleId?: number;
  driverId?: number;
}

export interface StartTripPayload {
  actualDepartAt?: string;
}

export interface CompleteTripPayload {
  actualArriveAt?: string;
  actualFuelCost?: number;
  actualTollCost?: number;
  actualLaborCost?: number;
}

export interface CompletedTripCost {
  orderId: number;
  vehicleId: number;
  month: string;
  freight: number;
  fuelCost: number;
  tollCost: number;
  laborCost: number;
}
