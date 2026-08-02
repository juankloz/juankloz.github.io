(() => {
  "use strict";

  const config = window.JUANKLOZ_CONFIG;
  const supabaseLibrary = window.supabase;

  const ui = {
    page: document.querySelector("[data-access-page]"),
    authPanel: document.querySelector("[data-auth-panel]"),
    sentPanel: document.querySelector("[data-sent-panel]"),
    profilePanel: document.querySelector("[data-profile-panel]"),
    readyPanel: document.querySelector("[data-ready-panel]"),
    loadingPanel: document.querySelector("[data-loading-panel]"),
    authForm: document.querySelector("[data-auth-form]"),
    profileForm: document.querySelector("[data-profile-form]"),
    emailInput: document.querySelector("[data-email-input]"),
    sentEmail: document.querySelector("[data-sent-email]"),
    resendButton: document.querySelector("[data-resend]"),
    status: document.querySelector("[data-access-status]"),
    classification: document.querySelector("[data-classification]"),
    verifiedEmail: document.querySelector("[data-verified-email]"),
    institutionField: document.querySelector("[data-external-institution]"),
    courseField: document.querySelector("[data-course-interest]"),
    documentTitle: document.querySelector("[data-document-title]"),
    downloadButton: document.querySelector("[data-download-now]"),
    continueLink: document.querySelector("[data-continue-link]"),
    signOutButtons: document.querySelectorAll("[data-sign-out]"),
    userBadge: document.querySelector("[data-user-badge]")
  };

  if (!config || !supabaseLibrary || !ui.page) {
    return;
  }

  const client = supabaseLibrary.createClient(
    config.supabaseUrl,
    config.supabasePublishableKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );

  const params = new URLSearchParams(window.location.search);
  let requestedDocument =
    params.get("document") ||
    sessionStorage.getItem("juankloz_pending_document") ||
    "";

  const returnUrl =
    params.get("return") ||
    sessionStorage.getItem("juankloz_return_url") ||
    `${config.docenciaRoot}/`;

  let currentSession = null;
  let currentProfile = null;
  let documentRecord = null;
  let downloadInProgress = false;

  const courseNames = {
    "mecanica-fluidos": "Mecánica de Fluidos",
    "hidraulica-aplicada": "Hidráulica Aplicada",
    "acueducto-alcantarillado-unitropico": "Acueducto y Alcantarillado · UNITRÓPICO",
    "tratamiento-agua": "Tratamiento de Agua · UNITRÓPICO",
    "diseno-plantas-tratamiento": "Diseño de Plantas de Tratamiento",
    "tratamiento-potabilizacion-agua": "Tratamiento y Potabilización de Agua",
    "tratamiento-aguas-residuales": "Tratamiento de Aguas Residuales",
    "acueducto-alcantarillado-unisangil": "Acueducto y Alcantarillado · UNISANGIL",
    "general": "Recursos generales"
  };

  const classificationNames = {
    unisangil: "Correo verificado de UNISANGIL",
    unitropico: "Correo verificado de UNITRÓPICO",
    external: "Usuario externo verificado"
  };

  const track = (name, parameters = {}) => {
    if (typeof window.gtag === "function") {
      window.gtag("event", name, parameters);
    }
  };

  const showPanel = (panel) => {
    [
      ui.authPanel,
      ui.sentPanel,
      ui.profilePanel,
      ui.readyPanel,
      ui.loadingPanel
    ].forEach((item) => {
      if (!item) return;

      const shouldHide = item !== panel;
      item.hidden = shouldHide;
      item.style.display = shouldHide ? "none" : "";
      item.setAttribute("aria-hidden", shouldHide ? "true" : "false");
    });
  };

  const setStatus = (message, type = "info") => {
    if (!ui.status) return;
    ui.status.textContent = message;
    ui.status.dataset.type = type;
    ui.status.hidden = !message;
  };

  const normalizeReturnUrl = (value) => {
    try {
      const parsed = new URL(value, window.location.origin);
      if (parsed.origin !== window.location.origin) {
        return `${config.docenciaRoot}/`;
      }
      return parsed.toString();
    } catch (error) {
      return `${config.docenciaRoot}/`;
    }
  };

  const updateContinueLink = () => {
    if (ui.continueLink) {
      ui.continueLink.href = normalizeReturnUrl(returnUrl);
    }
  };

  const buildRedirectUrl = () => {
    const redirect = new URL(`${config.docenciaRoot}/acceso/`);
    if (requestedDocument) {
      redirect.searchParams.set("document", requestedDocument);
    }
    redirect.searchParams.set("return", normalizeReturnUrl(returnUrl));
    return redirect.toString();
  };

  const fetchDocument = async () => {
    if (!requestedDocument || !currentSession) {
      documentRecord = null;
      if (ui.documentTitle) {
        ui.documentTitle.textContent = "Biblioteca de recursos";
      }
      return;
    }

    const { data, error } = await client
      .from("documents")
      .select("slug,title,description,file_name,active")
      .eq("slug", requestedDocument)
      .eq("active", true)
      .maybeSingle();

    if (error) {
      throw error;
    }

    documentRecord = data;

    if (!data) {
      throw new Error("El documento solicitado no está registrado o no está disponible.");
    }

    if (ui.documentTitle) {
      ui.documentTitle.textContent = data.title;
    }
  };

  const fetchProfile = async () => {
    const userId = currentSession?.user?.id;

    if (!userId) {
      currentProfile = null;
      return null;
    }

    const { data, error } = await client
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    currentProfile = data;
    return data;
  };

  const profileIsComplete = (profile) =>
    Boolean(
      profile &&
      profile.user_type &&
      profile.consent_at &&
      profile.privacy_policy_version
    );

  const renderUser = () => {
    const email = currentSession?.user?.email || "";

    if (ui.verifiedEmail) {
      ui.verifiedEmail.textContent = email;
    }

    if (ui.userBadge) {
      ui.userBadge.textContent = email ? "Sesión verificada" : "Acceso por correo";
    }

    if (currentProfile && ui.classification) {
      ui.classification.textContent =
        classificationNames[currentProfile.institution_class] ||
        "Correo verificado";
    }

    const external = currentProfile?.institution_class === "external";

    if (ui.institutionField) {
      ui.institutionField.hidden = !external;
      const input = ui.institutionField.querySelector("input");
      if (input) {
        input.required = external;
        input.value = currentProfile?.declared_institution || "";
      }
    }
  };

  const renderState = async () => {
    setStatus("");
    updateContinueLink();

    if (!currentSession) {
      showPanel(ui.authPanel);
      return;
    }

    showPanel(ui.loadingPanel);

    try {
      await Promise.all([fetchProfile(), fetchDocument()]);
      renderUser();

      if (!profileIsComplete(currentProfile)) {
        showPanel(ui.profilePanel);
        return;
      }

      showPanel(ui.readyPanel);

      if (requestedDocument && documentRecord) {
        window.setTimeout(() => {
          startDownload();
        }, 350);
      }
    } catch (error) {
      showPanel(ui.readyPanel);
      setStatus(
        error?.message || "No fue posible cargar la información del acceso.",
        "error"
      );
    }
  };

  const startDownload = async () => {
    if (
      downloadInProgress ||
      !requestedDocument ||
      !documentRecord ||
      !currentSession ||
      !profileIsComplete(currentProfile)
    ) {
      return;
    }

    downloadInProgress = true;

    if (ui.downloadButton) {
      ui.downloadButton.disabled = true;
      ui.downloadButton.textContent = "Preparando descarga…";
    }

    setStatus("Registrando y preparando el archivo…", "info");

    try {
      const { data: registration, error: registrationError } =
        await client.rpc("register_download", {
          p_document_slug: requestedDocument
        });

      if (registrationError) {
        throw registrationError;
      }

      const item = Array.isArray(registration)
        ? registration[0]
        : registration;

      if (!item?.storage_path) {
        throw new Error("No se recibió la ruta del archivo.");
      }

      const { data: fileBlob, error: downloadError } =
        await client.storage
          .from(config.storageBucket)
          .download(item.storage_path);

      if (downloadError) {
        throw downloadError;
      }

      const objectUrl = URL.createObjectURL(fileBlob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = item.file_name || documentRecord.file_name;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);

      sessionStorage.removeItem("juankloz_pending_document");

      setStatus(
        "Descarga iniciada. En algunos celulares el archivo se abre en una pestaña o en el visor de documentos.",
        "success"
      );

      track("download_complete", {
        document_id: requestedDocument,
        institution: currentProfile.institution_class,
        user_category: currentProfile.user_type
      });

      if (ui.downloadButton) {
        ui.downloadButton.textContent = "Descargar nuevamente";
      }
    } catch (error) {
      const originalMessage =
        error?.message || "No fue posible descargar el archivo.";

      const friendlyMessage = /object not found/i.test(originalMessage)
        ? "El documento está registrado, pero el archivo no existe en la ruta esperada de Supabase Storage. Revisa el nombre, la extensión y la carpeta dentro del bucket recursos-docencia."
        : originalMessage;

      setStatus(friendlyMessage, "error");

      if (ui.downloadButton) {
        ui.downloadButton.textContent = "Intentar nuevamente";
      }
    } finally {
      downloadInProgress = false;
      if (ui.downloadButton) {
        ui.downloadButton.disabled = false;
      }
    }
  };

  ui.authForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = ui.emailInput?.value.trim().toLowerCase();

    if (!email) {
      setStatus("Escribe un correo electrónico válido.", "error");
      return;
    }

    const submitButton = ui.authForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = "Enviando…";
    setStatus("");

    try {
      const { error } = await client.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: buildRedirectUrl(),
          shouldCreateUser: true
        }
      });

      if (error) {
        throw error;
      }

      if (ui.sentEmail) {
        ui.sentEmail.textContent = email;
      }

      showPanel(ui.sentPanel);
      setStatus(
        "Revisa también la carpeta de correo no deseado. El enlace es personal y temporal.",
        "success"
      );

      track("email_access_requested", {
        email_domain: email.split("@")[1] || "unknown"
      });
    } catch (error) {
      setStatus(
        error?.message || "No fue posible enviar el correo de acceso.",
        "error"
      );
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Enviar enlace de acceso";
    }
  });

  ui.resendButton?.addEventListener("click", () => {
    showPanel(ui.authPanel);
    setStatus("");
    ui.emailInput?.focus();
  });

  ui.profileForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(ui.profileForm);
    const submitButton = ui.profileForm.querySelector('button[type="submit"]');

    submitButton.disabled = true;
    submitButton.textContent = "Guardando…";
    setStatus("");

    try {
      const { data, error } = await client.rpc("complete_profile", {
        p_user_type: formData.get("user_type"),
        p_declared_institution:
          formData.get("declared_institution") || "",
        p_course_interest:
          formData.get("course_interest") || "general",
        p_consent: formData.get("consent") === "on",
        p_newsletter_opt_in:
          formData.get("newsletter_opt_in") === "on"
      });

      if (error) {
        throw error;
      }

      currentProfile = Array.isArray(data) ? data[0] : data;
      renderUser();
      showPanel(ui.readyPanel);

      track("profile_completed", {
        institution: currentProfile.institution_class,
        user_category: currentProfile.user_type,
        course_id: currentProfile.course_interest || "general"
      });

      if (requestedDocument && documentRecord) {
        await startDownload();
      } else {
        setStatus("Perfil guardado. Ya puedes acceder a los recursos.", "success");
      }
    } catch (error) {
      setStatus(
        error?.message || "No fue posible guardar el perfil.",
        "error"
      );
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Guardar y continuar";
    }
  });

  ui.downloadButton?.addEventListener("click", startDownload);

  ui.signOutButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      await client.auth.signOut();
      currentSession = null;
      currentProfile = null;
      documentRecord = null;
      showPanel(ui.authPanel);
      setStatus("La sesión se cerró correctamente.", "success");
    });
  });

  const initialize = async () => {
    showPanel(ui.loadingPanel);
    updateContinueLink();

    const {
      data: { session },
      error
    } = await client.auth.getSession();

    if (error) {
      setStatus(error.message, "error");
    }

    currentSession = session;
    await renderState();
  };

  client.auth.onAuthStateChange((event, session) => {
    currentSession = session;

    if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
      window.setTimeout(renderState, 0);
    }

    if (event === "SIGNED_OUT") {
      currentProfile = null;
      documentRecord = null;
      showPanel(ui.authPanel);
    }
  });

  initialize();
})();
