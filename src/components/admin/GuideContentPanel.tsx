import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { GuideSection } from "./GuideSection";
import { Panel } from "./ui";

/**
 * Shared vi/en guide-content editor used by the create and edit checkpoint
 * forms. Renders its own Panel so the title and the keepMounted rule exist
 * in exactly one place. keepMounted keeps both textareas registered on the
 * page's FormProvider while switching tabs, so neither locale's content can
 * fall out of the submitted values (the invariant this panel was originally
 * built around for FormData).
 */
export function GuideContentPanel() {
  return (
    <Panel title="Guide content">
      <Tabs defaultValue="vi">
        <TabsList>
          <TabsTrigger value="vi">Tiếng Việt</TabsTrigger>
          <TabsTrigger value="en">English</TabsTrigger>
        </TabsList>
        <TabsContent value="vi" keepMounted className="mt-4">
          <GuideSection locale="vi" />
        </TabsContent>
        <TabsContent value="en" keepMounted className="mt-4">
          <GuideSection locale="en" />
        </TabsContent>
      </Tabs>
    </Panel>
  );
}
