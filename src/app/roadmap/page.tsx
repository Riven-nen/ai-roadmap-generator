import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RoadmapClient from "./RoadmapClient";

export default async function RoadmapPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "admin") redirect("/admin");
  if (profile?.role === "professor") redirect("/teacher");

  return <RoadmapClient />;
}
