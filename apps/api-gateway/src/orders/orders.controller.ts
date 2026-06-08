import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { PayOrderDto } from './dto/pay-order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('Sipariş oluşturuldu')
  create(
    @Body() createOrderDto: CreateOrderDto,
    @Req() req: { user: { userId: number } },
  ) {
    return this.ordersService.create(createOrderDto, req.user.userId);
  }

  @Get()
  @ResponseMessage('Kullanıcının siparişleri listelendi')
  findMine(@Req() req: { user: { userId: number } }) {
    return this.ordersService.findMine(req.user.userId);
  }

  @Get(':id')
  @ResponseMessage('Sipariş getirildi')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: { user: { userId: number } },
  ) {
    return this.ordersService.findOne(id, req.user.userId);
  }

  @Post(':id/pay')
  @HttpCode(HttpStatus.ACCEPTED)
  @ResponseMessage('Sipariş ödeme süreci başlatıldı')
  pay(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: PayOrderDto,
    @Req() req: { user: { userId: number } },
  ) {
    return this.ordersService.pay(id, body, req.user.userId);
  }
}
