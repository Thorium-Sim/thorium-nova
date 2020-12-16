export function Spacer({fillWidth = false}: {fillWidth?: boolean}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="100"
      width="100"
      className={fillWidth ? "h-auto w-full" : "h-full w-auto"}
    />
  );
}
