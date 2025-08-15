import { LightsOut } from "@thorium/components/MiniGames/LightsOut";
import Button from "@thorium/ui/Button";
import { cn } from "@thorium/utils/cn";
import { produce } from "immer";
import { useState } from "react";

export default function () {
	return <LightsOut onComplete={() => alert("You win!")} />;
}
