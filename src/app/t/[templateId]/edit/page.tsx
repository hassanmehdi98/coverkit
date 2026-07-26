import { Editor } from "@/components/editor/Editor";

export default async function EditTemplatePage({
  params,
  searchParams,
}: {
  params: Promise<{ templateId: string }>;
  searchParams: Promise<{ claim?: string }>;
}) {
  const { templateId } = await params;
  const { claim } = await searchParams;

  return <Editor templateId={templateId} initialClaim={claim === "1"} />;
}
