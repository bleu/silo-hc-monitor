import { STATE_TYPES } from "../constants";
import type { ManageState, State, WatchState } from "../types";

export function createState(
	type: (typeof STATE_TYPES)[keyof typeof STATE_TYPES],
	data: Record<string, unknown> | WatchState | ManageState,
): State {
	switch (type) {
		case STATE_TYPES.WATCH:
			return { type, data: data as WatchState };
		case STATE_TYPES.MANAGE:
			return { type, data: data as ManageState };
		case STATE_TYPES.IDLE:
			return { type };
		default:
			throw new Error(`Invalid state type: ${type}`);
	}
}
