import assert from 'assert';
import { DispatchStatus, DriverStatus, VehicleStatus } from '../src/types/enums';
import { CostService } from '../src/services/cost.service';
import { DispatchService } from '../src/services/dispatch.service';
import { DriverService } from '../src/services/driver.service';
import { VehicleService } from '../src/services/vehicle.service';

function expectError(fn: () => unknown, messageIncludes?: string) {
  try {
    fn();
    throw new Error('应当抛出异常，但没有抛出');
  } catch (e: any) {
    if (e.message === '应当抛出异常，但没有抛出') throw e;
    if (messageIncludes && !e.message.includes(messageIncludes)) {
      throw new Error(`异常信息不符合预期：${e.message}`);
    }
  }
}

function fresh() {
  const vehicles = new VehicleService();
  const drivers = new DriverService();
  const costs = new CostService();
  const dispatch = new DispatchService(vehicles, drivers, costs);
  return { vehicles, drivers, costs, dispatch };
}

// 1. 未发车时双方空闲
let ctx = fresh();
assert.strictEqual(ctx.vehicles.findOne(1)!.status, VehicleStatus.Available);
assert.strictEqual(ctx.drivers.findOne(1)!.status, DriverStatus.Available);

// 2. 非 Assigned 不能发车：Draft 单直接发车应失败
const draft = ctx.dispatch.create({
  orderNo: 'DSP-TEST-0002', vehicleId: 1, driverId: 1,
  origin: 'A', destination: 'B', planDepartAt: '2026-06-15 08:00', planArriveAt: '2026-06-15 12:00',
  cargo: '百货', weight: 1000, volume: 10, freight: 5000,
  estimatedFuelCost: 1000, estimatedTollCost: 300
});
assert.strictEqual(draft.status, DispatchStatus.Draft);
expectError(() => ctx.dispatch.start(draft.id), 'Assigned');

// 3. 分派后才能发车；发车后双方运输中、单据 InProgress
ctx.dispatch.assign(draft.id, { vehicleId: 1, driverId: 1 });
const started = ctx.dispatch.start(draft.id, { actualDepartAt: '2026-06-15 08:10' });
assert.strictEqual(started.status, DispatchStatus.InProgress);
assert.strictEqual(ctx.vehicles.findOne(1)!.status, VehicleStatus.OnTrip);
assert.strictEqual(ctx.drivers.findOne(1)!.status, DriverStatus.OnTrip);

// 4. 一方不空闲时，另一张已分派单不能发车
const ctx2 = fresh();
const order2 = ctx2.dispatch.create({
  orderNo: 'DSP-TEST-0003', origin: 'C', destination: 'D',
  planDepartAt: '2026-06-20 08:00', planArriveAt: '2026-06-20 12:00',
  cargo: 'x', weight: 1, volume: 1, freight: 3000,
  estimatedFuelCost: 800, estimatedTollCost: 200
});
ctx2.dispatch.assign(order2.id, { vehicleId: 1, driverId: 1 });
ctx2.dispatch.start(order2.id);
const order3 = ctx2.dispatch.create({
  orderNo: 'DSP-TEST-0004', origin: 'E', destination: 'F',
  planDepartAt: '2026-06-21 08:00', planArriveAt: '2026-06-21 12:00',
  cargo: 'y', weight: 1, volume: 1, freight: 4000,
  estimatedFuelCost: 800, estimatedTollCost: 200
});
ctx2.dispatch.assign(order3.id, { vehicleId: 1, driverId: 1 });
expectError(() => ctx2.dispatch.start(order3.id), '非空闲');

// 5. 收车前必须在运输中；Draft 单收车失败
expectError(() => fresh().dispatch.complete(999, { actualArriveAt: '2026-06-15 12:00' }), '不存在');
expectError(() => ctx.dispatch.complete(draft.id, {}), '实际到达时间');
expectError(() => ctx.dispatch.complete(draft.id, { actualArriveAt: 'bad-time' }), '格式');
expectError(() => ctx.dispatch.complete(draft.id, { actualArriveAt: '2026-06-15 07:00' }), '不能早于');

// 6. 正常收车：释放双方、按实际支出重算利润、当月汇总同步
const completed = ctx.dispatch.complete(draft.id, {
  actualArriveAt: '2026-06-15 12:20',
  actualFuelCost: 1200,
  actualTollCost: 350,
  actualLaborCost: 600
});
assert.strictEqual(completed.status, DispatchStatus.Completed);
assert.strictEqual(completed.profit, 5000 - 1200 - 350 - 600);
assert.strictEqual(completed.actualFuelCost, 1200);
assert.strictEqual(ctx.vehicles.findOne(1)!.status, VehicleStatus.Available);
assert.strictEqual(ctx.drivers.findOne(1)!.status, DriverStatus.Available);

const summary = ctx.costs.findByVehicleAndMonth(1, '2026-06')!;
assert.strictEqual(summary.fuelTotal, 1776 + 1200);
assert.strictEqual(summary.tollTotal, 420 + 350);
assert.strictEqual(summary.laborTotal, 2500 + 600);
assert.strictEqual(summary.totalRevenue, 22600 + 5000);
assert.strictEqual(summary.totalCost, 2976 + 2100 + 770 + 3100 + 7800);
assert.strictEqual(summary.profit, summary.totalRevenue - summary.totalCost);
assert.deepStrictEqual(summary.orderIds, [draft.id]);

// 7. 重复收车：状态不是 InProgress，直接拒绝，不重复累计
expectError(() => ctx.dispatch.complete(draft.id, {
  actualArriveAt: '2026-06-15 13:00', actualFuelCost: 9999
}), '运输中');
const snapshot = ctx.costs.findByVehicleAndMonth(1, '2026-06')!;
assert.strictEqual(snapshot.fuelTotal, 1776 + 1200);
assert.strictEqual(snapshot.totalRevenue, 22600 + 5000);
assert.deepStrictEqual(snapshot.orderIds, [draft.id]);

// 8. 直接重复调用入账也是幂等的
ctx.costs.applyCompletedTrip({
  orderId: draft.id, vehicleId: 1, month: '2026-06',
  freight: 5000, fuelCost: 1200, tollCost: 350, laborCost: 600
});
const after = ctx.costs.findByVehicleAndMonth(1, '2026-06')!;
assert.deepStrictEqual(after, snapshot);

// 9. 种子单（Assigned）走完整流程：发车 → 收车
ctx = fresh();
const seedId = 1;
ctx.dispatch.start(seedId, { actualDepartAt: '2026-06-12 09:05' });
assert.strictEqual(ctx.vehicles.findOne(1)!.status, VehicleStatus.OnTrip);
ctx.dispatch.complete(seedId, {
  actualArriveAt: '2026-06-12 13:40',
  actualFuelCost: 1400,
  actualTollCost: 400,
  actualLaborCost: 500
});
assert.strictEqual(ctx.dispatch.findOne(seedId)!.profit, 7200 - 1400 - 400 - 500);
assert.strictEqual(ctx.vehicles.findOne(1)!.status, VehicleStatus.Available);
assert.strictEqual(ctx.drivers.findOne(1)!.status, DriverStatus.Available);

// 10. 跨月收车计入到达月份的新汇总
ctx = fresh();
const cross = ctx.dispatch.create({
  orderNo: 'DSP-TEST-0007', origin: 'G', destination: 'H',
  planDepartAt: '2026-07-31 20:00', planArriveAt: '2026-08-01 02:00',
  cargo: 'z', weight: 1, volume: 1, freight: 6000,
  estimatedFuelCost: 1000, estimatedTollCost: 500
});
ctx.dispatch.assign(cross.id, { vehicleId: 1, driverId: 1 });
ctx.dispatch.start(cross.id, { actualDepartAt: '2026-07-31 20:30' });
ctx.dispatch.complete(cross.id, {
  actualArriveAt: '2026-08-01 02:10',
  actualFuelCost: 1100,
  actualTollCost: 480,
  actualLaborCost: 700
});
const aug = ctx.costs.findByVehicleAndMonth(1, '2026-08')!;
assert.strictEqual(aug.fuelTotal, 1100);
assert.strictEqual(aug.tollTotal, 480);
assert.strictEqual(aug.laborTotal, 700);
assert.strictEqual(aug.totalRevenue, 6000);
assert.strictEqual(aug.fixedCost, 0);
assert.strictEqual(aug.profit, 6000 - 1100 - 480 - 700);
assert.deepStrictEqual(aug.orderIds, [cross.id]);

// 11. 分派对不存在的车辆/司机做校验
ctx = fresh();
const bad = ctx.dispatch.create({
  orderNo: 'DSP-TEST-0011', origin: 'I', destination: 'J',
  planDepartAt: '2026-09-01 08:00', planArriveAt: '2026-09-01 12:00',
  cargo: 'q', weight: 1, volume: 1, freight: 1000,
  estimatedFuelCost: 100, estimatedTollCost: 100
});
expectError(() => ctx.dispatch.assign(bad.id, { vehicleId: 999, driverId: 1 }), '车辆不存在');
expectError(() => ctx.dispatch.assign(bad.id, { vehicleId: 1, driverId: 999 }), '司机不存在');
expectError(() => ctx.dispatch.assign(bad.id, {}), '必须指定车辆');

console.log('全部断言通过 ✔');
