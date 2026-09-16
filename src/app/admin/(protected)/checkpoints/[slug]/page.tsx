import { notFound } from "next/navigation";
import CheckpointEditForm from "@/components/admin/CheckpointEditForm";
import { getCheckpointForEdit } from "@/services/checkpoint-content.server";

export const dynamic = "force-dynamic";

export default async function AdminCheckpointEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const checkpoint = await getCheckpointForEdit(slug);

  if (!checkpoint) notFound();

  return <CheckpointEditForm checkpoint={checkpoint} />;
}
