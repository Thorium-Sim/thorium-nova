export function shipPubsubFilter(
	publish: { shipId: number },
	{ input }: { input: { shipId: number } },
): boolean {
	if (publish && "shipId" in publish && publish.shipId !== input.shipId) return false;

	return true;
}

export function systemPubsubFilter(
	publish: { systemId: number },
	{ input }: { input: { systemId: number } },
): boolean {
	if (publish && "systemId" in publish && publish.systemId !== input.systemId) return false;

	return true;
}
