import {IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength} from 'class-validator';
import { Match } from '../../common/decorator/match.decorator.js';
import { Role } from '../../common/decorator/roles.decorator.js';
import { Roles } from '../../roles/roles.enum.js';


export class CreateUserDto {

    @IsString()
    @IsNotEmpty()
    username: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^9[78][0-9]{8}$/, { message: 'phoneNumber must be a valid phone number' })
    phoneNumber: string;


    @IsString()
    @MinLength(8, {message: 'Password must be at least 8 characters long'})
    @MaxLength(32, {message: 'Password cannot exceed 32 characters long'})
    @IsNotEmpty()
    password: string;

    @IsString()
    @IsNotEmpty()
    @Match('password', {message: 'Passwords do not match'})
    confirmPassword: string;

    @IsEnum(Roles)
    @IsOptional()
    role: Roles;

}