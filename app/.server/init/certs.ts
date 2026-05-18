import fs from "fs";
import path from "path";

// src/pki.ts
import * as x509 from "@peculiar/x509";
import { DataStore } from "@thorium/utils/.server/db-fs";

const HOSTNAME = "thorium.local";

// Point the library at the native Web Crypto implementation
x509.cryptoProvider.set(crypto);

const EC_ALG = { name: "ECDSA", namedCurve: "P-256", hash: "SHA-256" } as const;

async function generateCA() {
	const keys = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, [
		"sign",
		"verify",
	]);

	const cert = await x509.X509CertificateGenerator.createSelfSigned({
		serialNumber: generateSerial(),
		name: "CN=Thorium Nova Local CA, O=Thorium Nova",
		notBefore: new Date(),
		notAfter: new Date(Date.now() + 30 * 365 * 24 * 60 * 60 * 1000),
		signingAlgorithm: EC_ALG,
		keys,
		extensions: [
			new x509.BasicConstraintsExtension(true, undefined, true),
			new x509.KeyUsagesExtension(
				x509.KeyUsageFlags.keyCertSign | x509.KeyUsageFlags.cRLSign,
				true,
			),
			await x509.SubjectKeyIdentifierExtension.create(keys.publicKey),
		],
	});

	return { cert, keys };
}

function generateSerial(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(4));
	bytes[0] &= 0x7f; // ensure high bit is clear so it's always positive
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

async function generateServerCert(caKeys: CryptoKeyPair, caCert: x509.X509Certificate) {
	const keys = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, [
		"sign",
		"verify",
	]);

	const cert = await x509.X509CertificateGenerator.create({
		serialNumber: generateSerial(),
		subject: `CN=${HOSTNAME}`,
		issuer: caCert.subject,
		notBefore: new Date(),
		notAfter: new Date(Date.now() + 30 * 365 * 24 * 60 * 60 * 1000),
		signingKey: caKeys.privateKey,
		publicKey: keys.publicKey,
		signingAlgorithm: EC_ALG,
		extensions: [
			new x509.BasicConstraintsExtension(false),
			new x509.KeyUsagesExtension(
				x509.KeyUsageFlags.digitalSignature | x509.KeyUsageFlags.keyEncipherment,
			),
			new x509.ExtendedKeyUsageExtension(["1.3.6.1.5.5.7.3.1"]),
			new x509.SubjectAlternativeNameExtension([
				{ type: "dns", value: HOSTNAME },
				{ type: "dns", value: "localhost" },
				{ type: "ip", value: "127.0.0.1" },
			]),
			await x509.AuthorityKeyIdentifierExtension.create(caKeys.publicKey),
		],
	});

	return { cert, keys };
}

async function exportPrivateKeyPem(key: CryptoKey): Promise<string> {
	const der = await crypto.subtle.exportKey("pkcs8", key);
	const b64 = Buffer.from(der).toString("base64");
	return `-----BEGIN PRIVATE KEY-----\n${b64.match(/.{1,64}/g)!.join("\n")}\n-----END PRIVATE KEY-----`;
}

export async function loadOrCreateCerts() {
	const thoriumPath = DataStore.operations.getStore()!.thoriumPath;
	const DATA_DIR = path.join(thoriumPath, "certs");
	fs.mkdirSync(DATA_DIR, { recursive: true });

	const caKeyFile = path.join(DATA_DIR, "ca.key");
	const caCertFile = path.join(DATA_DIR, "ca.crt");
	const serverKeyFile = path.join(DATA_DIR, "server.key");
	const serverCertFile = path.join(DATA_DIR, "server.crt");

	if (fs.existsSync(caCertFile) && fs.existsSync(serverCertFile) && fs.existsSync(serverKeyFile)) {
		const caPem = fs.readFileSync(caCertFile, "utf8");
		const serverCertPem = fs.readFileSync(serverCertFile, "utf8");

		const serverKeyPem = fs.readFileSync(serverKeyFile, "utf8");
		return { caPem, serverCertPem, serverKeyPem };
	}

	const { cert: caCert, keys: caKeys } = await generateCA();
	fs.writeFileSync(caCertFile, caCert.toString("pem"));
	fs.writeFileSync(caKeyFile, await exportPrivateKeyPem(caKeys.privateKey));

	const { cert: serverCert, keys: serverKeys } = await generateServerCert(caKeys, caCert);
	fs.writeFileSync(serverCertFile, serverCert.toString("pem"));
	fs.writeFileSync(serverKeyFile, await exportPrivateKeyPem(serverKeys.privateKey));

	return {
		caPem: caCert.toString("pem"),
		serverCertPem: serverCert.toString("pem"),
		serverKeyPem: await exportPrivateKeyPem(serverKeys.privateKey),
	};
}
