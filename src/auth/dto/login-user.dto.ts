import { IsString, IsStrongPassword } from "class-validator";

export class LoginUserDto {
    @IsString()
    email: string;

    @IsString()
    @IsStrongPassword() // este es para asegurar que la contraseña sea fuerte, puedes ajustar las opciones según tus necesidades
    password: string;
}