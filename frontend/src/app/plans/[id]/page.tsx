'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { planApi, taskApi, RefactorPlan, RefactorTask } from '@/lib/api'
import ReactMarkdown from 'react-markdown'

export default function PlanDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [plan, setPlan] = useState<RefactorPlan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlan()
  }, [id])

  const loadPlan = async () => {
    try {
      const response = await planApi.get(id)
      setPlan(response.data)
    } catch (error) {
      console.error('Failed to load plan:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (taskId: string, newStatus: RefactorTask['status']) => {
    try {
      await taskApi.update(taskId, { status: newStatus })
      loadPlan()
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!plan) {
    return <div className="text-center py-12">Plan not found</div>
  }

  const tasks = plan.tasks || []
  const todoTasks = tasks.filter((t) => t.status === 'todo')
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress')
  const doneTasks = tasks.filter((t) => t.status === 'done')

  return (
    <div>
      <div className="mb-6">
        <a href="/plans" className="text-blue-500 hover:underline mb-2 inline-block">
          ← Back to Plans
        </a>
        <h1 className="text-3xl font-bold">{plan.title}</h1>
        {plan.codebase && (
          <div className="text-gray-600 mt-2">
            Codebase:{' '}
            <a
              href={`/codebases/${plan.codebase.id}`}
              className="text-blue-500 hover:underline"
            >
              {plan.codebase.name}
            </a>
          </div>
        )}
        {plan.goal && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="font-semibold text-sm text-gray-700">Goal:</div>
            <div className="text-gray-800">{plan.goal}</div>
          </div>
        )}
      </div>

      {plan.descriptionMarkdown && (
        <div className="mb-6 p-6 bg-white shadow rounded-lg prose max-w-none">
          <ReactMarkdown>{plan.descriptionMarkdown}</ReactMarkdown>
        </div>
      )}

      <h2 className="text-2xl font-semibold mb-4">Tasks Kanban</h2>

      <div className="grid md:grid-cols-3 gap-4">
        {/* To Do Column */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold mb-3 flex items-center justify-between">
            <span>📋 To Do</span>
            <span className="bg-gray-200 text-gray-700 text-sm px-2 py-1 rounded">
              {todoTasks.length}
            </span>
          </h3>
          <div className="space-y-3">
            {todoTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
              />
            ))}
            {todoTasks.length === 0 && (
              <div className="text-center text-gray-400 py-8 text-sm">No tasks</div>
            )}
          </div>
        </div>

        {/* In Progress Column */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold mb-3 flex items-center justify-between">
            <span>🚧 In Progress</span>
            <span className="bg-blue-200 text-blue-700 text-sm px-2 py-1 rounded">
              {inProgressTasks.length}
            </span>
          </h3>
          <div className="space-y-3">
            {inProgressTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
              />
            ))}
            {inProgressTasks.length === 0 && (
              <div className="text-center text-gray-400 py-8 text-sm">No tasks</div>
            )}
          </div>
        </div>

        {/* Done Column */}
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="font-semibold mb-3 flex items-center justify-between">
            <span>✅ Done</span>
            <span className="bg-green-200 text-green-700 text-sm px-2 py-1 rounded">
              {doneTasks.length}
            </span>
          </h3>
          <div className="space-y-3">
            {doneTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
              />
            ))}
            {doneTasks.length === 0 && (
              <div className="text-center text-gray-400 py-8 text-sm">No tasks</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function TaskCard({
  task,
  onStatusChange,
}: {
  task: RefactorTask
  onStatusChange: (taskId: string, status: RefactorTask['status']) => void
}) {
  const [expanded, setExpanded] = useState(false)

  const priorityColors: Record<number, string> = {
    5: 'bg-red-100 text-red-800',
    4: 'bg-orange-100 text-orange-800',
    3: 'bg-yellow-100 text-yellow-800',
    2: 'bg-blue-100 text-blue-800',
    1: 'bg-gray-100 text-gray-800',
    0: 'bg-gray-100 text-gray-800',
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-sm flex-1">{task.title}</h4>
        <span
          className={`text-xs px-2 py-1 rounded ml-2 ${
            priorityColors[task.priority] || 'bg-gray-100 text-gray-800'
          }`}
        >
          P{task.priority}
        </span>
      </div>

      {task.areaPath && (
        <div className="text-xs text-gray-600 mb-2">📁 {task.areaPath}</div>
      )}

      {task.descriptionMarkdown && (
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-500 hover:text-blue-700 mb-2"
          >
            {expanded ? '▼ Hide details' : '▶ Show details'}
          </button>
          {expanded && (
            <div className="text-sm text-gray-700 mb-3 prose prose-sm max-w-none">
              <ReactMarkdown>{task.descriptionMarkdown}</ReactMarkdown>
            </div>
          )}
        </div>
      )}

      <select
        value={task.status}
        onChange={(e) => onStatusChange(task.id, e.target.value as RefactorTask['status'])}
        className="w-full text-xs border rounded px-2 py-1 mt-2"
      >
        <option value="todo">To Do</option>
        <option value="in_progress">In Progress</option>
        <option value="done">Done</option>
      </select>
    </div>
  )
}
