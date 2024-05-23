const cursorList = [
	"default",
	"pointer",
	"text",
	"progress",
	"not-allowed",
	"wait",
] as const;
export function setCursor(
	cursor: (typeof cursorList)[number] | "auto" = "auto",
) {
	cursorList.forEach((c) => document.body.classList.remove(`cursor-${c}`));
	if (cursor && cursor !== "auto")
		document.body.classList.add(`cursor-${cursor}`);
}
