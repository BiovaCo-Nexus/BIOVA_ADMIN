   // src/hooks/use-confirm.ts
   import { useState } from 'react';

   export const useConfirm = (message: string = "Are you sure?") => {
     const [isConfirmed, setIsConfirmed] = useState(false);

     const confirm = async () => {
       const result = window.confirm(message);
       setIsConfirmed(result);
       return result;
     };

     return { confirm, isConfirmed };
   };
   