'use strict';
import { StatusCodes, ReasonPhrases } from 'http-status-codes';

export const SuccessCodes = {
    OK: '2000',
    CREATED: '2010',
    SIGNUP_SUCCESS: '2011',
    LOGIN_SUCCESS: '2001',
    TOKEN_REFRESHED: '2002',
    LOGOUT_SUCCESS: '2003'
};

export const ReasonStatusCode = {
    OK: ReasonPhrases.OK,
    CREATED: ReasonPhrases.CREATED,
    SIGNUP_SUCCESS: 'User registered successfully',
    LOGIN_SUCCESS: 'Login successful',
    TOKEN_REFRESHED: 'Token refreshed successfully',
    LOGOUT_SUCCESS: 'User logged out successfully'
};

export class SuccessResponse {
    constructor({ message = ReasonStatusCode.OK, statusCode = StatusCodes.OK, metadata = {}, reasonCode = SuccessCodes.OK } = {}) {
        this.success = true;
        this.statusCode = statusCode;
        this.message = message;
        this.metadata = metadata;
        this.reasonCode = reasonCode;
    }
    send(res) {
        return res.status(this.statusCode).json({
            success: this.success,
            statusCode: this.statusCode,
            message: this.message,
            metadata: this.metadata,
            reasonCode: this.reasonCode
        });
    }
}

export class OK extends SuccessResponse {
    constructor({ message = ReasonStatusCode.OK, metadata = {}, reasonCode = SuccessCodes.OK } = {}) {
        super({ message, statusCode: StatusCodes.OK, metadata, reasonCode });
    }
}

export class CREATED extends SuccessResponse {
    constructor({ message = ReasonStatusCode.CREATED, metadata = {}, reasonCode = SuccessCodes.CREATED } = {}) {
        super({ message, statusCode: StatusCodes.CREATED, metadata, reasonCode });
    }
}

export class SignupSuccess extends CREATED {
    constructor({ metadata = {} } = {}) {
        super({ message: ReasonStatusCode.SIGNUP_SUCCESS, metadata, reasonCode: SuccessCodes.SIGNUP_SUCCESS });
    }
}
export class LoginSuccess extends OK {
    constructor({ metadata = {} } = {}) {
        super({ message: ReasonStatusCode.LOGIN_SUCCESS, metadata, reasonCode: SuccessCodes.LOGIN_SUCCESS });
    }
}
export class TokenRefreshed extends OK {
    constructor({ metadata = {} } = {}) {
        super({ message: ReasonStatusCode.TOKEN_REFRESHED, metadata, reasonCode: SuccessCodes.TOKEN_REFRESHED });
    }
}
export class LogoutSuccess extends OK {
    constructor({ metadata = {} } = {}) {
        super({ message: ReasonStatusCode.LOGOUT_SUCCESS, metadata, reasonCode: SuccessCodes.LOGOUT_SUCCESS });
    }
}

export const ErrorCodes = {
    BAD_REQUEST: '4000',
    UNAUTHORIZED: '4010',
    FORBIDDEN: '4030',
    NOT_FOUND: '4040',
    CONFLICT: '4090',
    TOKEN_EXISTS: '4091',
    USERNAME_EXISTS: '4092',
    EMAIL_EXISTS: '4093',
    USER_NOT_FOUND: '4041',
    USER_IDENTITY_NOT_FOUND: '4042',
    USER_ROLE_NOT_FOUND: '4043',
    USER_PROFILE_NOT_FOUND: '4044',
    INTERNAL_SERVER_ERROR: '5000',
    INVALID_REFRESH_TOKEN: '4011',
    RSA_GENERATION_FAILED: '5002',
    JWT_SIGN_FAILED: '5003'
};

export class ErrorResponse extends Error {
    constructor(message, statusCode = StatusCodes.INTERNAL_SERVER_ERROR, errorCode = ErrorCodes.INTERNAL_SERVER_ERROR) {
        super(message);
        this.statusCode = statusCode;
        this.success = false;
        this.errorCode = errorCode;
    }
    send(res) {
        return res.status(this.statusCode).json({
            success: this.success,
            statusCode: this.statusCode,
            message: this.message,
            errorCode: this.errorCode
        });
    }
    toJSON() {
        return {
            success: this.success,
            statusCode: this.statusCode,
            message: this.message,
            errorCode: this.errorCode
        };
    }
}

export class BadRequestError extends ErrorResponse {
    constructor(message = ReasonPhrases.BAD_REQUEST, errorCode = ErrorCodes.BAD_REQUEST) {
        super(message, StatusCodes.BAD_REQUEST, errorCode);
    }
}
export class UnauthorizedError extends ErrorResponse {
    constructor(message = ReasonPhrases.UNAUTHORIZED, errorCode = ErrorCodes.UNAUTHORIZED) {
        super(message, StatusCodes.UNAUTHORIZED, errorCode);
    }
}
export class InvalidRefreshTokenError extends ErrorResponse {
    constructor(message = 'Invalid refresh token', errorCode = ErrorCodes.INVALID_REFRESH_TOKEN) {
        super(message, StatusCodes.UNAUTHORIZED, errorCode);
    }
}
export class ForbiddenError extends ErrorResponse {
    constructor(message = ReasonPhrases.FORBIDDEN, errorCode = ErrorCodes.FORBIDDEN) {
        super(message, StatusCodes.FORBIDDEN, errorCode);
    }
}
export class NotFoundError extends ErrorResponse {
    constructor(message = ReasonPhrases.NOT_FOUND, errorCode = ErrorCodes.NOT_FOUND) {
        super(message, StatusCodes.NOT_FOUND, errorCode);
    }
}
export class ConflictRequestError extends ErrorResponse {
    constructor(message = ReasonPhrases.CONFLICT, errorCode = ErrorCodes.CONFLICT) {
        super(message, StatusCodes.CONFLICT, errorCode);
    }
}
export class UsernameExistsError extends ErrorResponse {
    constructor(message = 'Username already exists', errorCode = ErrorCodes.USERNAME_EXISTS) {
        super(message, StatusCodes.CONFLICT, errorCode);
    }
}
export class EmailExistsError extends ErrorResponse {
    constructor(message = 'Email already exists', errorCode = ErrorCodes.EMAIL_EXISTS) {
        super(message, StatusCodes.CONFLICT, errorCode);
    }
}
export class UserNotFoundError extends ErrorResponse {
    constructor(message = 'User not found', errorCode = ErrorCodes.USER_NOT_FOUND) {
        super(message, StatusCodes.NOT_FOUND, errorCode);
    }
}
export class UserIdentityNotFoundError extends ErrorResponse {
    constructor(message = 'User identity not found', errorCode = ErrorCodes.USER_IDENTITY_NOT_FOUND) {
        super(message, StatusCodes.NOT_FOUND, errorCode);
    }
}
export class UserRoleNotFoundError extends ErrorResponse {
    constructor(message = 'User role not found', errorCode = ErrorCodes.USER_ROLE_NOT_FOUND) {
        super(message, StatusCodes.NOT_FOUND, errorCode);
    }
}
export class TokenExistsError extends ErrorResponse {
    constructor(message = 'Token already exists', errorCode = ErrorCodes.TOKEN_EXISTS) {
        super(message, StatusCodes.CONFLICT, errorCode);
    }
}
export class InternalServerError extends ErrorResponse {
    constructor(message = ReasonPhrases.INTERNAL_SERVER_ERROR, errorCode = ErrorCodes.INTERNAL_SERVER_ERROR) {
        super(message, StatusCodes.INTERNAL_SERVER_ERROR, errorCode);
    }
}
export class RsaKeyGenerationError extends ErrorResponse {
    constructor(message = 'Failed to generate RSA key', errorCode = ErrorCodes.RSA_GENERATION_FAILED) {
        super(message, StatusCodes.INTERNAL_SERVER_ERROR, errorCode);
    }
}
export class JwtSignError extends ErrorResponse {
    constructor(message = 'JWT signing failed', errorCode = ErrorCodes.JWT_SIGN_FAILED) {
        super(message, StatusCodes.INTERNAL_SERVER_ERROR, errorCode);
    }
}
