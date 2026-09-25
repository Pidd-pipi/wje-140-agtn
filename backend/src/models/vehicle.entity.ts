import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity()
export class VehicleEntity {
  @PrimaryGeneratedColumn() id!: number;
  @Column() plateNo!: string;
  @Column() vehicleType!: string;
  @Column() brandModel!: string;
  @Column() purchaseDate!: string;
  @Column() insuranceExpireDate!: string;
  @Column() inspectionExpireDate!: string;
  @Column() status!: string;
  @Column('float') mileage!: number;
  @Column('float') tankCapacity!: number;
  @Column('float') dailyFixedCost!: number;
}
