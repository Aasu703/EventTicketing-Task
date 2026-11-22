import { Controller, Get, UseGuards, Request } from '@nestjs/common';

@Controller('dashboard')
export class DashboardController {
   
    @Get() 
    getDashboard() {
        return 'Dashboard';
    }
} 
    
