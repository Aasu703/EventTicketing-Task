import { IsArray, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Roles } from '../../roles/roles.enum.js';

export class UpdateUserRoleDto {
  @ApiProperty({ 
    enum: Roles, 
    isArray: true, 
    example: ['ORGANIZER'],
    description: 'Array of roles to assign to user' 
  })
  @IsArray()
  @IsEnum(Roles, { each: true })
  roles: Roles[];
}