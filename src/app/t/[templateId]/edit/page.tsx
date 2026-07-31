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
  const appUrl = process.env.APP_URL ?? "https://coverkit.dev";

  return (
    <Editor
      templateId={templateId}
      initialClaim={claim === "1"}
      appUrl={appUrl}
    />
  );
}
