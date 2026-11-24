import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class TicketTypeDto {
    @IsString()
    @IsNotEmpty()
    @Max(100)
    name: string;

    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @Type(() => Number)
    price: number;

    @IsNumber()
    @Min(1)
    @Type(() => Number)
    quantity: number;
}

export class CreateEventDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsString()
    @IsNotEmpty()
    venue: string;

    @IsDateString()
    @IsNotEmpty()
    startTime: string;

    @IsDateString()
    @IsNotEmpty()
    endTime: string;

    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @Type(() => Number)
    ticketPrice: number;

    @IsNumber()
    @Min(1)
    @Type(() => Number)
    totalQuantity: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(50)
    @Type(() => Number)
    maxPerOrder?: number = 10;

    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => TicketTypeDto)
    ticketTypes?: TicketTypeDto[];
}