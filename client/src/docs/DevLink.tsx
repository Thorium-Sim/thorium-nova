export default function DevLink({children}: {children: string}) {
  return (
    <button
      className="text-purple-300 font-mono"
      onClick={() => {
        if (process.env.NODE_ENV === "development") {
          fetch(
            `/__open-in-editor?file=${encodeURIComponent(
              `${process.env.USER_PATH}${children}`
            )}`
          );
        }
      }}
    >
      {children}
    </button>
  );
}
