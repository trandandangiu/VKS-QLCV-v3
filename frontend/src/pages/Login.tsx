import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff,
  AlertCircle,
  ShieldCheck,
  KeyRound,
  QrCode,
  Eye as EyeIcon
} from 'lucide-react';
import { verifyGoogleAuthCode } from '../utils/totp';
import { GoogleAuthModal } from '../components/GoogleAuthModal';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [totpInput, setTotpInput] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Google Authenticator Modal State
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 1. Verify Google Authenticator TOTP Code
    if (!totpInput.trim()) {
      setError('Vui lòng nhập mã xác thực 6 số từ Google Authenticator');
      return;
    }

    const isValidTotp = await verifyGoogleAuthCode(totpInput);
    if (!isValidTotp) {
      setError('Mã Google Authenticator không chính xác hoặc đã hết hạn 30 giây. Vui lòng kiểm tra lại mã trên ứng dụng.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(username, password);
      if (res.success) {
        redirectToRole(username.toLowerCase());
      } else {
        setError(res.message || 'Tên đăng nhập hoặc mật khẩu không đúng');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const redirectToRole = (uname: string) => {
    if (uname === 'admin') {
      navigate('/admin');
    } else if (uname === 'vt' || uname.includes('vientruong')) {
      navigate('/vt');
    } else if (uname.startsWith('pvt')) {
      navigate(`/${uname}`);
    } else if (uname.startsWith('tp')) {
      navigate(`/${uname}`);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-800 selection:bg-red-600 selection:text-white">
      {/* Main Container with uploaded background.jpg (Header removed as requested) */}
      <main 
        className="flex-1 w-full min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/background.jpg)',
          backgroundColor: '#9A1010'
        }}
      >
        {/* Subtle Ambient Vignette Overlay for Depth & High Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-red-950/45 via-black/15 to-black/35 pointer-events-none" />

        {/* Top-Right Floating Public Board Link */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
          <Link
            to="/"
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-black/40 hover:bg-black/60 text-white transition-all backdrop-blur-md border border-white/20 shadow-md hover:scale-105"
          >
            <EyeIcon className="w-3.5 h-3.5 text-amber-300" />
            <span>Xem Bảng Công Khai</span>
          </Link>
        </div>

        {/* 2-Column Portal Layout */}
        <div className="relative z-10 w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Official Emblem & High-Impact Title */}
          <div className="lg:col-span-7 text-center flex flex-col items-center justify-center py-4">
            {/* Big Official Emblem with Golden Halo */}
            <div className="relative mb-6 group">
              <div className="absolute -inset-5 bg-amber-400/30 rounded-full blur-2xl opacity-90 group-hover:opacity-100 transition-opacity" />
              <img
                src="/logo.svg"
                alt="Huy hiệu VKSND"
                className="relative w-36 h-36 sm:w-44 sm:h-44 object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.35)] mx-auto transition-transform duration-300 hover:scale-105"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Title with updated H2: Hệ thống báo cáo tiến độ */}
            <div className="bg-black/35 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 shadow-xl max-w-xl">
              <h2 className="text-lg sm:text-2xl lg:text-3xl font-black uppercase tracking-wider text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-tight">
                Hệ thống báo cáo tiến độ
              </h2>
              <h3 className="text-sm sm:text-base lg:text-lg font-bold uppercase tracking-wide text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mt-2">
                VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH
              </h3>
            </div>
          </div>

          {/* Right Column: Portal Login Card */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/80 overflow-hidden p-6 sm:p-8">
              
              {/* Card Top Logo */}
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

              {/* Error Notification */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2 font-medium shadow-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  <span className="leading-snug">{error}</span>
                </div>
              )}

              <form onSubmit={handleFormLogin} className="space-y-4">
                
                {/* 1. Tên truy cập */}
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

                {/* 2. Mật khẩu */}
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

                {/* 3. Mã xác nhận */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <span>Mã xác thực</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    </label>
                  </div>

                  <div className="grid grid-cols-12 gap-2 items-center">
                    {/* Input Field for 6-digit Google Authenticator code */}
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

                    {/* Button to Scan Google Authenticator QR & Get Code */}
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

                {/* Primary Button: ĐĂNG NHẬP */}
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

      {/* Google Authenticator QR Code Setup & Scanner Modal */}
      <GoogleAuthModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        onSelectCode={(code) => setTotpInput(code)}
      />
    </div>
  );
};

export default Login;
