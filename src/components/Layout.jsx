import React from 'react';
// import Navbar from './Navbar';
// import Footer from './Footer';

export default function Layout({ children }) {
  return (
    <div id="app-root">
      {/* <Navbar /> */}
      <main id="main-content">{children}</main>
      {/* <Footer /> */}
    </div>
  );
}
