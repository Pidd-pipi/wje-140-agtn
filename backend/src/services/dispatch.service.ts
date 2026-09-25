import { Injectable } from '@nestjs/common';
@Injectable()
export class DispatchService {
  private rows = [{ id: 1, orderNo: 'DSP-20260612-0001', vehicleId: 1, driverId: 1, origin: '上海青浦仓', destination: '杭州萧山仓', planDepartAt: '2026-06-12 09:00', planArriveAt: '2026-06-12 13:30', cargo: '冷链食品', weight: 8200, volume: 42, freight: 7200, estimatedFuelCost: 1500, estimatedTollCost: 420, status: 'Assigned', profit: 4180 }];
  findAll() { return this.rows; }
  findOne(id: number) { return this.rows.find((item: any) => item.id === id); }
  create(payload: any) { const row = { ...payload, id: this.rows.length + 1 }; this.rows.push(row); return row; }
}
