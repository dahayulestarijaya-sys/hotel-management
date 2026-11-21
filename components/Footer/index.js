import React from 'react';
import './style.scss';

const Footer = ({ className = '' }) => (
  <footer className={`footerArea ${className}`}>
    <span>&copy; {new Date().getFullYear()} HotelsQuad PMS · All rights reserved</span>
    <span className="footerMuted">Firestore-powered property management</span>
  </footer>
);

export default Footer;
