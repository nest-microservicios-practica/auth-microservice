import { IsString, IsStrongPassword } from "class-validator";

export class RegisterUserDto {
    // se le debe colocar tamaño maximo y minimo a cada campo, pero por simplicidad lo dejaremos asi
    @IsString()
    name: string;

    @IsString()
    email: string;

    @IsString()
    @IsStrongPassword() // este es para asegurar que la contraseña sea fuerte, puedes ajustar las opciones según tus necesidades
    password: string;
}