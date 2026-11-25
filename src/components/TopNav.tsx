"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/lib/supabase/logout";
import { getCurrentAcademicYear, getCurrentTerm } from "@/lib/academic";
import styles from "./TopNav.module.css";

type Profile = {
  full_name: string;
  role: string;
  avatar_initials: string;
};

const studentNav = [
  { name: "Dashboard", href: "/" },
  { name: "My Subjects", href: "/roadmap" },
  { name: "Subjects", href: "/courses" },
  { name: "Discovery", href: "/discovery" },
  { name: "Profile", href: "/profile" },
];

const professorNav = [
  { name: "My Teaching", href: "/teacher" },
  { name: "Subjects", href: "/courses" },
  { name: "Profile", href: "/profile" },
];

const adminNav = [
  { name: "Panel", href: "/admin" },
  { name: "Stats", href: "/admin/stats" },
  { name: "Subjects", href: "/admin/courses" },
  { name: "Classes", href: "/admin/sections" },
  { name: "Students", href: "/admin/students" },
  { name: "Profile", href: "/profile" },
];

export default function TopNav({ profile }: { profile: Profile | null }) {
  const pathname = usePathname();
  const isAdmin = profile?.role === "admin";
  const isProfessor = profile?.role === "professor";
  const navItems = isAdmin ? adminNav : isProfessor ? professorNav : studentNav;
  const roleLabel = isAdmin ? "Administrator" : isProfessor ? "Professor" : "Student";

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href={isAdmin ? "/admin" : isProfessor ? "/teacher" : "/"} className={styles.brand}>
          <span className={styles.logo}>IT</span>
          <span className={styles.brandTextWrap}>
            <span className={styles.brandText}>IT Roadmap</span>
            <span className={styles.brandSub}>Learning Hub</span>
          </span>
        </Link>

        <nav className={styles.nav} aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive =
              item.href === "/" || item.href === "/admin" || item.href === "/teacher"
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className={styles.right}>
          <span className={styles.yearChip}>
            AY {getCurrentAcademicYear()} · {getCurrentTerm()}
          </span>

          <div className={styles.userChip}>
            <span className={styles.avatar}>{profile?.avatar_initials ?? "··"}</span>
            <span className={styles.userText}>
              <span className={styles.userName}>{profile?.full_name ?? "Loading..."}</span>
              <span className={styles.userRole}>{roleLabel}</span>
            </span>
          </div>

          <LogoutButton className={styles.logout} />
        </div>
      </div>
    </header>
  );
}
