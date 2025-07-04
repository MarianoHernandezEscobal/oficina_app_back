import { Test, TestingModule } from '@nestjs/testing';
import { DiasOfiController } from './dias-ofi.controller';
import { DiasOfiService } from './dias-ofi.service';

describe('DiasOfiController', () => {
  let controller: DiasOfiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DiasOfiController],
      providers: [DiasOfiService],
    }).compile();

    controller = module.get<DiasOfiController>(DiasOfiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
