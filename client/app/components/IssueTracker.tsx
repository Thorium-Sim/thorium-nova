import {
	createContext,
	type Dispatch,
	type ReactNode,
	type SetStateAction,
	useContext,
	useEffect,
	useState,
} from "react";
import Button from "@thorium/ui/Button";
import LoginButton from "./LoginButton";
import Modal from "@thorium/ui/Modal";
import { useThoriumAccount } from "../context/ThoriumAccountContext";
import Input from "@thorium/ui/Input";
import MarkdownInput from "@thorium/ui/MarkdownInput";
import randomWords from "@thorium/random-words";
import { toast } from "../context/ToastContext";
import packageJson from "@client/../../package.json";
import { Icon } from "./ui/Icon";

const availableLabels = [
	"Feature",
	"Bug",
	"Design",
	"Documentation",
	"Question",
	"Compliment",
];
const IssueTrackerContext = createContext<{
	open: boolean;
	setOpen: Dispatch<SetStateAction<boolean>>;
}>(null!);

export const IssueTrackerProvider = ({ children }: { children: ReactNode }) => {
	const [open, setOpen] = useState(false);

	return (
		<IssueTrackerContext.Provider value={{ open, setOpen }}>
			{children}
			<IssueTracker open={open} setOpen={setOpen} />
		</IssueTrackerContext.Provider>
	);
};

export const useIssueTracker = () => {
	const value = useContext(IssueTrackerContext);
	if (!value)
		throw new Error("useIssueTracker used outside of context provider");
	return value;
};

function IssueTracker({
	open,
	setOpen,
}: {
	open: boolean;
	setOpen: Dispatch<SetStateAction<boolean>>;
}) {
	const { account, refresh } = useThoriumAccount();
	const [body, setBody] = useState("");
	const [invalid, setInvalid] = useState<string[]>([]);

	useEffect(
		function revalidateOnVisibilityChange() {
			if (!open) return;
			function onVisibilityChange() {
				refresh();
			}
			window.addEventListener("visibilitychange", onVisibilityChange);
			return () =>
				window.removeEventListener("visibilitychange", onVisibilityChange);
		},
		[refresh, open],
	);
	useEffect(
		function revalidateOnFocus() {
			if (!open) return;
			function onFocus() {
				refresh();
			}
			window.addEventListener("focus", onFocus);
			return () => window.removeEventListener("focus", onFocus);
		},
		[refresh, open],
	);
	return (
		<Modal
			isOpen={open}
			setIsOpen={(open) => setOpen(open)}
			title="Submit an Issue"
		>
			{!account ? (
				<div className="text-center flex items-center justify-center flex-col gap-8 my-8">
					<h2 className="font-bold text-3xl">Sign in to Submit Issues</h2>
					<p className="w-64">
						To better track issues and collect feedback, you must be logged in
						to a Thorium Nova account.
					</p>
					<div>
						<LoginButton buttonClassName="btn-notice" />
					</div>
				</div>
			) : !account.accounts?.includes("github") ? (
				<div className="text-center flex items-center justify-center flex-col gap-8 my-8">
					<h2 className="font-bold text-3xl">Connect to Github</h2>
					<p className="w-64">
						To submit issues, you must connect your Thorium Nova account to
						Github.
					</p>
					<div>
						<a
							href="https://thoriumsim.com/profile"
							target="thoriumsim.com"
							className="btn btn-notice"
						>
							Connect Account <Icon name="external-link" className="ml-4" />
						</a>
					</div>
				</div>
			) : (
				<form
					className="flex flex-col gap-4 my-4 w-96"
					onSubmit={async (event) => {
						event.preventDefault();
						const title = event.currentTarget.issueTitle.value;
						const label = event.currentTarget.label.value;
						let isInvalid = false;
						if (!title) {
							isInvalid = true;
							setInvalid((invalid) => invalid.concat("title"));
						}
						if (!label || label === "Select One") {
							isInvalid = true;
							setInvalid((invalid) => invalid.concat("type"));
						}
						if (isInvalid) {
							return;
						}
						const requestBody = {
							repo: "thorium-nova",
							title,
							body: `${body}
                
### Version: ${packageJson.version}`,
							labels: [label],
						};
						setOpen(false);
						try {
							const response = await fetch(
								`${process.env.THORIUMSIM_URL}/api/issues`,
								{
									method: "POST",
									body: JSON.stringify(requestBody),
									headers: {
										"Content-Type": "application/json",
										Authorization: `Bearer ${account.access_token}`,
									},
								},
							);
							const result = await response.json();
							if (!response.ok || result.error) {
								toast({
									title: "Error Submitting Issue",
									body: result.error || "An unknown error occurred",
									color: "error",
								});
								return;
							}

							toast({ title: "Issue Submitted!", color: "success" });
							setBody("");
						} catch (err) {
							if (err instanceof Error) {
								toast({
									title: "Error Submitting Issue",
									body: err.message || "An unknown error occurred",
									color: "error",
								});
							}
							if (typeof err === "string") {
								toast({
									title: "Error Submitting Issue",
									body: err || "An unknown error occurred",
									color: "error",
								});
							}
						}
					}}
				>
					<Input
						label="Title"
						name="issueTitle"
						isInvalid={invalid.includes("title")}
						invalidMessage="Title is required."
						onFocus={() => setInvalid(invalid.filter((i) => i !== "title"))}
					/>
					<label className="flex flex-col">
						Body
						<MarkdownInput
							value={body}
							setValue={(newBody) => {
								setBody(newBody);
							}}
							name="body"
							saveImage={async function* saveImage(data: ArrayBuffer) {
								const uploadDataRequest = await fetch(
									`${process.env.THORIUMSIM_URL}/api/uploadData`,
									{
										headers: {
											Authorization: `Bearer ${account.access_token}`,
										},
									},
								);
								const uploadData = await uploadDataRequest.json();
								if (!uploadDataRequest.ok) {
									toast({
										title: "Error Uploading File",
										body: uploadData.error,
										color: "error",
									});
									throw new Error(uploadData.error);
								}
								const nameParts = randomWords(3);
								const name = `${
									Array.isArray(nameParts) ? nameParts.join("-") : nameParts
								}-${Date.now()}`;
								const image = new File([new Blob([data])], `${name}.png`, {
									type: "image/png",
								});
								const result = await fetch(uploadData.uploadUrl, {
									method: "POST",
									body: image,
									headers: {
										Authorization: uploadData.authorizationToken,
										"Content-Type": "b2/x-auto",
										"X-Bz-File-Name": `issue_uploads/${image.name.replace(
											/\s/gm,
											"-",
										)}`,
										"X-Bz-Content-Sha1": "do_not_verify",
									},
								}).then((res) => res.json());
								const { fileName } = result;
								const url = `https://files.thoriumsim.com/file/thorium-public/${fileName}`;
								yield url;
								// returns true meaning that the save was successful
								return true;
							}}
						/>
					</label>
					<Input
						as="select"
						label="Type"
						className="form-select block w-full select max-w-xs select-sm"
						isInvalid={invalid.includes("type")}
						invalidMessage="Type is required."
						onChange={(e) =>
							e.target.value !== "Select One" &&
							setInvalid(invalid.filter((i) => i !== "type"))
						}
						name="label"
					>
						<option>Select One</option>
						{availableLabels.map((label) => (
							<option key={label}>{label}</option>
						))}
					</Input>
					<Button className="btn-success self-end">Submit</Button>
				</form>
			)}
		</Modal>
	);
}
