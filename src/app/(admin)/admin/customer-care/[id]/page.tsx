import { TicketDetail } from "@/components/admin/change-requests/ticket-detail";

/** The URL the backend's notification emails link to. */
export default async function AdminTicketPage({
  params,
}: PageProps<"/admin/customer-care/[id]">) {
  const { id } = await params;

  return <TicketDetail id={id} />;
}
