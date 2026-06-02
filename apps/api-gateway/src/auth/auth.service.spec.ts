import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  const authClientMock = {
    send: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: 'AUTH_SERVICE',
          useValue: authClientMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return sanitized profile', async () => {
    authClientMock.send.mockReturnValue(
      of({
        id: 1,
        email: 'user@example.com',
      }),
    );

    await expect(service.getProfile(1)).resolves.toEqual({
      id: 1,
      email: 'user@example.com',
    });
  });

  it('should map rpc errors to http exceptions', async () => {
    authClientMock.send.mockReturnValue(
      throwError(() => ({
        statusCode: 401,
        message: 'Geçersiz kullanıcı bilgileri',
      })),
    );

    await expect(service.login('user@example.com', 'secret123')).rejects.toMatchObject({
      status: 401,
      message: 'Geçersiz kullanıcı bilgileri',
    });
  });
});
