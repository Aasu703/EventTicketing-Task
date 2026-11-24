import { IsOptional, IsString } from "class-validator";

export class PayOrderDto {
    
    @IsString()
    @IsOptional()
    providerRef?: string;
    
    @IsString()
    @IsOptional()
    metadata?: string;
}