import { Injectable } from '@nestjs/common';
import { CompletedTripCost } from '../types/interfaces';
import { calculateTotalCost } from '../utils/costCalculator';

export interface CostSummaryRow {
  id: number;
  vehicleId: number;
  month: string;
  fuelTotal: number;
  maintenanceTotal: number;
  tollTotal: number;
  laborTotal: number;
  fixedCost: number;
  totalCost: number;
  totalRevenue: number;
  profit: number;
  orderIds: number[];
}

@Injectable()
export class CostService {
  private rows: CostSummaryRow[] = [{ id: 1, vehicleId: 1, month: '2026-06', fuelTotal: 1776, maintenanceTotal: 2100, tollTotal: 420, laborTotal: 2500, fixedCost: 7800, totalCost: 14596, totalRevenue: 22600, profit: 8004, orderIds: [] }];

  findAll() { return this.rows; }
  findOne(id: number) { return this.rows.find((item) => item.id === id); }
  findByVehicleAndMonth(vehicleId: number, month: string) {
    return this.rows.find((item) => item.vehicleId === vehicleId && item.month === month);
  }

  create(payload: Partial<CostSummaryRow>) {
    const row: CostSummaryRow = {
      id: this.rows.length + 1,
      vehicleId: payload.vehicleId ?? 0,
      month: payload.month ?? '',
      fuelTotal: payload.fuelTotal ?? 0,
      maintenanceTotal: payload.maintenanceTotal ?? 0,
      tollTotal: payload.tollTotal ?? 0,
      laborTotal: payload.laborTotal ?? 0,
      fixedCost: payload.fixedCost ?? 0,
      totalCost: payload.totalCost ?? 0,
      totalRevenue: payload.totalRevenue ?? 0,
      profit: payload.profit ?? 0,
      orderIds: payload.orderIds ?? []
    };
    this.rows.push(row);
    return row;
  }

  /**
   * 收车入账：把一趟已完成运输的实际支出与运费并入「同车 + 当月」汇总。
   * 同一调度单只入账一次，重复收车不会重复累计。
   */
  applyCompletedTrip(trip: CompletedTripCost): CostSummaryRow {
    const alreadyBooked = this.rows.some((row) => row.orderIds.includes(trip.orderId));
    if (alreadyBooked) {
      return this.findByVehicleAndMonth(trip.vehicleId, trip.month) as CostSummaryRow;
    }

    const row = this.findByVehicleAndMonth(trip.vehicleId, trip.month)
      ?? this.create({ vehicleId: trip.vehicleId, month: trip.month });

    row.fuelTotal += trip.fuelCost;
    row.tollTotal += trip.tollCost;
    row.laborTotal += trip.laborCost;
    row.totalRevenue += trip.freight;
    row.totalCost = calculateTotalCost(
      row.fuelTotal,
      row.maintenanceTotal,
      row.tollTotal,
      row.laborTotal,
      row.fixedCost
    );
    row.profit = row.totalRevenue - row.totalCost;
    row.orderIds.push(trip.orderId);
    return row;
  }
}
