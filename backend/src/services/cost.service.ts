import { Injectable } from '@nestjs/common';
@Injectable()
export class CostService {
  private rows = [{ id: 1, vehicleId: 1, month: '2026-06', fuelTotal: 1776, maintenanceTotal: 2100, tollTotal: 420, laborTotal: 2500, fixedCost: 7800, totalCost: 14596, totalRevenue: 22600, profit: 8004 }];
  findAll() { return this.rows; }
  findOne(id: number) { return this.rows.find((item: any) => item.id === id); }
  create(payload: any) { const row = { ...payload, id: this.rows.length + 1 }; this.rows.push(row); return row; }
}
