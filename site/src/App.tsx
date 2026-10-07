import { lazy, Suspense } from 'react'
import { Route, Routes, useLocation } from 'react-router'
import { Layout } from './chrome/Layout'
import { Home } from './pages/Home'
import { NotFound } from './pages/NotFound'
import { PagePending } from './pages/PagePending'
import { RoutePage } from './pages/RoutePage'
import { routes } from './routes'

// The Foundations page carries the package's token file and the contrast contract, which no other page reads: it loads
// when its route is visited, so the other pages do not pay for it. A direct link preloads its chunk from the route's
// HTML (scripts/emit-route-html.ts, which lists the lazy pages); a client-side navigation shows the placeholder, which
// holds the height of a screen, until it arrives. The homepage is not lazy: it is the first screen of most visits.
const Foundations = lazy(() => import('./pages/Foundations').then(({ Foundations }) => ({ default: Foundations })))

/** The site: one page for each route of the manifest, and the not-found page for any other path. */
export function App() {
  const { pathname } = useLocation()

  return (
    <Layout>
      {/* Keyed by the path: the router navigates in a transition, which keeps the old page on screen while a lazy one
          loads. A new boundary shows its fallback at once, so the tall placeholder replaces the page within the click
          instead of the footer jumping when the chunk arrives. */}
      <Suspense key={pathname} fallback={<PagePending />}>
        <Routes>
          {routes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={
                route.key === 'foundations' ? (
                  <Foundations route={route} />
                ) : (
                  <RoutePage route={route}>{route.key === 'home' && <Home />}</RoutePage>
                )
              }
            />
          ))}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}
