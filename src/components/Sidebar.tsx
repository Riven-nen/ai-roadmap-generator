"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/lib/supabase/logout";
import styles from "@/app/layout.module.css";

const studentNavItems = [
  { name: "Dashboard", href: "/" },
  { name: "Roadmap", href: "/roadmap" },
  { name: "Discovery", href: "/discovery" },
  { name: "Subjects", href: "/courses" },
  { name: "Profile", href: "/profile" },
];

const adminNavItems = [
  { name: "Admin", href: "/admin" },
  { name: "Subjects", href: "/admin/courses" },
  { name: "Classes", href: "/admin/sections" },
  { name: "Students", href: "/admin/students" },
  { name: "Profile", href: "/profile" },
];

const professorNavItems = [
  { name: "My Teaching", href: "/teacher" },
  { name: "Profile", href: "/profile" },
];

export default function Sidebar({
  profile,
}: {
  profile: {
    full_name: string;
    role: string;
    avatar_initials: string;
  } | null;
}) {
  const pathname = usePathname();
  const isAdmin = profile?.role === "admin";
  const isProfessor = profile?.role === "professor";

  const navItems = isAdmin
    ? adminNavItems
    : isProfessor
      ? professorNavItems
      : studentNavItems;

  const roleLabel = isAdmin
    ? "Administrator"
    : isProfessor
      ? "Professor"
      : "CS Student";

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoContainer}>
        <div className={styles.logoIcon}>IT</div>
        <span className={styles.logoText}>IT Roadmap</span>
      </div>

      <div className={styles.userProfile}>
        <div className={styles.avatar}>{profile?.avatar_initials ?? "??"}</div>
        <div className={styles.userInfo}>
          <span className={styles.userName}>{profile?.full_name ?? "Loading..."}</span>
          <span className={styles.userRole}>{roleLabel}</span>
        </div>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => {
          const isActive =
            item.href === "/" || item.href === "/admin"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      <LogoutButton className={styles.logoutBtn} />
    </aside>
  );
}
