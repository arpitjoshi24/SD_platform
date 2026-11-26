import { redirect } from "next/navigation";

// A project is edited in the workspace, so /projects/:id forwards directly there.
export default async function ProjectRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/workspace/${id}`);
}