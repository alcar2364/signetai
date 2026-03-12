import { MediaQuery } from "svelte/reactivity";

// Desktop app — only collapse to mobile sheet at extremely narrow widths.
// The default shadcn 768px is for responsive websites; a native app with
// min-width 800px at 200% DPI yields ~400px logical, so we go well below that.
const DEFAULT_MOBILE_BREAKPOINT = 200;

export class IsMobile extends MediaQuery {
	constructor(breakpoint: number = DEFAULT_MOBILE_BREAKPOINT) {
		super(`max-width: ${breakpoint - 1}px`);
	}
}
