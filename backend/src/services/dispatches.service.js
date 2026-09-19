// backend/src/services/dispatches.service.js
import prisma from '../config/prisma.js';

export const dispatchesService = {
  // ============================================
  // 1. LẤY DANH SÁCH (FILTER THEO ROLE)
  // ============================================
  async getDispatches(currentUser, filters = {}) {
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
    };

    // 1.1. Phân quyền
    const perms = currentUser.permissions || [];

    if (perms.includes('dispatch:view:all')) {
      // Admin, VT: xem tất cả
    } else if (perms.includes('dispatch:view:department')) {
      // PVT: xem công văn được giao cho mình
      where.dispatchPvts = {
        some: { pvtId: currentUser.id },
      };
    } else if (perms.includes('dispatch:view:assigned')) {
      // TP: xem công văn được giao
      where.dispatchTps = {
        some: { tpId: currentUser.id },
      };
    } else {
      // Mặc định: chỉ xem của mình
      where.OR = [
        { createdById: currentUser.id },
        { dispatchPvts: { some: { pvtId: currentUser.id } } },
        { dispatchTps: { some: { tpId: currentUser.id } } },
      ];
    }

    // 1.2. Filter theo query
    if (filters.search) {
      const searchOR = [
        { soCongVan: { contains: filters.search, mode: 'insensitive' } },
        { soCongVanTP: { contains: filters.search, mode: 'insensitive' } },
        { tenCongVan: { contains: filters.search, mode: 'insensitive' } },
        { donViBanHanh: { contains: filters.search, mode: 'insensitive' } },
      ];

      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchOR }];
        delete where.OR;
      } else if (where.dispatchPvts || where.dispatchTps) {
        where.AND = [searchOR];
        // Giữ dispatchPvts/Tps
      } else {
        where.OR = searchOR;
      }
    }

    if (filters.trangThai) {
      where.trangThai = filters.trangThai;
    }

    if (filters.mucDoKhan) {
      where.mucDoKhan = filters.mucDoKhan;
    }

    if (filters.assignedPvtId) {
      where.dispatchPvts = {
        ...where.dispatchPvts,
        some: {
          ...(where.dispatchPvts?.some || {}),
          pvtId: filters.assignedPvtId,
        },
      };
    }

    if (filters.assignedTpId) {
      where.dispatchTps = {
        ...where.dispatchTps,
        some: {
          ...(where.dispatchTps?.some || {}),
          tpId: filters.assignedTpId,
        },
      };
    }

    if (filters.dateFrom || filters.dateTo) {
      where.ngayGui = {};
      if (filters.dateFrom) where.ngayGui.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.ngayGui.lte = new Date(filters.dateTo);
    }

    // 1.3. Query
    const [dispatches, total] = await Promise.all([
      prisma.dispatch.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { mucDoKhan: 'desc' },
          { ngayGui: 'desc' },
          { createdAt: 'desc' },
        ],
        include: {
          createdBy: {
            select: { id: true, username: true, fullName: true },
          },
          dispatchPvts: {
            orderBy: { isPrimary: 'desc' },
          },
          dispatchTps: {
            orderBy: { isPrimary: 'desc' },
          },
          _count: {
            select: { attachments: true, reports: true },
          },
        },
      }),
      prisma.dispatch.count({ where }),
    ]);

    return {
      dispatches,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // ============================================
  // 2. LẤY CHI TIẾT
  // ============================================
  async getDispatchById(dispatchId, currentUser) {
    const dispatch = await prisma.dispatch.findUnique({
      where: { id: dispatchId },
      include: {
        createdBy: {
          select: { id: true, username: true, fullName: true },
        },
        dispatchPvts: {
          orderBy: { isPrimary: 'desc' },
        },
        dispatchTps: {
          orderBy: { isPrimary: 'desc' },
        },
        assignments: {
          orderBy: { createdAt: 'asc' },
        },
        rejections: {
          orderBy: { createdAt: 'asc' },
        },
        attachments: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'desc' },
        },
        reports: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!dispatch || dispatch.deletedAt) {
      throw { status: 404, message: 'Không tìm thấy công văn' };
    }

    // Check quyền xem
    const perms = currentUser.permissions || [];
    
    if (!perms.includes('dispatch:view:all')) {
      const canView =
        dispatch.createdById === currentUser.id ||
        dispatch.dispatchPvts.some(dp => dp.pvtId === currentUser.id) ||
        dispatch.dispatchTps.some(dt => dt.tpId === currentUser.id);

      if (!canView) {
        throw { status: 403, message: 'Không có quyền xem công văn này' };
      }
    }

    return dispatch;
  },

  // ============================================
  // 3. TẠO CÔNG VĂN
  // ============================================
  async createDispatch(data, currentUser) {
    const {
      soCongVan,
      tenCongVan,
      ngayGui,
      ngayPhatHanh,
      hanBaoCaoXuLy,
      donViBanHanh,
      nguoiThucHien,
      ghiChu,
      mucDoKhan,
      loaiCongVan,
      customFields,
      tags,
    } = data;

    // Validate
    if (!soCongVan || !tenCongVan || !donViBanHanh) {
      throw { status: 400, message: 'Thiếu thông tin bắt buộc' };
    }

    // Check trùng số công văn
    const existing = await prisma.dispatch.findFirst({
      where: {
        soCongVan,
        deletedAt: null,
      },
    });

    if (existing) {
      throw { status: 400, message: `Số công văn "${soCongVan}" đã tồn tại` };
    }

    // Tạo
    const dispatch = await prisma.dispatch.create({
      data: {
        soCongVan,
        tenCongVan,
        ngayGui: ngayGui ? new Date(ngayGui) : new Date(),
        ngayPhatHanh: ngayPhatHanh ? new Date(ngayPhatHanh) : null,
        hanBaoCaoXuLy: hanBaoCaoXuLy ? new Date(hanBaoCaoXuLy) : null,
        donViBanHanh,
        nguoiThucHien: nguoiThucHien || null,
        ghiChu: ghiChu || null,
        mucDoKhan: mucDoKhan || 'THUONG',
        loaiCongVan: loaiCongVan || null,
        trangThai: 'MOI_TAO',
        tienDo: 0,
        customFields: customFields || {},
        tags: tags || [],
        createdById: currentUser.id,
      },
      include: {
        createdBy: {
          select: { id: true, username: true, fullName: true },
        },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        userName: currentUser.fullName,
        action: 'CREATE_DISPATCH',
        entityType: 'dispatch',
        entityId: dispatch.id,
        newValue: { soCongVan, tenCongVan },
      },
    });

    return dispatch;
  },

  // ============================================
  // 4. CẬP NHẬT
  // ============================================
  async updateDispatch(dispatchId, data, currentUser) {
    const dispatch = await prisma.dispatch.findUnique({
      where: { id: dispatchId },
    });

    if (!dispatch || dispatch.deletedAt) {
      throw { status: 404, message: 'Không tìm thấy công văn' };
    }

    // Check quyền sửa
    const perms = currentUser.permissions || [];
    
    if (!perms.includes('dispatch:update:all')) {
      if (!perms.includes('dispatch:update:assigned')) {
        if (dispatch.createdById !== currentUser.id) {
          throw { status: 403, message: 'Không có quyền sửa' };
        }
      } else {
        const canEdit =
          dispatch.dispatchPvts?.some?.(dp => dp.pvtId === currentUser.id) ||
          dispatch.dispatchTps?.some?.(dt => dt.tpId === currentUser.id);
        // Sẽ check sau khi load
      }
    }

    // Build update data
    const updateData = {};
    const allowed = [
      'soCongVan', 'tenCongVan', 'ngayGui', 'ngayPhatHanh',
      'hanBaoCaoXuLy', 'donViBanHanh', 'nguoiThucHien', 'ghiChu',
      'mucDoKhan', 'loaiCongVan', 'customFields', 'tags',
    ];

    allowed.forEach(field => {
      if (data[field] !== undefined) {
        if (field === 'ngayGui' || field === 'ngayPhatHanh' || field === 'hanBaoCaoXuLy') {
          updateData[field] = data[field] ? new Date(data[field]) : null;
        } else {
          updateData[field] = data[field];
        }
      }
    });

    const updated = await prisma.dispatch.update({
      where: { id: dispatchId },
      data: updateData,
    });

    // Audit
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        userName: currentUser.fullName,
        action: 'UPDATE_DISPATCH',
        entityType: 'dispatch',
        entityId: dispatchId,
        newValue: updateData,
      },
    });

    return updated;
  },

  // ============================================
  // 5. XÓA MỀM
  // ============================================
  async deleteDispatch(dispatchId, currentUser) {
    const dispatch = await prisma.dispatch.findUnique({
      where: { id: dispatchId },
    });

    if (!dispatch || dispatch.deletedAt) {
      throw { status: 404, message: 'Không tìm thấy công văn' };
    }

    await prisma.dispatch.update({
      where: { id: dispatchId },
      data: { deletedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        userName: currentUser.fullName,
        action: 'DELETE_DISPATCH',
        entityType: 'dispatch',
        entityId: dispatchId,
      },
    });

    return { success: true, message: 'Đã xóa công văn' };
  },

  // ============================================
  // 6. THỐNG KÊ
  // ============================================
  async getStats(currentUser) {
    const where = { deletedAt: null };

    // Filter theo role
    const perms = currentUser.permissions || [];
    if (perms.includes('dispatch:view:all')) {
      // Tất cả
    } else if (perms.includes('dispatch:view:department')) {
      where.dispatchPvts = { some: { pvtId: currentUser.id } };
    } else if (perms.includes('dispatch:view:assigned')) {
      where.dispatchTps = { some: { tpId: currentUser.id } };
    }

    const today = new Date();
    const in3Days = new Date();
    in3Days.setDate(in3Days.getDate() + 3);

    const [
      total,
      dangXuLy,
      hoanThanh,
      quaHan,
      sapDenHan,
      chuaToiHan,
    ] = await Promise.all([
      prisma.dispatch.count({ where }),
      prisma.dispatch.count({ where: { ...where, trangThai: 'DANG_XU_LY' } }),
      prisma.dispatch.count({ where: { ...where, trangThai: 'HOAN_THANH' } }),
      prisma.dispatch.count({
        where: {
          ...where,
          hanBaoCaoXuLy: { lt: today },
          trangThai: { not: 'HOAN_THANH' },
        },
      }),
      prisma.dispatch.count({
        where: {
          ...where,
          hanBaoCaoXuLy: { gte: today, lte: in3Days },
          trangThai: { not: 'HOAN_THANH' },
        },
      }),
      prisma.dispatch.count({
        where: {
          ...where,
          hanBaoCaoXuLy: { gt: in3Days },
          trangThai: { not: 'HOAN_THANH' },
        },
      }),
    ]);

    return {
      total,
      dangXuLy,
      hoanThanh,
      quaHan,
      sapDenHan,
      chuaToiHan,
      tyLeHoanThanh: total > 0 ? Math.round((hoanThanh / total) * 100) : 0,
    };
  },
};