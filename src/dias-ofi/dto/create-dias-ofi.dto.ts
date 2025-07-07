export class CreateUserDto {
    nombre: string;
    email: string;
    password: string;
    createdAt: Date;
    meta?: number;
}

export class CreateDiaOficinDto {
    email: string;
    fechas: string[];
}
