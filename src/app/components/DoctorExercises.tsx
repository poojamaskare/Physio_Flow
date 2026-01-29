import { motion } from 'framer-motion';
import { CloudUpload, Plus, Video, Search } from 'lucide-react';

export default function DoctorExercises() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Assign Exercises</h2>

      {/* Upload Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 border-2 border-dashed border-slate-700 rounded-2xl bg-slate-800/50 hover:bg-slate-800 transition-colors text-center cursor-pointer"
      >
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400/20 to-teal-400/20 mx-auto flex items-center justify-center mb-4">
          <CloudUpload className="w-8 h-8 text-cyan-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">Upload Reference Video</h3>
        <p className="text-slate-400 text-sm mb-4">Drag and drop or click to browse</p>
        <button className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium">
          Select File
        </button>
      </motion.div>

      {/* Assignment Section */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Search exercises..." 
              className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
            />
            <button className="p-3 bg-slate-800 border border-slate-700 rounded-xl text-cyan-400 hover:bg-slate-700">
              <Search className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-2">
            {['Squats', 'Lunges', 'Shoulder Press', 'Knee Extensions'].map((ex, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-800 rounded-xl border border-slate-700">
                <div className="flex items-center gap-3">
                  <Video className="w-5 h-5 text-slate-500" />
                  <span className="text-white">{ex}</span>
                </div>
                <button className="p-1.5 hover:bg-cyan-500/20 rounded-lg text-cyan-400 transition-colors">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 bg-slate-800 rounded-2xl border border-slate-700">
          <h3 className="font-bold text-white mb-4">Assignment Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Posture Accuracy Threshold</label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                defaultValue="80"
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Medium (50%)</span>
                <span>Strict (80%)</span>
                <span>Expert (95%)</span>
              </div>
            </div>
            
            <button className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold rounded-xl transition-colors mt-4">
              Save Treatment Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
