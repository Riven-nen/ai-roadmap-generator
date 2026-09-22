import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import styles from "./layout.module.css";

export const metadata: Metadata = {
  title: "IT Roadmap",
  description: "Learning Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navItems = [
    { name: "Dashboard", href: "/" },
    { name: "Roadmap", href: "/roadmap" },
    { name: "Discovery", href: "/discovery" },
    { name: "Courses", href: "/courses" },
    { name: "Profile", href: "/profile" },
  ];

  return (
    <html lang="en">
      <body>
        <div className={styles.container}>
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
                <Link key={item.name} href={item.href} className={styles.navItem}>
                  {item.name}
                </Link>
              ))}
            </nav>

            <button className={styles.logoutBtn}>Logout</button>
          </aside>

          <main className={styles.mainContent}>{children}</main>
        </div>
      </body>
    </html>
  );
}