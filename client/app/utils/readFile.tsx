export async function readFile(file: File) {
	const reader = new FileReader();
	const result: string = await new Promise((res) => {
		reader.addEventListener(
			"load",
			() => {
				// convert image file to base64 string
				res(reader.result as string);
			},
			false,
		);

		if (file) {
			reader.readAsDataURL(file);
		}
	});
	return result;
}
