import {
    Controller,
    Get,
    Query,
} from '@nestjs/common';

import { SearchService } from './search.service';
import { UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {

    constructor(
        private readonly searchService: SearchService,
    ) { }

    @Get()
    search(
        @Query('q') q: string,
    ) {
        return this.searchService.search(q);
    }

}