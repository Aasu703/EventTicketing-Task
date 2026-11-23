import { IsDate, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { PaginationQueryDto } from "../../common/pagination/pagination-query.dto.js";

export class PublicEventDto extends PaginationQueryDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsDate()
    startFrom?: Date;

    @IsOptional()
    @IsDate()
    startTo?: Date;

    @IsOptional()
    @IsNumber()
    @Min(0)
    minPrice?: number;
    
    @IsOptional()
    @IsNumber()
    @Min(0)
    maxPrice?: number;
}