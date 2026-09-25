import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity()
export class DriverEntity {
  @PrimaryGeneratedColumn() id!: number;
  @Column() name!: string;
  @Column() phone!: string;
  @Column() identityNo!: string;
  @Column() licenseType!: string;
  @Column() licenseExpireDate!: string;
  @Column() hireDate!: string;
  @Column() status!: string;
  @Column('float') monthlySalary!: number;
}
