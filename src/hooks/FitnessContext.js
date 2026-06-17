import { createContext } from 'react';

// Shared context object — lives in its own file so that
// useFitness.jsx (provider) and useFitnessContext.jsx (hook)
// can both import it without Vite Fast Refresh warnings.
export const FitnessContext = createContext();
