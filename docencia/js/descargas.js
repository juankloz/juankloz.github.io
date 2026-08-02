(() => {
  "use strict";

  const track = (name, parameters = {}) => {
    if (typeof window.gtag === "function") {
      window.gtag("event", name, parameters);
    }
  };

  document.querySelectorAll("[data-protected-download]").forEach((link) => {
    const slug = (link.dataset.protectedDownload || "").trim();
    if (!slug) return;

    let destination;
    try {
      destination = new URL(link.getAttribute("href"), window.location.origin);
    } catch (error) {
      destination = new URL("/docencia/acceso/", window.location.origin);
    }

    destination.searchParams.set("document", slug);
    destination.searchParams.set("return", window.location.href);
    link.href = destination.toString();
    link.removeAttribute("download");

    link.addEventListener("click", () => {
      try {
        sessionStorage.setItem("juankloz_pending_document", slug);
        sessionStorage.setItem("juankloz_return_url", window.location.href);
      } catch (error) {
        // El href absoluto mantiene la navegación aunque sessionStorage falle.
      }

      track("download_request", {
        document_id: slug,
        page_path: window.location.pathname
      });
    });
  });
})();
