import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './product.entity';

@Injectable()
export class ProductsService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @Inject('PRODUCT_EVENTS_CLIENT')
    private readonly productEventsClient: ClientKafka,
  ) {}

  async onApplicationBootstrap() {
    await this.productEventsClient.connect();
  }

  async onModuleDestroy() {
    await this.productEventsClient.close();
  }

  async create(
    createProductDto: CreateProductDto & { createdByUserId: number },
  ) {
    await this.ensureSkuIsAvailable(createProductDto.sku);

    const product = this.productsRepository.create({
      ...createProductDto,
      isActive: createProductDto.isActive ?? true,
    });

    const savedProduct = await this.productsRepository.save(product);

    this.productEventsClient.emit('catalog.product.created', {
      productId: savedProduct.id,
      sku: savedProduct.sku,
      createdByUserId: createProductDto.createdByUserId,
      occurredAt: new Date().toISOString(),
    });

    return savedProduct;
  }

  findAll() {
    return this.productsRepository.find({
      order: {
        id: 'DESC',
      },
    });
  }

  async findOne(id: number) {
    const product = await this.productsRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Ürün bulunamadı');
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const product = await this.findOne(id);

    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      await this.ensureSkuIsAvailable(updateProductDto.sku);
    }

    Object.assign(product, updateProductDto);

    const updatedProduct = await this.productsRepository.save(product);

    this.productEventsClient.emit('catalog.product.updated', {
      productId: updatedProduct.id,
      sku: updatedProduct.sku,
      changedFields: Object.keys(updateProductDto),
      occurredAt: new Date().toISOString(),
    });

    return updatedProduct;
  }

  async remove(id: number) {
    const product = await this.findOne(id);

    await this.productsRepository.remove(product);

    this.productEventsClient.emit('catalog.product.deleted', {
      productId: id,
      sku: product.sku,
      occurredAt: new Date().toISOString(),
    });

    return {
      id,
    };
  }

  private async ensureSkuIsAvailable(sku: string) {
    const existingProduct = await this.productsRepository.findOne({
      where: { sku },
    });

    if (existingProduct) {
      throw new ConflictException('Bu SKU ile kayıtlı ürün zaten mevcut');
    }
  }
}
