import { Injectable } from '@nestjs/common';
import { calculateTotalCost } from '../utils/costCalculator';
@Injectable()
export class CostService {
  private rows = [{ id: 1, vehicleId: 1, month: '2026-06', fuelTotal: 1776, maintenanceTotal: 2100, tollTotal: 420, laborTotal: 2500, fixedCost: 7800, totalCost: 14596, totalRevenue: 22600, profit: 8004 }];
  findAll() { return this.rows; }
  findOne(id: number) { return this.rows.find((item: any) => item.id === id); }
  create(payload: any) { const row = { ...payload, id: this.rows.length + 1 }; this.rows.push(row); return row; }
  recordTripCost(vehicleId: number, month: string, trip: { freight: number; fuelCost: number; tollCost: number; laborCost: number }) {
    let row = this.rows.find((item: any) => item.vehicleId === vehicleId && item.month === month);
    if (!row) {
      row = { id: this.rows.length + 1, vehicleId, month, fuelTotal: 0, maintenanceTotal: 0, tollTotal: 0, laborTotal: 0, fixedCost: 0, totalCost: 0, totalRevenue: 0, profit: 0 };
      this.rows.push(row);
    }
    row.fuelTotal += trip.fuelCost;
    row.tollTotal += trip.tollCost;
    row.laborTotal += trip.laborCost;
    row.totalRevenue += trip.freight;
    row.totalCost = calculateTotalCost(row.fuelTotal, row.maintenanceTotal, row.tollTotal, row.laborTotal, row.fixedCost);
    row.profit = row.totalRevenue - row.totalCost;
    return row;
  }
}
