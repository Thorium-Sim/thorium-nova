import React from "react";
import {act} from "react-dom/test-utils";
import useMeasure from "./useMeasure";

// const TestComp = ({getDimensions}: any) => {
//   const [ref, dimensions, rerender, node] = useMeasure<HTMLDivElement>();
//   React.useLayoutEffect(() => {
//     getDimensions({dimensions, rerender, node});
//   }, []);
//   return (
//     <div
//       ref={ref}
//       data-testid="test-comp"
//       style={{width: "300px", height: "200px"}}
//     ></div>
//   );
// };
// describe("useMeasure", () => {
//   beforeEach(() => {
//     jest.spyOn(window, "requestAnimationFrame").mockImplementation(cb => {
//       cb(0);
//       return 0;
//     });
//   });

//   afterEach(() => {
//     // @ts-ignore
//     window.requestAnimationFrame.mockRestore();
//   });
//   it("should listen for the events", async () => {
//     let testData: any = {};

//     const {findByTestId} = render(
//       <TestComp
//         getDimensions={(data: any) => {
//           testData = data;
//         }}
//       />
//     );
//     const element = await findByTestId("test-comp");
//     expect(element).toBeInTheDocument();
//     act(() => {
//       testData.rerender();
//     });
//     expect(testData.dimensions).toMatchInlineSnapshot(`
//       Object {
//         "bottom": 0,
//         "height": 0,
//         "left": 0,
//         "right": 0,
//         "top": 0,
//         "width": 0,
//         "x": 0,
//         "y": 0,
//       }
//     `);
//   });
// });
