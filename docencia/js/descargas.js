(() => {
  "use strict";

  const scriptElement =
    document.querySelector('script[src*="/js/descargas.js"]') ||
    document.querySelector('script[src*="js/descargas.js"]');

  const fallbackAccessUrl = scriptElement
    ? new URL("../acceso/", scriptElement.src)
    : new URL("/docencia/acceso/", window.location.origin);

  const track = (name, parameters = {}) => {
    if (typeof window.gtag === "function") {
      window.gtag("event", name, parameters);
    }
  };

  document.querySelectorAll("[data-protected-download]").forEach((link) => {
    const slug = link.dataset.protectedDownload;

    if (!slug) {
      return;
    }

    const declaredHref = link.getAttribute("href");
    let destination;

    try {
      destination = declaredHref
        ? new URL(declaredHref, window.location.href)
        : new URL(fallbackAccessUrl);
    } catch (error) {
      destination = new URL(fallbackAccessUrl);
    }

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
        // La navegación continúa aunque el almacenamiento esté bloqueado.
      }

      track("download_request", {
        document_id: slug,
        page_path: window.location.pathname
      });
    });
  });
})();
