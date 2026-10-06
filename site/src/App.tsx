import { Route, Routes } from 'react-router'
import { Layout } from './chrome/Layout'
import { NotFound } from './pages/NotFound'
import { RoutePage } from './pages/RoutePage'
import { routes } from './routes'

/** The site: one page for each route of the manifest, and the not-found page for any other path. */
export function App() {
  return (
    <Layout>
      <Routes>
        {routes.map((route) => (
          <Route key={route.path} path={route.path} element={<RoutePage route={route} />} />
        ))}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  )
}
