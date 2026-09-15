import { GuideSection } from "./GuideSection";
import { GUIDE_KEYS } from "./CheckpointFormTypes";
import type { TGuide } from "./CheckpointFormTypes";

interface Props {
  locale: "vi" | "en";
  existingGuides: TGuide[];
}

/**
 * The five guide sections for one locale.
 *
 * Passes the whole stored guide row through (not just title/content/order) so
 * the section keeps its `contentType` — dropping it silently downgraded every
 * HTML guide to plain text on the next save.
 */
export function GuideSectionEditor({ locale, existingGuides }: Props) {
  return (
    <div lang={locale}>
      {GUIDE_KEYS.map((gk) => {
        const existing = existingGuides.find(
          (g) => g.sectionKey === gk.key && g.locale === locale,
        );
        return (
          <GuideSection
            key={`${gk.key}-${locale}`}
            locale={locale}
            sectionKey={gk.key}
            label={gk.label}
            existing={existing}
          />
        );
      })}
    </div>
  );
}
