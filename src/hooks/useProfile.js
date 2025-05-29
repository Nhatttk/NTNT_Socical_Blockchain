import { useState, useEffect } from 'react';
import { useWallet } from './useWallet';

export const useProfile = (contract) => {
  const { account } = useWallet();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadProfile = async () => {
    if (!contract || !account) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Since we don't have a specific profile contract method,
      // we'll create a basic profile structure
      const mockProfile = {
        address: account,
        displayName: `User ${account.slice(0, 6)}...${account.slice(-4)}`,
        bio: '',
        location: '',
        website: '',
        joinedDate: new Date().toISOString(),
        postsCount: 0,
        followersCount: 0,
        followingCount: 0,
      };
      
      setProfile(mockProfile);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [contract, account]);

  const updateProfile = async (profileData) => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would call a smart contract method
      // For now, we'll just update the local state
      setProfile(prev => ({
        ...prev,
        ...profileData,
      }));
      
      return true;
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    loading,
    error,
    loadProfile,
    updateProfile,
  };
}; 