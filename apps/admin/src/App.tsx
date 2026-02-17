import { AppRouter } from './app/router'
import { Providers } from './app/providers'
import { ErrorBoundary } from './shared/components/ErrorBoundary'

function App() {
  return (
    <Providers>
      <ErrorBoundary>
        <AppRouter />
      </ErrorBoundary>
    </Providers>
  )
}

export default App
