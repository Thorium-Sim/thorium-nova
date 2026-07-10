import InfoTip from "@thorium/ui/InfoTip";
import { cn } from "@thorium/utils/cn";
import type { DetailedHTMLProps, HTMLAttributes } from "react";

export function InterpolateInfo({ className, basic }: { className?: string; basic?: boolean }) {
	return (
		<InfoTip
			className={cn("absolute -right-4 -bottom-4", className)}
			dialogClassName="max-w-xl max-h-96 overflow-y-auto"
		>
			Use the following rules to generate text:
			<ul className="ml-4 list-disc">
				{basic ? null : (
					<>
						<li>
							<Code>{`{variableName}`}</Code> - interpolate variables into your text
						</li>
						<li>
							<Code>{`[variableName|option if variable is truthy|option if variable is not truthy]`}</Code>{" "}
							- interpolate based on the existence of a variable, or whether or not it is true. The
							first option will be inserted if the variable exists. The second option will be
							inserted if the variable does not exist or is false.
						</li>
						<li>
							<Code>{`[damageType|Electrical:electrical subsystems|Radiation:protective coating|default:structure]`}</Code>{" "}
							- picks between options based on a variable's value, falling back on the default case.
						</li>
						<li>
							<Code>{`The [damageType|Electrical:electrical subsystems;verb=have|Radiation:radiation coating;verb=has|default:structure;verb=has] of the {systemName} {verb} sustained damage`}</Code>{" "}
							- Sets intermediate variables which can be used later in the text.
						</li>
					</>
				)}
				<li>
					<Code>{`The code is {~Alpha,Beta,Gamma,Delta}`}</Code> - randomly chooses from
					comma-separated options
				</li>
				<li>
					<Code>{`The code is RANDOM(100,999)`}</Code> - randomly chooses from two numbers. If one
					number is supplied, the output will be between 0 and that number.
				</li>
				<li>
					<Code>{`The CAPITALIZE(warpEngine)`}</Code> - converts a string to capital case, including
					separating words based on capitalization.
				</li>
				<li>
					<Code>{`The UPPERCASE(warpEngine)`}</Code> - converts a string to uppercase case.
				</li>
				<li>
					<Code>{`The LOWERCASE(warpEngine)`}</Code> - converts a string to lower case.
				</li>
				<li>
					<Code>{`The PLURALIZE({count},{tool},{tool}s)`}</Code> - pluralizes text based on a count
					value.
				</li>
				<li>
					<Code>{`{#Thorium Default:Adjectives} {#Nouns}`}</Code> - includes a text pattern. Plugin
					name is optional, but could result in using an unintended text pattern.
				</li>
			</ul>
		</InfoTip>
	);
}

function Code(props: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>) {
	return <code {...props} className={cn("bg-notice rounded", props.className)} />;
}
