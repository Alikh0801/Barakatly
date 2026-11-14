import { APP_PAGE_TITLE } from "@/components/app/form-styles";
import { CourierHistory } from "@/components/courier/CourierPanels";
import { getCourierHistory } from "@/lib/courier/queries";

export const metadata = { title: "Kuryer tarixçəsi" };

export default async function CourierHistoryPage() {
  const orders = await getCourierHistory();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12 app:px-6 app:pt-4 app:pb-8">
      <h1 className={`text-3xl font-semibold text-zinc-900 ${APP_PAGE_TITLE}`}>Tarixçə</h1>
      <p className="mt-2 text-sm text-zinc-500 app:mt-1 app:text-app-muted">Çatdırdığınız və çatdıra bilmədiyiniz sifarişlər</p>
      <div className="mt-8 app:mt-5">
        <CourierHistory orders={orders} />
      </div>
    </div>
  );
}
