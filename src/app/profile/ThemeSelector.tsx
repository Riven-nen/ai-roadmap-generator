"use client";

import { useSyncExternalStore } from "react";
import styles from "./profile.module.css";

type ThemeOption = {
  id: string;
  name: string;
  description: string;
  bg: string;
  card: string;
  sidebar: string;
  accent: string;
  strong: string;
};

const themes: ThemeOption[] = [
  {
    id: "calm",
    name: "Calm",
    description: "Soft sage and warm neutrals",
    bg: "#f5f3ee",
    card: "#fdfcf9",
    sidebar: "#2c3a37",
    accent: "#5f8f83",
    strong: "#3d6b60",
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Cool, quiet blues",
    bg: "#f1f5f9",
    card: "#ffffff",
    sidebar: "#274257",
    accent: "#4f88a8",
    strong: "#356580",
  },
  {
    id: "forest",
    name: "Forest",
    description: "Earthy greens and paper",
    bg: "#f3f6f1",
    card: "#fdfefc",
    sidebar: "#2e4234",
    accent: "#6d9465",
    strong: "#4f7549",
  },
  {
    id: "plum",
    name: "Plum",
    description: "Muted violet and ink",
    bg: "#f7f4f8",
    card: "#fefcff",
    sidebar: "#403348",
    accent: "#9874a6",
    strong: "#765787",
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Warm terracotta and sand",
    bg: "#fbf3ee",
    card: "#fffaf7",
    sidebar: "#4a342a",
    accent: "#c47a55",
    strong: "#a15d3d",
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Low-light slate and mint",
    bg: "#12171c",
    card: "#1a222a",
    sidebar: "#0d1318",
    accent: "#7fb7a9",
    strong: "#5f9488",
  },
  {
    id: "classic",
    name: "Classic",
    description: "The original navy and orange",
    bg: "#f7f9fc",
    card: "#ffffff",
    sidebar: "#0b2545",
    accent: "#f97316",
    strong: "#0b2545",
  },
];

const STORAGE_KEY = "it-roadmap-theme";
const THEME_EVENT = "it-roadmap-theme-change";
const DEFAULT_THEME = "calm";

function isKnownTheme(value: string | null): value is string {
  return Boolean(value && themes.some((option) => option.id === value));
}

function subscribeToTheme(callback: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) callback();
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(THEME_EVENT, callback);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(THEME_EVENT, callback);
  };
}

function getThemeSnapshot() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return isKnownTheme(saved) ? saved : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

function getServerThemeSnapshot() {
  return DEFAULT_THEME;
}

/**
 * Kept outside the component so the theme is applied to the external document
 * only in response to the user's click, not during render.
 */
function applyDocumentTheme(nextTheme: string) {
  document.documentElement.dataset.theme = nextTheme;

  try {
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
  } catch {
    // The theme still applies for this page even if storage is unavailable.
  }

  window.dispatchEvent(new Event(THEME_EVENT));
}

export default function ThemeSelector() {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot
  );

  function applyTheme(nextTheme: string) {
    applyDocumentTheme(nextTheme);
  }

  return (
    <div className={styles.themeSection}>
      <div className={styles.themeHeader}>
        <div>
          <h2 className={styles.themeTitle}>Theme</h2>
          <p className={styles.themeHint}>
            Pick a palette that feels comfortable. Your choice is saved on this device.
          </p>
        </div>
        <span className={styles.themeCurrent}>
          Current: {themes.find((option) => option.id === theme)?.name ?? "Calm"}
        </span>
      </div>

      <div className={styles.themeGrid}>
        {themes.map((option) => {
          const isActive = option.id === theme;

          return (
            <button
              key={option.id}
              type="button"
              className={`${styles.themeOption} ${isActive ? styles.themeOptionActive : ""}`}
              onClick={() => applyTheme(option.id)}
              aria-pressed={isActive}
            >
              <span
                className={styles.themePreview}
                style={{ background: option.bg }}
                aria-hidden="true"
              >
                <span
                  className={styles.themePreviewSidebar}
                  style={{ background: option.sidebar }}
                />
                <span
                  className={styles.themePreviewCard}
                  style={{ background: option.card }}
                >
                  <span
                    className={styles.themePreviewDot}
                    style={{ background: option.accent }}
                  />
                  <span
                    className={styles.themePreviewBar}
                    style={{ background: option.strong }}
                  />
                </span>
              </span>

              <span className={styles.themeOptionRow}>
                <span className={styles.themeOptionName}>{option.name}</span>
                {isActive && <span className={styles.themeCheck}>✓</span>}
              </span>
              <span className={styles.themeOptionDesc}>{option.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
