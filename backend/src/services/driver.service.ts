import { Injectable, NotFoundException } from '@nestjs/common';
@Injectable()
export class DriverService {
  private rows = [{ id: 1, name: '赵强', phone: '13800000001', identityNo: '310101199001010011', licenseType: 'B2', licenseExpireDate: '2028-05-01', hireDate: '2022-01-10', status: 'Available', monthlySalary: 9800 }];
  findAll() { return this.rows; }
  findOne(id: number) { return this.rows.find((item: any) => item.id === id); }
  create(payload: any) { const row = { ...payload, id: this.rows.length + 1 }; this.rows.push(row); return row; }
  updateStatus(id: number, status: string) {
    const row = this.findOne(id);
    if (!row) throw new NotFoundException(`司机 ${id} 不存在`);
    row.status = status;
    return row;
  }
}
