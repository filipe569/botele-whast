
import React from 'react';

const TelegramIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
      fill="#2AABEE"
    />
    <path
      d="M9.413 14.832l.333 3.493a.476.476 0 00.733.344l1.636-1.581 3.294 2.434a.952.952 0 001.48-.823l2.067-9.67a.952.952 0 00-1.294-1.103L4.544 11.08a.952.952 0 00.038 1.78l3.08 1.027 7.03-4.416c.33-.207.618.1.344.38L9.413 14.832z"
      fill="#fff"
    />
  </svg>
);

export default TelegramIcon;
