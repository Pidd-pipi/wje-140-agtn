import { Injectable } from '@nestjs/common';
import { VehicleStatus } from '../types/enums';

export interface VehicleRow {
  id: number;
  plateNo: string;
  vehicleType: string;
  brandModel: string;
  purchaseDate: string;
  insuranceExpireDate: string;
  inspectionExpireDate: string;
  status: VehicleStatus;
  mileage: number;
  tankCapacity: number;
  dailyFixedCost: number;
}

@Injectable()
export class VehicleService {
  private rows: VehicleRow[] = [{ id: 1, plateNo: '沪A-7821', vehicleType: 'Refrigerated', brandModel: '东风天锦 KR', purchaseDate: '2023-03-12', insuranceExpireDate: '2026-09-30', inspectionExpireDate: '2026-11-20', status: VehicleStatus.Available, mileage: 88210, tankCapacity: 380, dailyFixedCost: 260 }];
  findAll() { return this.rows; }
  findOne(id: number) { return this.rows.find((item) => item.id === id); }
  create(payload: Partial<VehicleRow>) {
    const row = { ...payload, id: this.rows.length + 1 } as VehicleRow;
    this.rows.push(row);
    return row;
  }
  setStatus(id: number, status: VehicleStatus) {
    const row = this.findOne(id);
    if (row) {
      row.status = status;
    }
    return row;
  }
}
