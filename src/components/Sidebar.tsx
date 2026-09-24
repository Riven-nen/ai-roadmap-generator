"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/lib/supabase/logout";
import styles from "@/app/layout.module.css";

const navItems = [
  { name: "Dashboard", href: "/" },
  { name: "Roadmap", href: "/roadmap" },
  { name: "Discovery", href: "/discovery" },
  { name: "Courses", href: "/courses" },
  { name: "Profile", href: "/profile" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoContainer}>
        <div className={styles.logoIcon}>IT</div>
        <span className={styles.logoText}>IT Roadmap</span>
      </div>

      <div className={styles.userProfile}>
        <div className={styles.avatar}>JD</div>
        <div className={styles.userInfo}>
          <span className={styles.userName}>John Doe</span>
          <span className={styles.userRole}>CS Student</span>
        </div>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`${styles.navItem} ${
              pathname === item.href ? styles.navItemActive : ""
            }`}
          >
            {item.name}
          </Link>
        ))}
      </nav>

      <LogoutButton className={styles.logoutBtn} />
    </aside>
  );
}