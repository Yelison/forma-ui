import { lazy, Suspense } from 'react'
import { Route, Routes, useLocation } from 'react-router'
import { Layout } from './chrome/Layout'
import { Messages, pageCatalogs, routeCatalogs } from './i18n'
import { Home } from './pages/Home'
import { NotFound } from './pages/NotFound'
import { PagePending } from './pages/PagePending'
import { RoutePage } from './pages/RoutePage'
import { routes, type RouteKey, type SiteRoute } from './routes'

// The Foundations page carries the package's token file and the contrast contract, which no other page reads, the
// catalog the specimens of every family, and the reference of a component its examples and its API: each loads when its
// route is visited, so the other pages do not pay for it. A direct link preloads its chunk from the route's HTML
// (scripts/emit-route-html.ts, which lists the lazy pages); a client-side navigation shows the placeholder, which holds
// the height of a screen, until it arrives. The homepage is not lazy: it is the first screen of most visits.
const loadFoundations = () => import('./pages/Foundations').then(({ Foundations }) => ({ default: Foundations }))
const loadCatalogPage = () => import('./pages/CatalogPage').then(({ CatalogPage }) => ({ default: CatalogPage }))
const loadComponentDetail = () =>
  import('./pages/ComponentDetail').then(({ ComponentDetail }) => ({ default: ComponentDetail }))

const Foundations = lazy(loadFoundations)
const CatalogPage = lazy(loadCatalogPage)
const ComponentDetail = lazy(loadComponentDetail)

// Starts the fetch of the chunk of a page that loads on demand. Asking again is free: the module system answers with
// the one request, and `lazy` finds it done.
const preloadPage: Partial<Record<RouteKey, () => Promise<unknown>>> = {
  foundations: loadFoundations,
  components: loadCatalogPage,
  component: loadComponentDetail,
}

function PageOf({ route }: { route: SiteRoute }) {
  switch (route.key) {
    case 'foundations':
      return <Foundations route={route} />
    case 'components':
      return <CatalogPage route={route} />
    case 'component':
      return <ComponentDetail route={route} />
    default:
      return <RoutePage route={route}>{route.key === 'home' && <Home />}</RoutePage>
  }
}

/**
 * The page of a route with the messages it needs besides the ones of the chrome (src/i18n/routeCatalogs.ts).
 *
 * The messages suspend before the page below them renders, so a page that loads on demand would only ask for its chunk
 * once they had arrived: it is asked for here, and the chunk and the messages travel together.
 */
function RoutePageWithMessages({ route }: { route: SiteRoute }) {
  // A chunk that fails to load is reported by `lazy`, when the page renders; this request has nobody to tell.
  preloadPage[route.key]?.().catch(() => {})
  const catalogs = pageCatalogs(route)
  const page = <PageOf route={route} />
  return catalogs.length === 0 ? page : <Messages catalogs={routeCatalogs(route)}>{page}</Messages>
}

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
            <Route key={route.path} path={route.path} element={<RoutePageWithMessages route={route} />} />
          ))}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}
