import * as React from 'react';
import Svg, {Path, Rect} from 'react-native-svg';

const CalculatorIcon = ({width = 24, height = 24, fill = '#000', stroke = '#000'}) => (
  <Svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg">
    <Rect
      x="4"
      y="2"
      width="16"
      height="20"
      rx="2"
      stroke={stroke}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Rect
      x="7"
      y="5"
      width="10"
      height="4"
      rx="1"
      fill={fill}
    />
    <Path
      d="M8 14h2M8 18h2M14 14h2M14 18h2"
      stroke={stroke}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default CalculatorIcon;
