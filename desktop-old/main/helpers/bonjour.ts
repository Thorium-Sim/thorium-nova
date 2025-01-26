import { ipcMain } from "electron-better-ipc";
import bonjourInit, { type Browser, type RemoteService } from "bonjour";
const bonjourInstance = bonjourInit();

function printUrl(address: string, httpOnly: boolean, port: number) {
	return `http${httpOnly ? "" : "s"}://${address}${
		(port === 443 && !httpOnly) || (port === 80 && httpOnly) ? "" : `:${port}`
	}`;
}

class BonjourBrowser {
	browser: null | Browser = null;
	start() {
		this.browser = bonjourInstance.find({ type: "http" }, newService);
		const servers: { name: string; url: string }[] = [];
		function newService(service: RemoteService) {
			if (service.name.indexOf("Thorium") > -1 || service.type === "local") {
				const isHttps = service.txt.https === "true";
				const ipregex =
					/[0-2]?[0-9]{1,2}\.[0-2]?[0-9]{1,2}\.[0-2]?[0-9]{1,2}\.[0-2]?[0-9]{1,2}/gi;
				const address = service.addresses.find((a) => ipregex.test(a));
				if (!address) return;
				const uri = `${printUrl(address, !isHttps, service.port)}/client`;
				servers.push({
					name: service.host,
					url: uri,
				});
			}
		}
		ipcMain.answerRenderer("getServers", async () => servers);
	}
	stop() {
		this.browser?.stop();
	}
}

export const bonjour = new BonjourBrowser();
