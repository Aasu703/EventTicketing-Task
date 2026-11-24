import { Type } from "class-transformer";
import { IsInt, Min } from "class-validator";

export class CreateOrderDto {
    @IsInt()
    @Min(1)
    @Type(() => Number)
    eventId: number;

    @IsInt()
    @Min(1)
    @Type(() => Number)
    ticketTypeId: number;

    @IsInt()
    @Min(1)
    @Type(() => Number)
    quantity: number;
}