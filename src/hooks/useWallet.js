import { useWallet as useWalletFromContext } from '../context/WalletContext';

/**
 * Custom hook for accessing wallet functionality.
 * This hook provides a way to connect to Ethereum wallets and interact with contracts.
 * It also manages user profile data with localStorage caching.
 * 
 * @returns {Object} Wallet-related state and functions
 * @returns {boolean} loading - Whether the wallet is in a loading state
 * @returns {string|null} account - The connected account address or null if not connected
 * @returns {Object|null} contract - The initialized contract instance or null
 * @returns {Object|null} profile - The user's profile data or null if not loaded
 * @returns {boolean} profileLoading - Whether the profile is being loaded
 * @returns {Function} connectWallet - Function to connect to the wallet
 * @returns {Function} fetchProfile - Function to fetch a user's profile (uses cache if available)
 * @returns {Function} updateProfile - Function to update a user's profile and update cache
 * @returns {Function} clearProfileCache - Function to clear the profile cache
 * @returns {boolean} isMetamaskInstalled - Whether MetaMask is installed
 * @returns {string|null} networkError - Any network connection error message
 */
export const useWallet = () => {
  return useWalletFromContext();
}; 