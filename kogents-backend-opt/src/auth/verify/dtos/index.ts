// General verification DTOs
export { VerificationType } from './send-otp.dto';
export { ConfirmOtpDto } from './confirm-otp.dto';

// Email-based verification DTOs  
export { SendOtpForSignupDto, ConfirmOtpForSignupDto } from './session-verification.dto';

// Session-based verification DTOs
export { SendOtpForSignupSessionDto, ConfirmOtpForSignupSessionDto } from './send-otp.dto';

// Password reset DTOs
export { RequestPasswordResetDto, ConfirmPasswordResetDto } from './password-reset.dto'; 