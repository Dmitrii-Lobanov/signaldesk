import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { WorkspaceMembership } from './workspaces/workspace-membership.entity.js';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: getRepositoryToken(WorkspaceMembership),
          useValue: { find: async () => [] },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('returns the public root response', () => {
    expect(appController.getHello()).toBe('Hello World!');
  });
});