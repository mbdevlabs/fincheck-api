import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { IsPublic } from 'src/shared/decorators/IsPublic';
import { AuthService } from './auth.service';
import { SigninDto } from './dto/signin';
import { SignupDto } from './dto/signup';

@ApiTags('Auth')
@IsPublic()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signin')
  @ApiOperation({ summary: 'Sign in with email and password' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  signin(@Body() signinDto: SigninDto) {
    return this.authService.signin(signinDto);
  }

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiConflictResponse({ description: 'Email already in use' })
  create(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }
}
