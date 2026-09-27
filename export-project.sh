#!/bin/bash
# ============================================================
# EXPORT ALL — Xuất toàn bộ dự án cho AI đọc
# Tạo 2 file:
#   1. project_full_<timestamp>.md    — đầy đủ, có cấu trúc
#   2. project_full_<timestamp>.txt   — chỉ code, dễ đọc
# ============================================================

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_DIR="${PROJECT_ROOT}/exports"
MD_FILE="${OUTPUT_DIR}/project_full_${TIMESTAMP}.md"
TXT_FILE="${OUTPUT_DIR}/project_full_${TIMESTAMP}.txt"

mkdir -p "$OUTPUT_DIR"

# ═══════════════════════════════════════════════════════════
# CẤU HÌNH — Bỏ qua gì, lấy gì
# ═══════════════════════════════════════════════════════════
IGNORE_DIRS=(
  "node_modules"
  ".git"
  "dist"
  "build"
  ".next"
  ".vite"
  "coverage"
  ".cache"
  "tmp"
  "temp"
  ".idea"
  ".vscode"
  "uploads"
  "exports"
  ".turbo"
  "logs"
  "certs"
)

IGNORE_FILES=(
  ".DS_Store"
  "Thumbs.db"
  "package-lock.json"
  "yarn.lock"
  "pnpm-lock.yaml"
  ".env"
  ".env.local"
  ".env.production"
  ".env.development"
)

INCLUDE_EXTS=(
  "js" "jsx" "ts" "tsx" "mjs" "cjs"
  "json"
  "css" "scss" "sass" "less"
  "html" "htm"
  "md" "mdx"
  "prisma"
  "sql"
  "yml" "yaml"
  "sh" "bash"
  "env.example"
  "dockerfile"
  "gitignore"
  "txt"
)

# ═══════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════
should_skip_dir() {
  for skip in "${IGNORE_DIRS[@]}"; do
    [[ "$1" == "$skip" ]] && return 0
  done
  return 1
}

should_skip_file() {
  for skip in "${IGNORE_FILES[@]}"; do
    [[ "$1" == $skip ]] && return 0
  done
  return 1
}

should_include_ext() {
  local name="$1"
  local ext="${name##*.}"

  # File không extension
  if [[ "$name" == "$ext" ]]; then
    case "$name" in
      Dockerfile|dockerfile|Makefile|makefile|.env.example|.gitignore|.dockerignore)
        return 0
        ;;
      *) return 1 ;;
    esac
  fi

  for allowed in "${INCLUDE_EXTS[@]}"; do
    [[ "$ext" == "$allowed" ]] && return 0
  done
  return 1
}

detect_lang() {
  local ext="${1##*.}"
  case "$ext" in
    js)     echo "javascript" ;;
    jsx)    echo "jsx" ;;
    ts)     echo "typescript" ;;
    tsx)    echo "tsx" ;;
    mjs)    echo "javascript" ;;
    cjs)    echo "javascript" ;;
    json)   echo "json" ;;
    css)    echo "css" ;;
    scss)   echo "scss" ;;
    less)   echo "less" ;;
    html)   echo "html" ;;
    htm)    echo "html" ;;
    md)     echo "markdown" ;;
    prisma) echo "prisma" ;;
    sql)    echo "sql" ;;
    yml|yaml) echo "yaml" ;;
    sh|bash) echo "bash" ;;
    env)    echo "ini" ;;
    txt)    echo "text" ;;
    *)      echo "text" ;;
  esac
}

# ═══════════════════════════════════════════════════════════
# HEADER
# ═══════════════════════════════════════════════════════════
echo "═══════════════════════════════════════════════════════════"
echo "  📦 EXPORT PROJECT — VKS-QLCV-v3"
echo "═══════════════════════════════════════════════════════════"
echo ""

# ═══════════════════════════════════════════════════════════
# FILE 1: MARKDOWN — có cấu trúc, để AI đọc + người đọc
# ═══════════════════════════════════════════════════════════
{
  echo "# DỰ ÁN: VKS-QLCV-v3 — Toàn bộ source code"
  echo ""
  echo "**Ngày xuất:** $(date +'%Y-%m-%d %H:%M:%S')"
  echo "**Đường dẫn gốc:** ${PROJECT_ROOT}"
  echo ""
  echo "> File này chứa TOÀN BỘ source code của dự án để AI/human đọc."
  echo "> Bao gồm: cấu trúc thư mục, cấu hình, backend, frontend."
  echo ""
  echo "---"
  echo ""
  echo "## 1. CẤU TRÚC THƯ MỤC"
  echo ""
  echo '```'
  echo "."
} > "$MD_FILE"

# In cây thư mục
print_tree() {
  local dir="$1"
  local prefix="$2"
  local items=()
  while IFS= read -r -d '' item; do
    items+=("$item")
  done < <(find "$dir" -maxdepth 1 -mindepth 1 -print0 | sort -z)

  local count=${#items[@]}
  local i=0
  for item in "${items[@]}"; do
    i=$((i + 1))
    local name=$(basename "$item")
    local is_last=0
    [[ $i -eq $count ]] && is_last=1
    local connector="├── "
    [[ $is_last -eq 1 ]] && connector="└── "

    if [[ -d "$item" ]]; then
      should_skip_dir "$name" && continue
      echo "${prefix}${connector}${name}/" >> "$MD_FILE"
      local new_prefix="${prefix}"
      [[ $is_last -eq 0 ]] && new_prefix="${prefix}│   " || new_prefix="${prefix}    "
      print_tree "$item" "$new_prefix"
    else
      should_skip_file "$name" && continue
      echo "${prefix}${connector}${name}" >> "$MD_FILE"
    fi
  done
}
print_tree "$PROJECT_ROOT" ""

{
  echo '```'
  echo ""
  echo "---"
  echo ""
  echo "## 2. NỘI DUNG SOURCE CODE"
  echo ""
} >> "$MD_FILE"

# ═══════════════════════════════════════════════════════════
# FILE 2: TXT — chỉ code, sạch, dễ đọc
# ═══════════════════════════════════════════════════════════
{
  echo "╔══════════════════════════════════════════════════════════╗"
  echo "║  DỰ ÁN: VKS-QLCV-v3                                     ║"
  echo "║  Xuất ngày: $(date +'%Y-%m-%d %H:%M:%S')                       ║"
  echo "╚══════════════════════════════════════════════════════════╝"
  echo ""
  echo "File này chứa TOÀN BỘ source code của dự án."
  echo "Dùng để gửi AI phân tích hoặc lưu trữ."
  echo ""
  echo "════════════════════════════════════════════════════════════"
  echo "  CẤU TRÚC THƯ MỤC"
  echo "════════════════════════════════════════════════════════════"
} > "$TXT_FILE"

# Cây thư mục (dạng text thuần)
print_tree_txt() {
  local dir="$1"
  local prefix="$2"
  local items=()
  while IFS= read -r -d '' item; do
    items+=("$item")
  done < <(find "$dir" -maxdepth 1 -mindepth 1 -print0 | sort -z)

  local count=${#items[@]}
  local i=0
  for item in "${items[@]}"; do
    i=$((i + 1))
    local name=$(basename "$item")
    local is_last=0
    [[ $i -eq $count ]] && is_last=1
    local connector="├── "
    [[ $is_last -eq 1 ]] && connector="└── "

    if [[ -d "$item" ]]; then
      should_skip_dir "$name" && continue
      echo "${prefix}${connector}${name}/" >> "$TXT_FILE"
      local new_prefix="${prefix}"
      [[ $is_last -eq 0 ]] && new_prefix="${prefix}│   " || new_prefix="${prefix}    "
      print_tree_txt "$item" "$new_prefix"
    else
      should_skip_file "$name" && continue
      echo "${prefix}${connector}${name}" >> "$TXT_FILE"
    fi
  done
}
print_tree_txt "$PROJECT_ROOT" ""

{
  echo ""
  echo ""
  echo "════════════════════════════════════════════════════════════"
  echo "  TOÀN BỘ SOURCE CODE"
  echo "════════════════════════════════════════════════════════════"
  echo ""
} >> "$TXT_FILE"

# ═══════════════════════════════════════════════════════════
# EXPORT TỪNG FILE
# ═══════════════════════════════════════════════════════════
FILE_COUNT=0

export_file() {
  local file="$1"
  local rel_path="${file#$PROJECT_ROOT/}"
  local lang=$(detect_lang "$file")

  FILE_COUNT=$((FILE_COUNT + 1))

  # Console log
  echo "  📄 [$FILE_COUNT] $rel_path"

  # ═══ GHI VÀO .MD ═══
  {
    echo "### FILE: ${rel_path}"
    echo ""
    echo "\`\`\`${lang}"
    cat "$file" 2>/dev/null || echo "[Không đọc được file]"
    echo "\`\`\`"
    echo ""
    echo "---"
    echo ""
  } >> "$MD_FILE"

  # ═══ GHI VÀO .TXT ═══
  {
    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo "FILE: ${rel_path}"
    echo "════════════════════════════════════════════════════════════"
    echo ""
    cat "$file" 2>/dev/null || echo "[Không đọc được file]"
    echo ""
    echo ""
  } >> "$TXT_FILE"
}

export_dir() {
  local dir="$1"
  while IFS= read -r -d '' item; do
    local name=$(basename "$item")

    if [[ -d "$item" ]]; then
      should_skip_dir "$name" && continue
      export_dir "$item"
    else
      should_skip_file "$name" && continue
      should_include_ext "$name" && export_file "$item"
    fi
  done < <(find "$dir" -maxdepth 1 -mindepth 1 -print0 | sort -z)
}

echo ""
echo "Đang export file..."
echo ""

# Export toàn bộ, nhưng ưu tiên cấu trúc rõ ràng:
# 1. Root files (docker-compose, readme...)
# 2. Backend
# 3. Frontend
# 4. init-db

# Root files
export_dir "$PROJECT_ROOT" 2>/dev/null || true

# ═══════════════════════════════════════════════════════════
# FOOTER
# ═══════════════════════════════════════════════════════════
{
  echo "---"
  echo ""
  echo "## TỔNG KẾT"
  echo ""
  echo "- **Tổng số file đã export:** ${FILE_COUNT}"
  echo "- **Ngày xuất:** $(date +'%Y-%m-%d %H:%M:%S')"
  echo ""
  echo "**File generated by export-all.sh**"
} >> "$MD_FILE"

{
  echo "════════════════════════════════════════════════════════════"
  echo "  TỔNG KẾT"
  echo "════════════════════════════════════════════════════════════"
  echo ""
  echo "Tổng số file đã export: ${FILE_COUNT}"
  echo "Ngày xuất: $(date +'%Y-%m-%d %H:%M:%S')"
  echo ""
  echo "File generated by export-all.sh"
} >> "$TXT_FILE"

# ═══════════════════════════════════════════════════════════
# KẾT QUẢ
# ═══════════════════════════════════════════════════════════
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ EXPORT HOÀN TẤT"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📄 File Markdown (cho AI/human đọc):"
echo "   $MD_FILE"
echo "   Dòng:   $(wc -l < "$MD_FILE")"
echo "   Size:   $(du -h "$MD_FILE" | cut -f1)"
echo ""
echo "📄 File TXT (code thuần):"
echo "   $TXT_FILE"
echo "   Dòng:   $(wc -l < "$TXT_FILE")"
echo "   Size:   $(du -h "$TXT_FILE" | cut -f1)"
echo ""
echo "📊 Tổng số file code: ${FILE_COUNT}"
echo ""
echo "═══════════════════════════════════════════════════════════"