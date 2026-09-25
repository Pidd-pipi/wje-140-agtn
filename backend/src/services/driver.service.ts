import { Injectable } from '@nestjs/common';
import { DriverStatus } from '../types/enums';

export interface DriverRow {
  id: number;
  name: string;
  phone: string;
  identityNo: string;
  licenseType: string;
  licenseExpireDate: string;
  hireDate: string;
  status: DriverStatus;
  monthlySalary: number;
}

@Injectable()
export class DriverService {
  private rows: DriverRow[] = [{ id: 1, name: '赵强', phone: '13800000001', identityNo: '310101199001010011', licenseType: 'B2', licenseExpireDate: '2028-05-01', hireDate: '2022-01-10', status: DriverStatus.Available, monthlySalary: 9800 }];
  findAll() { return this.rows; }
  findOne(id: number) { return this.rows.find((item) => item.id === id); }
  create(payload: Partial<DriverRow>) {
    const row = { ...payload, id: this.rows.length + 1 } as DriverRow;
    this.rows.push(row);
    return row;
  }
  setStatus(id: number, status: DriverStatus) {
    const row = this.findOne(id);
    if (row) {
      row.status = status;
    }
    return row;
  }
}
