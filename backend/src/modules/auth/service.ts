import db from "../../config/db";
import { hashPassword, verifyPassword } from "../../utils/password";
import {
  AuthenticationError,
  NotFoundError,
  ValidationError,
} from "../../utils/errors";
import { passwordResetConfig } from "../../config/jwt";

export class AuthService {
  /**
   * Login user with username/email and password
   */
  static async login(
    usernameOrEmail: string,
    password: string
  ) {

    // Find user by username or email
    const user = await db.user.findFirst({
      where: {
        OR: [
          { username: usernameOrEmail },
          { email: usernameOrEmail },
        ],
        deletedAt: null,
      },
      include: {
        role: true,
      },
    });

    if (!user) {
      throw new AuthenticationError("Invalid username/email or password");
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AuthenticationError("Account is inactive. Please contact administrator");
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new AuthenticationError("Invalid username/email or password");
    }

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: {
          id: user.role.id,
          roleCode: user.role.roleCode,
          roleName: user.role.roleName,
        },
      },
    };
  }

  /**
   * Request password reset (forgot password)
   */
  static async forgotPassword(email: string) {
    // Find user by email
    const user = await db.user.findFirst({
      where: {
        email,
        deletedAt: null,
        isActive: true,
      },
    });

    // Always return success message
    if (user) {
      // Generate reset token using crypto
      const array = new Uint8Array(passwordResetConfig.tokenLength);
      crypto.getRandomValues(array);
      const token = Array.from(array)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
      const expiresAt = new Date(
        Date.now() + passwordResetConfig.tokenExpiresIn
      );

      // Invalidate any existing tokens for this user
      await db.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          used: false,
        },
        data: {
          used: true,
        },
      });

      // Create new reset token
      await db.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      });

      // TODO: Send email with reset link
      // await sendPasswordResetEmail(user.email, token);
      console.log(`Password reset token for ${email}: ${token}`);
    }

    return {
      message:
        "If an account with that email exists, a password reset link has been sent.",
    };
  }

  /**
   * Reset password with token
   */
  static async resetPassword(
    token: string,
    newPassword: string,
    confirmPassword: string
  ) {
    // Validate passwords match
    if (newPassword !== confirmPassword) {
      throw new ValidationError("Passwords do not match");
    }

    // Find valid reset token
    const resetToken = await db.passwordResetToken.findFirst({
      where: {
        token,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    if (!resetToken) {
      throw new ValidationError(
        "Invalid or expired reset token. Please request a new one."
      );
    }

    // Check if user is active
    if (!resetToken.user.isActive) {
      throw new AuthenticationError("Account is inactive");
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update user password
    await db.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });

    // Mark token as used
    await db.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    });

    return {
      message: "Password has been reset successfully",
    };
  }

  /**
   * Get user profile by ID
   */
  static async getUserProfile(userId: string) {
    const user = await db.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      include: {
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: {
        id: user.role.id,
        roleCode: user.role.roleCode,
        roleName: user.role.roleName,
      },
      isActive: user.isActive,
      lastLogin: user.lastLogin?.toISOString() || null,
      stationId: user.stationId,
    };
  }
}

