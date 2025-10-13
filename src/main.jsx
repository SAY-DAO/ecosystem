import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { CacheProvider } from '@emotion/react';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import { store } from './store/store';
import createEmotionCache from './createEmotionCache';
import { ColorModeProvider } from './components/ColorModeContextProvider';

const cacheRtl = createEmotionCache(); // keep your existing factory call

// ensure document-level RTL
if (typeof document !== 'undefined') {
  document.documentElement.dir = 'rtl'; // keep RTL consistently
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <CacheProvider value={cacheRtl}>
        <ColorModeProvider>
          <div dir="rtl">
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </div>
        </ColorModeProvider>
      </CacheProvider>
    </Provider>
  </React.StrictMode>
);
