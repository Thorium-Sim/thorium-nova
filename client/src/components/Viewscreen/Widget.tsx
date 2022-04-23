export {};
// export const ViewscreenWidget: FC<{close: () => void}> = ({close}) => {
//   const ref = useRef<HTMLDivElement>(null);
//   const [props, styles] = usePip(ref);
//   return (
//     <animated.div
//       className="widget-body"
//       ref={ref}
//       {...props()}
//       style={{...styles}}
//       css={css`
//         z-index: 100;
//         min-width: 10rem;
//         min-height: 10rem;
//         background-color: #333;
//         pointer-events: all;
//         cursor: grab;
//         &:active {
//           cursor: grabbing;
//         }
//         &:hover .close-button {
//           opacity: 1;
//         }
//       `}
//     >
//       <div
//         css={css`
//           width: 640px;
//           height: 360px;
//           pointer-events: none;
//         `}
//         className="relative "
//       >
//         <Viewscreen />
//       </div>
//       <FaTimes
//         className="close-button absolute p-1 text-2xl top-1 right-1 rounded-full bg-white/20 text-white hover:bg-white/30 cursor-pointer transition-opacity opacity-0"
//         onClick={close}
//       ></FaTimes>
//     </animated.div>
//   );
// };
