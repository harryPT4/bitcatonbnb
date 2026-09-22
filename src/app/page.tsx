import { homeMarkup } from "@/content/home-markup";
import { ClientScript } from "@/components/client-script";

export default function HomePage() {
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: homeMarkup }} />
      <ClientScript src="/scripts/home.js" />
      <ClientScript src="/scripts/community.js" />
    </>
  );
}
