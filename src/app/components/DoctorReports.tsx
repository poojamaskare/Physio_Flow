import React, { useState, useMemo } from 'react'
import { 
    FileText, 
    TrendingUp, 
    Activity, 
    Calendar, 
    AlertCircle, 
    CheckCircle2, 
    Download, 
    ChevronDown, 
    Brain, 
    User,
    BarChart3
} from 'lucide-react'

interface DoctorReportsProps {
    patients: any[]
    assignments: any[]
    exercises?: any[]
}

export default function DoctorReports({ patients, assignments, exercises = [] }: DoctorReportsProps) {
    const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || '')

    // Ensure selectedPatientId is valid if patients list changes
    React.useEffect(() => {
        if (patients.length > 0 && !patients.find(p => p.id === selectedPatientId)) {
            setSelectedPatientId(patients[0].id)
        }
    }, [patients, selectedPatientId])

    // Filter assignments for selected patient
    const patientAssignments = useMemo(() => {
        const filtered = assignments.filter(a => a.patient_id === selectedPatientId)
        console.log('DoctorReports Debug:', {
            selectedPatientId,
            allAssignmentsCount: assignments.length,
            filteredAssignmentsCount: filtered.length,
            firstAssignment: filtered[0],
            allAssignmentsSample: assignments.slice(0, 3)
        })
        return filtered
    }, [assignments, selectedPatientId])

    const selectedPatient = patients.find(p => p.id === selectedPatientId)

    // Calculate real metrics
    const totalAssigned = patientAssignments.length
    
    // Robust completion check
    const completedAssignments = patientAssignments.filter(a => {
        const status = a.status?.toLowerCase()
        const isCompletedBool = a.completed === true || a.completed === 'true'
        return status === 'completed' || isCompletedBool
    }).length

    const complianceRate = totalAssigned > 0 ? Math.round((completedAssignments / totalAssigned) * 100) : 0

    // Reactive Mock Metrics - Updates based on REAL progress (completed assignments)
    const mockAIMetrics = useMemo(() => {
        // Base values derived from patient ID for consistency
        const seed = selectedPatientId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        const baseAccuracy = 70 + (seed % 15) // 70-85 base
        const basePain = 6 + (seed % 4) // 6-9 base

        // Improvement logic: Metrics coincide with completed sessions
        // 3 completed assignments = ~1 week of progress
        const accuracyGain = Math.min(15, completedAssignments * 1.5) // Cap gain at 15%
        const painReduction = Math.min(5, completedAssignments * 0.5) // Cap reduction at 5 levels
        const romGain = Math.min(25, completedAssignments * 2)

        return {
            postureAccuracy: Math.round(baseAccuracy + accuracyGain),
            painLevel: Math.max(1, Math.round(basePain - painReduction)),
            painTrend: completedAssignments > 2 ? 'decreasing' : 'stable',
            romImprovement: romGain,
            sessionsCompleted: completedAssignments * 3, // Assuming 3 sessions/assignment
            riskLevel: complianceRate < 50 ? 'High' : 'Low'
        }
    }, [selectedPatientId, complianceRate, completedAssignments])

    const getExerciseName = (exerciseId: string) => {
        return exercises.find(e => e.id === exerciseId)?.name || 'Unknown Exercise'
    }

    // Sort assignments by date (most recent first)
    const sortedAssignments = [...patientAssignments].sort((a, b) => {
        const dateA = new Date(a.completed_at || a.created_at || 0).getTime()
        const dateB = new Date(b.completed_at || b.created_at || 0).getTime()
        return dateB - dateA
    })

    const handleExport = async () => {
        if (!selectedPatient) return

        try {
            // Dynamic import to avoid SSR issues
            const jsPDF = (await import('jspdf')).default
            const autoTable = (await import('jspdf-autotable')).default

            const doc = new jsPDF()

            // Header
            doc.setFillColor(6, 182, 212) // Cyan-500
            doc.rect(0, 0, 210, 40, 'F')
            
            doc.setTextColor(255, 255, 255)
            doc.setFontSize(24)
            doc.text('PhysioFlow', 20, 20)
            doc.setFontSize(12)
            doc.text('Clinical Rehabilitation Report', 20, 30)

            // Patient Info
            doc.setTextColor(0, 0, 0)
            doc.setFontSize(10)
            doc.text(`Patient: ${selectedPatient.name}`, 20, 50)
            doc.text(`ID: ${selectedPatient.id}`, 20, 55)
            doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 50)
            
            // Key Metrics
            doc.setFontSize(14)
            doc.text('Key Metrics', 20, 70)
            
            // Draw metric boxes
            const metrics = [
                { label: 'Compliance', value: `${complianceRate}%` },
                { label: 'Accuracy', value: `${mockAIMetrics.postureAccuracy}%` },
                { label: 'Pain Level', value: `${mockAIMetrics.painLevel}/10` },
                { label: 'Sessions', value: `${mockAIMetrics.sessionsCompleted}` }
            ]

            let x = 20
            metrics.forEach(m => {
                doc.setDrawColor(200, 200, 200)
                doc.rect(x, 75, 40, 25)
                doc.setFontSize(8)
                doc.text(m.label, x + 2, 80)
                doc.setFontSize(12)
                doc.setFont("helvetica", "bold")
                doc.text(m.value, x + 2, 92)
                doc.setFont("helvetica", "normal")
                x += 45
            })

            // Session History Table with DATE
            doc.setFontSize(14)
            doc.text('Session History', 20, 115)

            const tableData = sortedAssignments.map(a => [
                new Date(a.completed_at || a.created_at).toLocaleDateString(),
                getExerciseName(a.exercise_id),
                `${a.sets}x${a.reps_per_set}`,
                a.status === 'completed' || a.completed ? 'Completed' : 'Pending',
                a.notes || '-'
            ])

            autoTable(doc, {
                startY: 120,
                head: [['Date', 'Exercise', 'Sets/Reps', 'Status', 'Notes']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [6, 182, 212] }
            })

            // Footer
            const pageCount = (doc as any).internal.getNumberOfPages()
            for(let i = 1; i <= pageCount; i++) {
                doc.setPage(i)
                doc.setFontSize(8)
                doc.setTextColor(150)
                doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' })
                doc.text('Generated by PhysioFlow AI', 20, 290)
            }

            doc.save(`PhysioFlow_Report_${selectedPatient.name.replace(' ', '_')}.pdf`)
        } catch (error) {
            console.error('Export failed:', error)
            alert('Failed to generate PDF. Please try again.')
        }
    }

    if (patients.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500">
                <FileText size={48} className="mb-4 opacity-50" />
                <p>No patients available for reports.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-white/5">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">Clinical Reports</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">AI-driven insights & patient progress tracking</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <select 
                            value={selectedPatientId}
                            onChange={(e) => setSelectedPatientId(e.target.value)}
                            className="appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 pr-10 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500/50 min-w-[200px]"
                        >
                            {patients.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>

                    <button 
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-medium hover:opacity-90 transition-opacity"
                    >
                        <Download size={18} />
                        <span className="hidden sm:inline">Export</span>
                    </button>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Compliance Card */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2 text-slate-500 dark:text-slate-400">
                        <CheckCircle2 size={18} />
                        <span className="text-sm font-medium">Compliance Rate</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className={`text-3xl font-bold ${complianceRate >= 80 ? 'text-emerald-500' : 'text-amber-500'}`}>{complianceRate}%</span>
                        <span className="text-sm text-slate-400 mb-1">adherence</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 ${complianceRate >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${complianceRate}%` }}></div>
                    </div>
                </div>

                {/* AI Accuracy Card */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2 text-slate-500 dark:text-slate-400">
                        <Brain size={18} />
                        <span className="text-sm font-medium">Posture Accuracy</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold text-cyan-500">{mockAIMetrics.postureAccuracy.toFixed(0)}%</span>
                        <span className="text-sm text-slate-400 mb-1">avg. score</span>
                    </div>
                    <p className="text-xs text-emerald-500 mt-3 font-medium flex items-center gap-1">
                        <TrendingUp size={12} /> +{mockAIMetrics.romImprovement}% ROM improvement
                    </p>
                </div>

                {/* Pain Level Card */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2 text-slate-500 dark:text-slate-400">
                        <Activity size={18} />
                        <span className="text-sm font-medium">Avg. Pain Level</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold text-slate-900 dark:text-white">{mockAIMetrics.painLevel}<span className="text-lg text-slate-400">/10</span></span>
                    </div>
                    <p className="text-xs text-emerald-500 mt-3 font-medium flex items-center gap-1">
                        <TrendingUp size={12} className="rotate-180" /> Reportedly decreasing
                    </p>
                </div>

                {/* Active Sessions Card */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2 text-slate-500 dark:text-slate-400">
                        <Calendar size={18} />
                        <span className="text-sm font-medium">Sessions Done</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold text-purple-500">{mockAIMetrics.sessionsCompleted}</span>
                        <span className="text-sm text-slate-400 mb-1">total sessions</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-3">Last session: Today</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Detailed Analysis */}
                <div className="lg:col-span-2 space-y-6">
                    {/* AI Insights Block */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Brain className="text-cyan-500" size={20} />
                            AI Motion Analysis
                        </h3>
                        
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-white/5">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-semibold text-slate-900 dark:text-white">Shoulder Mobility (ROM)</h4>
                                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-lg">High Imp.</span>
                                </div>
                                <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full mb-2">
                                    <div className="h-full bg-cyan-500 rounded-full" style={{ width: '85%' }}></div>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Patient has shown a 15% increase in max extension angle over the last 3 sessions.</p>
                            </div>

                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-white/5">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-semibold text-slate-900 dark:text-white">Form Consistency</h4>
                                    <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-lg">Stable</span>
                                </div>
                                <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full mb-2">
                                    <div className="h-full bg-amber-400 rounded-full" style={{ width: '72%' }}></div>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Squat depth consistent, but detected back rounding in late reps (Set 3).</p>
                            </div>
                        </div>
                    </div>

                    {/* Session History Table */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Calendar className="text-purple-500" size={20} />
                            Recent Session History
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50">
                                    <tr>
                                        <th className="px-4 py-3 rounded-l-lg">Date</th>
                                        <th className="px-4 py-3">Exercise</th>
                                        <th className="px-4 py-3">Sets/Reps</th>
                                        <th className="px-4 py-3">Duration</th>
                                        <th className="px-4 py-3 rounded-r-lg">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {sortedAssignments.length > 0 ? sortedAssignments.slice(0, 5).map(a => (
                                        <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3 text-slate-500 text-xs">
                                                {new Date(a.completed_at || a.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 font-medium">{getExerciseName(a.exercise_id)}</td>
                                            <td className="px-4 py-3 text-slate-500">{a.sets} × {a.reps_per_set}</td>
                                            <td className="px-4 py-3 text-slate-500">~15m</td>
                                            <td className="px-4 py-3">
                                                {(a.status?.toLowerCase() === 'completed' || a.completed === true || a.completed === 'true') ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                                                        <CheckCircle2 size={12} /> Done
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                        Pending
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-8 text-center text-slate-500">No exercises found for this patient.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Column: Doctor Notes & Profile */}
                <div className="space-y-6">
                    {/* Patient Profile Snapshot */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 p-6 rounded-2xl shadow-sm text-white">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-400 flex items-center justify-center text-2xl font-bold shadow-lg shadow-cyan-500/30">
                                {selectedPatient?.name?.charAt(0) || 'P'}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">{selectedPatient?.name}</h3>
                                <p className="text-slate-400 text-sm">Patient ID: #{selectedPatient?.id?.slice(0,6)}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-400 uppercase tracking-wider font-bold">Injury</label>
                                <p className="font-medium">{selectedPatient?.injury || 'General Rehab'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-400 uppercase tracking-wider font-bold">Age</label>
                                    <p className="font-medium">{selectedPatient?.age || '--'}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 uppercase tracking-wider font-bold">Sex</label>
                                    <p className="font-medium">Female</p> {/* Mocked */}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Doctor Notes */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <FileText className="text-slate-500" size={20} />
                            Doctor's Notes
                        </h3>
                        <textarea 
                            className="w-full h-40 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                            placeholder="Add clinical observations, treatment adjustments, or private notes..."
                        ></textarea>
                        <button className="w-full mt-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium transition-colors">
                            Save Notes
                        </button>
                    </div>

                    {/* Effectiveness Card */}
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
                        <h4 className="font-bold text-emerald-800 dark:text-emerald-400 mb-2 flex items-center gap-2">
                            <TrendingUp size={18} /> Most Effective
                        </h4>
                        <p className="text-sm text-emerald-700 dark:text-emerald-300">
                            <strong>Shoulder Abduction</strong> yields the highest accuracy (92%) and patient compliance.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
