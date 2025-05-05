import { useState, useEffect } from "react";
import { ethers } from "ethers";

// Pinata configuration
const projectId = "cfd7e7f302bfd3a4cf16";
const projectSecret = "6ac9eb30800c1640ffb97bb0ab99e0f39c21544668c37eecf2c035ef91b7a8df";

export const useSocialContract = (contract) => {
  const [posts, setPosts] = useState("");
  const [hasProfile, setHasProfile] = useState(false);
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);

  const showError = (message) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const closeErrorModal = () => {
    setErrorMessage("");
    setShowErrorModal(false);
  };

  const loadPosts = async () => {
    try {
      // Get user's address
      let address = await contract.signer.getAddress();
      setAddress(address);
      
      // Check if user owns an nft
      const balance = await contract.balanceOf(address);
      setHasProfile(() => balance > 0);
      
      // Get all posts
      let results = await contract.getAllPosts();
      
      // Fetch metadata of each post and add that to post object.
      let posts = await Promise.all(
        results.map(async (i) => {
          try {
            // use hash to fetch the post's metadata stored on ipfs
            let response = await fetch(`https://gateway.pinata.cloud/ipfs/${i.hash}`);
            const metadataPost = await response.json();
            
            // get authors nft profile
            const nftId = await contract.profiles(i.author);
            // get uri url of nft profile
            const uri = await contract.tokenURI(nftId);
            // fetch nft profile metadata
            response = await fetch(uri);
            const metadataProfile = await response.json();
            
            // Get reaction count and user's reaction status
            const reactionCount = await contract.reactionCounts(i.id);
            const hasReacted = await contract.hasReacted(i.id, address);
            // Get comment count
            const commentCount = await contract.commentCounts(i.id);
            
            // define author object
            const author = {
              address: i.author,
              username: metadataProfile.username,
              avatar: metadataProfile.avatar,
            };
            
            // define post object
            let post = {
              id: i.id.toString(),
              content: metadataPost.post,
              image: metadataPost.image,
              tipAmount: i.tipAmount,
              tipAmountFormatted: ethers.utils.formatEther(i.tipAmount),
              author,
              reactionCount: reactionCount.toNumber(),
              hasReacted,
              commentCount: commentCount.toNumber(),
            };
            return post;
          } catch (error) {
            console.error("Lỗi khi xử lý bài viết:", error);
            return null;
          }
        })
      );

      // Lọc ra các bài viết lỗi
      posts = posts.filter(post => post !== null);

      // Sort posts by tip amount and id
      posts = posts.sort((a, b) => {
        const tipComparison = b.tipAmount.gt(a.tipAmount) ? 1 : (b.tipAmount.lt(a.tipAmount) ? -1 : 0);
        
        if (tipComparison === 0) {
          return parseInt(b.id) - parseInt(a.id);
        }
        return tipComparison;
      });

      setPosts(posts);
      setLoading(false);
    } catch (error) {
      console.error("Chi tiết lỗi khi tải bài viết:", error);
      showError("Lỗi khi tải bài viết: " + (error.message || "Lỗi không xác định"));
      setLoading(false);
    }
  };

  const uploadPost = async (post, imagePost) => {
    if (!post) return;
    let hash;
    
    // Upload post to IPFS
    try {
      console.log("Bắt đầu upload dữ liệu lên IPFS...");
      const data = JSON.stringify({ post, image: imagePost });
      console.log("Dữ liệu post:", { post, hasImage: !!imagePost });
      
      const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          pinata_api_key: projectId,
          pinata_secret_api_key: projectSecret,
        },
        body: data,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Lỗi từ Pinata API:", errorData);
        showError(`Lỗi IPFS: ${errorData.error || "Không thể kết nối đến IPFS"}`);
        return;
      }

      const result = await response.json();
      console.log("Đã upload thành công lên IPFS, hash:", result.IpfsHash);
      setLoading(true);
      hash = result.IpfsHash;
    } catch (error) {
      console.error("Lỗi chi tiết khi upload lên IPFS:", error);
      showError("Lỗi khi upload lên IPFS: " + (error.message || "Không thể kết nối đến IPFS"));
      return;
    }

    try {
      console.log("Bắt đầu lưu post vào blockchain với hash:", hash);
      // Kiểm tra xem người dùng có profile chưa
      if (!hasProfile) {
        showError("Bạn cần có NFT profile để đăng bài");
        return;
      }
      
      // upload post to blockchain
      const tx = await contract.uploadPost(hash);
      console.log("Đã gửi transaction, đang đợi xác nhận...", tx.hash);
      await tx.wait();
      console.log("Transaction đã được xác nhận, đang tải lại posts...");
      loadPosts();
    } catch (error) {
      console.error("Lỗi chi tiết khi lưu vào blockchain:", error);
      if (error.code === 'ACTION_REJECTED') {
        showError("Giao dịch đã bị hủy bởi người dùng");
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        showError("Không đủ ETH để thực hiện giao dịch");
      } else {
        showError("Lỗi khi tạo bài viết: " + (error.message || "Vui lòng kiểm tra ví của bạn"));
      }
    }
  };

  const editPost = async (postId, editContent) => {
    if (!postId || !editContent) return;

    let hash;
    // Upload updated post to IPFS
    try {
      const data = JSON.stringify({ post: editContent });
      const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          pinata_api_key: projectId,
          pinata_secret_api_key: projectSecret,
        },
        body: data,
      });

      const result = await response.json();
      setLoading(true);
      hash = result.IpfsHash;
    } catch (error) {
      showError("IPFS URI upload error: " + error.message);
      return;
    }

    try {
      // Update post on blockchain
      await (await contract.editPost(postId, hash)).wait();
      loadPosts();
    } catch (error) {
      showError("Error editing post: " + error.message);
    }
  };

  const deletePost = async (postId) => {
    if (!postId) return;

    try {
      await (await contract.deletePost(postId)).wait();
      loadPosts();
    } catch (error) {
      showError("Error deleting post: " + error.message);
    }
  };

  const toggleReaction = async (postId) => {
    if (!hasProfile) return;

    try {
      await (await contract.toggleReaction(postId)).wait();
      loadPosts();
    } catch (error) {
      showError("Error toggling reaction: " + error.message);
    }
  };

  const addComment = async (postId, content) => {
    if (!content) return;

    let hash;
    // Upload comment to IPFS
    try {
      const data = JSON.stringify({ comment: content });
      const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          pinata_api_key: projectId,
          pinata_secret_api_key: projectSecret,
        },
        body: data,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Lỗi từ Pinata API:", errorData);
        showError(`Lỗi IPFS: ${errorData.error || "Không thể kết nối đến IPFS"}`);
        return;
      }

      const result = await response.json();
      hash = result.IpfsHash;
      console.log("Đã upload comment lên IPFS, hash:", hash);
    } catch (error) {
      console.error("Lỗi chi tiết khi upload comment lên IPFS:", error);
      showError("Lỗi khi upload comment: " + (error.message || "Không thể kết nối đến IPFS"));
      return;
    }

    try {
      if (!hasProfile) {
        showError("Bạn cần có NFT profile để bình luận");
        return;
      }
      
      // Add comment on blockchain
      console.log("Đang thêm comment cho bài viết ID:", postId);
      const tx = await contract.addComment(postId, hash);
      console.log("Đã gửi transaction, đang đợi xác nhận...", tx.hash);
      await tx.wait();
      console.log("Transaction đã được xác nhận, đang tải lại posts...");
      loadPosts();
    } catch (error) {
      console.error("Lỗi chi tiết khi thêm comment:", error);
      if (error.code === 'ACTION_REJECTED') {
        showError("Giao dịch đã bị hủy bởi người dùng");
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        showError("Không đủ ETH để thực hiện giao dịch");
      } else {
        showError("Lỗi khi thêm bình luận: " + (error.message || "Vui lòng kiểm tra ví của bạn"));
      }
    }
  };

  const editComment = async (postId, commentId, content) => {
    if (!postId || !commentId || !content) return;

    let hash;
    // Upload updated comment to IPFS
    try {
      const data = JSON.stringify({ comment: content });
      const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          pinata_api_key: projectId,
          pinata_secret_api_key: projectSecret,
        },
        body: data,
      });

      const result = await response.json();
      hash = result.IpfsHash;
    } catch (error) {
      showError("IPFS URI upload error: " + error.message);
      return;
    }

    try {
      // Update comment on blockchain
      await (await contract.editComment(postId, commentId, hash)).wait();
      loadPosts();
    } catch (error) {
      showError("Error editing comment: " + error.message);
    }
  };

  const deleteComment = async (postId, commentId) => {
    if (!postId || !commentId) return;

    try {
      await (await contract.deleteComment(postId, commentId)).wait();
      loadPosts();
    } catch (error) {
      showError("Error deleting comment: " + error.message);
    }
  };

  const tip = async (postId, amount) => {
    if (isNaN(amount) || parseFloat(amount) <= 0) {
      showError("Vui lòng nhập số tiền tip hợp lệ");
      return;
    }

    try {
      console.log(`Đang tip ${amount} ETH cho bài viết ID: ${postId}`);
      
      if (!hasProfile) {
        showError("Bạn cần có NFT profile để tip");
        return;
      }
      
      const tx = await contract.tipPostOwner(postId, {
        value: ethers.utils.parseEther(amount),
      });
      
      console.log("Đã gửi transaction, đang đợi xác nhận...", tx.hash);
      await tx.wait();
      console.log("Transaction đã được xác nhận, đang tải lại posts...");
      loadPosts();
    } catch (error) {
      console.error("Lỗi chi tiết khi tip:", error);
      if (error.code === 'ACTION_REJECTED') {
        showError("Giao dịch đã bị hủy bởi người dùng");
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        showError("Không đủ ETH để thực hiện tip");
      } else {
        showError("Lỗi khi tip: " + (error.message || "Vui lòng kiểm tra ví của bạn"));
      }
    }
  };

  const uploadImage = async (file) => {
    if (!file) return null;

    // create unique file name
    const timestamp = new Date().getTime();
    const randomNum = Math.floor(Math.random() * 1000000);
    const fileExt = file.name.split(".").pop();
    const uniqueFileName = `post_img_${timestamp}_${randomNum}.${fileExt}`;
    const uniqueFile = new File([file], uniqueFileName, { type: file.type });

    const formData = new FormData();
    formData.append("file", uniqueFile);

    // add metadata to pinata
    const metadata = JSON.stringify({
      name: uniqueFileName,
      keyvalues: {
        timestamp: timestamp.toString(),
        source: "social_blockchain_app",
      },
    });
    formData.append("pinataMetadata", metadata);

    try {
      const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
          pinata_api_key: projectId,
          pinata_secret_api_key: projectSecret,
        },
        body: formData,
      });
      const result = await response.json();
      return `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
    } catch (error) {
      showError("Error uploading image: " + error.message);
      return null;
    }
  };

  useEffect(() => {
    if (!posts) {
      loadPosts();
    }
  }, []);

  return {
    posts,
    hasProfile,
    address,
    loading,
    errorMessage,
    showErrorModal,
    closeErrorModal,
    loadPosts,
    uploadPost,
    editPost,
    deletePost,
    toggleReaction,
    addComment,
    editComment,
    deleteComment,
    tip,
    uploadImage
  };
}; 