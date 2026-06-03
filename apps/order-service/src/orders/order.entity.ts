import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum CompensationStatus {
  NOT_REQUIRED = 'NOT_REQUIRED',
  REFUNDED = 'REFUNDED',
  REFUND_FAILED = 'REFUND_FAILED',
}

@Entity({ name: 'orders' })
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 64 })
  sagaId: string;

  @Column({ type: 'int' })
  createdByUserId: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({
    type: 'enum',
    enum: CompensationStatus,
    default: CompensationStatus.NOT_REQUIRED,
  })
  compensationStatus: CompensationStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ length: 8, default: 'TRY' })
  currency: string;

  @Column({ length: 128, select: false })
  paymentMethodToken: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  paymentTransactionId?: string | null;

  @Column({ type: 'text', nullable: true })
  failureReason?: string | null;

  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
    eager: true,
  })
  items: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
