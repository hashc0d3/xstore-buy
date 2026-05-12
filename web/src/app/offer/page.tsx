import Storefront from "@/components/storefront";
import { getStoreDataServer } from "@/lib/server/get-store-data";

export default async function OfferPage() {
  const initialStoreData = await getStoreDataServer();
  return <Storefront initialStoreData={initialStoreData} />;
}
