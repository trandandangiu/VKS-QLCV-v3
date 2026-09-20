// src/components/vt/VtSidebar.tsx
import React from 'react';
import {
  LayoutDashboard,
  PieChart,
  Calendar,
  Trophy,
  FileText,
  Plus,
  Clock,
  Users,
  CheckCircle2,
  ChevronRight,
  Building,
} from 'lucide-react';

export type VtSidebarTab =
  // BÁO CÁO
  | 'report-overview'
  | 'report-by-dept'
  | 'report-by-time'
  | 'report-leaderboard'
  // THAO TÁC
  | 'action-all'
  | 'action-create'
  | 'action-pending'
  | 'action-assigned'
  | 'action-approve';

interface VtSidebarProps {
  activeTab: VtSidebarTab;
  onChangeTab: (tab: VtSidebarTab) => void;
  pendingCount: number;    // Chờ phân công PVT
  approveCount: number;    // Chờ phê duyệt
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const VtSidebar: React.FC<VtSidebarProps> = ({
  activeTab,
  onChangeTab,
  pendingCount,
  approveCount,
  isMobileOpen,
  onCloseMobile,
}) => {
  const handleClick = (tab: VtSidebarTab) => {
    onChangeTab(tab);
    onCloseMobile();
  };

  return (
    <aside
      className={`w-full lg:w-72 shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${isMobileOpen ? 'block' : 'hidden lg:block'
        }`}
    >
      {/* Header đỏ */}
      <div
        className="px-4 py-3.5 text-white"
        style={{
          backgroundColor: '#B71C1C',
          backgroundImage: 'linear-gradient(135deg, #B71C1C 0%, #7F0E0E 100%)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/20 border border-white/25 flex items-center justify-center">
            <Building className="w-4 h-4 text-amber-300" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold tracking-widest uppercase text-amber-200">
              Viện trưởng
            </div>
            <div className="text-xs font-black text-white truncate">
              BÀN LÀM VIỆC
            </div>
          </div>
        </div>
      </div>

      {/* MENU */}
      <nav className="p-3 space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto">
        {/* ═══ SECTION 1: BÁO CÁO ═══ */}
        <div>
          <div className="px-3 py-1.5 flex items-center gap-2">
            <span className="w-1 h-3 rounded-full" style={{ backgroundColor: '#B71C1C' }} />
            <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
              📊 Báo cáo
            </span>
          </div>

          <div className="space-y-0.5">
            <MenuItem
              icon={LayoutDashboard}
              label="Tổng quan"
              isActive={activeTab === 'report-overview'}
              onClick={() => handleClick('report-overview')}
            />
            <MenuItem
              icon={PieChart}
              label="Theo phòng ban"
              isActive={activeTab === 'report-by-dept'}
              onClick={() => handleClick('report-by-dept')}
            />
            <MenuItem
              icon={Calendar}
              label="Theo thời gian"
              isActive={activeTab === 'report-by-time'}
              onClick={() => handleClick('report-by-time')}
            />
            <MenuItem
              icon={Trophy}
              label="Xếp hạng PVT"
              isActive={activeTab === 'report-leaderboard'}
              onClick={() => handleClick('report-leaderboard')}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100" />

        {/* ═══ SECTION 2: THAO TÁC NGHIỆP VỤ ═══ */}
        <div>
          <div className="px-3 py-1.5 flex items-center gap-2">
            <span className="w-1 h-3 rounded-full" style={{ backgroundColor: '#FFD700' }} />
            <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
              ⚙️ Thao tác nghiệp vụ
            </span>
          </div>

          <div className="space-y-0.5">
            <MenuItem
              icon={FileText}
              label="Tất cả công văn"
              isActive={activeTab === 'action-all'}
              onClick={() => handleClick('action-all')}
            />
            <MenuItem
              icon={Plus}
              label="Tạo công văn mới"
              isActive={activeTab === 'action-create'}
              onClick={() => handleClick('action-create')}
              accent
            />
            <MenuItem
              icon={Clock}
              label="Chờ phân công PVT"
              isActive={activeTab === 'action-pending'}
              onClick={() => handleClick('action-pending')}
              badge={pendingCount}
              badgeColor="amber"
            />
            <MenuItem
              icon={Users}
              label="Đã phân công"
              isActive={activeTab === 'action-assigned'}
              onClick={() => handleClick('action-assigned')}
            />
            <MenuItem
              icon={CheckCircle2}
              label="Chờ phê duyệt"
              isActive={activeTab === 'action-approve'}
              onClick={() => handleClick('action-approve')}
              badge={approveCount}
              badgeColor="purple"
            />
          </div>
        </div>
      </nav>
    </aside>
  );
};

// ============================================
// MENU ITEM
// ============================================
interface MenuItemProps {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
  badge?: number;
  badgeColor?: 'amber' | 'purple' | 'red';
  accent?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon: Icon,
  label,
  isActive,
  onClick,
  badge,
  badgeColor = 'amber',
  accent,
}) => {
  const badgeClasses = {
    amber: 'bg-amber-100 text-amber-800 border-amber-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    red: 'bg-red-100 text-red-800 border-red-200',
  }[badgeColor];

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs transition cursor-pointer group ${
        isActive
          ? 'bg-red-50 text-red-900 font-bold border shadow-2xs'
          : 'text-slate-700 hover:bg-slate-50 font-medium border border-transparent'
        }`}
      style={
        isActive
          ? { borderColor: '#B71C1C', backgroundColor: '#FEF2F2' }
          : undefined
      }
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
            isActive
              ? 'text-white border-transparent'
              : accent
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-slate-50 text-slate-600 border-slate-200 group-hover:bg-white'
            }`}
          style={isActive ? { backgroundColor: '#B71C1C' } : undefined}
        >
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className="truncate font-medium">{label}</span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {badge !== undefined && badge > 0 && (
          <span
            className={`min-w-[20px] h-5 px-1.5 rounded-full border text-[10px] font-black flex items-center justify-center ${badgeClasses}`}
          >
            {badge}
          </span>
        )}
        {isActive && <ChevronRight className="w-3 h-3 text-red-500" />}
      </div>
    </button>
  );
};

export default VtSidebar;