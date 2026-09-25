import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { DriverService } from '../services/driver.service';
@Controller('drivers')
export class DriverController {
  constructor(private readonly service: DriverService) {}
  @Get() findAll() { return this.service.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(Number(id)); }
  @Post() create(@Body() payload: any) { return this.service.create(payload); }
}
