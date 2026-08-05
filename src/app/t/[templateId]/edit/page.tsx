import type { Metadata } from "next";

import { Editor } from "@/components/editor/Editor";
import { APP_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Editor",
  robots: { index: false, follow: false },
};

export default async function EditTemplatePage({
  params,
  searchParams,
}: {
  params: Promise<{ templateId: string }>;
  searchParams: Promise<{ claim?: string }>;
}) {
  const { templateId } = await params;
  const { claim } = await searchParams;

  return (
    <Editor
      templateId={templateId}
      initialClaim={claim === "1"}
      appUrl={APP_URL}
    />
  );
}
