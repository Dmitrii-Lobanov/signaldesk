import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  AllowAnonymous,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';
import { Repository } from 'typeorm';
import { WorkspaceMembership } from './workspaces/workspace-membership.entity.js';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectRepository(WorkspaceMembership)
    private readonly memberships: Repository<WorkspaceMembership>,
  ) {}

  @Get()
  @AllowAnonymous()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('me')
  async getMe(@Session() session: UserSession) {
    const memberships = await this.memberships.find({
      where: { userId: session.user.id },
    });

    return {
      id: session.user.id,
      email: session.user.email,
      memberships: memberships.map(({ workspaceId, role }) => ({
        workspaceId,
        role,
      })),
    };
  }
}
