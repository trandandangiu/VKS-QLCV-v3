// backend/src/middlewares/auth.js
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

export async function authenticate(req, res, next) {
  // ✅ Ưu tiên: Authorization header (Bearer token)
  // ✅ Fallback: cookie
  let token = null;

  // 1. Thử đọc từ header Authorization
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  }

  // 2. Nếu không có header → thử cookie
  if (!token) {
    token = req.cookies?.accessToken
         || req.cookies?.token
         || req.cookies?.jwt;
  }

  if (!token) {
    return res.status(401).json({    // ⭐ Đổi 400 → 401 cho đúng chuẩn
      success: false,
      message: 'Chưa đăng nhập',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Load user + roles + permissions từ DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.id || decoded.userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user || user.deletedAt || !user.active) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản không hợp lệ',
      });
    }

    // Build user object cho controller
    req.user = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      roles: user.userRoles.map(ur => ur.role.code),
      role: user.userRoles[0]?.role.code,
      permissions: Array.from(
        new Set(
          user.userRoles.flatMap(ur =>
            ur.role.rolePermissions.map(rp => rp.permission.code)
          )
        )
      ),
    };

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ hoặc đã hết hạn',
    });
  }
}


export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Chưa đăng nhập',
      });
    }

    const userRoles = req.user.roles || [];
    const hasRole = roles.some(r => userRoles.includes(r));

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập',
      });
    }

    next();
  };
}