import { motion } from 'framer-motion';
import { Dumbbell, Apple, TrendingUp, Phone, Loader2 } from 'lucide-react';

interface PatientOverviewProps {
  onCallDoctor: () => void;
  callActive: boolean;
}

export default function PatientOverview({ onCallDoctor, callActive }: PatientOverviewProps) {
  const recoveryProgress = 75;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Welcome Back, Amit!</h1>
        <p className="text-gray-600 dark:text-gray-400">Keep up the great work on your recovery journey</p>
      </div>

      {/* Recovery Progress Ring */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-8 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700"
      >
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Recovery Progress</h3>
          <div className="relative inline-flex items-center justify-center">
            <svg className="transform -rotate-90" width="200" height="200">
              <circle
                cx="100"
                cy="100"
                r="85"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-gray-200 dark:text-gray-700"
              />
              <circle
                cx="100"
                cy="100"
                r="85"
                stroke="url(#gradient)"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 85}`}
                strokeDashoffset={`${2 * Math.PI * 85 * (1 - recoveryProgress / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3FA9F5" />
                  <stop offset="100%" stopColor="#4ED1C5" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-5xl font-bold text-gray-800 dark:text-white">{recoveryProgress}%</span>
              <span className="text-sm text-gray-600 dark:text-gray-400 mt-1">Complete</span>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-6">
            You're making excellent progress! Keep following your treatment plan.
          </p>
        </div>
      </motion.div>

      {/* Quick Actions Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all text-left"
        >
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center mb-4">
            <Dumbbell className="w-7 h-7 text-white" />
          </div>
          <h3 className="font-bold text-gray-800 dark:text-white mb-2">Today's Exercise</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">3 exercises pending</p>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all text-left"
        >
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mb-4">
            <Apple className="w-7 h-7 text-white" />
          </div>
          <h3 className="font-bold text-gray-800 dark:text-white mb-2">Diet Plan</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">View your meal plan</p>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all text-left"
        >
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mb-4">
            <TrendingUp className="w-7 h-7 text-white" />
          </div>
          <h3 className="font-bold text-gray-800 dark:text-white mb-2">My Progress</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Track improvements</p>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCallDoctor}
          disabled={callActive}
          className="p-6 bg-gradient-to-br from-[#3FA9F5] to-[#4ED1C5] rounded-2xl shadow-lg hover:shadow-xl transition-all text-left disabled:opacity-70"
        >
          <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
            {callActive ? (
              <Loader2 className="w-7 h-7 text-white animate-spin" />
            ) : (
              <Phone className="w-7 h-7 text-white" />
            )}
          </div>
          <h3 className="font-bold text-white mb-2">
            {callActive ? 'Connecting...' : 'Call Doctor'}
          </h3>
          <p className="text-sm text-white/80">
            {callActive ? 'Please wait' : 'Speak to Dr. Arjun'}
          </p>
        </motion.button>
      </div>

      {/* Today's Schedule */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700"
      >
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Today's Schedule</h3>
        <div className="space-y-3">
          {[
            { time: '9:00 AM', task: 'Knee Flexion Exercise', status: 'Pending', color: 'blue' },
            { time: '11:00 AM', task: 'Morning Diet', status: 'Completed', color: 'green' },
            { time: '2:00 PM', task: 'Shoulder Rotation Exercise', status: 'Pending', color: 'blue' },
            { time: '6:00 PM', task: 'Evening Walk', status: 'Pending', color: 'blue' },
          ].map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#3FA9F5]" />
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">{item.task}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{item.time}</p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${item.status === 'Completed'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}
              >
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
