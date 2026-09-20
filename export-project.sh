#!/bin/bash
# export-project.sh — Xuất toàn bộ thông tin dự án

OUTPUT="project-info.md"
PROJECT_NAME="QLCV VKSND TP.HCM"

echo "# DỰ ÁN: $PROJECT_NAME" > $OUTPUT
echo "" >> $OUTPUT
echo "**Ngày xuất:** $(date '+%Y-%m-%d %H:%M:%S')" >> $OUTPUT
echo "" >> $OUTPUT
echo "---" >> $OUTPUT
echo "" >> $OUTPUT

# ============================================
# 1. CẤU TRÚC THƯ MỤC
# ============================================
echo "## 1. CẤU TRÚC THƯ MỤC" >> $OUTPUT
echo "" >> $OUTPUT
echo '```' >> $OUTPUT
tree -L 4 -I 'node_modules|.git|dist|build|.vite|uploads|.next' 2>/dev/null || find . -type d -not -path '*/node_modules/*' -not -path '*/.git/*' | head -100 >> $OUTPUT
echo '```' >> $OUTPUT
echo "" >> $OUTPUT

# ============================================
# 2. CẤU HÌNH
# ============================================
echo "## 2. CẤU HÌNH" >> $OUTPUT
echo "" >> $OUTPUT

echo "### 2.1. docker-compose.yml" >> $OUTPUT
echo '```yaml' >> $OUTPUT
cat docker-compose.yml 2>/dev/null >> $OUTPUT
echo '```' >> $OUTPUT
echo "" >> $OUTPUT

echo "### 2.2. backend/package.json" >> $OUTPUT
echo '```json' >> $OUTPUT
cat backend/package.json 2>/dev/null >> $OUTPUT
echo '```' >> $OUTPUT
echo "" >> $OUTPUT

echo "### 2.3. frontend/package.json" >> $OUTPUT
echo '```json' >> $OUTPUT
cat frontend/package.json 2>/dev/null >> $OUTPUT
echo '```' >> $OUTPUT
echo "" >> $OUTPUT

echo "### 2.4. frontend/vite.config.ts" >> $OUTPUT
echo '```typescript' >> $OUTPUT
cat frontend/vite.config.ts 2>/dev/null >> $OUTPUT
echo '```' >> $OUTPUT
echo "" >> $OUTPUT

# ============================================
# 3. DATABASE
# ============================================
echo "## 3. DATABASE" >> $OUTPUT
echo "" >> $OUTPUT
echo "### 3.1. Prisma Schema" >> $OUTPUT
echo '```prisma' >> $OUTPUT
cat backend/prisma/schema.prisma 2>/dev/null >> $OUTPUT
echo '```' >> $OUTPUT
echo "" >> $OUTPUT

echo "### 3.2. Database State" >> $OUTPUT
echo '```' >> $OUTPUT
docker exec qlcv_postgres psql -U qlcv_app -d qlcv_db -c "\dt" >> $OUTPUT 2>/dev/null
echo "" >> $OUTPUT
docker exec qlcv_postgres psql -U qlcv_app -d qlcv_db -c "SELECT COUNT(*) AS users FROM users;" >> $OUTPUT 2>/dev/null
docker exec qlcv_postgres psql -U qlcv_app -d qlcv_db -c "SELECT COUNT(*) AS dispatches FROM dispatches;" >> $OUTPUT 2>/dev/null
docker exec qlcv_postgres psql -U qlcv_app -d qlcv_db -c "SELECT id, code, name FROM roles;" >> $OUTPUT 2>/dev/null
echo '```' >> $OUTPUT
echo "" >> $OUTPUT

# ============================================
# 4. BACKEND SOURCE
# ============================================
echo "## 4. BACKEND SOURCE CODE" >> $OUTPUT
echo "" >> $OUTPUT

# Server
echo "### 4.1. backend/src/server.js" >> $OUTPUT
echo '```javascript' >> $OUTPUT
cat backend/src/server.js 2>/dev/null >> $OUTPUT
echo '```' >> $OUTPUT
echo "" >> $OUTPUT

# Services
echo "### 4.2. Services" >> $OUTPUT
echo "" >> $OUTPUT
for file in backend/src/services/*.js; do
  if [ -f "$file" ]; then
    echo "#### FILE: $file" >> $OUTPUT
    echo '```javascript' >> $OUTPUT
    cat "$file" >> $OUTPUT
    echo '```' >> $OUTPUT
    echo "" >> $OUTPUT
  fi
done

# Controllers
echo "### 4.3. Controllers" >> $OUTPUT
echo "" >> $OUTPUT
for file in backend/src/controllers/*.js; do
  if [ -f "$file" ]; then
    echo "#### FILE: $file" >> $OUTPUT
    echo '```javascript' >> $OUTPUT
    cat "$file" >> $OUTPUT
    echo '```' >> $OUTPUT
    echo "" >> $OUTPUT
  fi
done

# Routes
echo "### 4.4. Routes" >> $OUTPUT
echo "" >> $OUTPUT
for file in backend/src/routes/*.js; do
  if [ -f "$file" ]; then
    echo "#### FILE: $file" >> $OUTPUT
    echo '```javascript' >> $OUTPUT
    cat "$file" >> $OUTPUT
    echo '```' >> $OUTPUT
    echo "" >> $OUTPUT
  fi
done

# Middlewares
echo "### 4.5. Middlewares" >> $OUTPUT
echo "" >> $OUTPUT
for file in backend/src/middlewares/*.js; do
  if [ -f "$file" ]; then
    echo "#### FILE: $file" >> $OUTPUT
    echo '```javascript' >> $OUTPUT
    cat "$file" >> $OUTPUT
    echo '```' >> $OUTPUT
    echo "" >> $OUTPUT
  fi
done

# ============================================
# 5. FRONTEND SOURCE
# ============================================
echo "## 5. FRONTEND SOURCE CODE" >> $OUTPUT
echo "" >> $OUTPUT

# Main files
for file in \
  frontend/src/main.tsx \
  frontend/src/App.tsx \
  frontend/src/context/AuthContext.tsx \
  frontend/src/services/apiClient.ts \
  frontend/src/components/ProtectedRoute.tsx
do
  if [ -f "$file" ]; then
    echo "### FILE: $file" >> $OUTPUT
    echo '```typescript' >> $OUTPUT
    cat "$file" >> $OUTPUT
    echo '```' >> $OUTPUT
    echo "" >> $OUTPUT
  fi
done

# Pages
echo "### 5.x. Pages" >> $OUTPUT
echo "" >> $OUTPUT
for file in frontend/src/pages/*.tsx; do
  if [ -f "$file" ]; then
    echo "#### FILE: $file" >> $OUTPUT
    echo '```typescript' >> $OUTPUT
    cat "$file" >> $OUTPUT
    echo '```' >> $OUTPUT
    echo "" >> $OUTPUT
  fi
done

# ============================================
# 6. TỔNG KẾT
# ============================================
echo "## 6. TỔNG KẾT" >> $OUTPUT
echo "" >> $OUTPUT
echo "### Tài khoản mặc định" >> $OUTPUT
echo "" >> $OUTPUT
echo "| Role | Username | Password | URL |" >> $OUTPUT
echo "| :--- | :--- | :--- | :--- |" >> $OUTPUT
echo "| Admin | admin | admin123 | /admin |" >> $OUTPUT
echo "| Viện trưởng | vt | vt123 | /vt |" >> $OUTPUT
echo "| PVT1-12 | pvt1...pvt12 | pvt123 | /pvt1.../pvt12 |" >> $OUTPUT
echo "| TP1-12 | tp1...tp12 | tp123 | /tp1.../tp12 |" >> $OUTPUT
echo "" >> $OUTPUT

echo "### Ports" >> $OUTPUT
echo "" >> $OUTPUT
echo "| Service | Port |" >> $OUTPUT
echo "| :--- | :--- |" >> $OUTPUT
echo "| Frontend | 5173 |" >> $OUTPUT
echo "| Backend | 3000 |" >> $OUTPUT
echo "| PostgreSQL | 5432 |" >> $OUTPUT
echo "| Redis | 6379 |" >> $OUTPUT
echo "| Adminer | 8080 |" >> $OUTPUT
echo "" >> $OUTPUT

echo "---" >> $OUTPUT
echo "**File generated by export-project.sh**" >> $OUTPUT

echo ""
echo "✅ Đã tạo file: $OUTPUT"
echo "📊 Kích thước: $(wc -l < $OUTPUT) dòng, $(du -h $OUTPUT | cut -f1)"
echo "📁 Vị trí: $(pwd)/$OUTPUT"
