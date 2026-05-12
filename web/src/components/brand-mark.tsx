import { IS_SOTIK_BRAND } from "@/lib/brand";

/** Логотип в шапке/подвале: один источник для storefront и site-chrome. */
export function BrandMark() {
  if (IS_SOTIK_BRAND) {
    return (
      <>
        SOTIK<span className="text-red-500">77</span>
      </>
    );
  }
  return (
    <>
      <span className="text-red-500">X</span> : STORE
    </>
  );
}
