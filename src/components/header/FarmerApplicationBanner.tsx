import { getOpenFarmerApplication } from "@/lib/farmer/application";
import { FarmerApplicationBannerView } from "@/components/header/FarmerApplicationBannerView";

/** The yellow strip for a farmer waiting for the admin, or turned down. */
export async function FarmerApplicationBanner() {
  const application = await getOpenFarmerApplication();
  if (!application) return null;

  const rejected = application.status === "rejected";
  return (
    <FarmerApplicationBannerView
      rejected={rejected}
      text={
        rejected
          ? `Müraciətiniz rədd edildi${application.rejectionReason ? `: ${application.rejectionReason}` : ""}`
          : "Fermer hesabınız təsdiq gözləyir"
      }
    />
  );
}
