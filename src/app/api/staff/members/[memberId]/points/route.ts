import { randomUUID } from "node:crypto";

import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { requireStaffSession } from "@/lib/staff-guard";

export async function POST(
  request: Request,
  context: { params: Promise<{ memberId: string }> },
) {
  const guard = await requireStaffSession();

  if ("response" in guard) {
    return guard.response;
  }

  const { memberId } = await context.params;
  const input = (await request.json().catch(() => null)) as {
    points?: unknown;
    label?: unknown;
    referralCode?: unknown;
    idempotencyKey?: unknown;
  } | null;

  const response = await staffFetch(`/v1/members/${encodeURIComponent(memberId)}/points/credit`, {
    method: "POST",
    body: JSON.stringify({
      points: input?.points,
      reason: typeof input?.label === "string" ? input.label : undefined,
      sourceRef: typeof input?.referralCode === "string" && input.referralCode ? input.referralCode : undefined,
      idempotencyKey: typeof input?.idempotencyKey === "string" ? input.idempotencyKey : randomUUID(),
    }),
  });

  if (!response.ok) {
    return forwardResponse(response);
  }

  const membersResponse = await staffFetch(
    `/v1/clinics/${encodeURIComponent(guard.session.clinicSlug)}/members`,
    { method: "GET" },
  );

  if (!membersResponse.ok) {
    return forwardResponse(membersResponse);
  }

  const members = (await membersResponse.json()) as Array<{ id: string }>;
  const member = members.find((item) => item.id === memberId);

  if (!member) {
    return Response.json({ code: "MEMBER_NOT_FOUND", message: "Member not found" }, { status: 404 });
  }

  return Response.json(member);
}
