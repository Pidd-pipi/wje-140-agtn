import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity()
export class MaintenanceRecordEntity {
  @PrimaryGeneratedColumn() id!: number;
  @Column() vehicleId!: number;
  @Column() maintenanceType!: string;
  @Column() item!: string;
  @Column('float') cost!: number;
  @Column() vendor!: string;
  @Column() date!: string;
  @Column('float') nextMileage!: number;
  @Column() nextDate!: string;
  @Column() status!: string;
}
