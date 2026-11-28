import { redirect } from "next/navigation";
import BackButton from "@/components/BackButton";
import { createClient } from "@/lib/supabase/server";
import styles from "@/app/admin/admin.module.css";
import sectionStyles from "@/app/admin/sections/sections.module.css";
import activityStyles from "./activity.module.css";

type ActivityLog = {
  id: string;
  action: string;
  detail: string;
  course_id: string | null;
  metadata: { revision?: number } | null;
  created_at: string;
};

const actionMeta: Record<
  string,
  { label: string; icon: string; tone: string }
> = {
  roadmap_published: {
    label: "Roadmap published",
    icon: "🚀",
    tone: activityStyles.toneSuccess,
  },
  roadmap_draft_saved: {
    label: "Draft saved",
    icon: "💾",
    tone: activityStyles.toneAccent,
  },
  roadmap_draft_created: {
    label: "Draft opened",
    icon: "📝",
    tone: activityStyles.toneMuted,
  },
  roadmap_draft_deleted: {
    label: "Draft deleted",
    icon: "🗑️",
    tone: activityStyles.toneDanger,
  },
};

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function TeacherActivityPage() {
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
  if (profile?.role !== "professor") redirect("/");

  const { data } = await supabase
    .from("activity_logs")
    .select("id, action, detail, course_id, metadata, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const logs = (data ?? []) as ActivityLog[];

  return (
    <div className={styles.container}>
      <div>
        <BackButton fallbackHref="/teacher" className={styles.backLink} />
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>
              My <span className={styles.highlight}>Activity</span>
            </h1>
            <p className={styles.subtitle}>
              A record of the roadmap drafts and publications you made.
            </p>
          </div>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className={sectionStyles.card}>
          <h2 className={sectionStyles.cardTitle}>No activity yet</h2>
          <p className={sectionStyles.cardHint}>
            Open one of your subjects and save or publish a roadmap draft. Your actions will
            appear here.
          </p>
        </div>
      ) : (
        <div className={activityStyles.list}>
          {logs.map((log) => {
            const meta = actionMeta[log.action] ?? {
              label: log.action.replace(/_/g, " "),
              icon: "•",
              tone: activityStyles.toneMuted,
            };

            return (
              <article key={log.id} className={activityStyles.item}>
                <div className={`${activityStyles.icon} ${meta.tone}`}>
                  {meta.icon}
                </div>
                <div className={activityStyles.body}>
                  <div className={activityStyles.titleRow}>
                    <div className={activityStyles.titleGroup}>
                      <h2 className={activityStyles.action}>{meta.label}</h2>
                      {log.metadata?.revision ? (
                        <span className={activityStyles.revision}>
                          Revision {log.metadata.revision}
                        </span>
                      ) : null}
                    </div>
                    <time className={activityStyles.time} dateTime={log.created_at}>
                      {formatTimestamp(log.created_at)}
                    </time>
                  </div>
                  <p className={activityStyles.detail}>{log.detail}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
