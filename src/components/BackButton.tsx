"use client";

import { useRouter } from "next/navigation";

export default function BackButton({
  fallbackHref,
  label = "← Back",
  className,
}: {
  fallbackHref: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();

  function handleBack() {
    const referrer = document.referrer;
    let sameOrigin = true;

    if (referrer) {
      try {
        sameOrigin = new URL(referrer).origin === window.location.origin;
      } catch {
        sameOrigin = false;
      }
    }

    if (window.history.length > 1 && sameOrigin) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <button type="button" onClick={handleBack} className={className}>
      {label}
    </button>
  );
}
