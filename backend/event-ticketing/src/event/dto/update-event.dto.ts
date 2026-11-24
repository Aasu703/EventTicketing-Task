import { CreateEventDto } from "./create.event.dto.js";
import { PartialType } from "@nestjs/mapped-types";
import { IsOptional, IsEnum } from "class-validator";
import { EventStatus } from "@prisma/client";

export class UpdateEventDto extends PartialType(CreateEventDto) {
    @IsOptional()
    @IsEnum(EventStatus)
    status?: EventStatus;
}