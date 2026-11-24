import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsString, Max, Min } from "class-validator";

export class TicketTypeDto {
    @IsString()
    @IsNotEmpty()
    @Max(100)
    name: string;

    @IsNumber({ maxDecimalPlaces: 2})
    @Min(0)
    @Type(() => Number)
    price: number;
}