'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import styles from './Navigation.module.css';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/transfer', label: 'Transfer' },
  { href: '/protocol', label: 'Protocol' },
];

export function Navigation() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <div className={styles.logoIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className={styles.logoText}>X-Pixel</span>
        </Link>

        {/* Desktop Links */}
        <div className={styles.links}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.link} ${pathname === link.href ? styles.active : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className={styles.cta}>
          <div className={styles.statusDot}>
            <span className="pulse-dot" />
            <span className={styles.statusLabel}>Live</span>
          </div>
          <Link href="/dashboard" className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>
            Launch Dashboard
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className={styles.menuToggle}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`${styles.menuLine} ${menuOpen ? styles.open : ''}`} />
          <span className={`${styles.menuLine} ${menuOpen ? styles.open : ''}`} />
          <span className={`${styles.menuLine} ${menuOpen ? styles.open : ''}`} />
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.mobileLink} ${pathname === link.href ? styles.active : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
