import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { VehicleService } from '../services/vehicle.service';
@Controller('vehicles')
export class VehicleController {
  constructor(private readonly service: VehicleService) {}
  @Get() findAll() { return this.service.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(Number(id)); }
  @Post() create(@Body() payload: any) { return this.service.create(payload); }
}
