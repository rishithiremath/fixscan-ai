import { NextResponse } from "next/server";
import { getTask, updateTask } from "../../../../lib/store";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const task = getTask(params.id);
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(task);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const task = getTask(params.id);
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (req.headers.get("content-type")?.includes("application/json")) {
    const body = await req.json().catch(() => ({}));
    if (body.status === "resolved" && !body.afterImageUrl && !task.after_image_url) {
      return NextResponse.json({ error: "Resolved requires an after photo." }, { status: 400 });
    }
    const updated = updateTask(params.id, {
      ...(body.status ? { status: body.status } : {}),
      ...(body.assignee ? { assignee_suggestion: body.assignee } : {}),
      ...(body.afterImageUrl ? { after_image_url: body.afterImageUrl } : {}),
      ...(body.note ? { notes: [...task.notes, String(body.note)] } : {}),
    });
    return NextResponse.json(updated);
  }
  return NextResponse.json({ error: "JSON body required" }, { status: 400 });
}
