import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "IT Roadmap",
  description: "Learning Dashboard",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: {
    full_name: string;
    role: string;
    avatar_initials: string;
  } | null = null;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, role, avatar_initials")
      .eq("id", user.id)
      .single();

    if (data) profile = data;
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('it-roadmap-theme');if(t){document.documentElement.dataset.theme=t;}}catch(e){}})();",
          }}
        />
        <AppShell profile={profile}>{children}</AppShell>
      </body>
    </html>
  );
}
