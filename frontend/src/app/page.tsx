export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center py-12">
        <h1 className="text-5xl font-bold mb-4">
          🔧 Refactor Assistant Workbench
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Plan and execute large-scale code refactoring with confidence
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-2xl font-semibold mb-3">📊 Scan Your Codebase</h2>
          <p className="text-gray-600 mb-4">
            Analyze your code to identify complexity hotspots, dependency patterns,
            and areas that need attention.
          </p>
          <a
            href="/codebases"
            className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Manage Codebases →
          </a>
        </div>

        <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-2xl font-semibold mb-3">🎯 Generate Refactor Plans</h2>
          <p className="text-gray-600 mb-4">
            Use AI to create structured refactoring plans with actionable tasks
            based on your codebase metrics.
          </p>
          <a
            href="/plans"
            className="inline-block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            View Plans →
          </a>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-8">
        <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
        <ol className="space-y-4">
          <li className="flex items-start">
            <span className="inline-block w-8 h-8 bg-blue-500 text-white rounded-full text-center mr-3">
              1
            </span>
            <div>
              <strong>Add Your Codebase</strong>
              <p className="text-gray-600">
                Connect a local repository path or GitHub URL
              </p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="inline-block w-8 h-8 bg-blue-500 text-white rounded-full text-center mr-3">
              2
            </span>
            <div>
              <strong>Run a Scan</strong>
              <p className="text-gray-600">
                Analyze metrics like complexity, dependencies, and file sizes
              </p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="inline-block w-8 h-8 bg-blue-500 text-white rounded-full text-center mr-3">
              3
            </span>
            <div>
              <strong>Generate a Plan</strong>
              <p className="text-gray-600">
                Let AI create a structured refactoring strategy with prioritized tasks
              </p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="inline-block w-8 h-8 bg-blue-500 text-white rounded-full text-center mr-3">
              4
            </span>
            <div>
              <strong>Track Progress</strong>
              <p className="text-gray-600">
                Use the kanban board to manage and complete refactoring tasks
              </p>
            </div>
          </li>
        </ol>
      </div>
    </div>
  )
}
