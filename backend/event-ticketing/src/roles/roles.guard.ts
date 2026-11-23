import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { ROLES_KEY } from '../common/decorator/roles.decorator.js';
import { Roles } from './roles.enum.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector){}
  canActivate(
    context: ExecutionContext,
  ): boolean {
    console.log('RolesGuard is running...');
    const requiredRoles = this.reflector.getAllAndOverride<Roles[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    console.log('Required roles:', JSON.stringify(requiredRoles));

    if(!requiredRoles){
      return true;
    }
  
    const {user } = context.switchToHttp().getRequest();

        console.log('user :', JSON.stringify(user));

    if(!user) throw new ForbiddenException();
    return requiredRoles.some((role) => user.role?.includes(role))

  }
}
