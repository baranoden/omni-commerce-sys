import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PaymentStatus {
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity({ name: 'payments' })
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', unique: true })
  orderId: number;

  @Column({ length: 64 })
  sagaId: string;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 8, default: 'TRY' })
  currency: string;

  @Column({ length: 128, select: false })
  paymentMethodToken: string;

  @Column({ type: 'varchar', length: 128, nullable: true, unique: true })
  transactionId?: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  provider?: string | null;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
  })
  status: PaymentStatus;

  @Column({ type: 'text', nullable: true })
  failureReason?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
