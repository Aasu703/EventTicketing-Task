import { IsOptional, IsPositive } from "class-validator"
import { Type } from "class-transformer"

export class PaginationQueryDto {
    @IsOptional()
    @IsPositive()

    limit: number // how many items per page 10, 20....

    @IsOptional()
    @IsPositive()

    page: number // in 1 page
}