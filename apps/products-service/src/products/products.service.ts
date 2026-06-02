import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async create(
    createProductDto: CreateProductDto & { createdByUserId: number },
  ) {
    await this.ensureSkuIsAvailable(createProductDto.sku);

    const product = this.productsRepository.create({
      ...createProductDto,
      isActive: createProductDto.isActive ?? true,
    });

    return this.productsRepository.save(product);
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

    return this.productsRepository.save(product);
  }

  async remove(id: number) {
    const product = await this.findOne(id);

    await this.productsRepository.remove(product);

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
