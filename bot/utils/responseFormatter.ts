import { PARSE_MODE } from "../constants";
import type { CommandResponse, State } from "../types";

export function formatResponse(
	newState: State,
	text: string,
	options: Partial<CommandResponse["reply"]> = {},
): CommandResponse {
	return {
		newState,
		reply: {
			text,
			parse_mode: PARSE_MODE.MARKDOWN,
			...options,
		},
	};
}
