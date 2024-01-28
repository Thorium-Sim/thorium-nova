import useMeasure from "@client/hooks/useMeasure";

const sinePoints = ({
  amplitude,
  frequency,
  width,
  height,
  orientation,
}: {
  amplitude: number;
  frequency: number;
  width: number;
  height: number;
  orientation: "vertical" | "horizontal";
}) => {
  if (orientation === "horizontal") {
    let sinWidth = width * 2 * 2;
    return Array(Math.round(sinWidth))
      .fill(0)
      .map((_, i) => {
        if (i % 2 === 0) return i / 2;
        return (
          Math.sin(i / 2 / frequency) * ((amplitude * height) / 2) + height / 2
        );
      });
  }
  let sinHeight = height * 2 * 2;
  return Array(Math.round(sinHeight))
    .fill(0)
    .map((_, i) => {
      if (i % 2 === 1) return i / 2;
      return (
        Math.sin(i / 2 / frequency) * ((amplitude * width) / 2) + width / 2
      );
    });
};

const SineWave = ({
  amplitude = 0.25,
  frequency = 50,
  phase = 0.1,
  className = "",
  color = "red",
  strokeWidth = 2,
  orientation = "horizontal",
}: {
  amplitude?: number;
  frequency?: number;
  phase?: number;
  className?: string;
  color?: string;
  strokeWidth?: number;
  orientation?: "vertical" | "horizontal";
}) => {
  const [ref, {width, height}] = useMeasure<HTMLDivElement>();
  const points = sinePoints({width, height, amplitude, frequency, orientation});
  return (
    <div ref={ref} className={`w-full h-full ${className}`}>
      <svg key={"decoding-line"} className="w-full h-full">
        <path
          d={points.reduce(
            (prev, next, index) =>
              prev + `${index % 2 === 0 ? "L" : ""} ${next}`,
            `M ${(orientation === "vertical" ? width : 0) / 2} ${
              (orientation === "vertical" ? 0 : height) / 2
            }`
          )}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
        />
      </svg>
    </div>
  );
};

export default SineWave;
