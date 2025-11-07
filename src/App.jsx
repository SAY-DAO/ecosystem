import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Loader from './components/Loader';
import './i18n';
import './index.css';

const ResponsiveDrawer = lazy(() => import('./pages/ResponsiveDrawer'));

export default function App() {
  return (
    <Suspense fallback={<Loader />}>
      <Layout>
        <Routes>
          <Route path="/" element={<ResponsiveDrawer />} />
          {/* add other routes here */}
        </Routes>
      </Layout>
    </Suspense>
  );
}
