export function shipPubsubFilter(
	publish: { shipId: number },
	{ input }: { input: { shipId: number } },
): boolean {
	if (publish && "shipId" in publish && publish.shipId !== input.shipId)
		return false;

	return true;
}
