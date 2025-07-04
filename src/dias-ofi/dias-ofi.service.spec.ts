import { Test, TestingModule } from '@nestjs/testing';
import { DiasOfiService } from './dias-ofi.service';

describe('DiasOfiService', () => {
  let service: DiasOfiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DiasOfiService],
    }).compile();

    service = module.get<DiasOfiService>(DiasOfiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
