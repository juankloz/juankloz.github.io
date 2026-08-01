(() => {
  "use strict";

  const checker = document.querySelector("[data-task-checker]");
  const checkKey = "juankloz:tarea-aplicacion:checklist";

  const readState = () => {
    try { return JSON.parse(localStorage.getItem(checkKey) || "{}"); }
    catch (_) { return {}; }
  };

  const writeState = (state) => {
    try { localStorage.setItem(checkKey, JSON.stringify(state)); }
    catch (_) { /* The checklist works even if storage is disabled. */ }
  };

  if (checker) {
    const inputs = [...checker.querySelectorAll("[data-task-check]")];
    const percent = checker.querySelector("[data-task-check-percent]");
    const bar = checker.querySelector("[data-task-check-bar]");
    const reset = checker.querySelector("[data-task-check-reset]");
    const state = readState();

    inputs.forEach(input => { input.checked = Boolean(state[input.dataset.taskCheck]); });

    const update = () => {
      const completed = inputs.filter(input => input.checked).length;
      const value = inputs.length ? Math.round(completed / inputs.length * 100) : 0;
      if (percent) percent.textContent = value;
      if (bar) bar.style.width = `${value}%`;
      const next = {};
      inputs.forEach(input => { next[input.dataset.taskCheck] = input.checked; });
      writeState(next);
    };

    inputs.forEach(input => input.addEventListener("change", update));
    reset?.addEventListener("click", () => {
      inputs.forEach(input => { input.checked = false; });
      writeState({});
      update();
    });
    update();
  }

  const form = document.querySelector("[data-task-grade-form]");
  if (form) {
    const weights = [0.15, 0.30, 0.20, 0.15, 0.10, 0.10];
    const result = form.querySelector("[data-task-grade-result]");
    const message = form.querySelector("[data-task-grade-message]");

    const calculate = () => {
      const selects = [...form.querySelectorAll("select")];
      const values = selects.map(select => Number(select.value));
      const complete = values.every(value => Number.isFinite(value) && value > 0);
      if (!complete) {
        result.textContent = "—";
        message.textContent = "Selecciona los seis niveles.";
        return;
      }
      const grade = values.reduce((sum, value, index) => sum + value * weights[index], 0);
      const rounded = Math.round(grade * 100) / 100;
      result.textContent = rounded.toLocaleString("es-CO", {minimumFractionDigits: 2, maximumFractionDigits: 2});
      message.textContent = rounded >= 4.6 ? "Desempeño excelente." : rounded >= 4.0 ? "Desempeño competente." : rounded >= 3.0 ? "Desempeño en desarrollo." : "Desempeño insuficiente.";
    };

    form.addEventListener("change", calculate);
    form.addEventListener("reset", () => window.setTimeout(calculate, 0));
  }
})();
