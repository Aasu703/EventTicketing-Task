import { CreateEventDto } from "./create.event.dto.js";
import { PartialType } from "@nestjs/mapped-types";
import { EventStatus } from "../../generated/prisma/client.js";
import { IsEnum, IsOptional } from "class-validator";

export class UpdateEventDto extends PartialType(CreateEventDto) {
    @IsOptional()
    @IsEnum(EventStatus)
    status? :EventStatus;
}

