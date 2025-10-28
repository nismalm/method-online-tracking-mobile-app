import * as React from "react";
import Svg, { Rect } from "react-native-svg";
const stopIcon = (props) => (
  <Svg
    fill="#000000"
    width="800px"
    height="800px"
    viewBox="0 0 24 24"
    id="stop"
    data-name="Flat Color"
    xmlns="http://www.w3.org/2000/svg"
    className="icon flat-color"
    {...props}
  >
    <Rect
      id="primary"
      x={2}
      y={2}
      width={20}
      height={20}
      rx={2}
      style={{
        fill: "rgb(0, 0, 0)",
      }}
    />
  </Svg>
);
export default stopIcon;
