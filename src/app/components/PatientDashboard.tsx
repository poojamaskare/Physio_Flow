import { useState } from 'react';
import {
  Activity,
  Apple,
  TrendingUp,
  LogOut,
  Menu,
  X,
  User,
  Dumbbell,
  Phone
} from 'lucide-react';
import PatientOverview from './PatientOverview';
import ExercisePage from './ExercisePage';
import PatientDietPlan from './PatientDietPlan';
import ProgressPage from './ProgressPage';
import ThemeToggle from './ThemeToggle';

interface PatientDashboardProps {
  onLogout: () => void;
}

export default function PatientDashboard({ onLogout }: PatientDashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [callActive, setCallActive] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'exercise', label: 'Exercise', icon: Dumbbell },
    { id: 'diet', label: 'Diet Plan', icon: Apple },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
  ];

  const handleCallDoctor = () => {
    setCallActive(true);
    // Simulate call
    setTimeout(() => {
      alert('Connecting to Dr. Arjun Sharma...');
      setCallActive(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#F5FAFF] dark:bg-gray-900 transition-colors duration-300">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg"
      >
        {sidebarOpen ? <X className="w-6 h-6 dark:text-white" /> : <Menu className="w-6 h-6 dark:text-white" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 shadow-xl z-40 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 border-r border-gray-100 dark:border-gray-700`}
      >
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800 dark:text-white">Patient Portal</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Amit Kumar</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === item.id
                ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-white shadow-lg shadow-cyan-500/20'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-cyan-600 dark:hover:text-cyan-400'
                }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-4 left-4 right-4 space-y-2">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all duration-200 border border-transparent hover:border-red-100 dark:hover:border-red-900/20"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8 transition-all duration-300 relative">
        <ThemeToggle className="absolute top-4 right-4 lg:top-8 lg:right-8 z-50" />
        <div className="max-w-7xl mx-auto space-y-6">
          {activeTab === 'dashboard' && <PatientOverview onCallDoctor={handleCallDoctor} callActive={callActive} />}
          {activeTab === 'exercise' && <ExercisePage />}
          {activeTab === 'diet' && <PatientDietPlan />}
          {activeTab === 'progress' && <ProgressPage />}
        </div>
      </main>
    </div>
  );
}
