import {IsEmail, IsNotEmpty, IsNumber, IsString, Max, MaxLength, Min, MinLength} from 'class-validator';
import { Match } from '../common/decorators/match.decorator.js';

export class CreateUserDto {

    @IsString()
    @IsNotEmpty()
    username: string;

    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    @Max(9999999999)
    phoneNumber: number;


    @IsString()
    @MinLength(8, {message: 'Password must be at least 8 characters long'})
    @MaxLength(32, {message: 'Password cannot exceed 32 characters long'})
    @IsNotEmpty()
    password: string;

    @IsString()
    @IsNotEmpty()
    @Match('password', {message: 'Passwords do not match'})
    confirmPassword: string;

}