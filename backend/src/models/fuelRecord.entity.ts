import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity()
export class FuelRecordEntity {
  @PrimaryGeneratedColumn() id!: number;
  @Column() vehicleId!: number;
  @Column() driverId!: number;
  @Column({ nullable: true }) dispatchOrderId?: number;
  @Column('float') liters!: number;
  @Column('float') unitPrice!: number;
  @Column('float') totalAmount!: number;
  @Column('float') mileage!: number;
  @Column() station!: string;
  @Column() paymentMethod!: string;
}
