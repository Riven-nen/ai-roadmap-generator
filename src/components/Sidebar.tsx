"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoutButton } from "@/lib/supabase/logout";
import { createClient } from "@/lib/supabase/client";
import styles from "@/app/layout.module.css";

const baseNavItems = [
  { name: "Dashboard", href: "/" },
  { name: "Roadmap", href: "/roadmap" },
  { name: "Discovery", href: "/discovery" },
  { name: "Courses", href: "/courses" },
  { name: "Profile", href: "/profile" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<{
    full_name: string;
    role: string;
    avatar_initials: string;
    user_role: string;
  } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("full_name, role, avatar_initials, user_role:role")
        .eq("id", user.id)
        .single()
        .then(({ data }) => setProfile(data));
    });
  }, []);

  const isAdmin = profile?.role === "admin";

  const navItems = isAdmin
    ? [...baseNavItems, { name: "Admin", href: "/admin" }]
    : baseNavItems;

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
          <span className={styles.userRole}>
            {isAdmin ? "Administrator" : "CS Student"}
          </span>
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