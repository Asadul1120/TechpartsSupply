import { Suspense } from "react";
import TicketDetails from "@/components/TicketDetails";

type TicketPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function TicketPage({ params }: TicketPageProps) {
  return (
    <Suspense
      fallback={
        <div className="rounded-lg bg-white p-6 text-center text-gray-600">
          Loading ticket details...
        </div>
      }
    >
      <TicketContent params={params} />
    </Suspense>
  );
}

async function TicketContent({ params }: TicketPageProps) {
  const { id } = await params;

  return <TicketDetails ticketId={id} />;
}
