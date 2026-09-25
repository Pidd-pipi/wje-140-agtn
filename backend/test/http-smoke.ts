import assert from 'assert';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { CostController } from '../src/controllers/cost.controller';
import { DispatchController } from '../src/controllers/dispatch.controller';
import { CostService } from '../src/services/cost.service';
import { DispatchService } from '../src/services/dispatch.service';
import { DriverService } from '../src/services/driver.service';
import { VehicleService } from '../src/services/vehicle.service';

@Module({
  controllers: [DispatchController, CostController],
  providers: [DispatchService, VehicleService, DriverService, CostService]
})
class SmokeModule {}

async function main() {
  const app = await NestFactory.create(SmokeModule, { logger: false });
  app.setGlobalPrefix('api');
  await app.listen(0, '127.0.0.1');
  const port = app.getHttpServer().address().port;
  const base = `http://127.0.0.1:${port}/api`;
  const call = (path: string, body?: unknown) => fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  // 种子单 id=1 为 Assigned，车辆司机均空闲 -> 发车成功
  let res = await call('/dispatch-orders/1/start', { actualDepartAt: '2026-06-12 09:05' });
  assert.strictEqual(res.status, 201);
  let order = await res.json();
  assert.strictEqual(order.status, 'InProgress');

  // 重复发车 -> 409
  res = await call('/dispatch-orders/1/start', {});
  assert.strictEqual(res.status, 409);

  // 收车缺少实际到达时间 -> 400
  res = await call('/dispatch-orders/1/complete', { actualFuelCost: 100 });
  assert.strictEqual(res.status, 400);

  // 正常收车 -> 201，利润按实际支出重算
  res = await call('/dispatch-orders/1/complete', {
    actualArriveAt: '2026-06-12 13:40',
    actualFuelCost: 1400,
    actualTollCost: 400,
    actualLaborCost: 500
  });
  assert.strictEqual(res.status, 201);
  order = await res.json();
  assert.strictEqual(order.status, 'Completed');
  assert.strictEqual(order.profit, 7200 - 1400 - 400 - 500);

  // 重复收车 -> 409，不重复累计
  res = await call('/dispatch-orders/1/complete', {
    actualArriveAt: '2026-06-12 14:00', actualFuelCost: 9999
  });
  assert.strictEqual(res.status, 409);

  // 月度汇总只并入一次：油费 1776+1400、收入 22600+7200
  res = await fetch(`${base}/cost-summaries`);
  const summaries = await res.json();
  const june = summaries.find((s: any) => s.vehicleId === 1 && s.month === '2026-06');
  assert.strictEqual(june.fuelTotal, 1776 + 1400);
  assert.strictEqual(june.tollTotal, 420 + 400);
  assert.strictEqual(june.laborTotal, 2500 + 500);
  assert.strictEqual(june.totalRevenue, 22600 + 7200);
  assert.deepStrictEqual(june.orderIds, [1]);

  // 新建 Draft 单：未分派不能发车 -> 409
  res = await call('/dispatch-orders', {
    orderNo: 'DSP-TEST-0100', vehicleId: 1, driverId: 1,
    origin: 'A', destination: 'B', planDepartAt: '2026-09-25 08:00',
    planArriveAt: '2026-09-25 12:00', cargo: 'x', weight: 1, volume: 1,
    freight: 3000, estimatedFuelCost: 800, estimatedTollCost: 200
  });
  assert.strictEqual(res.status, 201);
  const created = await res.json();
  assert.strictEqual(created.status, 'Draft');
  res = await call(`/dispatch-orders/${created.id}/start`, {});
  assert.strictEqual(res.status, 409);
  // 分派后发车成功（车辆司机已被前一趟释放为空闲）
  res = await call(`/dispatch-orders/${created.id}/assign`, { vehicleId: 1, driverId: 1 });
  assert.strictEqual(res.status, 201);
  res = await call(`/dispatch-orders/${created.id}/start`, {});
  assert.strictEqual(res.status, 201);

  await app.close();
  console.log('HTTP 冒烟测试全部通过 ✔');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
