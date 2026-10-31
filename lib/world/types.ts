/** The environment is independent of the memorial's chapter UI. A future clock
 * (for example Asia/Karachi) can supply these conditions without changing actors. */
export type EnvironmentConditions = { night: number; wind: number };
export type WorldFrame = { elapsed: number; delta: number; motion: boolean; environment: EnvironmentConditions };
export type WorldSystem = { update: (frame: WorldFrame) => void; dispose?: () => void };

export function chapterConditions(chapter: number): EnvironmentConditions {
  return { night: chapter < 2 ? 0 : chapter === 2 ? .58 : 1, wind: .7 };
}
