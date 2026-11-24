import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

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
startTime: Date;

@IsDateString()
endTime: Date;

@IsNumber({ maxDecimalPlaces: 2 })
@Min(0)
ticketPrice: number;

@IsNumber()
@Min(1)
totalQuantity: number;

@IsOptional()
@IsNumber()
@Min(1)
@Max(50)
maxPerOrder?: number = 10;

}


