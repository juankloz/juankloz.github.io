(() => {
  "use strict";

  const ACCESS_URL = new URL(
    "/docencia/acceso/",
    window.location.origin
  );

  const track = (name, parameters = {}) => {
    if (typeof window.gtag === "function") {
      window.gtag("event", name, parameters);
    }
  };

  document.querySelectorAll("[data-protected-download]").forEach((link) => {
    const slug = (link.dataset.protectedDownload || "").trim();

    if (!slug) {
      return;
    }

    const destination = new URL(ACCESS_URL);
    destination.searchParams.set("document", slug);
    destination.searchParams.set("return", window.location.href);

    link.href = destination.toString();
    link.removeAttribute("download");
    link.setAttribute(
      "aria-label",
      `${link.textContent.trim()}. Requiere verificar el correo.`
    );

    link.addEventListener("click", () => {
      try {
        sessionStorage.setItem("juankloz_pending_document", slug);
        sessionStorage.setItem("juankloz_return_url", window.location.href);
      } catch (error) {
        // La ruta absoluta mantiene la navegación aunque sessionStorage falle.
      }

      track("download_request", {
        document_id: slug,
        page_path: window.location.pathname
      });
    });
  });
})();
