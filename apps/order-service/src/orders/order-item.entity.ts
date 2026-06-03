import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Order } from './order.entity';

@Entity({ name: 'order_items' })
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  productId: number;

  @Column({ type: 'varchar', length: 150, nullable: true })
  productName?: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  sku?: string | null;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  unitPrice?: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  lineTotal?: number | null;

  @ManyToOne(() => Order, (order) => order.items, {
    onDelete: 'CASCADE',
  })
  order: Order;
}
