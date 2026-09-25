import { MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { HealthController } from './controllers/health.controller';
import { VehicleController } from './controllers/vehicle.controller';
import { DriverController } from './controllers/driver.controller';
import { DispatchController } from './controllers/dispatch.controller';
import { MaintenanceController } from './controllers/maintenance.controller';
import { FuelController } from './controllers/fuel.controller';
import { CostController } from './controllers/cost.controller';
import { VehicleService } from './services/vehicle.service';
import { DriverService } from './services/driver.service';
import { DispatchService } from './services/dispatch.service';
import { MaintenanceService } from './services/maintenance.service';
import { FuelService } from './services/fuel.service';
import { CostService } from './services/cost.service';
import { AnalyticsService } from './services/analytics.service';
import { RequestLoggerMiddleware } from './middlewares/requestLogger.middleware';
import { AuditLogMiddleware } from './middlewares/auditLog.middleware';
import { RateLimitMiddleware } from './middlewares/rateLimit.middleware';

@Module({
  imports: [TypeOrmModule.forRoot(databaseConfig)],
  controllers: [HealthController, VehicleController, DriverController, DispatchController, MaintenanceController, FuelController, CostController],
  providers: [VehicleService, DriverService, DispatchService, MaintenanceService, FuelService, CostService, AnalyticsService]
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware, AuditLogMiddleware, RateLimitMiddleware).forRoutes('{*path}');
  }
}
