import * as React from "react";
import Svg, { Path, Rect } from "react-native-svg";
/* SVGR has dropped some elements not supported by react-native-svg: title */
const shareIcon = (props) => (
  <Svg
    fill="#000000"
    width="800px"
    height="800px"
    viewBox="0 0 36 36"
    preserveAspectRatio="xMidYMid meet"
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    {...props}
  >
    <Path
      className="clr-i-solid clr-i-solid-path-1"
      d="M27.53,24a5,5,0,0,0-3.6,1.55L11.74,19.45a4.47,4.47,0,0,0,0-2.8l12.21-6.21a5.12,5.12,0,1,0-1.07-1.7L10.79,14.89a5,5,0,1,0,0,6.33l12.06,6.07A4.93,4.93,0,0,0,22.54,29a5,5,0,1,0,5-5Z"
    />
    <Rect x={0} y={0} width={36} height={36} fillOpacity={0} />
  </Svg>
);
export default shareIcon;
