

import React, { useState, useEffect, createContext, useContext, useCallback, ReactNode, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { User, UserRole, Language, Booking, Program, BookingStatus } from './types';
import { LOCALES, THAI_CLASSES, ENGLISH_CLASSES, KINDERGARTEN_CLASSES, PERIODS, EQUIPMENT_LIST, ALL_STATUSES } from './constants';
import api from './services/api';
import { 
  DashboardIcon, CalendarIcon, ReturnIcon, ReportIcon, UsersIcon, LogoutIcon, MenuIcon, CloseIcon, GlobeIcon, TableIcon, TrashIcon
} from './components/icons';

// --- SWEETALERT2 TYPE DEFINITION ---
declare const Swal: any;

// ======== TIMEZONE HELPERS ======== //

/**
 * Gets the current date string for the Asia/Bangkok timezone in YYYY-MM-DD format.
 * This function is robust and avoids common timezone pitfalls.
 * @returns An object with a Date object for the start of today in Bangkok (`now`) 
 *          and the date string in YYYY-MM-DD format (`dateString`).
 */
const getThaiTime = () => {
    // Using 'en-CA' locale is a reliable way to get the 'YYYY-MM-DD' format.
    const dateString = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Bangkok',
    }).format(new Date());

    // Create a Date object that precisely represents the start of the day in Bangkok.
    // By specifying the timezone offset (+07:00), we avoid ambiguity.
    const nowInBangkok = new Date(`${dateString}T00:00:00.000+07:00`);

    return {
        now: nowInBangkok,
        dateString: dateString,
    };
};

/**
 * Formats a date string (ISO or YYYY-MM-DD) into a localized, human-readable date for the 'Asia/Bangkok' timezone.
 * This correctly handles the full timestamp from the database to prevent "one day behind" errors.
 * @param dateString The date string to format, e.g., "2024-07-22T17:00:00.000Z" or "2024-07-23".
 * @param language The target language ('en' or 'th').
 * @returns A formatted date string without time.
 */
const formatDisplayDate = (dateString: string, language: Language): string => {
    if (!dateString) {
        return '';
    }
    
    // By creating a Date object directly from the string, we preserve the exact moment in time
    // if it's a full ISO string, or correctly interpret it as UTC midnight if it's 'YYYY-MM-DD'.
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
        return dateString; // Return original if not a valid date
    }

    const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Bangkok', // This is the key: format the date for this specific timezone.
    };

    if (language === 'th') {
        // We use formatToParts to construct the custom string "วันที่ d MMMM พ.ศ.yyyy".
        // 'th-TH-u-ca-buddhist' explicitly uses the Thai locale and Buddhist calendar.
        const parts = new Intl.DateTimeFormat('th-TH-u-ca-buddhist', options).formatToParts(date);
        const dayPart = parts.find(p => p.type === 'day')?.value;
        const monthPart = parts.find(p => p.type === 'month')?.value;
        const yearPart = parts.find(p => p.type === 'year')?.value;
        
        if (dayPart && monthPart && yearPart) {
            return `วันที่ ${dayPart} ${monthPart} พ.ศ.${yearPart}`;
        }
        // Fallback to standard Thai format if parts are not found.
        return new Intl.DateTimeFormat('th-TH-u-ca-buddhist', options).format(date);
    }
    
    // 'en-GB' provides the desired "d MMMM yyyy" format (e.g., 22 July 2024).
    return new Intl.DateTimeFormat('en-GB', options).format(date);
};

// ======== STYLING CONSTANTS ======== //
const STATUS_TO_STYLE: Record<BookingStatus, { key: keyof typeof LOCALES.en, classes: string }> = {
  'Booked': { key: 'booked', classes: 'bg-yellow-100 text-yellow-800' },
  'In Use': { key: 'inUse', classes: 'bg-blue-100 text-blue-800' },
  'Awaiting Return': { key: 'awaitingReturn', classes: 'bg-red-100 text-red-800' },
  'Returned': { key: 'returned', classes: 'bg-green-100 text-green-800' },
  'Cancelled': { key: 'cancelled', classes: 'bg-gray-100 text-gray-800' },
};

const TYPE_TO_STYLE: Record<Booking['type'], { key: keyof typeof LOCALES.en, classes: string }> = {
  'จอง': { key: 'book', classes: 'bg-purple-100 text-purple-800' },
  'ยืม': { key: 'borrow', classes: 'bg-cyan-100 text-cyan-800' },
};

/**
 * Sanitizes a booking object to ensure the `equipment` property is always a string array.
 * This handles cases where the API might return a single string or a comma-separated string
 * instead of an array.
 * @param booking The raw booking object from the API.
 * @returns A booking object with a guaranteed `equipment: string[]`.
 */
const sanitizeBooking = (booking: any): Booking => {
    let equipmentArray: string[] = [];
    if (Array.isArray(booking.equipment)) {
        equipmentArray = booking.equipment;
    } else if (typeof booking.equipment === 'string') {
        // Split by comma, trim whitespace, and filter out any empty strings that result.
        equipmentArray = booking.equipment.split(',').map(e => e.trim()).filter(e => e.length > 0);
    }
    return { ...booking, equipment: equipmentArray };
};


// ======== 1. CONTEXT AND HOOKS ======== //

// --- Localization Context ---
type LocalizationContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof LOCALES.en) => string;
};
const LocalizationContext = createContext<LocalizationContextType | null>(null);

export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (!context) throw new Error('useLocalization must be used within a LocalizationProvider');
  return context;
};

// --- Auth Context ---
type AuthContextType = {
  user: User | null;
  login: (username: string, password?: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
};
const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

// --- Bookings Context ---
type BookingsContextType = {
    bookings: Booking[];
    loading: boolean;
    fetchBookings: () => Promise<void>;
    createBooking: (bookingData: Omit<Booking, 'id' | 'status' | 'createdAt'>) => Promise<void>;
    updateBookingStatus: (id: number, status: Booking['status']) => Promise<void>;
    deleteBooking: (id: number) => Promise<void>;
};
const BookingsContext = createContext<BookingsContextType | null>(null);

export const useBookings = () => {
    const context = useContext(BookingsContext);
    if (!context) throw new Error('useBookings must be used within a BookingsProvider');
    return context;
}

// ======== 2. PROVIDER COMPONENTS ======== //

const LocalizationProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('th');
  
  const t = useCallback((key: keyof typeof LOCALES.en) => {
    return LOCALES[language][key] || LOCALES.en[key];
  }, [language]);

  return (
    <LocalizationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LocalizationContext.Provider>
  );
};

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('currentUser');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password?: string) => {
    setIsLoading(true);
    try {
      const loggedInUser = await api.login(username, password);
      if (loggedInUser) {
        localStorage.setItem('currentUser', JSON.stringify(loggedInUser));
        setUser(loggedInUser);
        return true;
      }
      localStorage.removeItem('currentUser');
      setUser(null);
      return false;
    } catch (error) {
      console.error("Login error", error);
      localStorage.removeItem('currentUser');
      setUser(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('currentUser');
    setUser(null);
  };
  
  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

const BookingsProvider = ({ children }: { children: ReactNode }) => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const { t } = useLocalization();

    const fetchBookings = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const data = await api.getBookings();
            // Sanitize every booking object upon fetching to ensure data integrity
            const sortedData = data
                .map(sanitizeBooking)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setBookings(sortedData);
        } catch (error) {
            console.error("Failed to fetch bookings:", error);
            if (!isSilent) {
                Swal.fire({ icon: 'error', title: t('error'), text: t('fetchBookingsError') });
            }
        } finally {
            if (!isSilent) setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const createBooking = async (bookingData: Omit<Booking, 'id' | 'status' | 'createdAt'>) => {
        const tempId = Date.now();
        const newStatus = bookingData.type === 'ยืม' ? 'In Use' : 'Booked';

        const optimisticBooking: Booking = {
            id: tempId,
            status: newStatus,
            createdAt: new Date().toISOString(),
            ...bookingData,
        };

        // Optimistically add to the beginning of the list for immediate visibility
        setBookings(prev => [optimisticBooking, ...prev]);

        try {
            const finalBooking = await api.createBooking(bookingData);
            // Sanitize the booking object returned from the API
            const processedFinalBooking = sanitizeBooking(finalBooking);
            
            // Replace the temporary booking with the final one from the server
            setBookings(prev =>
                prev.map(b => (b.id === tempId ? processedFinalBooking : b))
            );
        } catch (error) {
            console.error("Optimistic createBooking failed:", error);
            // Revert the state by removing the temporary booking
            setBookings(prev => prev.filter(b => b.id !== tempId));
            // Re-throw the error so the calling function can handle it (e.g., show a message)
            throw error;
        }
    };

    const updateBookingStatus = async (id: number, status: Booking['status']) => {
        const originalBookings = [...bookings];
        // Optimistic update for instant UI feedback
        setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));

        try {
            await api.updateBookingStatus(id, status);
            await fetchBookings(true); // Silent refresh to confirm state
        } catch (error) {
            setBookings(originalBookings); // Revert on error
            throw error;
        }
    };
    
    const deleteBooking = async (id: number) => {
        const originalBookings = [...bookings];
        setBookings(prev => prev.filter(b => b.id !== id)); // Optimistic deletion
        try {
            await api.deleteBooking(id);
            await fetchBookings(true); // Silently sync with backend
        } catch (error) {
            setBookings(originalBookings); // Revert on error
            throw error;
        }
    };

    const value = { bookings, loading, fetchBookings, createBooking, updateBookingStatus, deleteBooking };

    return (
        <BookingsContext.Provider value={value}>
            {children}
        </BookingsContext.Provider>
    );
};


// ======== 3. LAYOUT AND SHARED COMPONENTS ======== //

const Spinner = () => (
    <div className="flex justify-center items-center h-full w-full">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#003366]"></div>
    </div>
);

const LoadingIndicator = ({ text }: { text: string }) => {
    return (
        <div className="flex flex-col items-center justify-center p-4">
            <div className="flex space-x-2">
                <div className="w-3 h-3 bg-[#001f3f] rounded-full animate-pulse-dots" style={{ animationDelay: '0s' }}></div>
                <div className="w-3 h-3 bg-[#001f3f] rounded-full animate-pulse-dots" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-3 h-3 bg-[#001f3f] rounded-full animate-pulse-dots" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <p className="mt-4 text-lg text-gray-700">{text}</p>
        </div>
    );
};

const ProtectedRoute = ({ children, adminOnly }: { children: ReactNode, adminOnly?: boolean }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-[#e6f0fa]"><Spinner /></div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const Header = () => {
    return (
        <header className="bg-[#001429] text-white p-3 text-center shadow-md w-full">
            <h1 className="text-lg md:text-xl lg:text-2xl font-bold tracking-wide">โรงเรียนสาธิตอุดมศึกษา</h1>
            <p className="text-xs md:text-sm font-light uppercase tracking-widest">SATIT UDOMSEUKSA SCHOOL</p>
        </header>
    );
};

const Footer = () => {
    const { t } = useLocalization();
    return (
        <footer className="bg-[#001429] text-white text-center p-3 text-xs md:text-sm">
            <p>{t('copyright')}</p>
        </footer>
    );
};

const Sidebar = ({ isSidebarOpen, setSidebarOpen } : { isSidebarOpen: boolean, setSidebarOpen: (isOpen: boolean) => void }) => {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLocalization();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'th' : 'en');
  };

  const navLinkClasses = "flex items-center px-4 py-3 text-lg hover:bg-[#005b9f] rounded-lg transition-colors duration-200";
  const activeNavLinkClasses = "bg-[#005b9f]";

  const NavLink = ({ to, icon, label }: { to: string, icon: ReactNode, label: string }) => {
    const location = useLocation();
    const isActive = location.pathname === to;
    return (
      <Link to={to} className={`${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`} onClick={() => setSidebarOpen(false)}>
        <span className="mr-4">{icon}</span>
        {label}
      </Link>
    );
  };
  
  return (
    <>
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden ${isSidebarOpen ? 'block' : 'hidden'}`} onClick={() => setSidebarOpen(false)}></div>
      <aside className={`fixed top-0 left-0 h-full w-64 bg-[#001f3f] text-[#e6f0fa] p-4 flex flex-col z-40 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:w-72`}>
        <div className="flex items-center justify-between mb-8 md:justify-center">
            <h1 className="text-xl font-bold text-center">{t('appName')}</h1>
            <button className="md:hidden text-white" onClick={() => setSidebarOpen(false)}>
                <CloseIcon className="h-6 w-6" />
            </button>
        </div>
        <nav className="flex-grow">
          <ul className="space-y-2">
            <li><NavLink to="/" icon={<DashboardIcon className="h-6 w-6"/>} label={t('dashboard')} /></li>
            <li><NavLink to="/schedule" icon={<TableIcon className="h-6 w-6"/>} label={t('bookingGrid')} /></li>
            {user?.role === 'teacher' && (
              <li><NavLink to="/book" icon={<CalendarIcon className="h-6 w-6"/>} label={t('booking')} /></li>
            )}
            {user?.role === 'admin' && (
              <>
                <li><NavLink to="/admin-borrow" icon={<CalendarIcon className="h-6 w-6"/>} label={t('adminBorrow')} /></li>
                <li><NavLink to="/reports" icon={<ReportIcon className="h-6 w-6"/>} label={t('reports')} /></li>
                <li><NavLink to="/users" icon={<UsersIcon className="h-6 w-6"/>} label={t('userManagement')} /></li>
              </>
            )}
          </ul>
        </nav>
        <div className="mt-auto">
           <div className="text-center mb-4 p-3 rounded-lg">
              <p className="font-semibold text-white truncate">{user?.name}</p>
              <p className="text-sm text-gray-400 capitalize">{t(user?.role === 'admin' ? 'roleAdmin' : 'roleTeacher')}</p>
          </div>
          <button onClick={toggleLanguage} className="flex items-center px-4 py-3 text-lg w-full rounded-lg bg-green-600 text-white">
            <GlobeIcon className="h-6 w-6 mr-4" />
            {t('toggleLanguage')}
          </button>
          <button onClick={handleLogout} className="flex items-center px-4 py-3 text-lg w-full mt-2 rounded-lg transition-colors duration-200 bg-red-600 text-white hover:bg-red-700">
            <LogoutIcon className="h-6 w-6 mr-4" />
            {t('logout')}
          </button>
        </div>
      </aside>
    </>
  );
};

const PageWrapper = ({ title, children }: { title: string, children: ReactNode }) => {
    const { t } = useLocalization();
    return (
      <div className="p-4 md:p-8">
        <h1 className="text-3xl font-bold text-[#001f3f] mb-6">{t(title as keyof typeof LOCALES.en)}</h1>
        <div className="bg-white p-6 rounded-xl shadow-lg">
          {children}
        </div>
      </div>
    );
};

// ======== 4. PAGE COMPONENTS ======== //

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const { t, language, setLanguage } = useLocalization();
  const navigate = useNavigate();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'th' : 'en');
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(username, password);
    if (success) {
      Swal.fire({
        icon: 'success',
        title: t('loginSuccess'),
        showConfirmButton: false,
        timer: 1500,
      });
      navigate('/');
    } else {
      Swal.fire({
        icon: 'error',
        title: t('loginFailed'),
        showConfirmButton: false,
        timer: 3000,
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#001f3f]">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-2xl">
        <h1 className="text-3xl font-bold text-center text-[#003366]">{t('appName')}</h1>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="text-sm font-bold text-gray-600 block">{t('username')}</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 mt-2 text-gray-700 bg-gray-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#005b9f]"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-bold text-gray-600 block">{t('password')}</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 mt-2 text-gray-700 bg-gray-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#005b9f]"
              required
            />
          </div>
          <button type="submit" className="w-full py-3 mt-4 font-bold text-white bg-[#003366] rounded-lg hover:bg-[#005b9f] transition-colors">
            {t('login')}
          </button>
        </form>
         <div className="text-center pt-4">
            <button
              onClick={toggleLanguage}
              className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-[#005b9f] focus:outline-none transition-colors"
            >
              <GlobeIcon className="h-5 w-5 mr-2" />
              {t('toggleLanguage')}
            </button>
        </div>
      </div>
    </div>
  );
};

const DashboardPage = () => {
    const { user } = useAuth();
    const { t, language } = useLocalization();
    const { bookings, loading, updateBookingStatus } = useBookings();
    const [searchQuery, setSearchQuery] = useState('');

    const handleReturn = async (bookingId: number) => {
        const result = await Swal.fire({
            title: t('confirmReturn'),
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#005b9f',
            cancelButtonColor: '#d33',
            confirmButtonText: t('confirm'),
            cancelButtonText: t('cancel'),
        });

        if (result.isConfirmed) {
            try {
                await updateBookingStatus(bookingId, 'Returned');
                Swal.fire({
                    icon: 'success',
                    title: t('success'),
                    text: t('returnSuccess'),
                    showConfirmButton: false,
                    timer: 1500,
                });
            } catch (error) {
                console.error("Failed to update status:", error);
                Swal.fire({ icon: 'error', title: t('error'), text: t('updateStatusError') });
            }
        }
    };
    
    const handleDelete = async (bookingId: number) => {
        const result = await Swal.fire({
            title: t('confirmDeleteBookingTitle'),
            text: t('confirmDeleteBookingText'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: t('delete'),
            cancelButtonText: t('cancel'),
        });

        if (result.isConfirmed) {
            try {
                // Workaround: Mark as 'Cancelled' instead of deleting, as the delete endpoint might not be ready.
                // This achieves the goal of removing it from the active dashboard.
                await updateBookingStatus(bookingId, 'Cancelled');
                Swal.fire({
                    icon: 'success',
                    title: t('success'),
                    text: t('deleteBookingSuccess'),
                    showConfirmButton: false,
                    timer: 1500,
                });
            } catch (error) {
                console.error("Failed to delete booking:", error);
                Swal.fire({ icon: 'error', title: t('error'), text: t('deleteBookingError') });
            }
        }
    };

    const activeBookings = useMemo(() => {
        const activeStatuses: BookingStatus[] = ['Booked', 'In Use', 'Awaiting Return'];
        return bookings
            .filter(b => activeStatuses.includes(b.status))
            .filter(b => {
                if (!searchQuery) return true;
                const lowerQuery = searchQuery.toLowerCase();
                return (
                    b.teacherName.toLowerCase().includes(lowerQuery) ||
                    b.equipment.some(eq => eq.toLowerCase().includes(lowerQuery)) ||
                    b.classroom.toLowerCase().includes(lowerQuery)
                );
            })
            // For the dashboard, sorting by event date is more intuitive for users
            .sort((a, b) => {
                const dateA = new Date(a.bookingDate);
                const dateB = new Date(b.bookingDate);
                if (dateA.getTime() !== dateB.getTime()) {
                    return dateB.getTime() - dateA.getTime();
                }
                return b.period - a.period;
            });
    }, [bookings, searchQuery]);

    if (loading) {
        return <PageWrapper title="dashboard"><Spinner /></PageWrapper>;
    }

    return (
        <PageWrapper title="dashboard">
            <div className="mb-6">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={t('searchPendingReturnsPlaceholder')}
                    className="w-full max-w-lg p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#005b9f]"
                />
            </div>

            {activeBookings.length === 0 ? (
                <div className="text-center py-10 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-xl">{t('noPendingReturns')}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {activeBookings.map(booking => (
                        <div key={booking.id} className="bg-white p-5 rounded-xl shadow-md border border-gray-200 transition-shadow hover:shadow-lg">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                                <div className="flex-grow mb-4 md:mb-0">
                                    <div className="flex items-center mb-2 flex-wrap gap-x-2 gap-y-2">
                                        <p className="font-bold text-xl text-[#003366] mr-2">{booking.classroom}</p>
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${TYPE_TO_STYLE[booking.type]?.classes || 'bg-gray-100 text-gray-800'}`}>
                                            {t(TYPE_TO_STYLE[booking.type]?.key || 'bookingType')}
                                        </span>
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${STATUS_TO_STYLE[booking.status]?.classes || ''}`}>
                                            {t(STATUS_TO_STYLE[booking.status]?.key || 'status')}
                                        </span>
                                    </div>
                                    <p className="text-gray-600"><span className="font-semibold">{t('teacher')}:</span> {booking.teacherName}</p>
                                    <p className="text-gray-600">
                                      <span className="font-semibold">{t('date')}:</span> {formatDisplayDate(booking.bookingDate, language)} / <span className="font-semibold">{t('period')}:</span> {booking.period}
                                    </p>
                                    <p className="mt-2 text-gray-800"><span className="font-semibold">{t('equipment')}:</span> {booking.equipment.join(', ')}</p>
                                </div>
                                
                                <div className="flex-shrink-0 self-start md:self-center flex flex-col md:flex-row gap-2">
                                    {user?.role === 'admin' && (
                                      <button
                                          onClick={() => handleReturn(booking.id)}
                                          className="w-full md:w-auto bg-[#005b9f] text-white font-bold py-2 px-6 rounded-lg hover:bg-[#004070] transition-colors duration-200 flex items-center justify-center"
                                      >
                                          <ReturnIcon className="h-5 w-5 mr-2" />
                                          {t('returnEquipment')}
                                      </button>
                                    )}
                                    {user?.role === 'admin' && (
                                        <button
                                            onClick={() => handleDelete(booking.id)}
                                            className="w-full md:w-auto bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-800 transition-colors duration-200 flex items-center justify-center"
                                        >
                                            <TrashIcon className="h-5 w-5 mr-2" />
                                            {t('delete')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </PageWrapper>
    );
};

type BookingFormProps = {
    isAdmin?: boolean;
    isModal?: boolean;
    initialData?: {
        classroom?: string;
        period?: number;
        bookingDate?: string;
        program?: Program;
    };
    onBookingSuccess?: () => void;
};


const BookingForm = ({ isAdmin = false, isModal = false, initialData = {}, onBookingSuccess }: BookingFormProps) => {
    const { user } = useAuth();
    const { t } = useLocalization();
    const { bookings, createBooking } = useBookings();
    const navigate = useNavigate();

    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [type, setType] = useState<Booking['type']>('จอง');

    const [teacherName, setTeacherName] = useState(isAdmin ? '' : user?.name || '');
    const [teacherSearchQuery, setTeacherSearchQuery] = useState(isAdmin ? '' : user?.name || '');
    const [isTeacherDropdownOpen, setIsTeacherDropdownOpen] = useState(false);
    const teacherDropdownRef = useRef<HTMLDivElement>(null);
    
    const [program, setProgram] = useState<Program | ''>(initialData?.program || '');
    const [classroom, setClassroom] = useState(initialData?.classroom || '');
    const [period, setPeriod] = useState<number | ''>(initialData?.period || '');
    const [bookingDate, setBookingDate] = useState(initialData?.bookingDate || getThaiTime().dateString);
    const [learningUnitNumber, setLearningUnitNumber] = useState('');
    const [learningUnitName, setLearningUnitName] = useState('');
    const [lessonPlanName, setLessonPlanName] = useState('');
    const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
    const [otherEquipment, setOtherEquipment] = useState('');

    useEffect(() => {
        if (isAdmin) {
            api.getUsers().then(users => {
                const teachers = users.filter(u => u.role === 'teacher');
                setAllUsers(teachers);
            }).catch(err => console.error("Failed to fetch users for admin booking form", err));
        }
    }, [isAdmin]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (teacherDropdownRef.current && !teacherDropdownRef.current.contains(event.target as Node)) {
                setIsTeacherDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredTeachers = useMemo(() => {
        if (!teacherSearchQuery) return allUsers;
        return allUsers.filter(u => u.name.toLowerCase().includes(teacherSearchQuery.toLowerCase()));
    }, [teacherSearchQuery, allUsers]);

    const handleTeacherSelect = (selectedTeacherName: string) => {
        setTeacherName(selectedTeacherName);
        setTeacherSearchQuery(selectedTeacherName);
        setIsTeacherDropdownOpen(false);
    };

    const handleEquipmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        setSelectedEquipment(prev => 
            checked ? [...prev, value] : prev.filter(item => item !== value)
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!teacherName || !program || !classroom || !period || !bookingDate || !learningUnitNumber || !learningUnitName || !lessonPlanName || (selectedEquipment.length === 0 && !otherEquipment.trim())) {
            Swal.fire({ icon: 'warning', title: t('formValidationError'), showConfirmButton: false, timer: 2000 });
            return;
        }

        const finalEquipmentList = [
            ...selectedEquipment.map(item => item.trim()),
            ...(otherEquipment.trim() ? [otherEquipment.trim()] : [])
        ];
        
        const loaderContainer = document.createElement('div');
        const root = ReactDOM.createRoot(loaderContainer);
        root.render(<LoadingIndicator text={t('loadingActionText')} />);

        Swal.fire({
            html: loaderContainer,
            showConfirmButton: false,
            allowOutsideClick: false,
            willClose: () => {
                root.unmount();
            }
        });

        try {
            const activeStatuses: BookingStatus[] = ['Booked', 'In Use', 'Awaiting Return'];
            const bookingsAtSameTime = bookings.filter(b => {
                const bookingDatePart = b.bookingDate.substring(0, 10);
                return bookingDatePart === bookingDate &&
                        b.period === Number(period) &&
                        activeStatuses.includes(b.status)
            });

            // Check 1: Is the same classroom already booked?
            const isClassroomConflict = bookingsAtSameTime.some(b => b.classroom === classroom);
            if (isClassroomConflict) {
                 Swal.fire({
                    icon: 'error',
                    title: t('bookingConflictTitle'),
                    text: t('bookingConflictText'),
                    confirmButtonColor: '#005b9f',
                });
                return;
            }

            // Check 2: Are any of the requested equipment items booked in other classrooms at the same time?
            const allBookedEquipmentAtTime = bookingsAtSameTime.flatMap(b => b.equipment.map(eq => eq.trim()));
            const isEquipmentConflict = finalEquipmentList.some(reqEq => allBookedEquipmentAtTime.includes(reqEq.trim()));
            
            if (isEquipmentConflict) {
                Swal.fire({
                    icon: 'error',
                    title: t('equipmentConflictTitle'),
                    text: t('equipmentConflictText'),
                    confirmButtonColor: '#005b9f',
                });
                return;
            }
            
            // If no conflicts, create booking
            await createBooking({
                type, teacherName, program, classroom, period: Number(period), bookingDate,
                learningUnitNumber, learningUnitName, lessonPlanName, equipment: finalEquipmentList,
            });

            Swal.fire({ icon: 'success', title: t('bookingSuccessTitle'), text: t('bookingSuccessText'), showConfirmButton: false, timer: 2000 });
            
            if (onBookingSuccess) {
                onBookingSuccess();
            } else {
                navigate('/');
            }

        } catch (error) {
            console.error("Booking submission failed:", error);
            Swal.fire({ icon: 'error', title: t('error'), text: t('bookingSaveError') });
        }
    };
    
    const classroomsForProgram = 
        program === 'Thai Programme' ? THAI_CLASSES :
        program === 'English Programme' ? ENGLISH_CLASSES :
        program === 'Kindergarten' ? KINDERGARTEN_CLASSES :
        [];

    const formJsx = (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('bookingType')}</label>
                    <select value={type} onChange={e => setType(e.target.value as Booking['type'])} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#005b9f] focus:border-[#005b9f]">
                        <option value="จอง">{t('book')}</option>
                        <option value="ยืม">{t('borrow')}</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('teacherName')}</label>
                     {isAdmin ? (
                        <div className="relative" ref={teacherDropdownRef}>
                            <input
                                type="text" value={teacherSearchQuery}
                                onChange={e => { setTeacherSearchQuery(e.target.value); setTeacherName(''); setIsTeacherDropdownOpen(true); }}
                                onFocus={() => setIsTeacherDropdownOpen(true)}
                                placeholder={t('searchUserPlaceholder')}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                                autoComplete="off" required
                            />
                            {isTeacherDropdownOpen && (
                                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                    {filteredTeachers.length > 0 ? (
                                        filteredTeachers.map(u => (
                                            <div key={u.id} onClick={() => handleTeacherSelect(u.name)} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">{u.name}</div>
                                        ))
                                    ) : (
                                        <div className="px-4 py-2 text-gray-500">{t('noUsersFound')}</div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <input type="text" value={teacherName} readOnly className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100" />
                    )}
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">{t('program')}</label>
                    <select value={program} onChange={e => { setProgram(e.target.value as Program); setClassroom(''); }} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100" required disabled={isModal}>
                        <option value="">{t('selectProgram')}</option>
                        <option value="Thai Programme">{t('programThai')}</option>
                        <option value="English Programme">{t('programEnglish')}</option>
                        <option value="Kindergarten">{t('programKindergarten')}</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('classroom')}</label>
                    <select value={classroom} onChange={e => setClassroom(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100" required disabled={isModal || !program}>
                        <option value="">{t('selectClassroom')}</option>
                        {classroomsForProgram.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">{t('usageDate')}</label>
                    <input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100" required disabled={isModal} />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">{t('period')}</label>
                    <select value={period} onChange={e => setPeriod(e.target.value ? Number(e.target.value) : '')} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100" required disabled={isModal}>
                        <option value="">{t('selectPeriod')}</option>
                        {PERIODS.map(p => <option key={p.id} value={p.id}>{p.id} ({p.time})</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div>
                    <label className="block text-sm font-medium text-gray-700">{t('learningUnitNumber')}</label>
                    <input type="text" value={learningUnitNumber} onChange={e => setLearningUnitNumber(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('learningUnitName')}</label>
                    <input type="text" value={learningUnitName} onChange={e => setLearningUnitName(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('lessonPlanName')}</label>
                    <input type="text" value={lessonPlanName} onChange={e => setLessonPlanName(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" required />
                </div>
            </div>

            <div>
                <label className="block text-base font-medium text-gray-900">{t('equipmentList')}</label>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {EQUIPMENT_LIST.map(item => (
                        <div key={item.id} className="flex items-center">
                            <input id={`${item.id}-${isModal ? 'modal' : 'page'}`} type="checkbox" value={item.name} onChange={handleEquipmentChange} className="h-4 w-4 text-[#005b9f] focus:ring-[#005b9f] border-gray-300 rounded" />
                            <label htmlFor={`${item.id}-${isModal ? 'modal' : 'page'}`} className="ml-3 text-sm text-gray-700">{item.name}</label>
                        </div>
                    ))}
                </div>
                <div className="mt-4">
                     <label htmlFor={`other-equipment-${isModal ? 'modal' : 'page'}`} className="block text-sm font-medium text-gray-700">{t('other')}</label>
                     <input type="text" id={`other-equipment-${isModal ? 'modal' : 'page'}`} value={otherEquipment} onChange={e => setOtherEquipment(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                </div>
            </div>

            <div className="pt-5">
                <div className="flex justify-end">
                    <button type="submit" className="w-full md:w-auto bg-[#003366] text-white font-bold py-3 px-8 rounded-lg hover:bg-[#005b9f] transition-colors duration-200">
                        {t('submitBooking')}
                    </button>
                </div>
            </div>
        </form>
    );

    if (isModal) {
        return formJsx;
    }

    const pageTitle = isAdmin ? 'adminBorrow' : 'booking';
    return <PageWrapper title={pageTitle}>{formJsx}</PageWrapper>;
};

const BookingPage = () => <BookingForm isAdmin={false} />;
const AdminBorrowPage = () => <BookingForm isAdmin={true} />;

type BookingModalProps = {
    classroom: string;
    period: number;
    bookingDate: string;
    program: Program;
    onClose: () => void;
};

const BookingModal = ({ classroom, period, bookingDate, program, onClose }: BookingModalProps) => {
    const { user } = useAuth();
    const { t } = useLocalization();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 p-4 pt-12 md:items-center" role="dialog" aria-modal="true">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800" aria-label={t('cancel')}>
                    <CloseIcon className="h-6 w-6" />
                </button>
                <h2 className="text-2xl font-bold mb-6 text-[#001f3f]">{t('bookingForm')}</h2>
                <BookingForm
                    isAdmin={user?.role === 'admin'}
                    isModal={true}
                    initialData={{ classroom, period, bookingDate, program }}
                    onBookingSuccess={onClose}
                />
            </div>
        </div>
    );
};

type BookedSlotInfoProps = {
    booking: Booking;
    currentUser: User | null;
    onCancel: (bookingId: number) => Promise<void>;
    t: (key: keyof typeof LOCALES.en) => string;
};

const BookedSlotInfo = ({ booking, currentUser, onCancel, t }: BookedSlotInfoProps) => {
    const canCancel = currentUser &&
                      (currentUser.role === 'admin' || currentUser.name === booking.teacherName) &&
                      booking.status !== 'Returned' &&
                      booking.status !== 'Cancelled';

    return (
        <div className="w-full h-full flex flex-col items-center justify-center rounded-lg p-1 text-center bg-yellow-50 border border-yellow-200">
            <div className="flex items-center">
                <span className="font-semibold text-sm text-yellow-800">
                    {t('bookingSlotBooked')}
                </span>
            </div>
            <p className="text-xs text-gray-700 mt-1 px-1 w-full truncate" title={booking.teacherName}>
                {booking.teacherName}
            </p>
            {canCancel && (
                <button
                    onClick={() => onCancel(booking.id)}
                    className="mt-1 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                    aria-label={`${t('cancel')} booking`}
                >
                    {t('cancel')}
                </button>
            )}
        </div>
    );
};

const BookingSchedulePage = () => {
    const { t } = useLocalization();
    const { user } = useAuth();
    const { bookings, loading, updateBookingStatus } = useBookings();
    const [selectedDate, setSelectedDate] = useState(() => getThaiTime().dateString);
    const [selectedProgram, setSelectedProgram] = useState<Program>('Thai Programme');
    const [bookingModalInfo, setBookingModalInfo] = useState<{ classroom: string; period: number } | null>(null);

    const handleCellClick = (classroom: string, period: number) => {
        setBookingModalInfo({ classroom, period });
    };

    const handleCloseModal = () => {
        setBookingModalInfo(null);
    };

    const handleCancelBooking = async (bookingId: number) => {
        const result = await Swal.fire({
            title: t('confirmCancelTitle'),
            text: t('confirmCancelText'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: t('confirmCancelAction'),
            cancelButtonText: t('denyCancelAction'),
        });

        if (result.isConfirmed) {
            try {
                await updateBookingStatus(bookingId, 'Cancelled');
                Swal.fire({
                    icon: 'success',
                    title: t('cancelSuccessTitle'),
                    text: t('cancelSuccessText'),
                    showConfirmButton: false,
                    timer: 1500,
                });
            } catch (error) {
                console.error("Failed to cancel booking:", error);
                Swal.fire({ icon: 'error', title: t('error'), text: t('updateStatusError') });
            }
        }
    };

    const bookingsForDateMap = useMemo(() => {
        const map = new Map<string, Booking>();
        const activeStatuses: BookingStatus[] = ['Booked', 'In Use', 'Awaiting Return'];
        bookings
            .filter(b => {
                // We must handle the date carefully. The date from the DB might be a full ISO string.
                // We create a date object and format it to a YYYY-MM-DD string in Bangkok time for comparison.
                const bookingDateInBangkok = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date(b.bookingDate));
                return bookingDateInBangkok === selectedDate && activeStatuses.includes(b.status);
            })
            .forEach(b => {
                map.set(`${b.classroom}-${b.period}`, b);
            });
        return map;
    }, [bookings, selectedDate]);
    
    const classrooms = 
        selectedProgram === 'Thai Programme' ? THAI_CLASSES :
        selectedProgram === 'English Programme' ? ENGLISH_CLASSES :
        KINDERGARTEN_CLASSES;
    
    return (
        <PageWrapper title="bookingGrid">
            {bookingModalInfo && (
                <BookingModal
                    classroom={bookingModalInfo.classroom}
                    period={bookingModalInfo.period}
                    bookingDate={selectedDate}
                    program={selectedProgram}
                    onClose={handleCloseModal}
                />
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 p-4 bg-gray-50 rounded-lg border">
                <div>
                    <label htmlFor="schedule-date" className="block text-sm font-medium text-gray-700 mb-1">{t('selectDate')}</label>
                    <input
                        id="schedule-date"
                        type="date"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        className="p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#005b9f]"
                    />
                </div>
                <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-1 bg-gray-200 p-1 rounded-lg">
                    <button
                        onClick={() => setSelectedProgram('Thai Programme')}
                        className={`w-full sm:w-auto px-4 py-2 rounded-md text-sm font-medium transition-colors ${selectedProgram === 'Thai Programme' ? 'bg-white text-[#003366] shadow' : 'bg-transparent text-gray-600 hover:bg-gray-300'}`}
                    >
                        {t('programThai')}
                    </button>
                    <button
                        onClick={() => setSelectedProgram('English Programme')}
                        className={`w-full sm:w-auto px-4 py-2 rounded-md text-sm font-medium transition-colors ${selectedProgram === 'English Programme' ? 'bg-white text-[#003366] shadow' : 'bg-transparent text-gray-600 hover:bg-gray-300'}`}
                    >
                        {t('programEnglish')}
                    </button>
                    <button
                        onClick={() => setSelectedProgram('Kindergarten')}
                        className={`w-full sm:w-auto px-4 py-2 rounded-md text-sm font-medium transition-colors ${selectedProgram === 'Kindergarten' ? 'bg-white text-[#003366] shadow' : 'bg-transparent text-gray-600 hover:bg-gray-300'}`}
                    >
                        {t('programKindergarten')}
                    </button>
                </div>
            </div>

            {loading ? <Spinner /> : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full bg-white border-collapse">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="sticky left-0 bg-gray-100 py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider z-10">{t('classroom')}</th>
                                {PERIODS.map(p => (
                                    <th key={p.id} className="py-3 px-4 text-center text-sm font-semibold text-gray-600 uppercase tracking-wider">
                                        {t('period')} {p.id}<br/><span className="font-normal text-xs">({p.time})</span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {classrooms.map(classroom => (
                                <tr key={classroom} className="hover:bg-gray-50">
                                    <td className="sticky left-0 bg-white hover:bg-gray-50 py-3 px-4 whitespace-nowrap font-medium text-gray-800 z-10">{classroom}</td>
                                    {PERIODS.map(period => {
                                        const bookingDetails = bookingsForDateMap.get(`${classroom}-${period.id}`);
                                        return (
                                            <td key={period.id} className="py-2 px-1 text-center whitespace-nowrap border-l border-gray-200">
                                                {bookingDetails ? (
                                                    <BookedSlotInfo
                                                        booking={bookingDetails}
                                                        currentUser={user}
                                                        onCancel={handleCancelBooking}
                                                        t={t}
                                                    />
                                                ) : (
                                                    <button 
                                                      onClick={() => handleCellClick(classroom, period.id)}
                                                      className="w-full flex items-center justify-center text-green-600 hover:bg-green-100 p-2 rounded-lg transition-colors h-full"
                                                      aria-label={`Book ${classroom} for period ${period.id}`}
                                                    >
                                                        <span className="text-sm font-semibold">{t('bookingSlotAvailable')}</span>
                                                    </button>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </PageWrapper>
    );
};

const ReportsPage = () => {
    const { t, language } = useLocalization();
    const { bookings, loading } = useBookings();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<BookingStatus | ''>('');

    const statusToLocaleKey: Record<BookingStatus, keyof typeof LOCALES.en> = {
        'Booked': 'booked', 'In Use': 'inUse', 'Awaiting Return': 'awaitingReturn',
        'Returned': 'returned', 'Cancelled': 'cancelled'
    };
    
    const displayedBookings = useMemo(() => {
        return bookings
            .filter(b => { // Status filter
                if (!selectedStatus) return true;
                return b.status === selectedStatus;
            })
            .filter(b => { // Date filter
                if (!startDate && !endDate) return true;
                const bookingDate = new Date(b.bookingDate);
                bookingDate.setUTCHours(0, 0, 0, 0);

                let isAfterStart = true;
                if (startDate) {
                    const start = new Date(startDate);
                    start.setUTCHours(0, 0, 0, 0);
                    isAfterStart = bookingDate >= start;
                }

                let isBeforeEnd = true;
                if (endDate) {
                    const end = new Date(endDate);
                    end.setUTCHours(0, 0, 0, 0);
                    isBeforeEnd = bookingDate <= end;
                }

                return isAfterStart && isBeforeEnd;
            })
            .filter(b => { // Search filter
                if (!searchQuery) return true;
                const lowerQuery = searchQuery.toLowerCase();
                return (
                    b.teacherName.toLowerCase().includes(lowerQuery) ||
                    b.equipment.some(eq => eq.toLowerCase().includes(lowerQuery)) ||
                    b.classroom.toLowerCase().includes(lowerQuery) ||
                    b.lessonPlanName.toLowerCase().includes(lowerQuery)
                );
            });
    }, [bookings, startDate, endDate, searchQuery, selectedStatus]);

    const handleExport = () => {
        const headers = [
            t('reportHeaderDate'),
            t('reportHeaderClassroom'),
            t('reportHeaderPeriod'),
            t('reportHeaderBorrower'),
            t('reportHeaderLessonPlanName'),
            t('reportHeaderEquipment'),
            t('status')
        ];

        const dataForSheet = displayedBookings.map(b => ([
            formatDisplayDate(b.bookingDate, language),
            b.classroom,
            b.period,
            b.teacherName,
            b.lessonPlanName,
            b.equipment.join(', '),
            t(statusToLocaleKey[b.status])
        ]));

        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...dataForSheet]);
        
        // Define header style
        const headerStyle = {
            font: { bold: true, color: { rgb: "FFFFFFFF" } },
            fill: { fgColor: { rgb: "FF001f3f" } }, // Use the app's dark blue color
        };

        // Apply style to header cells by finding the range of the headers
        const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
            const address = XLSX.utils.encode_cell({ r: 0, c: C });
            if (worksheet[address]) {
                worksheet[address].s = headerStyle;
            }
        }
        
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Usage Report");
        
        const fileName = `Equipment_Usage_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };
    
    return (
         <PageWrapper title="reportsTitle">
            <div className="p-4 bg-gray-50 rounded-lg border mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div>
                        <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">{t('startDate')}</label>
                        <input id="start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                    <div>
                        <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">{t('endDate')}</label>
                        <input id="end-date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                    <div>
                        <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">{t('status')}</label>
                        <select
                            id="status-filter"
                            value={selectedStatus}
                            onChange={e => setSelectedStatus(e.target.value as (BookingStatus | ''))}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                        >
                            <option value="">{t('allStatuses')}</option>
                            {ALL_STATUSES.map(status => (
                                <option key={status} value={status}>{t(statusToLocaleKey[status])}</option>
                            ))}
                        </select>
                    </div>
                    <div className="lg:col-span-1">
                         <label htmlFor="report-search" className="block text-sm font-medium text-gray-700">{t('search')}</label>
                         <input
                            id="report-search"
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder={t('searchReportPlaceholder' as keyof typeof LOCALES.en)}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 invisible">{t('exportLabel')}</label>
                        <button onClick={handleExport} disabled={displayedBookings.length === 0} className="w-full bg-[#0e7490] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#155e75] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                            {t('exportToExcel')}
                        </button>
                    </div>
                </div>
            </div>

            {loading ? <Spinner /> : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">{t('reportHeaderDate')}</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">{t('reportHeaderClassroom')}</th>
                                <th className="py-3 px-4 text-center text-sm font-semibold text-gray-600 uppercase tracking-wider">{t('reportHeaderPeriod')}</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">{t('reportHeaderBorrower')}</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">{t('reportHeaderLessonPlanName')}</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">{t('reportHeaderEquipment')}</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">{t('status')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {displayedBookings.length > 0 ? displayedBookings.map(booking => (
                                <tr key={booking.id} className="hover:bg-gray-50">
                                    <td className="py-3 px-4 whitespace-nowrap">{formatDisplayDate(booking.bookingDate, language)}</td>
                                    <td className="py-3 px-4 whitespace-nowrap">{booking.classroom}</td>
                                    <td className="py-3 px-4 whitespace-nowrap text-center">{booking.period}</td>
                                    <td className="py-3 px-4">{booking.teacherName}</td>
                                    <td className="py-3 px-4 max-w-sm truncate" title={booking.lessonPlanName}>{booking.lessonPlanName}</td>
                                    <td className="py-3 px-4 max-w-xs truncate">{booking.equipment.join(', ')}</td>
                                    <td className="py-3 px-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${STATUS_TO_STYLE[booking.status] || 'bg-gray-200 text-gray-800'}`}>
                                            {t(statusToLocaleKey[booking.status] || 'status')}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={7} className="text-center py-10 text-gray-500">
                                        {t('noBookingsToday')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </PageWrapper>
    );
};

const UserManagementPage = () => {
    const { t } = useLocalization();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getUsers();
            setUsers(data);
        } catch (error) {
            console.error("Failed to fetch users:", error);
            Swal.fire({ icon: 'error', title: t('error'), text: t('fetchUsersError') });
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleOpenModal = (user: User | null = null) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const handleSaveUser = async (userData: { id?: number; name: string; username: string; role: UserRole; password?: string }) => {
        try {
            if (userData.id) { // Editing existing user
                await api.updateUser(userData.id, userData.name, userData.role);
                 Swal.fire({ icon: 'success', title: t('userUpdatedSuccess'), showConfirmButton: false, timer: 1500 });
            } else { // Adding new user
                await api.addUser(userData.name, userData.username, userData.role, userData.password!);
                Swal.fire({ icon: 'success', title: t('userAddedSuccess'), showConfirmButton: false, timer: 1500 });
            }
            fetchUsers();
            handleCloseModal();
        } catch (error) {
            console.error("Failed to save user:", error);
            Swal.fire({ icon: 'error', title: t('error'), text: t('saveUserError') });
        }
    };

    const handleDeleteUser = async (userId: number) => {
        const result = await Swal.fire({
            title: t('confirmDeleteUserTitle'),
            text: t('confirmDeleteUserText'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: t('delete'),
            cancelButtonText: t('cancel')
        });

        if (result.isConfirmed) {
            try {
                await api.deleteUser(userId);
                Swal.fire({ icon: 'success', title: t('userDeletedSuccess'), showConfirmButton: false, timer: 1500 });
                fetchUsers();
            } catch (error) {
                console.error("Failed to delete user:", error);
                Swal.fire({ icon: 'error', title: t('error'), text: t('deleteUserError') });
            }
        }
    };
    
    const filteredUsers = useMemo(() => {
      if (!searchQuery) return users;
      return users.filter(user => user.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [users, searchQuery]);

    return (
        <PageWrapper title="userManagementTitle">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                 <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={t('searchUserPlaceholder')}
                    className="w-full max-w-sm p-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#005b9f]"
                />
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-[#003366] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#005b9f] transition-colors"
                >
                    {t('addUser')}
                </button>
            </div>
            {loading ? <Spinner /> : (
                 <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">{t('userName')}</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">{t('username')}</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">{t('userRole')}</th>
                                <th className="py-3 px-4 text-center text-sm font-semibold text-gray-600 uppercase tracking-wider">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                           {filteredUsers.length > 0 ? filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="py-3 px-4">{user.name}</td>
                                    <td className="py-3 px-4">{user.username}</td>
                                    <td className="py-3 px-4">{user.role}</td>
                                    <td className="py-3 px-4 text-center">
                                        <button onClick={() => handleOpenModal(user)} className="text-blue-600 hover:text-blue-900 mr-4">{t('edit')}</button>
                                        <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-900">{t('delete')}</button>
                                    </td>
                                </tr>
                           )) : (
                               <tr>
                                    <td colSpan={4} className="text-center py-10 text-gray-500">
                                        {t('noUsersFound')}
                                    </td>
                                </tr>
                           )}
                        </tbody>
                    </table>
                </div>
            )}
            
            {isModalOpen && (
                <UserModal
                    user={editingUser}
                    onClose={handleCloseModal}
                    onSave={handleSaveUser}
                />
            )}
        </PageWrapper>
    );
};

type UserModalProps = {
  user: User | null;
  onClose: () => void;
  onSave: (data: { id?: number; name: string; username: string; role: UserRole; password?: string }) => void;
};

const UserModal = ({ user, onClose, onSave }: UserModalProps) => {
    const { t } = useLocalization();
    const [name, setName] = useState(user?.name || '');
    const [username, setUsername] = useState(user?.username || '');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>(user?.role || 'teacher');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ id: user?.id, name, username, role, password });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6">{user ? t('editUser') : t('addUser')}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">{t('userName')}</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">{t('username')}</label>
                            <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required disabled={!!user} />
                        </div>
                         {!user && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('password')}</label>
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required />
                            </div>
                        )}
                         <div>
                            <label className="block text-sm font-medium text-gray-700">{t('userRole')}</label>
                            <select value={role} onChange={e => setRole(e.target.value as UserRole)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                                <option value="teacher">{t('roleTeacher')}</option>
                                <option value="admin">{t('roleAdmin')}</option>
                            </select>
                        </div>
                    </div>
                    <div className="mt-8 flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">{t('cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-[#003366] text-white rounded-md hover:bg-[#005b9f]">{t('save')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AppContent = () => {
    const { user } = useAuth();
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    
    if (!user) {
        return (
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        );
    }
    
    return (
        <div className="flex flex-col min-h-screen bg-[#e6f0fa]">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
                <main className="flex-1 overflow-y-auto">
                     <button className="md:hidden p-4 text-[#001f3f]" onClick={() => setSidebarOpen(true)}>
                        <MenuIcon className="h-6 w-6" />
                    </button>
                    <Routes>
                        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                        <Route path="/schedule" element={<ProtectedRoute><BookingSchedulePage /></ProtectedRoute>} />
                        <Route path="/book" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />
                        <Route path="/admin-borrow" element={<ProtectedRoute adminOnly><AdminBorrowPage /></ProtectedRoute>} />
                        <Route path="/reports" element={<ProtectedRoute adminOnly><ReportsPage /></ProtectedRoute>} />
                        <Route path="/users" element={<ProtectedRoute adminOnly><UserManagementPage /></ProtectedRoute>} />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </main>
            </div>
            <Footer />
        </div>
    );
};

export default function App() {
  return (
    <LocalizationProvider>
      <AuthProvider>
        <BookingsProvider>
            <AppContent />
        </BookingsProvider>
      </AuthProvider>
    </LocalizationProvider>
  );
}