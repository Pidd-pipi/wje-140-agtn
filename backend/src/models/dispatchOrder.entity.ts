import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity()
export class DispatchOrderEntity {
  @PrimaryGeneratedColumn() id!: number;
  @Column() orderNo!: string;
  @Column() vehicleId!: number;
  @Column() driverId!: number;
  @Column() origin!: string;
  @Column() destination!: string;
  @Column() planDepartAt!: string;
  @Column() planArriveAt!: string;
  @Column({ nullable: true }) actualDepartAt?: string;
  @Column({ nullable: true }) actualArriveAt?: string;
  @Column() cargo!: string;
  @Column('float') weight!: number;
  @Column('float') volume!: number;
  @Column('float') freight!: number;
  @Column('float') estimatedFuelCost!: number;
  @Column('float') estimatedTollCost!: number;
  @Column() status!: string;
  @Column('float') profit!: number;
}
