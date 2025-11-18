'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { scanApi, ScanRun } from '@/lib/api'

export default function ScanDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [scan, setScan] = useState<ScanRun | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadScan()
  }, [id])

  const loadScan = async () => {
    try {
      const response = await scanApi.get(id)
      setScan(response.data)
    } catch (error) {
      console.error('Failed to load scan:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!scan) {
    return <div className="text-center py-12">Scan not found</div>
  }

  const summary = scan.summaryJson as any

  return (
    <div>
      <div className="mb-6">
        <a href={`/codebases/${scan.codebaseId}`} className="text-blue-500 hover:underline mb-2 inline-block">
          ← Back to Codebase
        </a>
        <h1 className="text-3xl font-bold">Scan Details</h1>
        <div className="text-gray-600 mt-2">
          <div>Started: {new Date(scan.startedAt).toLocaleString()}</div>
          {scan.finishedAt && <div>Finished: {new Date(scan.finishedAt).toLocaleString()}</div>}
          <div>
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
        </div>
      </div>

      {scan.status === 'failed' && scan.errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="font-semibold text-red-800">Error:</div>
          <div className="text-red-700">{scan.errorMessage}</div>
        </div>
      )}

      {summary && (
        <div className="space-y-6">
          {/* Overview */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Overview</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded">
                <div className="text-3xl font-bold text-blue-600">{summary.totalFiles}</div>
                <div className="text-gray-600">Total Files</div>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <div className="text-3xl font-bold text-green-600">
                  {summary.totalLines?.toLocaleString()}
                </div>
                <div className="text-gray-600">Total Lines</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded">
                <div className="text-3xl font-bold text-yellow-600">{summary.averageComplexity}</div>
                <div className="text-gray-600">Avg Complexity</div>
              </div>
            </div>
          </div>

          {/* Languages */}
          {summary.languages && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Languages</h2>
              <div className="space-y-2">
                {Object.entries(summary.languages).map(([lang, count]: [string, any]) => (
                  <div key={lang} className="flex justify-between items-center">
                    <span className="capitalize">{lang}</span>
                    <span className="bg-gray-200 px-3 py-1 rounded">{count} files</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hotspots */}
          {summary.hotspots && summary.hotspots.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Complexity Hotspots</h2>
              <div className="text-sm text-gray-600 mb-4">
                Files with high complexity (&gt; 20) or large size (&gt; 500 lines)
              </div>
              <div className="space-y-3">
                {summary.hotspots.map((hotspot: any, idx: number) => (
                  <div key={idx} className="border-l-4 border-red-500 pl-4 py-2">
                    <div className="font-mono text-sm">{hotspot.path}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      <span className="mr-4">📏 {hotspot.lines} lines</span>
                      <span className="mr-4">🔢 Complexity: {hotspot.complexity}</span>
                      <span>📦 {hotspot.imports?.length || 0} imports</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {scan.status === 'running' && (
        <div className="text-center py-12">
          <div className="text-xl text-gray-600">Scan is still running...</div>
          <div className="text-sm text-gray-500 mt-2">Refresh this page to see updates</div>
        </div>
      )}
    </div>
  )
}
