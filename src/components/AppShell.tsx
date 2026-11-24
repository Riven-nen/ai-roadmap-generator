"use client";

import { usePathname } from "next/navigation";
import TopNav from "./TopNav";
import styles from "@/app/layout.module.css";

export type ShellProfile = {
  full_name: string;
  role: string;
  avatar_initials: string;
};

export default function AppShell({
  children,
  profile,
}: {
  children: React.ReactNode;
  profile: ShellProfile | null;
}) {
  const pathname = usePathname();
  const isAuthPage = ["/login", "/forgot-password", "/reset-password"].includes(pathname);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className={styles.appShell}>
      <TopNav profile={profile} />
      <main className={styles.appContent}>{children}</main>
    </div>
  );
}
