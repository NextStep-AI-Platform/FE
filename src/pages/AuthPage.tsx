import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, Check, ArrowLeft } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { useToast } from "../contexts/ToastContext";
import BrandName from "../components/BrandName";
import LogoMark from "../components/LogoMark";
import { PICTURE } from "../lib/picture";
import { ApiError } from "../lib/api/client";
import { USE_API } from "../lib/config";

type Tab = "login" | "register";

function getAuthErrorMessage(error: unknown): string {
	if (error instanceof ApiError) return error.message;
	return "Khong the ket noi den may chu. Vui long thu lai.";
}

export default function AuthPage() {
	const navigate = useNavigate();
	const location = useLocation();
	const requestedPath = (location.state as { from?: { pathname?: string; search?: string } } | null)?.from;
	const afterLogin = requestedPath?.pathname === '/payment'
		? `/payment${requestedPath.search ?? ''}` : '/dashboard';
	const { login, register, loginWithGoogleDemo, isAuthenticated } = useApp();
	const toast = useToast();
	const [tab, setTab] = useState<Tab>("login");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const [loginForm, setLoginForm] = useState({ email: "", password: "" });
	const [registerForm, setRegisterForm] = useState({
		name: "",
		email: "",
		password: "",
		confirmPassword: "",
		agreed: false,
	});

	const validateLogin = () => {
		const e: Record<string, string> = {};
		if (!loginForm.email.includes("@")) e.email = "Email không hợp lệ";
		if (loginForm.password.length < 6)
			e.password = "Mật khẩu tối thiểu 6 ký tự";
		return e;
	};

	const validateRegister = () => {
		const e: Record<string, string> = {};
		if (registerForm.name.length < 2) e.name = "Tên tối thiểu 2 ký tự";
		if (!registerForm.email.includes("@")) e.email = "Email không hợp lệ";
		if (registerForm.password.length < 8)
			e.password = "Mật khẩu tối thiểu 8 ký tự";
		if (registerForm.password !== registerForm.confirmPassword)
			e.confirmPassword = "Mật khẩu không khớp";
		if (!registerForm.agreed) e.agreed = "Vui lòng đồng ý với điều khoản";
		return e;
	};

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		const errs = validateLogin();
		if (Object.keys(errs).length > 0) {
			setErrors(errs);
			return;
		}
		setErrors({});
		setIsLoading(true);
		try {
			const ok = await login(loginForm.email, loginForm.password);
			if (ok) {
				toast.success("Đăng nhập thành công");
				navigate(afterLogin);
			} else {
				toast.error("Đăng nhập thất bại", "Email hoặc mật khẩu không đúng");
			}
		} catch (error) {
			toast.error("Dang nhap that bai", getAuthErrorMessage(error));
		} finally {
			setIsLoading(false);
		}
	};

	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault();
		const errs = validateRegister();
		if (Object.keys(errs).length > 0) {
			setErrors(errs);
			return;
		}
		setErrors({});
		setIsLoading(true);
		try {
			const ok = await register(
				registerForm.name,
				registerForm.email,
				registerForm.password,
			);
			if (ok) {
				if (USE_API) {
					toast.success("Dang ky thanh cong", "Tai khoan da duoc tao va dang nhap");
					navigate(afterLogin);
					return;
				}
				toast.success("Đăng ký thành công", "Vui lòng đăng nhập để tiếp tục");
				setTab("login");
				setLoginForm({
					email: registerForm.email.trim(),
					password: registerForm.password,
				});
			} else {
				toast.error("Đăng ký thất bại", "Email đã được sử dụng");
			}
		} catch (error) {
			toast.error("Dang ky that bai", getAuthErrorMessage(error));
		} finally {
			setIsLoading(false);
		}
	};

	const handleGoogleLogin = () => {
		setIsLoading(true);
		setTimeout(() => {
			const ok = loginWithGoogleDemo();
			setIsLoading(false);
			if (ok) {
				toast.success(
					"Đăng nhập thành công",
					"Demo Google — không cần mật khẩu",
				);
				navigate(afterLogin);
			} else {
				toast.error("Đăng nhập thất bại", "Không thể tạo phiên demo");
			}
		}, 600);
	};

	useEffect(() => {
		if (isAuthenticated) navigate(afterLogin, { replace: true });
	}, [isAuthenticated, navigate, afterLogin]);

	const inputClass = (field: string) =>
		`w-full bg-ns-page border rounded-lg px-4 py-3 text-ns-primary placeholder:text-ns-faint focus:outline-none transition-colors ${
			errors[field]
				? "border-red-500 focus:border-red-500"
				: "border-ns focus:border-blue-500"
		}`;

	return (
		<div className="min-h-screen bg-ns-page flex">
			{/* LEFT — Brand Panel */}
			<div
				className="hidden lg:flex lg:w-1/2 border-r border-ns flex-col items-center justify-center p-12 relative overflow-hidden bg-ns-card"
				style={{
					backgroundImage: `url(${PICTURE.authLanding})`,
					backgroundSize: "cover",
					backgroundPosition: "center",
				}}
			>
				<div className="absolute inset-0 bg-gradient-to-br from-[#0F172A]/88 via-[#1E293B]/82 to-[#0F172A]/90" />
				<div
					className="absolute inset-0 opacity-[0.07]"
					style={{
						backgroundImage:
							"linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)",
						backgroundSize: "40px 40px",
					}}
				/>
				<div className="relative z-10 text-center max-w-md">
					<div className="mx-auto mb-5 flex items-center justify-center">
						<LogoMark brandSize="xl" className="scale-110" />
					</div>
					<h1 className="mb-3 flex justify-center">
						<BrandName size="xl" />
					</h1>
					<p className="text-ns-muted text-lg mb-10">
						Khám phá con đường sự nghiệp phù hợp nhất với bạn
					</p>
					<div className="space-y-4 text-left mb-10">
						{[
							"Phân tích CV so với mô tả công việc",
							"3 lượt scan miễn phí mỗi tháng",
							"Xem quyền lợi và trạng thái thanh toán trên trang gói dịch vụ",
						].map((f) => (
							<div key={f} className="flex items-center gap-3">
								<div className="w-6 h-6 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0">
									<Check size={13} className="text-blue-400" />
								</div>
								<span className="text-ns-secondary text-sm">{f}</span>
							</div>
						))}
					</div>
					<div className="bg-ns-card/60 border border-ns rounded-2xl p-5">
						<p className="text-ns-muted text-sm">
							Bạn có thể bắt đầu với gói Free; không cần thanh toán.
						</p>
					</div>
				</div>
			</div>

			{/* RIGHT — Form Panel */}
			<div className="flex-1 lg:w-1/2 flex items-center justify-center p-6">
				<div className="w-full max-w-md">
					<Link
						to="/"
						className="mb-6 inline-flex items-center gap-2 text-ns-muted hover:text-ns-primary text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500"
					>
						<ArrowLeft size={16} aria-hidden="true" /> Trang chủ
					</Link>

					{/* Tab switcher */}
					<div className="flex bg-ns-card border border-ns rounded-xl p-1 mb-8">
						<button
							onClick={() => {
								setTab("login");
								setErrors({});
							}}
							className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
								tab === "login"
									? "bg-blue-600 text-white"
									: "text-ns-muted hover:text-ns-primary"
							}`}
						>
							Đăng nhập
						</button>
						<button
							onClick={() => {
								setTab("register");
								setErrors({});
							}}
							className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
								tab === "register"
									? "bg-blue-600 text-white"
									: "text-ns-muted hover:text-ns-primary"
							}`}
						>
							Đăng ký
						</button>
					</div>

					{/* LOGIN FORM */}
					{tab === "login" && (
						<div className="bg-ns-card border border-ns rounded-2xl p-8 animate-fade-in">
							<h2 className="font-heading font-bold text-ns-primary text-2xl mb-1">
								Chào mừng trở lại 👋
							</h2>
							<p className="text-ns-muted text-sm mb-7">
								Đăng nhập để tiếp tục hành trình sự nghiệp
							</p>

							<form onSubmit={handleLogin} className="space-y-5">
								<div>
									<label className="block text-ns-secondary text-sm font-medium mb-1.5">
										Email
									</label>
									<input
										type="email"
										className={inputClass("email")}
										placeholder="ten@email.com"
										value={loginForm.email}
										onChange={(e) =>
											setLoginForm((p) => ({ ...p, email: e.target.value }))
										}
									/>
									{errors.email && (
										<p className="text-red-400 text-xs mt-1">{errors.email}</p>
									)}
								</div>

								<div>
									<div className="flex items-center justify-between mb-1.5">
										<label className="text-ns-secondary text-sm font-medium">
											Mật khẩu
										</label>
										<button
											type="button"
											onClick={() => toast.info("Tính năng sắp ra mắt")}
											className="text-blue-400 text-xs hover:text-blue-300 cursor-pointer"
										>
											Quên mật khẩu?
										</button>
									</div>
									<div className="relative">
										<input
											type={showPassword ? "text" : "password"}
											className={inputClass("password")}
											placeholder="••••••••"
											value={loginForm.password}
											onChange={(e) =>
												setLoginForm((p) => ({
													...p,
													password: e.target.value,
												}))
											}
										/>
										<button
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-ns-faint hover:text-ns-secondary cursor-pointer"
										>
											{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
										</button>
									</div>
									{errors.password && (
										<p className="text-red-400 text-xs mt-1">
											{errors.password}
										</p>
									)}
								</div>

								<button
									type="submit"
									disabled={isLoading}
									className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
								>
									{isLoading ? (
										<>
											<Loader2 size={18} className="animate-spin" /> Đang xử
											lý...
										</>
									) : (
										"Đăng nhập"
									)}
								</button>
							</form>

							<div className="flex items-center gap-3 my-6">
								<div className="flex-1 h-px bg-ns-raised" />
								<span className="text-ns-faint text-xs">hoặc</span>
								<div className="flex-1 h-px bg-ns-raised" />
							</div>

							<div className="relative group">
								<button
									type="button"
									disabled={true}
									className="w-full border border-ns text-ns-secondary py-3 rounded-xl font-medium transition flex items-center justify-center gap-3 cursor-not-allowed opacity-60"
								>
									<svg width="18" height="18" viewBox="0 0 18 18">
										<path
											fill="#4285F4"
											d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
										/>
										<path
											fill="#34A853"
											d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
										/>
										<path
											fill="#FBBC05"
											d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"
										/>
										<path
											fill="#EA4335"
											d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"
										/>
									</svg>
									Tiếp tục với Google
								</button>
								<div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-ns-card border border-ns text-ns-secondary text-xs px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
									🚀 Sắp ra mắt
									<div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-ns" />
								</div>
							</div>
						</div>
					)}

					{/* REGISTER FORM */}
					{tab === "register" && (
						<div className="bg-ns-card border border-ns rounded-2xl p-8 animate-fade-in">
							<h2 className="font-heading font-bold text-ns-primary text-2xl mb-1">
								Tạo tài khoản miễn phí
							</h2>
							<p className="text-ns-muted text-sm mb-7">
								Bắt đầu hành trình tối ưu CV của bạn
							</p>

							<form onSubmit={handleRegister} className="space-y-4">
								<div>
									<label className="block text-ns-secondary text-sm font-medium mb-1.5">
										Họ và tên
									</label>
									<input
										type="text"
										className={inputClass("name")}
										placeholder="Nguyễn Văn A"
										value={registerForm.name}
										onChange={(e) =>
											setRegisterForm((p) => ({ ...p, name: e.target.value }))
										}
									/>
									{errors.name && (
										<p className="text-red-400 text-xs mt-1">{errors.name}</p>
									)}
								</div>

								<div>
									<label className="block text-ns-secondary text-sm font-medium mb-1.5">
										Email
									</label>
									<input
										type="email"
										className={inputClass("email")}
										placeholder="ten@email.com"
										value={registerForm.email}
										onChange={(e) =>
											setRegisterForm((p) => ({ ...p, email: e.target.value }))
										}
									/>
									{errors.email && (
										<p className="text-red-400 text-xs mt-1">{errors.email}</p>
									)}
								</div>

								<div>
									<label className="block text-ns-secondary text-sm font-medium mb-1.5">
										Mật khẩu
									</label>
									<div className="relative">
										<input
											type={showPassword ? "text" : "password"}
											className={inputClass("password")}
											placeholder="Tối thiểu 8 ký tự"
											value={registerForm.password}
											onChange={(e) =>
												setRegisterForm((p) => ({
													...p,
													password: e.target.value,
												}))
											}
										/>
										<button
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-ns-faint hover:text-ns-secondary cursor-pointer"
										>
											{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
										</button>
									</div>
									{errors.password && (
										<p className="text-red-400 text-xs mt-1">
											{errors.password}
										</p>
									)}
								</div>

								<div>
									<label className="block text-ns-secondary text-sm font-medium mb-1.5">
										Xác nhận mật khẩu
									</label>
									<div className="relative">
										<input
											type={showConfirmPassword ? "text" : "password"}
											className={inputClass("confirmPassword")}
											placeholder="Nhập lại mật khẩu"
											value={registerForm.confirmPassword}
											onChange={(e) =>
												setRegisterForm((p) => ({
													...p,
													confirmPassword: e.target.value,
												}))
											}
										/>
										<button
											type="button"
											onClick={() =>
												setShowConfirmPassword(!showConfirmPassword)
											}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-ns-faint hover:text-ns-secondary cursor-pointer"
										>
											{showConfirmPassword ? (
												<EyeOff size={18} />
											) : (
												<Eye size={18} />
											)}
										</button>
									</div>
									{errors.confirmPassword && (
										<p className="text-red-400 text-xs mt-1">
											{errors.confirmPassword}
										</p>
									)}
								</div>

								<div>
									<label className="flex items-start gap-3 cursor-pointer">
										<input
											type="checkbox"
											className="mt-0.5 accent-blue-600"
											checked={registerForm.agreed}
											onChange={(e) =>
												setRegisterForm((p) => ({
													...p,
													agreed: e.target.checked,
												}))
											}
										/>
										<span className="text-ns-muted text-sm">
											Tôi đồng ý với{" "}
											<Link
												to="/privacy"
												className="text-blue-400 hover:text-blue-300"
											>
												Điều khoản sử dụng
											</Link>{" "}
											và{" "}
											<Link
												to="/privacy"
												className="text-blue-400 hover:text-blue-300"
											>
												Chính sách bảo mật
											</Link>
										</span>
									</label>
									{errors.agreed && (
										<p className="text-red-400 text-xs mt-1">{errors.agreed}</p>
									)}
								</div>

								<button
									type="submit"
									disabled={isLoading}
									className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2 mt-2"
								>
									{isLoading ? (
										<>
											<Loader2 size={18} className="animate-spin" /> Đang xử
											lý...
										</>
									) : (
										"Tạo tài khoản"
									)}
								</button>
							</form>

							<div className="flex items-center gap-3 my-5">
								<div className="flex-1 h-px bg-ns-raised" />
								<span className="text-ns-faint text-xs">hoặc</span>
								<div className="flex-1 h-px bg-ns-raised" />
							</div>

							<div className="relative group">
								<button
									type="button"
									disabled={true}
									className="w-full border border-ns text-ns-secondary py-3 rounded-xl font-medium transition flex items-center justify-center gap-3 cursor-not-allowed opacity-60"
								>
									<svg width="18" height="18" viewBox="0 0 18 18">
										<path
											fill="#4285F4"
											d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
										/>
										<path
											fill="#34A853"
											d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
										/>
										<path
											fill="#FBBC05"
											d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"
										/>
										<path
											fill="#EA4335"
											d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"
										/>
									</svg>
									Tiếp tục với Google
								</button>
								<div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-ns-card border border-ns text-ns-secondary text-xs px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
									🚀 Sắp ra mắt
									<div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-ns" />
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
