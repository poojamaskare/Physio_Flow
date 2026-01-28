import { motion } from 'framer-motion';
import { Plus, Save } from 'lucide-react';

export default function DoctorDiet() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Create Diet Plan</h2>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-lg transition-colors border border-slate-200 dark:border-slate-700 shadow-sm">
            Load Template
          </button>
          <button className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm">
            <Save className="w-4 h-4" />
            Save Plan
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {['Morning', 'Afternoon/Lunch', 'Evening/Dinner'].map((meal, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm"
          >
            <h3 className="font-bold text-cyan-400 mb-4">{meal}</h3>
            <textarea
              className="w-full h-32 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 resize-none text-sm"
              placeholder={`Enter ${meal.toLowerCase()} items...`}
            ></textarea>
            <div className="mt-4 flex justify-between items-center">
              <span className="text-xs text-slate-500">0 items added</span>
              <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-cyan-500 dark:text-cyan-400 transition-colors">
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
