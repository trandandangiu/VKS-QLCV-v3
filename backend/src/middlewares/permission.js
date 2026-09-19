// backend/src/middlewares/permission.js
import prisma from '../config/prisma.js';

export function requirePermission(...requiredPermissions) {
  return async (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Chưa đăng nhập',
        });
      }

      // Lấy tất cả permissions của user
      const userRoles = await prisma.userRole.findMany({
        where: { userId: user.id },
        include: {
          role: {
            include: {
              rolePermissions: {
                include: { permission: true },
              },
            },
          },
        },
      });

      const permissions = new Set();
      userRoles.forEach(ur => {
        ur.role.rolePermissions.forEach(rp => {
          permissions.add(rp.permission.code);
        });
      });

      // Check có ĐỦ permissions không
      const hasAll = requiredPermissions.every(p => permissions.has(p));

      if (!hasAll) {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền truy cập',
          required: requiredPermissions,
        });
      }

      req.user.permissions = Array.from(permissions);
      next();
    } catch (err) {
      next(err);
    }
  };
}