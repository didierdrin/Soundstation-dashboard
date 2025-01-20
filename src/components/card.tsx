// Card 
import React, { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

const Card: React.FC<Props> = ({ children }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      {children}
    </div>
  );
};

export default Card;
