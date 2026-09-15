import { GuideSection } from "./GuideSection";
import type { TGuide } from "./CheckpointFormTypes";

interface Props {
  locale: "vi" | "en";
  existingGuides: TGuide[];
}

/** The single guide document for one locale. */
export function GuideSectionEditor({ locale, existingGuides }: Props) {
  const existing = existingGuides.find((g) => g.locale === locale);
  return (
    <div lang={locale}>
      <GuideSection locale={locale} existing={existing} />
    </div>
  );
}

