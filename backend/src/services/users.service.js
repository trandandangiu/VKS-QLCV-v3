// backend/src/services/users.service.js
import bcrypt from 'bcrypt';
import prisma from '../config/prisma.js';

// Mật khẩu mặc định
const DEFAULT_PASSWORD = 'vks@2026';

// Role cần department
const ROLES_REQUIRE_DEPARTMENT = ['TRUONG_PHONG'];

export const usersService = {
  // ============================================
  // 1. LẤY DANH SÁCH USERS
  // ============================================
  async getUsers(currentUser, filters = {}) {
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,  // ← ĐÃ BỊ XÓA
    };
    // 1.1. Filter theo permission
    const perms = currentUser.permissions || [];

    if (perms.includes('user:view:all')) {
      // Admin, VT: xem tất cả
    } else if (perms.includes('user:view:department')) {
      // PVT: xem user trong phòng phụ trách
      const managedDepts = await prisma.department.findMany({
        where: { pvtManagerId: currentUser.id },
        select: { id: true },
      });
      const deptIds = managedDepts.map(d => d.id);

      if (deptIds.length > 0) {
        where.OR = [
          { departmentId: { in: deptIds } },
          { id: currentUser.id },  // Chính mình
        ];
      } else {
        where.id = currentUser.id;
      }
    } else {
      // TP: chỉ xem chính mình
      where.id = currentUser.id;
    }

    // 1.2. Filter theo query
    if (filters.search) {
      const search = filters.search;
      const searchOR = [
        { username: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];

      // Gộp với filter permission
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchOR }];
        delete where.OR;
      } else {
        where.OR = searchOR;
      }
    }

    if (filters.role) {
      where.userRoles = {
        some: { role: { code: filters.role } },
      };
    }

    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }

    if (filters.active !== undefined) {
      where.active = filters.active === 'true';
    }

    // 1.3. Query
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          fullName: true,
          email: true,
          phone: true,
          avatarUrl: true,
          position: true,
          active: true,
          lastLoginAt: true,
          createdAt: true,
          department: {
            select: { id: true, code: true, name: true },
          },
          manager: {
            select: { id: true, username: true, fullName: true },
          },
          userRoles: {
            include: {
              role: {
                select: { id: true, code: true, name: true, level: true },
              },
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);


    // 1.4. Format — thêm `role` string từ roles[0]
    const formatted = users.map(u => {
      const roles = u.userRoles.map(ur => ur.role);
      const primaryRole = roles[0]?.code || 'TRUONG_PHONG';

      return {
        ...u,
        roles,
        role: primaryRole,              // ← THÊM: string cho FE dùng
        userRoles: undefined,
      };
    });

    return {
      users: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // ============================================
  // 2. LẤY CHI TIẾT USER
  // ============================================
  async getUserById(userId, currentUser) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: true,
        manager: {
          select: { id: true, username: true, fullName: true },
        },
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

    if (!user || user.deletedAt) {
      throw { status: 404, message: 'Không tìm thấy user' };
    }

    // 2.1. Check quyền xem
    const perms = currentUser.permissions || [];

    if (!perms.includes('user:view:all')) {
      if (perms.includes('user:view:department')) {
        // PVT: chỉ xem user trong phòng phụ trách
        const managedDepts = await prisma.department.findMany({
          where: { pvtManagerId: currentUser.id },
          select: { id: true },
        });
        const deptIds = managedDepts.map(d => d.id);

        const canView =
          user.id === currentUser.id ||
          deptIds.includes(user.departmentId);

        if (!canView) {
          throw { status: 403, message: 'Không có quyền xem user này' };
        }
      } else {
        // TP: chỉ xem chính mình
        if (user.id !== currentUser.id) {
          throw { status: 403, message: 'Không có quyền xem user này' };
        }
      }
    }

    const roles = user.userRoles.map(ur => ur.role.code);
    const permissions = new Set();
    user.userRoles.forEach(ur => {
      ur.role.rolePermissions.forEach(rp => {
        permissions.add(rp.permission.code);
      });
    });

    const { passwordHash, totpSecret, userRoles, ...userSafe } = user;

    return {
      ...userSafe,
      roles,
      permissions: Array.from(permissions),
    };
  },

  // ============================================
  // 3. TẠO USER
  // ============================================
  async createUser(data, currentUser) {
    const {
      username, password, fullName, email, phone,
      position, departmentId, managerId, roleIds,
      role: roleCode,
      roomCode,
    } = data;

    // 3.1. Check username trùng
    const existing = await prisma.user.findUnique({
      where: { username: username.trim() },
    });

    if (existing) {
      throw { status: 400, message: 'Username đã tồn tại' };
    }

    // 3.2. Check email trùng
    if (email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });
      if (emailExists) {
        throw { status: 400, message: 'Email đã tồn tại' };
      }
    }

    // 3.3. Xác định roleIds — từ roleIds array HOẶC role code
    let finalRoleIds = roleIds;

    if ((!finalRoleIds || finalRoleIds.length === 0) && roleCode) {
      const roleObj = await prisma.role.findUnique({
        where: { code: roleCode },
      });
      if (!roleObj) {
        throw { status: 400, message: `Vai trò "${roleCode}" không tồn tại` };
      }
      finalRoleIds = [roleObj.id];
    }

    if (!finalRoleIds || finalRoleIds.length === 0) {
      throw { status: 400, message: 'Phải chọn ít nhất 1 vai trò' };
    }

    // 3.3b. Check roles tồn tại
    const roles = await prisma.role.findMany({
      where: { id: { in: finalRoleIds }, active: true },
    });

    if (roles.length !== finalRoleIds.length) {
      throw { status: 400, message: 'Một số role không tồn tại' };
    }

    // 3.3c. Xác định departmentId — từ departmentId HOẶC roomCode
    let finalDeptId = departmentId;

    if (!finalDeptId && roomCode) {
      const dept = await prisma.department.findUnique({
        where: { code: roomCode },
      });
      if (dept) finalDeptId = dept.id;
    }

    // 3.4. Validate: role TRUONG_PHONG cần departmentId
    const hasTpRole = roles.some(r => r.code === 'TRUONG_PHONG');
    if (hasTpRole && !finalDeptId) {
      throw {
        status: 400,
        message: 'User có vai trò Trưởng phòng phải được gán vào phòng',
      };
    }

    // 3.5. Check department tồn tại
    if (finalDeptId) {
      const dept = await prisma.department.findUnique({
        where: { id: finalDeptId },
      });
      if (!dept) {
        throw { status: 400, message: 'Phòng ban không tồn tại' };
      }
    }

    // 3.6. Hash password
    const finalPassword = password || DEFAULT_PASSWORD;
    const passwordHash = await bcrypt.hash(finalPassword, 10);

    // 3.7. Tạo user + gán roles
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: username.trim(),
          passwordHash,
          fullName: fullName.trim(),
          email: email || null,
          phone: phone || null,
          position: position || null,
          departmentId: finalDeptId || null,
          managerId: managerId || null,
          active: true,
        },
      });

      // Gán roles
      await tx.userRole.createMany({
        data: finalRoleIds.map(roleId => ({
          userId: user.id,
          roleId,
          assignedBy: currentUser.id,
        })),
      });

      // Ghi audit log
      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          userName: currentUser.fullName,
          action: 'CREATE_USER',
          entityType: 'user',
          entityId: user.id,
          newValue: { username, fullName, roleIds: finalRoleIds },
        },
      });

      return user;
    });

    const { passwordHash: _, ...userSafe } = newUser;
    return userSafe;
  },

  // ============================================
  // 4. CẬP NHẬT USER
  // ============================================
  async updateUser(userId, data, currentUser) {
    // 4.1. Check user tồn tại
    const existing = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existing || existing.deletedAt) {
      throw { status: 404, message: 'Không tìm thấy user' };
    }

    // 4.2. Check quyền sửa
    const perms = currentUser.permissions || [];

    if (!perms.includes('user:update:all')) {
      if (perms.includes('user:update:own')) {
        if (userId !== currentUser.id) {
          throw { status: 403, message: 'Không có quyền sửa user này' };
        }
      } else {
        throw { status: 403, message: 'Không có quyền sửa user' };
      }
    }

    // 4.3. Build update data
    const updateData = {};
    const allowedFields = [
      'fullName', 'email', 'phone', 'avatarUrl',
      'position', 'departmentId', 'managerId', 'active',
    ];

    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });

    // 4.4. Update
    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: updateData,
      });

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          userName: currentUser.fullName,
          action: 'UPDATE_USER',
          entityType: 'user',
          entityId: userId,
          oldValue: { fullName: existing.fullName, phone: existing.phone },
          newValue: updateData,
        },
      });

      return user;
    });

    const { passwordHash, totpSecret, ...userSafe } = updated;
    return userSafe;
  },

  // ============================================
  // 5. XÓA USER (SOFT DELETE + GIẢI PHÓNG UNIQUE)
  // ============================================
  async deleteUser(userId, currentUser) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: { include: { role: true } },
      },
    });

    if (!user || user.deletedAt) {
      throw { status: 404, message: 'Không tìm thấy user' };
    }

    if (userId === currentUser.id) {
      throw { status: 400, message: 'Không thể xóa chính mình' };
    }

    if (user.username === 'admin') {
      throw { status: 400, message: 'Không thể xóa tài khoản Admin' };
    }

    // Không xóa admin cuối cùng
    const isTargetAdmin = user.userRoles.some(ur => ur.role.code === 'ADMIN');
    if (isTargetAdmin) {
      const adminCount = await prisma.user.count({
        where: {
          deletedAt: null,
          userRoles: { some: { role: { code: 'ADMIN' } } },
        },
      });
      if (adminCount <= 1) {
        throw {
          status: 400,
          message: 'Không thể xóa quản trị viên cuối cùng của hệ thống',
        };
      }
    }

    // 🔑 KEY: Tạo suffix để "nhả" unique constraint
    //    Dùng timestamp để không bao giờ trùng, kể cả xóa cùng user 2 lần
    const stamp = Date.now();
    const deletedUsername = `${user.username}__deleted_${stamp}`;
    const deletedEmail = user.email
      ? `${user.email}__deleted_${stamp}`
      : null;

    // Cắt bớt nếu vượt quá giới hạn cột (VD username max 50 ký tự)
    // Nếu schema của bạn không giới hạn → có thể bỏ đoạn này
    const MAX_USERNAME_LEN = 100;
    const MAX_EMAIL_LEN = 200;
    const finalUsername =
      deletedUsername.length > MAX_USERNAME_LEN
        ? deletedUsername.slice(0, MAX_USERNAME_LEN - 20) + `__d_${stamp}`
        : deletedUsername;
    const finalEmail =
      deletedEmail && deletedEmail.length > MAX_EMAIL_LEN
        ? deletedEmail.slice(0, MAX_EMAIL_LEN - 20) + `__d_${stamp}`
        : deletedEmail;

    // Soft delete + đổi username/email để nhả unique
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          active: false,
          deletedAt: new Date(),

          // ⭐ QUAN TRỌNG: đổi để giải phóng unique
          username: finalUsername,
          email: finalEmail,

          // Bonus: đổi fullName để hiển thị rõ trong log (nếu muốn)
          // fullName: `${user.fullName} (đã xóa ${new Date().toLocaleDateString('vi-VN')})`,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          userName: currentUser.fullName,
          action: 'DELETE_USER',
          entityType: 'user',
          entityId: userId,
          oldValue: {
            username: user.username,
            email: user.email,
            fullName: user.fullName,
          },
          newValue: {
            username: finalUsername,
            email: finalEmail,
            deletedAt: new Date().toISOString(),
          },
        },
      });
    });

    return {
      success: true,
      message: `Đã xóa tài khoản "${user.fullName}". ` +
        `Username "${user.username}" và email đã được giải phóng, ` +
        `có thể tạo lại.`,
    };
  },

  // ============================================
  // 6. GÁN ROLES CHO USER
  // ============================================
  async assignRoles(userId, roleIds, currentUser) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.deletedAt) {
      throw { status: 404, message: 'Không tìm thấy user' };
    }

    if (!roleIds || roleIds.length === 0) {
      throw { status: 400, message: 'Phải chọn ít nhất 1 role' };
    }

    // Check roles tồn tại
    const roles = await prisma.role.findMany({
      where: { id: { in: roleIds } },
    });

    if (roles.length !== roleIds.length) {
      throw { status: 400, message: 'Một số role không tồn tại' };
    }

    // Validate TP cần department
    const hasTpRole = roles.some(r => r.code === 'TRUONG_PHONG');
    if (hasTpRole && !user.departmentId) {
      throw {
        status: 400,
        message: 'User có vai trò Trưởng phòng phải được gán vào phòng trước',
      };
    }

    // Transaction
    await prisma.$transaction(async (tx) => {
      // Xóa roles cũ
      await tx.userRole.deleteMany({ where: { userId } });

      // Gán roles mới
      await tx.userRole.createMany({
        data: roleIds.map(roleId => ({
          userId,
          roleId,
          assignedBy: currentUser.id,
        })),
      });

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          userName: currentUser.fullName,
          action: 'ASSIGN_ROLES',
          entityType: 'user',
          entityId: userId,
          newValue: { roleIds },
        },
      });
    });

    return { success: true, message: 'Đã cập nhật vai trò' };
  },

  // ============================================
  // 7. RESET PASSWORD
  // ============================================
  async resetPassword(userId, newPassword, currentUser) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.deletedAt) {
      throw { status: 404, message: 'Không tìm thấy user' };
    }

    // Password mới = default hoặc admin nhập
    const finalPassword = newPassword || DEFAULT_PASSWORD;
    const passwordHash = await bcrypt.hash(finalPassword, 10);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          // Reset TOTP khi đổi password
          totpSecret: null,
          totpEnabled: false,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          userName: currentUser.fullName,
          action: 'RESET_PASSWORD',
          entityType: 'user',
          entityId: userId,
        },
      });
    });

    return {
      success: true,
      message: `Đã reset mật khẩu cho "${user.fullName}". Mật khẩu mới: ${finalPassword}`,
      newPassword: finalPassword,
    };
  },

  // ============================================
  // 8. KHÓA / MỞ KHÓA USER
  // ============================================
  async toggleActive(userId, currentUser) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw { status: 404, message: 'Không tìm thấy user' };
    }

    if (userId === currentUser.id) {
      throw { status: 400, message: 'Không thể khóa chính mình' };
    }

    if (user.username === 'admin') {
      throw { status: 400, message: 'Không thể khóa tài khoản Admin' };
    }

    const newActive = !user.active;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { active: newActive },
      });

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          userName: currentUser.fullName,
          action: newActive ? 'UNLOCK_USER' : 'LOCK_USER',
          entityType: 'user',
          entityId: userId,
        },
      });
    });

    return {
      success: true,
      message: newActive
        ? `Đã mở khóa tài khoản "${user.fullName}"`
        : `Đã khóa tài khoản "${user.fullName}"`,
      active: newActive,
    };
  },
};