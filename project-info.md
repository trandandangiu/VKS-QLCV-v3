# DỰ ÁN: QLCV VKSND TP.HCM

**Ngày xuất:** 2026-09-20 22:34:04

---

## 1. CẤU TRÚC THƯ MỤC

```
```

## 2. CẤU HÌNH

### 2.1. docker-compose.yml
```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: qlcv_postgres
    restart: always
    environment:
      POSTGRES_DB: qlcv_db
      POSTGRES_USER: qlcv_app
      POSTGRES_PASSWORD: QLCV@2026Strong!
      TZ: Asia/Ho_Chi_Minh
    ports:
      - "5432:5432"
    volumes:
      - qlcv_postgres_data:/var/lib/postgresql/data
      - ./init-db:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U qlcv_app -d qlcv_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: qlcv_redis
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - qlcv_redis_data:/data

  adminer:
    image: adminer:latest
    container_name: qlcv_adminer
    restart: always
    ports:
      - "8080:8080"
    environment:
      ADMINER_DEFAULT_SERVER: postgres

volumes:
  qlcv_postgres_data:
  qlcv_redis_data:
```

### 2.2. backend/package.json
```json
{
  "name": "vks-qlcv-backend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "node --watch src/server.js",
    "start": "node src/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "seed": "node prisma/seed.js"
  },
  "prisma": {
    "seed": "node prisma/seed.js"
  },
  "dependencies": {
    "@prisma/client": "^6.19.3",
    "bcrypt": "^6.0.0",
    "cors": "^2.8.6",
    "dotenv": "^18.0.0",
    "express": "^5.2.1",
    "jsonwebtoken": "^9.0.3",
    "multer": "^1.4.5-lts.2",
    "swagger-jsdoc": "^6.2.8",
    "swagger-ui-express": "^5.0.1"
  },
  "devDependencies": {
    "prisma": "^6.19.3"
  }
}
```

### 2.3. frontend/package.json
```json
{
  "name": "vks-qlcv-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@tailwindcss/vite": "^4.1.14",
    "@vitejs/plugin-react": "^5.0.4",
    "lucide-react": "^0.546.0",
    "motion": "^12.23.24",
    "qrcode": "^1.5.4",
    "react": "^19.0.1",
    "react-dom": "^19.0.1",
    "react-router-dom": "^7.18.4",
    "recharts": "^3.10.1",
    "tailwindcss": "^4.1.14",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@types/node": "^22.14.0",
    "@types/qrcode": "^1.5.6",
    "autoprefixer": "^10.4.21",
    "postcss": "^8.4.49",
    "typescript": "~5.8.2",
    "vite": "^6.2.3"
  }
}
```

### 2.4. frontend/vite.config.ts
```typescript
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});```

## 3. DATABASE

### 3.1. Prisma Schema
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// 1. DEPARTMENTS — Phòng ban
// ============================================
model Department {
  id           String   @id @default(uuid())
  code         String   @unique // "P1", "P2"
  name         String // "Phòng 1"
  shortName    String?  @map("short_name") // "P1"
  managerId    String?  @map("manager_id") // Trưởng phòng
  pvtManagerId String?  @map("pvt_manager_id") // PVT phụ trách
  description  String?
  active       Boolean  @default(true)
  order        Int      @default(0)
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  users User[] @relation("DepartmentUsers")

  @@map("departments")
}

// ============================================
// 2. ROLES — Vai trò
// ============================================
model Role {
  id          Int      @id @default(autoincrement()) // 1, 2, 3, 4
  code        String   @unique // "ADMIN", "VIEN_TRUONG"
  name        String // "Quản trị viên"
  description String?
  level       Int      @default(0) // 0=cao nhất
  isSystem    Boolean  @default(false) @map("is_system")
  active      Boolean  @default(true)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  userRoles       UserRole[]
  rolePermissions RolePermission[]

  @@map("roles")
}

// ============================================
// 3. PERMISSIONS — Quyền
// ============================================
model Permission {
  id          Int      @id @default(autoincrement()) // 1, 2, ..., 40
  code        String   @unique // "user:create"
  name        String // "Tạo tài khoản"
  module      String // "user", "dispatch"
  action      String // "create", "view"
  scope       String? // "all", "own"
  description String?
  isSystem    Boolean  @default(false) @map("is_system")
  createdAt   DateTime @default(now()) @map("created_at")

  rolePermissions RolePermission[]

  @@index([module])
  @@index([code])
  @@map("permissions")
}

// ============================================
// 4. ROLE_PERMISSIONS — Gán quyền cho role
// ============================================
model RolePermission {
  id           Int        @id @default(autoincrement())
  roleId       Int        @map("role_id")
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permissionId Int        @map("permission_id")
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  createdAt    DateTime   @default(now()) @map("created_at")

  @@unique([roleId, permissionId])
  @@map("role_permissions")
}

// ============================================
// 5. USER_ROLES — Gán role cho user
// ============================================
model UserRole {
  id         Int       @id @default(autoincrement())
  userId     String    @map("user_id")
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  roleId     Int       @map("role_id")
  role       Role      @relation(fields: [roleId], references: [id], onDelete: Cascade)
  assignedBy String?   @map("assigned_by")
  assignedAt DateTime  @default(now()) @map("assigned_at")
  expiresAt  DateTime? @map("expires_at")

  @@unique([userId, roleId])
  @@map("user_roles")
}

// ============================================
// 6. USERS — Người dùng
// ============================================
model User {
  id           String  @id @default(uuid())
  username     String  @unique
  passwordHash String  @map("password_hash")
  fullName     String  @map("full_name")
  email        String? @unique
  phone        String?
  avatarUrl    String? @map("avatar_url")

  // ⚠️ GIỮ TẠM để migrate (sẽ xóa sau)
  role     String? // ROLE CŨ
  roomCode String? @map("room_code") // ROOM CODE CŨ

  // ✅ THÊM MỚI
  position     String? // Chức vụ
  departmentId String?     @map("department_id")
  department   Department? @relation("DepartmentUsers", fields: [departmentId], references: [id])

  managerId    String? @map("manager_id")
  manager      User?   @relation("UserHierarchy", fields: [managerId], references: [id])
  subordinates User[]  @relation("UserHierarchy")

  // ⚠️ GIỮ pvtManagerId cũ
  pvtManagerId String? @map("pvt_manager_id")

  // 2FA
  totpSecret  String? @map("totp_secret")
  totpEnabled Boolean @default(false) @map("totp_enabled")

  // Trạng thái
  active      Boolean   @default(true)
  lastLoginAt DateTime? @map("last_login_at")
  lastLoginIp String?   @map("last_login_ip")

  // Metadata
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  // Quan hệ mới
  userRoles         UserRole[]
  dispatchesCreated Dispatch[]     @relation("DispatchCreator")
  attachments       Attachment[]
  assignmentsFrom   Assignment[]   @relation("AssignmentFrom")
  assignmentsTo     Assignment[]   @relation("AssignmentTo")
  rejectionsFrom    Rejection[]    @relation("RejectionFrom")
  rejectionsTo      Rejection[]    @relation("RejectionTo")
  reports           Report[]
  notifications     Notification[]
  auditLogs         AuditLog[]
  sessions          Session[]
  exports           Export[]

  @@index([role])
  @@index([roomCode])
  @@index([departmentId])
  @@index([managerId])
  @@map("users")
}

// ============================================
// 7. DISPATCHES — Công văn
// ============================================
model Dispatch {
  id          String  @id @default(uuid())
  soCongVan   String  @map("so_cong_van")
  soCongVanTP String? @map("so_cong_van_tp")

  // Thông tin
  tenCongVan    String    @map("ten_cong_van")
  ngayGui       DateTime? @map("ngay_gui") @db.Date
  ngayPhatHanh  DateTime? @map("ngay_phat_hanh") @db.Date
  hanBaoCaoXuLy DateTime? @map("han_bao_cao_xu_ly") @db.Date
  thoiHanXuLy   String?   @map("thoi_han_xu_ly")
  donViBanHanh  String    @map("don_vi_ban_hanh")
  nguoiThucHien String?   @map("nguoi_thuc_hien")
  ghiChu        String?

  // Phân loại
  mucDoKhan   String  @default("THUONG") @map("muc_do_khan")
  loaiCongVan String? @map("loai_cong_van")

  // Trạng thái
  trangThai String @default("MOI_TAO") @map("trang_thai")
  tienDo    Int    @default(0) @map("tien_do")

  // Người tạo
  createdById String @map("created_by_id")
  createdBy   User   @relation("DispatchCreator", fields: [createdById], references: [id])

  // ⚠️ GIỮ TẠM các field cũ để migrate
  assignedPvtId   String? @map("assigned_pvt_id")
  assignedPvtName String? @map("assigned_pvt_name")
  assignedTpId    String? @map("assigned_tp_id")
  assignedTpName  String? @map("assigned_tp_name")

  // Ý kiến chỉ đạo
  vtChiDao     String? @map("vt_chi_dao")
  pvtChiDao    String? @map("pvt_chi_dao")
  baoCaoTienDo String? @map("bao_cao_tien_do")

  // Không đồng ý
  lyDoKhongDongYVT  String? @map("ly_do_khong_dong_y_vt")
  lyDoKhongDongYPVT String? @map("ly_do_khong_dong_y_pvt")
  soLanTraLai       Int     @default(0) @map("so_lan_tra_lai")

  // Cột động
  customFields Json? @map("custom_fields")
  tags         Json? @default("[]")

  // Thời gian
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  completedAt DateTime? @map("completed_at")
  deletedAt   DateTime? @map("deleted_at")

  // Quan hệ MỚI
  dispatchPvts  DispatchPvt[]
  dispatchTps   DispatchTp[]
  assignments   Assignment[]
  attachments   Attachment[]
  rejections    Rejection[]
  reports       Report[]
  notifications Notification[]

  @@index([trangThai])
  @@index([hanBaoCaoXuLy])
  @@index([assignedPvtId])
  @@index([assignedTpId])
  @@index([createdById])
  @@map("dispatches")
}

// ============================================
// 8. DISPATCH_PVTS — PVT được giao (1-N)
// ============================================
model DispatchPvt {
  id         String   @id @default(uuid())
  dispatchId String   @map("dispatch_id")
  dispatch   Dispatch @relation(fields: [dispatchId], references: [id], onDelete: Cascade)

  pvtId    String @map("pvt_id")
  pvtName  String @map("pvt_name")
  roomCode String @map("room_code") // "PVT1"

  isPrimary Boolean @default(true) @map("is_primary")
  role      String  @default("CHINH") // CHINH | PHOI_HOP

  status String  @default("PENDING")
  yKien  String?

  assignedAt  DateTime  @default(now()) @map("assigned_at")
  acceptedAt  DateTime? @map("accepted_at")
  completedAt DateTime? @map("completed_at")

  @@index([dispatchId])
  @@index([pvtId])
  @@map("dispatch_pvts")
}

// ============================================
// 9. DISPATCH_TPS — TP được giao (1-N)
// ============================================
model DispatchTp {
  id         String   @id @default(uuid())
  dispatchId String   @map("dispatch_id")
  dispatch   Dispatch @relation(fields: [dispatchId], references: [id], onDelete: Cascade)

  assignedByPvtId   String @map("assigned_by_pvt_id")
  assignedByPvtName String @map("assigned_by_pvt_name")

  tpId     String @map("tp_id")
  tpName   String @map("tp_name")
  roomCode String @map("room_code") // "TP1"

  isPrimary Boolean @default(true) @map("is_primary")
  role      String  @default("CHINH") // CHINH | PHOI_HOP

  status       String  @default("PENDING")
  yKien        String?
  baoCaoTienDo String? @map("bao_cao_tien_do")
  tienDo       Int     @default(0) @map("tien_do")

  assignedAt  DateTime  @default(now()) @map("assigned_at")
  acceptedAt  DateTime? @map("accepted_at")
  completedAt DateTime? @map("completed_at")

  @@index([dispatchId])
  @@index([tpId])
  @@index([assignedByPvtId])
  @@map("dispatch_tps")
}

// ============================================
// 10. ASSIGNMENTS — Lịch sử phân công
// ============================================
model Assignment {
  id         String   @id @default(uuid())
  dispatchId String   @map("dispatch_id")
  dispatch   Dispatch @relation(fields: [dispatchId], references: [id], onDelete: Cascade)

  fromUserId   String  @map("from_user_id")
  fromUser     User    @relation("AssignmentFrom", fields: [fromUserId], references: [id])
  fromUserName String  @map("from_user_name")
  fromRole     String? @map("from_role")

  toUserId   String  @map("to_user_id")
  toUser     User    @relation("AssignmentTo", fields: [toUserId], references: [id])
  toUserName String  @map("to_user_name")
  toRole     String? @map("to_role")

  assignLevel String    @map("assign_level") // VT_TO_PVT | PVT_TO_TP | ...
  chiDao      String?
  hanXuLy     DateTime? @map("han_xu_ly") @db.Date
  status      String    @default("PENDING")

  createdAt   DateTime  @default(now()) @map("created_at")
  completedAt DateTime? @map("completed_at")

  @@index([dispatchId])
  @@index([fromUserId])
  @@index([toUserId])
  @@map("assignments")
}

// ============================================
// 11. ATTACHMENTS — File đính kèm
// ============================================
model Attachment {
  id         String   @id @default(uuid())
  dispatchId String   @map("dispatch_id")
  dispatch   Dispatch @relation(fields: [dispatchId], references: [id], onDelete: Cascade)

  uploaderId   String  @map("uploader_id")
  uploader     User    @relation(fields: [uploaderId], references: [id])
  uploaderName String  @map("uploader_name")
  uploaderRole String? @map("uploader_role")

  fileName String  @map("file_name")
  filePath String  @map("file_path")
  fileSize Int     @map("file_size")
  fileType String  @map("file_type")
  fileHash String? @map("file_hash")

  fileCategory String  @map("file_category") // ORIGINAL | DRAFT | REPORT | ...
  stage        String?
  description  String?

  isDeleted Boolean @default(false) @map("is_deleted")

  createdAt DateTime  @default(now()) @map("created_at")
  deletedAt DateTime? @map("deleted_at")

  @@index([dispatchId])
  @@index([uploaderId])
  @@map("attachments")
}

// ============================================
// 12. REPORTS — Báo cáo tiến độ
// ============================================
model Report {
  id         String   @id @default(uuid())
  dispatchId String   @map("dispatch_id")
  dispatch   Dispatch @relation(fields: [dispatchId], references: [id], onDelete: Cascade)

  reporterId   String  @map("reporter_id")
  reporter     User    @relation(fields: [reporterId], references: [id])
  reporterName String  @map("reporter_name")
  reporterRole String? @map("reporter_role")

  content     String
  progressPct Int    @map("progress_pct")
  reportType  String @map("report_type") // PROGRESS | ISSUE | COMPLETION
  status      String @default("SUBMITTED")

  attachmentIds Json? @map("attachment_ids")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@index([dispatchId])
  @@index([reporterId])
  @@map("reports")
}

// ============================================
// 13. REJECTIONS — Lịch sử không đồng ý
// ============================================
model Rejection {
  id         String   @id @default(uuid())
  dispatchId String   @map("dispatch_id")
  dispatch   Dispatch @relation(fields: [dispatchId], references: [id], onDelete: Cascade)

  fromUserId   String  @map("from_user_id")
  fromUser     User    @relation("RejectionFrom", fields: [fromUserId], references: [id])
  fromUserName String  @map("from_user_name")
  fromRole     String? @map("from_role")

  toUserId   String  @map("to_user_id")
  toUser     User    @relation("RejectionTo", fields: [toUserId], references: [id])
  toUserName String  @map("to_user_name")
  toRole     String? @map("to_role")

  reason        String
  category      String?
  attachmentIds Json?   @map("attachment_ids")

  createdAt DateTime @default(now()) @map("created_at")

  @@index([dispatchId])
  @@map("rejections")
}

// ============================================
// 14. NOTIFICATIONS — Thông báo
// ============================================
model Notification {
  id     String @id @default(uuid())
  userId String @map("user_id")
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  // ✅ THÊM: Quan hệ với Dispatch
  dispatchId String?   @map("dispatch_id")
  dispatch   Dispatch? @relation(fields: [dispatchId], references: [id], onDelete: Cascade)
  type       String
  title      String
  content    String?

  referenceType String? @map("reference_type")
  referenceId   String? @map("reference_id")

  isRead Boolean   @default(false) @map("is_read")
  readAt DateTime? @map("read_at")

  sentViaApp   Boolean @default(true) @map("sent_via_app")
  sentViaEmail Boolean @default(false) @map("sent_via_email")

  createdAt DateTime @default(now()) @map("created_at")

  @@index([userId, isRead])
  @@index([createdAt])
  @@map("notifications")
}

// ============================================
// 15. AUDIT_LOGS — Nhật ký (GIỮ NGUYÊN)
// ============================================
model AuditLog {
  id       String  @id @default(uuid())
  userId   String? @map("user_id")
  user     User?   @relation(fields: [userId], references: [id])
  userName String? @map("user_name")
  userRole String? @map("user_role")

  action     String
  entityType String? @map("entity_type")
  entityId   String? @map("entity_id")

  oldValue Json? @map("old_value")
  newValue Json? @map("new_value")

  ipAddress String? @map("ip_address")
  userAgent String? @map("user_agent")
  method    String?
  endpoint  String?

  status       String  @default("SUCCESS")
  errorMessage String? @map("error_message")

  createdAt DateTime @default(now()) @map("created_at")

  @@index([userId])
  @@index([action])
  @@index([entityType, entityId])
  @@index([createdAt])
  @@map("audit_logs")
}

// ============================================
// 16. SESSIONS — Phiên đăng nhập
// ============================================
model Session {
  id     String @id @default(uuid())
  userId String @map("user_id")
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  refreshToken String  @unique @map("refresh_token")
  ipAddress    String? @map("ip_address")
  userAgent    String? @map("user_agent")
  deviceType   String? @map("device_type")

  expiresAt DateTime  @map("expires_at")
  createdAt DateTime  @default(now()) @map("created_at")
  revokedAt DateTime? @map("revoked_at")

  @@index([userId])
  @@index([refreshToken])
  @@map("sessions")
}

// ============================================
// 17. EXPORTS — Lịch sử trích xuất
// ============================================
model Export {
  id       String @id @default(uuid())
  userId   String @map("user_id")
  user     User   @relation(fields: [userId], references: [id])
  userName String @map("user_name")

  exportType String @map("export_type")
  reportType String @map("report_type")

  filters     Json?
  recordCount Int   @map("record_count")

  fileName String @map("file_name")
  filePath String @map("file_path")
  fileSize Int    @map("file_size")

  createdAt DateTime @default(now()) @map("created_at")

  @@index([userId])
  @@index([exportType])
  @@map("exports")
}

// ============================================
// 18. COLUMNS — Cột động (GIỮ NGUYÊN)
// ============================================
model Column {
  id          String  @id @default(uuid())
  label       String
  type        String
  required    Boolean @default(false)
  visible     Boolean @default(true)
  isCustom    Boolean @default(false) @map("is_custom")
  order       Int     @default(0)
  width       String?
  options     Json?
  description String?

  @@map("columns")
}

// ============================================
// 19. SYSTEM_SETTINGS (GIỮ NGUYÊN)
// ============================================
model SystemSetting {
  key         String   @id
  value       String
  type        String   @default("string")
  category    String   @default("SYSTEM")
  description String?
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("system_settings")
}
```

### 3.2. Database State
```
               List of relations
 Schema |        Name        | Type  |  Owner   
--------+--------------------+-------+----------
 public | _prisma_migrations | table | qlcv_app
 public | assignments        | table | qlcv_app
 public | attachments        | table | qlcv_app
 public | audit_logs         | table | qlcv_app
 public | columns            | table | qlcv_app
 public | departments        | table | qlcv_app
 public | dispatch_pvts      | table | qlcv_app
 public | dispatch_tps       | table | qlcv_app
 public | dispatches         | table | qlcv_app
 public | exports            | table | qlcv_app
 public | notifications      | table | qlcv_app
 public | permissions        | table | qlcv_app
 public | rejections         | table | qlcv_app
 public | reports            | table | qlcv_app
 public | role_permissions   | table | qlcv_app
 public | roles              | table | qlcv_app
 public | sessions           | table | qlcv_app
 public | system_settings    | table | qlcv_app
 public | user_roles         | table | qlcv_app
 public | users              | table | qlcv_app
(20 rows)


 users 
-------
     6
(1 row)

 dispatches 
------------
          2
(1 row)

 id |      code       |      name       
----+-----------------+-----------------
  1 | ADMIN           | Quản trị viên
  2 | VIEN_TRUONG     | Viện trưởng
  3 | PHO_VIEN_TRUONG | Phó Viện trưởng
  4 | TRUONG_PHONG    | Trưởng phòng
(4 rows)

```

## 4. BACKEND SOURCE CODE

### 4.1. backend/src/server.js
```javascript
// backend/src/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import departmentsRoutes from './routes/departments.routes.js';
import dispatchesRoutes from './routes/dispatches.routes.js';
import assignmentsRoutes from './routes/assignments.routes.js';
import rolesRoutes from './routes/roles.routes.js';
import permissionsRoutes from './routes/permissions.routes.js';
import attachmentsRoutes from './routes/attachments.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import statsRoutes from './routes/stats.routes.js';
import adminRoutes from './routes/admin.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';

import { errorHandler, notFound } from './middlewares/error.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

// Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const color = res.statusCode >= 500 ? '\x1b[31m'
                : res.statusCode >= 400 ? '\x1b[33m'
                : '\x1b[32m';
    console.log(`${color}${res.statusCode}\x1b[0m ${req.method} ${req.originalUrl} - ${Date.now() - start}ms`);
  });
  next();
});

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'QLCV VKSND API',
}));

// Health
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Backend đang chạy' });
});

// ============================================
// ROUTES
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/dispatches', dispatchesRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/permissions', permissionsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api', assignmentsRoutes);
app.use('/api', attachmentsRoutes);
app.use('/api', reportsRoutes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log('======================================================');
  console.log('   HỆ THỐNG QUẢN LÝ CÔNG VIỆC VKSND TP.HCM');
  console.log('======================================================');
  console.log(`🚀 Backend:  http://localhost:${PORT}`);
  console.log(`📚 Swagger:  http://localhost:${PORT}/api-docs`);
  console.log('======================================================');
});```

### 4.2. Services

#### FILE: backend/src/services/admin.service.js
```javascript
// backend/src/services/admin.service.js
import prisma from '../config/prisma.js';

export const adminService = {
  // ============================================
  // 1. DANH SÁCH BẢNG + SỐ RECORDS
  // ============================================
  async getTables() {
    const [
      users,
      dispatches,
      departments,
      roles,
      permissions,
      userRoles,
      rolePermissions,
      assignments,
      attachments,
      reports,
      rejections,
      notifications,
      auditLogs,
      sessions,
      exports,
      columns,
      systemSettings,
      dispatchPvts,      // ← THÊM
      dispatchTps,       // ← THÊM
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.dispatch.count({ where: { deletedAt: null } }),
      prisma.department.count({ where: { active: true } }),
      prisma.role.count(),
      prisma.permission.count(),
      prisma.userRole.count(),
      prisma.rolePermission.count(),
      prisma.assignment.count(),
      prisma.attachment.count(),
      prisma.report.count(),
      prisma.rejection.count(),
      prisma.notification.count(),
      prisma.auditLog.count(),
      prisma.session.count(),
      prisma.export.count(),
      prisma.column.count(),
      prisma.systemSetting.count(),
      prisma.dispatchPvt.count(),       // ← THÊM
      prisma.dispatchTp.count(),
    ]);

    return {
      tables: [
        { name: 'users', count: users },
        { name: 'dispatches', count: dispatches },
        { name: 'departments', count: departments },
        { name: 'roles', count: roles },
        { name: 'permissions', count: permissions },
        { name: 'user_roles', count: userRoles },
        { name: 'role_permissions', count: rolePermissions },
        { name: 'assignments', count: assignments },
        { name: 'attachments', count: attachments },
        { name: 'reports', count: reports },
        { name: 'rejections', count: rejections },
        { name: 'notifications', count: notifications },
        { name: 'audit_logs', count: auditLogs },
        { name: 'sessions', count: sessions },
        { name: 'exports', count: exports },
        { name: 'columns', count: columns },
        { name: 'system_settings', count: systemSettings },
        { name: 'dispatch_pvts', count: dispatchPvts },   // ← THÊM
        { name: 'dispatch_tps', count: dispatchTps },
      ],
    };
  },

  // ============================================
  // 2. XEM DATA CỦA 1 BẢNG
  // ============================================
  async getTableData(tableName, filters = {}) {
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 50;
    const skip = (page - 1) * limit;

    // Whitelist tables
    const allowedTables = [
      'users', 'dispatches', 'departments', 'roles', 'permissions',
      'user_roles', 'role_permissions', 'assignments', 'attachments',
      'reports', 'rejections', 'notifications', 'audit_logs',
      'sessions', 'exports', 'columns', 'system_settings', 'dispatch_pvts', 'dispatch_tps',
    ];

    if (!allowedTables.includes(tableName)) {
      throw { status: 400, message: 'Bảng không được phép truy cập' };
    }

    // Query raw
    const data = await prisma.$queryRawUnsafe(
      `SELECT * FROM "${tableName}" LIMIT ${limit} OFFSET ${skip}`
    );

    const countResult = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as count FROM "${tableName}"`
    );

    const total = Number(countResult[0].count);

    // Convert BigInt + Date → String
    const sanitized = data.map(row => {
      const newRow = {};
      for (const [key, value] of Object.entries(row)) {
        if (typeof value === 'bigint') {
          newRow[key] = value.toString();
        } else if (value instanceof Date) {
          newRow[key] = value.toISOString();
        } else {
          newRow[key] = value;
        }
      }
      return newRow;
    });

    return {
      table: tableName,
      data: sanitized,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // ============================================
  // 3. THỐNG KÊ TỔNG QUAN DATABASE
  // ============================================
  async getStats() {
    const [users, dispatches, departments, roles, permissions] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.dispatch.count({ where: { deletedAt: null } }),
      prisma.department.count({ where: { active: true } }),
      prisma.role.count(),
      prisma.permission.count(),
    ]);

    return {
      stats: {
        users,
        dispatches,
        departments,
        roles,
        permissions,
      },
    };
  },

  // ============================================
  // 4. AUDIT LOGS
  // ============================================
  async getAuditLogs(filters = {}) {
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 50;
    const skip = (page - 1) * limit;

    const where = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.entityType) where.entityType = filters.entityType;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, username: true, fullName: true },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // ============================================
  // 5. SESSIONS
  // ============================================
  async getSessions(filters = {}) {
    const where = {};
    if (filters.userId) where.userId = filters.userId;

    const sessions = await prisma.session.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: {
          select: { id: true, username: true, fullName: true },
        },
      },
    });

    return { sessions };
  },
};```

#### FILE: backend/src/services/assignments.service.js
```javascript
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
          // ✅ Legacy fields
          assignedPvtId: pvts[0].pvtId,
          assignedPvtName: pvts[0].pvtName,
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

    // 2.3. Check user: PVT được giao HOẶC VT HOẶC Admin
    const isAssignedPvt = dispatch.dispatchPvts.some(
      dp => dp.pvtId === currentUser.id
    );
    const isVienTruong = currentUser.roles?.includes('VIEN_TRUONG');
    const isAdmin = currentUser.roles?.includes('ADMIN');

    if (!isAssignedPvt && !isVienTruong && !isAdmin) {
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
          // ✅ Legacy fields
          assignedTpId: tps[0].tpId,
          assignedTpName: tps[0].tpName,
          updatedAt: new Date(),
        },
      });

      // ✅ Nếu VT giao trực tiếp (không qua PVT), đánh dấu cờ
      if (isVienTruong && !isAssignedPvt) {
        await tx.dispatch.update({
          where: { id: dispatchId },
          data: {
            customFields: {
              ...(dispatch.customFields || {}),
              assignedDirectlyByVt: true,   // ← Cờ đánh dấu VT giao trực tiếp
              assignedByUserId: currentUser.id,
            },
          },
        });
      }
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
};```

#### FILE: backend/src/services/attachments.service.js
```javascript
// backend/src/services/attachments.service.js
import prisma from '../config/prisma.js';
import fs from 'fs';
import path from 'path';

export const attachmentsService = {
  // ============================================
  // 1. UPLOAD FILE
  // ============================================
  async uploadAttachment(dispatchId, file, data, currentUser) {
    const { fileCategory = 'OTHER', description } = data;

    if (!file) {
      throw { status: 400, message: 'Chưa chọn file' };
    }

    // Check dispatch tồn tại
    const dispatch = await prisma.dispatch.findUnique({
      where: { id: dispatchId },
    });

    if (!dispatch || dispatch.deletedAt) {
      throw { status: 404, message: 'Không tìm thấy công văn' };
    }

    // Tạo record trong DB
    const attachment = await prisma.attachment.create({
      data: {
        dispatchId,
        uploaderId: currentUser.id,
        uploaderName: currentUser.fullName,
        uploaderRole: currentUser.roles?.[0] || 'USER',
        fileName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        fileType: file.mimetype,
        fileCategory,
        description: description || null,
      },
    });

    // Audit
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'UPLOAD_ATTACHMENT',
        entityType: 'attachment',
        entityId: attachment.id,
        newValue: { fileName: file.originalname },
      },
    });

    // Return attachment info (không lộ filePath)
    return {
      id: attachment.id,
      fileName: attachment.fileName,
      fileSize: attachment.fileSize,
      fileType: attachment.fileType,
      fileCategory: attachment.fileCategory,
      description: attachment.description,
      uploaderName: attachment.uploaderName,
      createdAt: attachment.createdAt,
    };
  },

  // ============================================
  // 2. LẤY DANH SÁCH FILE CỦA CÔNG VĂN
  // ============================================
  async getAttachments(dispatchId, currentUser) {
    // Check dispatch tồn tại
    const dispatch = await prisma.dispatch.findUnique({
      where: { id: dispatchId },
    });

    if (!dispatch || dispatch.deletedAt) {
      throw { status: 404, message: 'Không tìm thấy công văn' };
    }

    const attachments = await prisma.attachment.findMany({
      where: {
        dispatchId,
        isDeleted: false,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        fileType: true,
        fileCategory: true,
        description: true,
        uploaderId: true,
        uploaderName: true,
        uploaderRole: true,
        createdAt: true,
      },
    });

    return { attachments };
  },

  // ============================================
  // 3. DOWNLOAD FILE
  // ============================================
  async getAttachmentForDownload(attachmentId, currentUser) {
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: {
        dispatch: true,
      },
    });

    if (!attachment || attachment.isDeleted) {
      throw { status: 404, message: 'Không tìm thấy file' };
    }

    // Check file tồn tại trên disk
    if (!fs.existsSync(attachment.filePath)) {
      throw { status: 404, message: 'File không tồn tại trên server' };
    }

    return attachment;
  },

  // ============================================
  // 4. XÓA FILE (SOFT DELETE)
  // ============================================
  async deleteAttachment(attachmentId, currentUser) {
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment || attachment.isDeleted) {
      throw { status: 404, message: 'Không tìm thấy file' };
    }

    // Check quyền xóa
    const perms = currentUser.permissions || [];
    const isOwner = attachment.uploaderId === currentUser.id;
    const canDeleteAll = perms.includes('attachment:delete:all') 
                      || perms.includes('user:delete');

    if (!isOwner && !canDeleteAll) {
      throw { status: 403, message: 'Không có quyền xóa file này' };
    }

    // Soft delete
    await prisma.attachment.update({
      where: { id: attachmentId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    // Audit
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'DELETE_ATTACHMENT',
        entityType: 'attachment',
        entityId: attachmentId,
      },
    });

    return { success: true, message: 'Đã xóa file' };
  },
};```

#### FILE: backend/src/services/auth.service.js
```javascript
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

export const authService = {
  // ============================================
  // LOGIN
  // ============================================
  async login({ username, password }) {
    // 1. Tìm user + roles + permissions
    const user = await prisma.user.findUnique({
      where: { username },
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
        department: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    if (!user) {
      throw { status: 401, message: 'Tên đăng nhập hoặc mật khẩu không chính xác' };
    }

    if (!user.active || user.deletedAt) {
      throw { status: 403, message: 'Tài khoản đã bị khóa hoặc vô hiệu hóa' };
    }

    // 2. Verify password
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      throw { status: 401, message: 'Tên đăng nhập hoặc mật khẩu không chính xác' };
    }

    // 3. Lấy roles + permissions
    const roles = user.userRoles.map(ur => ur.role.code);
    const permissions = new Set();
    
    user.userRoles.forEach(ur => {
      ur.role.rolePermissions.forEach(rp => {
        permissions.add(rp.permission.code);
      });
    });

    // 4. Tạo JWT (KHÔNG chứa permissions để gọn)
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        roles,
        departmentId: user.departmentId,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // 5. Cập nhật lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 6. Ẩn sensitive fields
    const { passwordHash, totpSecret, userRoles, ...userSafe } = user;

    return {
      success: true,
      user: userSafe,
      roles,
      permissions: Array.from(permissions),
      token,
    };
  },

  // ============================================
  // GET CURRENT USER — /api/auth/me
  // ============================================
  async getCurrentUser(userId) {
    // 1. Tìm user + roles + permissions
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
        department: {
          select: { id: true, code: true, name: true },
        },
        manager: {
          select: { id: true, username: true, fullName: true },
        },
      },
    });

    if (!user) {
      throw { status: 404, message: 'Không tìm thấy user' };
    }

    if (!user.active || user.deletedAt) {
      throw { status: 403, message: 'Tài khoản đã bị khóa' };
    }

    // 2. Lấy roles + permissions
    const roles = user.userRoles.map(ur => ({
      id: ur.role.id,
      code: ur.role.code,
      name: ur.role.name,
      level: ur.role.level,
    }));

    const permissions = new Set();
    user.userRoles.forEach(ur => {
      ur.role.rolePermissions.forEach(rp => {
        permissions.add(rp.permission.code);
      });
    });

    // 3. Ẩn sensitive
    const { passwordHash, totpSecret, userRoles, ...userSafe } = user;

    return {
      ...userSafe,
      roles,
      permissions: Array.from(permissions),
    };
  },
    // ============================================
  // CHANGE PASSWORD — User tự đổi
  // ============================================
  async changePassword(userId, oldPassword, newPassword) {
    // 1. Validate input
    if (!oldPassword || !newPassword) {
      throw { status: 400, message: 'Vui lòng nhập đầy đủ mật khẩu cũ và mới' };
    }

    if (newPassword.length < 6) {
      throw { status: 400, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' };
    }

    if (!/[A-Z]/.test(newPassword)) {
      throw { status: 400, message: 'Mật khẩu mới phải có ít nhất 1 chữ in hoa' };
    }

    if (!/[a-z]/.test(newPassword)) {
      throw { status: 400, message: 'Mật khẩu mới phải có ít nhất 1 chữ thường' };
    }

    if (!/[0-9]/.test(newPassword)) {
      throw { status: 400, message: 'Mật khẩu mới phải có ít nhất 1 chữ số' };
    }

    if (oldPassword === newPassword) {
      throw { status: 400, message: 'Mật khẩu mới phải khác mật khẩu cũ' };
    }

    // 2. Tìm user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.deletedAt) {
      throw { status: 404, message: 'Không tìm thấy user' };
    }

    // 3. Verify mật khẩu cũ
    const match = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!match) {
      throw { status: 401, message: 'Mật khẩu hiện tại không chính xác' };
    }

    // 4. Hash mật khẩu mới
    const newHash = await bcrypt.hash(newPassword, 10);

    // 5. Update
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          passwordHash: newHash,
          // Reset TOTP khi đổi password (bảo mật)
          totpSecret: null,
          totpEnabled: false,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: userId,
          userName: user.fullName,
          action: 'CHANGE_PASSWORD',
          entityType: 'user',
          entityId: userId,
        },
      });

      // Thu hồi tất cả sessions cũ (bảo mật)
      await tx.session.updateMany({
        where: { userId },
        data: { revokedAt: new Date() },
      });
    });

    return {
      success: true,
      message: 'Đổi mật khẩu thành công',
    };
  },
};
```

#### FILE: backend/src/services/departments.service.js
```javascript
// backend/src/services/departments.service.js
import prisma from '../config/prisma.js';

export const departmentsService = {
  // ============================================
  // 1. LẤY DANH SÁCH
  // ============================================
  async getDepartments(filters = {}) {
    // Mặc định chỉ lấy phòng active = true
    const where = {
      active: filters.active !== undefined ? filters.active === 'true' : true,
    };

    if (filters.search) {
      where.OR = [
        { code: { contains: filters.search, mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const departments = await prisma.department.findMany({
      where,
      orderBy: { code: 'asc' },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            fullName: true,
            position: true,
          },
        },
      },
    });

    // Enrich với manager + pvtManager
    const enriched = await Promise.all(
      departments.map(async (dept) => {
        let manager = null;
        let pvtManager = null;

        if (dept.managerId) {
          manager = await prisma.user.findUnique({
            where: { id: dept.managerId },
            select: { id: true, username: true, fullName: true },
          });
        }

        if (dept.pvtManagerId) {
          pvtManager = await prisma.user.findUnique({
            where: { id: dept.pvtManagerId },
            select: { id: true, username: true, fullName: true },
          });
        }

        return {
          ...dept,
          manager,
          pvtManager,
        };
      })
    );

    return { departments: enriched };
  },

  // ============================================
  // 2. LẤY CHI TIẾT
  // ============================================
  async getDepartmentById(id) {
    const dept = await prisma.department.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            fullName: true,
            position: true,
          },
        },
      },
    });

    if (!dept) {
      throw { status: 404, message: 'Không tìm thấy phòng ban' };
    }

    // Lấy manager + pvt manager
    const manager = dept.managerId
      ? await prisma.user.findUnique({
        where: { id: dept.managerId },
        select: { id: true, username: true, fullName: true },
      })
      : null;

    const pvtManager = dept.pvtManagerId
      ? await prisma.user.findUnique({
        where: { id: dept.pvtManagerId },
        select: { id: true, username: true, fullName: true },
      })
      : null;

    return { ...dept, manager, pvtManager };
  },

  // ============================================
  // 3. TẠO PHÒNG BAN
  // ============================================
  async createDepartment(data, currentUser) {
    const { code, name, shortName, managerId, pvtManagerId, description, order } = data;

    if (!code || !name) {
      throw { status: 400, message: 'Thiếu mã hoặc tên phòng ban' };
    }

    // Check trùng code
    const existing = await prisma.department.findUnique({
      where: { code },
    });

    if (existing) {
      throw { status: 400, message: `Mã phòng "${code}" đã tồn tại` };
    }

    const dept = await prisma.department.create({
      data: {
        code,
        name,
        shortName: shortName || code,
        managerId: managerId || null,
        pvtManagerId: pvtManagerId || null,
        description: description || null,
        order: order || 0,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        userName: currentUser.fullName,    // ← THÊM
        userRole: currentUser.roles?.[0] || 'ADMIN',   // ← THÊM
        action: 'CREATE_DEPARTMENT',
        entityType: 'department',
        entityId: dept.id,
        newValue: { code, name },
      },
    });

    return dept;
  },

  // ============================================
  // 4. CẬP NHẬT
  // ============================================
  async updateDepartment(id, data, currentUser) {
    const dept = await prisma.department.findUnique({ where: { id } });

    if (!dept) {
      throw { status: 404, message: 'Không tìm thấy phòng ban' };
    }

    const updateData = {};
    const allowed = ['name', 'shortName', 'managerId', 'pvtManagerId', 'description', 'order', 'active'];

    allowed.forEach(field => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });

    const updated = await prisma.department.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        userName: currentUser.fullName,    // ← THÊM
        userRole: currentUser.roles?.[0] || 'ADMIN',   // ← THÊM
        action: 'UPDATE_DEPARTMENT',
        entityType: 'department',
        entityId: id,
        oldValue: { name: dept.name },
        newValue: updateData,
      },
    });

    return updated;
  },

  // ============================================
  // 5. XÓA (SOFT DELETE)
  // ============================================
  async deleteDepartment(id, currentUser) {
    const dept = await prisma.department.findUnique({ where: { id } });

    if (!dept) {
      throw { status: 404, message: 'Không tìm thấy phòng ban' };
    }

    // Check có user không
    const userCount = await prisma.user.count({
      where: { departmentId: id, deletedAt: null },
    });

    if (userCount > 0) {
      throw {
        status: 400,
        message: `Không thể xóa: còn ${userCount} user trong phòng`,
      };
    }

    await prisma.department.update({
      where: { id },
      data: { active: false },
    });

    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        userName: currentUser.fullName,    // ← THÊM
        userRole: currentUser.roles?.[0] || 'ADMIN',   // ← THÊM
        action: 'DELETE_DEPARTMENT',
        entityType: 'department',
        entityId: id,
      },
    });

    return { success: true, message: 'Đã xóa phòng ban' };
  },
};```

#### FILE: backend/src/services/dispatches.service.js
```javascript
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

    const where = {};

    // Chỉ filter deletedAt = null nếu KHÔNG yêu cầu include deleted
    // Admin có thể truyền includeDeleted=true để xem cả CV đã xoá mềm
    if (filters.includeDeleted !== 'true' && filters.includeDeleted !== true) {
      where.deletedAt = null;
    }

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

    const perms = currentUser.permissions || [];
    if (perms.includes('dispatch:view:all')) {
      // Tất cả
    } else if (perms.includes('dispatch:view:department')) {
      where.dispatchPvts = { some: { pvtId: currentUser.id } };
    } else if (perms.includes('dispatch:view:assigned')) {
      where.dispatchTps = { some: { tpId: currentUser.id } };
    }

    // ✅ THÊM DÒNG NÀY — khai báo today
    const today = new Date();
    today.setHours(0, 0, 0, 0);   // Đầu ngày hôm nay

    const in3Days = new Date();
    in3Days.setDate(in3Days.getDate() + 3);
    in3Days.setHours(23, 59, 59, 999);  // Cuối ngày thứ 3

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

    // Check quyền: VT/PVT/TP đều có thể hoàn thành
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
};```

#### FILE: backend/src/services/notifications.service.js
```javascript
// backend/src/services/notifications.service.js
import prisma from '../config/prisma.js';

export const notificationsService = {
  // ============================================
  // 1. LẤY THÔNG BÁO CỦA USER
  // ============================================
  async getNotifications(currentUser, filters = {}) {
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const skip = (page - 1) * limit;

    const where = { userId: currentUser.id };

    if (filters.isRead !== undefined) {
      where.isRead = filters.isRead === 'true';
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId: currentUser.id, isRead: false },
      }),
    ]);

    return {
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // ============================================
  // 2. ĐÁNH DẤU ĐÃ ĐỌC
  // ============================================
  async markAsRead(notificationId, currentUser) {
    const notif = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notif) {
      throw { status: 404, message: 'Không tìm thấy thông báo' };
    }

    if (notif.userId !== currentUser.id) {
      throw { status: 403, message: 'Không có quyền' };
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { success: true, message: 'Đã đánh dấu đã đọc' };
  },

  // ============================================
  // 3. ĐÁNH DẤU TẤT CẢ ĐÃ ĐỌC
  // ============================================
  async markAllAsRead(currentUser) {
    const result = await prisma.notification.updateMany({
      where: { userId: currentUser.id, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return {
      success: true,
      message: `Đã đánh dấu ${result.count} thông báo`,
      count: result.count,
    };
  },

  // ============================================
  // 4. XÓA THÔNG BÁO
  // ============================================
  async deleteNotification(notificationId, currentUser) {
    const notif = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notif) {
      throw { status: 404, message: 'Không tìm thấy thông báo' };
    }

    if (notif.userId !== currentUser.id) {
      throw { status: 403, message: 'Không có quyền' };
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return { success: true, message: 'Đã xóa thông báo' };
  },

  // ============================================
  // 5. ĐẾM SỐ CHƯA ĐỌC
  // ============================================
  async getUnreadCount(currentUser) {
    const count = await prisma.notification.count({
      where: { userId: currentUser.id, isRead: false },
    });

    return { unreadCount: count };
  },
};```

#### FILE: backend/src/services/permissions.service.js
```javascript
// backend/src/services/permissions.service.js
import prisma from '../config/prisma.js';

export const permissionsService = {
  // ============================================
  // 1. LẤY TẤT CẢ PERMISSIONS (GROUPED BY MODULE)
  // ============================================
  async getPermissions(filters = {}) {
    const where = {};

    if (filters.module) {
      where.module = filters.module;
    }

    if (filters.search) {
      where.OR = [
        { code: { contains: filters.search, mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const permissions = await prisma.permission.findMany({
      where,
      orderBy: [
        { module: 'asc' },
        { id: 'asc' },
      ],
    });

    // Group by module
    const grouped = {};
    permissions.forEach(p => {
      if (!grouped[p.module]) {
        grouped[p.module] = [];
      }
      grouped[p.module].push({
        id: p.id,
        code: p.code,
        name: p.name,
        action: p.action,
        scope: p.scope,
        description: p.description,
      });
    });

    return {
      permissions,
      grouped,
      total: permissions.length,
    };
  },

  // ============================================
  // 2. LẤY CHI TIẾT
  // ============================================
  async getPermissionById(id) {
    const perm = await prisma.permission.findUnique({
      where: { id: parseInt(id) },
    });

    if (!perm) {
      throw { status: 404, message: 'Không tìm thấy permission' };
    }

    return perm;
  },

  // ============================================
  // 3. LẤY DANH SÁCH MODULES
  // ============================================
  async getModules() {
    const modules = await prisma.permission.groupBy({
      by: ['module'],
      _count: { id: true },
    });

    return {
      modules: modules.map(m => ({
        name: m.module,
        count: m._count.id,
      })),
    };
  },
};```

#### FILE: backend/src/services/reports.service.js
```javascript
// backend/src/services/reports.service.js
import prisma from '../config/prisma.js';

export const reportsService = {
  // ============================================
  // 1. TẠO BÁO CÁO
  // ============================================
  async createReport(dispatchId, data, currentUser) {
    const { content, progressPct, reportType, attachmentIds } = data;

    if (!content) {
      throw { status: 400, message: 'Thiếu nội dung báo cáo' };
    }

    // Check dispatch
    const dispatch = await prisma.dispatch.findUnique({
      where: { id: dispatchId },
    });

    if (!dispatch || dispatch.deletedAt) {
      throw { status: 404, message: 'Không tìm thấy công văn' };
    }

    // Check user có trong công văn không
    const canReport = await prisma.dispatch.findFirst({
      where: {
        id: dispatchId,
        OR: [
          { createdById: currentUser.id },
          { dispatchPvts: { some: { pvtId: currentUser.id } } },
          { dispatchTps: { some: { tpId: currentUser.id } } },
        ],
      },
    });

    if (!canReport && !currentUser.permissions?.includes('dispatch:view:all')) {
      throw { status: 403, message: 'Bạn không được giao công văn này' };
    }

    // Tạo report
    const report = await prisma.$transaction(async (tx) => {
      const created = await tx.report.create({
        data: {
          dispatchId,
          reporterId: currentUser.id,
          reporterName: currentUser.fullName,
          reporterRole: currentUser.roles?.[0] || 'USER',
          content,
          progressPct: progressPct || 0,
          reportType: reportType || 'PROGRESS',
          status: 'SUBMITTED',
          attachmentIds: attachmentIds || [],
        },
      });

      // Cập nhật tiến độ dispatch nếu có
      if (progressPct !== undefined) {
        await tx.dispatch.update({
          where: { id: dispatchId },
          data: {
            tienDo: progressPct,
            baoCaoTienDo: content,
            updatedAt: new Date(),
          },
        });
      }

      // Audit
      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'CREATE_REPORT',
          entityType: 'report',
          entityId: created.id,
          newValue: { content, progressPct },
        },
      });

      return created;
    });

    return report;
  },

  // ============================================
  // 2. LẤY DANH SÁCH BÁO CÁO CỦA CÔNG VĂN
  // ============================================
  async getReportsByDispatch(dispatchId, currentUser) {
    const dispatch = await prisma.dispatch.findUnique({
      where: { id: dispatchId },
    });

    if (!dispatch || dispatch.deletedAt) {
      throw { status: 404, message: 'Không tìm thấy công văn' };
    }

    const reports = await prisma.report.findMany({
      where: { dispatchId },
      orderBy: { createdAt: 'desc' },
    });

    return { reports };
  },

  // ============================================
  // 3. LẤY TẤT CẢ BÁO CÁO (THEO ROLE)
  // ============================================
  async getAllReports(currentUser, filters = {}) {
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const skip = (page - 1) * limit;

    const where = {};

    // Phân quyền
    const perms = currentUser.permissions || [];

    if (perms.includes('report:view:all')) {
      // Xem tất cả
    } else if (perms.includes('report:view:department')) {
      // PVT: xem báo cáo của công văn mình được giao
      where.dispatch = {
        dispatchPvts: { some: { pvtId: currentUser.id } },
      };
    } else {
      // TP: chỉ xem báo cáo mình tạo
      where.reporterId = currentUser.id;
    }

    if (filters.reportType) {
      where.reportType = filters.reportType;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          dispatch: {
            select: {
              id: true,
              soCongVan: true,
              tenCongVan: true,
              trangThai: true,
            },
          },
        },
      }),
      prisma.report.count({ where }),
    ]);

    return {
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // ============================================
  // 4. XÓA BÁO CÁO
  // ============================================
  async deleteReport(reportId, currentUser) {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw { status: 404, message: 'Không tìm thấy báo cáo' };
    }

    // Chỉ người tạo mới được xóa
    if (report.reporterId !== currentUser.id 
        && !currentUser.permissions?.includes('report:view:all')) {
      throw { status: 403, message: 'Không có quyền xóa báo cáo này' };
    }

    await prisma.report.delete({ where: { id: reportId } });

    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'DELETE_REPORT',
        entityType: 'report',
        entityId: reportId,
      },
    });

    return { success: true, message: 'Đã xóa báo cáo' };
  },
};```

#### FILE: backend/src/services/roles.service.js
```javascript
// backend/src/services/roles.service.js
import prisma from '../config/prisma.js';

export const rolesService = {
  // ============================================
  // 1. LẤY DANH SÁCH ROLES
  // ============================================
  async getRoles(filters = {}) {
    const where = {};

    if (filters.search) {
      where.OR = [
        { code: { contains: filters.search, mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.active !== undefined) {
      where.active = filters.active === 'true';
    }

    const roles = await prisma.role.findMany({
      where,
      orderBy: { level: 'asc' },
      include: {
        _count: {
          select: {
            userRoles: true,
            rolePermissions: true,
          },
        },
      },
    });

    return {
      roles: roles.map(r => ({
        id: r.id,
        code: r.code,
        name: r.name,
        description: r.description,
        level: r.level,
        isSystem: r.isSystem,
        active: r.active,
        userCount: r._count.userRoles,
        permissionCount: r._count.rolePermissions,
      })),
    };
  },

  // ============================================
  // 2. LẤY CHI TIẾT ROLE + PERMISSIONS
  // ============================================
  async getRoleById(id) {
    const role = await prisma.role.findUnique({
      where: { id: parseInt(id) },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!role) {
      throw { status: 404, message: 'Không tìm thấy role' };
    }

    return {
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      level: role.level,
      isSystem: role.isSystem,
      active: role.active,
      permissions: role.rolePermissions.map(rp => ({
        id: rp.permission.id,
        code: rp.permission.code,
        name: rp.permission.name,
        module: rp.permission.module,
        action: rp.permission.action,
        scope: rp.permission.scope,
      })),
      users: role.userRoles.map(ur => ur.user),
    };
  },

  // ============================================
  // 3. TẠO ROLE MỚI
  // ============================================
  async createRole(data, currentUser) {
    const { code, name, description, level, permissionIds } = data;

    if (!code || !name) {
      throw { status: 400, message: 'Thiếu code hoặc name' };
    }

    const existing = await prisma.role.findUnique({
      where: { code },
    });

    if (existing) {
      throw { status: 400, message: `Role "${code}" đã tồn tại` };
    }

    const role = await prisma.$transaction(async (tx) => {
      const created = await tx.role.create({
        data: {
          code,
          name,
          description: description || null,
          level: level || 99,
          isSystem: false,
        },
      });

      // Gán permissions
      if (permissionIds && permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map(pid => ({
            roleId: created.id,
            permissionId: pid,
          })),
        });
      }

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'CREATE_ROLE',
          entityType: 'role',
          entityId: String(created.id),
          newValue: { code, name },
        },
      });

      return created;
    });

    return role;
  },

  // ============================================
  // 4. CẬP NHẬT ROLE
  // ============================================
  async updateRole(id, data, currentUser) {
    const roleId = parseInt(id);
    const role = await prisma.role.findUnique({ where: { id: roleId } });

    if (!role) {
      throw { status: 404, message: 'Không tìm thấy role' };
    }

    const updateData = {};
    const allowed = ['name', 'description', 'level', 'active'];

    allowed.forEach(field => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });

    const updated = await prisma.role.update({
      where: { id: roleId },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'UPDATE_ROLE',
        entityType: 'role',
        entityId: String(roleId),
        oldValue: { name: role.name },
        newValue: updateData,
      },
    });

    return updated;
  },

  // ============================================
  // 5. GÁN PERMISSIONS CHO ROLE
  // ============================================
  async assignPermissions(id, permissionIds, currentUser) {
    const roleId = parseInt(id);

    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw { status: 404, message: 'Không tìm thấy role' };
    }

    // Check permissions tồn tại
    const permissions = await prisma.permission.findMany({
      where: { id: { in: permissionIds } },
    });

    if (permissions.length !== permissionIds.length) {
      throw { status: 400, message: 'Một số permission không tồn tại' };
    }

    await prisma.$transaction(async (tx) => {
      // Xóa cũ
      await tx.rolePermission.deleteMany({ where: { roleId } });

      // Tạo mới
      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map(pid => ({
            roleId,
            permissionId: pid,
          })),
        });
      }

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'ASSIGN_PERMISSIONS',
          entityType: 'role',
          entityId: String(roleId),
          newValue: { permissionIds },
        },
      });
    });

    return { success: true, message: 'Đã cập nhật permissions' };
  },

  // ============================================
  // 6. XÓA ROLE
  // ============================================
  async deleteRole(id, currentUser) {
    const roleId = parseInt(id);
    const role = await prisma.role.findUnique({ where: { id: roleId } });

    if (!role) {
      throw { status: 404, message: 'Không tìm thấy role' };
    }

    if (role.isSystem) {
      throw { status: 400, message: 'Không thể xóa role hệ thống' };
    }

    // Check có user không
    const userCount = await prisma.userRole.count({
      where: { roleId },
    });

    if (userCount > 0) {
      throw {
        status: 400,
        message: `Không thể xóa: còn ${userCount} user có role này`,
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId } });
      await tx.role.delete({ where: { id: roleId } });

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'DELETE_ROLE',
          entityType: 'role',
          entityId: String(roleId),
        },
      });
    });

    return { success: true, message: 'Đã xóa role' };
  },
};```

#### FILE: backend/src/services/stats.service.js
```javascript
// backend/src/services/stats.service.js
import prisma from '../config/prisma.js';

export const statsService = {
  // ============================================
  // 1. DASHBOARD VIỆN TRƯỞNG (OVERVIEW)
  // ============================================
  async getVTOverview(currentUser) {
    const today = new Date();
    const in3Days = new Date();
    in3Days.setDate(in3Days.getDate() + 3);

    // Tổng quan
    const [
      total,
      hoanThanh,
      dangXuLy,
      choPvtXuLy,
      choTpXuLy,
      choPvtDuyet,
      choVtDuyet,
      quaHan,
      sapDenHan,
      chuaToiHan,
    ] = await Promise.all([
      prisma.dispatch.count({ where: { deletedAt: null } }),
      prisma.dispatch.count({ where: { trangThai: 'HOAN_THANH', deletedAt: null } }),
      prisma.dispatch.count({ where: { trangThai: 'DANG_XU_LY', deletedAt: null } }),
      prisma.dispatch.count({ where: { trangThai: 'CHO_PVT_XU_LY', deletedAt: null } }),
      prisma.dispatch.count({ where: { trangThai: 'CHO_TP_XU_LY', deletedAt: null } }),
      prisma.dispatch.count({ where: { trangThai: 'CHO_PVT_DUYET', deletedAt: null } }),
      prisma.dispatch.count({ where: { trangThai: 'CHO_VT_DUYET', deletedAt: null } }),
      prisma.dispatch.count({
        where: {
          hanBaoCaoXuLy: { lt: today },
          trangThai: { not: 'HOAN_THANH' },
          deletedAt: null,
        },
      }),
      prisma.dispatch.count({
        where: {
          hanBaoCaoXuLy: { gte: today, lte: in3Days },
          trangThai: { not: 'HOAN_THANH' },
          deletedAt: null,
        },
      }),
      prisma.dispatch.count({
        where: {
          hanBaoCaoXuLy: { gt: in3Days },
          trangThai: { not: 'HOAN_THANH' },
          deletedAt: null,
        },
      }),
    ]);

    // Thống kê theo PVT
    const pvts = await prisma.user.findMany({
      where: {
        userRoles: { some: { role: { code: 'PHO_VIEN_TRUONG' } } },
        deletedAt: null,
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        roomCode: true,
      },
    });

    const pvtStats = await Promise.all(
      pvts.map(async (pvt) => {
        const pvtDispatches = await prisma.dispatch.findMany({
          where: {
            dispatchPvts: { some: { pvtId: pvt.id } },
            deletedAt: null,
          },
          select: { trangThai: true, tienDo: true },
        });

        const pvtTotal = pvtDispatches.length;
        const pvtCompleted = pvtDispatches.filter(
          d => d.trangThai === 'HOAN_THANH'
        ).length;
        const pvtOverdue = pvtDispatches.filter(
          d => d.trangThai === 'QUA_HAN'
        ).length;
        const avgProgress = pvtTotal > 0
          ? Math.round(
              pvtDispatches.reduce((sum, d) => sum + (d.tienDo || 0), 0) / pvtTotal
            )
          : 0;

        return {
          id: pvt.id,
          code: pvt.roomCode,
          name: pvt.fullName,
          total: pvtTotal,
          completed: pvtCompleted,
          overdue: pvtOverdue,
          avgProgress,
          completionRate: pvtTotal > 0
            ? Math.round((pvtCompleted / pvtTotal) * 100)
            : 0,
        };
      })
    );

    // Thống kê theo TP
    const tps = await prisma.user.findMany({
      where: {
        userRoles: { some: { role: { code: 'TRUONG_PHONG' } } },
        deletedAt: null,
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        roomCode: true,
        department: { select: { id: true, code: true, name: true } },
      },
    });

    const tpStats = await Promise.all(
      tps.map(async (tp) => {
        const tpDispatches = await prisma.dispatch.findMany({
          where: {
            dispatchTps: { some: { tpId: tp.id } },
            deletedAt: null,
          },
          select: { trangThai: true, tienDo: true },
        });

        const tpTotal = tpDispatches.length;
        const tpCompleted = tpDispatches.filter(
          d => d.trangThai === 'HOAN_THANH'
        ).length;
        const tpOverdue = tpDispatches.filter(
          d => d.trangThai === 'QUA_HAN'
        ).length;
        const avgProgress = tpTotal > 0
          ? Math.round(
              tpDispatches.reduce((sum, d) => sum + (d.tienDo || 0), 0) / tpTotal
            )
          : 0;

        return {
          id: tp.id,
          code: tp.roomCode,
          name: tp.fullName,
          department: tp.department,
          total: tpTotal,
          completed: tpCompleted,
          overdue: tpOverdue,
          avgProgress,
          completionRate: tpTotal > 0
            ? Math.round((tpCompleted / tpTotal) * 100)
            : 0,
        };
      })
    );

    return {
      summary: {
        total,
        hoanThanh,
        dangXuLy,
        choPvtXuLy,
        choTpXuLy,
        choPvtDuyet,
        choVtDuyet,
        quaHan,
        sapDenHan,
        chuaToiHan,
        tyLeHoanThanh: total > 0 ? Math.round((hoanThanh / total) * 100) : 0,
      },
      pvtStats,
      tpStats,
    };
  },

  // ============================================
  // 2. CHART DATA — BIỂU ĐỒ TRÒN
  // ============================================
  async getChartData(currentUser) {
    const today = new Date();
    const in3Days = new Date();
    in3Days.setDate(in3Days.getDate() + 3);

    const [quaHan, sapDenHan, chuaToiHan, hoanThanh] = await Promise.all([
      prisma.dispatch.count({
        where: {
          hanBaoCaoXuLy: { lt: today },
          trangThai: { not: 'HOAN_THANH' },
          deletedAt: null,
        },
      }),
      prisma.dispatch.count({
        where: {
          hanBaoCaoXuLy: { gte: today, lte: in3Days },
          trangThai: { not: 'HOAN_THANH' },
          deletedAt: null,
        },
      }),
      prisma.dispatch.count({
        where: {
          hanBaoCaoXuLy: { gt: in3Days },
          trangThai: { not: 'HOAN_THANH' },
          deletedAt: null,
        },
      }),
      prisma.dispatch.count({
        where: { trangThai: 'HOAN_THANH', deletedAt: null },
      }),
    ]);

    return {
      chartData: [
        { name: 'Quá hạn', value: quaHan, color: '#ef4444' },
        { name: 'Sắp đến hạn', value: sapDenHan, color: '#f59e0b' },
        { name: 'Chưa tới hạn', value: chuaToiHan, color: '#10b981' },
        { name: 'Hoàn thành', value: hoanThanh, color: '#3b82f6' },
      ],
      total: quaHan + sapDenHan + chuaToiHan + hoanThanh,
    };
  },

  // ============================================
  // 3. DASHBOARD THEO PVT
  // ============================================
  async getPvtDashboard(currentUser) {
    const pvtId = currentUser.id;

    const pvtDispatches = await prisma.dispatch.findMany({
      where: {
        dispatchPvts: { some: { pvtId } },
        deletedAt: null,
      },
      include: {
        dispatchTps: true,
      },
    });

    const total = pvtDispatches.length;
    const hoanThanh = pvtDispatches.filter(d => d.trangThai === 'HOAN_THANH').length;
    const dangXuLy = pvtDispatches.filter(d => d.trangThai === 'DANG_XU_LY').length;
    const choPvtXuLy = pvtDispatches.filter(d => d.trangThai === 'CHO_PVT_XU_LY').length;
    const choPvtDuyet = pvtDispatches.filter(d => d.trangThai === 'CHO_PVT_DUYET').length;
    const choVtDuyet = pvtDispatches.filter(d => d.trangThai === 'CHO_VT_DUYET').length;

    return {
      summary: {
        total,
        hoanThanh,
        dangXuLy,
        choPvtXuLy,
        choPvtDuyet,
        choVtDuyet,
        tyLeHoanThanh: total > 0 ? Math.round((hoanThanh / total) * 100) : 0,
      },
    };
  },

  // ============================================
  // 4. DASHBOARD THEO TP
  // ============================================
  async getTpDashboard(currentUser) {
    const tpId = currentUser.id;

    const tpDispatches = await prisma.dispatch.findMany({
      where: {
        dispatchTps: { some: { tpId } },
        deletedAt: null,
      },
    });

    const total = tpDispatches.length;
    const hoanThanh = tpDispatches.filter(d => d.trangThai === 'HOAN_THANH').length;
    const dangXuLy = tpDispatches.filter(d => d.trangThai === 'DANG_XU_LY').length;
    const choTpXuLy = tpDispatches.filter(d => d.trangThai === 'CHO_TP_XU_LY').length;
    const choPvtDuyet = tpDispatches.filter(d => d.trangThai === 'CHO_PVT_DUYET').length;
    const pvtTraLai = tpDispatches.filter(d => d.trangThai === 'PVT_TRA_LAI').length;

    return {
      summary: {
        total,
        hoanThanh,
        dangXuLy,
        choTpXuLy,
        choPvtDuyet,
        pvtTraLai,
        tyLeHoanThanh: total > 0 ? Math.round((hoanThanh / total) * 100) : 0,
      },
    };
  },
};```

#### FILE: backend/src/services/users.service.js
```javascript
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
      deletedAt: null,  // Không lấy user đã xóa mềm
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
  // 5. XÓA MỀM USER
  // ============================================
  async deleteUser(userId, currentUser) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    // Xóa mềm
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          active: false,
          deletedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          userName: currentUser.fullName,
          action: 'DELETE_USER',
          entityType: 'user',
          entityId: userId,
          oldValue: { username: user.username, fullName: user.fullName },
        },
      });
    });

    return {
      success: true,
      message: `Đã vô hiệu hóa tài khoản "${user.fullName}"`,
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
};```

### 4.3. Controllers

#### FILE: backend/src/controllers/admin.controller.js
```javascript
// backend/src/controllers/admin.controller.js
import { adminService } from '../services/admin.service.js';

export const adminController = {
  async getTables(req, res, next) {
    try {
      const result = await adminService.getTables();
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async getTableData(req, res, next) {
    try {
      const result = await adminService.getTableData(
        req.params.table,
        req.query
      );
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async getStats(req, res, next) {
    try {
      const result = await adminService.getStats();
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async getAuditLogs(req, res, next) {
    try {
      const result = await adminService.getAuditLogs(req.query);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async getSessions(req, res, next) {
    try {
      const result = await adminService.getSessions(req.query);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },
};```

#### FILE: backend/src/controllers/assignments.controller.js
```javascript
// backend/src/controllers/assignments.controller.js
import { assignmentsService } from '../services/assignments.service.js';

export const assignmentsController = {
  // ============================================
  // 1. VT GIAO CHO 1-N PVT
  // POST /api/dispatches/:id/assign-pvts
  // ============================================
  async assignPvts(req, res, next) {
    try {
      const dispatchId = req.params.id;
      const result = await assignmentsService.assignPvts(
        dispatchId,
        req.body,
        req.user
      );

      res.json({
        success: true,
        message: 'Đã giao công văn cho PVT',
        dispatch: result,
      });
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // 2. PVT GIAO CHO 1-N TP
  // POST /api/dispatches/:id/assign-tps
  // ============================================
  async assignTps(req, res, next) {
    try {
      const dispatchId = req.params.id;
      const result = await assignmentsService.assignTps(
        dispatchId,
        req.body,
        req.user
      );

      res.json({
        success: true,
        message: 'Đã giao công văn cho TP',
        dispatch: result,
      });
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // 3. TP ĐÁNH SỐ CÔNG VĂN
  // POST /api/dispatches/:id/tp-number
  // ============================================
  async tpNumber(req, res, next) {
    try {
      const dispatchId = req.params.id;
      const result = await assignmentsService.tpNumber(
        dispatchId,
        req.body,
        req.user
      );

      res.json({
        success: true,
        message: 'Đã đánh số công văn',
        dispatch: result,
      });
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // 4. TP GỬI LÊN PVT
  // POST /api/dispatches/:id/tp-submit
  // ============================================
  async tpSubmit(req, res, next) {
    try {
      const dispatchId = req.params.id;
      const result = await assignmentsService.tpSubmit(
        dispatchId,
        req.body,
        req.user
      );

      res.json({
        success: true,
        message: 'Đã gửi báo cáo lên PVT',
        dispatch: result,
      });
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // 5. PVT TRÌNH LÊN VT
  // POST /api/dispatches/:id/pvt-submit
  // ============================================
  async pvtSubmit(req, res, next) {
    try {
      const dispatchId = req.params.id;
      const result = await assignmentsService.pvtSubmit(
        dispatchId,
        req.body,
        req.user
      );

      res.json({
        success: true,
        message: 'Đã trình công văn lên Viện trưởng',
        dispatch: result,
      });
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // 6. VT ĐỒNG Ý
  // POST /api/dispatches/:id/vt-agree
  // ============================================
  async vtAgree(req, res, next) {
    try {
      const dispatchId = req.params.id;
      const result = await assignmentsService.vtAgree(
        dispatchId,
        req.body,
        req.user
      );

      res.json({
        success: true,
        message: 'Viện trưởng đã đồng ý',
        dispatch: result,
      });
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // 7. VT KHÔNG ĐỒNG Ý (TRẢ LẠI PVT)
  // POST /api/dispatches/:id/vt-disagree
  // ============================================
  async vtDisagree(req, res, next) {
    try {
      const dispatchId = req.params.id;
      const result = await assignmentsService.vtDisagree(
        dispatchId,
        req.body,
        req.user
      );

      res.json({
        success: true,
        message: 'Đã trả lại công văn cho PVT',
        dispatch: result,
      });
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // 8. PVT ĐỒNG Ý
  // POST /api/dispatches/:id/pvt-agree
  // ============================================
  async pvtAgree(req, res, next) {
    try {
      const dispatchId = req.params.id;
      const result = await assignmentsService.pvtAgree(
        dispatchId,
        req.body,
        req.user
      );

      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // 9. PVT KHÔNG ĐỒNG Ý (TRẢ LẠI TP)
  // POST /api/dispatches/:id/pvt-disagree
  // ============================================
  async pvtDisagree(req, res, next) {
    try {
      const dispatchId = req.params.id;
      const result = await assignmentsService.pvtDisagree(
        dispatchId,
        req.body,
        req.user
      );

      res.json({
        success: true,
        message: 'Đã trả lại công văn cho TP',
        dispatch: result,
      });
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // 10. LỊCH SỬ LUÂN CHUYỂN
  // GET /api/dispatches/:id/history
  // ============================================
  async getHistory(req, res, next) {
    try {
      const dispatchId = req.params.id;
      const history = await assignmentsService.getHistory(dispatchId);

      res.json({
        success: true,
        history,
      });
    } catch (err) {
      next(err);
    }
  },
};```

#### FILE: backend/src/controllers/attachments.controller.js
```javascript
// backend/src/controllers/attachments.controller.js
import { attachmentsService } from '../services/attachments.service.js';
import fs from 'fs';
import path from 'path';

export const attachmentsController = {
  // ============================================
  // 1. POST /api/dispatches/:id/attachments
  // ============================================
  async uploadAttachment(req, res, next) {
    try {
      const dispatchId = req.params.id;
      const attachment = await attachmentsService.uploadAttachment(
        dispatchId,
        req.file,
        req.body,
        req.user
      );

      res.status(201).json({
        success: true,
        message: 'Upload file thành công',
        attachment,
      });
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // 2. GET /api/dispatches/:id/attachments
  // ============================================
  async getAttachments(req, res, next) {
    try {
      const result = await attachmentsService.getAttachments(
        req.params.id,
        req.user
      );
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // 3. GET /api/attachments/:id/download
  // ============================================
  async downloadAttachment(req, res, next) {
    try {
      const attachment = await attachmentsService.getAttachmentForDownload(
        req.params.id,
        req.user
      );

      // Set headers
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(attachment.fileName)}"`
      );
      res.setHeader('Content-Type', attachment.fileType);

      // Stream file
      const fileStream = fs.createReadStream(attachment.filePath);
      fileStream.pipe(res);
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // 4. DELETE /api/attachments/:id
  // ============================================
  async deleteAttachment(req, res, next) {
    try {
      const result = await attachmentsService.deleteAttachment(
        req.params.id,
        req.user
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};```

#### FILE: backend/src/controllers/auth.controller.js
```javascript
// backend/src/controllers/auth.controller.js
import { authService } from '../services/auth.service.js';

export const authController = {
  async login(req, res, next) {
    try {
      if (!req.body) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu dữ liệu',
        });
      }

      const { username, password } = req.body || {};

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập tên đăng nhập và mật khẩu',
        });
      }

      const result = await authService.login({ username, password });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async me(req, res, next) {
    try {
      const user = await authService.getCurrentUser(req.user.id);
      res.json({ success: true, user });
    } catch (err) {
      next(err);
    }
  },

  async logout(req, res) {
    res.json({ success: true, message: 'Đã đăng xuất' });
  },
    async changePassword(req, res, next) {
    try {
      const { oldPassword, newPassword } = req.body;
      const result = await authService.changePassword(
        req.user.id,
        oldPassword,
        newPassword
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};```

#### FILE: backend/src/controllers/departments.controller.js
```javascript
// backend/src/controllers/departments.controller.js
import { departmentsService } from '../services/departments.service.js';

export const departmentsController = {
  // ============================================
  // 1. GET /api/departments
  // ============================================
  async getDepartments(req, res, next) {
    try {
      const result = await departmentsService.getDepartments(req.query);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // 2. GET /api/departments/:id
  // ============================================
  async getDepartmentById(req, res, next) {
    try {
      const result = await departmentsService.getDepartmentById(req.params.id);
      res.json({ success: true, department: result });
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // 3. POST /api/departments
  // ============================================
  async createDepartment(req, res, next) {
    try {
      const result = await departmentsService.createDepartment(
        req.body,
        req.user
      );
      res.status(201).json({
        success: true,
        message: 'Tạo phòng ban thành công',
        department: result,
      });
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // 4. PUT /api/departments/:id
  // ============================================
  async updateDepartment(req, res, next) {
    try {
      const result = await departmentsService.updateDepartment(
        req.params.id,
        req.body,
        req.user
      );
      res.json({
        success: true,
        message: 'Cập nhật thành công',
        department: result,
      });
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // 5. DELETE /api/departments/:id
  // ============================================
  async deleteDepartment(req, res, next) {
    try {
      const result = await departmentsService.deleteDepartment(
        req.params.id,
        req.user
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};```

#### FILE: backend/src/controllers/dispatches.controller.js
```javascript
// backend/src/controllers/dispatches.controller.js
import { dispatchesService } from '../services/dispatches.service.js';

export const dispatchesController = {
  // ============================================
  // 1. GET /api/dispatches
  // ============================================
  async getDispatches(req, res, next) {
    try {
      const result = await dispatchesService.getDispatches(
        req.user,
        req.query
      );
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // 2. GET /api/dispatches/:id
  // ============================================
  async getDispatchById(req, res, next) {
    try {
      const dispatch = await dispatchesService.getDispatchById(
        req.params.id,
        req.user
      );
      res.json({ success: true, dispatch });
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // 3. POST /api/dispatches
  // ============================================
  async createDispatch(req, res, next) {
    try {
      const dispatch = await dispatchesService.createDispatch(
        req.body,
        req.user
      );
      res.status(201).json({
        success: true,
        message: 'Tạo công văn thành công',
        dispatch,
      });
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // 4. PUT /api/dispatches/:id
  // ============================================
  async updateDispatch(req, res, next) {
    try {
      const dispatch = await dispatchesService.updateDispatch(
        req.params.id,
        req.body,
        req.user
      );
      res.json({
        success: true,
        message: 'Cập nhật thành công',
        dispatch,
      });
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // 5. DELETE /api/dispatches/:id
  // ============================================
  async deleteDispatch(req, res, next) {
    try {
      const result = await dispatchesService.deleteDispatch(
        req.params.id,
        req.user
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // 6. GET /api/dispatches/stats
  // ============================================
  async getStats(req, res, next) {
    try {
      const stats = await dispatchesService.getStats(req.user);
      res.json({ success: true, stats });
    } catch (err) {
      next(err);
    }
  },
  async markComplete(req, res, next) {
    try {
      const result = await dispatchesService.markComplete(
        req.params.id,
        req.user,
        req.body?.note
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};```

#### FILE: backend/src/controllers/notifications.controller.js
```javascript
// backend/src/controllers/notifications.controller.js
import { notificationsService } from '../services/notifications.service.js';

export const notificationsController = {
  async getNotifications(req, res, next) {
    try {
      const result = await notificationsService.getNotifications(
        req.user,
        req.query
      );
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async markAsRead(req, res, next) {
    try {
      const result = await notificationsService.markAsRead(
        req.params.id,
        req.user
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async markAllAsRead(req, res, next) {
    try {
      const result = await notificationsService.markAllAsRead(req.user);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async deleteNotification(req, res, next) {
    try {
      const result = await notificationsService.deleteNotification(
        req.params.id,
        req.user
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async getUnreadCount(req, res, next) {
    try {
      const result = await notificationsService.getUnreadCount(req.user);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },
};```

#### FILE: backend/src/controllers/permissions.controller.js
```javascript
// backend/src/controllers/permissions.controller.js
import { permissionsService } from '../services/permissions.service.js';

export const permissionsController = {
  async getPermissions(req, res, next) {
    try {
      const result = await permissionsService.getPermissions(req.query);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async getPermissionById(req, res, next) {
    try {
      const permission = await permissionsService.getPermissionById(req.params.id);
      res.json({ success: true, permission });
    } catch (err) {
      next(err);
    }
  },

  async getModules(req, res, next) {
    try {
      const result = await permissionsService.getModules();
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },
};```

#### FILE: backend/src/controllers/reports.controller.js
```javascript
// backend/src/controllers/reports.controller.js
import { reportsService } from '../services/reports.service.js';

export const reportsController = {
  async createReport(req, res, next) {
    try {
      const report = await reportsService.createReport(
        req.params.id,
        req.body,
        req.user
      );
      res.status(201).json({
        success: true,
        message: 'Tạo báo cáo thành công',
        report,
      });
    } catch (err) {
      next(err);
    }
  },

  async getReportsByDispatch(req, res, next) {
    try {
      const result = await reportsService.getReportsByDispatch(
        req.params.id,
        req.user
      );
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async getAllReports(req, res, next) {
    try {
      const result = await reportsService.getAllReports(req.user, req.query);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async deleteReport(req, res, next) {
    try {
      const result = await reportsService.deleteReport(
        req.params.id,
        req.user
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};```

#### FILE: backend/src/controllers/roles.controller.js
```javascript
// backend/src/controllers/roles.controller.js
import { rolesService } from '../services/roles.service.js';

export const rolesController = {
  async getRoles(req, res, next) {
    try {
      const result = await rolesService.getRoles(req.query);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async getRoleById(req, res, next) {
    try {
      const role = await rolesService.getRoleById(req.params.id);
      res.json({ success: true, role });
    } catch (err) {
      next(err);
    }
  },

  async createRole(req, res, next) {
    try {
      const role = await rolesService.createRole(req.body, req.user);
      res.status(201).json({
        success: true,
        message: 'Tạo role thành công',
        role,
      });
    } catch (err) {
      next(err);
    }
  },

  async updateRole(req, res, next) {
    try {
      const role = await rolesService.updateRole(
        req.params.id,
        req.body,
        req.user
      );
      res.json({
        success: true,
        message: 'Cập nhật thành công',
        role,
      });
    } catch (err) {
      next(err);
    }
  },

  async assignPermissions(req, res, next) {
    try {
      const { permissionIds } = req.body;
      const result = await rolesService.assignPermissions(
        req.params.id,
        permissionIds,
        req.user
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async deleteRole(req, res, next) {
    try {
      const result = await rolesService.deleteRole(req.params.id, req.user);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};```

#### FILE: backend/src/controllers/stats.controller.js
```javascript
// backend/src/controllers/stats.controller.js
import { statsService } from '../services/stats.service.js';

export const statsController = {
  async getVTOverview(req, res, next) {
    try {
      const result = await statsService.getVTOverview(req.user);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async getChartData(req, res, next) {
    try {
      const result = await statsService.getChartData(req.user);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async getPvtDashboard(req, res, next) {
    try {
      const result = await statsService.getPvtDashboard(req.user);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async getTpDashboard(req, res, next) {
    try {
      const result = await statsService.getTpDashboard(req.user);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },
};```

#### FILE: backend/src/controllers/users.controller.js
```javascript
// backend/src/controllers/users.controller.js
import { usersService } from '../services/users.service.js';

export const usersController = {
  // 1. GET /api/users
  async getUsers(req, res, next) {
    try {
      const result = await usersService.getUsers(req.user, req.query);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  // 2. GET /api/users/:id
  async getUserById(req, res, next) {
    try {
      const user = await usersService.getUserById(req.params.id, req.user);
      res.json({ success: true, user });
    } catch (err) {
      next(err);
    }
  },

  // 3. POST /api/users
  async createUser(req, res, next) {
    try {
      const user = await usersService.createUser(req.body, req.user);
      res.status(201).json({
        success: true,
        message: 'Tạo tài khoản thành công',
        user,
      });
    } catch (err) {
      next(err);
    }
  },

  // 4. PUT /api/users/:id
  async updateUser(req, res, next) {
    try {
      const user = await usersService.updateUser(
        req.params.id,
        req.body,
        req.user
      );
      res.json({
        success: true,
        message: 'Cập nhật thành công',
        user,
      });
    } catch (err) {
      next(err);
    }
  },

  // 5. DELETE /api/users/:id
  async deleteUser(req, res, next) {
    try {
      const result = await usersService.deleteUser(req.params.id, req.user);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  // 6. PUT /api/users/:id/roles
  async assignRoles(req, res, next) {
    try {
      const { roleIds } = req.body;
      const result = await usersService.assignRoles(
        req.params.id,
        roleIds,
        req.user
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  // 7. POST /api/users/:id/reset-password
  async resetPassword(req, res, next) {
    try {
      const { newPassword } = req.body;
      const result = await usersService.resetPassword(
        req.params.id,
        newPassword,
        req.user
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  // 8. PATCH /api/users/:id/toggle-active
  async toggleActive(req, res, next) {
    try {
      const result = await usersService.toggleActive(req.params.id, req.user);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};```

### 4.4. Routes

#### FILE: backend/src/routes/admin.routes.js
```javascript
// backend/src/routes/admin.routes.js
import express from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permission.js';

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /api/admin/database/tables:
 *   get:
 *     tags: [Admin]
 *     summary: Danh sách bảng + số records
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 tables:
 *                   - name: users
 *                     count: 27
 *                   - name: dispatches
 *                     count: 9
 */
router.get(
  '/database/tables',
  requirePermission('admin:database:view'),
  adminController.getTables
);

/**
 * @swagger
 * /api/admin/database/table/{table}:
 *   get:
 *     tags: [Admin]
 *     summary: Xem data của 1 bảng
 *     parameters:
 *       - in: path
 *         name: table
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OK
 */
router.get(
  '/database/table/:table',
  requirePermission('admin:database:view'),
  adminController.getTableData
);

/**
 * @swagger
 * /api/admin/database/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Thống kê tổng quan database
 *     responses:
 *       200:
 *         description: OK
 */
router.get(
  '/database/stats',
  requirePermission('admin:database:view'),
  adminController.getStats
);

/**
 * @swagger
 * /api/admin/audit-logs:
 *   get:
 *     tags: [Admin]
 *     summary: Nhật ký hệ thống
 *     responses:
 *       200:
 *         description: OK
 */
router.get(
  '/audit-logs',
  requirePermission('admin:audit-logs:view'),
  adminController.getAuditLogs
);

/**
 * @swagger
 * /api/admin/sessions:
 *   get:
 *     tags: [Admin]
 *     summary: Phiên đăng nhập
 *     responses:
 *       200:
 *         description: OK
 */
router.get(
  '/sessions',
  requirePermission('admin:database:view'),
  adminController.getSessions
);

export default router;```

#### FILE: backend/src/routes/assignments.routes.js
```javascript
// backend/src/routes/assignments.routes.js
import express from 'express';
import { assignmentsController } from '../controllers/assignments.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permission.js';

const router = express.Router();

// Tất cả route cần đăng nhập
router.use(authenticate);

// ============================================
// 1. VT GIAO CHO 1-N PVT
// POST /api/dispatches/:id/assign-pvts
// ============================================
/**
 * @swagger
 * /api/dispatches/{id}/assign-pvts:
 *   post:
 *     summary: Viện trưởng giao công văn cho 1-N Phó Viện trưởng
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pvts:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     pvtId:
 *                       type: string
 *                     pvtName:
 *                       type: string
 *                     roomCode:
 *                       type: string
 *                     isPrimary:
 *                       type: boolean
 *                     example:
 *                       - pvtId: u_pvt_1
 *                         pvtName: Đ/c Phó Viện Trưởng 1
 *                         roomCode: PVT1
 *                         isPrimary: true
 *               vtChiDao:
 *                 type: string
 *                 example: Giao PVT1 chủ trì
 *               hanBaoCaoXuLy:
 *                 type: string
 *                 example: '2026-09-30'
 *               mucDoKhan:
 *                 type: string
 *                 example: KHAN
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: Đã giao công văn cho PVT
 */
router.post(
  '/dispatches/:id/assign-pvts',
  requirePermission('assignment:assign:pvt'),
  assignmentsController.assignPvts
);

// ============================================
// 2. PVT GIAO CHO 1-N TP
// POST /api/dispatches/:id/assign-tps
// ============================================
/**
 * @swagger
 * /api/dispatches/{id}/assign-tps:
 *   post:
 *     summary: PVT giao công văn cho 1-N Trưởng phòng
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tps:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     tpId:
 *                       type: string
 *                     tpName:
 *                       type: string
 *                     roomCode:
 *                       type: string
 *                     isPrimary:
 *                       type: boolean
 *               pvtChiDao:
 *                 type: string
 *               hanBaoCaoXuLy:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.post(
  '/dispatches/:id/assign-tps',
  requirePermission('assignment:assign:tp'),
  assignmentsController.assignTps
);

// ============================================
// 3. TP ĐÁNH SỐ CÔNG VĂN
// POST /api/dispatches/:id/tp-number
// ============================================
/**
 * @swagger
 * /api/dispatches/{id}/tp-number:
 *   post:
 *     summary: Trưởng phòng đánh số công văn
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               soCongVanTP:
 *                 type: string
 *                 example: 142/BC-VKS
 *               ngayDanhSo:
 *                 type: string
 *                 example: '2026-09-19'
 *     responses:
 *       200:
 *         description: OK
 */
router.post(
  '/dispatches/:id/tp-number',
  requirePermission('assignment:number'),
  assignmentsController.tpNumber
);

// ============================================
// 4. TP GỬI LÊN PVT
// POST /api/dispatches/:id/tp-submit
// ============================================
/**
 * @swagger
 * /api/dispatches/{id}/tp-submit:
 *   post:
 *     summary: Trưởng phòng gửi báo cáo lên PVT
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               baoCaoTienDo:
 *                 type: string
 *               tienDo:
 *                 type: integer
 *                 example: 100
 *     responses:
 *       200:
 *         description: OK
 */
router.post(
  '/dispatches/:id/tp-submit',
  requirePermission('assignment:submit:pvt'),
  assignmentsController.tpSubmit
);

// ============================================
// 5. PVT TRÌNH LÊN VT
// POST /api/dispatches/:id/pvt-submit
// ============================================
/**
 * @swagger
 * /api/dispatches/{id}/pvt-submit:
 *   post:
 *     summary: PVT trình công văn lên Viện trưởng
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pvtChiDao:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.post(
  '/dispatches/:id/pvt-submit',
  requirePermission('assignment:submit:vt'),
  assignmentsController.pvtSubmit
);

// ============================================
// 6. VT ĐỒNG Ý
// POST /api/dispatches/:id/vt-agree
// ============================================
/**
 * @swagger
 * /api/dispatches/{id}/vt-agree:
 *   post:
 *     summary: Viện trưởng đồng ý công văn
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.post(
  '/dispatches/:id/vt-agree',
  requirePermission('assignment:agree'),
  assignmentsController.vtAgree
);

// ============================================
// 7. VT KHÔNG ĐỒNG Ý
// POST /api/dispatches/:id/vt-disagree
// ============================================
/**
 * @swagger
 * /api/dispatches/{id}/vt-disagree:
 *   post:
 *     summary: Viện trưởng không đồng ý (trả lại PVT)
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Cần bổ sung số liệu
 *     responses:
 *       200:
 *         description: OK
 */
router.post(
  '/dispatches/:id/vt-disagree',
  requirePermission('assignment:disagree'),
  assignmentsController.vtDisagree
);

// ============================================
// 8. PVT ĐỒNG Ý
// POST /api/dispatches/:id/pvt-agree
// ============================================
/**
 * @swagger
 * /api/dispatches/{id}/pvt-agree:
 *   post:
 *     summary: PVT đồng ý báo cáo của TP
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tpId:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.post(
  '/dispatches/:id/pvt-agree',
  requirePermission('assignment:agree'),
  assignmentsController.pvtAgree
);

// ============================================
// 9. PVT KHÔNG ĐỒNG Ý
// POST /api/dispatches/:id/pvt-disagree
// ============================================
/**
 * @swagger
 * /api/dispatches/{id}/pvt-disagree:
 *   post:
 *     summary: PVT không đồng ý (trả lại TP)
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *               tpId:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.post(
  '/dispatches/:id/pvt-disagree',
  requirePermission('assignment:disagree'),
  assignmentsController.pvtDisagree
);

// ============================================
// 10. LỊCH SỬ LUÂN CHUYỂN
// GET /api/dispatches/:id/history
// ============================================
/**
 * @swagger
 * /api/dispatches/{id}/history:
 *   get:
 *     summary: Lịch sử luân chuyển công văn
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 history:
 *                   - type: ASSIGNMENT
 *                     action: VT_TO_PVT
 *                     from: Viện trưởng
 *                     to: PVT1
 *                     at: '2026-09-19T10:00:00Z'
 */
router.get(
  '/dispatches/:id/history',
  assignmentsController.getHistory
);

export default router;```

#### FILE: backend/src/routes/attachments.routes.js
```javascript
// backend/src/routes/attachments.routes.js
import express from 'express';
import { attachmentsController } from '../controllers/attachments.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { upload } from '../config/multer.js';

const router = express.Router();

router.use(authenticate);

// ============================================
// UPLOAD — POST /api/dispatches/:id/attachments
// ============================================
/**
 * @swagger
 * /api/dispatches/{id}/attachments:
 *   post:
 *     tags: [Attachments]
 *     summary: Upload file đính kèm cho công văn
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               fileCategory:
 *                 type: string
 *                 enum: [ORIGINAL, DRAFT, REPORT, APPROVAL, REJECTION, OTHER]
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Upload thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: Upload file thành công
 *                 attachment:
 *                   id: att-xxx
 *                   fileName: baocao.pdf
 *                   fileSize: 1024000
 *                   fileType: application/pdf
 *                   uploaderName: Admin
 */
router.post(
  '/dispatches/:id/attachments',
  upload.single('file'),
  attachmentsController.uploadAttachment
);

// ============================================
// LIST — GET /api/dispatches/:id/attachments
// ============================================
/**
 * @swagger
 * /api/dispatches/{id}/attachments:
 *   get:
 *     tags: [Attachments]
 *     summary: Danh sách file đính kèm
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 attachments:
 *                   - id: att-xxx
 *                     fileName: baocao.pdf
 *                     fileSize: 1024000
 *                     uploaderName: Admin
 */
router.get(
  '/dispatches/:id/attachments',
  attachmentsController.getAttachments
);

// ============================================
// DOWNLOAD — GET /api/attachments/:id/download
// ============================================
/**
 * @swagger
 * /api/attachments/{id}/download:
 *   get:
 *     tags: [Attachments]
 *     summary: Download file
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File binary
 */
router.get(
  '/attachments/:id/download',
  attachmentsController.downloadAttachment
);

// ============================================
// DELETE — DELETE /api/attachments/:id
// ============================================
/**
 * @swagger
 * /api/attachments/{id}:
 *   delete:
 *     tags: [Attachments]
 *     summary: Xóa file (mềm)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.delete(
  '/attachments/:id',
  attachmentsController.deleteAttachment
);

export default router;```

#### FILE: backend/src/routes/auth.routes.js
```javascript
// backend/src/routes/auth.routes.js
import express from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập hệ thống
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin
 *               password:
 *                 type: string
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 roles:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ['ADMIN']
 *                 permissions:
 *                   type: array
 *                   items:
 *                     type: string
 *                 token:
 *                   type: string
 *       401:
 *         description: Sai tài khoản hoặc mật khẩu
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Lấy thông tin user hiện tại
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Chưa đăng nhập
 */
router.get('/me', authenticate, authController.me);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Đăng xuất
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 */
router.post('/logout', authenticate, authController.logout);
/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: User tự đổi mật khẩu
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, newPassword]
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 *       401:
 *         description: Mật khẩu hiện tại không chính xác
 */
router.post('/change-password', authenticate, authController.changePassword);

export default router;```

#### FILE: backend/src/routes/departments.routes.js
```javascript
// backend/src/routes/departments.routes.js
import express from 'express';
import { departmentsController } from '../controllers/departments.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permission.js';

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /api/departments:
 *   get:
 *     tags: [Departments]
 *     summary: Danh sách phòng ban
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 departments:
 *                   - id: uuid
 *                     code: TP1
 *                     name: Phòng 1 (Án an ninh)
 *                     manager:
 *                       fullName: Trưởng phòng 1
 *                     pvtManager:
 *                       fullName: Phó Viện trưởng 1
 */
router.get('/', departmentsController.getDepartments);

/**
 * @swagger
 * /api/departments/{id}:
 *   get:
 *     tags: [Departments]
 *     summary: Chi tiết phòng ban
 */
router.get('/:id', departmentsController.getDepartmentById);

/**
 * @swagger
 * /api/departments:
 *   post:
 *     tags: [Departments]
 *     summary: Tạo phòng ban
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               managerId:
 *                 type: string
 *               pvtManagerId:
 *                 type: string
 *     responses:
 *       201:
 *         description: OK
 */
router.post(
  '/',
  requirePermission('user:create'),
  departmentsController.createDepartment
);

/**
 * @swagger
 * /api/departments/{id}:
 *   put:
 *     summary: Cập nhật phòng ban
 *     tags: [Departments]
 */
router.put(
  '/:id',
  requirePermission('user:update:all'),
  departmentsController.updateDepartment
);

/**
 * @swagger
 * /api/departments/{id}: 
 * tags: [Departments]
 *   delete:
 *     summary: Xóa phòng ban
 */
router.delete(
  '/:id',
  requirePermission('user:delete'),
  departmentsController.deleteDepartment
);

export default router;```

#### FILE: backend/src/routes/dispatches.routes.js
```javascript
// backend/src/routes/dispatches.routes.js
import express from 'express';
import { dispatchesController } from '../controllers/dispatches.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permission.js';

const router = express.Router();

router.use(authenticate);

// ============================================
// 1. GET /api/dispatches
// ============================================
/**
 * @swagger
 * /api/dispatches:
 * tags: [Dispatches]
 *   get:
 *     summary: Danh sách công văn (filter theo role)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: trangThai
 *         schema:
 *           type: string
 *       - in: query
 *         name: mucDoKhan
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 dispatches:
 *                   - id: cv-001
 *                     soCongVan: 142/BC-UBND
 *                     tenCongVan: Báo cáo Q3
 *                     trangThai: DANG_XU_LY
 *                 pagination:
 *                   page: 1
 *                   limit: 20
 *                   total: 9
 *                   totalPages: 1
 */
router.get(
  '/',
  requirePermission(
    'dispatch:view:all',
    'dispatch:view:department',
    'dispatch:view:assigned',
    'dispatch:view:own'
  ),
  dispatchesController.getDispatches
);

// ============================================
// 2. GET /api/dispatches/stats — PHẢI ĐẶT TRƯỚC /:id
// ============================================
/**
 * @swagger
 * /api/dispatches/stats:
 * tags: [Dispatches]
 *   get:
 *     summary: Thống kê công văn
 *     responses:
 *       200:
 *         description: OK
 */
router.get(
  '/stats',
  dispatchesController.getStats
);

// ============================================
// 3. GET /api/dispatches/:id
// ============================================
/**
 * @swagger
 * /api/dispatches/{id}:
 * tags: [Dispatches]
 *   get:
 *     summary: Chi tiết công văn
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Không tìm thấy
 */
router.get(
  '/:id',
  dispatchesController.getDispatchById
);

// ============================================
// 4. POST /api/dispatches
// ============================================
/**
 * @swagger
 * /api/dispatches:
 * tags: [Dispatches]
 *   post:
 *     summary: Tạo công văn mới
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               soCongVan:
 *                 type: string
 *                 example: 142/BC-UBND
 *               tenCongVan:
 *                 type: string
 *                 example: Báo cáo rà soát Q3
 *               ngayGui:
 *                 type: string
 *                 example: '2026-09-19'
 *               ngayPhatHanh:
 *                 type: string
 *                 example: '2026-09-18'
 *               hanBaoCaoXuLy:
 *                 type: string
 *                 example: '2026-09-30'
 *               donViBanHanh:
 *                 type: string
 *                 example: UBND Tỉnh
 *               mucDoKhan:
 *                 type: string
 *                 example: KHAN
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post(
  '/',
  requirePermission('dispatch:create'),
  dispatchesController.createDispatch
);

// ============================================
// 5. PUT /api/dispatches/:id
// ============================================
/**
 * @swagger
 * /api/dispatches/{id}:
 * tags: [Dispatches]
 *   put:
 *     summary: Cập nhật công văn
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tenCongVan:
 *                 type: string
 *               nguoiThucHien:
 *                 type: string
 *               ghiChu:
 *                 type: string
 *               mucDoKhan:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put(
  '/:id',
  requirePermission('dispatch:update:all', 'dispatch:update:assigned'),
  dispatchesController.updateDispatch
);

// ============================================
// 6. DELETE /api/dispatches/:id
// ============================================
/**
 * @swagger
 * /api/dispatches/{id}:
 *   tags: [Dispatches]
 *   delete:
 *     summary: Xóa mềm công văn
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete(
  '/:id',
  requirePermission('dispatch:delete'),
  dispatchesController.deleteDispatch
);

// ============================================
// 7. PATCH /api/dispatches/:id/complete
// PVT/TP tự đánh dấu hoàn thành
// ============================================
router.patch(
  '/:id/complete',
  dispatchesController.markComplete
);
export default router;```

#### FILE: backend/src/routes/notifications.routes.js
```javascript
// backend/src/routes/notifications.routes.js
import express from 'express';
import { notificationsController } from '../controllers/notifications.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Danh sách thông báo của user
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 unreadCount: 5
 *                 notifications:
 *                   - id: uuid
 *                     type: TASK_ASSIGNED
 *                     title: Công văn mới được giao
 *                     isRead: false
 */
router.get('/', notificationsController.getNotifications);

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     tags: [Notifications]
 *     summary: Số thông báo chưa đọc
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 unreadCount: 5
 */
router.get('/unread-count', notificationsController.getUnreadCount);

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     tags: [Notifications]
 *     summary: Đánh dấu tất cả đã đọc
 *     responses:
 *       200:
 *         description: OK
 */
router.patch('/read-all', notificationsController.markAllAsRead);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Đánh dấu 1 thông báo đã đọc
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.patch('/:id/read', notificationsController.markAsRead);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     tags: [Notifications]
 *     summary: Xóa thông báo
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.delete('/:id', notificationsController.deleteNotification);

export default router;```

#### FILE: backend/src/routes/permissions.routes.js
```javascript
// backend/src/routes/permissions.routes.js
import express from 'express';
import { permissionsController } from '../controllers/permissions.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /api/permissions:
 *   get:
 *     tags: [Permissions]
 *     summary: Danh sách permissions (grouped by module)
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 total: 40
 *                 grouped:
 *                   user:
 *                     - id: 1
 *                       code: user:view:all
 *                       name: Xem tất cả user
 *                   dispatch:
 *                     - id: 11
 *                       code: dispatch:view:all
 */
router.get('/', permissionsController.getPermissions);

/**
 * @swagger
 * /api/permissions/modules:
 *   get:
 *     tags: [Permissions]
 *     summary: Danh sách modules
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/modules', permissionsController.getModules);

/**
 * @swagger
 * /api/permissions/{id}:
 *   get:
 *     tags: [Permissions]
 *     summary: Chi tiết permission
 */
router.get('/:id', permissionsController.getPermissionById);

export default router;```

#### FILE: backend/src/routes/reports.routes.js
```javascript
// backend/src/routes/reports.routes.js
import express from 'express';
import { reportsController } from '../controllers/reports.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

// ============================================
// TẠO BÁO CÁO — POST /api/dispatches/:id/reports
// ============================================
/**
 * @swagger
 * /api/dispatches/{id}/reports:
 *   post:
 *     tags: [Reports]
 *     summary: Tạo báo cáo tiến độ
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 example: Đã hoàn thành 75% khối lượng
 *               progressPct:
 *                 type: integer
 *                 example: 75
 *               reportType:
 *                 type: string
 *                 enum: [PROGRESS, ISSUE, COMPLETION]
 *               attachmentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: Tạo báo cáo thành công
 *                 report:
 *                   id: uuid
 *                   content: Đã hoàn thành 75%
 *                   progressPct: 75
 */
router.post(
  '/dispatches/:id/reports',
  reportsController.createReport
);

// ============================================
// DS BÁO CÁO CỦA CÔNG VĂN — GET /api/dispatches/:id/reports
// ============================================
/**
 * @swagger
 * /api/dispatches/{id}/reports:
 *   get:
 *     tags: [Reports]
 *     summary: Danh sách báo cáo của công văn
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.get(
  '/dispatches/:id/reports',
  reportsController.getReportsByDispatch
);

// ============================================
// DS TẤT CẢ BÁO CÁO — GET /api/reports
// ============================================
/**
 * @swagger
 * /api/reports:
 *   get:
 *     tags: [Reports]
 *     summary: Tất cả báo cáo (theo role)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/reports', reportsController.getAllReports);

// ============================================
// XÓA BÁO CÁO — DELETE /api/reports/:id
// ============================================
/**
 * @swagger
 * /api/reports/{id}:
 *   delete:
 *     tags: [Reports]
 *     summary: Xóa báo cáo
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.delete('/reports/:id', reportsController.deleteReport);

export default router;```

#### FILE: backend/src/routes/roles.routes.js
```javascript
// backend/src/routes/roles.routes.js
import express from 'express';
import { rolesController } from '../controllers/roles.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permission.js';

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /api/roles:
 *   get:
 *     tags: [Roles]
 *     summary: Danh sách roles
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 roles:
 *                   - id: 1
 *                     code: ADMIN
 *                     name: Quản trị viên
 *                     userCount: 1
 *                     permissionCount: 40
 */
router.get('/', rolesController.getRoles);

/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     tags: [Roles]
 *     summary: Chi tiết role + permissions
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/:id', rolesController.getRoleById);

/**
 * @swagger
 * /api/roles:
 *   post:
 *     tags: [Roles]
 *     summary: Tạo role mới
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               level:
 *                 type: integer
 *               permissionIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       201:
 *         description: OK
 */
router.post(
  '/',
  requirePermission('user:assign-role'),
  rolesController.createRole
);

/**
 * @swagger
 * /api/roles/{id}:
 *   put:
 *     tags: [Roles]
 *     summary: Cập nhật role
 */
router.put(
  '/:id',
  requirePermission('user:assign-role'),
  rolesController.updateRole
);

/**
 * @swagger
 * /api/roles/{id}/permissions:
 *   put:
 *     tags: [Roles]
 *     summary: Gán permissions cho role
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permissionIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: OK
 */
router.put(
  '/:id/permissions',
  requirePermission('user:assign-permission'),
  rolesController.assignPermissions
);

/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     tags: [Roles]
 *     summary: Xóa role
 */
router.delete(
  '/:id',
  requirePermission('user:assign-role'),
  rolesController.deleteRole
);

export default router;```

#### FILE: backend/src/routes/stats.routes.js
```javascript
// backend/src/routes/stats.routes.js
import express from 'express';
import { statsController } from '../controllers/stats.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permission.js';

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /api/stats/vt-overview:
 *   get:
 *     tags: [Stats]
 *     summary: Dashboard Viện trưởng — tổng quan
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 summary:
 *                   total: 245
 *                   hoanThanh: 180
 *                   quaHan: 12
 *                   sapDenHan: 25
 *                   chuaToiHan: 208
 *                   tyLeHoanThanh: 73
 *                 pvtStats:
 *                   - id: u_pvt_1
 *                     name: Phó Viện trưởng 1
 *                     total: 30
 *                     completed: 27
 *                     completionRate: 90
 */
router.get(
  '/vt-overview',
  requirePermission('stats:view:all'),
  statsController.getVTOverview
);

/**
 * @swagger
 * /api/stats/chart:
 *   get:
 *     tags: [Stats]
 *     summary: Dữ liệu biểu đồ tròn
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 chartData:
 *                   - name: Quá hạn
 *                     value: 12
 *                     color: '#ef4444'
 *                   - name: Sắp đến hạn
 *                     value: 25
 *                     color: '#f59e0b'
 *                   - name: Chưa tới hạn
 *                     value: 208
 *                     color: '#10b981'
 */
router.get('/chart', statsController.getChartData);

/**
 * @swagger
 * /api/stats/pvt-dashboard:
 *   get:
 *     tags: [Stats]
 *     summary: Dashboard PVT
 *     responses:
 *       200:
 *         description: OK
 */
router.get(
  '/pvt-dashboard',
  requirePermission('stats:view:department'),
  statsController.getPvtDashboard
);

/**
 * @swagger
 * /api/stats/tp-dashboard:
 *   get:
 *     tags: [Stats]
 *     summary: Dashboard TP
 *     responses:
 *       200:
 *         description: OK
 */
router.get(
  '/tp-dashboard',
  requirePermission('stats:view:department'),
  statsController.getTpDashboard
);

export default router;```

#### FILE: backend/src/routes/users.routes.js
```javascript
// backend/src/routes/users.routes.js
import express from 'express';
import { usersController } from '../controllers/users.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permission.js';
import {
  validateCreateUser,
  validateUpdateUser,
  validateResetPassword,
} from '../middlewares/validate.js';

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Lấy danh sách users
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Số item/trang
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm theo username, fullName, email, phone
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [ADMIN, VIEN_TRUONG, PHO_VIEN_TRUONG, TRUONG_PHONG]
 *         description: Lọc theo role
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *         description: Lọc theo phòng ban
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Lọc theo trạng thái
 *     responses:
 *       200:
 *         description: Danh sách users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get(
  '/',
  requirePermission('user:view:all', 'user:view:department', 'user:view:own'),
  usersController.getUsers
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Lấy chi tiết user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID user
 *     responses:
 *       200:
 *         description: Chi tiết user
 *       404:
 *         description: Không tìm thấy user
 */
router.get(
  '/:id',
  requirePermission('user:view:all', 'user:view:department', 'user:view:own'),
  usersController.getUserById
);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Tạo tài khoản mới
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - fullName
 *               - roleIds
 *             properties:
 *               username:
 *                 type: string
 *                 example: test_user
 *               password:
 *                 type: string
 *                 description: Nếu không nhập, mặc định là "vks@2026"
 *                 example: vks@2026
 *               fullName:
 *                 type: string
 *                 example: Nguyễn Văn Test
 *               email:
 *                 type: string
 *                 example: test@vks.gov.vn
 *               phone:
 *                 type: string
 *                 example: '0901234567'
 *               position:
 *                 type: string
 *                 example: Chuyên viên
 *               departmentId:
 *                 type: string
 *                 description: Bắt buộc nếu có role TRUONG_PHONG
 *               managerId:
 *                 type: string
 *               roleIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [3]
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.post(
  '/',
  requirePermission('user:create'),
  validateCreateUser,
  usersController.createUser
);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Cập nhật user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               position:
 *                 type: string
 *               departmentId:
 *                 type: string
 *               managerId:
 *                 type: string
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy user
 */
router.put(
  '/:id',
  requirePermission('user:update:all', 'user:update:own'),
  validateUpdateUser,
  usersController.updateUser
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Xóa mềm user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       400:
 *         description: Không thể xóa chính mình hoặc admin
 */
router.delete(
  '/:id',
  requirePermission('user:delete'),
  usersController.deleteUser
);

/**
 * @swagger
 * /api/users/{id}/roles:
 *   put:
 *     summary: Gán roles cho user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleIds
 *             properties:
 *               roleIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [3, 4]
 *     responses:
 *       200:
 *         description: Gán roles thành công
 */
router.put(
  '/:id/roles',
  requirePermission('user:assign-role'),
  usersController.assignRoles
);

/**
 * @swagger
 * /api/users/{id}/reset-password:
 *   post:
 *     summary: Reset mật khẩu user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newPassword:
 *                 type: string
 *                 description: Nếu không nhập, mặc định là "vks@2026"
 *                 example: newpass123
 *     responses:
 *       200:
 *         description: Reset thành công
 */
router.post(
  '/:id/reset-password',
  requirePermission('user:reset-password'),
  validateResetPassword,
  usersController.resetPassword
);

/**
 * @swagger
 * /api/users/{id}/toggle-active:
 *   patch:
 *     summary: Khóa/mở khóa user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.patch(
  '/:id/toggle-active',
  requirePermission('user:update:all'),
  usersController.toggleActive
);

export default router;```

### 4.5. Middlewares

#### FILE: backend/src/middlewares/auth.js
```javascript
// backend/src/middlewares/auth.js
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Chưa đăng nhập',
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user + roles + permissions từ DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
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
        message: 'Tài khoản không tồn tại hoặc đã bị khóa',
      });
    }

    // Lấy roles
    const roles = user.userRoles.map(ur => ur.role.code);

    // Lấy permissions (unique)
    const permissionsSet = new Set();
    user.userRoles.forEach(ur => {
      ur.role.rolePermissions.forEach(rp => {
        permissionsSet.add(rp.permission.code);
      });
    });

    // Gán req.user với ĐẦY ĐỦ permissions
    req.user = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      departmentId: user.departmentId,
      roles,
      permissions: Array.from(permissionsSet),
    };

    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn',
      });
    }
    console.error('Authenticate error:', err);
    return res.status(500).json({
      success: false,
      message: 'Lỗi xác thực',
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
}```

#### FILE: backend/src/middlewares/error.js
```javascript
export function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err);

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

export function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}
```

#### FILE: backend/src/middlewares/permission.js
```javascript
// backend/src/middlewares/permission.js

/**
 * requirePermission('perm:a', 'perm:b', 'perm:c')
 *
 * Logic OR: Cho phép nếu user có ÍT NHẤT 1 trong các quyền.
 *
 * VD: requirePermission('dispatch:view:all', 'dispatch:view:own')
 *   - User có 'dispatch:view:all' → PASS ✅
 *   - User có 'dispatch:view:own' → PASS ✅
 *   - User có cả 2 → PASS ✅
 *   - User không có cả 2 → 403 ❌
 */
export function requirePermission(...requiredPerms) {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Chưa đăng nhập',
      });
    }

    const userPerms = user.permissions || [];
    const userRoles = user.roles || [];

    // ADMIN bypass tất cả
    if (userRoles.includes('ADMIN')) {
      return next();
    }

    // Nếu route không yêu cầu quyền cụ thể → cho qua
    if (requiredPerms.length === 0) {
      return next();
    }

    // Check OR: có ÍT NHẤT 1 permission
    const hasAny = requiredPerms.some(perm => userPerms.includes(perm));

    if (!hasAny) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập',
        require: requiredPerms,
        userPerms,
      });
    }

    next();
  };
}```

#### FILE: backend/src/middlewares/validate.js
```javascript
// backend/src/middlewares/validate.js
import prisma from '../config/prisma.js';

// ============================================
// VALIDATE TẠO USER
// ============================================
export function validateCreateUser(req, res, next) {
  const { username, fullName, roleIds, role, departmentId, roomCode } = req.body;
  const errors = [];

  // 1. Username
  if (!username || username.trim().length < 3) {
    errors.push('Username phải có ít nhất 3 ký tự');
  }

  // 2. Full name
  if (!fullName || fullName.trim().length < 2) {
    errors.push('Họ tên phải có ít nhất 2 ký tự');
  }

  // 3. Role — chấp nhận roleIds (array) HOẶC role (string)
  const hasRoleIds = roleIds && Array.isArray(roleIds) && roleIds.length > 0;
  const hasRoleCode = role && typeof role === 'string' && role.trim().length > 0;

  if (!hasRoleIds && !hasRoleCode) {
    errors.push('Phải chọn ít nhất 1 vai trò');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors,
    });
  }

  next();
}
// ============================================
// VALIDATE UPDATE USER
// ============================================
export function validateUpdateUser(req, res, next) {
  const { fullName, email, phone } = req.body;

  if (fullName !== undefined && fullName.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Họ tên phải có ít nhất 2 ký tự',
    });
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Email không hợp lệ',
    });
  }

  if (phone && !/^[0-9]{10,11}$/.test(phone)) {
    return res.status(400).json({
      success: false,
      message: 'Số điện thoại không hợp lệ',
    });
  }

  next();
}

// ============================================
// VALIDATE RESET PASSWORD
// ============================================
export function validateResetPassword(req, res, next) {
  const { newPassword } = req.body;

  if (newPassword !== undefined && newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Mật khẩu phải có ít nhất 6 ký tự',
    });
  }

  next();
}```

## 5. FRONTEND SOURCE CODE

### FILE: frontend/src/main.tsx
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);```

### FILE: frontend/src/App.tsx
```typescript
// src/App.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DialogProvider } from './hooks/useDialog';
import { ProtectedRoute } from './components/ProtectedRoute';

import { PublicHome } from './pages/PublicHome';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { VienTruongDashboard } from './pages/VienTruongDashboard';
import { PhoVienTruongDashboard } from './pages/PhoVienTruongDashboard';
import { TruongPhongDashboard } from './pages/TruongPhongDashboard';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <DialogProvider>
        <Routes>
          <Route path="/" element={<PublicHome />} />
          <Route path="/login" element={<Login />} />

          <Route path="/admin/*" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/vt/*" element={
            <ProtectedRoute allowedRoles={['VIEN_TRUONG', 'ADMIN']}>
              <VienTruongDashboard />
            </ProtectedRoute>
          } />

          <Route path="/pvt/*" element={
            <ProtectedRoute allowedRoles={['PHO_VIEN_TRUONG', 'ADMIN']}>
              <PhoVienTruongDashboard />
            </ProtectedRoute>
          } />
          <Route path="/pvt/:id" element={
            <ProtectedRoute allowedRoles={['PHO_VIEN_TRUONG', 'ADMIN']}>
              <PhoVienTruongDashboard />
            </ProtectedRoute>
          } />

          <Route path="/tp/*" element={
            <ProtectedRoute allowedRoles={['TRUONG_PHONG', 'ADMIN']}>
              <TruongPhongDashboard />
            </ProtectedRoute>
          } />
          <Route path="/tp/:id" element={
            <ProtectedRoute allowedRoles={['TRUONG_PHONG', 'ADMIN']}>
              <TruongPhongDashboard />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </DialogProvider>
    </AuthProvider>
  );
};

export default App;```

### FILE: frontend/src/context/AuthContext.tsx
```typescript
// frontend/src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/auth';
import { apiClient } from '../services/apiClient';

interface AuthContextType {
  currentUser: User | null;
  allUsers: User[];
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  reloadUsers: () => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
  isAdmin: boolean;
  isVienTruong: boolean;
  isPhoVienTruong: boolean;
  isTruongPhong: boolean;
  hasPermission: (perm: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// NORMALIZE USER — Đảm bảo luôn có `role` (string) + `permissions`
// Backend trả: { user: {...}, roles: ['VIEN_TRUONG'], permissions: [...] }
// → Cần merge lại
// ============================================
const normalizeUser = (
  rawUser: any,
  rawRoles?: string[],
  rawPermissions?: string[]
): User => {
  // 1. Lấy role code từ nhiều nguồn
  let roleCode: UserRole | undefined;

  // Ưu tiên 1: rawRoles array (backend login trả)
  if (rawRoles && rawRoles.length > 0) {
    roleCode = rawRoles[0] as UserRole;
  }
  // Ưu tiên 2: user.roles array (backend /me trả)
  else if (rawUser?.roles && Array.isArray(rawUser.roles) && rawUser.roles.length > 0) {
    roleCode = rawUser.roles[0].code as UserRole;
  }
  // Ưu tiên 3: user.role (legacy)
  else if (rawUser?.role) {
    roleCode = rawUser.role as UserRole;
  }
  // Fallback
  else {
    roleCode = 'PHO_VIEN_TRUONG';
  }

  // 2. Lấy permissions
  const permissions = rawPermissions || rawUser?.permissions || [];

  // 3. Merge
  return {
    ...rawUser,
    role: roleCode,
    roles: rawUser?.roles || (roleCode ? [{ id: 0, code: roleCode, name: roleCode, level: 0 }] : []),
    permissions,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ============================================
  // INIT — Load user khi app khởi động
  // ============================================
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const token = apiClient.getToken();
        if (token) {
          // 1. Thử load user từ localStorage trước (nhanh)
          const cached = apiClient.getCurrentUser();
          if (cached) {
            const normalized = normalizeUser(cached, cached.roles?.map(r => r.code), cached.permissions);
            setCurrentUser(normalized);
          }

          // 2. Fetch user mới nhất từ server
          const user = await apiClient.fetchCurrentUser();
          if (user) {
            const normalized = normalizeUser(
              user,
              user.roles?.map(r => r.code),
              user.permissions
            );
            setCurrentUser(normalized);
            // Update localStorage với user đã normalize
            apiClient.setCurrentUser(normalized);
            await reloadUsers();
          }
        }
      } catch (e) {
        console.error('Auth init error:', e);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // ============================================
  // RELOAD USERS
  // ============================================
  const reloadUsers = async () => {
    try {
      const users = await apiClient.getAllUsers({ limit: 100 });
      setAllUsers(users);
    } catch (e) {
      console.error('Lỗi khi load users:', e);
    }
  };

  // ============================================
  // LOGIN
  // ============================================
  const login = async (username: string, password: string) => {
    const result = await apiClient.login(username, password);

    if (result.success && result.user) {
      // Merge roles + permissions vào user
      const normalized = normalizeUser(
        result.user,
        result.roles,          // ← Backend trả riêng
        result.permissions     // ← Backend trả riêng
      );
      setCurrentUser(normalized);
      apiClient.setCurrentUser(normalized);
      await reloadUsers();
      return { success: true };
    }

    return { success: false, message: result.message || 'Đăng nhập thất bại' };
  };

  // ============================================
  // LOGOUT
  // ============================================
  const logout = async () => {
    await apiClient.logout();
    setCurrentUser(null);
    setAllUsers([]);
  };

  // ============================================
  // REFRESH
  // ============================================
  const refreshCurrentUser = async () => {
    const user = await apiClient.fetchCurrentUser();
    if (user) {
      const normalized = normalizeUser(
        user,
        user.roles?.map(r => r.code),
        user.permissions
      );
      setCurrentUser(normalized);
      apiClient.setCurrentUser(normalized);
    }
  };

  // ============================================
  // ROLE CHECKS
  // ============================================
  const getRoleCode = (): string | null => {
    if (!currentUser) return null;
    // Ưu tiên currentUser.role (đã normalize)
    if (currentUser.role) return currentUser.role;
    // Fallback: currentUser.roles[0].code
    if (currentUser.roles && currentUser.roles.length > 0) {
      return currentUser.roles[0].code;
    }
    return null;
  };

  const isAdmin = getRoleCode() === 'ADMIN';
  const isVienTruong = getRoleCode() === 'VIEN_TRUONG';
  const isPhoVienTruong = getRoleCode() === 'PHO_VIEN_TRUONG';
  const isTruongPhong = getRoleCode() === 'TRUONG_PHONG';

  const hasPermission = (perm: string): boolean => {
    return currentUser?.permissions?.includes(perm) || false;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        isLoading,
        login,
        logout,
        reloadUsers,
        refreshCurrentUser,
        isAdmin,
        isVienTruong,
        isPhoVienTruong,
        isTruongPhong,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};```

### FILE: frontend/src/services/apiClient.ts
```typescript
// frontend/src/services/apiClient.ts
import { Dispatch } from '../types/dispatch';
import { User, LoginResponse, VTDashboardStatsResponse } from '../types/auth';

const API_BASE = '/api';

// Token keys
const TOKEN_KEY = 'access_token';
const USER_KEY = 'current_user';

// ============================================
// HELPER — Fetch với token
// ============================================
async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  // Handle 401 — token hết hạn
  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  // Check content-type
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await res.text();
    console.error(`Backend trả về không phải JSON (${res.status}):`, text.substring(0, 200));
    throw new Error(`Server trả về lỗi ${res.status}`);
  }

  return await res.json();
}

// ============================================
// API CLIENT
// ============================================
export const apiClient = {
  // ============================================
  // 1. AUTH
  // ============================================
  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return { success: false, message: `Lỗi server (${res.status})` };
      }

      const data = await res.json();

      if (data.success && data.user && data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      }

      return data;
    } catch (e: any) {
      console.error('Lỗi login:', e);
      return { success: false, message: e.message };
    }
  },

  getCurrentUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  async fetchCurrentUser(): Promise<User | null> {
    try {
      const data = await request<{ success: boolean; user: User }>('/auth/me');
      if (data.success && data.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        return data.user;
      }
      return null;
    } catch (e) {
      console.error('Lỗi khi fetch current user:', e);
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch (e) {
      // Bỏ qua
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  },

  async changePassword(
    oldPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      return await request('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ oldPassword, newPassword }),
      });
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  // ============================================
  // 2. USERS
  // ============================================
  async getAllUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }): Promise<User[]> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      if (params?.search) query.set('search', params.search);
      if (params?.role) query.set('role', params.role);

      const data = await request<{ success: boolean; users: User[] }>(
        `/users?${query.toString()}`
      );
      return data.success ? data.users : [];
    } catch (e) {
      console.error('Lỗi khi lấy danh sách users:', e);
      return [];
    }
  },

  async createUser(
    userData: Partial<User & { password?: string; roleIds?: number[] }>
  ): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      return await request('/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  async updateUser(
    id: string,
    updates: Partial<User & { password?: string }>
  ): Promise<User | null> {
    try {
      const data = await request<{ success: boolean; user: User }>(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return data.success ? data.user : null;
    } catch (e) {
      console.error('Lỗi khi cập nhật user:', e);
      return null;
    }
  },

  async deleteUser(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      return await request(`/users/${id}`, { method: 'DELETE' });
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  async resetPassword(
    id: string,
    newPassword?: string
  ): Promise<{ success: boolean; message?: string; newPassword?: string }> {
    try {
      return await request(`/users/${id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
      });
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  async assignRoles(
    userId: string,
    roleIds: number[]
  ): Promise<{ success: boolean; message?: string }> {
    try {
      return await request(`/users/${userId}/roles`, {
        method: 'PUT',
        body: JSON.stringify({ roleIds }),
      });
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  async toggleActive(
    userId: string
  ): Promise<{ success: boolean; message?: string; active?: boolean }> {
    try {
      return await request(`/users/${userId}/toggle-active`, {
        method: 'PATCH',
      });
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  // ============================================
  // 3. DISPATCHES
  // ============================================
  async getDispatches(params?: {
    page?: number;
    limit?: number;
    search?: string;
    trangThai?: string;
    mucDoKhan?: string;
    role?: string;
    userId?: string;
    roomCode?: string;
    assignedPvtId?: string;
    assignedTpId?: string;
    dateFrom?: string;
    dateTo?: string;
    includeDeleted?: boolean;
  }): Promise<Dispatch[]> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      if (params?.search) query.set('search', params.search);
      if (params?.trangThai) query.set('trangThai', params.trangThai);
      if (params?.mucDoKhan) query.set('mucDoKhan', params.mucDoKhan);
      if (params?.role) query.set('role', params.role);
      if (params?.userId) query.set('userId', params.userId);
      if (params?.roomCode) query.set('roomCode', params.roomCode);
      if (params?.assignedPvtId) query.set('assignedPvtId', params.assignedPvtId);
      if (params?.assignedTpId) query.set('assignedTpId', params.assignedTpId);
      if (params?.dateFrom) query.set('dateFrom', params.dateFrom);
      if (params?.dateTo) query.set('dateTo', params.dateTo);

      const data = await request<{ success: boolean; dispatches: Dispatch[] }>(
        `/dispatches?${query.toString()}`
      );
      return data.success ? data.dispatches : [];
    } catch (e) {
      console.error('Lỗi khi tải danh sách công văn:', e);
      return [];
    }
  },

  async getDispatchById(id: string): Promise<Dispatch | null> {
    try {
      const data = await request<{ success: boolean; dispatch: Dispatch }>(
        `/dispatches/${id}`
      );
      return data.success ? data.dispatch : null;
    } catch (e) {
      console.error('Lỗi khi lấy chi tiết công văn:', e);
      return null;
    }
  },

  async createDispatch(dispatchData: Partial<Dispatch>): Promise<Dispatch | null> {
    try {
      const data = await request<{ success: boolean; dispatch: Dispatch }>(
        '/dispatches',
        {
          method: 'POST',
          body: JSON.stringify(dispatchData),
        }
      );
      return data.success ? data.dispatch : null;
    } catch (e) {
      console.error('Lỗi khi tạo công văn:', e);
      return null;
    }
  },

  async updateDispatch(
    id: string,
    updates: Partial<Dispatch>
  ): Promise<Dispatch | null> {
    try {
      const data = await request<{ success: boolean; dispatch: Dispatch }>(
        `/dispatches/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(updates),
        }
      );
      return data.success ? data.dispatch : null;
    } catch (e) {
      console.error('Lỗi khi cập nhật công văn:', e);
      return null;
    }
  },
  async markComplete(
    id: string,
    note?: string
  ): Promise<{ success: boolean; message?: string; dispatch?: Dispatch }> {
    try {
      return await request(`/dispatches/${id}/complete`, {
        method: 'PATCH',
        body: JSON.stringify({ note }),
      });
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },
  // ============================================
  // 9. ATTACHMENTS — File đính kèm
  // ============================================
  async uploadAttachment(
    dispatchId: string,
    file: File,
    fileCategory: string = 'ORIGINAL',
    description?: string
  ): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileCategory', fileCategory);
      if (description) formData.append('description', description);

      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(
        `${API_BASE}/dispatches/${dispatchId}/attachments`,
        {
          method: 'POST',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        }
      );

      const data = await res.json();
      return data;
    } catch (e: any) {
      console.error('Lỗi upload attachment:', e);
      return { success: false, message: e.message };
    }
  },

  async getAttachments(dispatchId: string): Promise<any[]> {
    try {
      const data = await request<{ success: boolean; attachments: any[] }>(
        `/dispatches/${dispatchId}/attachments`
      );
      return data.success ? data.attachments : [];
    } catch (e) {
      console.error('Lỗi lấy attachments:', e);
      return [];
    }
  },

  async downloadAttachment(attachmentId: string): Promise<void> {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(
        `${API_BASE}/attachments/${attachmentId}/download`,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      if (!res.ok) throw new Error('Download failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Lấy tên file từ header Content-Disposition hoặc dùng mặc định
      const contentDisposition = res.headers.get('content-disposition');
      let fileName = 'attachment';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) fileName = decodeURIComponent(match[1]);
      }
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Lỗi download:', e);
      throw e;
    }
  },

  async deleteAttachment(attachmentId: string): Promise<boolean> {
    try {
      const data = await request<{ success: boolean }>(
        `/attachments/${attachmentId}`,
        { method: 'DELETE' }
      );
      return !!data.success;
    } catch (e) {
      console.error('Lỗi xóa attachment:', e);
      return false;
    }
  },

  async deleteDispatch(id: string): Promise<boolean> {
    try {
      const data = await request<{ success: boolean }>(`/dispatches/${id}`, {
        method: 'DELETE',
      });
      return !!data.success;
    } catch (e) {
      console.error('Lỗi khi xóa công văn:', e);
      return false;
    }
  },

  // ============================================
  // 4. ASSIGNMENTS
  // ============================================
  async assignToPvts(
    dispatchId: string,
    payload: {
      pvts: { pvtId: string; pvtName: string; roomCode?: string; isPrimary?: boolean }[];
      vtChiDao?: string;
      hanBaoCaoXuLy?: string;
      mucDoKhan?: string;
    }
  ): Promise<Dispatch | null> {
    try {
      const data = await request<{ success: boolean; dispatch: Dispatch }>(
        `/dispatches/${dispatchId}/assign-pvts`,
        { method: 'POST', body: JSON.stringify(payload) }
      );
      return data.success ? data.dispatch : null;
    } catch (e) {
      console.error('Lỗi khi phân công PVT:', e);
      return null;
    }
  },

  async assignToTps(
    dispatchId: string,
    payload: {
      tps: { tpId: string; tpName: string; roomCode?: string; isPrimary?: boolean }[];
      pvtChiDao?: string;
      hanBaoCaoXuLy?: string;
    }
  ): Promise<Dispatch | null> {
    try {
      const data = await request<{ success: boolean; dispatch: Dispatch }>(
        `/dispatches/${dispatchId}/assign-tps`,
        { method: 'POST', body: JSON.stringify(payload) }
      );
      return data.success ? data.dispatch : null;
    } catch (e) {
      console.error('Lỗi khi phân công TP:', e);
      return null;
    }
  },

  async tpNumber(
    dispatchId: string,
    payload: { soCongVanTP: string; ngayDanhSo?: string }
  ): Promise<Dispatch | null> {
    try {
      const data = await request<{ success: boolean; dispatch: Dispatch }>(
        `/dispatches/${dispatchId}/tp-number`,
        { method: 'POST', body: JSON.stringify(payload) }
      );
      return data.success ? data.dispatch : null;
    } catch (e) {
      console.error('Lỗi khi đánh số:', e);
      return null;
    }
  },

  async tpSubmit(
    dispatchId: string,
    payload: { baoCaoTienDo: string; tienDo?: number }
  ): Promise<Dispatch | null> {
    try {
      const data = await request<{ success: boolean; dispatch: Dispatch }>(
        `/dispatches/${dispatchId}/tp-submit`,
        { method: 'POST', body: JSON.stringify(payload) }
      );
      return data.success ? data.dispatch : null;
    } catch (e) {
      console.error('Lỗi khi TP gửi PVT:', e);
      return null;
    }
  },

  async pvtSubmit(
    dispatchId: string,
    payload: { pvtChiDao: string }
  ): Promise<Dispatch | null> {
    try {
      const data = await request<{ success: boolean; dispatch: Dispatch }>(
        `/dispatches/${dispatchId}/pvt-submit`,
        { method: 'POST', body: JSON.stringify(payload) }
      );
      return data.success ? data.dispatch : null;
    } catch (e) {
      console.error('Lỗi khi PVT trình VT:', e);
      return null;
    }
  },

  async vtAgree(dispatchId: string): Promise<Dispatch | null> {
    try {
      const data = await request<{ success: boolean; dispatch: Dispatch }>(
        `/dispatches/${dispatchId}/vt-agree`,
        { method: 'POST' }
      );
      return data.success ? data.dispatch : null;
    } catch (e) {
      console.error('Lỗi khi VT đồng ý:', e);
      return null;
    }
  },

  async vtDisagree(dispatchId: string, reason: string): Promise<Dispatch | null> {
    try {
      const data = await request<{ success: boolean; dispatch: Dispatch }>(
        `/dispatches/${dispatchId}/vt-disagree`,
        { method: 'POST', body: JSON.stringify({ reason }) }
      );
      return data.success ? data.dispatch : null;
    } catch (e) {
      console.error('Lỗi khi VT không đồng ý:', e);
      return null;
    }
  },

  async pvtDisagree(
    dispatchId: string,
    reason: string,
    tpId?: string
  ): Promise<Dispatch | null> {
    try {
      const data = await request<{ success: boolean; dispatch: Dispatch }>(
        `/dispatches/${dispatchId}/pvt-disagree`,
        { method: 'POST', body: JSON.stringify({ reason, tpId }) }
      );
      return data.success ? data.dispatch : null;
    } catch (e) {
      console.error('Lỗi khi PVT không đồng ý:', e);
      return null;
    }
  },

  async getHistory(dispatchId: string): Promise<any[]> {
    try {
      const data = await request<{ success: boolean; history: any[] }>(
        `/dispatches/${dispatchId}/history`
      );
      return data.success ? data.history : [];
    } catch (e) {
      console.error('Lỗi khi lấy lịch sử:', e);
      return [];
    }
  },

  // ============================================
  // 5. STATS
  // ============================================
  async getVTDashboardStats(): Promise<VTDashboardStatsResponse | null> {
    try {
      const data = await request<VTDashboardStatsResponse>('/stats/vt-overview');
      return data.success ? data : null;
    } catch (e) {
      console.error('Lỗi khi lấy thống kê VT:', e);
      return null;
    }
  },

  async getChartData(): Promise<any | null> {
    try {
      const data = await request<any>('/stats/chart');
      return data.success ? data : null;
    } catch (e) {
      console.error('Lỗi khi lấy chart data:', e);
      return null;
    }
  },

  // ============================================
  // 6. NOTIFICATIONS
  // ============================================
  async getNotifications(params?: { page?: number; isRead?: boolean }): Promise<any[]> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      if (params?.isRead !== undefined) query.set('isRead', String(params.isRead));

      const data = await request<{ success: boolean; notifications: any[] }>(
        `/notifications?${query.toString()}`
      );
      return data.success ? data.notifications : [];
    } catch (e) {
      console.error('Lỗi khi lấy thông báo:', e);
      return [];
    }
  },

  async getUnreadCount(): Promise<number> {
    try {
      const data = await request<{ success: boolean; unreadCount: number }>(
        '/notifications/unread-count'
      );
      return data.success ? data.unreadCount : 0;
    } catch (e) {
      return 0;
    }
  },
};```

### FILE: frontend/src/components/ProtectedRoute.tsx
```typescript
// frontend/src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();

  // Đang load → hiện spinner
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="w-12 h-12 border-4 border-red-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Chưa đăng nhập → về login
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = currentUser.roles?.[0]?.code || currentUser.role;
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
          <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
            <h1 className="text-2xl font-bold text-rose-700 mb-2">
              Không có quyền truy cập
            </h1>
            <p className="text-sm text-slate-600">
              Tài khoản của bạn không được phép truy cập trang này.
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};```

### 5.x. Pages

#### FILE: frontend/src/pages/AdminDashboard.tsx
```typescript
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { ActionBar } from '../components/ActionBar';
import { DashboardStats } from '../components/DashboardStats';
import { FilterBar } from '../components/FilterBar';
import { DispatchTable } from '../components/DispatchTable';
import { ExcelImportModal } from '../components/ExcelImportModal';
import { DispatchModal } from '../components/DispatchModal';
import { ColumnManagerModal } from '../components/ColumnManagerModal';
import { DispatchDetailDrawer } from '../components/DispatchDetailDrawer';
import { ConfirmModal } from '../components/ConfirmModal';
import { GoogleSheetModal } from '../components/GoogleSheetModal';
import { DatabaseBrowser } from '../components/admin/DatabaseBrowser';
import { AdminDepartments } from '../components/admin/AdminDepartments';
import { AdminDashboardHome } from '../components/admin/AdminDashboardHome';
import { AdminAuditLogs } from '../components/admin/AdminAuditLogs';
import { AdminSessions } from '../components/admin/AdminSessions';
import { useDispatches } from '../hooks/useDispatches';
import { apiClient } from '../services/apiClient';
import { exportDispatchesToExcel, exportLeadershipReportToExcel } from '../services/excelService';
import { Dispatch } from '../types/dispatch';
import { User, UserRole } from '../types/auth';
import {
  Users,
  Database,
  Wifi,
  Copy,
  Check,
  Key,
  Edit3,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Server,
  Building,
  FileSpreadsheet,
  UserPlus,
  UserMinus,
  ArrowRightLeft,
  ShieldCheck,
  Download,
  ArrowUpDown,
  Search,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Filter,
  Layers,
  SlidersHorizontal,
  X,
  UserCheck,
  Briefcase,
  ChevronDown,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
  FileText,
  Upload,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  TrendingUp,
  Clock,
  History,
  Settings,
  Table,
  Columns,
  Activity,
  Eye,
  CheckSquare,
  Square,
  CheckCheck,
  KeyRound,
  Folder,
  ChevronUp,
  XCircle,
  Circle
} from 'lucide-react';
import { PieChart as PieChartWidget, PieChartSegment } from '../components/PieChart';

type SortMode = 'category' | 'alpha' | 'frequent';

interface AdminFunctionItem {
  id: string;
  title: string;
  category: 'user' | 'dispatch';
  categoryName: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  description: string;
  action: () => void;
  tabKey?: 'dispatches' | 'users';
  priority: number;
}

interface PermissionItem {
  id: number;
  key: string;
  label: string;
  category: 'USER' | 'DISPATCH' | 'SYSTEM' | 'REPORTS & ANALYTICS';
}

const ALL_SYSTEM_PERMISSIONS: PermissionItem[] = [
  // 📁 USER (1 - 10)
  { id: 1, key: 'user:view:all', label: 'Xem tất cả user', category: 'USER' },
  { id: 2, key: 'user:view:department', label: 'Xem user phòng', category: 'USER' },
  { id: 3, key: 'user:view:own', label: 'Xem user của mình', category: 'USER' },
  { id: 4, key: 'user:create', label: 'Tạo tài khoản', category: 'USER' },
  { id: 5, key: 'user:update', label: 'Chỉnh sửa thông tin user', category: 'USER' },
  { id: 6, key: 'user:delete', label: 'Xóa tài khoản user', category: 'USER' },
  { id: 7, key: 'user:reset_password', label: 'Đổi / đặt lại mật khẩu', category: 'USER' },
  { id: 8, key: 'user:assign_pvt', label: 'Phân công PVT phụ trách', category: 'USER' },
  { id: 9, key: 'user:transfer_room', label: 'Điều chuyển phòng ban', category: 'USER' },
  { id: 10, key: 'user:export', label: 'Xuất danh sách tài khoản', category: 'USER' },

  // 📁 DISPATCH (11 - 25)
  { id: 11, key: 'dispatch:view:all', label: 'Xem tất cả CV', category: 'DISPATCH' },
  { id: 12, key: 'dispatch:view:department', label: 'Xem CV phòng', category: 'DISPATCH' },
  { id: 13, key: 'dispatch:view:assigned', label: 'Xem CV được giao', category: 'DISPATCH' },
  { id: 14, key: 'dispatch:create', label: 'Nhập công văn mới', category: 'DISPATCH' },
  { id: 15, key: 'dispatch:edit', label: 'Sửa thông tin công văn', category: 'DISPATCH' },
  { id: 16, key: 'dispatch:delete', label: 'Xóa công văn', category: 'DISPATCH' },
  { id: 17, key: 'dispatch:assign:vt', label: 'Viện trưởng giao việc', category: 'DISPATCH' },
  { id: 18, key: 'dispatch:assign:pvt', label: 'PVT chỉ đạo Trưởng phòng', category: 'DISPATCH' },
  { id: 19, key: 'dispatch:progress:update', label: 'Cập nhật tiến độ CV', category: 'DISPATCH' },
  { id: 20, key: 'dispatch:report:submit', label: 'Báo cáo kết quả xử lý', category: 'DISPATCH' },
  { id: 21, key: 'dispatch:approve', label: 'Phê duyệt kết quả báo cáo', category: 'DISPATCH' },
  { id: 22, key: 'dispatch:excel:import', label: 'Nhập Excel công văn', category: 'DISPATCH' },
  { id: 23, key: 'dispatch:excel:reconcile', label: 'Đối chiếu tệp Excel', category: 'DISPATCH' },
  { id: 24, key: 'dispatch:excel:export', label: 'Xuất báo cáo Excel', category: 'DISPATCH' },
  { id: 25, key: 'dispatch:history:view', label: 'Xem lịch sử xử lý', category: 'DISPATCH' },

  // 📁 SYSTEM (26 - 33)
  { id: 26, key: 'system:columns:manage', label: 'Tùy biến cột hiển thị', category: 'SYSTEM' },
  { id: 27, key: 'system:roles:manage', label: 'Quản lý vai trò (Roles)', category: 'SYSTEM' },
  { id: 28, key: 'system:permissions:manage', label: 'Phân quyền hệ thống', category: 'SYSTEM' },
  { id: 29, key: 'system:departments:manage', label: 'Quản lý danh mục phòng', category: 'SYSTEM' },
  { id: 30, key: 'system:status:manage', label: 'Quản trị trạng thái xử lý', category: 'SYSTEM' },
  { id: 31, key: 'system:backup:run', label: 'Sao lưu dữ liệu dự phòng', category: 'SYSTEM' },
  { id: 32, key: 'system:restore:run', label: 'Khôi phục dữ liệu', category: 'SYSTEM' },
  { id: 33, key: 'system:audit_logs:view', label: 'Xem nhật ký hệ thống', category: 'SYSTEM' },

  // 📁 REPORTS & ANALYTICS (34 - 40)
  { id: 34, key: 'report:dashboard:view', label: 'Xem biểu đồ thống kê', category: 'REPORTS & ANALYTICS' },
  { id: 35, key: 'report:export:summary', label: 'Xuất báo cáo tổng hợp', category: 'REPORTS & ANALYTICS' },
  { id: 36, key: 'report:export:kpi', label: 'Xuất đánh giá tiến độ KPI', category: 'REPORTS & ANALYTICS' },
  { id: 37, key: 'report:print:view', label: 'In biểu mẫu chỉ đạo', category: 'REPORTS & ANALYTICS' },
  { id: 38, key: 'report:advanced:query', label: 'Truy vấn dữ liệu nâng cao', category: 'REPORTS & ANALYTICS' },
  { id: 39, key: 'report:share:link', label: 'Chia sẻ báo cáo liên phòng', category: 'REPORTS & ANALYTICS' },
  { id: 40, key: 'report:analytics:export', label: 'Xuất file phân tích sâu', category: 'REPORTS & ANALYTICS' }
];

export const AdminDashboard: React.FC = () => {
  const { allUsers, reloadUsers } = useAuth();
  const {
    dispatches,
    filteredDispatches,
    columns,
    filters,
    setFilters,
    filterOptions,
    sortConfig,
    handleSort,
    dashboardStats,
    selectedIds,
    toggleSelectRow,
    toggleSelectAll,
    addDispatch,
    updateDispatch,
    deleteDispatch,
    bulkDeleteDispatches,
    clearAllDispatches,
    restoreSampleDispatches,
    bulkUpdateStatus,
    commitExcelImport,
    addCustomColumn,
    toggleColumnVisibility,
    removeColumn,
    resetToDefaultColumns
  } = useDispatches({ includeDeleted: true });
  type AdminModule =
    | 'dashboard'
    | 'create-user'
    | 'transfer-dept'
    | 'assign-pvt'
    | 'tab-users'
    | 'export-leadership-excel'
    | 'tab-dispatches'
    | 'roles'
    | 'permissions'
    | 'departments'
    | 'stats-overview'
    | 'stats-by-dept'
    | 'stats-by-time'
    | 'database-tables'
    | 'audit-logs'
    | 'sessions'
    | 'custom-columns'
    | 'system-settings';
  const [activeModule, setActiveModule] = useState<AdminModule>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFunctionsCollapsed, setIsFunctionsCollapsed] = useState(false);

  // Statistics time filter state
  const [statsTimeFilter, setStatsTimeFilter] = useState<'all' | 'today' | 'month' | 'quarter' | 'year'>('all');
  const [statsStartDate, setStatsStartDate] = useState('');
  const [statsEndDate, setStatsEndDate] = useState('');

  // Sidebar sorting & filtering
  const [sidebarSortMode, setSidebarSortMode] = useState<SortMode>('category');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);

  // Network info
  const [networkInfo, setNetworkInfo] = useState<{
    networks: any[];
    primaryUrl: string;
    hostname: string;
  } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Edit User State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editPassword, setEditPassword] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [editPvtManager, setEditPvtManager] = useState('');

  // User Management List Filters & Pagination
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userRoomFilter, setUserRoomFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const userPageSize = 20;


  // Departments từ API
  const [departments, setDepartments] = useState<Array<{ id: string; code: string; name: string }>>([]);

  useEffect(() => {
    const loadDepts = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch('/api/departments', {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const data = await res.json();
        if (data.success) {
          const activeDepts = (data.departments || []).filter((d: any) => d.active !== false);
          setDepartments(activeDepts);
        }
      } catch (e) {
        console.error('Lỗi load departments:', e);
      }
    };
    loadDepts();
  }, []);
  // 1. Create User State
  const [newUser, setNewUser] = useState({
    username: '',
    password: 'vks@2026',
    fullName: '',
    email: '',
    phone: '',
    position: 'Chuyên viên',
    role: 'PHO_VIEN_TRUONG' as UserRole,
    roomCode: '',
    pvtManagerId: ''
  });

  // Selected role for view / edit modals
  const [viewRoleModal, setViewRoleModal] = useState<null | {
    code: string;
    name: string;
    permissionsCount: number;
    description: string;
  }>(null);

  const [editRoleModal, setEditRoleModal] = useState<null | {
    code: string;
    name: string;
    permissionsCount: number;
    description: string;
  }>(null);

  // Permissions management state
  const [permissionRole, setPermissionRole] = useState<UserRole>('PHO_VIEN_TRUONG');
  const [rolePermissionsMap, setRolePermissionsMap] = useState<Record<string, string[]>>({
    ADMIN: ALL_SYSTEM_PERMISSIONS.map(p => p.key), // 40
    VIEN_TRUONG: [
      'user:view:all', 'user:view:department', 'user:view:own', 'user:assign_pvt', 'user:export',
      'dispatch:view:all', 'dispatch:view:department', 'dispatch:view:assigned', 'dispatch:create',
      'dispatch:edit', 'dispatch:assign:vt', 'dispatch:assign:pvt', 'dispatch:progress:update',
      'dispatch:report:submit', 'dispatch:approve', 'dispatch:excel:import', 'dispatch:excel:reconcile',
      'dispatch:excel:export', 'dispatch:history:view',
      'report:dashboard:view', 'report:export:summary', 'report:export:kpi', 'report:print:view'
    ], // 23
    PHO_VIEN_TRUONG: [
      'user:view:own',
      'dispatch:view:department', 'dispatch:view:assigned', 'dispatch:edit', 'dispatch:assign:pvt',
      'dispatch:progress:update', 'dispatch:report:submit', 'dispatch:approve', 'dispatch:excel:export',
      'dispatch:history:view',
      'report:dashboard:view', 'report:export:summary', 'report:export:kpi', 'report:print:view',
      'report:advanced:query'
    ], // 15
    TRUONG_PHONG: [
      'user:view:department', 'user:view:own',
      'dispatch:view:department', 'dispatch:view:assigned', 'dispatch:progress:update',
      'dispatch:report:submit', 'dispatch:excel:export', 'dispatch:history:view',
      'report:dashboard:view', 'report:export:summary', 'report:print:view', 'report:share:link'
    ] // 12
  });

  const currentRolePermissions = rolePermissionsMap[permissionRole] || [];

  const togglePermission = (key: string) => {
    setRolePermissionsMap(prev => {
      const existing = prev[permissionRole] || [];
      const updated = existing.includes(key)
        ? existing.filter(k => k !== key)
        : [...existing, key];
      return { ...prev, [permissionRole]: updated };
    });
  };

  const handleSelectAllPermissions = () => {
    setRolePermissionsMap(prev => ({
      ...prev,
      [permissionRole]: ALL_SYSTEM_PERMISSIONS.map(p => p.key)
    }));
  };

  const handleDeselectAllPermissions = () => {
    setRolePermissionsMap(prev => ({
      ...prev,
      [permissionRole]: []
    }));
  };

  const handleSavePermissions = () => {
    showToast(`Đã lưu thay đổi phân quyền cho vai trò ${permissionRole} (${currentRolePermissions.length}/40 quyền) thành công!`);
  };

  // Database Viewer state
  const [dbViewerExpanded, setDbViewerExpanded] = useState<Record<string, boolean>>({});
  const [dbViewerPreviewTable, setDbViewerPreviewTable] = useState<string | null>(null);

  const toggleDbTableExpand = (tableName: string) => {
    setDbViewerExpanded(prev => ({
      ...prev,
      [tableName]: !prev[tableName]
    }));
  };

  const handleExportDbTable = (tableName: string) => {
    let dataToExport: any = [];
    const filename = `${tableName}_export.json`;

    if (tableName === 'users') {
      dataToExport = allUsers;
    } else if (tableName === 'dispatches') {
      dataToExport = dispatches;
    } else if (tableName === 'departments') {
      dataToExport = Array.from({ length: 12 }, (_, i) => {
        const roomCode = `TP${i + 1}`;
        const tp = allUsers.find(u => u.roomCode === roomCode && u.role === 'TRUONG_PHONG');
        const pvt = tp?.pvtManagerId ? allUsers.find(u => u.id === tp.pvtManagerId) : null;
        return {
          roomCode,
          name: `Phòng ${i + 1}`,
          pvtManager: pvt ? `${pvt.roomCode} - ${pvt.fullName}` : 'Chưa phân công',
          manager: tp ? tp.fullName : 'Chưa phân công'
        };
      });
    } else if (tableName === 'roles') {
      dataToExport = [
        { code: 'ADMIN', name: 'Quản trị viên', permissionsCount: 40 },
        { code: 'VIEN_TRUONG', name: 'Viện trưởng', permissionsCount: 23 },
        { code: 'PHO_VIEN_TRUONG', name: 'Phó Viện trưởng', permissionsCount: 15 },
        { code: 'TRUONG_PHONG', name: 'Trưởng phòng', permissionsCount: 12 }
      ];
    } else if (tableName === 'permissions') {
      dataToExport = ALL_SYSTEM_PERMISSIONS;
    } else if (tableName === 'user_roles') {
      dataToExport = allUsers.map(u => ({
        userId: u.id,
        username: u.username,
        fullName: u.fullName,
        role: u.role,
        roomCode: u.roomCode
      }));
    } else if (tableName === 'audit_logs') {
      dataToExport = [];
    } else if (tableName === 'all') {
      dataToExport = {
        users: allUsers,
        dispatches,
        departments: Array.from({ length: 12 }, (_, i) => `TP${i + 1}`),
        roles: ['ADMIN', 'VIEN_TRUONG', 'PHO_VIEN_TRUONG', 'TRUONG_PHONG'],
        permissionsCount: 40,
        exportedAt: new Date().toISOString()
      };
    }

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    showToast(`Đã xuất dữ liệu bảng ${tableName} (${Array.isArray(dataToExport) ? dataToExport.length : 'full'} records) thành công!`);
  };

  // 2. Transfer Department State
  const [transferUser, setTransferUser] = useState<User | null>(null);
  const [transferRoomCode, setTransferRoomCode] = useState('');
  const [transferRole, setTransferRole] = useState<UserRole>('TRUONG_PHONG');
  const [transferPvtManagerId, setTransferPvtManagerId] = useState('');

  // 3. Assign Leadership / Supervision State
  const [assignTpUser, setAssignTpUser] = useState<User | null>(null);
  const [assignPvtId, setAssignPvtId] = useState('');

  // Modals from original App
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchToEdit, setDispatchToEdit] = useState<Dispatch | null>(null);
  const [isColumnManagerOpen, setIsColumnManagerOpen] = useState(false);
  const [detailDispatch, setDetailDispatch] = useState<Dispatch | null>(null);
  const [isGoogleSheetModalOpen, setIsGoogleSheetModalOpen] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { }
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // useEffect(() => {
  //   apiClient.getNetworkInfo().then(res => {
  //     if (res.success) {
  //       setNetworkInfo(res);
  //     }
  //   });
  // }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(true);
    showToast(`Đã sao chép đường dẫn: ${text}`);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // User list helpers
  const pvtUsers = useMemo(() => allUsers.filter(u => u.role === 'PHO_VIEN_TRUONG'), [allUsers]);
  const tpUsers = useMemo(() => allUsers.filter(u => u.role === 'TRUONG_PHONG'), [allUsers]);

  // Filtered & Paginated Users for User Management
  const filteredUsers = useMemo(() => {
    return allUsers.filter(u => {
      // 1. Search term (Username, Full Name, Room, Role)
      if (userSearchTerm.trim()) {
        const q = userSearchTerm.toLowerCase();
        const match =
          u.username.toLowerCase().includes(q) ||
          u.fullName.toLowerCase().includes(q) ||
          (u.roomCode && u.roomCode.toLowerCase().includes(q)) ||
          u.role.toLowerCase().includes(q);
        if (!match) return false;
      }
      // 2. Role filter
      if (userRoleFilter !== 'all') {
        if (userRoleFilter === 'PHO_VT' || userRoleFilter === 'PHO_VIEN_TRUONG') {
          if (u.role !== 'PHO_VIEN_TRUONG') return false;
        } else if (u.role !== userRoleFilter) {
          return false;
        }
      }
      // 3. Room filter
      if (userRoomFilter !== 'all') {
        if (userRoomFilter === 'none') {
          if (u.role === 'TRUONG_PHONG') return false;
        } else {
          if (u.roomCode !== userRoomFilter) return false;
        }
      }
      // 4. Status filter
      if (userStatusFilter !== 'all') {
        const isActive = !!u.active;
        if (userStatusFilter === 'active' && !isActive) return false;
        if (userStatusFilter === 'inactive' && isActive) return false;
      }
      return true;
    });
  }, [allUsers, userSearchTerm, userRoleFilter, userRoomFilter, userStatusFilter]);

  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / userPageSize));
  const paginatedUsers = useMemo(() => {
    const start = (userCurrentPage - 1) * userPageSize;
    return filteredUsers.slice(start, start + userPageSize);
  }, [filteredUsers, userCurrentPage, userPageSize]);

  // Toggle user active status
  const handleToggleUserActive = async (u: User) => {
    if (u.id === 'u_admin') {
      showToast('Không thể khóa tài khoản Quản trị viên tối cao!', 'warning');
      return;
    }
    const newActive = !u.active;
    const res = await apiClient.updateUser(u.id, { active: newActive });
    if (res) {
      showToast(`Đã ${newActive ? 'kích hoạt' : 'tạm dừng'} tài khoản "${u.username}"!`);
      reloadUsers();
    } else {
      showToast('Lỗi khi cập nhật trạng thái tài khoản', 'error');
    }
  };

  // Handle Edit User
  const handleOpenEditUser = (u: User) => {
    setEditingUser(u);
    setEditFullName(u.fullName);
    setEditPassword('');
    setEditPvtManager(u.managerId || '');
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const payload: any = { fullName: editFullName };
    if (editPassword.trim()) payload.password = editPassword.trim();
    if (editingUser.role === 'TRUONG_PHONG') payload.pvtManagerId = editPvtManager;

    const res = await apiClient.updateUser(editingUser.id, payload);
    if (res) {
      showToast(`Đã cập nhật thông tin tài khoản ${res.username}`);
      setEditingUser(null);
      reloadUsers();
    } else {
      showToast('Lỗi khi cập nhật thông tin', 'error');
    }
  };

  // Handle Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username.trim() || !newUser.fullName.trim()) {
      showToast('Vui lòng điền đầy đủ Tên đăng nhập và Họ tên', 'warning');
      return;
    }

    if (newUser.role === 'TRUONG_PHONG' && !newUser.roomCode) {
      showToast('Phòng ban là bắt buộc đối với Trưởng phòng (TP)', 'warning');
      return;
    }

    const payload = {
      username: newUser.username.trim().toLowerCase(),
      password: newUser.password.trim() || 'vks@2026',
      fullName: newUser.fullName.trim(),
      role: newUser.role,
      roomCode: newUser.role === 'TRUONG_PHONG'
        ? newUser.roomCode.trim().toUpperCase()
        : (newUser.role === 'ADMIN' ? 'ADMIN' : newUser.role === 'VIEN_TRUONG' ? 'VT' : (newUser.roomCode || 'PVT')),
      pvtManagerId: newUser.pvtManagerId || undefined,
      phone: newUser.phone.trim(),
      email: newUser.email.trim(),
      position: newUser.position.trim()
    };

    const res = await apiClient.createUser(payload);
    if (res.success) {
      showToast(`Đã tạo tài khoản "${newUser.username}" thành công!`);
      setNewUser({
        username: '',
        password: 'vks@2026',
        fullName: '',
        email: '',
        phone: '',
        position: 'Chuyên viên',
        role: 'PHO_VIEN_TRUONG',
        roomCode: '',
        pvtManagerId: ''
      });
      reloadUsers();
      setActiveModule('tab-users');
    } else {
      showToast(res.message || 'Lỗi khi tạo tài khoản', 'error');
    }
  };

  // Handle Delete User
  const handleDeleteUser = (u: User) => {
    if (u.id === 'u_admin') {
      showToast('Không thể xóa tài khoản Quản trị viên tối cao (Admin)!', 'error');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Xác nhận xóa tài khoản',
      message: `Đồng chí có chắc chắn muốn xóa tài khoản "${u.username}" (${u.fullName} - ${u.roomCode}) khỏi hệ thống CSDL? Thao tác này không thể hoàn tác.`,
      confirmText: 'Xóa tài khoản',
      onConfirm: async () => {
        const res = await apiClient.deleteUser(u.id);
        if (res.success) {
          showToast(`Đã xóa tài khoản "${u.username}" thành công!`);
          reloadUsers();
        } else {
          showToast(res.message || 'Lỗi khi xóa tài khoản', 'error');
        }
      }
    });
  };

  // Handle Transfer Department
  const handleOpenTransferModal = (u?: User) => {
    const target = u || allUsers.find(user => user.role === 'TRUONG_PHONG') || allUsers[0];
    if (!target) return;
    setTransferUser(target);
    setTransferRoomCode(target.roomCode);
    setTransferRole(target.role);
    setTransferPvtManagerId(target.pvtManagerId || '');
    setActiveModule('transfer-dept');
  };

  const handleSaveTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferUser) return;

    // Tìm departmentId từ roomCode
    const targetDept = departments.find(d => d.code === transferRoomCode.trim().toUpperCase());

    const res = await apiClient.updateUser(transferUser.id, {
      departmentId: targetDept?.id || null,
      pvtManagerId: transferRole === 'TRUONG_PHONG' ? (transferPvtManagerId || null) : null,
    } as any);

    if (res) {
      showToast(`Đã điều chuyển đồng chí ${transferUser.fullName} sang bộ phận "${transferRoomCode}"`);
      setTransferUser(null);
      reloadUsers();
      setActiveModule('tab-users');
    } else {
      showToast('Lỗi khi điều chuyển bộ phận', 'error');
    }
  };

  // Handle Assign Supervision to PVT
  const handleOpenAssignPvtModal = (tp?: User) => {
    const target = tp || tpUsers[0];
    if (!target) {
      showToast('Không có tài khoản Trưởng phòng nào trong hệ thống', 'warning');
      return;
    }
    setAssignTpUser(target);
    setAssignPvtId(target.pvtManagerId || (pvtUsers[0]?.id || ''));
    setActiveModule('assign-pvt');
  };

  const handleSaveAssignPvt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTpUser) return;

    // Map roleId cho TP (theo DB: TRUONG_PHONG = 4)
    const ROLE_CODE_TO_ID: Record<string, number> = {
      ADMIN: 1,
      VIEN_TRUONG: 2,
      PHO_VIEN_TRUONG: 3,
      TRUONG_PHONG: 4,
    };

    // Gán PVT phụ trách cho TP — dùng pvtManagerId (User field)
    const res = await apiClient.updateUser(assignTpUser.id, {
      pvtManagerId: assignPvtId || null,
    } as any);

    if (res) {
      const pvt = allUsers.find(u => u.id === assignPvtId);
      showToast(`Đã phân công ${pvt ? pvt.fullName : 'Chưa gán'} phụ trách ${assignTpUser.fullName}`);
      setAssignTpUser(null);
      reloadUsers();
      setActiveModule('tab-users');
    } else {
      showToast('Lỗi khi gán quyền phụ trách', 'error');
    }
  };
  // Handle Export Leadership Excel
  const handleExportLeadershipExcel = () => {
    const targetDispatches = selectedIds.length > 0
      ? dispatches.filter(d => selectedIds.includes(d.id))
      : filteredDispatches;

    if (targetDispatches.length === 0) {
      showToast('Không có công văn nào để xuất báo cáo lãnh đạo', 'warning');
      return;
    }

    exportLeadershipReportToExcel(targetDispatches);
    showToast(`Đã xuất báo cáo Excel ${targetDispatches.length} công văn gửi Lãnh đạo Viện Kiểm Sát!`);
  };

  // Define Admin Functions for Left Sidebar
  const allFunctions: AdminFunctionItem[] = [
    {
      id: 'create-user',
      title: 'Tạo tài khoản mới',
      category: 'user',
      categoryName: 'Quản Trị Người Dùng',
      icon: UserPlus,
      iconBg: 'bg-blue-50 text-blue-700 border-blue-200',
      iconColor: 'text-blue-700',
      description: 'Thêm tài khoản lãnh đạo, kiểm sát viên, phòng ban',
      action: () => {
        setActiveModule('create-user');
      },
      priority: 1
    },
    {
      id: 'transfer-dept',
      title: 'Chuyển bộ phận tài khoản',
      category: 'user',
      categoryName: 'Quản Trị Người Dùng',
      icon: ArrowRightLeft,
      iconBg: 'bg-amber-50 text-amber-700 border-amber-200',
      iconColor: 'text-amber-700',
      description: 'Điều chuyển phòng ban, mã đơn vị phụ trách',
      action: () => {
        handleOpenTransferModal();
        setActiveModule('transfer-dept');
      },
      priority: 2
    },
    {
      id: 'assign-pvt',
      title: 'Gán quyền phụ trách tài khoản',
      category: 'user',
      categoryName: 'Quản Trị Người Dùng',
      icon: ShieldCheck,
      iconBg: 'bg-purple-50 text-purple-700 border-purple-200',
      iconColor: 'text-purple-700',
      description: 'Phân bổ thẩm quyền PVT phụ trách Trưởng phòng',
      action: () => {
        handleOpenAssignPvtModal();
        setActiveModule('assign-pvt');
      },
      priority: 3
    },
    {
      id: 'tab-users',
      title: 'Danh sách tài khoản',
      category: 'user',
      categoryName: 'Quản Trị Người Dùng',
      icon: Users,
      iconBg: 'bg-slate-100 text-slate-700 border-slate-200',
      iconColor: 'text-slate-700',
      description: 'Danh sách 1 VT, 12 PVT, 12 Trưởng phòng, Admin',
      action: () => setActiveModule('tab-users'),
      priority: 4
    },
    {
      id: 'export-leadership-excel',
      title: 'Xuất công văn gửi Lãnh đạo (Excel)',
      category: 'dispatch',
      categoryName: 'Quản Lý Công Văn',
      icon: Download,
      iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      iconColor: 'text-emerald-700',
      description: 'File Excel đầy đủ chỉ đạo VT, PVT, tiến độ, hạn xử lý',
      action: () => setActiveModule('export-leadership-excel'),
      priority: 5
    },
    {
      id: 'tab-dispatches',
      title: 'Quản lý công văn toàn diện',
      category: 'dispatch',
      categoryName: 'Quản Lý Công Văn',
      icon: FileSpreadsheet,
      iconBg: 'bg-slate-100 text-slate-700 border-slate-200',
      iconColor: 'text-slate-700',
      description: 'Bảng theo dõi, tìm kiếm, nhập liệu và xử lý văn bản',
      action: () => setActiveModule('tab-dispatches'),
      priority: 6
    }
  ];

  // Filter and sort functions for the left sidebar
  const processedFunctions = useMemo(() => {
    let result = [...allFunctions];

    // Filter by search query
    if (sidebarSearch.trim()) {
      const q = sidebarSearch.toLowerCase();
      result = result.filter(f =>
        f.title.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.categoryName.toLowerCase().includes(q)
      );
    }

    // Apply sort mode
    if (sidebarSortMode === 'alpha') {
      result.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
    } else if (sidebarSortMode === 'frequent') {
      result.sort((a, b) => a.priority - b.priority);
    } else {
      // 'category': group user -> dispatch -> system
      const catOrder: Record<string, number> = { user: 1, dispatch: 2, system: 3 };
      result.sort((a, b) => {
        if (catOrder[a.category] !== catOrder[b.category]) {
          return catOrder[a.category] - catOrder[b.category];
        }
        return a.priority - b.priority;
      });
    }

    return result;
  }, [allFunctions, sidebarSearch, sidebarSortMode]);

  return (
    <div className="min-h-screen flex flex-col text-slate-900 bg-slate-100">
      <Header />

      <main className="flex-1 max-w-[1680px] w-full mx-auto px-3 sm:px-5 lg:px-6 py-4 space-y-4">
        {/* 2-COLUMN LAYOUT: LEFT SIDEBAR + RIGHT WORKSPACE */}
        <div className="flex flex-col lg:flex-row gap-4 items-start">
          {/* ========================================================================= */}
          {/* LEFT SIDEBAR: ADMIN FUNCTION PANEL */}
          {/* ========================================================================= */}
          {isSidebarOpen && (
            <aside
              id="admin-left-sidebar"
              className={`w-full lg:w-80 shrink-0 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-200 ${isSidebarMobileOpen ? 'block' : 'hidden lg:block'
                }`}
            >
              {/* Sidebar Top: Header with Close Sidebar Button */}
              <div className="p-3.5 bg-slate-900 text-white border-b border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModule('dashboard');
                      setIsSidebarMobileOpen(false);
                    }}
                    className={`flex items-center gap-2 px-2.5 py-1 rounded-xl transition cursor-pointer ${activeModule === 'dashboard'
                      ? 'bg-red-700 text-white shadow-xs font-black'
                      : 'text-slate-200 hover:text-white hover:bg-slate-800 font-bold'
                      }`}
                  >
                    <LayoutDashboard className="w-4 h-4 text-red-400" />
                    <h2 className="text-xs uppercase tracking-wider">
                      Dashboard
                    </h2>
                  </button>

                  {/* Close Sidebar Button */}
                  <button
                    id="admin-sort-functions-button"
                    onClick={() => {
                      setIsSidebarOpen(false);
                      setIsSidebarMobileOpen(false);
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition cursor-pointer shadow-xs"
                    title="Đóng thanh bên"
                  >
                    <span>Đóng thanh bên</span>
                  </button>
                </div>

                {/* Quick Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm nhanh chức năng..."
                    value={sidebarSearch}
                    onChange={e => setSidebarSearch(e.target.value)}
                    className="w-full bg-slate-800 text-white pl-8 pr-7 py-1.5 text-xs rounded-xl border border-slate-700 focus:outline-none focus:border-red-500 placeholder-slate-400"
                  />
                  {sidebarSearch && (
                    <button
                      onClick={() => setSidebarSearch('')}
                      className="absolute right-2 top-2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* List of Functions */}
              {!isFunctionsCollapsed ? (
                <div className="p-3 space-y-1.5 max-h-[calc(100vh-250px)] overflow-y-auto divide-y divide-slate-100">
                  {/* Dashboard Tổng Quan Button */}
                  <button
                    type="button"
                    id="admin-func-dashboard"
                    onClick={() => {
                      setActiveModule('dashboard');
                      setIsSidebarMobileOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-2xl mb-2 transition cursor-pointer border ${activeModule === 'dashboard'
                      ? 'bg-red-50 text-red-900 border-red-300 font-bold shadow-xs ring-1 ring-red-200'
                      : 'bg-white text-slate-800 hover:bg-slate-50 border-slate-200'
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${activeModule === 'dashboard' ? 'bg-red-600 text-white border-red-600' : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                        <LayoutDashboard className="w-4 h-4" />
                      </div>
                      <div className="text-left min-w-0">
                        <div className="text-xs font-black uppercase tracking-wide truncate">Dashboard Tổng Quan</div>
                        <div className="text-[10px] text-slate-500 font-sans font-normal truncate">Users • Dispatches • Biểu đồ</div>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">→</span>
                  </button>

                  {/* Quản lý người dùng with Sub-functions Tree */}
                  <div
                    id="admin-func-create-user"
                    className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-xs mb-2 transition"
                  >
                    <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-100">
                      <div className="w-7 h-7 rounded-xl bg-red-50 text-red-700 border border-red-200 flex items-center justify-center shrink-0">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide truncate">
                          Quản lý người dùng
                        </h3>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs font-mono">
                      {/* Danh sách users */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveModule('tab-users');
                          setIsSidebarMobileOpen(false);
                        }}
                        className={`w-full flex items-center text-left py-1.5 px-2 rounded-xl transition cursor-pointer ${activeModule === 'tab-users'
                          ? 'bg-red-50 text-red-800 font-bold border border-red-200 shadow-xs'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                          }`}
                      >
                        <span className="text-slate-400 select-none mr-2 font-normal">├──</span>
                        <Users className="w-3.5 h-3.5 mr-2 text-slate-500 shrink-0" />
                        <span className="font-sans font-medium truncate">Danh sách users</span>
                      </button>

                      {/* Tạo tài khoản */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveModule('create-user');
                          setIsSidebarMobileOpen(false);
                        }}
                        className={`w-full flex items-center text-left py-1.5 px-2 rounded-xl transition cursor-pointer ${activeModule === 'create-user'
                          ? 'bg-red-50 text-red-800 font-bold border border-red-200 shadow-xs'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                          }`}
                      >
                        <span className="text-slate-400 select-none mr-2 font-normal">├──</span>
                        <UserPlus className="w-3.5 h-3.5 mr-2 text-blue-600 shrink-0" />
                        <span className="font-sans font-medium truncate">Tạo tài khoản</span>
                      </button>

                      {/* Vai trò (Roles) */}
                      <button
                        type="button"
                        id="btn-admin-roles"
                        onClick={() => {
                          setActiveModule('roles');
                          setIsSidebarMobileOpen(false);
                        }}
                        className={`w-full flex items-center text-left py-1.5 px-2 rounded-xl transition cursor-pointer ${activeModule === 'roles'
                          ? 'bg-red-50 text-red-800 font-bold border border-red-200 shadow-xs'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                          }`}
                      >
                        <span className="text-slate-400 select-none mr-2 font-normal">├──</span>
                        <ShieldCheck className="w-3.5 h-3.5 mr-2 text-purple-600 shrink-0" />
                        <span className="font-sans font-medium truncate">Vai trò (Roles)</span>
                      </button>

                      {/* Quyền (Permissions) */}
                      <button
                        type="button"
                        id="btn-admin-permissions"
                        onClick={() => {
                          setPermissionRole('PHO_VIEN_TRUONG');
                          setActiveModule('permissions');
                          setIsSidebarMobileOpen(false);
                        }}
                        className={`w-full flex items-center text-left py-1.5 px-2 rounded-xl transition cursor-pointer ${activeModule === 'permissions'
                          ? 'bg-red-50 text-red-800 font-bold border border-red-200 shadow-xs'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                          }`}
                      >
                        <span className="text-slate-400 select-none mr-2 font-normal">└──</span>
                        <Key className="w-3.5 h-3.5 mr-2 text-amber-600 shrink-0" />
                        <span className="font-sans font-medium truncate">Quyền (Permissions)</span>
                      </button>
                    </div>
                  </div>

                  {/* QUẢN LÝ PHÒNG BAN with Sub-functions Tree */}
                  <div
                    id="admin-func-transfer-dept"
                    className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-xs mb-2 transition"
                  >
                    <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-100">
                      <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0">
                        <Building className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide truncate">
                          🏢 Quản lý phòng ban
                        </h3>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs font-mono">
                      {/* Danh sách phòng */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveModule('departments');
                          setIsSidebarMobileOpen(false);
                        }}
                        className={`w-full flex items-center text-left py-1.5 px-2 rounded-xl transition cursor-pointer ${activeModule === 'departments'
                          ? 'bg-red-50 text-red-800 font-bold border border-red-200 shadow-xs'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                          }`}
                      >
                        <span className="text-slate-400 select-none mr-2 font-normal">├──</span>
                        <Building className="w-3.5 h-3.5 mr-2 text-blue-600 shrink-0" />
                        <span className="font-sans font-medium truncate">Danh sách phòng</span>
                      </button>

                      {/* Phó viện trưởng phụ trách */}
                      <button
                        type="button"
                        onClick={() => {
                          handleOpenAssignPvtModal();
                          setActiveModule('assign-pvt');
                          setIsSidebarMobileOpen(false);
                        }}
                        className={`w-full flex items-center text-left py-1.5 px-2 rounded-xl transition cursor-pointer ${activeModule === 'assign-pvt'
                          ? 'bg-red-50 text-red-800 font-bold border border-red-200 shadow-xs'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                          }`}
                      >
                        <span className="text-slate-400 select-none mr-2 font-normal">└──</span>
                        <ShieldCheck className="w-3.5 h-3.5 mr-2 text-purple-600 shrink-0" />
                        <span className="font-sans font-medium truncate">Phó viện trưởng phụ trách</span>
                      </button>
                    </div>
                  </div>

                  {/* QUẢN LÝ CÔNG VĂN with Sub-functions Tree */}
                  <div
                    id="admin-func-export-leadership-excel"
                    className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-xs mb-2 transition"
                  >
                    <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-100">
                      <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide truncate">
                          📄 Quản lý công văn
                        </h3>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs font-mono">
                      {/* Tất cả công văn */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveModule('tab-dispatches');
                          setIsSidebarMobileOpen(false);
                        }}
                        className={`w-full flex items-center text-left py-1.5 px-2 rounded-xl transition cursor-pointer ${activeModule === 'tab-dispatches'
                          ? 'bg-red-50 text-red-800 font-bold border border-red-200 shadow-xs'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                          }`}
                      >
                        <span className="text-slate-400 select-none mr-2 font-normal">├──</span>
                        <FileText className="w-3.5 h-3.5 mr-2 text-emerald-600 shrink-0" />
                        <span className="font-sans font-medium truncate">Tất cả công văn</span>
                      </button>

                      {/* Tạo công văn */}
                      <button
                        type="button"
                        onClick={() => {
                          setDispatchToEdit(null);
                          setIsDispatchModalOpen(true);
                          setIsSidebarMobileOpen(false);
                        }}
                        className="w-full flex items-center text-left py-1.5 px-2 rounded-xl transition cursor-pointer text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                      >
                        <span className="text-slate-400 select-none mr-2 font-normal">├──</span>
                        <Plus className="w-3.5 h-3.5 mr-2 text-blue-600 shrink-0" />
                        <span className="font-sans font-medium truncate">Tạo công văn</span>
                      </button>

                      {/* Nhập từ Excel */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsImportModalOpen(true);
                          setIsSidebarMobileOpen(false);
                        }}
                        className="w-full flex items-center text-left py-1.5 px-2 rounded-xl transition cursor-pointer text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                      >
                        <span className="text-slate-400 select-none mr-2 font-normal">├──</span>
                        <Upload className="w-3.5 h-3.5 mr-2 text-amber-600 shrink-0" />
                        <span className="font-sans font-medium truncate">Nhập từ Excel</span>
                      </button>

                      {/* Xuất báo cáo */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveModule('export-leadership-excel');
                          setIsSidebarMobileOpen(false);
                        }}
                        className={`w-full flex items-center text-left py-1.5 px-2 rounded-xl transition cursor-pointer ${activeModule === 'export-leadership-excel'
                          ? 'bg-red-50 text-red-800 font-bold border border-red-200 shadow-xs'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                          }`}
                      >
                        <span className="text-slate-400 select-none mr-2 font-normal">└──</span>
                        <Download className="w-3.5 h-3.5 mr-2 text-emerald-600 shrink-0" />
                        <span className="font-sans font-medium truncate">Xuất báo cáo</span>
                      </button>
                    </div>
                  </div>

                  {/* THỐNG KÊ with Sub-functions Tree */}
                  <div
                    id="admin-func-stats"
                    className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-xs mb-2 transition"
                  >
                    <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-100">
                      <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0">
                        <BarChart3 className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide truncate">
                          📊 Thống kê
                        </h3>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs font-mono">
                      {/* Tổng quan */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveModule('stats-overview');
                          setIsSidebarMobileOpen(false);
                        }}
                        className={`w-full flex items-center text-left py-1.5 px-2 rounded-xl transition cursor-pointer ${activeModule === 'stats-overview'
                          ? 'bg-red-50 text-red-800 font-bold border border-red-200 shadow-xs'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                          }`}
                      >
                        <span className="text-slate-400 select-none mr-2 font-normal">├──</span>
                        <PieChartIcon className="w-3.5 h-3.5 mr-2 text-purple-600 shrink-0" />
                        <span className="font-sans font-medium truncate">Tổng quan</span>
                      </button>

                      {/* Theo phòng */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveModule('stats-by-dept');
                          setIsSidebarMobileOpen(false);
                        }}
                        className={`w-full flex items-center text-left py-1.5 px-2 rounded-xl transition cursor-pointer ${activeModule === 'stats-by-dept'
                          ? 'bg-red-50 text-red-800 font-bold border border-red-200 shadow-xs'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                          }`}
                      >
                        <span className="text-slate-400 select-none mr-2 font-normal">├──</span>
                        <Building className="w-3.5 h-3.5 mr-2 text-blue-600 shrink-0" />
                        <span className="font-sans font-medium truncate">Theo phòng</span>
                      </button>

                      {/* Theo thời gian */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveModule('stats-by-time');
                          setIsSidebarMobileOpen(false);
                        }}
                        className={`w-full flex items-center text-left py-1.5 px-2 rounded-xl transition cursor-pointer ${activeModule === 'stats-by-time'
                          ? 'bg-red-50 text-red-800 font-bold border border-red-200 shadow-xs'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                          }`}
                      >
                        <span className="text-slate-400 select-none mr-2 font-normal">└──</span>
                        <Calendar className="w-3.5 h-3.5 mr-2 text-amber-600 shrink-0" />
                        <span className="font-sans font-medium truncate">Theo thời gian</span>
                      </button>
                    </div>
                  </div>

                  {/* DATABASE with Sub-functions Tree */}
                  <div
                    id="admin-func-database"
                    className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-xs mb-2 transition"
                  >
                    <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-100">
                      <div className="w-7 h-7 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center justify-center shrink-0">
                        <Database className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide truncate">
                          🗄️ Database
                        </h3>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs font-mono">
                      {/* Xem tất cả bảng */}
                      <button
                        type="button"
                        id="btn-admin-database-tables"
                        onClick={() => {
                          setActiveModule('database-tables');
                          setIsSidebarMobileOpen(false);
                        }}
                        className={`w-full flex items-center text-left py-1.5 px-2 rounded-xl transition cursor-pointer ${activeModule === 'database-tables'
                          ? 'bg-red-50 text-red-800 font-bold border border-red-200 shadow-xs'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                          }`}
                      >
                        <span className="text-slate-400 select-none mr-2 font-normal">├──</span>
                        <Table className="w-3.5 h-3.5 mr-2 text-cyan-600 shrink-0" />
                        <span className="font-sans font-medium truncate">Xem tất cả bảng</span>
                      </button>

                      {/* Audit Logs */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveModule('audit-logs');
                          setIsSidebarMobileOpen(false);
                        }}
                        className={`w-full flex items-center text-left py-1.5 px-2 rounded-xl transition cursor-pointer ${activeModule === 'audit-logs'
                          ? 'bg-red-50 text-red-800 font-bold border border-red-200 shadow-xs'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                          }`}
                      >
                        <span className="text-slate-400 select-none mr-2 font-normal">├──</span>
                        <History className="w-3.5 h-3.5 mr-2 text-amber-600 shrink-0" />
                        <span className="font-sans font-medium truncate">Audit Logs</span>
                      </button>

                      {/* Sessions */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveModule('sessions');
                          setIsSidebarMobileOpen(false);
                        }}
                        className={`w-full flex items-center text-left py-1.5 px-2 rounded-xl transition cursor-pointer ${activeModule === 'sessions'
                          ? 'bg-red-50 text-red-800 font-bold border border-red-200 shadow-xs'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                          }`}
                      >
                        <span className="text-slate-400 select-none mr-2 font-normal">└──</span>
                        <Activity className="w-3.5 h-3.5 mr-2 text-emerald-600 shrink-0" />
                        <span className="font-sans font-medium truncate">Sessions</span>
                      </button>
                    </div>
                  </div>

                  {/* CÀI ĐẶT with Sub-functions Tree */}
                  <div
                    id="admin-func-settings"
                    className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-xs mb-2 transition"
                  >
                    <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-100">
                      <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 border border-slate-300 flex items-center justify-center shrink-0">
                        <Settings className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide truncate">
                          ⚙️ Cài đặt
                        </h3>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs font-mono">
                      {/* Cột dữ liệu */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveModule('custom-columns');
                          setIsSidebarMobileOpen(false);
                        }}
                        className={`w-full flex items-center text-left py-1.5 px-2 rounded-xl transition cursor-pointer ${activeModule === 'custom-columns'
                          ? 'bg-red-50 text-red-800 font-bold border border-red-200 shadow-xs'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                          }`}
                      >
                        <span className="text-slate-400 select-none mr-2 font-normal">├──</span>
                        <Columns className="w-3.5 h-3.5 mr-2 text-indigo-600 shrink-0" />
                        <span className="font-sans font-medium truncate">Cột dữ liệu</span>
                      </button>

                      {/* System Settings */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveModule('system-settings');
                          setIsSidebarMobileOpen(false);
                        }}
                        className={`w-full flex items-center text-left py-1.5 px-2 rounded-xl transition cursor-pointer ${activeModule === 'system-settings'
                          ? 'bg-red-50 text-red-800 font-bold border border-red-200 shadow-xs'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                          }`}
                      >
                        <span className="text-slate-400 select-none mr-2 font-normal">└──</span>
                        <Settings className="w-3.5 h-3.5 mr-2 text-slate-600 shrink-0" />
                        <span className="font-sans font-medium truncate">System Settings</span>
                      </button>
                    </div>
                  </div>

                  {processedFunctions.filter(item => item.id !== 'create-user' && item.id !== 'tab-users' && item.id !== 'transfer-dept' && item.id !== 'assign-pvt' && item.id !== 'export-leadership-excel' && item.id !== 'tab-dispatches').map((item) => {
                    const IconComponent = item.icon;
                    const isCurrentTab = activeModule === item.id;

                    return (
                      <div
                        key={item.id}
                        id={`admin-func-${item.id}`}
                        onClick={() => {
                          item.action();
                          setIsSidebarMobileOpen(false);
                        }}
                        className={`group p-2.5 rounded-2xl transition cursor-pointer border ${isCurrentTab
                          ? 'bg-red-50/80 border-red-200 shadow-xs ring-1 ring-red-200'
                          : 'hover:bg-slate-50 border-transparent hover:border-slate-200'
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${item.iconBg}`}>
                            <IconComponent className="w-4 h-4" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className={`text-xs font-bold truncate ${isCurrentTab ? 'text-red-900 font-extrabold' : 'text-slate-900 group-hover:text-red-700'
                              }`}>
                              {item.title}
                            </h3>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {processedFunctions.length === 0 && (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      Không tìm thấy chức năng phù hợp với từ khóa "{sidebarSearch}"
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 text-center">
                  <button
                    onClick={() => setIsFunctionsCollapsed(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                  >
                    👁️ Hiện lại danh sách ({processedFunctions.length} chức năng)
                  </button>
                </div>
              )}
            </aside>
          )}

          {/* ========================================================================= */}
          {/* RIGHT WORKSPACE: ACTIVE MODULE VIEW */}
          {/* ========================================================================= */}
          <div className="flex-1 min-w-0 w-full space-y-4">
            {!isSidebarOpen && (
              <div className="flex items-center justify-between bg-white rounded-2xl p-2.5 border border-slate-200 shadow-xs">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  <PanelLeftOpen className="w-3.5 h-3.5 text-red-700" />
                  <span>Mở thanh bên</span>
                </button>
              </div>
            )}


            {/* MODULE: ADMIN DASHBOARD OVERVIEW (NEW - API INTEGRATED) */}
            {activeModule === 'dashboard' && (
              <AdminDashboardHome onNavigate={(m) => setActiveModule(m as AdminModule)} />
            )}


            {/* MODULE 2: TRANSFER DEPARTMENT INLINE VIEW */}
            {activeModule === 'transfer-dept' && (
              <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden p-6 space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
                      <ArrowRightLeft className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Chuyển bộ phận tài khoản</h2>
                      <p className="text-xs text-slate-500">Điều chuyển cán bộ sang phòng ban, phân bổ vai trò và đơn vị mới</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveModule('tab-users')}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                  >
                    ← Quay lại danh sách
                  </button>
                </div>

                <form onSubmit={handleSaveTransfer} className="max-w-2xl space-y-5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Chọn Tài Khoản Cần Điều Chuyển</label>
                    <select
                      value={transferUser?.id || ''}
                      onChange={e => {
                        const u = allUsers.find(user => user.id === e.target.value);
                        if (u) {
                          setTransferUser(u);
                          setTransferRoomCode(u.roomCode);
                          setTransferRole(u.role);
                          setTransferPvtManagerId(u.pvtManagerId || '');
                        }
                      }}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-semibold"
                    >
                      {allUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.roomCode} - {u.fullName} ({u.username})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Mã Bộ Phận / Ký Hiệu Đơn Vị Mới</label>
                    <input
                      type="text"
                      required
                      placeholder="TP1, TP2... hoặc tên đơn vị mới"
                      value={transferRoomCode}
                      onChange={e => setTransferRoomCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono font-bold text-amber-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Vai Trò Nhiệm Vụ Mới</label>
                    <select
                      value={transferRole}
                      onChange={e => setTransferRole(e.target.value as UserRole)}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium"
                    >
                      <option value="TRUONG_PHONG">TRUONG_PHONG (Lãnh đạo phòng)</option>
                      <option value="PHO_VIEN_TRUONG">PHO_VIEN_TRUONG (Phó Viện Trưởng)</option>
                      <option value="VIEN_TRUONG">VIEN_TRUONG (Viện Trưởng)</option>
                      <option value="ADMIN">ADMIN (Quản trị viên)</option>
                    </select>
                  </div>

                  {transferRole === 'TRUONG_PHONG' && (
                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">Phó Viện Trưởng Phụ Trách Mới</label>
                      <select
                        value={transferPvtManagerId}
                        onChange={e => setTransferPvtManagerId(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium"
                      >
                        <option value="">-- Chưa gán --</option>
                        {pvtUsers.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.roomCode}: {p.fullName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setActiveModule('tab-users')}
                      className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    >
                      Hủy thao tác
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-xl shadow-xs transition cursor-pointer"
                    >
                      Xác Nhận Điều Chuyển
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* MODULE 3: ASSIGN PVT SUPERVISION INLINE VIEW */}
            {activeModule === 'assign-pvt' && (
              <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden p-6 space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Gán quyền phụ trách tài khoản</h2>
                      <p className="text-xs text-slate-500">Phân công Phó Viện Trưởng trực tiếp phụ trách các đơn vị nghiệp vụ</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveModule('tab-users')}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                  >
                    ← Quay lại danh sách
                  </button>
                </div>

                <form onSubmit={handleSaveAssignPvt} className="max-w-2xl space-y-5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Chọn Trưởng Phòng / Bộ Phận Cần Phân Bổ</label>
                    <select
                      value={assignTpUser?.id || ''}
                      onChange={e => {
                        const tp = tpUsers.find(u => u.id === e.target.value);
                        if (tp) {
                          setAssignTpUser(tp);
                          setAssignPvtId(tp.pvtManagerId || (pvtUsers[0]?.id || ''));
                        }
                      }}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white font-semibold"
                    >
                      {tpUsers.map(tp => (
                        <option key={tp.id} value={tp.id}>
                          {tp.roomCode} - {tp.fullName} ({tp.username})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Chọn Lãnh Đạo Viện / Phó Viện Trưởng Phụ Trách</label>
                    <select
                      value={assignPvtId}
                      onChange={e => setAssignPvtId(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white font-medium"
                    >
                      <option value="">-- Chưa gán (Bỏ quyền phụ trách) --</option>
                      {pvtUsers.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.roomCode}: {p.fullName} ({p.username})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setActiveModule('tab-users')}
                      className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    >
                      Hủy thao tác
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs transition cursor-pointer"
                    >
                      Lưu Phân Công Phụ Trách
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* MODULE 4: EXPORT LEADERSHIP EXCEL INLINE VIEW */}
            {activeModule === 'export-leadership-excel' && (
              <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden p-6 space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Xuất công văn gửi Lãnh đạo (Excel)</h2>
                      <p className="text-xs text-slate-500">File Excel tổng hợp đầy đủ nội dung ý kiến chỉ đạo VT, PVT, tiến độ và hạn xử lý</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveModule('tab-users')}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                  >
                    ← Quay lại
                  </button>
                </div>

                <div className="max-w-xl space-y-4 text-xs">
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                    <p className="font-bold text-emerald-900">Tổng quan dữ liệu xuất báo cáo:</p>
                    <ul className="list-disc list-inside text-emerald-800 space-y-1">
                      <li>Tổng số công văn hiện có: <strong>{dispatches.length}</strong></li>
                      <li>Số công văn đang chọn: <strong>{selectedIds.length}</strong> {selectedIds.length > 0 ? '(Chỉ xuất những văn bản đã tích chọn)' : '(Sẽ xuất toàn bộ danh sách hiện tại)'}</li>
                      <li>Bao gồm cột: Số CV, Trích yếu, Ý kiến VT, Ý kiến PVT, Đơn vị thực hiện, Hạn xử lý, Trạng thái.</li>
                    </ul>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleExportLeadershipExcel}
                      className="flex items-center gap-2 px-5 py-2.5 font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Tải File Excel Ngay
                    </button>
                    <button
                      onClick={() => setActiveModule('tab-dispatches')}
                      className="px-4 py-2.5 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                    >
                      Xem bảng công văn
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MODULE 5: USERS TABLE VIEW */}
            {activeModule === 'tab-users' && (
              <div id="admin-user-management-view" className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden p-5 sm:p-6 space-y-4 animate-fadeIn">
                {/* 1. Header: 👥 QUẢN LÝ NGƯỜI DÙNG  [+ Tạo tài khoản] */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                        👥 QUẢN LÝ NGƯỜI DÙNG
                      </h2>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      id="btn-create-user-header"
                      onClick={() => setActiveModule('create-user')}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition cursor-pointer shadow-xs active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Tạo tài khoản</span>
                    </button>
                  </div>
                </div>

                {/* 2. Filter Bar: 🔍 [Tìm kiếm...]  [Vai trò ▼]  [Phòng ▼]  [Trạng thái ▼] */}
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  {/* Search Input */}
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm..."
                      value={userSearchTerm}
                      onChange={e => {
                        setUserSearchTerm(e.target.value);
                        setUserCurrentPage(1);
                      }}
                      className="w-full bg-white text-slate-800 pl-9 pr-7 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium placeholder-slate-400"
                    />
                    {userSearchTerm && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserSearchTerm('');
                          setUserCurrentPage(1);
                        }}
                        className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Vai trò Filter Dropdown */}
                  <div className="w-36">
                    <select
                      value={userRoleFilter}
                      onChange={e => {
                        setUserRoleFilter(e.target.value);
                        setUserCurrentPage(1);
                      }}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium text-slate-700 cursor-pointer"
                    >
                      <option value="all">Vai trò ▼</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="VIEN_TRUONG">VIEN_TRUONG</option>
                      <option value="PHO_VIEN_TRUONG">PHO_VT</option>
                      <option value="TRUONG_PHONG">TRUONG_PHONG</option>
                    </select>
                  </div>

                  {/* Phòng Filter Dropdown */}
                  <div className="w-36">
                    <select
                      value={userRoomFilter}
                      onChange={e => {
                        setUserRoomFilter(e.target.value);
                        setUserCurrentPage(1);
                      }}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium text-slate-700 cursor-pointer"
                    >
                      <option value="all">Phòng ▼</option>
                      <option value="none">- (Không phòng)</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.code}>
                          {dept.name} ({dept.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Trạng thái Filter Dropdown */}
                  <div className="w-36">
                    <select
                      value={userStatusFilter}
                      onChange={e => {
                        setUserStatusFilter(e.target.value);
                        setUserCurrentPage(1);
                      }}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium text-slate-700 cursor-pointer"
                    >
                      <option value="all">Trạng thái ▼</option>
                      <option value="active">Active (Hoạt động)</option>
                      <option value="inactive">Đã khóa (Inactive)</option>
                    </select>
                  </div>

                  {/* Reset Filter Button */}
                  {(userSearchTerm || userRoleFilter !== 'all' || userRoomFilter !== 'all' || userStatusFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setUserSearchTerm('');
                        setUserRoleFilter('all');
                        setUserRoomFilter('all');
                        setUserStatusFilter('all');
                        setUserCurrentPage(1);
                      }}
                      className="px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                      title="Xóa bộ lọc"
                    >
                      Đặt lại
                    </button>
                  )}
                </div>

                {/* 3. Users Table: STT | Tên đăng nhập | Họ và tên | Vai trò | Phòng ban | Trạng thái | Thao tác */}
                <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse font-sans">
                      <thead>
                        <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                          <th className="py-3 px-3.5 w-14 text-center font-bold">STT</th>
                          <th className="py-3 px-3.5 w-36 font-bold">Tên đăng nhập</th>
                          <th className="py-3 px-3.5 min-w-[160px] font-bold">Họ và tên</th>
                          <th className="py-3 px-3.5 w-36 font-bold">Vai trò</th>
                          <th className="py-3 px-3.5 w-24 text-center font-bold">Phòng ban</th>
                          <th className="py-3 px-3.5 w-28 text-center font-bold">Trạng thái</th>
                          <th className="py-3 px-3.5 w-28 text-center font-bold">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {paginatedUsers.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-slate-400 italic font-sans">
                              Không tìm thấy tài khoản người dùng phù hợp với bộ lọc.
                            </td>
                          </tr>
                        ) : (
                          paginatedUsers.map((u, idx) => {
                            const rowIndex = (userCurrentPage - 1) * userPageSize + idx + 1;
                            const isActive = !!u.active;

                            const roleDisplay =
                              u.role === 'ADMIN'
                                ? 'Quản trị viên'
                                : u.role === 'VIEN_TRUONG'
                                  ? 'Viện trưởng'
                                  : u.role === 'PHO_VIEN_TRUONG'
                                    ? 'Phó Viện trưởng'
                                    : 'Trưởng phòng';

                            const roomDisplay = u.role === 'TRUONG_PHONG' ? (u.roomCode || '—') : '—';

                            return (
                              <tr key={u.id} className="hover:bg-slate-50/80 transition">
                                <td className="py-3 px-3.5 text-center text-slate-500 font-medium">
                                  {rowIndex}
                                </td>
                                <td className="py-3 px-3.5 font-bold text-slate-900">
                                  {u.username}
                                </td>
                                <td className="py-3 px-3.5 font-semibold text-slate-800">
                                  {u.fullName}
                                </td>
                                <td className="py-3 px-3.5">
                                  <span
                                    className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold ${u.role === 'ADMIN'
                                      ? 'bg-slate-100 text-slate-800 border border-slate-300'
                                      : u.role === 'VIEN_TRUONG'
                                        ? 'bg-red-100 text-red-800 border border-red-200'
                                        : u.role === 'PHO_VIEN_TRUONG'
                                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                                      }`}
                                  >
                                    {roleDisplay}
                                  </span>
                                </td>
                                <td className="py-3 px-3.5 text-center font-semibold text-slate-700">
                                  {roomDisplay}
                                </td>
                                <td className="py-3 px-3.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleUserActive(u)}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer border ${isActive
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                      : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                      }`}
                                    title={isActive ? 'Đang kích hoạt - Bấm để tạm khóa' : 'Đã khóa - Bấm để kích hoạt'}
                                  >
                                    {isActive ? (
                                      <>
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Hoạt động</span>
                                      </>
                                    ) : (
                                      <>
                                        <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                        <span>Tạm khóa</span>
                                      </>
                                    )}
                                  </button>
                                </td>
                                <td className="py-3 px-3.5 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditUser(u)}
                                      className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-slate-200 hover:border-blue-300 transition cursor-pointer shadow-2xs"
                                      title="Chỉnh sửa tài khoản"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    {u.id !== 'u_admin' && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteUser(u)}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 hover:border-rose-300 transition cursor-pointer shadow-2xs"
                                        title="Xóa tài khoản"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4. Pagination Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs font-sans text-slate-600">
                  <div>
                    Hiển thị <span className="font-semibold text-slate-900">{filteredUsers.length > 0 ? (userCurrentPage - 1) * userPageSize + 1 : 0}</span> - <span className="font-semibold text-slate-900">{Math.min(userCurrentPage * userPageSize, filteredUsers.length)}</span> trên tổng số <span className="font-semibold text-slate-900">{filteredUsers.length}</span> tài khoản
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Previous Button */}
                    <button
                      type="button"
                      disabled={userCurrentPage <= 1}
                      onClick={() => setUserCurrentPage(p => Math.max(1, p - 1))}
                      className={`p-1.5 rounded-xl border text-xs font-semibold transition ${userCurrentPage <= 1
                        ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
                        : 'border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer bg-white shadow-2xs'
                        }`}
                      title="Trang trước"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Page Numbers */}
                    {Array.from({ length: totalUserPages }, (_, i) => i + 1).map(pageNum => (
                      <button
                        key={`page-btn-${pageNum}`}
                        type="button"
                        onClick={() => setUserCurrentPage(pageNum)}
                        className={`min-w-[32px] h-8 px-2 rounded-xl border text-xs font-bold transition cursor-pointer ${userCurrentPage === pageNum
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 shadow-2xs'
                          }`}
                      >
                        {pageNum}
                      </button>
                    ))}

                    {/* Next Button */}
                    <button
                      type="button"
                      disabled={userCurrentPage >= totalUserPages}
                      onClick={() => setUserCurrentPage(p => Math.min(totalUserPages, p + 1))}
                      className={`p-1.5 rounded-xl border text-xs font-semibold transition ${userCurrentPage >= totalUserPages
                        ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
                        : 'border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer bg-white shadow-2xs'
                        }`}
                      title="Trang kế tiếp"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MODULE: CREATE USER VIEW */}
            {activeModule === 'create-user' && (
              <div
                id="admin-create-user-container"
                className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden p-6 sm:p-8 max-w-2xl space-y-6 animate-fadeIn font-sans text-xs"
              >
                {/* Header: Tạo tài khoản mới */}
                <div className="pb-4 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900 tracking-wide uppercase">
                        Tạo tài khoản người dùng mới
                      </h2>
                      <p className="text-xs text-slate-500 font-normal">
                        Cấp phát thông tin đăng nhập và phân quyền vị trí công tác
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveModule('tab-users')}
                    className="text-xs font-semibold text-slate-600 hover:text-blue-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
                  >
                    ← Quay lại danh sách
                  </button>
                </div>

                <form onSubmit={handleCreateUser} className="space-y-6">
                  {/* SECTION 1: THÔNG TIN CƠ BẢN */}
                  <div className="space-y-3.5">
                    <div className="font-bold text-slate-900 tracking-wider text-xs uppercase flex items-center gap-2">
                      <span className="w-1.5 h-3.5 bg-blue-600 rounded-full"></span>
                      <span>Thông tin cơ bản</span>
                    </div>

                    <div className="space-y-3">
                      {/* Username */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
                        <label className="w-28 text-slate-700 font-medium shrink-0">
                          Tên đăng nhập:
                        </label>
                        <div className="flex items-center gap-2 flex-1 max-w-sm">
                          <input
                            type="text"
                            required
                            placeholder="test01"
                            value={newUser.username}
                            onChange={e => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                            className="w-60 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                          />
                          <span className="text-red-500 font-bold">*</span>
                        </div>
                      </div>

                      {/* Password */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
                        <label className="w-28 text-slate-700 font-medium shrink-0">
                          Mật khẩu:
                        </label>
                        <div className="flex items-center gap-2 flex-1 max-w-sm">
                          <input
                            type="text"
                            placeholder="vks@2026"
                            value={newUser.password}
                            onChange={e => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                            className="w-60 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                          />
                          <span className="text-slate-500 text-[11px] whitespace-nowrap">(mặc định)</span>
                        </div>
                      </div>

                      {/* Họ tên */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
                        <label className="w-28 text-slate-700 font-medium shrink-0">
                          Họ và tên:
                        </label>
                        <div className="flex items-center gap-2 flex-1 max-w-sm">
                          <input
                            type="text"
                            required
                            placeholder="Nguyễn Văn Test"
                            value={newUser.fullName}
                            onChange={e => setNewUser(prev => ({ ...prev, fullName: e.target.value }))}
                            className="w-60 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                          />
                          <span className="text-red-500 font-bold">*</span>
                        </div>
                      </div>

                      {/* Email */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
                        <label className="w-28 text-slate-700 font-medium shrink-0">
                          Email:
                        </label>
                        <div className="flex items-center gap-2 flex-1 max-w-sm">
                          <input
                            type="email"
                            placeholder="test01@vks.gov.vn"
                            value={newUser.email}
                            onChange={e => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                            className="w-60 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                          />
                        </div>
                      </div>

                      {/* Điện thoại */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
                        <label className="w-28 text-slate-700 font-medium shrink-0">
                          Điện thoại:
                        </label>
                        <div className="flex items-center gap-2 flex-1 max-w-sm">
                          <input
                            type="tel"
                            placeholder="0912345678"
                            value={newUser.phone}
                            onChange={e => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-60 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                          />
                        </div>
                      </div>

                      {/* Chức vụ */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
                        <label className="w-28 text-slate-700 font-medium shrink-0">
                          Chức danh:
                        </label>
                        <div className="flex items-center gap-2 flex-1 max-w-sm">
                          <input
                            type="text"
                            placeholder="Chuyên viên"
                            value={newUser.position}
                            onChange={e => setNewUser(prev => ({ ...prev, position: e.target.value }))}
                            className="w-60 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* DIVIDER 1 */}
                  <div className="border-t border-slate-200" />

                  {/* SECTION 2: VAI TRÒ */}
                  <div className="space-y-3">
                    <div className="font-bold text-slate-900 tracking-wider text-xs uppercase flex items-center gap-2">
                      <span className="w-1.5 h-3.5 bg-purple-600 rounded-full"></span>
                      <span>Vai trò & Quyền hạn</span>
                      <span className="text-red-500 font-bold">*</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        { id: 'ADMIN', label: 'Quản trị viên (ADMIN)', desc: 'Toàn quyền cấu hình hệ thống' },
                        { id: 'VIEN_TRUONG', label: 'Viện trưởng (VIEN_TRUONG)', desc: 'Chỉ đạo toàn diện' },
                        { id: 'PHO_VIEN_TRUONG', label: 'Phó Viện trưởng (PHO_VT)', desc: 'Chỉ đạo khối phòng ban' },
                        { id: 'TRUONG_PHONG', label: 'Trưởng phòng (TRUONG_PHONG)', desc: 'Chỉ huy phòng nghiệp vụ' }
                      ].map(r => {
                        const isSelected = newUser.role === r.id;
                        return (
                          <div
                            key={r.id}
                            onClick={() => setNewUser(prev => ({ ...prev, role: r.id as UserRole }))}
                            className={`p-3 rounded-xl border cursor-pointer select-none transition ${isSelected
                              ? 'bg-blue-50/80 border-blue-300 ring-1 ring-blue-300'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {isSelected ? (
                                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                              )}
                              <div>
                                <div className={`font-bold ${isSelected ? 'text-blue-950' : 'text-slate-800'}`}>
                                  {r.label}
                                </div>
                                <div className="text-[11px] text-slate-500">{r.desc}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* DIVIDER 2 */}
                  <div className="border-t border-slate-200" />

                  {/* SECTION 3: TỔ CHỨC */}
                  <div className="space-y-3">
                    <div className="font-bold text-slate-900 tracking-wider text-xs uppercase flex items-center gap-2">
                      <span className="w-1.5 h-3.5 bg-emerald-600 rounded-full"></span>
                      <span>Đơn vị công tác & Quản lý trực tiếp</span>
                    </div>

                    <div className="space-y-3">
                      {/* Phòng ban */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
                        <label className="w-28 text-slate-700 font-medium shrink-0">
                          Phòng ban:
                        </label>
                        <div className="flex items-center gap-2 flex-1 max-w-sm">
                          <select
                            value={newUser.roomCode}
                            onChange={e => setNewUser(prev => ({ ...prev, roomCode: e.target.value }))}
                            className="w-60 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs cursor-pointer"
                          >
                            <option value="">-- Chọn phòng ban --</option>
                            {departments.map(dept => (
                              <option key={dept.id} value={dept.code}>{dept.name} ({dept.code})</option>
                            ))}
                          </select>
                          <span className="text-slate-500 text-[11px] whitespace-nowrap">
                            (bắt buộc nếu là Trưởng phòng)
                          </span>
                        </div>
                      </div>

                      {/* Cấp trên */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
                        <label className="w-28 text-slate-700 font-medium shrink-0">
                          Cấp trên chỉ đạo:
                        </label>
                        <div className="flex items-center gap-2 flex-1 max-w-sm">
                          <select
                            value={newUser.pvtManagerId}
                            onChange={e => setNewUser(prev => ({ ...prev, pvtManagerId: e.target.value }))}
                            className="w-60 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs cursor-pointer"
                          >
                            <option value="">-- Chọn lãnh đạo phụ trách --</option>
                            <option value="u_vt">Đ/c Viện Trưởng</option>
                            {pvtUsers.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.roomCode}: {p.fullName}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      id="btn-cancel-create-user"
                      onClick={() => {
                        setNewUser({
                          username: '',
                          password: 'vks@2026',
                          fullName: '',
                          email: '',
                          phone: '',
                          position: 'Chuyên viên',
                          role: 'PHO_VIEN_TRUONG',
                          roomCode: '',
                          pvtManagerId: ''
                        });
                        setActiveModule('tab-users');
                      }}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold transition cursor-pointer shadow-2xs text-xs"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      id="btn-submit-create-user"
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition cursor-pointer shadow-xs active:scale-95 text-xs"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Tạo tài khoản</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* MODULE: ROLES MANAGEMENT VIEW */}
            {activeModule === 'roles' && (
              <div
                id="admin-roles-container"
                className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden p-6 sm:p-8 max-w-4xl space-y-6 animate-fadeIn font-sans text-xs"
              >
                {/* Header */}
                <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900 tracking-wide uppercase">
                        Quản lý vai trò & Quyền hạn hệ thống
                      </h2>
                      <p className="text-xs text-slate-500 font-normal">
                        Danh mục các cấp bậc chức vụ và thẩm quyền vận hành quy trình
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPermissionRole('PHO_VIEN_TRUONG');
                        setActiveModule('permissions');
                      }}
                      className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3.5 py-1.5 rounded-xl transition cursor-pointer shadow-2xs"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                      <span>Ma trận phân quyền →</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveModule('tab-users')}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
                    >
                      ← Danh sách người dùng
                    </button>
                  </div>
                </div>

                {/* Main Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-2xs">
                  <table className="w-full text-left font-sans text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 select-none">
                        <th className="py-3 px-3.5 w-14 text-center border-r border-slate-200">STT</th>
                        <th className="py-3 px-4 border-r border-slate-200">Mã vai trò</th>
                        <th className="py-3 px-4 border-r border-slate-200">Tên chức danh</th>
                        <th className="py-3 px-3.5 w-28 text-center border-r border-slate-200">Số quyền</th>
                        <th className="py-3 px-3.5 w-28 text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        {
                          stt: 1,
                          code: 'ADMIN',
                          name: 'Quản trị viên',
                          permissionsCount: 40,
                          badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
                          description: 'Quản trị hệ thống, quản lý tài khoản cán bộ, thiết lập các trường dữ liệu, phân quyền và sao lưu dữ liệu toàn hệ thống.'
                        },
                        {
                          stt: 2,
                          code: 'VIEN_TRUONG',
                          name: 'Viện trưởng',
                          permissionsCount: 23,
                          badgeColor: 'bg-red-50 text-red-800 border-red-200',
                          description: 'Lãnh đạo cao nhất cơ quan, toàn quyền chỉ đạo công tác xử lý công văn, phân công nhiệm vụ cho Phó Viện Trưởng, phê duyệt báo cáo.'
                        },
                        {
                          stt: 3,
                          code: 'PHO_VIEN_TRUONG',
                          name: 'Phó Viện trưởng',
                          permissionsCount: 15,
                          badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
                          description: 'Lãnh đạo phụ trách các khối phòng ban, nhận chỉ đạo từ Viện Trưởng, giao việc chỉ đạo cho các Trưởng phòng trực thuộc.'
                        },
                        {
                          stt: 4,
                          code: 'TRUONG_PHONG',
                          name: 'Trưởng phòng',
                          permissionsCount: 12,
                          badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                          description: 'Trưởng đơn vị / phòng ban nghiệp vụ, tiếp nhận công văn phân công từ Lãnh đạo Viện, tổ chức thực hiện và báo cáo tiến độ.'
                        }
                      ].map((item) => (
                        <tr key={item.code} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-3.5 text-center text-slate-500 border-r border-slate-100 font-medium">
                            {item.stt}
                          </td>
                          <td className="py-3 px-4 border-r border-slate-100 font-bold text-slate-900 font-mono text-xs">
                            {item.code}
                          </td>
                          <td className="py-3 px-4 border-r border-slate-100 text-slate-800 font-semibold">
                            {item.name}
                          </td>
                          <td className="py-3 px-3.5 text-center border-r border-slate-100 font-bold text-blue-600">
                            <span className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200">
                              {rolePermissionsMap[item.code]?.length ?? item.permissionsCount} quyền
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5 font-sans">
                              {/* Xem chi tiết quyền */}
                              <button
                                type="button"
                                title="Xem chi tiết quyền"
                                onClick={() => setViewRoleModal(item)}
                                className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-slate-200 hover:border-blue-300 transition cursor-pointer shadow-2xs"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              {/* Chỉnh sửa quyền */}
                              <button
                                type="button"
                                title="Chỉnh sửa phân quyền"
                                onClick={() => {
                                  setPermissionRole(item.code as UserRole);
                                  setActiveModule('permissions');
                                }}
                                className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg border border-slate-200 hover:border-amber-300 transition cursor-pointer shadow-2xs"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Sub info cards: tổng quan số tài khoản thuộc từng vai trò */}
                <div className="pt-2">
                  <div className="text-xs text-slate-500 font-sans mb-2.5 font-medium">
                    Phân bổ tài khoản cán bộ đang kích hoạt theo vai trò:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-sans">
                    {[
                      { role: 'ADMIN', name: 'Quản trị viên', color: 'bg-purple-50 text-purple-700 border-purple-200' },
                      { role: 'VIEN_TRUONG', name: 'Viện trưởng', color: 'bg-red-50 text-red-700 border-red-200' },
                      { role: 'PHO_VIEN_TRUONG', name: 'Phó Viện trưởng', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                      { role: 'TRUONG_PHONG', name: 'Trưởng phòng', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
                    ].map(r => {
                      const count = allUsers.filter(u => u.role === r.role).length;
                      return (
                        <div key={r.role} className={`p-3.5 rounded-2xl border ${r.color} shadow-2xs flex flex-col justify-between`}>
                          <div className="text-[11px] font-semibold opacity-90 truncate">{r.name}</div>
                          <div className="text-xl font-extrabold mt-1">{count} <span className="text-xs font-normal opacity-80">cán bộ</span></div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Modal View Role Detail */}
                {viewRoleModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs font-sans animate-fadeIn">
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
                      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                        <div className="flex items-center gap-2.5">
                          <Eye className="w-5 h-5 text-blue-600" />
                          <span className="text-base font-bold text-slate-900">
                            Chi tiết vai trò: {viewRoleModal.name}
                          </span>
                          <span className="font-mono text-xs px-2 py-0.5 bg-slate-200 text-slate-800 rounded font-bold">
                            {viewRoleModal.code}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setViewRoleModal(null)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="p-5 space-y-4 text-xs">
                        <div>
                          <label className="text-slate-500 font-semibold block mb-1.5">Mô tả nhiệm vụ & thẩm quyền:</label>
                          <p className="text-slate-700 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 leading-relaxed">
                            {viewRoleModal.description}
                          </p>
                        </div>
                        <div>
                          <label className="text-slate-500 font-semibold block mb-1.5">
                            Tổng số quyền hạn được cấp: <strong className="text-blue-600 text-sm">{viewRoleModal.permissionsCount} quyền</strong>
                          </label>
                          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-slate-600 space-y-1.5">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Quyền truy cập các phân hệ công việc tương ứng</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Quyền xem, cập nhật tiến độ công văn và báo cáo kết quả</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Phân bổ chỉ đạo theo chu trình điều hành nghiệp vụ</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            const current = viewRoleModal;
                            setViewRoleModal(null);
                            setEditRoleModal(current);
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition cursor-pointer text-xs shadow-xs"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Chỉnh sửa quyền</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewRoleModal(null)}
                          className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl transition cursor-pointer text-xs shadow-2xs"
                        >
                          Đóng
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Modal Edit Role */}
                {editRoleModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs font-sans animate-fadeIn">
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
                      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-amber-50">
                        <div className="flex items-center gap-2.5">
                          <Edit3 className="w-5 h-5 text-amber-600" />
                          <span className="text-base font-bold text-amber-950">
                            Cập nhật vai trò: {editRoleModal.name}
                          </span>
                          <span className="font-mono text-xs px-2 py-0.5 bg-amber-200 text-amber-900 rounded font-bold">
                            {editRoleModal.code}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditRoleModal(null)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-amber-100 transition cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="p-5 space-y-3.5 text-xs">
                        <div>
                          <label className="text-slate-700 font-semibold block mb-1">Tên vai trò hiển thị:</label>
                          <input
                            type="text"
                            defaultValue={editRoleModal.name}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="text-slate-700 font-semibold block mb-1">Số quyền kích hoạt:</label>
                          <input
                            type="number"
                            defaultValue={editRoleModal.permissionsCount}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-slate-700 font-semibold block mb-1">Mô tả nhiệm vụ:</label>
                          <textarea
                            rows={3}
                            defaultValue={editRoleModal.description}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 leading-relaxed"
                          />
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={() => setEditRoleModal(null)}
                          className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl transition cursor-pointer text-xs shadow-2xs"
                        >
                          Hủy bỏ
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            showToast(`Đã lưu cập nhật vai trò ${editRoleModal.name} thành công!`);
                            setEditRoleModal(null);
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition cursor-pointer text-xs shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Lưu thay đổi</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MODULE: PERMISSIONS MANAGEMENT VIEW */}
            {activeModule === 'permissions' && (
              <div
                id="admin-permissions-container"
                className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden p-6 sm:p-8 max-w-4xl space-y-6 animate-fadeIn font-sans text-xs"
              >
                {/* Header */}
                <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900 tracking-wide uppercase">
                          Phân quyền chức năng vai trò:
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          {permissionRole}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-normal">
                        Tích chọn hoặc bỏ chọn đặc quyền thao tác trên hệ thống
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap font-sans">
                    <span className="text-xs text-slate-500 font-medium">Chọn vai trò:</span>
                    {(['ADMIN', 'VIEN_TRUONG', 'PHO_VIEN_TRUONG', 'TRUONG_PHONG'] as UserRole[]).map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setPermissionRole(r)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${permissionRole === r
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                      >
                        {r === 'ADMIN' ? 'Admin' : r === 'VIEN_TRUONG' ? 'Viện trưởng' : r === 'PHO_VIEN_TRUONG' ? 'Phó VT' : 'Trưởng phòng'}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setActiveModule('roles')}
                      className="ml-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer font-sans"
                    >
                      ← Danh sách vai trò
                    </button>
                  </div>
                </div>

                {/* Categories and permission items */}
                <div className="space-y-6 pt-1">
                  {(['USER', 'DISPATCH', 'SYSTEM', 'REPORTS & ANALYTICS'] as const).map(cat => {
                    const items = ALL_SYSTEM_PERMISSIONS.filter(p => p.category === cat);
                    return (
                      <div key={cat} className="space-y-2">
                        {/* Folder category title */}
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-2 select-none border-b border-slate-100 pb-1.5">
                          <Folder className="w-4 h-4 text-amber-500" />
                          <span className="tracking-wide uppercase">{cat}</span>
                          <span className="text-[11px] font-normal text-slate-500 font-sans">({items.length} quyền)</span>
                        </div>

                        {/* Items list */}
                        <div className="space-y-1.5 pl-1 sm:pl-2">
                          {items.map(item => {
                            const isChecked = currentRolePermissions.includes(item.key);
                            return (
                              <div
                                key={item.key}
                                onClick={() => togglePermission(item.key)}
                                className={`flex items-center gap-3 py-2 px-3 rounded-xl cursor-pointer transition select-none border ${isChecked
                                  ? 'bg-blue-50/70 border-blue-200 text-slate-900 shadow-2xs'
                                  : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-700'
                                  }`}
                              >
                                {isChecked ? (
                                  <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-400 shrink-0" />
                                )}

                                <span className={`w-56 sm:w-64 shrink-0 font-mono text-xs ${isChecked ? 'font-bold text-blue-950' : 'text-slate-800'}`}>
                                  {item.id}. {item.key}
                                </span>

                                <span className="text-slate-600 truncate font-sans text-xs">
                                  {item.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Batch selection buttons */}
                <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllPermissions}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl text-slate-800 font-semibold transition cursor-pointer shadow-2xs text-xs"
                    >
                      <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Chọn tất cả</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAllPermissions}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl text-slate-800 font-semibold transition cursor-pointer shadow-2xs text-xs"
                    >
                      <Square className="w-3.5 h-3.5 text-slate-500" />
                      <span>Bỏ chọn tất cả</span>
                    </button>
                  </div>

                  <div className="text-slate-700 font-medium text-xs">
                    Đang kích hoạt: <span className="text-blue-600 font-extrabold text-sm">{currentRolePermissions.length}</span> / {ALL_SYSTEM_PERMISSIONS.length} quyền
                  </div>
                </div>

                {/* Bottom actions */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 font-sans">
                  <button
                    type="button"
                    onClick={() => setActiveModule('roles')}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold transition cursor-pointer shadow-2xs text-xs"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePermissions}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition cursor-pointer shadow-xs text-xs active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>Lưu phân quyền</span>
                  </button>
                </div>
              </div>
            )}

            {/* MODULE: DEPARTMENTS LIST VIEW */}
            {activeModule === 'departments' && (
              <AdminDepartments
                allUsers={allUsers}
                onShowToast={(msg, type) => showToast(msg, type || 'success')}
              />
            )}

            {/* MODULE: STATS OVERVIEW */}
            {activeModule === 'stats-overview' && (
              <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden p-5 sm:p-6 space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Thống Kê Tổng Quan Hệ Thống</h2>
                      <p className="text-xs text-slate-500">Chỉ số toàn diện về lưu lượng công văn, tiến độ giải quyết và công tác chỉ đạo điều hành</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveModule('export-leadership-excel')}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Xuất Báo Cáo
                    </button>
                    <button
                      onClick={() => setActiveModule('tab-dispatches')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-600" />
                      Xem Tất Cả Công Văn
                    </button>
                  </div>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase">Tổng Công Văn</span>
                      <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                        <FileSpreadsheet className="w-4 h-4" />
                      </span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 mt-2">{dispatches.length}</div>
                  </div>

                  <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-700 uppercase">Đã Giải Quyết</span>
                      <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    </div>
                    <div className="text-2xl font-black text-emerald-950 mt-2">
                      {dispatches.filter(d => d.trangThai === 'da_giai_quyet').length}
                    </div>
                    <div className="text-[11px] text-emerald-700 mt-1 font-medium">
                      Đạt {dispatches.length > 0 ? Math.round((dispatches.filter(d => d.trangThai === 'da_giai_quyet').length / dispatches.length) * 100) : 0}% tổng số lượng
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-700 uppercase">Đang Xử Lý</span>
                      <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                        <Clock className="w-4 h-4" />
                      </span>
                    </div>
                    <div className="text-2xl font-black text-amber-950 mt-2">
                      {dispatches.filter(d => d.trangThai === 'dang_giai_quyet' || !d.trangThai || d.trangThai === 'cho_xu_ly').length}
                    </div>
                    <div className="text-[11px] text-amber-700 mt-1 font-medium">Đang trong hạn thụ lý</div>
                  </div>

                  <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/40">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-700 uppercase">Quá Hạn Xử Lý</span>
                      <span className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
                        <AlertCircle className="w-4 h-4" />
                      </span>
                    </div>
                    <div className="text-2xl font-black text-rose-950 mt-2">
                      {dispatches.filter(d => d.trangThai === 'qua_han').length}
                    </div>
                    <div className="text-[11px] text-rose-700 mt-1 font-medium">Cần Lãnh đạo đôn đốc</div>
                  </div>
                </div>

                {/* Chart & Leadership Stats Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Pie Chart: Status Breakdown */}
                  <div className="border border-slate-200 rounded-2xl p-4 bg-white">
                    <PieChartWidget
                      title="Phân Bổ Trạng Thái Giải Quyết"
                      subtitle="Tỷ lệ hoàn thành công việc theo toàn bộ công văn hiện hành"
                      size={250}
                      donut={true}
                      data={[
                        {
                          id: 'da_giai_quyet',
                          label: 'Đã hoàn thành',
                          value: dispatches.filter(d => d.trangThai === 'da_giai_quyet').length,
                          color: '#10b981'
                        },
                        {
                          id: 'dang_giai_quyet',
                          label: 'Đang giải quyết',
                          value: dispatches.filter(d => d.trangThai === 'dang_giai_quyet').length,
                          color: '#3b82f6'
                        },
                        {
                          id: 'cho_xu_ly',
                          label: 'Chờ xử lý',
                          value: dispatches.filter(d => d.trangThai === 'cho_xu_ly' || !d.trangThai).length,
                          color: '#f59e0b'
                        },
                        {
                          id: 'qua_han',
                          label: 'Quá hạn',
                          value: dispatches.filter(d => d.trangThai === 'qua_han').length,
                          color: '#ef4444'
                        }
                      ]}
                    />
                  </div>

                  {/* Leadership Direction Indicators */}
                  <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 mb-1">Công Tác Chỉ Đạo & Báo Cáo Tiến Độ</h3>
                      <p className="text-xs text-slate-500 mb-4">Mức độ tương tác và điều hành của Ban Lãnh Đạo qua hệ thống số</p>

                      <div className="space-y-3.5">
                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span className="text-slate-700">Viện Trưởng đã cho ý kiến chỉ đạo</span>
                            <span className="font-bold text-red-900">
                              {dispatches.filter(d => !!d.yKienChiDao).length} / {dispatches.length}
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-red-700 rounded-full transition-all duration-500"
                              style={{ width: `${dispatches.length > 0 ? (dispatches.filter(d => !!d.yKienChiDao).length / dispatches.length) * 100 : 0}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span className="text-slate-700">Phó Viện Trưởng đã chỉ đạo / giao việc</span>
                            <span className="font-bold text-purple-900">
                              {dispatches.filter(d => !!d.yKienPvt || !!d.assignedPvtId).length} / {dispatches.length}
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-600 rounded-full transition-all duration-500"
                              style={{ width: `${dispatches.length > 0 ? (dispatches.filter(d => !!d.yKienPvt || !!d.assignedPvtId).length / dispatches.length) * 100 : 0}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span className="text-slate-700">Trưởng Phòng đã cập nhật báo cáo tiến độ</span>
                            <span className="font-bold text-emerald-900">
                              {dispatches.filter(d => !!d.baoCaoTienDo).length} / {dispatches.length}
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                              style={{ width: `${dispatches.length > 0 ? (dispatches.filter(d => !!d.baoCaoTienDo).length / dispatches.length) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/80 grid grid-cols-2 gap-2 text-center text-xs">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <div className="text-slate-500 text-[11px]">Đã gán Phó Viện Trưởng</div>
                        <div className="font-black text-slate-800 text-base mt-0.5">
                          {dispatches.filter(d => !!d.assignedPvtId).length} CV
                        </div>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <div className="text-slate-500 text-[11px]">Đã gán Trưởng Phòng</div>
                        <div className="font-black text-slate-800 text-base mt-0.5">
                          {dispatches.filter(d => !!d.assignedTpId).length} CV
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MODULE: STATS BY DEPARTMENT */}
            {activeModule === 'stats-by-dept' && (
              <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden p-5 sm:p-6 space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Thống Kê Theo Phòng Ban Nghiệp Vụ</h2>
                      <p className="text-xs text-slate-500">Khối lượng công việc, tỷ lệ hoàn thành và tình hình giải quyết của từng phòng chuyên môn</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveModule('departments')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                  >
                    <Building className="w-3.5 h-3.5 text-slate-600" />
                    Quản Lý Danh Sách Phòng
                  </button>
                </div>

                {/* Departments Breakdown Table */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                        <th className="py-3 px-4 w-28">Phòng ban</th>
                        <th className="py-3 px-4">Trưởng Phòng</th>
                        <th className="py-3 px-4">PVT Phụ Trách</th>
                        <th className="py-3 px-3 text-center">Tổng CV</th>
                        <th className="py-3 px-3 text-center text-emerald-700">Đã xong</th>
                        <th className="py-3 px-3 text-center text-amber-700">Đang xử lý</th>
                        <th className="py-3 px-3 text-center text-rose-700">Quá hạn</th>
                        <th className="py-3 px-4 w-44 text-right">Tỷ lệ hoàn thành</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tpUsers.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400">
                            Chưa có dữ liệu phòng ban nào.
                          </td>
                        </tr>
                      ) : (
                        tpUsers.map((tp) => {
                          const assignedPvt = pvtUsers.find(p => p.id === tp.pvtManagerId);
                          const deptDispatches = dispatches.filter(d =>
                            d.assignedTpId === tp.id ||
                            d.assignedTpId === tp.roomCode ||
                            (d.phongBan && d.phongBan.toUpperCase() === tp.roomCode.toUpperCase())
                          );
                          const total = deptDispatches.length;
                          const completed = deptDispatches.filter(d => d.trangThai === 'da_giai_quyet').length;
                          const inProgress = deptDispatches.filter(d => d.trangThai === 'dang_giai_quyet' || !d.trangThai || d.trangThai === 'cho_xu_ly').length;
                          const overdue = deptDispatches.filter(d => d.trangThai === 'qua_han').length;
                          const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

                          return (
                            <tr key={tp.id} className="hover:bg-slate-50/80 transition">
                              <td className="py-3 px-4 font-mono font-bold text-blue-950">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
                                  {tp.roomCode}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-bold text-slate-900">
                                {tp.fullName}
                              </td>
                              <td className="py-3 px-4 text-slate-600">
                                {assignedPvt ? `${assignedPvt.roomCode} - ${assignedPvt.fullName}` : '—'}
                              </td>
                              <td className="py-3 px-3 text-center font-bold text-slate-900">
                                {total}
                              </td>
                              <td className="py-3 px-3 text-center font-bold text-emerald-700 bg-emerald-50/30">
                                {completed}
                              </td>
                              <td className="py-3 px-3 text-center font-bold text-amber-700 bg-amber-50/30">
                                {inProgress}
                              </td>
                              <td className="py-3 px-3 text-center font-bold text-rose-700 bg-rose-50/30">
                                {overdue}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${rate >= 75 ? 'bg-emerald-600' : rate >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                      style={{ width: `${rate}%` }}
                                    />
                                  </div>
                                  <span className="font-bold text-slate-800 w-10 text-right">{rate}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Workload Distribution Pie */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-white">
                  <PieChartWidget
                    title="Tỷ Trọng Khối Lượng Công Văn Theo Các Phòng Ban"
                    subtitle="Tỷ lệ phân bổ công văn giữa các đơn vị chuyên môn"
                    size={260}
                    donut={true}
                    data={tpUsers.map((tp, idx) => {
                      const colors = [
                        '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
                        '#06b6d4', '#84cc16', '#14b8a6', '#6366f1', '#f97316',
                        '#64748b', '#0284c7'
                      ];
                      const count = dispatches.filter(d =>
                        d.assignedTpId === tp.id ||
                        d.assignedTpId === tp.roomCode ||
                        (d.phongBan && d.phongBan.toUpperCase() === tp.roomCode.toUpperCase())
                      ).length;

                      return {
                        id: tp.id,
                        label: `${tp.roomCode} (${tp.fullName})`,
                        value: count,
                        color: colors[idx % colors.length]
                      };
                    })}
                  />
                </div>
              </div>
            )}

            {/* MODULE: STATS BY TIME */}
            {activeModule === 'stats-by-time' && (
              <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden p-5 sm:p-6 space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Thống Kê Công Văn Theo Thời Gian</h2>
                      <p className="text-xs text-slate-500">Phân tích tần suất ban hành, tiến độ giải quyết theo mốc thời gian và hạn xử lý</p>
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
                    {(['all', 'today', 'month', 'quarter', 'year'] as const).map(mode => {
                      const labels = {
                        all: 'Tất cả',
                        today: 'Hôm nay',
                        month: 'Tháng này',
                        quarter: 'Quý này',
                        year: 'Năm 2026'
                      };
                      const isActive = statsTimeFilter === mode;

                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setStatsTimeFilter(mode)}
                          className={`px-3 py-1 text-xs font-bold rounded-xl transition cursor-pointer ${isActive
                            ? 'bg-white text-red-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                          {labels[mode]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Date Range Selector */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-3 text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5 text-slate-500" />
                    Lọc theo khoảng ngày ban hành / tiếp nhận:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Từ ngày:</span>
                    <input
                      type="date"
                      value={statsStartDate}
                      onChange={e => setStatsStartDate(e.target.value)}
                      className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Đến ngày:</span>
                    <input
                      type="date"
                      value={statsEndDate}
                      onChange={e => setStatsEndDate(e.target.value)}
                      className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  {(statsStartDate || statsEndDate) && (
                    <button
                      type="button"
                      onClick={() => { setStatsStartDate(''); setStatsEndDate(''); }}
                      className="px-2 py-1 text-slate-600 hover:text-red-700 text-xs font-medium underline"
                    >
                      Xóa lọc ngày
                    </button>
                  )}
                </div>

                {/* Filtered Dispatches Analysis */}
                {(() => {
                  const now = new Date();
                  const filteredByTime = dispatches.filter(d => {
                    const dateStr = d.ngayBanHanh || d.ngayTao || '';
                    if (statsStartDate && dateStr && dateStr < statsStartDate) return false;
                    if (statsEndDate && dateStr && dateStr > statsEndDate) return false;

                    if (statsTimeFilter === 'today') {
                      const todayStr = now.toISOString().slice(0, 10);
                      return dateStr.startsWith(todayStr);
                    }
                    if (statsTimeFilter === 'month') {
                      const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                      return dateStr.startsWith(currentMonthStr);
                    }
                    if (statsTimeFilter === 'quarter') {
                      const currentQ = Math.floor(now.getMonth() / 3) + 1;
                      const monthNum = parseInt(dateStr.slice(5, 7), 10);
                      if (isNaN(monthNum)) return true;
                      const q = Math.floor((monthNum - 1) / 3) + 1;
                      return q === currentQ;
                    }
                    if (statsTimeFilter === 'year') {
                      return dateStr.startsWith('2026') || dateStr.startsWith('2025');
                    }
                    return true;
                  });

                  const countTotal = filteredByTime.length;
                  const countDone = filteredByTime.filter(d => d.trangThai === 'da_giai_quyet').length;
                  const countPending = filteredByTime.filter(d => d.trangThai === 'dang_giai_quyet' || !d.trangThai || d.trangThai === 'cho_xu_ly').length;
                  const countOverdue = filteredByTime.filter(d => d.trangThai === 'qua_han').length;

                  return (
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                          <div className="text-[11px] font-bold text-slate-500 uppercase">Trong Kỳ</div>
                          <div className="text-xl font-extrabold text-slate-900 mt-0.5">{countTotal} CV</div>
                        </div>
                        <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                          <div className="text-[11px] font-bold text-emerald-700 uppercase">Đã Giải Quyết</div>
                          <div className="text-xl font-extrabold text-emerald-950 mt-0.5">{countDone} CV</div>
                        </div>
                        <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl">
                          <div className="text-[11px] font-bold text-amber-700 uppercase">Đang Thực Hiện</div>
                          <div className="text-xl font-extrabold text-amber-950 mt-0.5">{countPending} CV</div>
                        </div>
                        <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-xl">
                          <div className="text-[11px] font-bold text-rose-700 uppercase">Quá Hạn</div>
                          <div className="text-xl font-extrabold text-rose-950 mt-0.5">{countOverdue} CV</div>
                        </div>
                      </div>

                      {/* Time-filtered table summary */}
                      <div className="border border-slate-200 rounded-2xl overflow-hidden">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                              <th className="py-2.5 px-4 w-28">Số CV</th>
                              <th className="py-2.5 px-4">Tên Công Văn</th>
                              <th className="py-2.5 px-4 w-32">Ngày ban hành</th>
                              <th className="py-2.5 px-4 w-32">Thời hạn xử lý</th>
                              <th className="py-2.5 px-4 w-32 text-center">Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredByTime.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="py-8 text-center text-slate-400">
                                  Không có công văn nào trong mốc thời gian này.
                                </td>
                              </tr>
                            ) : (
                              filteredByTime.slice(0, 10).map(d => (
                                <tr key={d.id} className="hover:bg-slate-50 transition">
                                  <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{d.soCongVan}</td>
                                  <td className="py-2.5 px-4 font-medium text-slate-800 truncate max-w-xs">{d.tenCongVan}</td>
                                  <td className="py-2.5 px-4 text-slate-500 font-mono">{d.ngayBanHanh || '—'}</td>
                                  <td className="py-2.5 px-4 text-slate-500 font-mono">{d.hanXuLy || '—'}</td>
                                  <td className="py-2.5 px-4 text-center">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${d.trangThai === 'da_giai_quyet'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : d.trangThai === 'qua_han'
                                        ? 'bg-rose-100 text-rose-800'
                                        : 'bg-amber-100 text-amber-800'
                                      }`}>
                                      {d.trangThai === 'da_giai_quyet' ? 'Đã giải quyết' : d.trangThai === 'qua_han' ? 'Quá hạn' : 'Đang xử lý'}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* MODULE: DATABASE - VIEW ALL TABLES (DATABASE VIEWER) */}
            {activeModule === 'database-tables' && (
              <DatabaseBrowser />
            )}


            {activeModule === 'audit-logs' && <AdminAuditLogs />}

            {/* MODULE: DATABASE - SESSIONS */}
            {activeModule === 'sessions' && <AdminSessions />}

            {/* MODULE: SETTINGS - CUSTOM COLUMNS */}
            {activeModule === 'custom-columns' && (
              <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden p-5 sm:p-6 space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center">
                      <Columns className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Quản Lý Cột Dữ Liệu (Columns Manager)</h2>
                      <p className="text-xs text-slate-500">Bật/tắt các cột hiển thị trên bảng công văn, điều chỉnh thứ tự và khôi phục mặc định</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        resetToDefaultColumns();
                        showToast('Đã khôi phục cấu hình cột mặc định');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Khôi Phục Mặc Định
                    </button>
                    <button
                      onClick={() => setIsColumnManagerOpen(true)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition cursor-pointer"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      Cửa Sổ Tùy Chỉnh Nâng Cao
                    </button>
                  </div>
                </div>

                {/* Columns Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {columns.map(col => (
                    <div
                      key={col.id}
                      onClick={() => toggleColumnVisibility(col.id)}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${col.visible
                        ? 'bg-indigo-50/50 border-indigo-200 text-indigo-950 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-lg flex items-center justify-center border ${col.visible ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-300'
                          }`}>
                          {col.visible && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold">{col.label}</div>
                          <div className="text-[11px] font-mono text-slate-500">{col.key}</div>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${col.visible ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                        {col.visible ? 'Hiển thị' : 'Ẩn'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
                  <span>Tổng số cột cấu hình: <strong>{columns.length}</strong> (Đang hiển thị: <strong>{columns.filter(c => c.visible).length}</strong> cột)</span>
                  <button
                    onClick={() => setActiveModule('tab-dispatches')}
                    className="font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    Quay lại bảng công văn →
                  </button>
                </div>
              </div>
            )}

            {/* MODULE: SETTINGS - SYSTEM SETTINGS */}
            {activeModule === 'system-settings' && (
              <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden p-5 sm:p-6 space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 border border-slate-300 flex items-center justify-center">
                      <Settings className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Cài Đặt Hệ Thống (System Settings)</h2>
                      <p className="text-xs text-slate-500">Cấu hình tham số đơn vị Viện Kiểm Sát, thời hạn xử lý văn bản và kết nối nội bộ</p>
                    </div>
                  </div>
                  <button
                    onClick={() => showToast('Đã lưu các cài đặt hệ thống thành công!')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Lưu Cài Đặt
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  {/* Agency Settings */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <h3 className="font-bold text-slate-900 uppercase text-xs border-b border-slate-200 pb-2">
                      1. Thông Tin Cơ Quan & Đơn Vị
                    </h3>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Tên Đơn Vị Sử Dụng</label>
                      <input
                        type="text"
                        defaultValue="Viện Kiểm Sát Nhân Dân"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Cơ Quan Cấp Trên</label>
                      <input
                        type="text"
                        defaultValue="Viện Kiểm Sát Nhân Dân Tối Cao"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Năm Công Tác Nghiệp Vụ</label>
                      <input
                        type="number"
                        defaultValue={2026}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  {/* Dispatch Deadline Settings */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <h3 className="font-bold text-slate-900 uppercase text-xs border-b border-slate-200 pb-2">
                      2. Cấu Hình Thời Hạn & Nhắc Việc
                    </h3>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Thời Hạn Xử Lý Mặc Định (Ngày)</label>
                      <input
                        type="number"
                        defaultValue={5}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Cảnh Báo Sắp Quá Hạn Trước (Ngày)</label>
                      <input
                        type="number"
                        defaultValue={2}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                      />
                    </div>
                    <div className="pt-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="autoOverdueCheck"
                        defaultChecked
                        className="rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                      />
                      <label htmlFor="autoOverdueCheck" className="text-slate-700 font-medium cursor-pointer">
                        Tự động chuyển trạng thái "Quá hạn" khi hết thời hạn xử lý
                      </label>
                    </div>
                  </div>
                </div>

                {/* Local Network Info */}
                <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/40 text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <Wifi className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-blue-950">Mạng Nội Bộ LAN & Port Kết Nối</div>
                      <div className="text-slate-600 text-[11px]">Hệ thống đang hoạt động trên Port 3000, hỗ trợ truy cập máy trạm trong cùng mạng cơ quan</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.origin);
                      showToast('Đã sao chép liên kết hệ thống vào bộ nhớ tạm!');
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer shrink-0"
                  >
                    Sao Chép URL LAN
                  </button>
                </div>
              </div>
            )}

            {/* MODULE 6: DISPATCHES MANAGEMENT VIEW */}
            {activeModule === 'tab-dispatches' && (
              <div className="space-y-4 animate-fadeIn">
                <ActionBar
                  onOpenImport={() => setIsImportModalOpen(true)}
                  onOpenGoogleSheets={() => setIsGoogleSheetModalOpen(true)}
                  onExportExcel={() => exportDispatchesToExcel(filteredDispatches, columns)}
                  onOpenAddModal={() => { setDispatchToEdit(null); setIsDispatchModalOpen(true); }}
                  onOpenColumnManager={() => setIsColumnManagerOpen(true)}
                />

                <DashboardStats
                  stats={dashboardStats}
                  currentFilter={filters}
                  onFilterChange={updates => setFilters(prev => ({ ...prev, ...updates }))}
                />

                <FilterBar
                  filters={filters}
                  onFilterChange={updates => setFilters(prev => ({ ...prev, ...updates }))}
                  onResetFilters={() => setFilters({
                    searchQuery: '',
                    status: 'ALL',
                    donViBanHanh: 'ALL',
                    nguoiThucHien: 'ALL',
                    urgency: 'ALL',
                    dateFrom: '',
                    dateTo: '',
                    overdueOnly: false
                  })}
                  units={filterOptions.units}
                  assignees={filterOptions.assignees}
                  selectedCount={selectedIds.length}
                  totalDispatches={dispatches.length}
                  onBulkComplete={() => bulkUpdateStatus(selectedIds, 'HOAN_THANH')}
                  onBulkDelete={() => bulkDeleteDispatches(selectedIds)}
                  onClearAll={clearAllDispatches}
                  onExportSelected={() => exportLeadershipReportToExcel(dispatches.filter(d => selectedIds.includes(d.id)))}
                />

                <DispatchTable
                  dispatches={filteredDispatches}
                  columns={columns}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  selectedIds={selectedIds}
                  totalRawCount={dispatches.length}
                  onToggleSelectRow={toggleSelectRow}
                  onToggleSelectAll={toggleSelectAll}
                  onViewDetail={disp => setDetailDispatch(disp)}
                  onEdit={disp => { setDispatchToEdit(disp); setIsDispatchModalOpen(true); }}
                  onDelete={id => deleteDispatch(id)}
                  onQuickStatusChange={(id, st) => updateDispatch(id, { trangThai: st })}
                  onOpenAddModal={() => { setDispatchToEdit(null); setIsDispatchModalOpen(true); }}
                  onOpenImport={() => setIsImportModalOpen(true)}
                  onRestoreSamples={restoreSampleDispatches}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-fadeIn">
            <div className="px-6 py-4 bg-slate-900 text-white font-bold text-sm flex items-center justify-between">
              <span>Chỉnh Sửa Tài Khoản: {editingUser.username}</span>
              <button onClick={() => setEditingUser(null)} className="text-white/70 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Họ Và Tên</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={e => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {editingUser.role === 'TRUONG_PHONG' && (
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Phó Viện Trưởng Phụ Trách</label>
                  <select
                    value={editPvtManager}
                    onChange={e => setEditPvtManager(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="">-- Chưa gán --</option>
                    {pvtUsers.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.roomCode}: {p.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Đặt Lại Mật Khẩu (Để trống nếu không đổi)</label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={e => setEditPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Other Modals */}
      <ExcelImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} existingDispatches={dispatches} columns={columns} onCommitImport={commitExcelImport} />
      <DispatchModal isOpen={isDispatchModalOpen} onClose={() => setIsDispatchModalOpen(false)} dispatchToEdit={dispatchToEdit} columns={columns} onSave={addDispatch} />
      <ColumnManagerModal isOpen={isColumnManagerOpen} onClose={() => setIsColumnManagerOpen(false)} columns={columns} onAddCustomColumn={addCustomColumn} onToggleVisibility={toggleColumnVisibility} onRemoveColumn={removeColumn} onResetDefault={resetToDefaultColumns} />
      <DispatchDetailDrawer dispatch={detailDispatch} onClose={() => setDetailDispatch(null)} columns={columns} onUpdate={(id, updates) => { updateDispatch(id, updates); showToast('Đã cập nhật tiến độ công văn'); }} />
      <ConfirmModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} onConfirm={confirmModal.onConfirm} title={confirmModal.title} message={confirmModal.message} confirmText={confirmModal.confirmText} />
      <GoogleSheetModal isOpen={isGoogleSheetModalOpen} onClose={() => setIsGoogleSheetModalOpen(false)} showToast={showToast} sampleDispatch={dispatches[0]} />

      {/* Database Viewer Table Preview Modal */}
      {dbViewerPreviewTable && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 animate-fadeIn">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-800/80 flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-100">
                    Bảng:
                  </span>
                  <span className="font-mono font-bold text-sm text-cyan-400 bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
                    {dbViewerPreviewTable.toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    (
                    {dbViewerPreviewTable === 'users' ? allUsers.length :
                      dbViewerPreviewTable === 'dispatches' ? dispatches.length :
                        dbViewerPreviewTable === 'departments' ? 12 :
                          dbViewerPreviewTable === 'roles' ? 4 :
                            dbViewerPreviewTable === 'permissions' ? 40 :
                              dbViewerPreviewTable === 'user_roles' ? allUsers.length : 0} records
                    )
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 font-sans">
                {dbViewerPreviewTable !== 'audit_logs' && (
                  <button
                    type="button"
                    onClick={() => handleExportDbTable(dbViewerPreviewTable)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl border border-slate-700 cursor-pointer transition font-bold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Xuất JSON</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDbViewerPreviewTable(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 max-h-[70vh] overflow-y-auto text-xs">
              {/* Users */}
              {dbViewerPreviewTable === 'users' && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-16">ID</th>
                        <th className="py-2.5 px-3">Tên đăng nhập</th>
                        <th className="py-2.5 px-3">Họ và tên</th>
                        <th className="py-2.5 px-3">Vai trò</th>
                        <th className="py-2.5 px-3">Phòng</th>
                        <th className="py-2.5 px-3">Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allUsers.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-slate-500 font-mono">{u.id}</td>
                          <td className="py-2 px-3 font-bold text-slate-900">{u.username}</td>
                          <td className="py-2 px-3 text-slate-800">{u.fullName}</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {u.role}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-600">{u.roomCode || '-'}</td>
                          <td className="py-2 px-3 text-slate-500 text-[11px]">{u.email || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Dispatches */}
              {dbViewerPreviewTable === 'dispatches' && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-16">ID</th>
                        <th className="py-2.5 px-3 w-32">Số hiệu</th>
                        <th className="py-2.5 px-3">Trích yếu</th>
                        <th className="py-2.5 px-3 w-28">Trạng thái</th>
                        <th className="py-2.5 px-3 w-32">Hạn xử lý</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dispatches.map(d => (
                        <tr key={d.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-slate-500 font-mono">{d.id}</td>
                          <td className="py-2 px-3 font-bold text-slate-900">{d.soHieu}</td>
                          <td className="py-2 px-3 text-slate-800 truncate max-w-xs">{d.trichYeu}</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                              {d.trangThai}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-500">{d.hanXuLy || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Departments */}
              {dbViewerPreviewTable === 'departments' && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-24">Mã phòng</th>
                        <th className="py-2.5 px-3">Tên phòng</th>
                        <th className="py-2.5 px-3">PVT Phụ Trách</th>
                        <th className="py-2.5 px-3">Trưởng phòng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Array.from({ length: 12 }, (_, i) => `TP${i + 1}`).map(r => {
                        const tp = allUsers.find(u => u.roomCode === r && u.role === 'TRUONG_PHONG');
                        const pvt = tp?.pvtManagerId ? allUsers.find(u => u.id === tp.pvtManagerId) : null;
                        return (
                          <tr key={r} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-bold text-slate-900">{r}</td>
                            <td className="py-2 px-3 text-slate-800">Phòng {r.replace('TP', '')}</td>
                            <td className="py-2 px-3 text-blue-700 font-medium">{pvt ? `${pvt.roomCode}: ${pvt.fullName}` : 'Chưa phân công'}</td>
                            <td className="py-2 px-3 text-slate-700">{tp ? tp.fullName : 'Chưa phân công'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Roles */}
              {dbViewerPreviewTable === 'roles' && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-36">Mã Vai Trò</th>
                        <th className="py-2.5 px-3">Tên Vai Trò</th>
                        <th className="py-2.5 px-3 w-28 text-center">Số Quyền</th>
                        <th className="py-2.5 px-3">Mô tả</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { code: 'ADMIN', name: 'Quản trị viên', perm: 40, desc: 'Toàn quyền cấu hình và quản trị hệ thống' },
                        { code: 'VIEN_TRUONG', name: 'Viện trưởng', perm: 23, desc: 'Chỉ đạo toàn diện, phê duyệt và giám sát văn bản toàn viện' },
                        { code: 'PHO_VIEN_TRUONG', name: 'Phó Viện trưởng', perm: 15, desc: 'Phụ trách và chỉ đạo các phòng ban được phân công' },
                        { code: 'TRUONG_PHONG', name: 'Trưởng phòng', perm: 12, desc: 'Thực hiện văn bản, phân công chuyên viên và báo cáo tiến độ' }
                      ].map(r => (
                        <tr key={r.code} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-bold text-slate-900">{r.code}</td>
                          <td className="py-2 px-3 font-medium text-slate-800">{r.name}</td>
                          <td className="py-2 px-3 text-center font-bold text-blue-700">{r.perm} quyền</td>
                          <td className="py-2 px-3 text-slate-500 text-[11px]">{r.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Permissions */}
              {dbViewerPreviewTable === 'permissions' && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-16 text-center">STT</th>
                        <th className="py-2.5 px-3 w-28">Nhóm</th>
                        <th className="py-2.5 px-3 w-48 font-mono">Mã Quyền (Key)</th>
                        <th className="py-2.5 px-3">Tên Quyền Hạn</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ALL_SYSTEM_PERMISSIONS.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-center text-slate-500">{p.id}</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {p.category}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-900">{p.key}</td>
                          <td className="py-2 px-3 text-slate-700">{p.label}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* User Roles */}
              {dbViewerPreviewTable === 'user_roles' && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-16">User ID</th>
                        <th className="py-2.5 px-3">Tài khoản (Username)</th>
                        <th className="py-2.5 px-3">Họ và tên</th>
                        <th className="py-2.5 px-3">Vai trò phân công (Role)</th>
                        <th className="py-2.5 px-3">Đơn vị</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allUsers.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-slate-500 font-mono">{u.id}</td>
                          <td className="py-2 px-3 font-bold text-slate-900">{u.username}</td>
                          <td className="py-2 px-3 text-slate-800">{u.fullName}</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                              {u.role}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-600">{u.roomCode || 'Viện'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Audit Logs */}
              {dbViewerPreviewTable === 'audit_logs' && (
                <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <History className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <div className="font-bold text-slate-700">Bảng audit_logs hiện có 0 bản ghi</div>
                  <div className="text-[11px] mt-1 text-slate-500">Các hoạt động đăng nhập và thao tác hệ thống sẽ được ghi nhận tự động.</div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="text-[11px] text-slate-500">
                Hiển thị dữ liệu thực tế từ hệ thống cơ sở dữ liệu VKS
              </div>
              <button
                type="button"
                onClick={() => setDbViewerPreviewTable(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer transition shadow-xs"
              >
                Đóng Cửa Sổ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounceIn">
          <div className="bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
```

#### FILE: frontend/src/pages/Login.tsx
```typescript
// frontend/src/pages/Login.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  KeyRound,
  QrCode
} from 'lucide-react';
import { GoogleAuthModal } from '../components/GoogleAuthModal';
import { apiClient } from '../services/apiClient';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [totpInput, setTotpInput] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Tạm bỏ verify TOTP server-side
    if (!totpInput.trim() || totpInput.length !== 6) {
      setError('Vui lòng nhập mã xác thực 6 số');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(username, password);
      if (res.success) {
        // Lấy role từ user vừa login
        const currentUser = apiClient.getCurrentUser();
        const userRole = currentUser?.roles?.[0]?.code || currentUser?.role;
        
        redirectByRole(userRole, username);
      } else {
        setError(res.message || 'Tên đăng nhập hoặc mật khẩu không đúng');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const redirectByRole = (role?: string, fallbackUsername?: string) => {
    switch (role) {
      case 'ADMIN':
        navigate('/admin');
        break;
      case 'VIEN_TRUONG':
        navigate('/vt');
        break;
      case 'PHO_VIEN_TRUONG':
        // ✅ LUÔN dùng /pvt để match route /pvt/*
        navigate('/pvt');
        break;
      case 'TRUONG_PHONG':
        // ✅ LUÔN dùng /tp để match route /tp/*
        navigate('/tp');
        break;
      default:
        navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-800 selection:bg-red-600 selection:text-white">
      <main
        className="flex-1 w-full min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/background.jpg)',
          backgroundColor: '#9A1010'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-red-950/45 via-black/15 to-black/35 pointer-events-none" />

        <div className="relative z-10 w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 text-center flex flex-col items-center justify-center py-4">
            <div className="relative mb-6 group">
              <div className="absolute -inset-5 bg-amber-400/30 rounded-full blur-2xl opacity-90 group-hover:opacity-100 transition-opacity" />
              <img
                src="/logo.svg"
                alt="Huy hiệu VKSND"
                className="relative w-36 h-36 sm:w-44 sm:h-44 object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.35)] mx-auto transition-transform duration-300 hover:scale-105"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Agency Name (h3 placed above h2, now larger, elegant official typography) */}
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold uppercase tracking-[0.08em] sm:tracking-[0.14em] text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-200 to-amber-400 drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)] mb-3 leading-snug max-w-xl text-center">
              VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH
            </h3>

            {/* Subtle decorative divider */}
            <div className="flex items-center justify-center gap-3 w-48 mb-3">
              <span className="h-px w-full bg-gradient-to-r from-transparent via-amber-300/80 to-transparent" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.8)]" />
              <span className="h-px w-full bg-gradient-to-r from-transparent via-amber-300/80 to-transparent" />
            </div>

            {/* System Title (h2, smaller than h3, crisp, modern and prestigious) */}
            <h2 className="text-sm sm:text-base lg:text-lg font-semibold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-amber-100 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] leading-relaxed">
              Hệ thống báo cáo công việc
            </h2>
          </div>

          <div className="lg:col-span-5 w-full max-w-md mx-auto">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/80 overflow-hidden p-6 sm:p-8">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-b from-amber-50 to-white p-2 shadow-sm border border-amber-200 flex items-center justify-center ring-2 ring-red-100">
                  <img
                    src="/logo.svg"
                    alt="Logo VKS"
                    className="w-full h-full object-contain drop-shadow"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              <div className="text-center mb-5">
                <h3 className="text-lg font-black uppercase tracking-wider text-slate-900">
                  Đăng Nhập Hệ Thống
                </h3>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2 font-medium shadow-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  <span className="leading-snug">{error}</span>
                </div>
              )}

              <form onSubmit={handleFormLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Tên truy cập
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="Tên tài khoản"
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-red-600 focus:ring-2 focus:ring-red-100 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-red-600 focus:ring-2 focus:ring-red-100 focus:outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                      title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <span>Mã xác thực</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    </label>
                  </div>

                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-7">
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={totpInput}
                        onChange={e => setTotpInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="Mã 6 chữ số"
                        className="w-full px-3 py-2.5 text-sm text-center tracking-wider font-sans font-bold rounded-lg border border-slate-300 bg-white focus:border-red-600 focus:ring-2 focus:ring-red-100 focus:outline-none transition placeholder:font-normal placeholder:tracking-normal"
                      />
                    </div>

                    <div className="col-span-5">
                      <button
                        type="button"
                        onClick={() => setIsQrModalOpen(true)}
                        className="w-full py-2.5 px-2 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white rounded-lg font-semibold text-xs transition-all shadow-sm hover:shadow flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                        title="Quét mã QR bằng Google Authenticator"
                      >
                        <QrCode className="w-4 h-4 shrink-0 text-amber-300" />
                        <span className="truncate">Quét mã QR</span>
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 text-sm font-bold text-white rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wide disabled:opacity-75 mt-3"
                  style={{
                    backgroundColor: '#B71C1C'
                  }}
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{isLoading ? 'Đang xác thực...' : 'ĐĂNG NHẬP'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <GoogleAuthModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        onSelectCode={(code) => setTotpInput(code)}
      />
    </div>
  );
};

export default Login;```

#### FILE: frontend/src/pages/PhoVienTruongDashboard.tsx
```typescript
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../hooks/useDialog';
import { Header } from '../components/Header';
import { AssignTpModal } from '../components/AssignTpModal';
import { SubmitVtModal } from '../components/SubmitVtModal';
import { DispatchDetailDrawer } from '../components/DispatchDetailDrawer';
import { PvtDashboardHome } from '../components/pvt/PvtDashboardHome';
import { PvtAssignedDispatches } from '../components/pvt/PvtAssignedDispatches';
import { PvtAssignTpView } from '../components/pvt/PvtAssignTpView';
import { PvtPendingVtView } from '../components/pvt/PvtPendingVtView';
import { PvtRoomsDispatchesView } from '../components/pvt/PvtRoomsDispatchesView';
import { PvtStatsView } from '../components/pvt/PvtStatsView';
import { PvtNotificationsView } from '../components/pvt/PvtNotificationsView';
import { PvtSidebar, PvtSidebarTab } from '../components/pvt/PvtSidebar';
import { PvtHeroHeader } from '../components/pvt/PvtHeroHeader';
import { apiClient } from '../services/apiClient';
import { Dispatch } from '../types/dispatch';
import { User } from '../types/auth';
import { DEFAULT_COLUMNS } from '../constants/columns';
import { exportDispatchesToExcel } from '../services/excelService';
import {
  LayoutDashboard,
  FileText,
  CornerDownRight,
  Send,
  Building2,
  BarChart3,
  Bell,
  CheckCircle2,
  RefreshCw,
  Download,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

export type PvtTabKey =
  | 'dashboard'
  | 'cv-duoc-giao'
  | 'giao-tp'
  | 'cho-trinh-vt'
  | 'cv-cua-phong'
  | 'thong-ke'
  | 'thong-bao';

export const PhoVienTruongDashboard: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const { allUsers, currentUser } = useAuth();
  const dialog = useDialog();
  const navigate = useNavigate();

  // Active navigation tab
  const [activeSidebarTab, setActiveSidebarTab] = useState<PvtSidebarTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  // Determine which PVT is being viewed (defaults to PVT1)
  const pvtUser = useMemo(() => {
    if (id) {
      const cleanId = id.toLowerCase().replace('pvt', '');
      const num = parseInt(cleanId, 10);
      if (!isNaN(num)) {
        return allUsers.find(u => u.roomCode === `PVT${num}` || u.username === `pvt${num}`);
      }
      return allUsers.find(u => u.id === id || u.username === id || u.roomCode === id);
    }
    if (currentUser?.role === 'PHO_VIEN_TRUONG') {
      return currentUser;
    }
    // Default fallback to PVT 1
    return allUsers.find(u => u.roomCode === 'PVT1');
  }, [id, allUsers, currentUser]);

  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [allSystemDispatches, setAllSystemDispatches] = useState<Dispatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isAssignTpModalOpen, setIsAssignTpModalOpen] = useState(false);
  const [dispatchToAssign, setDispatchToAssign] = useState<Dispatch | null>(null);
  const [isSubmitVtModalOpen, setIsSubmitVtModalOpen] = useState(false);
  const [dispatchToSubmitVt, setDispatchToSubmitVt] = useState<Dispatch | null>(null);
  const [detailDispatch, setDetailDispatch] = useState<Dispatch | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Subordinate departments (Phòng phụ trách)
  // For PVT1: explicitly includes TP1 and TP2
  const subordinateRooms = useMemo(() => {
    if (!pvtUser) return [];
    const subs = allUsers.filter(u =>
      u.role === 'TRUONG_PHONG' &&
      (u.pvtManagerId === pvtUser.id || u.pvtManagerId === pvtUser.roomCode)
    );
    // If this is PVT1 and list is empty or needs fallback, ensure TP1 and TP2 are present
    if (pvtUser.roomCode === 'PVT1' && subs.length === 0) {
      return allUsers.filter(u => u.roomCode === 'TP1' || u.roomCode === 'TP2');
    }
    return subs;
  }, [pvtUser, allUsers]);

  const allTpUsers = useMemo(() => {
    return allUsers.filter(u => u.role === 'TRUONG_PHONG');
  }, [allUsers]);

  // Load dispatches for this PVT
  const loadDispatches = async () => {
    if (!pvtUser) return;
    setIsLoading(true);
    try {
      // 1. Fetch PVT's dispatches from VT
      const pvtList = await apiClient.getDispatches({
        assignedPvtId: pvtUser.id,
        limit: 500
      });
      setDispatches(pvtList);

      // 2. Fetch all dispatches to get subordinate department dispatches
      const allList = await apiClient.getDispatches({});
      setAllSystemDispatches(allList);
    } catch (err) {
      console.error('Lỗi khi tải công văn của PVT:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDispatches();
  }, [pvtUser]);

  // 1. CÔNG VĂN ĐƯỢC VT GIAO
  // All dispatches where assignedPvt matches this PVT
  const dispatchesFromVt = useMemo(() => {
    return dispatches.filter(d =>
      d.assignedPvtId === pvtUser?.id ||
      d.assignedPvtName === pvtUser?.fullName ||
      (pvtUser?.roomCode && d.assignedPvtName?.includes(pvtUser.roomCode))
    );
  }, [dispatches, pvtUser]);

  // 2. CHỜ TÔI TRÌNH VT
  // Dispatches with status CHO_TRINH_VT or submitted by subordinate rooms waiting for PVT approval
  const pendingSubmitVtDispatches = useMemo(() => {
    const subCodes = subordinateRooms.map(r => r.roomCode);
    const subIds = subordinateRooms.map(r => r.id);

    return allSystemDispatches.filter(d => {
      const isStatusPending = d.trangThai === 'CHO_TRINH_VT' || d.customFields?.trinhVtStatus === 'CHO_TRINH';
      const isPvtMatch = d.assignedPvtId === pvtUser?.id || (pvtUser?.roomCode && d.assignedPvtName?.includes(pvtUser.roomCode));
      const isTpMatch = (d.assignedTpId && subIds.includes(d.assignedTpId)) ||
        (d.assignedTpName && subCodes.some(c => d.assignedTpName?.includes(c)));
      return isStatusPending && (isPvtMatch || isTpMatch);
    });
  }, [allSystemDispatches, subordinateRooms, pvtUser]);

  // Handlers
  const handleOpenAssignTp = (disp: Dispatch) => {
    setDispatchToAssign(disp);
    setIsAssignTpModalOpen(true);
  };
  const handleSaveAssignTp = async (data: any) => {
    if (!dispatchToAssign) return;

    // Tìm roomCode của TP
    const targetTp = allTpUsers.find(u =>
      u.id === data.tpId || u.roomCode === data.tpId
    );

    const updated = await apiClient.assignToTps(dispatchToAssign.id, {
      tps: [{
        tpId: data.tpId,
        tpName: data.tpName,
        roomCode: targetTp?.roomCode || data.roomCode || '',
        isPrimary: true
      }],
      pvtChiDao: data.pvtChiDao,
      hanBaoCaoXuLy: data.hanBaoCaoXuLy
    });
    if (updated) {
      showToast(`Đã giao công văn số ${updated.soCongVan} cho ${data.tpName}`);
      loadDispatches();
    }
  };

  const handleOpenSubmitVt = (disp: Dispatch) => {
    setDispatchToSubmitVt(disp);
    setIsSubmitVtModalOpen(true);
  };

  const handleSubmitVt = async (dispatchId: string, yKienTrinhVt: string) => {
    const updated = await apiClient.pvtSubmit(dispatchId, {
      pvtChiDao: yKienTrinhVt
    });
    if (updated) {
      showToast(`Đã ký duyệt và trình Viện Trưởng công văn số ${updated.soCongVan}!`, 'success');
      loadDispatches();
    }
  };



  const handleReturnTp = async (dispatchId: string, lyDoTraLai: string) => {
    const updated = await apiClient.pvtDisagree(dispatchId, lyDoTraLai);
    if (updated) {
      showToast(`Đã trả lại hồ sơ công văn số ${updated.soCongVan} cho cấp phòng!`, 'info');
      loadDispatches();
    }
  };

  // Summary cho Hero Header
  const heroSummary = useMemo(() => {
    const total = dispatches.length;
    const hoanThanh = dispatches.filter(d => d.trangThai === 'HOAN_THANH').length;
    const quaHan = dispatches.filter(d => {
      if (d.trangThai === 'HOAN_THANH' || !d.hanBaoCaoXuLy) return false;
      return new Date(d.hanBaoCaoXuLy) < new Date();
    }).length;
    const choTrinhVt = dispatches.filter(d => d.trangThai === 'CHO_PVT_DUYET').length;
    const choGiaoTp = dispatches.filter(d => !d.assignedTpId && d.trangThai !== 'HOAN_THANH').length;
    return { total, hoanThanh, quaHan, choTrinhVt, choGiaoTp };
  }, [dispatches]);

  // KPI counts cho sidebar
  const sidebarCounts = useMemo(() => {
    return {
      pendingTp: dispatches.filter(d => !d.assignedTpId && d.trangThai !== 'HOAN_THANH').length,
      assignedTp: dispatches.filter(d => !!d.assignedTpId).length,
      waitingVt: dispatches.filter(d => d.trangThai === 'CHO_PVT_DUYET').length,
      notifications: 0,   // TODO: nối với useNotifications sau
    };
  }, [dispatches]);

  // Helper: lấy danh sách theo tab
  const getTabData = (): { title: string; items: Dispatch[]; emptyMessage: string } => {
    switch (activeSidebarTab) {
      case 'action-pending-tp':
        return {
          title: 'Chờ giao Trưởng phòng',
          items: dispatches.filter(d => !d.assignedTpId && d.trangThai !== 'HOAN_THANH'),
          emptyMessage: 'Tất cả công văn đã được giao cho phòng',
        };
      case 'action-assigned-tp':
        return {
          title: 'Đã giao Trưởng phòng',
          items: dispatches.filter(d => !!d.assignedTpId),
          emptyMessage: 'Chưa có công văn nào được giao TP',
        };
      case 'action-waiting-vt':
        return {
          title: 'Hồ sơ chờ trình Viện trưởng',
          items: dispatches.filter(d => d.trangThai === 'CHO_PVT_DUYET'),
          emptyMessage: 'Không có hồ sơ nào chờ trình',
        };
      default:
        return {
          title: 'Tất cả công văn',
          items: dispatches,
          emptyMessage: 'Chưa có công văn nào',
        };
    }
  };

  const tabData = getTabData();

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 font-sans">
      <Header />

      <main className="flex-1 max-w-[1680px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* Mobile toggle */}
        <div className="lg:hidden mb-3">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-xs cursor-pointer"
          >
            {isMobileSidebarOpen ? '✕ Đóng menu' : '☰ Mở menu'}
          </button>
        </div>

        {/* Layout 2 cột */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* Sidebar */}
          <PvtSidebar
            activeTab={activeSidebarTab}
            onChangeTab={setActiveSidebarTab}
            roomCode={pvtUser?.roomCode}
            userName={pvtUser?.fullName}
            counts={sidebarCounts}
            isMobileOpen={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
          />

          {/* Main content */}
          <div className="flex-1 min-w-0 w-full space-y-5">
            {/* Hero Header — luôn hiển thị */}
            <PvtHeroHeader
              userName={pvtUser?.fullName || 'Phó Viện trưởng'}
              roomCode={pvtUser?.roomCode}
              summary={heroSummary}
              onRefresh={loadDispatches}
              isLoading={isLoading}
            />

            {/* Tab: Dashboard — dùng component cũ */}
            {activeSidebarTab === 'dashboard' && (
              <PvtDashboardHome
                pvtUser={pvtUser || null}
                dispatchesFromVt={dispatchesFromVt}
                pendingSubmitVtDispatches={pendingSubmitVtDispatches}
                subordinateRooms={subordinateRooms}
                allDispatches={allSystemDispatches}
                onOpenAssignTp={handleOpenAssignTp}
                onOpenSubmitVt={handleOpenSubmitVt}
                onOpenDetail={setDetailDispatch}
                onNavigateTab={(tab) => setActiveSidebarTab(tab as PvtSidebarTab)}
              />
            )}

            {/* Tab: Báo cáo tổng quan */}
            {activeSidebarTab === 'report-overview' && (
              <PvtDashboardHome
                pvtUser={pvtUser || null}
                dispatchesFromVt={dispatchesFromVt}
                pendingSubmitVtDispatches={pendingSubmitVtDispatches}
                subordinateRooms={subordinateRooms}
                allDispatches={allSystemDispatches}
                onOpenAssignTp={handleOpenAssignTp}
                onOpenSubmitVt={handleOpenSubmitVt}
                onOpenDetail={setDetailDispatch}
                onNavigateTab={(tab) => setActiveSidebarTab(tab as PvtSidebarTab)}
              />
            )}

            {/* Tab: Báo cáo theo thời gian */}
            {activeSidebarTab === 'report-by-time' && (
              <PvtAssignedDispatches
                dispatches={dispatchesFromVt}
                onOpenAssignTp={handleOpenAssignTp}
                onOpenDetail={setDetailDispatch}
                onRefresh={loadDispatches}
                isLoading={isLoading}
              />
            )}

            {/* Tab: Xếp hạng PVT */}
            {activeSidebarTab === 'report-leaderboard' && (
              <PvtStatsView
                subordinateRooms={subordinateRooms}
                allDispatches={allSystemDispatches}
              />
            )}

            {/* Tab: Tất cả công văn */}
            {activeSidebarTab === 'action-all' && (
              <PvtAssignedDispatches
                dispatches={dispatchesFromVt}
                onOpenAssignTp={handleOpenAssignTp}
                onOpenDetail={setDetailDispatch}
                onRefresh={loadDispatches}
                isLoading={isLoading}
              />
            )}

            {/* Tab: Chờ giao TP */}
            {activeSidebarTab === 'action-pending-tp' && (
              <PvtAssignTpView
                dispatches={tabData.items}
                subordinateRooms={subordinateRooms}
                allTpUsers={allTpUsers}
                onOpenAssignTp={handleOpenAssignTp}
                onOpenDetail={setDetailDispatch}
                onRefresh={loadDispatches}
                isLoading={isLoading}
              />
            )}

            {/* Tab: Đã giao TP */}
            {activeSidebarTab === 'action-assigned-tp' && (
              <PvtAssignTpView
                dispatches={tabData.items}
                subordinateRooms={subordinateRooms}
                allTpUsers={allTpUsers}
                onOpenAssignTp={handleOpenAssignTp}
                onOpenDetail={setDetailDispatch}
                onRefresh={loadDispatches}
                isLoading={isLoading}
              />
            )}

            {/* Tab: Chờ trình VT */}
            {activeSidebarTab === 'action-waiting-vt' && (
              <PvtPendingVtView
                dispatches={pendingSubmitVtDispatches}
                onOpenSubmitVt={handleOpenSubmitVt}
                onOpenDetail={setDetailDispatch}
                onRefresh={loadDispatches}
                isLoading={isLoading}
              />
            )}

            {/* Tab: Thông báo */}
            {activeSidebarTab === 'action-notifications' && (
              <PvtNotificationsView
                pendingSubmitVtDispatches={pendingSubmitVtDispatches}
                dispatchesFromVt={dispatchesFromVt}
                onOpenDetail={setDetailDispatch}
                onOpenSubmitVt={handleOpenSubmitVt}
              />
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <AssignTpModal
        isOpen={isAssignTpModalOpen}
        onClose={() => setIsAssignTpModalOpen(false)}
        dispatch={dispatchToAssign}
        tpList={allTpUsers}
        currentPvt={pvtUser || null}
        onAssign={handleSaveAssignTp}
      />

      <SubmitVtModal
        isOpen={isSubmitVtModalOpen}
        onClose={() => setIsSubmitVtModalOpen(false)}
        dispatch={dispatchToSubmitVt}
        onSubmitVt={handleSubmitVt}
        onReturnTp={handleReturnTp}
      />

      <DispatchDetailDrawer
        dispatch={detailDispatch}
        onClose={() => setDetailDispatch(null)}
        columns={DEFAULT_COLUMNS}
        onUpdate={(id, updates) => {
          apiClient.updateDispatch(id, updates);
          loadDispatches();
        }}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-fadeIn">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold border ${toast.type === 'success'
              ? 'bg-slate-900 text-white border-slate-700'
              : toast.type === 'error'
                ? 'bg-rose-900 text-white border-rose-700'
                : 'bg-amber-900 text-white border-amber-700'
              }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhoVienTruongDashboard;
```

#### FILE: frontend/src/pages/PublicHome.tsx
```typescript
// src/pages/PublicHome.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from '../utils/format';
import { apiClient } from '../services/apiClient';
import {
  FileStack,
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Flame,
  ArrowUp,
} from 'lucide-react';
import { Dispatch, UrgencyLevel } from '../types/dispatch';
import { resolveDispatchStatus } from '../services/excelService';
import { Pagination } from '../components/Pagination';
import { sortDispatchesNewestFirst } from '../services/dateSort';
import { PublicHeroSection } from '../components/public/PublicHeroSection';
import { PublicKpiGrid } from '../components/public/PublicKpiGrid';
import { PublicFeaturedDispatches } from '../components/public/PublicFeaturedDispatches';
import { PublicFooter } from '../components/public/PublicFooter';

export const PublicHome: React.FC = () => {
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [currentTime, setCurrentTime] = useState<string>('');

  // Load dispatches từ API
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await apiClient.getDispatches({ limit: 500 });
        setDispatches(data);
      } catch (err) {
        console.error('Lỗi load dispatches:', err);
      }
    };
    loadData();

    // Refresh mỗi 60 giây
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto-refresh khi có sự kiện storage
  const refreshData = () => {
    apiClient.getDispatches({ limit: 500 }).then(data => setDispatches(data));
  };

  useEffect(() => {
    const handleStorageChange = () => {
      refreshData();
    };
    window.addEventListener('storage', handleStorageChange);

    // Live clock
    const updateClock = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      };
      setCurrentTime(now.toLocaleDateString('vi-VN', options));
    };
    updateClock();
    const clockTimer = setInterval(updateClock, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(clockTimer);
    };
  }, []);

  // Compute stats
  const stats = useMemo(() => {
    let dangXuLy = 0;
    let sapDenHan = 0;
    let quaHan = 0;
    let hoanThanh = 0;

    dispatches.forEach(d => {
      const st = resolveDispatchStatus(d);
      if (st === 'HOAN_THANH') hoanThanh++;
      else if (st === 'QUA_HAN') quaHan++;
      else if (st === 'SAP_DEN_HAN') sapDenHan++;
      else dangXuLy++;
    });

    return {
      total: dispatches.length,
      dangXuLy,
      sapDenHan,
      quaHan,
      hoanThanh,
    };
  }, [dispatches]);

  // Filter and sort
  const displayDispatches = useMemo(() => {
    const filtered = dispatches.filter(disp => {
      if (selectedStatus !== 'ALL') {
        const currentSt = resolveDispatchStatus(disp);
        if (currentSt !== selectedStatus) return false;
      }
      return true;
    });

    return sortDispatchesNewestFirst(filtered);
  }, [dispatches, selectedStatus]);

  // Phân trang
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Reset page khi filter đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus]);

  const totalPages = Math.max(1, Math.ceil(displayDispatches.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedDispatches = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return displayDispatches.slice(start, start + pageSize);
  }, [displayDispatches, currentPage, pageSize]);

  // === Nút ScrollTop + Auto-scroll ===
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTable = () => {
    const tableSection = document.getElementById('public-table-section');
    if (tableSection) {
      tableSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // === Urgency badge ===
  const renderUrgencyBadge = (level?: UrgencyLevel) => {
    switch (level) {
      case 'HOA_TOC':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
            <Flame className="w-3 h-3 text-red-600 animate-pulse" /> Hỏa tốc
          </span>
        );
      case 'THUONG_KHAN':
      case 'KHAN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-600" /> Khẩn
          </span>
        );
      default:
        return null;
    }
  };

  // === Status badge ===
  const renderStatusBadge = (disp: Dispatch) => {
    const status = resolveDispatchStatus(disp);
    const text = disp.thoiHanXuLy || '';

    if (status === 'HOAN_THANH') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          {text || 'Đã hoàn thành'}
        </span>
      );
    }

    if (status === 'QUA_HAN') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap shadow-xs">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          {text || 'Quá hạn'}
        </span>
      );
    }

    if (status === 'SAP_DEN_HAN') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          {text || 'Sắp đến hạn'}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
        <Clock className="w-3.5 h-3.5 text-blue-500" />
        {text || 'Đang xử lý'}
      </span>
    );
  };

  return (
    <div className="min-h-screen flex flex-col text-slate-900" style={{ backgroundColor: '#F5F5F0' }}>
      {/* Top Banner */}
      <header
        className="text-white sticky top-0 z-20 shadow-md border-b-2"
        style={{ backgroundColor: '#B71C1C', borderColor: '#7F0E0E' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <img
                src="/logo.svg"
                alt="Huy hiệu Viện Kiểm sát Nhân dân"
                className="w-12 h-12 sm:w-14 sm:h-14 object-contain shrink-0 drop-shadow-sm"
                referrerPolicy="no-referrer"
              />
              <div className="space-y-0.5">
                <div
                  className="text-xs sm:text-sm font-bold tracking-wider uppercase"
                  style={{ color: '#FFD700' }}
                >
                  VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH
                </div>
                <h1 className="text-lg sm:text-2xl font-black tracking-wide uppercase text-white">
                  Công văn gửi lãnh đạo
                </h1>
                {currentTime && (
                  <p className="text-[11px] sm:text-xs text-white/80 capitalize font-medium">
                    {currentTime}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/25 transition shadow-xs whitespace-nowrap"
              >
                <span>Đăng nhập vai trò</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Display Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        {/* ═══════════════ HERO SECTION ═══════════════ */}
        <PublicHeroSection
          totalDispatches={stats.total}
          totalCompleted={stats.hoanThanh}
          totalOverdue={stats.quaHan}
          onScrollToTable={scrollToTable}
        />

        {/* ═══════════════ KPI GRID ═══════════════ */}
        <PublicKpiGrid
          stats={stats}
          selectedStatus={selectedStatus}
          onSelectStatus={(status) =>
            setSelectedStatus(selectedStatus === status ? 'ALL' : status)
          }
        />

        {/* ═══════════════ FEATURED DISPATCHES ═══════════════ */}
        <PublicFeaturedDispatches
          dispatches={dispatches}
          onOpenDetail={() => scrollToTable()}
          onViewAll={scrollToTable}
        />

        {/* ═══════════════ DISPATCH TABLE ═══════════════ */}
        <div
          id="public-table-section"
          className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden"
        >
          {/* Title Banner */}
          <div
            className="text-white text-center py-2.5 px-4 border-b shadow-xs"
            style={{ backgroundColor: '#B71C1C', borderColor: '#7F0E0E' }}
          >
            <h2 className="text-sm sm:text-base font-bold tracking-wider uppercase text-white">
              CÔNG VĂN GỬI LÃNH ĐẠO
            </h2>
          </div>

          <div
            id="public-table-scroll-container"
            className="overflow-x-auto overflow-y-auto max-h-[640px]"
          >
            <table className="w-full text-left border-collapse min-w-[1500px]">
              <thead className="sticky top-0 z-10 shadow-2xs">
                <tr className="bg-[#b9d1ea] text-[#0f2942] border-b-2 border-slate-400">
                  <th className="w-12 min-w-[48px] px-3 py-3.5 text-center text-xs font-bold uppercase tracking-wider border-r-2 border-slate-400 select-none whitespace-nowrap">
                    STT
                  </th>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r-2 border-slate-400 select-none whitespace-nowrap text-center">
                    SỐ CÔNG VĂN
                  </th>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r-2 border-slate-400 select-none whitespace-nowrap text-center">
                    NGÀY GỬI
                  </th>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r-2 border-slate-400 select-none whitespace-nowrap text-center">
                    TÊN CÔNG VĂN
                  </th>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r-2 border-slate-400 select-none whitespace-nowrap text-center">
                    HẠN BÁO CÁO
                  </th>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r-2 border-slate-400 select-none whitespace-nowrap text-center">
                    THỜI HẠN XỬ LÝ
                  </th>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r-2 border-slate-400 select-none whitespace-nowrap text-center">
                    ĐƠN VỊ BAN HÀNH
                  </th>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r-2 border-slate-400 select-none whitespace-nowrap text-center">
                    NGƯỜI THỰC HIỆN
                  </th>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider select-none whitespace-nowrap text-center">
                    GHI CHÚ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
                {displayDispatches.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-28 px-4 text-slate-400 bg-slate-50/40">
                      <p className="text-sm text-slate-400 font-medium">
                        Hiện không có công văn nào để hiển thị
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedDispatches.map((disp, idx) => {
                    const status = resolveDispatchStatus(disp);
                    const isOverdue = status === 'QUA_HAN';
                    const isCompleted = status === 'HOAN_THANH';

                    return (
                      <tr
                        key={disp.id || idx}
                        className={`transition-colors ${
                          isOverdue
                            ? 'bg-rose-50/30 hover:bg-rose-50/60'
                            : isCompleted
                            ? 'bg-emerald-50/20 hover:bg-emerald-50/40'
                            : idx % 2 === 0
                            ? 'bg-white hover:bg-slate-50'
                            : 'bg-slate-50/40 hover:bg-slate-100/60'
                        }`}
                      >
                        <td className="px-3 py-5 sm:py-6 text-center border-r border-slate-100 text-slate-600 font-semibold text-sm">
                          {(currentPage - 1) * pageSize + idx + 1}
                        </td>

                        <td className="px-4 py-5 sm:py-6 border-r border-slate-100 text-slate-700 align-middle">
                          <span className="font-semibold text-xs text-slate-900 bg-slate-100/90 px-2 py-1 rounded border border-slate-200 inline-block w-fit">
                            {disp.soCongVan || '—'}
                          </span>
                        </td>

                        <td className="px-4 py-5 sm:py-6 border-r border-slate-100 text-slate-700 align-middle">
                          <span className="text-xs text-slate-800 font-medium whitespace-nowrap">
                            {formatDate(disp.ngayGui)}
                          </span>
                        </td>

                        <td className="px-5 py-5 sm:py-6 border-r border-slate-100 text-slate-700 align-middle min-w-[320px] max-w-[500px]">
                          <span
                            className="text-left font-semibold text-slate-900 text-sm leading-relaxed block"
                            title={disp.tenCongVan}
                          >
                            {disp.tenCongVan || '—'}
                          </span>
                        </td>

                        <td className="px-4 py-5 sm:py-6 border-r border-slate-100 text-slate-700 align-middle">
                          <span className="text-xs text-slate-800 font-medium whitespace-nowrap">
                            {formatDate(disp.hanBaoCaoXuLy)}
                          </span>
                        </td>

                        <td className="px-4 py-5 sm:py-6 border-r border-slate-100 text-slate-700 align-middle text-center">
                          {renderStatusBadge(disp)}
                        </td>

                        <td className="px-4 py-5 sm:py-6 border-r border-slate-100 text-slate-700 align-middle">
                          <span className="inline-block px-2.5 py-1 rounded bg-slate-100 text-slate-800 font-medium text-xs whitespace-nowrap">
                            {disp.donViBanHanh || '-'}
                          </span>
                        </td>

                        <td className="px-4 py-5 sm:py-6 border-r border-slate-100 text-slate-700 align-middle">
                          <span className="font-medium text-slate-800 text-xs whitespace-nowrap">
                            {disp.nguoiThucHien || 'Chưa giao'}
                          </span>
                        </td>

                        <td className="px-4 py-5 sm:py-6 text-slate-700 align-middle min-w-[180px]">
                          <div className="text-xs text-slate-600 leading-relaxed" title={disp.ghiChu}>
                            {disp.ghiChu || <span className="text-slate-300 italic">-</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="sticky bottom-0 z-20 shadow-xs">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={displayDispatches.length}
              pageSize={pageSize}
              onPageChange={p => {
                setCurrentPage(p);
                const container = document.getElementById('public-table-scroll-container');
                if (container) {
                  container.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              onPageSizeChange={newSize => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              pageSizeOptions={[10, 20, 50, 100]}
              extraControls={
                selectedStatus !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setSelectedStatus('ALL')}
                    className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer ml-1"
                  >
                    Xóa bộ lọc
                  </button>
                )
              }
            />
          </div>
        </div>

        {/* ═══════════════ FOOTER ═══════════════ */}
        <PublicFooter />
      </main>

      {/* Floating Scroll Top */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
          style={{
            backgroundColor: '#B71C1C',
            border: '2px solid #FFD700',
          }}
          title="Về đầu trang"
        >
          <ArrowUp className="w-5 h-5 text-white" />
        </button>
      )}
    </div>
  );
};

export default PublicHome;```

#### FILE: frontend/src/pages/TruongPhongDashboard.tsx
```typescript
// src/pages/TruongPhongDashboard.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../hooks/useDialog';
import { Header } from '../components/Header';
import { ReportProgressModal } from '../components/ReportProgressModal';
import { DispatchDetailDrawer } from '../components/DispatchDetailDrawer';
import { apiClient } from '../services/apiClient';
import { Dispatch, DispatchStatus } from '../types/dispatch';
import { DEFAULT_COLUMNS } from '../constants/columns';
import { exportDispatchesToExcel } from '../services/excelService';
import { TpSidebar, TpSidebarTab } from '../components/tp/TpSidebar';
import { TpHeroHeader } from '../components/tp/TpHeroHeader';
import { TpDashboardHome } from '../components/tp/TpDashboardHome';
import { TpDispatchesList } from '../components/tp/TpDispatchesList';
import { CheckCircle2, Download } from 'lucide-react';

export const TruongPhongDashboard: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const { allUsers, currentUser } = useAuth();
  const dialog = useDialog();
  const navigate = useNavigate();

  // Determine current department/TP user
  const tpUser = useMemo(() => {
    if (id) {
      const cleanId = id.toLowerCase().replace('tp', '');
      const num = parseInt(cleanId, 10);
      if (!isNaN(num)) {
        return allUsers.find(u => u.roomCode === `TP${num}` || u.username === `tp${num}`);
      }
      return allUsers.find(u => u.id === id || u.username === id || u.roomCode === id);
    }
    if (currentUser?.role === 'TRUONG_PHONG') {
      return currentUser;
    }
    return allUsers.find(u => u.roomCode === 'TP1');
  }, [id, allUsers, currentUser]);

  // Find PVT managing this room
  const managingPvt = useMemo(() => {
    if (!tpUser || !tpUser.pvtManagerId) return null;
    return allUsers.find(u => u.id === tpUser.pvtManagerId || u.roomCode === tpUser.pvtManagerId);
  }, [tpUser, allUsers]);

  // Sidebar tab
  const [activeSidebarTab, setActiveSidebarTab] = useState<TpSidebarTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Data
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [dispatchToReport, setDispatchToReport] = useState<Dispatch | null>(null);
  const [detailDispatch, setDetailDispatch] = useState<Dispatch | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load dispatches
  const loadDispatches = async () => {
    if (!tpUser) return;
    setIsLoading(true);
    try {
      const list = await apiClient.getDispatches({
        assignedTpId: tpUser.id,
        limit: 500,
      });
      setDispatches(list);
    } catch (err) {
      console.error('Lỗi tải công văn:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDispatches();
  }, [tpUser]);
  // Summary cho Hero Header
  const heroSummary = useMemo(() => {
    const total = dispatches.length;
    const hoanThanh = dispatches.filter(d => d.trangThai === 'HOAN_THANH').length;
    const quaHan = dispatches.filter(d => {
      if (d.trangThai === 'HOAN_THANH' || !d.hanBaoCaoXuLy) return false;
      return new Date(d.hanBaoCaoXuLy) < new Date();
    }).length;
    const choXuLy = dispatches.filter(d => d.trangThai === 'CHO_TP_XU_LY' || d.trangThai === 'MOI_TAO').length;
    const dangXuLy = dispatches.filter(d => d.trangThai === 'DANG_XU_LY').length;
    return { total, hoanThanh, quaHan, choXuLy, dangXuLy };
  }, [dispatches]);

  // KPI counts for sidebar badges
  const counts = useMemo(() => {
    const pending = dispatches.filter(d => d.trangThai === 'CHO_TP_XU_LY' || d.trangThai === 'MOI_TAO').length;
    const processing = dispatches.filter(d => d.trangThai === 'DANG_XU_LY').length;
    const reported = dispatches.filter(d => d.trangThai === 'CHO_PVT_DUYET' || d.trangThai === 'CHO_VT_DUYET').length;
    const waitingPvt = dispatches.filter(d => d.trangThai === 'CHO_PVT_DUYET').length;
    return { pending, processing, reported, waitingPvt };
  }, [dispatches]);

  // Handlers
  const handleOpenReport = (d: Dispatch) => {
    setDispatchToReport(d);
    setIsReportModalOpen(true);
  };

  const handleSaveReport = async (data: any) => {
    if (!dispatchToReport) return;
    try {
      // 1. Gửi báo cáo (tpSubmit)
      const updated = await apiClient.tpSubmit(dispatchToReport.id, {
        baoCaoTienDo: data.baoCaoTienDo || data.content || '',
        tienDo: data.tienDo || data.progressPct || 0,
      });

      if (!updated) {
        showToast('Lỗi gửi báo cáo', 'error');
        return;
      }

      // 2. Upload file đính kèm (nếu có)
      const files = (data.__attachments || []) as any[];
      let uploadedCount = 0;
      for (const f of files) {
        if (f.file instanceof File) {
          const res = await apiClient.uploadAttachment(
            dispatchToReport.id,
            f.file,
            'REPORT'
          );
          if (res.success) uploadedCount++;
        }
      }

      showToast(
        uploadedCount > 0
          ? `Đã gửi báo cáo + ${uploadedCount} file`
          : 'Đã gửi báo cáo lên PVT',
        'success'
      );
      setIsReportModalOpen(false);
      loadDispatches();
    } catch (err: any) {
      showToast(err.message || 'Lỗi', 'error');
    }
  };

  const handleMarkComplete = async (d: Dispatch) => {
    const confirmed = await dialog.confirm({
      title: 'Đánh dấu hoàn thành',
      message: `Xác nhận hoàn thành công văn "${d.soCongVan}"?\n\nDùng khi đã xử lý xong ngoài hệ thống.`,
      confirmText: 'Hoàn thành',
      cancelText: 'Hủy',
      variant: 'success',
    });
    if (!confirmed) return;

    const res = await apiClient.markComplete(d.id);
    if (res.success) {
      showToast('Đã đánh dấu hoàn thành', 'success');
      loadDispatches();
    } else {
      showToast(res.message || 'Lỗi', 'error');
    }
  };

  // Filter dispatches by tab
  const getTabDispatches = (): { title: string; items: Dispatch[]; emptyMessage: string } => {
    switch (activeSidebarTab) {
      case 'action-pending':
        return {
          title: 'Chờ xử lý',
          items: dispatches.filter(d => d.trangThai === 'CHO_TP_XU_LY' || d.trangThai === 'MOI_TAO'),
          emptyMessage: 'Không có công văn nào chờ xử lý',
        };
      case 'action-processing':
        return {
          title: 'Đang xử lý',
          items: dispatches.filter(d => d.trangThai === 'DANG_XU_LY'),
          emptyMessage: 'Không có công văn nào đang xử lý',
        };
      case 'action-reported':
        return {
          title: 'Đã báo cáo',
          items: dispatches.filter(d => d.trangThai === 'CHO_PVT_DUYET' || d.trangThai === 'CHO_VT_DUYET' || d.trangThai === 'HOAN_THANH'),
          emptyMessage: 'Chưa có công văn nào được báo cáo',
        };
      case 'action-waiting-pvt':
        return {
          title: 'Chờ PVT duyệt',
          items: dispatches.filter(d => d.trangThai === 'CHO_PVT_DUYET'),
          emptyMessage: 'Không có công văn nào chờ PVT duyệt',
        };
      default:
        return {
          title: 'Tất cả công văn',
          items: dispatches,
          emptyMessage: 'Chưa có công văn nào được giao',
        };
    }
  };

  const tabData = getTabDispatches();

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      <Header />

      <main className="flex-1 max-w-[1680px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* Mobile toggle */}
        <div className="lg:hidden mb-3">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-xs cursor-pointer"
          >
            {isMobileSidebarOpen ? '✕ Đóng menu' : '☰ Mở menu'}
          </button>
        </div>

        {/* Layout 2 cột */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* Sidebar */}
          <TpSidebar
            activeTab={activeSidebarTab}
            onChangeTab={setActiveSidebarTab}
            roomCode={tpUser?.roomCode}
            pvtManagerName={managingPvt?.fullName}
            counts={counts}
            isMobileOpen={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
          />

          {/* Main content */}
          <div className="flex-1 min-w-0 w-full space-y-5">
            {/* Hero Header — luôn hiển thị */}
            <TpHeroHeader
              userName={tpUser?.fullName || 'Trưởng phòng'}
              roomCode={tpUser?.roomCode}
              pvtManagerName={managingPvt?.fullName}
              summary={heroSummary}
              onRefresh={loadDispatches}
              isLoading={isLoading}
            />

            {/* Tab: Dashboard */}
            {activeSidebarTab === 'dashboard' && (
              <TpDashboardHome
                dispatches={dispatches}
                tpUser={tpUser}
                pvtManager={managingPvt}
                onOpenDetail={setDetailDispatch}
                onOpenReport={handleOpenReport}
                onMarkComplete={handleMarkComplete}
                onNavigateTab={(tab) => setActiveSidebarTab(tab as TpSidebarTab)}
              />
            )}

            {/* Tab: Báo cáo tổng quan */}
            {activeSidebarTab === 'report-overview' && (
              <TpDashboardHome
                dispatches={dispatches}
                tpUser={tpUser}
                pvtManager={managingPvt}
                onOpenDetail={setDetailDispatch}
                onOpenReport={handleOpenReport}
                onMarkComplete={handleMarkComplete}
                onNavigateTab={(tab) => setActiveSidebarTab(tab as TpSidebarTab)}
              />
            )}

            {/* Tab: Báo cáo theo thời gian */}
            {activeSidebarTab === 'report-by-time' && (
              <TpDispatchesList
                title="Công văn theo thời gian"
                dispatches={dispatches}
                onOpenDetail={setDetailDispatch}
                onOpenReport={handleOpenReport}
                onMarkComplete={handleMarkComplete}
                onRefresh={loadDispatches}
                isLoading={isLoading}
                emptyMessage="Chưa có công văn nào"
              />
            )}

            {/* Tab: Danh sách công văn (4 tab con) */}
            {(activeSidebarTab === 'action-all' ||
              activeSidebarTab === 'action-pending' ||
              activeSidebarTab === 'action-processing' ||
              activeSidebarTab === 'action-reported' ||
              activeSidebarTab === 'action-waiting-pvt') && (
                <TpDispatchesList
                  title={tabData.title}
                  dispatches={tabData.items}
                  onOpenDetail={setDetailDispatch}
                  onOpenReport={handleOpenReport}
                  onMarkComplete={handleMarkComplete}
                  onRefresh={loadDispatches}
                  isLoading={isLoading}
                  emptyMessage={tabData.emptyMessage}
                />
              )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <ReportProgressModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        dispatch={dispatchToReport}
        onSave={handleSaveReport}
      />

      <DispatchDetailDrawer
        dispatch={detailDispatch}
        onClose={() => setDetailDispatch(null)}
        columns={DEFAULT_COLUMNS}
        onUpdate={(id, updates) => {
          apiClient.updateDispatch(id, updates);
          loadDispatches();
        }}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-fadeIn">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold border ${toast.type === 'success'
              ? 'bg-slate-900 text-white border-slate-700'
              : toast.type === 'error'
                ? 'bg-rose-900 text-white border-rose-700'
                : 'bg-amber-900 text-white border-amber-700'
              }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TruongPhongDashboard;```

#### FILE: frontend/src/pages/VienTruongDashboard.tsx
```typescript
// src/pages/VienTruongDashboard.tsx
import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { AssignPvtModal } from '../components/AssignPvtModal';
import { AssignTpModal } from '../components/AssignTpModal';
import { DispatchModal } from '../components/DispatchModal';
import { DispatchDetailDrawer } from '../components/DispatchDetailDrawer';
import { ConfirmModal } from '../components/ConfirmModal';
import { apiClient } from '../services/apiClient';
import { Dispatch } from '../types/dispatch';
import { DEFAULT_COLUMNS } from '../constants/columns';
import { exportDispatchesToExcel } from '../services/excelService';
import { useVtDashboard } from '../hooks/vt/useVtDashboard';
import { VtFilters, DEFAULT_VT_FILTERS } from '../types/vt';

// VT Components
import { VtHeroHeader } from '../components/vt/VtHeroHeader';
import { VtKpiGrid } from '../components/vt/VtKpiGrid';
import { VtPvtLeaderboard } from '../components/vt/VtPvtLeaderboard';
import { VtDeptHeatmap } from '../components/vt/VtDeptHeatmap';
import {
  VtTrendChart,
  VtTopPvtChart,
  VtDeptChart,
} from '../components/vt/VtAdvancedCharts';
import { VtFilterBar } from '../components/vt/VtFilterBar';
import { VtPvtDetailDrawer } from '../components/vt/VtPvtDetailDrawer';
import { VtSidebar, VtSidebarTab } from '../components/vt/VtSidebar';

import { CheckCircle2, Download, Plus } from 'lucide-react';

export const VienTruongDashboard: React.FC = () => {
  const { allUsers, currentUser } = useAuth();

  // Dashboard data
  const {
    dispatches,
    summary,
    pvtStats,
    tpStats,
    trendData,
    heatmapData,
    isLoading,
    reload,
  } = useVtDashboard(allUsers);

  // Filters
  const [filters, setFilters] = useState<VtFilters>(DEFAULT_VT_FILTERS);
  // Sidebar Tab
  const [activeSidebarTab, setActiveSidebarTab] = useState<VtSidebarTab>('report-overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals / Drawers
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isAssignTpDirectOpen, setIsAssignTpDirectOpen] = useState(false);
  const [isAssignTpModalOpen, setIsAssignTpModalOpen] = useState(false); // Đã bổ sung state này
  const [dispatchToAssign, setDispatchToAssign] = useState<Dispatch | null>(null);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [dispatchToEdit, setDispatchToEdit] = useState<Dispatch | null>(null);
  const [detailDispatch, setDetailDispatch] = useState<Dispatch | null>(null);
  const [pvtDetailStat, setPvtDetailStat] = useState<any>(null);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
  }>({ isOpen: false, id: '', name: '' });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Lists
  const pvtList = useMemo(
    () => allUsers.filter(u => u.role === 'PHO_VIEN_TRUONG'),
    [allUsers]
  );

  // Pending counts for badges
  const pendingCount = useMemo(
    () => dispatches.filter(d => !d.assignedPvtId && d.trangThai !== 'HOAN_THANH').length,
    [dispatches]
  );

  const approveCount = useMemo(
    () => dispatches.filter(d => d.trangThai === 'CHO_VT_DUYET').length,
    [dispatches]
  );

  const deptList = useMemo(() => {
    return allUsers
      .filter(u => u.role === 'TRUONG_PHONG' && u.roomCode)
      .map(u => ({ code: u.roomCode || '', name: u.fullName }))
      .sort((a, b) => a.code.localeCompare(b.code, 'vi', { numeric: true }));
  }, [allUsers]);

  // Filtered dispatches (dùng cho table + xuất Excel)
  const filteredDispatches = useMemo(() => {
    return dispatches.filter(d => {
      // Search
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const match =
          (d.soCongVan || '').toLowerCase().includes(q) ||
          (d.tenCongVan || '').toLowerCase().includes(q) ||
          (d.donViBanHanh || '').toLowerCase().includes(q) ||
          (d.assignedPvtName || '').toLowerCase().includes(q) ||
          (d.assignedTpName || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      // PVT multi-select
      if (filters.pvtIds.length > 0) {
        const matchPvt = filters.pvtIds.some(id => {
          const pvt = pvtList.find(p => p.id === id);
          return (
            d.assignedPvtId === id ||
            (pvt && d.assignedPvtName === pvt.fullName) ||
            (pvt?.roomCode && d.assignedPvtName?.includes(pvt.roomCode))
          );
        });
        if (!matchPvt) return false;
      }

      // Dept multi-select
      if (filters.deptCodes.length > 0) {
        const matchDept = filters.deptCodes.some(code => {
          return (
            d.assignedTpId === code ||
            (d.assignedTpName && d.assignedTpName.includes(code)) ||
            (d.phongBan && d.phongBan.toUpperCase() === code.toUpperCase())
          );
        });
        if (!matchDept) return false;
      }

      // Status
      if (filters.status !== 'ALL' && d.trangThai !== filters.status) return false;

      // Urgency
      if (filters.urgency !== 'ALL' && d.mucDoKhan !== filters.urgency) return false;

      // Date range
      if (filters.dateFrom || filters.dateTo) {
        const dateStr = (d.ngayGui || d.ngayPhatHanh || '').slice(0, 10);
        if (filters.dateFrom && dateStr < filters.dateFrom) return false;
        if (filters.dateTo && dateStr > filters.dateTo) return false;
      }

      return true;
    });
  }, [dispatches, filters, pvtList]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      <Header />

      <main className="flex-1 max-w-[1680px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* Mobile menu button */}
        <div className="lg:hidden mb-3">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-xs cursor-pointer"
          >
            {isMobileSidebarOpen ? '✕ Đóng menu' : '☰ Mở menu'}
          </button>
        </div>

        {/* 2-COLUMN LAYOUT */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* SIDEBAR */}
          <VtSidebar
            activeTab={activeSidebarTab}
            onChangeTab={setActiveSidebarTab}
            pendingCount={pendingCount}
            approveCount={approveCount}
            isMobileOpen={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
          />

          {/* MAIN CONTENT */}
          <div className="flex-1 min-w-0 w-full space-y-5">

            {/* TAB: BÁO CÁO — TỔNG QUAN */}
            {activeSidebarTab === 'report-overview' && (
              <>
                <VtHeroHeader
                  userName={currentUser?.fullName || 'Viện trưởng'}
                  summary={summary}
                  onRefresh={reload}
                  isLoading={isLoading}
                />

                <VtKpiGrid
                  summary={summary}
                  onCardClick={key => {
                    if (key === 'overdue') {
                      setFilters({ ...DEFAULT_VT_FILTERS, status: 'QUA_HAN' });
                      setActiveSidebarTab('action-all');
                    } else if (key === 'due-soon') {
                      setFilters({ ...DEFAULT_VT_FILTERS, status: 'SAP_DEN_HAN' });
                      setActiveSidebarTab('action-all');
                    } else if (key === 'completed') {
                      setFilters({ ...DEFAULT_VT_FILTERS, status: 'HOAN_THANH' });
                      setActiveSidebarTab('action-all');
                    } else if (key === 'assigned') {
                      setActiveSidebarTab('action-assigned');
                    } else if (key === 'total') {
                      setActiveSidebarTab('action-all');
                    }
                  }}
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <VtTrendChart data={trendData} />
                  <VtTopPvtChart pvtStats={pvtStats} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <VtPvtLeaderboard
                    pvtStats={pvtStats}
                    onSelectPvt={pvt => setPvtDetailStat(pvt)}
                  />
                  <VtDeptHeatmap heatmapData={heatmapData} tpStats={tpStats} />
                </div>

                <VtDeptChart tpStats={tpStats} />
              </>
            )}

            {/* TAB: BÁO CÁO — THEO PHÒNG BAN */}
            {activeSidebarTab === 'report-by-dept' && (
              <>
                <VtHeroHeader
                  userName={currentUser?.fullName || 'Viện trưởng'}
                  summary={summary}
                  onRefresh={reload}
                  isLoading={isLoading}
                />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <VtDeptHeatmap heatmapData={heatmapData} tpStats={tpStats} />
                  <VtDeptChart tpStats={tpStats} />
                </div>
              </>
            )}

            {/* TAB: BÁO CÁO — THEO THỜI GIAN */}
            {activeSidebarTab === 'report-by-time' && (
              <>
                <VtHeroHeader
                  userName={currentUser?.fullName || 'Viện trưởng'}
                  summary={summary}
                  onRefresh={reload}
                  isLoading={isLoading}
                />
                <VtTrendChart data={trendData} />
              </>
            )}

            {/* TAB: BÁO CÁO — XẾP HẠNG PVT */}
            {activeSidebarTab === 'report-leaderboard' && (
              <>
                <VtHeroHeader
                  userName={currentUser?.fullName || 'Viện trưởng'}
                  summary={summary}
                  onRefresh={reload}
                  isLoading={isLoading}
                />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <VtPvtLeaderboard
                    pvtStats={pvtStats}
                    onSelectPvt={pvt => setPvtDetailStat(pvt)}
                  />
                  <VtTopPvtChart pvtStats={pvtStats} />
                </div>
              </>
            )}

            {/* TAB: THAO TÁC */}
            {(activeSidebarTab === 'action-all' ||
              activeSidebarTab === 'action-assigned' ||
              activeSidebarTab === 'action-pending' ||
              activeSidebarTab === 'action-approve') && (
                <>
                  <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                    <div>
                      <h1 className="text-base font-black text-slate-900">
                        {activeSidebarTab === 'action-all' && '📋 Tất cả công văn'}
                        {activeSidebarTab === 'action-assigned' && '👥 Đã phân công'}
                        {activeSidebarTab === 'action-pending' && '⏳ Chờ phân công PVT'}
                        {activeSidebarTab === 'action-approve' && '✅ Chờ phê duyệt'}
                      </h1>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {filteredDispatches.length} công văn
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => exportDispatchesToExcel(filteredDispatches, DEFAULT_COLUMNS)}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Xuất Excel
                      </button>
                      <button
                        onClick={() => { setDispatchToEdit(null); setIsAddEditModalOpen(true); }}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition cursor-pointer active:scale-95"
                        style={{ backgroundColor: '#B71C1C' }}
                      >
                        <span className="text-base leading-none">+</span>
                        Tạo công văn
                      </button>
                    </div>
                  </div>

                  <VtFilterBar
                    filters={filters}
                    onChange={setFilters}
                    pvtList={pvtList}
                    deptList={deptList}
                    totalResults={filteredDispatches.length}
                  />

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                            <th className="py-3 px-3 w-10 text-center">STT</th>
                            <th className="py-3 px-3 w-32">Số CV</th>
                            <th className="py-3 px-3 min-w-[280px]">Trích yếu</th>
                            <th className="py-3 px-3 w-44">PVT phụ trách</th>
                            <th className="py-3 px-3 w-32">Phòng</th>
                            <th className="py-3 px-3 w-28">Hạn</th>
                            <th className="py-3 px-3 w-28 text-center">Trạng thái</th>
                            <th className="py-3 px-3 w-40 text-center">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredDispatches.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-16 text-center text-slate-400 italic">
                                Không có công văn nào
                              </td>
                            </tr>
                          ) : (
                            filteredDispatches.map((d, idx) => (
                              <tr key={d.id} className="hover:bg-slate-50/70 transition">
                                <td className="py-3 px-3 text-center text-slate-400 font-mono">
                                  {idx + 1}
                                </td>
                                <td className="py-3 px-3">
                                  <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                    {d.soCongVan}
                                  </span>
                                </td>
                                <td className="py-3 px-3">
                                  <div
                                    onClick={() => setDetailDispatch(d)}
                                    className="font-semibold text-slate-900 hover:text-red-700 cursor-pointer line-clamp-2"
                                  >
                                    {d.tenCongVan}
                                  </div>
                                </td>
                                <td className="py-3 px-3">
                                  {d.assignedPvtName ? (
                                    <span className="inline-block px-2 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold">
                                      {d.assignedPvtName.replace('Đ/c ', '')}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                      Chưa giao
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-slate-700 text-[11px]">
                                  {d.assignedTpName || '—'}
                                </td>
                                <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                                  {d.hanBaoCaoXuLy
                                    ? new Date(d.hanBaoCaoXuLy).toLocaleDateString('vi-VN')
                                    : '—'}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${d.trangThai === 'HOAN_THANH'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : d.trangThai === 'QUA_HAN'
                                        ? 'bg-rose-100 text-rose-800'
                                        : d.trangThai === 'CHO_VT_DUYET'
                                          ? 'bg-purple-100 text-purple-800'
                                          : 'bg-blue-100 text-blue-800'
                                      }`}
                                  >
                                    {d.trangThai === 'HOAN_THANH'
                                      ? 'Xong'
                                      : d.trangThai === 'QUA_HAN'
                                        ? 'Quá hạn'
                                        : d.trangThai === 'CHO_VT_DUYET'
                                          ? 'Chờ duyệt'
                                          : 'Đang xử lý'}
                                  </span>
                                </td>
                                <td className="py-3 px-3">
                                  <div className="flex items-center justify-center gap-1.5">
                                    {/* Nút giao PVT */}
                                    <button
                                      onClick={() => {
                                        setDispatchToAssign(d);
                                        setIsAssignModalOpen(true);
                                      }}
                                      className="px-2.5 py-1 text-[10px] font-bold text-white rounded-lg transition cursor-pointer active:scale-95"
                                      style={{ backgroundColor: '#B71C1C' }}
                                    >
                                      {d.assignedPvtId ? 'Đổi PVT' : 'Giao PVT'}
                                    </button>

                                    {/* Nút giao TP trực tiếp */}
                                    <button
                                      onClick={() => {
                                        setDispatchToAssign(d);
                                        setIsAssignTpDirectOpen(true);
                                      }}
                                      className="px-2.5 py-1 text-[10px] font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition cursor-pointer active:scale-95"
                                    >
                                      {d.assignedTpId ? 'Đổi TP' : 'Giao TP'}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

            {/* TAB: TẠO CÔNG VĂN */}
            {activeSidebarTab === 'action-create' && (
              <div className="bg-white rounded-3xl shadow-xs border border-slate-200 p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-lg font-black text-slate-900 mb-2">
                  Tạo công văn mới
                </h2>
                <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
                  Nhấn nút bên dưới để mở form tạo công văn. Sau khi tạo xong, bạn có thể
                  giao ngay cho Phó Viện trưởng.
                </p>
                <button
                  onClick={() => { setDispatchToEdit(null); setIsAddEditModalOpen(true); }}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white rounded-xl shadow-md transition cursor-pointer active:scale-95"
                  style={{ backgroundColor: '#B71C1C' }}
                >
                  <Plus className="w-4 h-4" />
                  Mở form tạo công văn
                </button>
              </div>
            )}

          </div>
        </div>
      </main>
      {/* Modal giao TP trực tiếp */}
      <AssignTpModal
        isOpen={isAssignTpDirectOpen}
        onClose={() => setIsAssignTpDirectOpen(false)}
        dispatch={dispatchToAssign}
        tpList={allUsers.filter(u => u.role === 'TRUONG_PHONG')}
        currentPvt={null}
        onAssign={async data => {
          if (!dispatchToAssign) return;
          try {
            const res = await apiClient.assignToTps(dispatchToAssign.id, {
              tps: [{
                tpId: data.tpId,
                tpName: data.tpName,
                roomCode: allUsers.find(u => u.id === data.tpId)?.roomCode || '',
                isPrimary: true,
              }],
              pvtChiDao: data.pvtChiDao || undefined,
              hanBaoCaoXuLy: data.hanBaoCaoXuLy || undefined,
            });
            if (res) {
              showToast(`Đã giao trực tiếp cho ${data.tpName}`);
              setIsAssignTpDirectOpen(false);
              setDispatchToAssign(null);
              reload();
            } else {
              showToast('Không thể giao TP', 'error');
            }
          } catch (err: any) {
            showToast(err.message || 'Lỗi', 'error');
          }
        }}
      />
      {/* MODALS */}
      <AssignPvtModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        dispatch={dispatchToAssign}
        pvtList={pvtList}
        onAssign={async data => {
          if (!dispatchToAssign) return;
          const targetPvt = pvtList.find(p => p.id === data.pvtId);
          const updated = await apiClient.assignToPvts(dispatchToAssign.id, {
            pvts: [{
              pvtId: data.pvtId,
              pvtName: data.pvtName,
              roomCode: targetPvt?.roomCode || '',
              isPrimary: true,
            }],
            vtChiDao: data.vtChiDao,
            hanBaoCaoXuLy: data.hanBaoCaoXuLy,
            mucDoKhan: data.mucDoKhan,
          });
          if (updated) {
            showToast(`Đã giao công văn ${updated.soCongVan} cho ${data.pvtName}`);
            reload();
          }
        }}
      />

      <DispatchModal
        isOpen={isAddEditModalOpen}
        onClose={() => {
          setIsAddEditModalOpen(false);
          reload();
        }}
        dispatchToEdit={dispatchToEdit}
        columns={DEFAULT_COLUMNS}
        onSave={async (formData: any) => {
          try {
            // Tách danh sách file đính kèm ra khỏi formData
            const { __attachments, ...dispatchData } = formData;

            if (dispatchToEdit) {
              // ===== SỬA CÔNG VIỆC =====
              const updated = await apiClient.updateDispatch(dispatchToEdit.id, dispatchData);
              if (updated) {
                showToast('Đã cập nhật công việc');
                reload();
              } else {
                showToast('Lỗi cập nhật', 'error');
              }
            } else {
              // ===== TẠO CÔNG VIỆC MỚI =====
              const created = await apiClient.createDispatch(dispatchData);
              if (!created) {
                showToast('Lỗi tạo công việc', 'error');
                return;
              }

              // Upload từng file đính kèm (nếu có)
              const fileList = (__attachments || []) as any[];
              if (fileList.length > 0) {
                let uploadedCount = 0;
                for (const fileItem of fileList) {
                  // fileItem có thể chứa File object (chưa upload) hoặc đã có id
                  if (fileItem.file instanceof File) {
                    const res = await apiClient.uploadAttachment(
                      created.id,
                      fileItem.file,
                      fileItem.fileCategory || 'ORIGINAL'
                    );
                    if (res.success) uploadedCount++;
                  }
                }
                if (uploadedCount > 0) {
                  showToast(
                    `Đã tạo công việc và upload ${uploadedCount} file`,
                    'success'
                  );
                } else {
                  showToast('Đã tạo công việc mới', 'success');
                }
              } else {
                showToast('Đã tạo công việc mới', 'success');
              }
              reload();
            }
          } catch (err: any) {
            showToast(err.message || 'Lỗi', 'error');
            throw err;
          }
        }}
      />

      <DispatchDetailDrawer
        dispatch={detailDispatch}
        onClose={() => setDetailDispatch(null)}
        columns={DEFAULT_COLUMNS}
        onUpdate={(id, updates) => {
          apiClient.updateDispatch(id, updates);
          reload();
        }}
      />

      <VtPvtDetailDrawer
        pvtStat={pvtDetailStat}
        allDispatches={dispatches}
        onClose={() => setPvtDetailStat(null)}
        onViewDispatch={d => {
          setPvtDetailStat(null);
          setDetailDispatch(d);
        }}
      />

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-fadeIn">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold border ${toast.type === 'success'
              ? 'bg-slate-900 text-white border-slate-700'
              : toast.type === 'error'
                ? 'bg-rose-900 text-white border-rose-700'
                : 'bg-amber-900 text-white border-amber-700'
              }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VienTruongDashboard;```

## 6. TỔNG KẾT

### Tài khoản mặc định

| Role | Username | Password | URL |
| :--- | :--- | :--- | :--- |
| Admin | admin | admin123 | /admin |
| Viện trưởng | vt | vt123 | /vt |
| PVT1-12 | pvt1...pvt12 | pvt123 | /pvt1.../pvt12 |
| TP1-12 | tp1...tp12 | tp123 | /tp1.../tp12 |

### Ports

| Service | Port |
| :--- | :--- |
| Frontend | 5173 |
| Backend | 3000 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| Adminer | 8080 |

---
**File generated by export-project.sh**
