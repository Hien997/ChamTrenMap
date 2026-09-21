"use client";

import { Link2, MessageCircle, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

function FacebookIcon({ className, "aria-hidden": ariaHidden }: {
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden={ariaHidden}
    >
      <path d="M13.5 21v-8.2h2.76l.41-3.2H13.5V7.55c0-.93.26-1.56 1.59-1.56h1.7V3.13c-.3-.04-1.31-.13-2.49-.13-2.46 0-4.15 1.5-4.15 4.26v2.36H7.38v3.2h2.77V21h3.35Z" />
    </svg>
  );
}

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
        <FacebookIcon aria-hidden className="text-[#1877f2]" />
        {t("facebook")}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => openPopup(`https://sp.zalo.me/share?u=${encodedUrl}`)}
      >
        <MessageCircle aria-hidden className="text-[#0068ff]" />
        {t("zalo")}
      </Button>
      <Button type="button" variant="outline" onClick={nativeShare}>
        <Share2 aria-hidden />
        {t("native")}
      </Button>
      <Button type="button" variant="outline" onClick={copyLink}>
        <Link2 aria-hidden />
        {t("copy")}
      </Button>
    </div>
  );
}
