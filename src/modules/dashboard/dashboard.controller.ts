import { Controller, Get } from '@nestjs/common';

import { DashboardService } from './dashboard.service';
import { UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
    constructor(
        private readonly dashboardService: DashboardService,
    ) { }

    @Get()
    getDashboard() {
        return this.dashboardService.getDashboard();
    }
}