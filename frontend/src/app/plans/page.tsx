'use client'

import { useEffect, useState } from 'react'
import { planApi, RefactorPlan } from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'

export default function PlansPage() {
  const [plans, setPlans] = useState<RefactorPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      const response = await planApi.list()
      setPlans(response.data)
    } catch (error) {
      console.error('Failed to load plans:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Refactor Plans</h1>

      <div className="grid gap-4">
        {plans.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No plans yet. Create one from a codebase scan!
          </div>
        ) : (
          plans.map((plan) => (
            <div key={plan.id} className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">
                    <a href={`/plans/${plan.id}`} className="hover:text-blue-600">
                      {plan.title}
                    </a>
                  </h3>
                  {plan.codebase && (
                    <div className="text-sm text-gray-600 mb-2">
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
                    <div className="text-sm text-gray-700 mb-2 italic">
                      Goal: {plan.goal}
                    </div>
                  )}
                  <div className="text-sm text-gray-600">
                    {plan._count?.tasks || 0} tasks · Created{' '}
                    {formatDistanceToNow(new Date(plan.createdAt))} ago
                  </div>
                </div>
                <a
                  href={`/plans/${plan.id}`}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  View Board
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
