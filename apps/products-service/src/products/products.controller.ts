import { Controller, HttpException, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@Controller()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @MessagePattern('product.create')
  async create(
    @Payload() payload: CreateProductDto & { createdByUserId: number },
  ) {
    try {
      return await this.productsService.create(payload);
    } catch (error) {
      throw this.toRpcException(error);
    }
  }

  @MessagePattern('product.findAll')
  async findAll() {
    try {
      return await this.productsService.findAll();
    } catch (error) {
      throw this.toRpcException(error);
    }
  }

  @MessagePattern('product.findOne')
  async findOne(@Payload() payload: { id: number }) {
    try {
      return await this.productsService.findOne(payload.id);
    } catch (error) {
      throw this.toRpcException(error);
    }
  }

  @MessagePattern('product.update')
  async update(@Payload() payload: { id: number } & UpdateProductDto) {
    try {
      const { id, ...updateProductDto } = payload;
      return await this.productsService.update(id, updateProductDto);
    } catch (error) {
      throw this.toRpcException(error);
    }
  }

  @MessagePattern('product.remove')
  async remove(@Payload() payload: { id: number }) {
    try {
      return await this.productsService.remove(payload.id);
    } catch (error) {
      throw this.toRpcException(error);
    }
  }

  private toRpcException(error: unknown) {
    if (error instanceof HttpException) {
      const response = error.getResponse();
      const message =
        typeof response === 'string'
          ? response
          : typeof response === 'object' &&
              response !== null &&
              'message' in response
            ? response.message
            : error.message;

      return new RpcException({
        statusCode: error.getStatus(),
        message,
      });
    }

    return new RpcException({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Ürün servisinde beklenmeyen bir hata oluştu',
    });
  }
}
