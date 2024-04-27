import { useState, useEffect } from "react";
import { Tooltip } from "@thorium/ui/Tooltip";
import { useShipMapStore } from "./useShipMapStore";
import { Icon } from "@thorium/ui/Icon";
import Button from "@thorium/ui/Button";
import Modal from "@thorium/ui/Modal";

export function EditDecknameButton({
	decks,
	currentDeckIndex,
}: {
	decks: { name: string }[];
	currentDeckIndex: number;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const deck = decks[currentDeckIndex];
	const [deckname, setDeckname] = useState("");

	useEffect(() => {
		setDeckname(deck.name);
	}, [deck.name]);

	return (
		<Tooltip content="Edit Deck Name">
			<Button
				className="mt-4 w-full cursor-pointer"
				onClick={() => {
					setIsOpen(true);
				}}
				aria-label="Edit Deck Name"
			>
				<Icon name="pencil" />
			</Button>

			<Modal isOpen={isOpen} setIsOpen={setIsOpen} title="Edit Deck Name">
				<div className="form-control mt-4">
					<label className="label">new name</label>
					<input
						type="text"
						className="input"
						value={deckname}
						onChange={(e) => setDeckname(e.target.value)}
					/>
				</div>
				<Button
					className="btn-primary btn-sm mt-4"
					onClick={() => {
						deck.name = deckname;
						setIsOpen(false);
					}}
				>
					Save
				</Button>
			</Modal>
		</Tooltip>
	);
}
