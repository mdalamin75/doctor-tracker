import Link from "next/link";
import { Card } from "@/components/ui/misc";
import { EmptyState } from "@/components/common/states";

export default function DoctorNotFound() {
  return (
    <Card>
      <EmptyState title="Doctor not found" text="This doctor may have been deleted." action={<Link href="/doctors" className="text-sm font-medium text-primary hover:underline">Back to doctors</Link>} />
    </Card>
  );
}
