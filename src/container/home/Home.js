import { useState, useEffect } from "react";
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
} from "react-icons/fa";
import { useSocialContract } from "../../hooks/useSocialContract";
import { useProfile } from "../../hooks/useProfile";
import { IoIosCloseCircle } from "react-icons/io";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  // Default skills and communities data (to be replaced with blockchain data in future)
  const defaultCommunities = [
    { name: "Ethereum Devs", members: 15240, images: "/images/com-1.png" },
    { name: "NFT Creators", members: 8320, images: "/images/com-2.png" },
    { name: "DeFi Innovators", members: 6540, images: "/images/com-3.png" },
  ];

  // Mock data for skills
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

  // Generate recent followers from other users in posts
  useEffect(() => {
    if (posts && posts.length > 0) {
      const otherUsers = posts
        .filter((post) => post.author.address !== address)
        .map((post) => ({
          id: post.id.toNumber(),
          name: post.author.username,
          address: post.author.address,
          avatar: post.author.avatar || "https://via.placeholder.com/40",
        }))
        .slice(0, 5); // Take first 5 users

      setRecentFollowers(otherUsers);
    }
  }, [posts, address]);

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
              id: i.id.toNumber(),
              content: metadataComment.comment,
              author,
              timestamp: new Date(
                i.timestamp.toNumber() * 1000
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
    await editCommentInContract(
      currentPostIdForComment,
      editingComment.id,
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
      await deleteCommentFromContract(
        currentPostIdForComment,
        commentToDelete.id
      );
      if (postComments[currentPostIdForComment]) {
        const updatedComments = postComments[currentPostIdForComment].filter(
          (c) => c.id !== commentToDelete.id
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
    const amount = tipAmounts[post.id] || "0.1";
    await tipPost(post.id, amount);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const imageUrl = await uploadImage(file);
    if (imageUrl) {
      setImagePost(imageUrl);
    }
  };

  const loading = contractLoading || profileLoading;

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
        <div className="p-4 border-b border-[#404040]">
          <div className="flex items-center">
            <img
              src={post.author.avatar}
              alt={post.author.username}
              className="w-10 h-10 rounded-full mr-3 object-cover"
            />
            <div>
              <p className="font-semibold text-white">{post.author.username}</p>
              <p className="text-neutral-400 text-sm">
                {post.author.address.substring(0, 6)}...
                {post.author.address.substring(post.author.address.length - 4)}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4">
          <p className="text-neutral-300 mb-3">{post.content}</p>
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
              <div className="flex items-center">
                {post.hasReacted ? (
                  <FaHeart
                    className="text-red-500 cursor-pointer mr-1"
                    onClick={() => hasProfile && toggleReaction(post.id)}
                  />
                ) : (
                  <FaRegHeart
                    className="text-neutral-400 cursor-pointer hover:text-red-500 mr-1"
                    onClick={() => hasProfile && toggleReaction(post.id)}
                  />
                )}
                <span className="text-neutral-400 text-sm">
                  {post.reactionCount}
                </span>
              </div>

              <div
                className="flex items-center cursor-pointer"
                onClick={() => toggleComments(post.id)}
              >
                <FaComment className="text-neutral-400 mr-1" />
                <span className="text-neutral-400 text-sm">
                  {post.commentCount}
                </span>
              </div>

              <div className="flex items-center">
                <span className="text-neutral-400 text-sm">
                  {post.tipAmountFormatted} ETH
                </span>
              </div>
            </div>

            <div>
              {address === post.author.address && hasProfile ? (
                <div className="flex space-x-2">
                  <button
                    className="px-3 py-1 bg-[#404040] hover:bg-[#505050] text-blue-400 rounded-md flex items-center text-sm transition-colors"
                    onClick={() => openEditModal(post)}
                  >
                    <FaEdit className="mr-1" /> Edit
                  </button>
                  <button
                    className="px-3 py-1 bg-[#404040] hover:bg-[#505050] text-red-400 rounded-md flex items-center text-sm transition-colors"
                    onClick={() => openDeleteModal(post)}
                  >
                    <FaTrash className="mr-1" /> Delete
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
                <div className="mb-4 flex">
                  <textarea
                    placeholder="Write a comment..."
                    className="flex-grow p-2 border border-[#404040] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm bg-[#1a1a1a] text-white"
                    value={commentContents[post.id] || ""}
                    onChange={(e) =>
                      handleCommentContentChange(post.id, e.target.value)
                    }
                    rows="2"
                  ></textarea>
                  <button
                    className="ml-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center transition-colors"
                    onClick={() => handleAddComment(post.id)}
                  >
                    <FaReply className="mr-1" /> Post
                  </button>
                </div>
              )}

              {loadingComments[post.id] ? (
                <div className="text-center py-4">
                  <div className="w-6 h-6 border-2 border-t-2 border-[#404040] border-t-blue-500 rounded-full animate-spin inline-block"></div>
                  <p className="text-neutral-400 mt-2">Loading comments...</p>
                </div>
              ) : postComments[post.id] && postComments[post.id].length > 0 ? (
                <div className="space-y-3">
                  {postComments[post.id].map((comment, idx) => (
                    <div key={idx} className="bg-[#1a1a1a] p-3 rounded-lg">
                      <div className="flex justify-between mb-2">
                        <div className="flex">
                          <img
                            src={comment.author.avatar}
                            alt={comment.author.username}
                            className="w-8 h-8 rounded-full mr-2 object-cover"
                          />
                          <div>
                            <p className="font-medium text-sm text-white">
                              {comment.author.username}
                            </p>
                            <p className="text-neutral-400 text-xs">
                              {comment.timestamp}
                            </p>
                          </div>
                        </div>
                        {address === comment.author.address && (
                          <div className="flex space-x-1">
                            <button
                              className="text-blue-400 hover:text-blue-300"
                              onClick={() =>
                                openEditCommentModal(post.id, comment)
                              }
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="text-red-400 hover:text-red-300"
                              onClick={() =>
                                openDeleteCommentModal(post.id, comment)
                              }
                            >
                              <FaTrash />
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-neutral-300 text-sm">
                        {comment.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-neutral-400 py-4">
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
                            <h5 className="text-white font-medium mb-1 group-hover:text-yellow-1 transition-colors">{community.name}</h5>
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
            {hasProfile ? (
              <div className="bg-[#282828] rounded-xl shadow-sm p-6">
                {postError && (
                  <div className="mb-4 bg-red-900/50 text-red-400 p-3 rounded-lg text-sm">
                    {postError}
                  </div>
                )}

                <textarea
                  placeholder="What's on your mind?"
                  className={`w-full p-4 border ${
                    postError
                      ? "border-red-500 focus:ring-red-500"
                      : "border-[#404040] focus:ring-blue-500"
                  } rounded-lg focus:outline-none focus:ring-2 focus:border-transparent resize-none bg-[#1a1a1a] text-white`}
                  value={post}
                  onChange={(e) => {
                    setPost(e.target.value);
                    if (postError) setPostError("");
                  }}
                  rows="3"
                  disabled={isPosting}
                ></textarea>

                <div className="flex justify-between items-center mt-4">
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
                      className={`bg-[#404040] hover:bg-[#505050] text-neutral-300 py-2 px-4 rounded-lg text-sm transition-all flex items-center border border-[#505050] ${
                        isPosting ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      Add Image
                    </label>
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
            ) : (
              <div className="bg-[#282828] rounded-xl shadow-sm p-6 text-center">
                <p className="text-neutral-300">
                  You must own an NFT profile to post.
                </p>
              </div>
            )}

            {posts.length > 0 ? (
              posts.map((post, key) => renderPost(post, key))
            ) : (
              <div className="bg-[#282828] rounded-xl shadow-sm p-6 text-center">
                <p className="text-neutral-300">No posts yet</p>
              </div>
            )}
          </div>

          {/* 3. Right Column - Recent Activity */}
          {profile && (
            <div className="w-full md:w-[400px] lg:w-[500px]">
              <div className="sticky top-6 space-y-6 max-h-[calc(100vh-4rem)] overflow-y-auto pb-6">
                <div className="bg-[#282828] rounded-xl shadow-sm p-6">
                  <h4 className="font-medium text-white mb-4">
                    Recent Followers
                  </h4>
                  {recentFollowers.length > 0 ? (
                    <ul className="divide-y divide-[#404040]">
                      {recentFollowers.map((follower) => (
                        <li key={follower.id} className="py-4">
                          <div className="flex items-center mb-3">
                            <img
                              src={follower.avatar}
                              alt={follower.name}
                              className="w-12 h-12 rounded-full mr-3 object-cover border border-[#404040]"
                            />
                            <div>
                              <p className="font-medium text-white">
                                {follower.name}
                              </p>
                              <p className="text-neutral-400 text-xs font-mono">
                                {follower.address.substring(0, 6)}...
                                {follower.address.substring(
                                  follower.address.length - 4
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-3">
                            <button className="flex-1 bg-[#404040] hover:bg-[#505050] text-blue-400 py-1.5 px-3 rounded-lg text-sm font-medium flex items-center justify-center transition-all">
                              <FaUserPlus className="mr-1.5" /> Follow Back
                            </button>
                            <button className="flex-1 bg-[#404040] hover:bg-[#505050] text-red-400 py-1.5 px-3 rounded-lg text-sm font-medium flex items-center justify-center transition-all">
                              <FaUserMinus className="mr-1.5" /> Remove
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-center text-neutral-400 py-4">
                      No followers yet
                    </p>
                  )}
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
