(() => {
  "use strict";
  const keywordData = {"diseno-plantas-tratamiento": {"label": "Diseño de Plantas de Tratamiento", "keywords": ["water treatment plant design", "treatment train selection", "process optimization water treatment", "drinking water plant modelling"]}, "tratamiento-potabilizacion-agua": {"label": "Tratamiento y Potabilización de Agua", "keywords": ["drinking water treatment", "coagulation flocculation", "water disinfection", "membrane filtration drinking water", "adsorption water treatment"]}, "tratamiento-aguas-residuales": {"label": "Tratamiento de Aguas Residuales", "keywords": ["wastewater treatment", "activated sludge process", "biological nutrient removal", "constructed wetlands wastewater", "resource recovery wastewater"]}, "acueducto-alcantarillado-unisangil": {"label": "Acueducto y Alcantarillado — UNISANGIL", "keywords": ["water distribution network", "sewer system design", "drinking water supply system", "urban drainage modelling", "water network optimization"]}, "mecanica-fluidos": {"label": "Mecánica de Fluidos", "keywords": ["fluid mechanics", "pipe flow head loss", "pump performance curve", "computational fluid dynamics civil engineering", "flow measurement"]}, "hidraulica-aplicada": {"label": "Hidráulica Aplicada", "keywords": ["applied hydraulics", "open channel flow", "hydraulic structures", "pipe network analysis", "pump system optimization"]}, "acueducto-alcantarillado-unitropico": {"label": "Acueducto y Alcantarillado — UNITRÓPICO", "keywords": ["water supply system design", "Hardy Cross pipe network", "water distribution modelling", "sanitary sewer design", "stormwater drainage"]}, "tratamiento-agua": {"label": "Tratamiento de Agua", "keywords": ["water treatment processes", "advanced oxidation water", "water quality treatment", "filtration and disinfection", "emerging contaminants water treatment"]}};

  const validator = document.querySelector("[data-article-validator]");
  const validatorResult = document.querySelector("[data-validator-result]");

  validator?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(validator);
    const date = form.get("date");
    const eligibleDate = date && date >= "2026-07-01";
    const language = form.get("language") === "english";
    const type = form.get("type") === "journal";
    const journal = String(form.get("journal") || "").trim().length >= 3;
    const issn = /^\d{4}-?\d{3}[\dXx]$/.test(String(form.get("issn") || "").trim());
    const doi = String(form.get("doi") || "").trim().length >= 8;
    const relevance = form.get("relevance") === "on";

    const failed = [];
    if (!eligibleDate) failed.push("la fecha debe ser 1 de julio de 2026 o posterior");
    if (!language) failed.push("el idioma original debe ser inglés");
    if (!type) failed.push("debe ser un artículo de revista");
    if (!journal) failed.push("escribe el nombre de la revista");
    if (!issn) failed.push("revisa el formato del ISSN");
    if (!doi) failed.push("agrega el DOI o enlace oficial");
    if (!relevance) failed.push("confirma la relación con el curso");

    validatorResult.classList.remove("is-valid", "is-invalid");
    if (failed.length) {
      validatorResult.classList.add("is-invalid");
      validatorResult.textContent = "Todavía no cumple: " + failed.join("; ") + ".";
    } else {
      validatorResult.classList.add("is-valid");
      validatorResult.textContent = "La selección cumple los requisitos básicos. Verifica ahora los datos en la editorial, Crossref y el Portal ISSN.";
    }
  });

  const selector = document.querySelector("[data-course-keywords]");
  const output = document.querySelector("[data-keyword-output]");
  const copyButton = document.querySelector("[data-copy-keywords]");
  let currentKeywords = "";

  selector?.addEventListener("change", () => {
    const selected = keywordData[selector.value];
    if (!selected) {
      currentKeywords = "";
      output.textContent = "Selecciona un curso para ver términos sugeridos.";
      return;
    }
    currentKeywords = selected.keywords.join(" · ");
    output.innerHTML = selected.keywords.map((keyword) => `<span>${keyword}</span>`).join("");
  });

  copyButton?.addEventListener("click", async () => {
    if (!currentKeywords) {
      copyButton.textContent = "Selecciona un curso";
      return;
    }
    try {
      await navigator.clipboard.writeText(currentKeywords);
      copyButton.textContent = "Términos copiados";
    } catch (error) {
      copyButton.textContent = "Copia los términos manualmente";
    }
    window.setTimeout(() => { copyButton.textContent = "Copiar términos"; }, 1800);
  });
})();
