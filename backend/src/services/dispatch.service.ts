import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DispatchStatus, DriverStatus, VehicleStatus } from '../types/enums';
import { AssignDispatchPayload, CompleteTripPayload, StartTripPayload } from '../types/interfaces';
import { calculateProfit } from '../utils/costCalculator';
import { isValidDateTime, normalizeDateTime, nowDateTime, toMonthKey } from '../utils/month';
import { CostService } from './cost.service';
import { DriverService } from './driver.service';
import { VehicleService } from './vehicle.service';

export interface DispatchRow {
  id: number;
  orderNo: string;
  vehicleId: number;
  driverId: number;
  origin: string;
  destination: string;
  planDepartAt: string;
  planArriveAt: string;
  actualDepartAt?: string;
  actualArriveAt?: string;
  cargo: string;
  weight: number;
  volume: number;
  freight: number;
  estimatedFuelCost: number;
  estimatedTollCost: number;
  actualFuelCost?: number;
  actualTollCost?: number;
  actualLaborCost?: number;
  status: DispatchStatus;
  profit: number;
}

@Injectable()
export class DispatchService {
  private rows: DispatchRow[] = [{
    id: 1,
    orderNo: 'DSP-20260612-0001',
    vehicleId: 1,
    driverId: 1,
    origin: '上海青浦仓',
    destination: '杭州萧山仓',
    planDepartAt: '2026-06-12 09:00',
    planArriveAt: '2026-06-12 13:30',
    cargo: '冷链食品',
    weight: 8200,
    volume: 42,
    freight: 7200,
    estimatedFuelCost: 1500,
    estimatedTollCost: 420,
    status: DispatchStatus.Assigned,
    profit: 7200 - 1500 - 420
  }];

  constructor(
    private readonly vehicleService: VehicleService,
    private readonly driverService: DriverService,
    private readonly costService: CostService
  ) {}

  findAll() { return this.rows; }
  findOne(id: number) { return this.rows.find((item) => item.id === id); }

  create(payload: Partial<DispatchRow>) {
    const { id: _ignored, ...fields } = payload;
    const row: DispatchRow = {
      orderNo: fields.orderNo ?? '',
      vehicleId: fields.vehicleId ?? 0,
      driverId: fields.driverId ?? 0,
      origin: fields.origin ?? '',
      destination: fields.destination ?? '',
      planDepartAt: fields.planDepartAt ?? '',
      planArriveAt: fields.planArriveAt ?? '',
      cargo: fields.cargo ?? '',
      weight: fields.weight ?? 0,
      volume: fields.volume ?? 0,
      freight: fields.freight ?? 0,
      estimatedFuelCost: fields.estimatedFuelCost ?? 0,
      estimatedTollCost: fields.estimatedTollCost ?? 0,
      status: fields.status ?? DispatchStatus.Draft,
      profit: fields.profit
        ?? (fields.freight ?? 0) - (fields.estimatedFuelCost ?? 0) - (fields.estimatedTollCost ?? 0),
      ...fields,
      id: this.rows.length + 1
    };
    this.rows.push(row);
    return row;
  }

  /** 分派：草稿单指定车辆与司机，之后才能发车 */
  assign(id: number, payload: AssignDispatchPayload) {
    const row = this.getOrThrow(id);
    if (row.status !== DispatchStatus.Draft) {
      throw new ConflictException(`仅草稿状态的调度单可以分派，当前状态：${row.status}`);
    }
    if (!Number.isInteger(payload.vehicleId) || !Number.isInteger(payload.driverId)) {
      throw new BadRequestException('分派必须指定车辆ID(vehicleId)与司机ID(driverId)');
    }
    if (!this.vehicleService.findOne(payload.vehicleId as number)) {
      throw new BadRequestException(`车辆不存在：${payload.vehicleId}`);
    }
    if (!this.driverService.findOne(payload.driverId as number)) {
      throw new BadRequestException(`司机不存在：${payload.driverId}`);
    }
    row.vehicleId = payload.vehicleId as number;
    row.driverId = payload.driverId as number;
    row.status = DispatchStatus.Assigned;
    return row;
  }

  /** 发车：单据已分派且车辆、司机均空闲，发车后双方转为运输中 */
  start(id: number, payload: StartTripPayload = {}) {
    const row = this.getOrThrow(id);
    if (row.status !== DispatchStatus.Assigned) {
      throw new ConflictException(`仅已分派(Assigned)的调度单可以发车，当前状态：${row.status}`);
    }
    const vehicle = this.vehicleService.findOne(row.vehicleId);
    if (!vehicle) {
      throw new BadRequestException(`调度单车辆不存在：${row.vehicleId}`);
    }
    if (vehicle.status !== VehicleStatus.Available) {
      throw new ConflictException(`车辆 ${vehicle.plateNo} 当前为 ${vehicle.status}，非空闲状态不能发车`);
    }
    const driver = this.driverService.findOne(row.driverId);
    if (!driver) {
      throw new BadRequestException(`调度单司机不存在：${row.driverId}`);
    }
    if (driver.status !== DriverStatus.Available) {
      throw new ConflictException(`司机 ${driver.name} 当前为 ${driver.status}，非空闲状态不能发车`);
    }
    if (payload.actualDepartAt !== undefined && !isValidDateTime(payload.actualDepartAt)) {
      throw new BadRequestException('实际出发时间格式无效，应为 YYYY-MM-DD HH:mm');
    }

    row.actualDepartAt = payload.actualDepartAt ? normalizeDateTime(payload.actualDepartAt) : nowDateTime();
    row.status = DispatchStatus.InProgress;
    this.vehicleService.setStatus(vehicle.id, VehicleStatus.OnTrip);
    this.driverService.setStatus(driver.id, DriverStatus.OnTrip);
    return row;
  }

  /** 收车：录入实际到达时间与油费/过路费/人工，释放车辆与司机，重算利润并同步当月汇总 */
  complete(id: number, payload: CompleteTripPayload = {}) {
    const row = this.getOrThrow(id);
    if (row.status !== DispatchStatus.InProgress) {
      throw new ConflictException(`仅运输中(InProgress)的调度单可以收车，当前状态：${row.status}`);
    }
    if (!isValidDateTime(payload.actualArriveAt)) {
      throw new BadRequestException('收车必须提供实际到达时间(actualArriveAt)，格式：YYYY-MM-DD HH:mm');
    }
    const actualArriveAt = normalizeDateTime(payload.actualArriveAt as string);
    if (row.actualDepartAt && actualArriveAt < row.actualDepartAt) {
      throw new BadRequestException('实际到达时间不能早于实际出发时间');
    }
    const actualFuelCost = this.readCost(payload.actualFuelCost, '油费');
    const actualTollCost = this.readCost(payload.actualTollCost, '过路费');
    const actualLaborCost = this.readCost(payload.actualLaborCost, '人工费');

    row.actualArriveAt = actualArriveAt;
    row.actualFuelCost = actualFuelCost;
    row.actualTollCost = actualTollCost;
    row.actualLaborCost = actualLaborCost;
    row.status = DispatchStatus.Completed;
    row.profit = calculateProfit(row.freight, actualFuelCost, actualTollCost, actualLaborCost);

    this.vehicleService.setStatus(row.vehicleId, VehicleStatus.Available);
    this.driverService.setStatus(row.driverId, DriverStatus.Available);

    this.costService.applyCompletedTrip({
      orderId: row.id,
      vehicleId: row.vehicleId,
      month: toMonthKey(actualArriveAt),
      freight: row.freight,
      fuelCost: actualFuelCost,
      tollCost: actualTollCost,
      laborCost: actualLaborCost
    });
    return row;
  }

  private getOrThrow(id: number): DispatchRow {
    const row = this.findOne(id);
    if (!row) {
      throw new NotFoundException(`调度单不存在：${id}`);
    }
    return row;
  }

  private readCost(value: number | undefined, label: string): number {
    if (value === undefined) {
      return 0;
    }
    if (typeof value !== 'number' || Number.isNaN(value) || value < 0) {
      throw new BadRequestException(`${label}必须是非负数字`);
    }
    return value;
  }
}
