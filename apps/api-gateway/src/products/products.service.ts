import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PRODUCTS_SERVICE } from './products.constants';

@Injectable()
export class ProductsService {
  constructor(
    @Inject(PRODUCTS_SERVICE)
    private readonly productsClient: ClientProxy,
  ) {}

  create(createProductDto: CreateProductDto, userId: number) {
    return this.send('product.create', {
      ...createProductDto,
      createdByUserId: userId,
    });
  }

  findAll() {
    return this.send('product.findAll', {});
  }

  findOne(id: number) {
    return this.send('product.findOne', { id });
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return this.send('product.update', {
      id,
      ...updateProductDto,
    });
  }

  remove(id: number) {
    return this.send('product.remove', { id });
  }

  private async send<TResult, TPayload>(
    pattern: string,
    payload: TPayload,
  ): Promise<TResult> {
    try {
      return await firstValueFrom(
        this.productsClient.send<TResult, TPayload>(pattern, payload),
      );
    } catch (error) {
      throw this.mapRpcError(error);
    }
  }

  private mapRpcError(error: unknown) {
    if (typeof error === 'object' && error !== null) {
      const rpcError = error as {
        statusCode?: number;
        message?: string | string[];
      };

      const message = Array.isArray(rpcError.message)
        ? (rpcError.message[0] ?? 'Ürün servisi hatası oluştu')
        : (rpcError.message ?? 'Ürün servisi hatası oluştu');

      return new HttpException(
        message,
        rpcError.statusCode ?? HttpStatus.BAD_GATEWAY,
      );
    }

    return new HttpException(
      'Ürün servisine ulaşılamıyor',
      HttpStatus.BAD_GATEWAY,
    );
  }
}
