import { useState, useEffect, useMemo } from 'react';
import { ethers } from "ethers";
import DecentratwitterAbi from '../contractsData/decentratwitter.json';
import DecentratwitterAddress from '../contractsData/decentratwitter-address.json';

const PROFILE_STORAGE_KEY = 'decentratwitter_profile';

export const useWalletLogic = () => {
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [isMetamaskInstalled, setIsMetamaskInstalled] = useState(false);
  const [networkError, setNetworkError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Try to load profile from localStorage on initial render
  useEffect(() => {
    const loadCachedProfile = () => {
      try {
        const cachedProfileData = localStorage.getItem(PROFILE_STORAGE_KEY);
        if (cachedProfileData) {
          const parsed = JSON.parse(cachedProfileData);
          // Only use cached profile if account matches
          if (parsed.account === account) {
            const profileWithFlag = {
              ...parsed.profile,
              _fromCache: true,
              _cachedAt: parsed.timestamp
            };
            setProfile(profileWithFlag);
            console.log("Loaded profile from cache", profileWithFlag);
          }
        }
      } catch (error) {
        console.error("Error loading cached profile:", error);
      }
    };

    if (account) {
      loadCachedProfile();
    } else {
      // Clear profile if no account
      setProfile(null);
    }
  }, [account]);

  // Check if Metamask is installed
  useEffect(() => {
    const checkMetamask = async () => {
      setLoading(true);
      setInitializing(true);
      
      if (window.ethereum) {
        setIsMetamaskInstalled(true);
        setupEventListeners();
        
        // Check if already connected
        try {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const accounts = await provider.listAccounts();
          
          if (accounts.length > 0) {
            // User is already connected, set up the account
            await connectWallet();
          } else {
            setLoading(false);
          }
        } catch (error) {
          console.error("Error checking existing connection:", error);
          setLoading(false);
        }
      } else {
        setIsMetamaskInstalled(false);
        setLoading(false);
      }
      
      // End initializing phase regardless of the outcome
      setInitializing(false);
    };
    
    checkMetamask();
  }, []);

  const checkNetwork = async (provider) => {
    try {
      const network = await provider.getNetwork();
      console.log("Connected to network:", network.name);
      
      // You can add specific network checks here based on your deployment
      // For example, if your contract is on Ropsten and user is on Mainnet
      // const requiredChainId = 3; // Ropsten
      // if (network.chainId !== requiredChainId) {
      //   setNetworkError(`Please connect to the correct network. Required: Ropsten`);
      //   return false;
      // }
      
      return true;
    } catch (error) {
      console.error("Error checking network:", error);
      setNetworkError("Could not verify network. Please check your connection.");
      return false;
    }
  };

  const disconnectWallet = () => {
    // Clear account and contract states
    setAccount(null);
    setContract(null);
    setProfile(null);
    
    // Note: MetaMask doesn't provide a direct way to disconnect
    // This function just clears our local state, but MetaMask will still show as connected
    // The user needs to disconnect from their MetaMask wallet directly for a complete disconnect
    
    console.log("Wallet disconnected from application");
    return true;
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      console.error("Metamask not installed");
      return false;
    }
    
    setLoading(true);
    setNetworkError(null);
    
    try {
      // Get provider and check network
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const networkValid = await checkNetwork(provider);
      
      if (!networkValid) {
        setLoading(false);
        return false;
      }
      
      // Request accounts
      let accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);

      // Get signer
      const signer = provider.getSigner();
      
      // Verify the contract exists at the address
      try {
        const contractCode = await provider.getCode(DecentratwitterAddress.address);
        if (contractCode === '0x') {
          console.error("No contract found at the specified address");
          setNetworkError("No contract found at the specified address. Make sure you're connected to the correct network.");
          setLoading(false);
          return false;
        }
      } catch (error) {
        console.error("Error checking contract code:", error);
      }
      
      // Get deployed copy of Decentratwitter contract
      try {
        const contract = new ethers.Contract(
          DecentratwitterAddress.address,
          DecentratwitterAbi.abi,
          signer
        );
        
        // Validate contract by checking if it has the expected methods
        if (!contract.functions.hasOwnProperty('balanceOf')) {
          console.error("Contract does not have expected methods");
          setNetworkError("Contract interface does not match. Please check your connection.");
          setLoading(false);
          return false;
        }
        
        setContract(contract);
        
        // After successful connection, fetch user profile
        await fetchProfile(accounts[0], contract);
        
        setLoading(false);
        return true;
      } catch (error) {
        console.error("Error initializing contract:", error);
        setNetworkError("Failed to initialize contract. Please check your network connection.");
        setLoading(false);
        return false;
      }
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      if (error.code === 4001) {
        setNetworkError("Connection rejected by user.");
      } else {
        setNetworkError(`Error connecting to wallet: ${error.message}`);
      }
      setLoading(false);
      return false;
    }
  };

  const fetchProfile = async (userAddress, contractInstance) => {
    if (!userAddress || !contractInstance) return;

    setProfileLoading(true);
    try {
      // Check if we have a cached profile
      const cachedProfileData = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (cachedProfileData) {
        const parsed = JSON.parse(cachedProfileData);
        if (parsed.account === userAddress) {
          // Add flag to indicate it's from cache
          const profileWithFlag = {
            ...parsed.profile,
            _fromCache: true,
            _cachedAt: parsed.timestamp
          };
          setProfile(profileWithFlag);
          setProfileLoading(false);
          console.log("Using cached profile", profileWithFlag);
          
          // Check if cache is older than 1 hour (3600000 ms)
          const cacheAge = Date.now() - parsed.timestamp;
          if (cacheAge > 3600000) {
            console.log("Cache is older than 1 hour, fetching fresh data");
            // Continue to fetch fresh data, but don't wait for it before returning
            fetchFreshProfile(userAddress, contractInstance);
          }
          
          return profileWithFlag;
        }
      }

      // No valid cache, fetch from contract
      return await fetchFreshProfile(userAddress, contractInstance);
    } catch (error) {
      console.error("Error in fetchProfile:", error);
      setProfileLoading(false);
    }
  };

  const fetchFreshProfile = async (userAddress, contractInstance) => {
    try {
      console.log("Fetching fresh profile from contract for", userAddress);
      const userProfile = await contractInstance.profiles(userAddress);
      
      // Format profile data
      const formattedProfile = {
        username: userProfile.username,
        avatar: userProfile.avatar,
        _fromCache: false
        // Add any other profile properties here
      };
      
      // Cache the profile in localStorage
      localStorage.setItem(
        PROFILE_STORAGE_KEY, 
        JSON.stringify({
          account: userAddress,
          profile: formattedProfile,
          timestamp: Date.now()
        })
      );
      
      setProfile(formattedProfile);
      console.log("Fresh profile fetched and cached", formattedProfile);
      return formattedProfile;
    } catch (error) {
      console.error("Error fetching fresh profile:", error);
    } finally {
      setProfileLoading(false);
    }
  };

  const updateProfile = async (newProfileData) => {
    if (!account || !contract) return false;
    
    try {
      // Update profile in the contract
      // This would depend on your contract's implementation
      // Example: await contract.updateProfile(newProfileData.username, newProfileData.avatar);
      
      // Add flag to indicate it's not from cache
      const updatedProfile = {
        ...newProfileData,
        _fromCache: false
      };
      
      // Update local state
      setProfile(updatedProfile);
      
      // Update localStorage cache
      localStorage.setItem(
        PROFILE_STORAGE_KEY, 
        JSON.stringify({
          account,
          profile: updatedProfile,
          timestamp: Date.now()
        })
      );
      
      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
      return false;
    }
  };

  const clearProfileCache = () => {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    setProfile(null);
  };

  const setupEventListeners = () => {
    if (window.ethereum) {
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
      
      window.ethereum.on('accountsChanged', async (accounts) => {
        if (accounts.length === 0) {
          // User disconnected their wallet
          setAccount(null);
          setContract(null);
          setProfile(null);
          setLoading(false);
        } else {
          // Account changed
          setLoading(true);
          // Clear profile for previous account
          setProfile(null);
          await connectWallet();
        }
      });
    }
  };

  // Memoize wallet data to prevent unnecessary re-renders
  const walletData = useMemo(() => {
    return {
      loading,
      initializing,
      account,
      contract,
      profile,
      profileLoading,
      isMetamaskInstalled,
      networkError
    };
  }, [loading, initializing, account, contract, profile, profileLoading, isMetamaskInstalled, networkError]);

  return {
    ...walletData,
    connectWallet,
    disconnectWallet,
    fetchProfile: (address) => fetchProfile(address, contract),
    updateProfile,
    clearProfileCache
  };
}; 