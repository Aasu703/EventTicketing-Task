import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";
import { Type } from "class-transformer";


export class CreateEventDto {
@IsString()
@IsNotEmpty()
@Max(255)
title: string;

@IsString()
@IsNotEmpty()
description: string;

@IsString()
@IsNotEmpty()
@Max(500)
venue: string;

@IsString()
@IsNotEmpty()
startTime: string;

@IsDateString()
endTime: string;

@IsNumber({ maxDecimalPlaces: 2 })
@Min(0)
@Type(() => Number)
ticketPrice: number;

@IsNumber()
@Min(1)
@Type(() => Number)
totalQuantity: number
;
@IsOptional()
@IsNumber()
@Min(1)
@Max(50)
@Type(() => Number)
maxPerOrder?: number = 10;
}

export class CreateTicketTypeDto {
    // FOR VIPS 
}

