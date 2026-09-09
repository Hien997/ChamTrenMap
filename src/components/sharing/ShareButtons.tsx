"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Platform-aware sharing (spec §15):
 * - Facebook / Zalo: platform web-share endpoints (popup).
 * - Native: Web Share API when available (mobile share sheet).
 * - Copy: clipboard fallback for everything else.
 */
export function ShareButtons({ url, title }: { url: string; title: string }) {
  const t = useTranslations("Share");

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  function openPopup(href: string) {
    window.open(href, "_blank", "noopener,noreferrer,width=640,height=560");
  }

  async function nativeShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        /* user dismissed the sheet */
      }
      return;
    }
    await copyLink();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("copied"));
    } catch {
      toast.error(t("copy"));
    }
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          openPopup(
            `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`,
          )
        }
      >
        💙 {t("facebook")}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => openPopup(`https://sp.zalo.me/share?u=${encodedUrl}`)}
      >
        💬 {t("zalo")}
      </Button>
      <Button type="button" variant="outline" onClick={nativeShare}>
        📤 {t("native")}
      </Button>
      <Button type="button" variant="outline" onClick={copyLink}>
        🔗 {t("copy")}
      </Button>
    </div>
  );
}
