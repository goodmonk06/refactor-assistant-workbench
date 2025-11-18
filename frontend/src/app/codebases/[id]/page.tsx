'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { codebaseApi, scanApi, planApi, Codebase, ScanRun, RefactorPlan } from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'

export default function CodebaseDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [codebase, setCodebase] = useState<Codebase | null>(null)
  const [scans, setScans] = useState<ScanRun[]>([])
  const [plans, setPlans] = useState<RefactorPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [showPlanForm, setShowPlanForm] = useState(false)
  const [planGoal, setPlanGoal] = useState('')
  const [selectedScanId, setSelectedScanId] = useState('')
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      const [codebaseRes, scansRes, plansRes] = await Promise.all([
        codebaseApi.get(id),
        scanApi.list(id),
        planApi.listForCodebase(id),
      ])
      setCodebase(codebaseRes.data)
      setScans(scansRes.data)
      setPlans(plansRes.data)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleScan = async () => {
    if (!codebase?.repoPath) {
      alert('Codebase must have a repoPath to scan')
      return
    }
    setScanning(true)
    try {
      await scanApi.create(id)
      setTimeout(() => loadData(), 2000) // Poll for updates
    } catch (error) {
      console.error('Failed to start scan:', error)
      alert('Failed to start scan')
    } finally {
      setScanning(false)
    }
  }

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedScanId || !planGoal) {
      alert('Please select a scan and enter a goal')
      return
    }
    setGenerating(true)
    try {
      await planApi.generate({
        codebaseId: id,
        scanId: selectedScanId,
        goal: planGoal,
      })
      setPlanGoal('')
      setSelectedScanId('')
      setShowPlanForm(false)
      loadData()
    } catch (error) {
      console.error('Failed to generate plan:', error)
      alert('Failed to generate plan')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!codebase) {
    return <div className="text-center py-12">Codebase not found</div>
  }

  const completedScans = scans.filter((s) => s.status === 'completed')

  return (
    <div>
      <div className="mb-6">
        <a href="/codebases" className="text-blue-500 hover:underline mb-2 inline-block">
          ← Back to Codebases
        </a>
        <h1 className="text-3xl font-bold">{codebase.name}</h1>
        <div className="text-gray-600 mt-2">
          {codebase.repoPath && <div>📁 {codebase.repoPath}</div>}
          {codebase.githubUrl && <div>🔗 {codebase.githubUrl}</div>}
          {codebase.mainLanguage && <div>💻 {codebase.mainLanguage}</div>}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Scans Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Scans</h2>
            <button
              onClick={handleScan}
              disabled={scanning || !codebase.repoPath}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {scanning ? 'Scanning...' : '+ Run Scan'}
            </button>
          </div>

          <div className="space-y-3">
            {scans.length === 0 ? (
              <div className="text-gray-500 text-center py-6">No scans yet</div>
            ) : (
              scans.map((scan) => (
                <div key={scan.id} className="bg-white shadow rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">
                        {new Date(scan.startedAt).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">
                        Status:{' '}
                        <span
                          className={
                            scan.status === 'completed'
                              ? 'text-green-600'
                              : scan.status === 'failed'
                              ? 'text-red-600'
                              : 'text-yellow-600'
                          }
                        >
                          {scan.status}
                        </span>
                      </div>
                      {scan.summaryJson && (
                        <div className="text-sm text-gray-600 mt-2">
                          {scan.summaryJson.totalFiles} files, {scan.summaryJson.totalLines} lines
                        </div>
                      )}
                    </div>
                    <a
                      href={`/scans/${scan.id}`}
                      className="text-blue-500 hover:text-blue-700 text-sm"
                    >
                      View
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Plans Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Refactor Plans</h2>
            <button
              onClick={() => setShowPlanForm(!showPlanForm)}
              disabled={completedScans.length === 0}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
            >
              {showPlanForm ? 'Cancel' : '+ Generate Plan'}
            </button>
          </div>

          {showPlanForm && (
            <form onSubmit={handleGeneratePlan} className="bg-white shadow rounded-lg p-4 mb-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Select Scan *</label>
                  <select
                    required
                    value={selectedScanId}
                    onChange={(e) => setSelectedScanId(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Choose a scan...</option>
                    {completedScans.map((scan) => (
                      <option key={scan.id} value={scan.id}>
                        {new Date(scan.startedAt).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Refactor Goal *</label>
                  <textarea
                    required
                    value={planGoal}
                    onChange={(e) => setPlanGoal(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    rows={3}
                    placeholder="e.g., Modularize the scheduling core to improve testability"
                  />
                </div>
                <button
                  type="submit"
                  disabled={generating}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
                >
                  {generating ? 'Generating...' : 'Generate Plan'}
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {plans.length === 0 ? (
              <div className="text-gray-500 text-center py-6">No plans yet</div>
            ) : (
              plans.map((plan) => (
                <div key={plan.id} className="bg-white shadow rounded-lg p-4">
                  <h3 className="font-semibold mb-1">
                    <a href={`/plans/${plan.id}`} className="hover:text-blue-600">
                      {plan.title}
                    </a>
                  </h3>
                  <div className="text-sm text-gray-600">
                    {plan._count?.tasks || 0} tasks · Created{' '}
                    {formatDistanceToNow(new Date(plan.createdAt))} ago
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
