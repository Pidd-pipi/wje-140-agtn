import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity()
export class CostSummaryEntity {
  @PrimaryGeneratedColumn() id!: number;
  @Column() vehicleId!: number;
  @Column() month!: string;
  @Column('float') fuelTotal!: number;
  @Column('float') maintenanceTotal!: number;
  @Column('float') tollTotal!: number;
  @Column('float') laborTotal!: number;
  @Column('float') fixedCost!: number;
  @Column('float') totalCost!: number;
  @Column('float') totalRevenue!: number;
  @Column('float') profit!: number;
}
