import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  findByEmail(email: string) {
    return this.usersRepository.findOne({
      where: { email },
    });
  }

  findById(id: number) {
    return this.usersRepository.findOne({
      where: { id },
    });
  }

  create(email: string, password: string) {
    const user = this.usersRepository.create({
      email,
      password,
    });

    return this.usersRepository.save(user);
  }
}
