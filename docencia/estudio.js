(() => {
  "use strict";

  const page = document.querySelector("[data-course-id]");
  if (!page) return;

  const courseId = page.dataset.courseId;
  const progressKey = `juankloz-study-progress:${courseId}`;
  const quizKey = `juankloz-study-quiz:${courseId}`;

  const safeRead = (key, fallback) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      return fallback;
    }
  };

  const safeWrite = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // The page still works when browser storage is disabled.
    }
  };

  /* -------------------------------------------------------
     Study progress
     ------------------------------------------------------- */
  const tasks = [...document.querySelectorAll("[data-study-task]")];
  const storedProgress = safeRead(progressKey, {});

  tasks.forEach((task) => {
    task.checked = Boolean(storedProgress[task.dataset.studyTask]);
  });

  const percentageNode = document.querySelector("[data-progress-percentage]");
  const completedNode = document.querySelector("[data-progress-completed]");
  const totalNode = document.querySelector("[data-progress-total]");
  const progressBar = document.querySelector("[data-progress-bar]");
  const progressTrack = document.querySelector("[data-progress-track]");
  const suggestionNode = document.querySelector("[data-study-suggestion]");

  const updateProgress = () => {
    const completed = tasks.filter((task) => task.checked).length;
    const total = tasks.length;
    const percentage = total ? Math.round((completed / total) * 100) : 0;

    if (percentageNode) percentageNode.textContent = percentage;
    if (completedNode) completedNode.textContent = completed;
    if (totalNode) totalNode.textContent = total;
    if (progressBar) progressBar.style.width = `${percentage}%`;

    if (progressTrack) {
      progressTrack.setAttribute("aria-valuenow", String(percentage));
    }

    const state = {};
    tasks.forEach((task) => {
      state[task.dataset.studyTask] = task.checked;
    });
    safeWrite(progressKey, state);
  };

  tasks.forEach((task) => {
    task.addEventListener("change", updateProgress);
  });

  updateProgress();

  const suggestButton = document.querySelector("[data-suggest-study]");
  if (suggestButton) {
    suggestButton.addEventListener("click", () => {
      const pending = tasks.filter((task) => !task.checked);
      const pool = pending.length ? pending : tasks;
      if (!pool.length) return;

      const selected = pool[Math.floor(Math.random() * pool.length)];
      const text = selected.closest("label")?.innerText.trim() || "Revisa la ruta de estudio.";

      if (suggestionNode) suggestionNode.textContent = text;

      const module = selected.closest("details");
      if (module) module.open = true;

      selected.closest(".study-task")?.classList.add("is-highlighted");
      selected.scrollIntoView({ behavior: "smooth", block: "center" });

      window.setTimeout(() => {
        selected.closest(".study-task")?.classList.remove("is-highlighted");
      }, 1800);
    });
  }

  const resetProgress = document.querySelector("[data-reset-progress]");
  if (resetProgress) {
    resetProgress.addEventListener("click", () => {
      const confirmed = window.confirm(
        "¿Deseas borrar el avance guardado para este curso en este navegador?"
      );
      if (!confirmed) return;

      tasks.forEach((task) => {
        task.checked = false;
      });

      safeWrite(progressKey, {});
      updateProgress();

      if (suggestionNode) {
        suggestionNode.textContent = "Abre la ruta y selecciona tu primer objetivo.";
      }
    });
  }

  /* -------------------------------------------------------
     Open and close all study modules
     ------------------------------------------------------- */
  const moduleButton = document.querySelector("[data-toggle-modules]");
  const modules = [...document.querySelectorAll(".study-module")];

  if (moduleButton && modules.length) {
    moduleButton.addEventListener("click", () => {
      const shouldOpen = modules.some((module) => !module.open);
      modules.forEach((module) => {
        module.open = shouldOpen;
      });
      moduleButton.textContent = shouldOpen ? "Cerrar todos" : "Abrir todos";
    });
  }

  /* -------------------------------------------------------
     Resource search and filtering
     ------------------------------------------------------- */
  const resourceCards = [...document.querySelectorAll("[data-resource-card]")];
  const searchInput = document.querySelector("[data-resource-search]");
  const filterButtons = [...document.querySelectorAll("[data-resource-filter]")];
  const emptyState = document.querySelector("[data-resource-empty]");
  let activeCategory = "all";

  const filterResources = () => {
    const query = (searchInput?.value || "").trim().toLowerCase();
    let visible = 0;

    resourceCards.forEach((card) => {
      const matchesCategory =
        activeCategory === "all" ||
        card.dataset.resourceCategory === activeCategory;

      const matchesQuery =
        !query ||
        (card.dataset.resourceText || "").includes(query);

      const show = matchesCategory && matchesQuery;
      card.hidden = !show;
      if (show) visible += 1;
    });

    if (emptyState) emptyState.hidden = visible !== 0;
  };

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.resourceFilter || "all";
      filterButtons.forEach((item) => {
        item.classList.toggle("is-active", item === button);
      });
      filterResources();
    });
  });

  searchInput?.addEventListener("input", filterResources);

  /* -------------------------------------------------------
     Calculators
     ------------------------------------------------------- */
  const numberValue = (form, name) => {
    const node = form.elements.namedItem(name);
    return Number(node?.value);
  };

  document.querySelectorAll("[data-calculator]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const output = form.querySelector(".study-calculator-output");
      const type = form.dataset.calculator;

      try {
        if (type === "hydrostatic") {
          const rho = numberValue(form, "rho");
          const height = numberValue(form, "height");
          if (!(rho > 0) || height < 0) throw new Error("Revisa los datos.");
          const pressureKpa = (rho * 9.81 * height) / 1000;
          output.textContent = `Resultado: Δp = ${pressureKpa.toLocaleString("es-CO", {
            maximumFractionDigits: 3
          })} kPa`;
        }

        if (type === "continuity") {
          const diameterMm = numberValue(form, "diameter");
          const velocity = numberValue(form, "velocity");
          if (!(diameterMm > 0) || velocity < 0) throw new Error("Revisa los datos.");
          const diameter = diameterMm / 1000;
          const area = Math.PI * diameter ** 2 / 4;
          const flowLs = area * velocity * 1000;
          output.textContent = `Resultado: Q = ${flowLs.toLocaleString("es-CO", {
            maximumFractionDigits: 3
          })} L/s`;
        }

        if (type === "population") {
          const population = numberValue(form, "population");
          const rate = numberValue(form, "rate") / 100;
          const years = numberValue(form, "years");
          if (!(population > 0) || years < 0 || rate <= -1) throw new Error("Revisa los datos.");
          const future = population * (1 + rate) ** years;
          output.textContent = `Resultado: P_f ≈ ${Math.round(future).toLocaleString("es-CO")} habitantes`;
        }

        if (type === "velocity") {
          const flowLs = numberValue(form, "flow");
          const diameterMm = numberValue(form, "diameter");
          if (flowLs < 0 || !(diameterMm > 0)) throw new Error("Revisa los datos.");
          const diameter = diameterMm / 1000;
          const area = Math.PI * diameter ** 2 / 4;
          const velocity = (flowLs / 1000) / area;
          output.textContent = `Resultado: v = ${velocity.toLocaleString("es-CO", {
            maximumFractionDigits: 3
          })} m/s`;
        }

        if (type === "hazen") {
          const length = numberValue(form, "length");
          const flow = numberValue(form, "flow") / 1000;
          const coefficient = numberValue(form, "coefficient");
          const diameter = numberValue(form, "diameter") / 1000;

          if (!(length >= 0) || !(flow >= 0) || !(coefficient > 0) || !(diameter > 0)) {
            throw new Error("Revisa los datos.");
          }

          const loss =
            10.67 *
            length *
            flow ** 1.852 /
            (coefficient ** 1.852 * diameter ** 4.87);

          output.textContent = `Resultado: h_f ≈ ${loss.toLocaleString("es-CO", {
            maximumFractionDigits: 3
          })} m`;
        }
      } catch (error) {
        output.textContent = "No fue posible calcular. Verifica que los valores sean válidos.";
      }
    });
  });

  /* -------------------------------------------------------
     Self-assessment quiz
     ------------------------------------------------------- */
  const quiz = document.querySelector("[data-study-quiz]");
  const quizResult = document.querySelector("[data-quiz-result]");
  const storedQuiz = safeRead(quizKey, null);

  if (storedQuiz && quizResult) {
    quizResult.textContent =
      `Último resultado guardado: ${storedQuiz.score}/${storedQuiz.total} respuestas correctas.`;
  }

  quiz?.addEventListener("submit", (event) => {
    event.preventDefault();

    const questions = [...quiz.querySelectorAll("[data-correct-answer]")];
    let score = 0;
    let answered = 0;

    questions.forEach((question) => {
      const selected = question.querySelector("input:checked");
      const feedback = question.querySelector(".study-question-feedback");
      const correct = Number(question.dataset.correctAnswer);

      question.classList.remove("is-correct", "is-incorrect");

      if (!selected) {
        feedback.textContent = "Selecciona una respuesta.";
        return;
      }

      answered += 1;
      const isCorrect = Number(selected.value) === correct;
      if (isCorrect) score += 1;

      question.classList.add(isCorrect ? "is-correct" : "is-incorrect");
      feedback.textContent = isCorrect
        ? "Respuesta correcta."
        : "Revisa este concepto en la ruta de estudio.";
    });

    if (answered < questions.length) {
      quizResult.textContent =
        `Has respondido ${answered} de ${questions.length} preguntas. Completa las restantes.`;
      return;
    }

    const percentage = Math.round((score / questions.length) * 100);
    let message = "Conviene repasar la ruta temática.";
    if (percentage >= 80) message = "Buen dominio de los conceptos esenciales.";
    else if (percentage >= 60) message = "Vas bien; revisa los temas con errores.";

    quizResult.textContent =
      `Resultado: ${score}/${questions.length} (${percentage} %). ${message}`;

    safeWrite(quizKey, {
      score,
      total: questions.length,
      percentage,
      date: new Date().toISOString()
    });
  });

  quiz?.addEventListener("reset", () => {
    window.setTimeout(() => {
      quiz.querySelectorAll(".study-quiz-question").forEach((question) => {
        question.classList.remove("is-correct", "is-incorrect");
        const feedback = question.querySelector(".study-question-feedback");
        if (feedback) feedback.textContent = "";
      });

      if (quizResult) {
        quizResult.textContent = "Aún no has enviado tus respuestas.";
      }
    }, 0);
  });
})();

/* =========================================================
   CALCULADORAS ADICIONALES — HIDRÁULICA APLICADA
   ========================================================= */
(() => {
  "use strict";

  const numberValue = (form, name) => {
    const node = form.elements.namedItem(name);
    return Number(node?.value);
  };

  const format = (value, digits = 3) =>
    value.toLocaleString("es-CO", {
      maximumFractionDigits: digits
    });

  document
    .querySelectorAll(
      '[data-calculator="reynolds"], ' +
      '[data-calculator="darcy"], ' +
      '[data-calculator="manning"], ' +
      '[data-calculator="froude"]'
    )
    .forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();

        const output = form.querySelector(".study-calculator-output");
        const type = form.dataset.calculator;

        try {
          if (type === "reynolds") {
            const velocity = numberValue(form, "velocity");
            const diameter = numberValue(form, "diameter") / 1000;
            const viscosity = numberValue(form, "viscosity");

            if (
              !(velocity >= 0) ||
              !(diameter > 0) ||
              !(viscosity > 0)
            ) {
              throw new Error("Datos inválidos.");
            }

            const reynolds = velocity * diameter / viscosity;
            let regime = "laminar";

            if (reynolds >= 4000) {
              regime = "turbulento";
            } else if (reynolds >= 2300) {
              regime = "de transición";
            }

            output.textContent =
              `Resultado: Re = ${format(reynolds, 0)} · Régimen ${regime}.`;
          }

          if (type === "darcy") {
            const factor = numberValue(form, "factor");
            const length = numberValue(form, "length");
            const diameter = numberValue(form, "diameter") / 1000;
            const velocity = numberValue(form, "velocity");

            if (
              !(factor > 0) ||
              !(length >= 0) ||
              !(diameter > 0) ||
              !(velocity >= 0)
            ) {
              throw new Error("Datos inválidos.");
            }

            const loss =
              factor *
              (length / diameter) *
              (velocity ** 2 / (2 * 9.81));

            output.textContent =
              `Resultado: h_f = ${format(loss)} m.`;
          }

          if (type === "manning") {
            const area = numberValue(form, "area");
            const radius = numberValue(form, "radius");
            const slope = numberValue(form, "slope");
            const roughness = numberValue(form, "roughness");

            if (
              !(area > 0) ||
              !(radius > 0) ||
              !(slope >= 0) ||
              !(roughness > 0)
            ) {
              throw new Error("Datos inválidos.");
            }

            const flow =
              (1 / roughness) *
              area *
              radius ** (2 / 3) *
              slope ** 0.5;

            output.textContent =
              `Resultado: Q = ${format(flow)} m³/s ` +
              `(${format(flow * 1000)} L/s).`;
          }

          if (type === "froude") {
            const velocity = numberValue(form, "velocity");
            const depth = numberValue(form, "depth");

            if (!(velocity >= 0) || !(depth > 0)) {
              throw new Error("Datos inválidos.");
            }

            const froude = velocity / Math.sqrt(9.81 * depth);
            let regime = "subcrítico";

            if (Math.abs(froude - 1) <= 0.02) {
              regime = "aproximadamente crítico";
            } else if (froude > 1) {
              regime = "supercrítico";
            }

            output.textContent =
              `Resultado: Fr = ${format(froude)} · Flujo ${regime}.`;
          }
        } catch (error) {
          output.textContent =
            "No fue posible calcular. Verifica los valores y las unidades.";
        }
      });
    });
})();

