const phases = ["Morning", "Afternoon", "Evening", "Night"];

export function advancePhase(state, units = 1) {
  for (let i = 0; i < units; i += 1) {
    state.tick += 1;
    state.day += 1;
    state.phaseIndex = (state.phaseIndex + 1) % phases.length;
    if (state.phaseIndex === 0) state.monthDay += 1;

    if (state.monthDay > 30) {
      state.monthDay = 1;
      state.month += 1;
      applyMonthlyCycle(state);
    }
    if (state.month > 12) {
      state.month = 1;
      state.year += 1;
      applyYearlyCycle(state);
    }
  }
  state.phase = phases[state.phaseIndex];
}

export function skipDay(state) { advancePhase(state, 1); }
export function skipWeek(state) { advancePhase(state, 7); }
export function skipMonth(state) { advancePhase(state, 30); }
export function skipYear(state) { advancePhase(state, 360); }

function applyMonthlyCycle(state) {
  state.cycleFlags.monthly = true;
}

function applyYearlyCycle(state) {
  state.cycleFlags.yearly = true;
}
