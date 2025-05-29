import { useState, useEffect, useMemo } from "react";
import { ethers } from "ethers";
import {
  FaHeart,
  FaRegHeart,
  FaComment,
  FaEdit,
  FaTrash,
  FaReply,
  FaUserPlus,
  FaUserMinus,
  FaRobot,
} from "react-icons/fa";
import { useSocialContract } from "../../hooks/useSocialContract";
import { useProfile } from "../../hooks/useProfile";
import { useGeminiSuggestion } from "../../hooks/useGeminiSuggestion";
import GeminiSuggestions from "../../components/GeminiSuggestions";
import { IoIosCloseCircle } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation, Autoplay, Mousewheel } from "swiper/modules";

const Home = ({ contract }) => {
  const [post, setPost] = useState("");
  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [expandedPostComments, setExpandedPostComments] = useState({});
  const [postComments, setPostComments] = useState({});
  const [loadingComments, setLoadingComments] = useState({});
  const [commentContents, setCommentContents] = useState({});
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentContent, setEditCommentContent] = useState("");
  const [showEditCommentModal, setShowEditCommentModal] = useState(false);
  const [showDeleteCommentModal, setShowDeleteCommentModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [currentPostIdForComment, setCurrentPostIdForComment] = useState(null);
  const [tipAmounts, setTipAmounts] = useState({});
  const [isProcessingDelete, setIsProcessingDelete] = useState(false);
  const [imagePost, setImagePost] = useState("");
  const [recentFollowers, setRecentFollowers] = useState([]);
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();

  // Default skills and communities data (to be replaced with blockchain data in future)
  const defaultCommunities = [
    { name: "Ethereum Devs", members: 15240, images: "/images/com-1.png" },
    { name: "NFT Creators", members: 8320, images: "/images/com-2.png" },
    { name: "DeFi Innovators", members: 6540, images: "/images/com-3.png" },
  ];

  // Mock data for skills (to be replaced with blockchain data in future)
  const mockSkills = [
    "JavaScript",
    "React",
    "Node.js",
    "TypeScript",
    "MongoDB",
    "Express",
    "CSS",
    "HTML",
  ];

  const {
    posts,
    hasProfile,
    address,
    loading: contractLoading,
    errorMessage,
    showErrorModal,
    closeErrorModal,
    loadPosts,
    uploadPost: uploadPostToContract,
    editPost: editPostInContract,
    deletePost: deletePostFromContract,
    toggleReaction,
    addComment: addCommentToContract,
    editComment: editCommentInContract,
    deleteComment: deleteCommentFromContract,
    tip: tipPost,
    uploadImage,
  } = useSocialContract(contract);

  // Get current user profile with the custom hook
  const { profile, loading: profileLoading } = useProfile(contract);

  // Gemini AI text suggestion hook
  const { 
    suggestions, 
    isLoading: suggestionsLoading, 
    error: suggestionError,
    getSuggestions, 
    clearSuggestions 
  } = useGeminiSuggestion();

  // Load posts only if user has a profile
  useEffect(() => {
    if (hasProfile) {
      loadPosts();
    }
  }, [hasProfile, loadPosts]);

  // Generate unique users from posts data
  const allUsersFromPosts = useMemo(() => {
    if (!posts || posts.length === 0 || !hasProfile) {
      return [];
    }
    
    try {
      // Create a map to store unique users by address
      const uniqueUsers = new Map();
      
      posts.forEach((post) => {
        try {
          // Skip current user's posts
          if (post.author.address === address) return;
          
          // Add post author to unique users
          if (!uniqueUsers.has(post.author.address)) {
            const postId = post.id && typeof post.id.toNumber === 'function' 
                          ? post.id.toNumber() 
                          : Number(post.id) || 0;
            
            // Use a deterministic way to set verified status based on address
            const isVerified = post.author.address.slice(-1).charCodeAt(0) % 2 === 0;
            
            uniqueUsers.set(post.author.address, {
              id: postId,
              name: post.author.username,
              address: post.author.address,
              avatar: post.author.avatar || "https://via.placeholder.com/40",
              verified: isVerified, // Deterministic verification status
              followedTime: `${Math.floor(postId % 60) + 1} min ago`, // Deterministic follow time based on postId
            });
          }

          // Add commenters if they exist
          if (post.comments && Array.isArray(post.comments)) {
            post.comments.forEach((comment) => {
              if (comment.author && comment.author.address !== address && !uniqueUsers.has(comment.author.address)) {
                const commentId = comment.id || (comment.author.address.slice(-2).charCodeAt(0) * 10);
                const isVerified = comment.author.address.slice(-2).charCodeAt(0) % 2 === 0;
                
                uniqueUsers.set(comment.author.address, {
                  id: commentId,
                  name: comment.author.username,
                  address: comment.author.address,
                  avatar: comment.author.avatar || "https://via.placeholder.com/40",
                  verified: isVerified,
                  followedTime: `${Math.floor(commentId % 60) + 1} min ago`,
                });
              }
            });
          }
        } catch (err) {
          console.error("Error processing post:", err);
        }
      });

      return Array.from(uniqueUsers.values());
    } catch (error) {
      console.error("Error setting users:", error);
      return [];
    }
  }, [posts, address, hasProfile]);

  // Update states when allUsersFromPosts changes
  useEffect(() => {
    setAllUsers(allUsersFromPosts);
    setRecentFollowers(allUsersFromPosts.slice(0, 5));
  }, [allUsersFromPosts]);

  const openEditModal = (post) => {
    setEditingPost(post);
    setEditContent(post.content);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingPost(null);
    setEditContent("");
  };

  const openDeleteModal = (post) => {
    setPostToDelete(post);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setPostToDelete(null);
  };

  const handlePost = async () => {
    if (!post) {
      setPostError("Vui lòng nhập nội dung bài viết");
      setTimeout(() => setPostError(""), 3000);
      return;
    }

    try {
      setIsPosting(true);
      setPostError("");
      await uploadPostToContract(post, imagePost);
      setPost("");
      setImagePost("");
    } catch (error) {
      console.error("Lỗi khi đăng bài:", error);
      setPostError("Không thể đăng bài. Vui lòng thử lại sau.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleEditPost = async () => {
    if (!editingPost || !editContent) return;
    await editPostInContract(editingPost.id, editContent);
    closeEditModal();
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    await deletePostFromContract(postToDelete.id);
    closeDeleteModal();
  };

  const toggleComments = async (postId) => {
    const isExpanded = expandedPostComments[postId];
    setExpandedPostComments({
      ...expandedPostComments,
      [postId]: !isExpanded,
    });

    if (
      !isExpanded &&
      (!postComments[postId] || postComments[postId].length === 0)
    ) {
      await loadCommentsForPost(postId);
    }
  };

  const loadCommentsForPost = async (postId) => {
    setLoadingComments({
      ...loadingComments,
      [postId]: true,
    });

    try {
      const results = await contract.getComments(postId);
      const comments = await Promise.all(
        results.map(async (i) => {
          try {
            let response = await fetch(
              `https://gateway.pinata.cloud/ipfs/${i.hash}`
            );
            const metadataComment = await response.json();
            const nftId = await contract.profiles(i.author);
            const uri = await contract.tokenURI(nftId);
            response = await fetch(uri);
            const metadataProfile = await response.json();

            const author = {
              address: i.author,
              username: metadataProfile.username,
              avatar: metadataProfile.avatar,
            };

            return {
              id: typeof i.id === "object" ? i.id.toNumber() : i.id,
              content: metadataComment.comment,
              author,
              timestamp: new Date(
                (typeof i.timestamp === "object"
                  ? i.timestamp.toNumber()
                  : i.timestamp) * 1000
              ).toLocaleString(),
            };
          } catch (e) {
            console.error("Error processing comment:", e);
            return null;
          }
        })
      );

      const validComments = comments.filter((comment) => comment !== null);
      validComments.sort((a, b) => b.id - a.id);

      setPostComments({
        ...postComments,
        [postId]: validComments,
      });
    } catch (error) {
      console.error("Error loading comments:", error);
    }

    setLoadingComments({
      ...loadingComments,
      [postId]: false,
    });
  };

  const handleCommentContentChange = (postId, value) => {
    setCommentContents({
      ...commentContents,
      [postId]: value,
    });
  };

  const handleAddComment = async (postId) => {
    const content = commentContents[postId];
    if (!content) return;

    await addCommentToContract(postId, content);
    handleCommentContentChange(postId, "");
    await loadCommentsForPost(postId);
  };

  const openEditCommentModal = (postId, comment) => {
    setCurrentPostIdForComment(postId);
    setEditingComment(comment);
    setEditCommentContent(comment.content);
    setShowEditCommentModal(true);
  };

  const closeEditCommentModal = () => {
    setShowEditCommentModal(false);
    setEditingComment(null);
    setEditCommentContent("");
    setCurrentPostIdForComment(null);
  };

  const handleEditComment = async () => {
    if (!editingComment || !editCommentContent || !currentPostIdForComment)
      return;
    const commentId =
      typeof editingComment.id === "object"
        ? editingComment.id.toNumber()
        : editingComment.id;
    await editCommentInContract(
      currentPostIdForComment,
      commentId,
      editCommentContent
    );
    closeEditCommentModal();
    await loadCommentsForPost(currentPostIdForComment);
  };

  const openDeleteCommentModal = (postId, comment) => {
    setCurrentPostIdForComment(postId);
    setCommentToDelete(comment);
    setShowDeleteCommentModal(true);
  };

  const closeDeleteCommentModal = () => {
    setShowDeleteCommentModal(false);
    setCommentToDelete(null);
    setCurrentPostIdForComment(null);
    setIsProcessingDelete(false);
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete || !currentPostIdForComment || isProcessingDelete)
      return;
    setIsProcessingDelete(true);

    try {
      const commentId =
        typeof commentToDelete.id === "object"
          ? commentToDelete.id.toNumber()
          : commentToDelete.id;
      await deleteCommentFromContract(currentPostIdForComment, commentId);
      if (postComments[currentPostIdForComment]) {
        const updatedComments = postComments[currentPostIdForComment].filter(
          (c) => c.id !== commentId
        );
        setPostComments({
          ...postComments,
          [currentPostIdForComment]: updatedComments,
        });
      }
      closeDeleteCommentModal();
      setTimeout(() => {
        loadPosts();
        loadCommentsForPost(currentPostIdForComment);
      }, 1000);
    } catch (error) {
      console.error("Error deleting comment:", error);
      setIsProcessingDelete(false);
    }
  };

  const handleTipAmountChange = (postId, value) => {
    if (value === "" || (!isNaN(value) && parseFloat(value) >= 0)) {
      setTipAmounts({
        ...tipAmounts,
        [postId]: value,
      });
    }
  };

  const handleTip = async (post) => {
    try {
      const amount = tipAmounts[post.id] || "0.1";
      const postId = typeof post.id === "object" ? post.id.toNumber() : post.id;
      const amountInWei = ethers.utils.parseEther(amount);
      
      // Call the contract's tipPostOwner function
      const tx = await contract.tipPostOwner(postId, { value: amountInWei });
      await tx.wait();

      // Reload posts to show updated tip amount
      await loadPosts();
    } catch (error) {
      console.error("Error tipping post:", error);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const imageUrl = await uploadImage(file);
    if (imageUrl) {
      setImagePost(imageUrl);
    }
  };

  // Gemini AI suggestion handlers
  const handlePostContentChange = (e) => {
    const value = e.target.value;
    setPost(value);
    
    // Clear post error if user is typing
    if (postError) setPostError("");
    
    // Get AI suggestions when user has typed enough text
    if (value.length >= 10) {
      getSuggestions(value);
      setShowSuggestions(true);
    } else {
      clearSuggestions();
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion, forcedAction = null) => {
    // Smart suggestion insertion logic
    const currentPost = post.trim();
    let newPost;

    // Determine action - use forced action if provided, otherwise smart detection
    let action = forcedAction;
    if (!action) {
      // If the suggestion starts with common sentence starters or seems like a complete thought
      const isCompleteSuggestion = suggestion.match(/^(What|How|Why|When|Let|This|Excited|Looking|Thanks|Hope|Can't|I|We|The)/i);
      
      // If current post ends with incomplete word or current post is very short, suggest replacement
      const words = currentPost.split(' ');
      const lastWord = words[words.length - 1];
      const seemsIncomplete = lastWord && lastWord.length > 0 && !lastWord.match(/[.!?]$/);
      
      if (currentPost.length < 20 && isCompleteSuggestion) {
        action = 'replace';
      } else if (seemsIncomplete && currentPost.length < 50) {
        action = 'replace';
      } else {
        action = 'append';
      }
    }

    // Apply the action
    if (action === 'replace') {
      newPost = suggestion;
    } else {
      // Append to existing text
      if (currentPost && !currentPost.endsWith(' ') && !currentPost.endsWith('.') && !currentPost.endsWith('!') && !currentPost.endsWith('?')) {
        newPost = currentPost + ' ' + suggestion;
      } else {
        newPost = currentPost + suggestion;
      }
    }
    
    setPost(newPost);
    setShowSuggestions(false);
    clearSuggestions();
    
    // Focus back on textarea after selection
    setTimeout(() => {
      const textarea = document.querySelector('textarea[placeholder="What\'s on your mind?"]');
      if (textarea) {
        textarea.focus();
        // Set cursor to end
        textarea.selectionStart = textarea.selectionEnd = newPost.length;
      }
    }, 100);
  };

  const handleCloseSuggestions = () => {
    setShowSuggestions(false);
    clearSuggestions();
  };

  const toggleSuggestions = () => {
    if (post.length >= 10) {
      if (showSuggestions) {
        handleCloseSuggestions();
      } else {
        getSuggestions(post);
        setShowSuggestions(true);
      }
    }
  };

  const loading = contractLoading || profileLoading;

  // Memoize real users data from blockchain
  const memoizedUsers = useMemo(() => allUsers, [allUsers]);

  // Memoize followers list
  const followersList = useMemo(() => {
    if (memoizedUsers.length === 0) {
      return (
        <li className="bg-[#1A1A1A] py-4 px-10 rounded-2xl text-center">
          <p className="text-gray-400 text-sm">No followers yet. Start interacting with other users!</p>
        </li>
      );
    }
    
    return memoizedUsers.slice(0, 4).map((follower, index) => (
      <li key={index} className="bg-[#1A1A1A] py-4 px-10 rounded-2xl">
        <div className="flex items-center mb-3">
          <div className="relative">
            <img
              src={follower.avatar}
              alt={follower.name}
              className="w-12 h-12 mr-3 object-cover"
            />
            {follower.verified && (
              <div className="absolute -top-1 right-1 bg-yellow-1 rounded-full p-0.5">
                <svg
                  className="w-3 h-3 text-black"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1 pl-2">
            <p className="font-medium text-white mb-0">{follower.name}</p>
            <p className="text-yellow-2 text-xs mb-0">
              followed on you • {follower.followedTime}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button className="flex-1 bg-[#404040] hover:bg-[#505050] text-white py-1.5 px-3 rounded-lg text-sm font-medium flex items-center justify-center transition-all">
            <FaUserMinus className="mr-1.5" /> Remove
          </button>
          <button className="flex-1 bg-yellow-1 hover:bg-yellow-2 text-black py-1.5 px-3 rounded-lg text-sm font-medium flex items-center justify-center transition-all">
            <FaUserPlus className="mr-1.5" /> Follow Back
          </button>
        </div>
      </li>
    ));
  }, [memoizedUsers]);

  // Memoize friends swiper
  const friendsSwiper = useMemo(() => {
    if (memoizedUsers.length === 0) {
      return (
        <div className="mb-6 max-w-[940px] mx-auto">
          <div className="text-center py-8">
            <p className="text-gray-400 text-lg">No users to show yet. Create posts and interact with others!</p>
          </div>
        </div>
      );
    }

    return (
      <div className="mb-6 max-w-[940px] mx-auto">
        <Swiper
          modules={[Autoplay, Mousewheel]}
          spaceBetween={20}
          slidesPerView="auto"
          mousewheel={true}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
          }}
          className="friends-swiper"
        >
          {memoizedUsers?.map((user, index) => (
            <SwiperSlide key={index} className="!w-auto cursor-pointer">
              <div className="flex flex-col items-center p-3">
                <div className="w-[100px] h-[100px] rounded-3xl overflow-hidden flex justify-center items-center border-3 p-2 border-yellow-1">
                  <img
                    src={user?.avatar || "/images/avatar-default.png"}
                    alt={user?.name || "User"}
                    className="w-full h-full object-cover mt-0.5"
                  />
                </div>
                <p className="text-base font-medium text-white mt-3 truncate max-w-[100px]">
                  {user?.name || "Unknown User"}
                </p>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    );
  }, [memoizedUsers]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-12 h-12 border-4 border-t-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );

  // Render a single post
  const renderPost = (post, key) => {
    return (
      <div
        key={key}
        className="bg-[#282828] rounded-lg shadow-md mb-4 overflow-hidden"
      >
        <div className="head-post p-4 border-b border-[#404040]">
          <div className="flex gap-2 items-center">
            <img
              src={post.author.avatar}
              alt={post.author.username}
              className="w-[70px] h-[70px] rounded-2xl mr-3 object-cover"
            />
            <div className="flex flex-col items-start gap-2">
              <div className="flex justify-center items-center gap-3">
                <p className="m-0 mt-1 font-semibold text-2xl text-white">
                  {post.author.username}
                </p>
                <div className="bg-blue-500 w-6 h-6 rounded-full mt-1">
                  <svg
                    className="w-6 h-6 text-black"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>

              <p className="text-neutral-400 text-lg">
                {post.author.address}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4">
          <p className="text-white text-xl mb-3">{post.content}</p>
          {post.image && (
            <div className="mb-3">
              <img
                src={post.image}
                alt="Post"
                className="w-full h-auto rounded-lg"
              />
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-[#404040]">
          <div className="flex justify-between items-center">
            <div className="flex space-x-4">
              <div className="flex gap-2 items-center">
                {post.hasReacted ? (
                  <FaHeart
                    className="text-red-500 w-5 h-5 cursor-pointer mr-1"
                    onClick={() => hasProfile && toggleReaction(post.id)}
                  />
                ) : (
                  <FaRegHeart
                    className="text-neutral-400 w-5 h-5 cursor-pointer hover:text-red-500 mr-1"
                    onClick={() => hasProfile && toggleReaction(post.id)}
                  />
                )}
                <span className="text-neutral-400 text-base">
                  {post.reactionCount}
                </span>
              </div>

              <div
                className="flex gap-2 items-center cursor-pointer"
                onClick={() => toggleComments(post.id)}
              >
                <FaComment className="text-neutral-400 w-5 h-5 mr-1" />
                <span className="text-neutral-400 text-base">
                  {post.commentCount}
                </span>
              </div>

              <div className="flex items-center">
                <span className="text-yellow-2 text-base">
                  {post.tipAmountFormatted} ETH
                </span>
              </div>
            </div>

            <div>
              {address === post.author.address && hasProfile ? (
                <div className="flex space-x-2">
                  <button
                    className="px-3 py-1 bg-[#404040] hover:bg-[#505050] text-blue-400 rounded-md flex items-center text-base transition-colors"
                    onClick={() => openEditModal(post)}
                  >
                    <FaEdit className="mr-1 w-5 h-5" /> Edit
                  </button>
                  <button
                    className="px-3 py-1 bg-[#404040] hover:bg-[#505050] text-red-400 rounded-md flex items-center text-base transition-colors"
                    onClick={() => openDeleteModal(post)}
                  >
                    <FaTrash className="mr-1 w-5 h-5" /> Delete
                  </button>
                </div>
              ) : address !== post.author.address && hasProfile ? (
                <div className="flex items-center">
                  <input
                    type="text"
                    className="w-16 p-1 text-sm border border-[#404040] rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[#1a1a1a] text-white"
                    placeholder="0.1"
                    value={tipAmounts[post.id] || "0.1"}
                    onChange={(e) =>
                      handleTipAmountChange(post.id, e.target.value)
                    }
                  />
                  <span className="bg-[#404040] px-2 py-1 text-sm border-y border-r border-[#505050] text-neutral-300">
                    ETH
                  </span>
                  <button
                    className="ml-2 px-3 py-1 bg-[#404040] hover:bg-[#505050] text-green-400 rounded-md text-sm transition-colors"
                    onClick={() => handleTip(post)}
                  >
                    Tip
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {expandedPostComments[post.id] && (
            <div className="mt-4 pt-3 border-t border-[#404040]">
              {hasProfile && (
                <div className="mb-6 flex items-start gap-2">
                  <img
                    src={profile?.avatar || "/images/avatar-default.png"}
                    alt={profile?.username || "User"}
                    className="w-14 h-14 rounded-full object-cover mt-2"
                  />
                  <div className="flex-grow relative">
                    <textarea
                      placeholder="Write a comment..."
                      className="w-full p-5 pr-16 border border-[#404040] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-lg bg-[#1a1a1a] text-white placeholder-neutral-500"
                      value={commentContents[post.id] || ""}
                      onChange={(e) =>
                        handleCommentContentChange(post.id, e.target.value)
                      }
                      rows="2"
                    ></textarea>
                    <button
                      className="absolute top-1/2 right-2 p-3 hover:bg-[#404040] rounded-lg transition-all hover:scale-110"
                      onClick={() => handleAddComment(post.id)}
                    >
                      <img
                        src="/icons/send.svg"
                        alt="Send"
                        className="w-7 h-7"
                      />
                    </button>
                  </div>
                </div>
              )}

              {loadingComments[post.id] ? (
                <div className="text-center py-6">
                  <div className="w-8 h-8 border-2 border-t-2 border-[#404040] border-t-blue-500 rounded-full animate-spin inline-block"></div>
                  <p className="text-neutral-400 mt-3 text-lg">
                    Loading comments...
                  </p>
                </div>
              ) : postComments[post.id] && postComments[post.id].length > 0 ? (
                <div className="space-y-5">
                  {postComments[post.id].map((comment, idx) => (
                    <div key={idx} className="bg-[#1a1a1a] p-5 rounded-xl">
                      <div className="flex justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={comment.author.avatar}
                            alt={comment.author.username}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-semibold text-lg text-white">
                              {comment.author.username}
                            </p>
                            <p className="text-neutral-400 text-base">
                              {comment.timestamp}
                            </p>
                          </div>
                        </div>
                        {address === comment.author.address && (
                          <div className="flex space-x-3">
                            <button
                              className="text-blue-400 hover:text-blue-300 p-2 hover:bg-[#404040] rounded-lg transition-all"
                              onClick={() =>
                                openEditCommentModal(post.id, comment)
                              }
                            >
                              <FaEdit className="w-5 h-5" />
                            </button>
                            <button
                              className="text-red-400 hover:text-red-300 p-2 hover:bg-[#404040] rounded-lg transition-all"
                              onClick={() =>
                                openDeleteCommentModal(post.id, comment)
                              }
                            >
                              <FaTrash className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-neutral-300 text-lg ml-16">
                        {comment.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-neutral-400 py-6 text-lg">
                  No comments yet
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="x-container">
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* 1. Left Column - Profile Section */}
          {profile && (
            <div className="w-full md:w-80 lg:w-96">
              <div className="sticky rounded-xl top-6 space-y-6 overflow-hidden h-auto pb-6">
                <div className="relative bg-[#282828] rounded-xl shadow-sm py-6 overflow-hidden">
                  <div className="absolute w-full top-10 flex justify-between items-center ">
                    <div className="text-center w-1/3">
                      <div className="font-bold text-xl text-white">
                        {profile?.following || 12}
                      </div>
                      <div className="text-neutral-400 text-base">
                        Following
                      </div>
                    </div>
                    <div className="w-1/3"></div>{" "}
                    {/* chỗ trống cho avatar ở giữa */}
                    <div className="text-center w-1/3">
                      <div className="font-bold text-xl text-white">
                        {profile?.followers || 1020}
                      </div>
                      <div className="text-neutral-400 text-base">
                        Followers
                      </div>
                    </div>
                  </div>

                  <img
                    src="/images/bg-profile.png"
                    alt="Background"
                    className="absolute top-0 left-0 w-full h-[200%] opacity-25 object-cover"
                  />

                  <div className="z-10">
                    <div className="relative z-10 text-center text-white">
                      {/* Avatar */}
                      <div className="relative w-full flex justify-center">
                        <img
                          src={
                            profile
                              ? profile.avatar
                              : "/images/avatar-default.png"
                          }
                          alt={profile ? profile.username : "Profile"}
                          className="w-[130px] h-[130px] rounded-md object-cover border-[10px] border-black shadow z-20"
                        />
                      </div>

                      <h3 className="font-bold text-xl mt-4">
                        {profile ? profile.username : "No Profile"}
                      </h3>
                      <p className="text-gray-300 text-sm font-mono bg-gray-600 bg-opacity-50 px-2 py-1 rounded inline-block mt-1">
                        {address.substring(0, 6)}...
                        {address.substring(address.length - 4)}
                      </p>
                      <p className="mt-2 w-2/3 mx-auto text-neutral-300">
                        Hello, I'm Blockchain Developer. Open to the new Project
                      </p>

                      <button
                        onClick={() => navigate("/profile")}
                        className="mt-4 w-1/2 mx-auto bg-gradient-to-br from-neutral-700 to-gray-800 hover:from-neutral-800 hover:to-gray-900 text-white py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 text-lg font-bold"
                      >
                        <FaUserPlus className="text-yellow-1 size-6" />
                        My Profile
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-[#282828] rounded-xl shadow-sm p-6">
                  <h4 className="font-medium text-white mb-4">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {(profile?.skills?.length > 0
                      ? profile.skills
                      : mockSkills
                    ).map((skill, idx) => (
                      <span
                        key={idx}
                        className="bg-[#404040] text-neutral-300 py-1 px-3 rounded-full text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-[#282828] rounded-xl shadow-sm px-6 pt-6 pb-1">
                  <h4 className="font-medium text-white mb-4">Communities</h4>
                  <ul className="p-0 divide-y divide-[#404040]">
                    {defaultCommunities.map((community, idx) => (
                      <li
                        key={idx}
                        className="py-4 cursor-pointer flex items-center hover:bg-[#404040] transition-all duration-200 rounded-lg px-2 -mx-2"
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={community.images}
                            alt={community.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <h5 className="text-white font-medium mb-1 group-hover:text-yellow-1 transition-colors">
                              {community.name}
                            </h5>
                            <p className="text-yellow-2 m-0 text-sm">
                              {community.members.toLocaleString()} members
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* 2. Middle Column - Post Feed */}
          <div className="w-full md:flex-1 space-y-6">
            {/* Friends List Swiper */}
            {profile && friendsSwiper}

            {hasProfile ? (
              <>
                <div className="bg-[#282828] rounded-xl shadow-sm p-6 mt-0">
                  {postError && (
                    <div className="mb-4 bg-red-900/50 text-red-400 p-3 rounded-lg text-sm">
                      {postError}
                    </div>
                  )}

                  <div className="relative">
                    <textarea
                      placeholder="What's on your mind?"
                      className={`w-full p-4 border ${
                        postError
                          ? "border-red-500 focus:ring-red-500"
                          : "border-[#404040] focus:ring-blue-500"
                      } rounded-lg focus:outline-none focus:ring-2 focus:border-transparent resize-none bg-[#1a1a1a] text-white`}
                      value={post}
                      onChange={handlePostContentChange}
                      rows="3"
                      disabled={isPosting}
                    ></textarea>

                    <GeminiSuggestions
                      suggestions={suggestions}
                      isLoading={suggestionsLoading}
                      error={suggestionError}
                      onSuggestionClick={handleSuggestionClick}
                      onClose={handleCloseSuggestions}
                      isVisible={showSuggestions}
                      currentText={post}
                    />
                  </div>

                  <div className="flex justify-between items-center mt-4">
                    <div className="flex items-center gap-3">
                      <div className="relative cursor-pointer">
                        <input
                          type="file"
                          id="file-input"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={handleImageUpload}
                          disabled={isPosting}
                        />
                        <label
                          htmlFor="file-input"
                          className={`bg-[#404040] hover:bg-[#505050] text-neutral-300 py-2 px-4 rounded-lg text-sm transition-all flex items-center border border-[#505050] cursor-pointer ${
                            isPosting ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          Add Image
                        </label>
                      </div>
                      
                      {/* AI Suggestions Toggle Button */}
                      <button
                        onClick={toggleSuggestions}
                        disabled={isPosting || post.length < 10}
                        className={`relative flex items-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                          showSuggestions
                            ? "bg-blue-600 text-white"
                            : post.length >= 10
                            ? "bg-[#404040] hover:bg-[#505050] text-blue-400 border border-blue-500/30"
                            : "bg-[#2a2a2a] text-gray-500 cursor-not-allowed"
                        } ${isPosting ? "opacity-50 cursor-not-allowed" : ""}`}
                        title={post.length < 10 ? "Type at least 10 characters to get AI suggestions" : "Get AI suggestions"}
                      >
                        <FaRobot className={`text-sm ${showSuggestions ? "animate-pulse" : ""}`} />
                        <span>AI Assist</span>
                        {suggestionsLoading && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
                        )}
                      </button>
                    </div>
                    
                    <button
                      className={`bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg transition-all font-medium flex items-center ${
                        isPosting ? "opacity-70 cursor-not-allowed" : ""
                      }`}
                      onClick={handlePost}
                      disabled={isPosting}
                    >
                      {isPosting ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Đang đăng...
                        </>
                      ) : (
                        "Post"
                      )}
                    </button>
                  </div>

                  {imagePost && (
                    <div className="mt-4 relative">
                      <img
                        src={imagePost}
                        alt="Preview"
                        className="relative w-full h-auto max-h-[250px] object-contain rounded-lg border border-[#404040]"
                      />
                      <button
                        className="absolute top-2 right-2 bg-[#282828] shadow-md text-red-500 rounded-full w-8 h-8 flex items-center justify-center hover:bg-[#404040] transition-all hover:text-red-600 hover:scale-110"
                        onClick={() => setImagePost("")}
                        aria-label="Remove image"
                      >
                        <IoIosCloseCircle size={22} />
                      </button>
                    </div>
                  )}
                </div>

                {posts && posts.length > 0 ? (
                  posts.map((post, key) => renderPost(post, key))
                ) : (
                  <div className="bg-[#282828] rounded-xl shadow-sm p-6 text-center">
                    <p className="text-neutral-300">No posts yet</p>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-[#282828] rounded-xl shadow-sm p-6 text-center">
                <p className="text-neutral-300 mb-4">
                  You need to create a profile to view and create posts.
                </p>
                <button
                  onClick={() => navigate("/profile")}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg transition-all font-medium"
                >
                  Create Profile
                </button>
              </div>
            )}
          </div>

          {/* 3. Right Column - Recent Activity */}
          {profile && (
            <div className="w-full md:w-[400px] lg:w-[500px]">
              <div className="sticky top-6 space-y-6 max-h-[calc(100vh-4rem)] h-auto pb-6">
                <div className="bg-[#282828] rounded-xl shadow-sm p-6">
                  <h4 className="font-medium text-white mb-4">
                    Recent Followers
                  </h4>
                  <ul className="p-0 space-y-8">{followersList}</ul>
                  <button className="w-full mt-4 text-yellow-1 hover:text-yellow-2 text-sm font-medium transition-colors">
                    See more...
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-medium text-lg">Edit Post</h3>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={closeEditModal}
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows="4"
              ></textarea>
            </div>
            <div className="flex justify-end p-4 border-t">
              <button
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md mr-2 transition-colors"
                onClick={closeEditModal}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                onClick={handleEditPost}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-medium text-lg">Delete Post</h3>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={closeDeleteModal}
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <p className="text-gray-700">
                Are you sure you want to delete this post? This action cannot be
                undone.
              </p>
            </div>
            <div className="flex justify-end p-4 border-t">
              <button
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md mr-2 transition-colors"
                onClick={closeDeleteModal}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
                onClick={handleDeletePost}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditCommentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-medium text-lg">Edit Comment</h3>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={closeEditCommentModal}
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                value={editCommentContent}
                onChange={(e) => setEditCommentContent(e.target.value)}
                rows="3"
              ></textarea>
            </div>
            <div className="flex justify-end p-4 border-t">
              <button
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md mr-2 transition-colors"
                onClick={closeEditCommentModal}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                onClick={handleEditComment}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteCommentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-medium text-lg">Delete Comment</h3>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={closeDeleteCommentModal}
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <p className="text-gray-700">
                Are you sure you want to delete this comment? This action cannot
                be undone.
              </p>
            </div>
            <div className="flex justify-end p-4 border-t">
              <button
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md mr-2 transition-colors"
                onClick={closeDeleteCommentModal}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 bg-red-500 text-white rounded-md transition-colors ${
                  isProcessingDelete
                    ? "opacity-75 cursor-not-allowed"
                    : "hover:bg-red-600"
                }`}
                onClick={handleDeleteComment}
                disabled={isProcessingDelete}
              >
                {isProcessingDelete ? "Processing..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-medium text-lg">Error</h3>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={closeErrorModal}
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <p className="text-gray-700">{errorMessage}</p>
            </div>
            <div className="flex justify-end p-4 border-t">
              <button
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                onClick={closeErrorModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
