export abstract class AppError extends Error {
    readonly #statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.#statusCode = statusCode;
        Object.setPrototypeOf(this, new.target.prototype);
    }

    get statusCode(): number {
        return this.#statusCode;
    }
}

export class NotFoundError extends AppError {
    constructor(recurso = 'Recurso') {
        super(`${recurso} não encontrado(a).`, 404);
    }
}

export class ConflictError extends AppError {
    constructor(mensagem: string) {
        super(mensagem, 409);
    }
}

export class ValidationError extends AppError {
    constructor(mensagem: string) {
        super(mensagem, 400);
    }
}

export class UnauthorizedError extends AppError {
    constructor(mensagem = 'Autenticação necessária ou credenciais inválidas.') {
        super(mensagem, 401);
    }
}

export class ForbiddenError extends AppError {
    constructor(mensagem = 'Acesso não autorizado para o seu perfil.') {
        super(mensagem, 403);
    }
}
