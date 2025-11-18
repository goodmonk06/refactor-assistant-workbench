import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Refactor Assistant Workbench',
  description: 'Plan and track large-scale code refactoring efforts',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <nav className="bg-gray-800 text-white p-4">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <a href="/" className="text-xl font-bold">
                🔧 Refactor Workbench
              </a>
              <div className="flex space-x-4">
                <a href="/codebases" className="hover:text-gray-300">
                  Codebases
                </a>
                <a href="/plans" className="hover:text-gray-300">
                  Plans
                </a>
              </div>
            </div>
          </div>
        </nav>
        <main className="container mx-auto p-6">
          {children}
        </main>
      </body>
    </html>
  )
}
