import { NextResponse } from "next/server";
import { createTask, listTasks } from "../../../lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const priority = url.searchParams.get("priority");
  const location = url.searchParams.get("location");
  const category = url.searchParams.get("category");
  let tasks = listTasks();
  if (status) tasks = tasks.filter((t) => t.status === status);
  if (priority) tasks = tasks.filter((t) => t.priority === priority);
  if (category) tasks = tasks.filter((t) => t.category === category);
  if (location) tasks = tasks.filter((t) => t.location.toLowerCase().includes(location.toLowerCase()));
  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const created = createTask(body);
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid task body" }, { status: 400 });
  }
}
