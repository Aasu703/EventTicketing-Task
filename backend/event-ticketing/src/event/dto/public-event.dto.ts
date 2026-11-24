import { IsDateString, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { Type } from "class-transformer";
import { PaginationQueryDto } from "../../common/pagination/pagination-query.dto.js";

export class PublicEventDto extends PaginationQueryDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsDateString()
    startFrom?: string;

    @IsOptional()
    @IsDateString()
    startTo?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    minPrice?: number;
    
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    maxPrice?: number;
}