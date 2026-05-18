import { browse } from "./app/utils/.server/mdns/dns_sd/browse";
import { MulticastInterface } from "./app/utils/.server/mdns/mdns/multicast_interface";

for await (const service of browse({
	multicastInterface: new MulticastInterface(),
	service: { type: "http", protocol: "tcp" },
})) {
	console.log("New Service!", service);
}

// const server = Bun.serve({
// 	port: 3000,

// 	fetch(request) {
// 		console.log(new URL(request.url).hostname);
// 		return new Response(
// 			` <!DOCTYPE html>
//       <html>
//       <head><title>Spaceship Game Setup</title></head>
//       <body>
//         <h1>One-time setup required</h1>
//         <p>To play over a secure connection, install our local certificate:</p>
//         <ol>
//           <li><a href="/ca.crt">Download the certificate</a></li>
//           <li>Open the downloaded file and mark it as <strong>Trusted</strong></li>
//           <li><a href="https://spacegame.local">Play the game!</a></li>
//         </ol>
//         <h2>Platform instructions</h2>
//         <details><summary>Windows</summary>
//           <p>Double-click the .crt file → Install Certificate → Local Machine
//           → Place in "Trusted Root Certification Authorities"</p>
//         </details>
//         <details><summary>macOS</summary>
//           <p>Double-click the .crt → Keychain Access opens → double-click the cert
//           → expand "Trust" → set "When using this certificate" to "Always Trust"</p>
//         </details>
//         <details><summary>Android</summary>
//           <p>Settings → Security → Install from storage → pick the .crt file</p>
//         </details>
//         <details><summary>iOS</summary>
//           <p>Open the .crt link in Safari → Settings → General → VPN & Device Management
//           → install the profile → Settings → General → About → Certificate Trust Settings → enable it</p>
//         </details>
//       </body>
//       </html>`,
// 			{ headers: { "Content-Type": "text/html" } },
// 		);
// 	},
// });

// await advertiseMdns(Number(server.url.port));

// console.log(server.url.href);
