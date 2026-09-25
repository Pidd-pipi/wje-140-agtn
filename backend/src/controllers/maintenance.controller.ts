import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { MaintenanceService } from '../services/maintenance.service';
@Controller('maintenance-records')
export class MaintenanceController {
  constructor(private readonly service: MaintenanceService) {}
  @Get() findAll() { return this.service.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(Number(id)); }
  @Post() create(@Body() payload: any) { return this.service.create(payload); }
}
