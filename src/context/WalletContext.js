import { createContext, useContext } from 'react';
import { useWalletLogic } from '../hooks/useWalletLogic';

const WalletContext = createContext();

export const useWallet = () => useContext(WalletContext);

export const WalletProvider = ({ children }) => {
  const walletData = useWalletLogic();
  
  return <WalletContext.Provider value={walletData}>{children}</WalletContext.Provider>;
}; 