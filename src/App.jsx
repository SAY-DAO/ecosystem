import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Loader from './components/Loader';
import './i18n';
import './index.css'

const Reports = lazy(() => import('./pages/ResponsiveDrawer'));
const Reports2 = lazy(() => import('./pages/Reports2'));

export default function App() {
  return (
    <Suspense fallback={<Loader />}>
      <Layout>
        <Routes>
          <Route path="/" element={<Reports />} />
          <Route path="/1" element={<Reports2 />} />
          {/* add other routes here */}
        </Routes>
      </Layout>
    </Suspense>
  );
}
