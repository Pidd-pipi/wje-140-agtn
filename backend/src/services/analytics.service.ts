import { Injectable } from '@nestjs/common';
@Injectable()
export class AnalyticsService {
  summarizeCosts(rows: Array<{ profit: number; totalCost?: number }>) {
    return { count: rows.length, profit: rows.reduce((sum, row) => sum + row.profit, 0), totalCost: rows.reduce((sum, row) => sum + (row.totalCost ?? 0), 0) };
  }
}
