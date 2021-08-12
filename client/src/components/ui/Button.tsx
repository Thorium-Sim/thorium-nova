// This component should be used for all buttons to make it easy to add user interface sound effects.
export default function Button(
  props: React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >
) {
  const className = `btn ${props.className || ""}`;
  return <button {...props} className={className} />;
}
