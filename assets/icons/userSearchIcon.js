import * as React from "react";
import Svg, { Path, Circle } from "react-native-svg";
const UserSearchIcon = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <Circle cx="10" cy="8" r="4" strokeLinecap="round" strokeLinejoin="round" />
    <Path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10.35 14.01C7.62 13.91 2 15.27 2 18v2h9.54"
    />
    <Circle cx="19.5" cy="18.5" r="3.5" strokeLinecap="round" strokeLinejoin="round" />
    <Path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m22 22-1.5-1.5"
    />
  </Svg>
);
export default UserSearchIcon;

