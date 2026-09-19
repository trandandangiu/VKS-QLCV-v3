// backend/src/services/assignments.service.js
import prisma from '../config/prisma.js';

export const assignmentsService = {
  // ============================================
  // 1. VT GIAO CHO 1-N PVT
  // ============================================
  async assignPvts(dispatchId, data, currentUser) {
    const { pvts, vtChiDao, hanBaoCaoXuLy, mucDoKhan } = data;

    // 1.1. Validate
    if (!pvts || !Array.isArray(pvts) || pvts.length === 0) {
      throw { status: 400, message: 'Phải chọn ít nhất 1 PVT' };
    }

    // 1.2. Check dispatch tồn tại
    const dispatch = await prisma.dispatch.findUnique({
      where: { id: dispatchId },
    });

    if (!dispatch) {
      throw { status: 404, message: 'Không tìm thấy công văn' };
    }

    // 1.3. Check trạng thái (chỉ được giao khi MOI_TAO)
    if (dispatch.trangThai !== 'MOI_TAO' && dispatch.trangThai !== 'VT_TRA_LAI') {
      throw { status: 400, message: 'Công văn không ở trạng thái có thể giao' };
    }

    // 1.4. Check PVT tồn tại + có role PHO_VIEN_TRUONG
    for (const pvt of pvts) {
      const user = await prisma.user.findUnique({
        where: { id: pvt.pvtId },
        include: {
          userRoles: {
            include: { role: true },
          },
        },
      });

      if (!user) {
        throw { status: 404, message: `Không tìm thấy PVT: ${pvt.pvtId}` };
      }

      const hasPvtRole = user.userRoles.some(
        ur => ur.role.code === 'PHO_VIEN_TRUONG'
      );

      if (!hasPvtRole) {
        throw { status: 400, message: `User ${user.fullName} không phải Phó Viện trưởng` };
      }
    }

    // 1.5. Check phải có 1 PVT chính
    const hasPrimary = pvts.some(p => p.isPrimary === true);
    if (!hasPrimary && pvts.length > 1) {
      throw { status: 400, message: 'Phải chọn 1 PVT chính khi giao nhiều người' };
    }

    // 1.6. Transaction
    const result = await prisma.$transaction(async (tx) => {
      // Xóa PVT cũ (nếu giao lại)
      await tx.dispatchPvt.deleteMany({ where: { dispatchId } });

      // Tạo PVT mới
      await tx.dispatchPvt.createMany({
        data: pvts.map(pvt => ({
          dispatchId,
          pvtId: pvt.pvtId,
          pvtName: pvt.pvtName,
          roomCode: pvt.roomCode || '',
          isPrimary: pvt.isPrimary || pvts.length === 1,
          role: pvt.isPrimary ? 'CHINH' : 'PHOI_HOP',
          status: 'PENDING',
        })),
      });

      // Cập nhật dispatch
      await tx.dispatch.update({
        where: { id: dispatchId },
        data: {
          trangThai: 'CHO_PVT_XU_LY',
          vtChiDao: vtChiDao || dispatch.vtChiDao,
          hanBaoCaoXuLy: hanBaoCaoXuLy 
            ? new Date(hanBaoCaoXuLy) 
            : dispatch.hanBaoCaoXuLy,
          mucDoKhan: mucDoKhan || dispatch.mucDoKhan,
          updatedAt: new Date(),
        },
      });

      // Ghi log assignments (1 record cho mỗi PVT)
      for (const pvt of pvts) {
        await tx.assignment.create({
          data: {
            dispatchId,
            fromUserId: currentUser.id,
            fromUserName: currentUser.fullName,
            fromRole: currentUser.roles?.[0] || 'VIEN_TRUONG',
            toUserId: pvt.pvtId,
            toUserName: pvt.pvtName,
            toRole: 'PHO_VIEN_TRUONG',
            assignLevel: 'VT_TO_PVT',
            chiDao: vtChiDao,
            hanXuLy: hanBaoCaoXuLy ? new Date(hanBaoCaoXuLy) : null,
            status: 'PENDING',
          },
        });

        // Gửi thông báo
        await tx.notification.create({
          data: {
            userId: pvt.pvtId,
            dispatchId,
            type: 'TASK_ASSIGNED',
            title: 'Công văn mới được giao',
            content: `Viện trưởng đã giao công văn ${dispatch.soCongVan} cho bạn`,
          },
        });
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          userName: currentUser.fullName,
          action: 'ASSIGN_PVTS',
          entityType: 'dispatch',
          entityId: dispatchId,
          newValue: { pvts, vtChiDao },
        },
      });

      return tx.dispatch.findUnique({
        where: { id: dispatchId },
        include: {
          dispatchPvts: true,
        },
      });
    });

    return result;
  },

  // ============================================
  // 2. PVT GIAO CHO 1-N TP
  // ============================================
  async assignTps(dispatchId, data, currentUser) {
    const { tps, pvtChiDao, hanBaoCaoXuLy } = data;

    // 2.1. Validate
    if (!tps || !Array.isArray(tps) || tps.length === 0) {
      throw { status: 400, message: 'Phải chọn ít nhất 1 TP' };
    }

    // 2.2. Check dispatch
    const dispatch = await prisma.dispatch.findUnique({
      where: { id: dispatchId },
      include: {
        dispatchPvts: true,
      },
    });

    if (!dispatch) {
      throw { status: 404, message: 'Không tìm thấy công văn' };
    }

    // 2.3. Check user là PVT được giao
    const isAssignedPvt = dispatch.dispatchPvts.some(
      dp => dp.pvtId === currentUser.id
    );

    if (!isAssignedPvt && !currentUser.roles?.includes('ADMIN')) {
      throw { status: 403, message: 'Bạn không được giao công văn này' };
    }

    // 2.4. Check trạng thái
    const validStatuses = ['CHO_PVT_XU_LY', 'PVT_TRA_LAI'];
    if (!validStatuses.includes(dispatch.trangThai)) {
      throw { status: 400, message: 'Công văn không ở trạng thái có thể giao' };
    }

    // 2.5. Check TP tồn tại + có role TRUONG_PHONG
    for (const tp of tps) {
      const user = await prisma.user.findUnique({
        where: { id: tp.tpId },
        include: {
          userRoles: { include: { role: true } },
        },
      });

      if (!user) {
        throw { status: 404, message: `Không tìm thấy TP: ${tp.tpId}` };
      }

      const hasTpRole = user.userRoles.some(
        ur => ur.role.code === 'TRUONG_PHONG'
      );

      if (!hasTpRole) {
        throw { status: 400, message: `User ${user.fullName} không phải Trưởng phòng` };
      }
    }

    // 2.6. Transaction
    const result = await prisma.$transaction(async (tx) => {
      // Xóa TP cũ (nếu giao lại)
      await tx.dispatchTp.deleteMany({ where: { dispatchId } });

      // Tạo TP mới
      await tx.dispatchTp.createMany({
        data: tps.map(tp => ({
          dispatchId,
          assignedByPvtId: currentUser.id,
          assignedByPvtName: currentUser.fullName,
          tpId: tp.tpId,
          tpName: tp.tpName,
          roomCode: tp.roomCode || '',
          isPrimary: tp.isPrimary || tps.length === 1,
          role: tp.isPrimary ? 'CHINH' : 'PHOI_HOP',
          status: 'PENDING',
        })),
      });

      // Cập nhật dispatch
      await tx.dispatch.update({
        where: { id: dispatchId },
        data: {
          trangThai: 'CHO_TP_XU_LY',
          pvtChiDao,
          updatedAt: new Date(),
        },
      });

      // Log + notification
      for (const tp of tps) {
        await tx.assignment.create({
          data: {
            dispatchId,
            fromUserId: currentUser.id,
            fromUserName: currentUser.fullName,
            fromRole: 'PHO_VIEN_TRUONG',
            toUserId: tp.tpId,
            toUserName: tp.tpName,
            toRole: 'TRUONG_PHONG',
            assignLevel: 'PVT_TO_TP',
            chiDao: pvtChiDao,
            status: 'PENDING',
          },
        });

        await tx.notification.create({
          data: {
            userId: tp.tpId,
            dispatchId,
            type: 'TASK_ASSIGNED',
            title: 'Công văn mới được giao',
            content: `PVT đã giao công văn ${dispatch.soCongVan} cho bạn`,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          userName: currentUser.fullName,
          action: 'ASSIGN_TPS',
          entityType: 'dispatch',
          entityId: dispatchId,
          newValue: { tps, pvtChiDao },
        },
      });

      return tx.dispatch.findUnique({
        where: { id: dispatchId },
        include: {
          dispatchPvts: true,
          dispatchTps: true,
        },
      });
    });

    return result;
  },

  // ============================================
  // 3. TP ĐÁNH SỐ CÔNG VĂN
  // ============================================
  async tpNumber(dispatchId, data, currentUser) {
    const { soCongVanTP, ngayDanhSo } = data;

    if (!soCongVanTP) {
      throw { status: 400, message: 'Phải nhập số công văn' };
    }

    // Check dispatch
    const dispatch = await prisma.dispatch.findUnique({
      where: { id: dispatchId },
    });

    if (!dispatch) {
      throw { status: 404, message: 'Không tìm thấy công văn' };
    }

    // Check user được giao
    const tp = await prisma.dispatchTp.findFirst({
      where: {
        dispatchId,
        tpId: currentUser.id,
      },
    });

    if (!tp && !currentUser.roles?.includes('ADMIN')) {
      throw { status: 403, message: 'Bạn không được giao công văn này' };
    }

    // Update
    const updated = await prisma.dispatch.update({
      where: { id: dispatchId },
      data: {
        soCongVanTP,
        // Thêm field ngayDanhSo nếu có
        updatedAt: new Date(),
      },
    });

    // Audit
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'TP_NUMBER',
        entityType: 'dispatch',
        entityId: dispatchId,
        newValue: { soCongVanTP, ngayDanhSo },
      },
    });

    return updated;
  },

  // ============================================
  // 4. TP GỬI LÊN PVT
  // ============================================
  async tpSubmit(dispatchId, data, currentUser) {
    const { baoCaoTienDo, tienDo, attachmentIds } = data;

    // Check dispatch
    const dispatch = await prisma.dispatch.findUnique({
      where: { id: dispatchId },
      include: {
        dispatchPvts: true,
      },
    });

    if (!dispatch) {
      throw { status: 404, message: 'Không tìm thấy công văn' };
    }

    // Check user là TP được giao
    const tp = await prisma.dispatchTp.findFirst({
      where: {
        dispatchId,
        tpId: currentUser.id,
      },
    });

    if (!tp) {
      throw { status: 403, message: 'Bạn không được giao công văn này' };
    }

    // Check trạng thái
    if (dispatch.trangThai !== 'DANG_XU_LY' && dispatch.trangThai !== 'PVT_TRA_LAI') {
      throw { status: 400, message: 'Công văn không ở trạng thái có thể gửi' };
    }

    // Transaction
    const result = await prisma.$transaction(async (tx) => {
      // Cập nhật dispatch
      await tx.dispatch.update({
        where: { id: dispatchId },
        data: {
          trangThai: 'CHO_PVT_DUYET',
          baoCaoTienDo,
          tienDo: tienDo || 100,
          updatedAt: new Date(),
        },
      });

      // Cập nhật TP
      await tx.dispatchTp.update({
        where: { id: tp.id },
        data: {
          status: 'DONE',
          baoCaoTienDo,
          tienDo: tienDo || 100,
          completedAt: new Date(),
        },
      });

      // Log assignment
      await tx.assignment.create({
        data: {
          dispatchId,
          fromUserId: currentUser.id,
          fromUserName: currentUser.fullName,
          fromRole: 'TRUONG_PHONG',
          toUserId: tp.assignedByPvtId,
          toUserName: tp.assignedByPvtName,
          toRole: 'PHO_VIEN_TRUONG',
          assignLevel: 'TP_TO_PVT',
          chiDao: baoCaoTienDo,
          status: 'PENDING',
        },
      });

      // Thông báo PVT
      await tx.notification.create({
        data: {
          userId: tp.assignedByPvtId,
          dispatchId,
          type: 'REPORT_SUBMITTED',
          title: 'Trưởng phòng đã gửi báo cáo',
          content: `TP ${currentUser.fullName} đã gửi báo cáo cho công văn ${dispatch.soCongVan}`,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'TP_SUBMIT',
          entityType: 'dispatch',
          entityId: dispatchId,
        },
      });

      return tx.dispatch.findUnique({
        where: { id: dispatchId },
        include: {
          dispatchPvts: true,
          dispatchTps: true,
        },
      });
    });

    return result;
  },

  // ============================================
  // 5. PVT TRÌNH LÊN VT
  // ============================================
  async pvtSubmit(dispatchId, data, currentUser) {
    const { pvtChiDao } = data;

    const dispatch = await prisma.dispatch.findUnique({
      where: { id: dispatchId },
      include: { dispatchTps: true },
    });

    if (!dispatch) {
      throw { status: 404, message: 'Không tìm thấy công văn' };
    }

    // Check user là PVT được giao
    const pvt = await prisma.dispatchPvt.findFirst({
      where: {
        dispatchId,
        pvtId: currentUser.id,
      },
    });

    if (!pvt) {
      throw { status: 403, message: 'Bạn không được giao công văn này' };
    }

    // Check trạng thái
    if (dispatch.trangThai !== 'CHO_PVT_DUYET') {
      throw { status: 400, message: 'Công văn chưa sẵn sàng để trình' };
    }

    // Update
    const result = await prisma.$transaction(async (tx) => {
      await tx.dispatch.update({
        where: { id: dispatchId },
        data: {
          trangThai: 'CHO_VT_DUYET',
          pvtChiDao,
          updatedAt: new Date(),
        },
      });

      await tx.assignment.create({
        data: {
          dispatchId,
          fromUserId: currentUser.id,
          fromUserName: currentUser.fullName,
          fromRole: 'PHO_VIEN_TRUONG',
          toUserId: 'u_vt',  // Viện trưởng
          toUserName: 'Viện trưởng',
          toRole: 'VIEN_TRUONG',
          assignLevel: 'PVT_TO_VT',
          chiDao: pvtChiDao,
          status: 'PENDING',
        },
      });

      // Thông báo VT
      await tx.notification.create({
        data: {
          userId: 'u_vt',
          dispatchId,
          type: 'REPORT_SUBMITTED',
          title: 'PVT đã trình công văn',
          content: `${currentUser.fullName} đã trình công văn ${dispatch.soCongVan}`,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'PVT_SUBMIT',
          entityType: 'dispatch',
          entityId: dispatchId,
        },
      });

      return tx.dispatch.findUnique({
        where: { id: dispatchId },
        include: {
          dispatchPvts: true,
          dispatchTps: true,
        },
      });
    });

    return result;
  },

  // ============================================
  // 6. VT ĐỒNG Ý
  // ============================================
  async vtAgree(dispatchId, data, currentUser) {
    const dispatch = await prisma.dispatch.findUnique({
      where: { id: dispatchId },
      include: { dispatchPvts: true },
    });

    if (!dispatch) {
      throw { status: 404, message: 'Không tìm thấy công văn' };
    }

    if (dispatch.trangThai !== 'CHO_VT_DUYET') {
      throw { status: 400, message: 'Công văn không ở trạng thái chờ VT duyệt' };
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.dispatch.update({
        where: { id: dispatchId },
        data: {
          trangThai: 'HOAN_THANH',
          tienDo: 100,
          completedAt: new Date(),
        },
      });

      // Thông báo PVT
      for (const pvt of dispatch.dispatchPvts) {
        await tx.notification.create({
          data: {
            userId: pvt.pvtId,
            dispatchId,
            type: 'APPROVED',
            title: 'Viện trưởng đã đồng ý',
            content: `Công văn ${dispatch.soCongVan} đã được Viện trưởng đồng ý`,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'VT_AGREE',
          entityType: 'dispatch',
          entityId: dispatchId,
        },
      });

      return tx.dispatch.findUnique({ where: { id: dispatchId } });
    });

    return result;
  },

  // ============================================
  // 7. VT KHÔNG ĐỒNG Ý (TRẢ LẠI PVT)
  // ============================================
  async vtDisagree(dispatchId, data, currentUser) {
    const { reason } = data;

    if (!reason) {
      throw { status: 400, message: 'Phải nhập lý do không đồng ý' };
    }

    const dispatch = await prisma.dispatch.findUnique({
      where: { id: dispatchId },
      include: { dispatchPvts: true },
    });

    if (!dispatch) {
      throw { status: 404, message: 'Không tìm thấy công văn' };
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.dispatch.update({
        where: { id: dispatchId },
        data: {
          trangThai: 'VT_TRA_LAI',
          lyDoKhongDongYVT: reason,
          soLanTraLai: (dispatch.soLanTraLai || 0) + 1,
        },
      });

      // Lấy PVT chính
      const primaryPvt = dispatch.dispatchPvts.find(p => p.isPrimary) 
                     || dispatch.dispatchPvts[0];

      if (primaryPvt) {
        // Log rejection
        await tx.rejection.create({
          data: {
            dispatchId,
            fromUserId: currentUser.id,
            fromUserName: currentUser.fullName,
            fromRole: 'VIEN_TRUONG',
            toUserId: primaryPvt.pvtId,
            toUserName: primaryPvt.pvtName,
            toRole: 'PHO_VIEN_TRUONG',
            reason,
            category: 'CONTENT',
          },
        });

        // Thông báo PVT
        await tx.notification.create({
          data: {
            userId: primaryPvt.pvtId,
            dispatchId,
            type: 'REJECTED',
            title: 'Viện trưởng không đồng ý',
            content: `Công văn ${dispatch.soCongVan}: ${reason}`,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'VT_DISAGREE',
          entityType: 'dispatch',
          entityId: dispatchId,
          newValue: { reason },
        },
      });

      return tx.dispatch.findUnique({ where: { id: dispatchId } });
    });

    return result;
  },

  // ============================================
  // 8. PVT ĐỒNG Ý (KHÔNG CẦN, VÌ PVT TRÌNH VT RỒI)
  // ============================================
  async pvtAgree(dispatchId, data, currentUser) {
    // Có thể dùng để PVT duyệt báo cáo của TP
    const tpId = data.tpId;

    const tp = await prisma.dispatchTp.findFirst({
      where: { dispatchId, tpId },
    });

    if (!tp) {
      throw { status: 404, message: 'Không tìm thấy TP được giao' };
    }

    await prisma.dispatchTp.update({
      where: { id: tp.id },
      data: { status: 'ACCEPTED' },
    });

    return { success: true, message: 'Đã đồng ý' };
  },

  // ============================================
  // 9. PVT KHÔNG ĐỒNG Ý (TRẢ LẠI TP)
  // ============================================
  async pvtDisagree(dispatchId, data, currentUser) {
    const { reason, tpId } = data;

    if (!reason) {
      throw { status: 400, message: 'Phải nhập lý do không đồng ý' };
    }

    const dispatch = await prisma.dispatch.findUnique({
      where: { id: dispatchId },
    });

    if (!dispatch) {
      throw { status: 404, message: 'Không tìm thấy công văn' };
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.dispatch.update({
        where: { id: dispatchId },
        data: {
          trangThai: 'PVT_TRA_LAI',
          lyDoKhongDongYPVT: reason,
          soLanTraLai: (dispatch.soLanTraLai || 0) + 1,
        },
      });

      if (tpId) {
        const tp = await tx.dispatchTp.findFirst({
          where: { dispatchId, tpId },
        });

        if (tp) {
          await tx.rejection.create({
            data: {
              dispatchId,
              fromUserId: currentUser.id,
              fromUserName: currentUser.fullName,
              fromRole: 'PHO_VIEN_TRUONG',
              toUserId: tp.tpId,
              toUserName: tp.tpName,
              toRole: 'TRUONG_PHONG',
              reason,
              category: 'CONTENT',
            },
          });

          await tx.notification.create({
            data: {
              userId: tp.tpId,
              dispatchId,
              type: 'REJECTED',
              title: 'PVT không đồng ý',
              content: `Công văn ${dispatch.soCongVan}: ${reason}`,
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'PVT_DISAGREE',
          entityType: 'dispatch',
          entityId: dispatchId,
        },
      });

      return tx.dispatch.findUnique({ where: { id: dispatchId } });
    });

    return result;
  },

  // ============================================
  // 10. LỊCH SỬ LUÂN CHUYỂN
  // ============================================
  async getHistory(dispatchId) {
    const [assignments, rejections] = await Promise.all([
      prisma.assignment.findMany({
        where: { dispatchId },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.rejection.findMany({
        where: { dispatchId },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    // Merge + sort theo thời gian
    const history = [
      ...assignments.map(a => ({
        type: 'ASSIGNMENT',
        action: a.assignLevel,
        from: a.fromUserName,
        to: a.toUserName,
        chiDao: a.chiDao,
        at: a.createdAt,
      })),
      ...rejections.map(r => ({
        type: 'REJECTION',
        from: r.fromUserName,
        to: r.toUserName,
        reason: r.reason,
        at: r.createdAt,
      })),
    ].sort((a, b) => new Date(a.at) - new Date(b.at));

    return history;
  },
};