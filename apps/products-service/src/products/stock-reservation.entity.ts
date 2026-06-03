import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum StockReservationStatus {
  RESERVED = 'RESERVED',
  RELEASED = 'RELEASED',
  COMPLETED = 'COMPLETED',
}

@Entity({ name: 'stock_reservations' })
@Index(['orderId', 'productId'], { unique: true })
export class StockReservation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  orderId: number;

  @Column({ length: 64 })
  sagaId: string;

  @Column({ type: 'int' })
  productId: number;

  @Column({ length: 150 })
  productName: string;

  @Column({ length: 64 })
  sku: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  lineTotal: number;

  @Column({
    type: 'enum',
    enum: StockReservationStatus,
    default: StockReservationStatus.RESERVED,
  })
  status: StockReservationStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
