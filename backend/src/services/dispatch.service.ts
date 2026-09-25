import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DispatchStatus, DriverStatus, VehicleStatus } from '../types/enums';
import { calculateProfit } from '../utils/costCalculator';
import { VehicleService } from './vehicle.service';
import { DriverService } from './driver.service';
import { CostService } from './cost.service';

function formatNow(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

@Injectable()
export class DispatchService {
  private rows: any[] = [{ id: 1, orderNo: 'DSP-20260612-0001', vehicleId: 1, driverId: 1, origin: '上海青浦仓', destination: '杭州萧山仓', planDepartAt: '2026-06-12 09:00', planArriveAt: '2026-06-12 13:30', cargo: '冷链食品', weight: 8200, volume: 42, freight: 7200, estimatedFuelCost: 1500, estimatedTollCost: 420, status: 'Assigned', profit: 4180 }];

  constructor(
    private readonly vehicleService: VehicleService,
    private readonly driverService: DriverService,
    private readonly costService: CostService
  ) {}

  findAll() { return this.rows; }
  findOne(id: number) { return this.rows.find((item: any) => item.id === id); }
  create(payload: any) { const row = { ...payload, id: this.rows.length + 1 }; this.rows.push(row); return row; }

  depart(id: number) {
    const order = this.requireOrder(id);
    if (order.status !== DispatchStatus.Assigned) {
      throw new ConflictException(`调度单状态为 ${order.status}，仅已分派(Assigned)的单据才能发车`);
    }
    const vehicle = this.vehicleService.findOne(order.vehicleId);
    if (!vehicle) throw new NotFoundException(`车辆 ${order.vehicleId} 不存在`);
    if (vehicle.status !== VehicleStatus.Available) {
      throw new ConflictException(`车辆状态为 ${vehicle.status}，非空闲不可发车`);
    }
    const driver = this.driverService.findOne(order.driverId);
    if (!driver) throw new NotFoundException(`司机 ${order.driverId} 不存在`);
    if (driver.status !== DriverStatus.Available) {
      throw new ConflictException(`司机状态为 ${driver.status}，非空闲不可发车`);
    }
    order.status = DispatchStatus.InProgress;
    order.actualDepartAt = formatNow();
    this.vehicleService.updateStatus(vehicle.id, VehicleStatus.OnTrip);
    this.driverService.updateStatus(driver.id, DriverStatus.OnTrip);
    return order;
  }

  complete(id: number, payload: any) {
    const order = this.requireOrder(id);
    if (order.status !== DispatchStatus.InProgress) {
      throw new ConflictException(`调度单状态为 ${order.status}，仅运输中(InProgress)的单据才能收车`);
    }
    const { actualArriveAt, fuelCost, tollCost, laborCost } = payload ?? {};
    if (typeof actualArriveAt !== 'string' || !actualArriveAt.trim()) {
      throw new BadRequestException('actualArriveAt 为必填的实际到达时间');
    }
    for (const [name, value] of Object.entries({ fuelCost, tollCost, laborCost })) {
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
        throw new BadRequestException(`${name} 必须为不小于 0 的数字`);
      }
    }
    order.actualArriveAt = actualArriveAt;
    order.actualFuelCost = fuelCost;
    order.actualTollCost = tollCost;
    order.laborCost = laborCost;
    order.profit = calculateProfit(order.freight, fuelCost, tollCost, laborCost);
    order.status = DispatchStatus.Completed;
    this.vehicleService.updateStatus(order.vehicleId, VehicleStatus.Available);
    this.driverService.updateStatus(order.driverId, DriverStatus.Available);
    this.costService.recordTripCost(order.vehicleId, actualArriveAt.slice(0, 7), { freight: order.freight, fuelCost, tollCost, laborCost });
    return order;
  }

  private requireOrder(id: number) {
    const order = this.findOne(id);
    if (!order) throw new NotFoundException(`调度单 ${id} 不存在`);
    return order;
  }
}
