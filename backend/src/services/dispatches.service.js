// backend/src/services/dispatches.service.js
import prisma from '../config/prisma.js';
import { createAndPushNotification } from './notification.helper.js';

export const dispatchesService = {
  // ============================================
  // 1. LẤY DANH SÁCH (FILTER THEO ROLE)
  // ⭐ Cho phép KHÁCH truy cập (không cần login)
  // ============================================
  async getDispatches(currentUser, filters = {}) {
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const skip = (page - 1) * limit;

    // ⭐ Phát hiện khách
    const isGuest = !currentUser || !currentUser.id;

    const where = {};

    if (filters.includeDeleted !== 'true' && filters.includeDeleted !== true) {
      where.deletedAt = null;
    }

    // ═══════════════════════════════════════════════════════
    // PHÂN QUYỀN
    // ═══════════════════════════════════════════════════════
    if (isGuest) {
      // 🌐 KHÁCH: xem TẤT CẢ công văn, không filter
    } else {
      const perms = currentUser.permissions || [];

      if (perms.includes('dispatch:view:all')) {
        // Admin, VT
      } else if (perms.includes('dispatch:view:department')) {
        where.dispatchPvts = { some: { pvtId: currentUser.id } };
      } else if (perms.includes('dispatch:view:assigned')) {
        where.dispatchTps = { some: { tpId: currentUser.id } };
      } else {
        where.OR = [
          { createdById: currentUser.id },
          { dispatchPvts: { some: { pvtId: currentUser.id } } },
          { dispatchTps: { some: { tpId: currentUser.id } } },
        ];
      }
    }

    // Filter search
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
      } else {
        where.OR = searchOR;
      }
    }

    if (filters.trangThai) where.trangThai = filters.trangThai;
    if (filters.mucDoKhan) where.mucDoKhan = filters.mucDoKhan;

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
          dispatchPvts: { orderBy: { isPrimary: 'desc' } },
          dispatchTps: { orderBy: { isPrimary: 'desc' } },
          _count: {
            select: { attachments: true, reports: true },
          },
        },
      }),
      prisma.dispatch.count({ where }),
    ]);

    // ═══════════════════════════════════════════════════════
    // ⭐ ĐẾM LẠI ATTACHMENT CHƯA XOÁ CHO TỪNG DISPATCH
    // Lý do: Prisma 6.x không hỗ trợ `where` trong `_count.select`
    //        → `_count.attachments` đếm cả file đã xoá mềm
    //        → Drawer load (filter isDeleted: false) bị lệch số
    // ═══════════════════════════════════════════════════════
    const dispatchIds = dispatches.map(d => d.id);

    const attachCounts =
      dispatchIds.length > 0
        ? await prisma.attachment.groupBy({
          by: ['dispatchId'],
          where: {
            dispatchId: { in: dispatchIds },
            isDeleted: false,
          },
          _count: { _all: true },
        })
        : [];

    const attachCountMap = new Map(
      attachCounts.map(a => [a.dispatchId, a._count._all])
    );

    const dispatchesWithCount = dispatches.map(d => ({
      ...d,
      _count: {
        ...(d._count || {}),
        attachments: attachCountMap.get(d.id) || 0,
      },
    }));

    return {
      dispatches: dispatchesWithCount,
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
  // ⭐ Cho phép KHÁCH truy cập
  // ============================================
  async getDispatchById(dispatchId, currentUser) {
    // ⭐ Phát hiện khách
    const isGuest = !currentUser || !currentUser.id;

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

    // ⭐ Đếm lại attachment chưa xoá (chính xác)
    const realAttachCount = await prisma.attachment.count({
      where: {
        dispatchId: dispatch.id,
        isDeleted: false,
      },
    });

    // Gán vào _count nếu có
    dispatch._count = {
      ...(dispatch._count || {}),
      attachments: realAttachCount,
    };

    // Khách → trả hết, không cần check quyền
    if (isGuest) {
      return dispatch;
    }

    // User login → check quyền
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
  // ⭐ Broadcast thông báo đặt ĐÚNG CHỖ ở đây
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
      loaiCongVan,       // ⭐ THÊM DÒNG NÀY
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
        loaiCongVan: loaiCongVan || null,     // ⭐ THÊM DÒNG NÀY
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

    // ═══════════════════════════════════════════
    // 🔔 BROADCAST THÔNG BÁO CÔNG VĂN MỚI
    // Gửi cho tất cả VT, PVT, TP (trừ người tạo)
    // ═══════════════════════════════════════════
    // ⭐ CHỈ BROADCAST 1 LẦN — gửi cho TẤT CẢ (user + khách)
    // Không cần gửi riêng lẻ từng user nữa
    // Vì SSE có thể dùng broadcast qua notification table
    try {
      // 1. Tạo notification cho tất cả user VT/PVT/TP (lưu vào DB)
      const allUsers = await prisma.user.findMany({
        where: {
          deletedAt: null,
          active: true,
          id: { not: currentUser.id },
        },
        include: {
          userRoles: { include: { role: true } },
        },
      });

      const targetUsers = allUsers.filter(u =>
        u.userRoles.some(ur =>
          ['VIEN_TRUONG', 'PHO_VIEN_TRUONG', 'TRUONG_PHONG'].includes(ur.role.code)
        )
      );

      console.log(`🔔 Tạo notification cho ${targetUsers.length} users`);

      // 2. Bulk insert notifications (nhanh hơn for-loop)
      await prisma.notification.createMany({
        data: targetUsers.map(u => ({
          userId: u.id,
          dispatchId: dispatch.id,
          type: 'DISPATCH_CREATED',
          title: '📋 Công văn mới',
          content: `${soCongVan} — "${tenCongVan}" (tạo bởi ${currentUser.fullName})`,
        })),
      });

      // 3. SSE realtime cho từng user
      const { sseService } = await import('./sse.service.js');
      targetUsers.forEach(u => {
        sseService.sendToUser(u.id, 'notification', {
          id: `temp-${Date.now()}-${u.id}`,
          type: 'DISPATCH_CREATED',
          title: '📋 Công văn mới',
          content: `${soCongVan} — "${tenCongVan}"`,
          dispatchId: dispatch.id,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      });

      // 4. ⭐ WEB PUSH — broadcast cho TẤT CẢ thiết bị (user + khách)
      const { pushService } = await import('./push.service.js');
      const pushResult = await pushService.broadcast({
        title: '📋 Công văn mới',
        content: `${soCongVan} — "${tenCongVan}"`,
        dispatchId: dispatch.id,
        url: `/dispatches/${dispatch.id}`,
      });

      console.log(
        `📢 [PUSH] Broadcast "${soCongVan}": sent=${pushResult.sent}, failed=${pushResult.failed}`
      );
    } catch (notifErr) {
      console.error('❌ Lỗi broadcast:', notifErr.message);
    }

    // ⭐ BROADCAST cho TẤT CẢ (user login + khách đã subscribe push)
    try {
      await createAndPushNotification(null, {
        userId: null,
        broadcast: true,
        dispatchId: dispatch.id,
        type: 'DISPATCH_CREATED',
        title: '📋 Công văn mới',
        content: `${soCongVan} — "${tenCongVan}"`,
        url: '/',
      });
      console.log(
        `📢 [PUSH] Đã broadcast công văn mới "${soCongVan}" cho tất cả thiết bị`
      );
    } catch (err) {
      console.error('❌ Lỗi broadcast push cho khách:', err.message);
    }

    return dispatch;
  },

  // ============================================
  // 4. CẬP NHẬT
  // ============================================
  // ============================================
  // 4. CẬP NHẬT
  // ============================================
  async updateDispatch(dispatchId, data, currentUser) {
    const dispatch = await prisma.dispatch.findUnique({
      where: { id: dispatchId },
      include: {
        dispatchPvts: true,
        dispatchTps: true,
      },
    });

    if (!dispatch || dispatch.deletedAt) {
      throw { status: 404, message: 'Không tìm thấy công văn' };
    }

    // Check quyền sửa
    const perms = currentUser.permissions || [];

    if (!perms.includes('dispatch:update:all')) {
      if (perms.includes('dispatch:update:assigned')) {
        const canEdit =
          dispatch.createdById === currentUser.id ||
          dispatch.dispatchPvts?.some?.(dp => dp.pvtId === currentUser.id) ||
          dispatch.dispatchTps?.some?.(dt => dt.tpId === currentUser.id);

        if (!canEdit) {
          throw { status: 403, message: 'Không có quyền sửa công văn này' };
        }
      } else {
        if (dispatch.createdById !== currentUser.id) {
          throw { status: 403, message: 'Không có quyền sửa' };
        }
      }
    }

    // Build update data
    const updateData = {};
    const allowed = [
      'soCongVan',
      'tenCongVan',
      'ngayGui',
      'ngayPhatHanh',
      'hanBaoCaoXuLy',
      'donViBanHanh',
      'nguoiThucHien',
      'ghiChu',
      'mucDoKhan',
      'loaiCongVan',
      'customFields',
      'tags',
    ];

    allowed.forEach(field => {
      if (data[field] !== undefined) {
        if (
          field === 'ngayGui' ||
          field === 'ngayPhatHanh' ||
          field === 'hanBaoCaoXuLy'
        ) {
          updateData[field] = data[field] ? new Date(data[field]) : null;
        } else {
          updateData[field] = data[field];
        }
      }
    });

    // ⭐═══════════════════════════════════════════════════════════
    // ⭐ SPECIAL HANDLING: trangThai + tienDo
    // ⭐ Cho phép ChuyenDeDrawer cập nhật khi hoàn thành mốc
    // ⭐═══════════════════════════════════════════════════════════
    const VALID_STATUSES = [
      'MOI_TAO',
      'DANG_XU_LY',
      'HOAN_THANH',
      'QUA_HAN',
      'SAP_DEN_HAN',
      'CHO_Y_KIEN_LANH_DAO',
      'CHO_PVT_XU_LY',
      'CHO_TP_XU_LY',
      'CHO_PVT_DUYET',
      'CHO_VT_DUYET',
      'CHO_TRINH_VT',
      'VT_TRA_LAI',
      'PVT_TRA_LAI',
    ];

    if (data.trangThai !== undefined) {
      if (!VALID_STATUSES.includes(data.trangThai)) {
        throw {
          status: 400,
          message: `Trạng thái không hợp lệ: "${data.trangThai}"`,
        };
      }
      updateData.trangThai = data.trangThai;
    }

    if (data.tienDo !== undefined) {
      const tienDoNum = parseInt(data.tienDo, 10);
      if (isNaN(tienDoNum) || tienDoNum < 0 || tienDoNum > 100) {
        throw {
          status: 400,
          message: 'Tiến độ phải là số nguyên từ 0 đến 100',
        };
      }
      updateData.tienDo = tienDoNum;
    }

    // ⭐ Nếu set HOAN_THANH → tự động set completedAt
    if (data.trangThai === 'HOAN_THANH' && dispatch.trangThai !== 'HOAN_THANH') {
      updateData.completedAt = new Date();
    }

    // ⭐ Nếu rời khỏi HOAN_THANH → xóa completedAt
    if (
      data.trangThai !== undefined &&
      data.trangThai !== 'HOAN_THANH' &&
      dispatch.trangThai === 'HOAN_THANH'
    ) {
      updateData.completedAt = null;
    }

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
        oldValue: {
          trangThai: dispatch.trangThai,
          tienDo: dispatch.tienDo,
        },
        newValue: updateData,
      },
    });

    return updated;
  },

  // ============================================
  // 5. XÓA MỀM
  // ============================================
  // ============================================
  // 5b. XÓA CỨNG (HARD DELETE) ⭐ THÊM MỚI
  // Xóa vĩnh viễn khỏi DB, cascade tất cả bảng liên quan
  // ============================================
  async hardDeleteDispatch(dispatchId, currentUser) {
    const dispatch = await prisma.dispatch.findUnique({
      where: { id: dispatchId },
      include: {
        _count: {
          select: {
            attachments: true,
            reports: true,
            dispatchPvts: true,
            dispatchTps: true,
          },
        },
      },
    });

    if (!dispatch) {
      throw { status: 404, message: 'Không tìm thấy công văn' };
    }

    // ⭐ Chỉ ADMIN hoặc VIEN_TRUONG mới được xóa cứng
    const perms = currentUser.permissions || [];
    const roles = currentUser.roles || [];
    const canHardDelete =
      perms.includes('dispatch:delete') ||
      roles.includes('ADMIN') ||
      roles.includes('VIEN_TRUONG');

    if (!canHardDelete) {
      throw {
        status: 403,
        message: 'Chỉ Admin hoặc Viện trưởng mới được xóa vĩnh viễn công văn',
      };
    }

    // ⭐ Xóa file vật lý trên ổ đĩa (nếu có)
    try {
      const attachments = await prisma.attachment.findMany({
        where: { dispatchId },
        select: { filePath: true },
      });

      const fs = await import('fs');
      for (const att of attachments) {
        if (att.filePath && fs.existsSync(att.filePath)) {
          try {
            fs.unlinkSync(att.filePath);
          } catch (fileErr) {
            console.warn(
              `⚠️ Không xóa được file: ${att.filePath}`,
              fileErr.message
            );
          }
        }
      }
    } catch (fsErr) {
      console.warn('⚠️ Lỗi xóa file vật lý:', fsErr.message);
    }

    // ⭐ Xóa dispatch — Prisma tự cascade:
    //   dispatch_pvts, dispatch_tps, assignments, attachments,
    //   reports, rejections, notifications
    // (theo schema.prisma: onDelete: Cascade)
    await prisma.$transaction(async tx => {
      // Audit log TRƯỚC khi xóa (vì entityId sẽ mất)
      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          userName: currentUser.fullName,
          userRole: currentUser.roles?.[0] || 'ADMIN',
          action: 'HARD_DELETE_DISPATCH',
          entityType: 'dispatch',
          entityId: dispatchId,
          oldValue: {
            soCongVan: dispatch.soCongVan,
            tenCongVan: dispatch.tenCongVan,
            donViBanHanh: dispatch.donViBanHanh,
            trangThai: dispatch.trangThai,
            soLanTraLai: dispatch.soLanTraLai,
            counts: dispatch._count,
          },
        },
      });

      // Hard delete
      await tx.dispatch.delete({
        where: { id: dispatchId },
      });
    });

    return {
      success: true,
      message: `Đã xóa vĩnh viễn công văn "${dispatch.soCongVan}"`,
    };
  },
  // ============================================
  // 6. THỐNG KÊ
  // ⭐ Cho phép KHÁCH truy cập
  // ============================================
  async getStats(currentUser) {
    // ⭐ Phát hiện khách
    const isGuest = !currentUser || !currentUser.id;

    const where = { deletedAt: null };

    if (!isGuest) {
      const perms = currentUser.permissions || [];
      if (perms.includes('dispatch:view:all')) {
        // Tất cả
      } else if (perms.includes('dispatch:view:department')) {
        where.dispatchPvts = { some: { pvtId: currentUser.id } };
      } else if (perms.includes('dispatch:view:assigned')) {
        where.dispatchTps = { some: { tpId: currentUser.id } };
      }
    }
    // Khách → không filter

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const in3Days = new Date();
    in3Days.setDate(in3Days.getDate() + 3);
    in3Days.setHours(23, 59, 59, 999);

    const [total, dangXuLy, hoanThanh, quaHan, sapDenHan, chuaToiHan] =
      await Promise.all([
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

  // ============================================
  // 7. ĐÁNH DẤU HOÀN THÀNH (PVT/TP tự chốt)
  // ============================================
  async markComplete(dispatchId, currentUser, note) {
    // ⭐ Guard
    if (!currentUser || !currentUser.id) {
      throw { status: 401, message: 'Chưa đăng nhập' };
    }

    const dispatch = await prisma.dispatch.findUnique({
      where: { id: dispatchId },
      include: {
        dispatchPvts: true,
        dispatchTps: true,
      },
    });

    if (!dispatch || dispatch.deletedAt) {
      throw { status: 404, message: 'Không tìm thấy công văn' };
    }

    if (dispatch.trangThai === 'HOAN_THANH') {
      throw { status: 400, message: 'Công văn đã hoàn thành' };
    }

    // Check quyền
    const perms = currentUser.permissions || [];
    const isVtOrAdmin =
      perms.includes('dispatch:view:all') ||
      currentUser.roles?.includes('VIEN_TRUONG') ||
      currentUser.roles?.includes('ADMIN');

    const isAssignedPvt = dispatch.dispatchPvts.some(
      dp => dp.pvtId === currentUser.id
    );
    const isAssignedTp = dispatch.dispatchTps.some(
      dt => dt.tpId === currentUser.id
    );

    if (!isVtOrAdmin && !isAssignedPvt && !isAssignedTp) {
      throw { status: 403, message: 'Bạn không có quyền đánh dấu công văn này' };
    }

    // Update
    const updated = await prisma.dispatch.update({
      where: { id: dispatchId },
      data: {
        trangThai: 'HOAN_THANH',
        tienDo: 100,
        completedAt: new Date(),
        baoCaoTienDo: note || dispatch.baoCaoTienDo,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        userName: currentUser.fullName,
        action: 'MARK_COMPLETE',
        entityType: 'dispatch',
        entityId: dispatchId,
        newValue: { note },
      },
    });

    return {
      success: true,
      message: 'Đã đánh dấu hoàn thành',
      dispatch: updated,
    };
  },

  // ============================================
  // 8. MỞ LẠI CÔNG VĂN (UNDO HOÀN THÀNH)
  // ============================================
  async reopenDispatch(dispatchId, currentUser, note) {
    if (!currentUser || !currentUser.id) {
      throw { status: 401, message: 'Chưa đăng nhập' };
    }

    const dispatch = await prisma.dispatch.findUnique({
      where: { id: dispatchId },
      include: {
        dispatchPvts: true,
        dispatchTps: true,
      },
    });

    if (!dispatch || dispatch.deletedAt) {
      throw { status: 404, message: 'Không tìm thấy công văn' };
    }

    if (dispatch.trangThai !== 'HOAN_THANH') {
      throw {
        status: 400,
        message: 'Công văn chưa hoàn thành, không thể mở lại',
      };
    }

    // Check quyền
    const perms = currentUser.permissions || [];
    const isVtOrAdmin =
      perms.includes('dispatch:view:all') ||
      currentUser.roles?.includes('VIEN_TRUONG') ||
      currentUser.roles?.includes('ADMIN');

    const isAssignedPvt = dispatch.dispatchPvts.some(
      dp => dp.pvtId === currentUser.id
    );
    const isAssignedTp = dispatch.dispatchTps.some(
      dt => dt.tpId === currentUser.id
    );

    if (!isVtOrAdmin && !isAssignedPvt && !isAssignedTp) {
      throw { status: 403, message: 'Bạn không có quyền mở lại công văn này' };
    }

    // ⭐ Quyết định trạng thái mở lại
    let restoreStatus = 'DANG_XU_LY';

    if (dispatch.dispatchTps?.length > 0) {
      restoreStatus = 'CHO_PVT_DUYET';
    } else if (dispatch.dispatchPvts?.length > 0) {
      restoreStatus = 'CHO_TP_XU_LY';
    }

    const updated = await prisma.$transaction(async tx => {
      const result = await tx.dispatch.update({
        where: { id: dispatchId },
        data: {
          trangThai: restoreStatus,
          tienDo: 0,
          completedAt: null,
          baoCaoTienDo: note || dispatch.baoCaoTienDo,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          userName: currentUser.fullName,
          action: 'REOPEN_DISPATCH',
          entityType: 'dispatch',
          entityId: dispatchId,
          oldValue: { trangThai: 'HOAN_THANH' },
          newValue: { trangThai: restoreStatus, note },
        },
      });

      return result;
    });

    return {
      success: true,
      message: 'Đã mở lại công văn',
      dispatch: updated,
    };
  },
};