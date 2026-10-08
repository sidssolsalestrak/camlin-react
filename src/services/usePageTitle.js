import { useEffect } from "react";

const APP_NAME = "Camlin";

export default function usePageTitle(pageTitle) {
  useEffect(() => {
    if (pageTitle && pageTitle.trim() !== "") {
      document.title = `${APP_NAME} | ${pageTitle}`;
    } else {
      document.title = APP_NAME;
    }
  }, [pageTitle]);
}
