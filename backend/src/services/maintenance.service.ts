import { Injectable } from '@nestjs/common';
@Injectable()
export class MaintenanceService {
  private rows = [{ id: 1, vehicleId: 1, maintenanceType: 'Routine', item: '机油与制动检查', cost: 2100, vendor: '青浦维保站', date: '2026-06-06', nextMileage: 93000, nextDate: '2026-09-06', status: 'Completed' }];
  findAll() { return this.rows; }
  findOne(id: number) { return this.rows.find((item: any) => item.id === id); }
  create(payload: any) { const row = { ...payload, id: this.rows.length + 1 }; this.rows.push(row); return row; }
}
