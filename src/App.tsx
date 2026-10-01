import React, {Suspense, lazy, useEffect, useLayoutEffect, useRef} from 'react';
import {Route, Routes, useLocation} from 'react-router-dom';
import {startLenis, scrollTop} from './lib/scroll';
import {primeSounds} from './lib/sound';
import {Cursor} from './ui/Cursor';
import {Header} from './ui/Header';
import {Footer} from './ui/Footer';
import {XpLayer} from './ui/XpLayer';
import {CommandPalette} from './ui/CommandPalette';
import {Home} from './pages/Home';

const Catalog = lazy(() => import('./pages/Catalog'));
const Subjects = lazy(() => import('./pages/Subjects'));
const Subject = lazy(() => import('./pages/Subject'));
const Topic = lazy(() => import('./pages/Topic'));
const ProgressPage = lazy(() => import('./pages/ProgressPage'));
const Lab = lazy(() => import('./pages/Lab'));
const NotFound = lazy(() => import('./pages/NotFound'));

export const App: React.FC = () => {
  const loc = useLocation();
  useEffect(() => {
    startLenis();
    const prime = () => {
      primeSounds();
      removeEventListener('pointerdown', prime);
    };
    addEventListener('pointerdown', prime);
  }, []);
  // new page → top; switching stages inside one topic keeps the place
  const prevPath = useRef(loc.pathname);
  useLayoutEffect(() => {
    const topicOf = (p: string) => (p.startsWith('/tema/') ? p.split('/')[2] : null);
    const same = topicOf(prevPath.current) && topicOf(prevPath.current) === topicOf(loc.pathname);
    prevPath.current = loc.pathname;
    if (!same) scrollTop();
  }, [loc.pathname]);
  const bare = loc.pathname.startsWith('/lab');
  return (
    <>
      {!bare && <Header />}
      <main id="main">
        <Suspense fallback={<div className="page-loading" />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/katalog" element={<Catalog />} />
            <Route path="/predmety" element={<Subjects />} />
            <Route path="/predmet/:id" element={<Subject />} />
            <Route path="/tema/:id/:stage?" element={<Topic />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/lab/:slug/:task?" element={<Lab />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      {!bare && <Footer />}
      <XpLayer />
      <CommandPalette />
      <Cursor />
      <div className="grain" aria-hidden />
    </>
  );
};
