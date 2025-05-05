import { useState, useEffect, useCallback } from "react";

export const useProfile = (contract) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    if (!contract) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log("Bắt đầu lấy thông tin profile...");
      
      // Get the connected wallet address
      const address = await contract.signer.getAddress();
      console.log("Địa chỉ ví:", address);
      
      // Get the NFT ID associated with this address
      const nftId = await contract.profiles(address);
      console.log("NFT ID:", nftId.toString());
      
      // Sử dụng phép so sánh an toàn với BigNumber
      if (nftId.isZero()) {
        // No profile exists for this address
        console.log("Không tìm thấy profile cho địa chỉ này");
        setProfile(null);
        setLoading(false);
        return;
      }
      
      // Get the URI for this NFT ID
      const uri = await contract.tokenURI(nftId);
      console.log("Profile URI:", uri);
      
      if (!uri || uri === "") {
        console.error("URI không hợp lệ cho NFT profile");
        setError("Không thể tải thông tin profile");
        setLoading(false);
        return;
      }
      
      // Fetch metadata from the URI
      const response = await fetch(uri);
      
      if (!response.ok) {
        throw new Error(`Không thể tải metadata: ${response.status} ${response.statusText}`);
      }
      
      const metadata = await response.json();
      console.log("Profile metadata:", metadata);
      
      if (!metadata.username || !metadata.avatar) {
        console.warn("Profile metadata không đầy đủ:", metadata);
      }
      
      // Create profile object with all necessary information
      const profileData = {
        id: nftId.toString(), // Sử dụng string để tránh overflow
        address: address,
        username: metadata.username || "Unnamed",
        avatar: metadata.avatar || "https://via.placeholder.com/100",
        bio: metadata.description || "",
        skills: metadata.attributes?.skills || [],
        following: metadata.attributes?.following || 0,
        followers: metadata.attributes?.followers || 0,
      };
      
      console.log("Đã tạo profile object:", profileData);
      setProfile(profileData);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Không thể tải thông tin profile: " + (err.message || "Lỗi không xác định"));
    } finally {
      setLoading(false);
    }
  }, [contract]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    refreshProfile: fetchProfile,
  };
}; 