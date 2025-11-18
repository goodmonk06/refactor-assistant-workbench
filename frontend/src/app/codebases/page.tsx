'use client'

import { useEffect, useState } from 'react'
import { codebaseApi, Codebase } from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'

export default function CodebasesPage() {
  const [codebases, setCodebases] = useState<Codebase[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    repoPath: '',
    githubUrl: '',
    mainLanguage: '',
  })

  useEffect(() => {
    loadCodebases()
  }, [])

  const loadCodebases = async () => {
    try {
      const response = await codebaseApi.list()
      setCodebases(response.data)
    } catch (error) {
      console.error('Failed to load codebases:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await codebaseApi.create(formData)
      setFormData({ name: '', repoPath: '', githubUrl: '', mainLanguage: '' })
      setShowForm(false)
      loadCodebases()
    } catch (error) {
      console.error('Failed to create codebase:', error)
      alert('Failed to create codebase')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this codebase?')) return
    try {
      await codebaseApi.delete(id)
      loadCodebases()
    } catch (error) {
      console.error('Failed to delete codebase:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Codebases</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {showForm ? 'Cancel' : '+ Add Codebase'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">New Codebase</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="My Project"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Local Repository Path</label>
              <input
                type="text"
                value={formData.repoPath}
                onChange={(e) => setFormData({ ...formData, repoPath: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="/path/to/repo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">GitHub URL</label>
              <input
                type="url"
                value={formData.githubUrl}
                onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="https://github.com/user/repo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Main Language</label>
              <input
                type="text"
                value={formData.mainLanguage}
                onChange={(e) => setFormData({ ...formData, mainLanguage: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="TypeScript"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Create Codebase
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4">
        {codebases.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No codebases yet. Add one to get started!
          </div>
        ) : (
          codebases.map((codebase) => (
            <div key={codebase.id} className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">
                    <a href={`/codebases/${codebase.id}`} className="hover:text-blue-600">
                      {codebase.name}
                    </a>
                  </h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    {codebase.repoPath && <div>📁 {codebase.repoPath}</div>}
                    {codebase.githubUrl && (
                      <div>
                        🔗 <a href={codebase.githubUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                          {codebase.githubUrl}
                        </a>
                      </div>
                    )}
                    {codebase.mainLanguage && <div>💻 {codebase.mainLanguage}</div>}
                    <div>📅 Created {formatDistanceToNow(new Date(codebase.createdAt))} ago</div>
                  </div>
                  <div className="mt-3 flex gap-4 text-sm">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded">
                      {codebase._count?.scanRuns || 0} scans
                    </span>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded">
                      {codebase._count?.refactorPlans || 0} plans
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`/codebases/${codebase.id}`}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    View
                  </a>
                  <button
                    onClick={() => handleDelete(codebase.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
