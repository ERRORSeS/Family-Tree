const phases = ["Morning", "Afternoon", "Evening", "Night"];
export function advanceTime(state) {
  state.tick += 1;
  state.phaseIndex = (state.phaseIndex + 1) % phases.length;
  if (state.phaseIndex === 0) state.year += 1;
  state.phase = phases[state.phaseIndex];
}
