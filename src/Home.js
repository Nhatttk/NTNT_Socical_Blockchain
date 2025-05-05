import { useState, useEffect } from 'react'
import { ethers } from "ethers"
import { Row, Form, Button, Card, ListGroup, Modal, InputGroup } from 'react-bootstrap'
import { FaHeart, FaRegHeart, FaComment, FaEdit, FaTrash, FaReply } from 'react-icons/fa'

// Pinata configuration
const projectId = "cfd7e7f302bfd3a4cf16"
const projectSecret = "6ac9eb30800c1640ffb97bb0ab99e0f39c21544668c37eecf2c035ef91b7a8df"

const Home = ({ contract }) => {
    const [posts, setPosts] = useState('')
    const [hasProfile, setHasProfile] = useState(false)
    const [post, setPost] = useState('')
    const [address, setAddress] = useState('')
    const [loading, setLoading] = useState(true)
    const [editingPost, setEditingPost] = useState(null)
    const [editContent, setEditContent] = useState('')
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [postToDelete, setPostToDelete] = useState(null)
    const [expandedPostComments, setExpandedPostComments] = useState({})
    const [postComments, setPostComments] = useState({})
    const [loadingComments, setLoadingComments] = useState({})
    const [commentContents, setCommentContents] = useState({})
    const [editingComment, setEditingComment] = useState(null)
    const [editCommentContent, setEditCommentContent] = useState('')
    const [showEditCommentModal, setShowEditCommentModal] = useState(false)
    const [showDeleteCommentModal, setShowDeleteCommentModal] = useState(false)
    const [commentToDelete, setCommentToDelete] = useState(null)
    const [currentPostIdForComment, setCurrentPostIdForComment] = useState(null)
    const [tipAmounts, setTipAmounts] = useState({})
    const [isProcessingDelete, setIsProcessingDelete] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [showErrorModal, setShowErrorModal] = useState(false)
    
    const loadPosts = async () => {
        // Get user's address
        let address = await contract.signer.getAddress()
        setAddress(address)
        // Check if user owns an nft
        // and if they do set profile to true
        const balance = await contract.balanceOf(address)
        setHasProfile(() => balance > 0)
        // Get all posts
        let results = await contract.getAllPosts()
        // Fetch metadata of each post and add that to post object.
        let posts = await Promise.all(results.map(async i => {
            // use hash to fetch the post's metadata stored on ipfs 
            let response = await fetch(`https://gateway.pinata.cloud/ipfs/${i.hash}`)
            const metadataPost = await response.json()
            // get authors nft profile
            const nftId = await contract.profiles(i.author)
            // get uri url of nft profile
            const uri = await contract.tokenURI(nftId)
            // fetch nft profile metadata
            response = await fetch(uri)
            const metadataProfile = await response.json()
            // Get reaction count and user's reaction status
            const reactionCount = await contract.reactionCounts(i.id)
            const hasReacted = await contract.hasReacted(i.id, address)
            // Get comment count
            const commentCount = await contract.commentCounts(i.id)
            // define author object
            const author = {
                address: i.author,
                username: metadataProfile.username,
                avatar: metadataProfile.avatar
            }
            // define post object
            let post = {
                id: i.id,
                content: metadataPost.post,
                tipAmount: i.tipAmount,
                author,
                reactionCount: reactionCount.toNumber(),
                hasReacted,
                commentCount: commentCount.toNumber()
            }
            return post
        }))
        posts = posts.sort((a, b) => b.tipAmount - a.tipAmount)
        // Sort posts from most tipped to least tipped. 
        setPosts(posts)
        
        // Initialize tip amounts
        const initialTipAmounts = {}
        posts.forEach(post => {
            initialTipAmounts[post.id] = "0.1"
        })
        setTipAmounts(initialTipAmounts)
        
        setLoading(false)
    }
    
    useEffect(() => {
        if (!posts) {
            loadPosts()
        }
    }, [])
    
    const showError = (message) => {
        setErrorMessage(message)
        setShowErrorModal(true)
    }
    
    const closeErrorModal = () => {
        setErrorMessage('')
        setShowErrorModal(false)
    }
    
    const uploadPost = async () => {
        if (!post) return
        let hash
        // Upload post to IPFS
        try {
            const data = JSON.stringify({ post });
            const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'pinata_api_key': projectId,
                    'pinata_secret_api_key': projectSecret,
                },
                body: data
            });

            const result = await response.json();
            setLoading(true)
            hash = result.IpfsHash
        } catch (error) {
            showError("IPFS URI upload error: " + error.message)
            return
        }
        
        try {
            // upload post to blockchain
            await (await contract.uploadPost(hash)).wait()
            loadPosts()
        } catch (error) {
            showError("Error creating post: " + error.message)
        }
    }
    
    const openEditModal = (post) => {
        setEditingPost(post)
        setEditContent(post.content)
        setShowEditModal(true)
    }
    
    const closeEditModal = () => {
        setShowEditModal(false)
        setEditingPost(null)
        setEditContent('')
    }
    
    const openDeleteModal = (post) => {
        setPostToDelete(post)
        setShowDeleteModal(true)
    }
    
    const closeDeleteModal = () => {
        setShowDeleteModal(false)
        setPostToDelete(null)
    }
    
    const editPost = async () => {
        if (!editingPost || !editContent) return
        
        let hash
        // Upload updated post to IPFS
        try {
            const data = JSON.stringify({ post: editContent });
            const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'pinata_api_key': projectId,
                    'pinata_secret_api_key': projectSecret,
                },
                body: data
            });

            const result = await response.json();
            setLoading(true)
            hash = result.IpfsHash
        } catch (error) {
            showError("IPFS URI upload error: " + error.message)
            return
        }
        
        try {
            // Update post on blockchain
            await (await contract.editPost(editingPost.id, hash)).wait()
            closeEditModal()
            loadPosts()
        } catch (error) {
            console.error("Error editing post:", error)
            showError("Error editing post: " + error.message)
        }
    }
    
    const deletePost = async () => {
        if (!postToDelete) return
        
        try {
            // Delete post on blockchain
            await (await contract.deletePost(postToDelete.id)).wait()
            closeDeleteModal()
            loadPosts()
        } catch (error) {
            console.error("Error deleting post:", error)
            showError("Error deleting post: " + error.message)
        }
    }
    
    const toggleReaction = async (postId) => {
        if (!hasProfile) return
        
        try {
            await (await contract.toggleReaction(postId)).wait()
            loadPosts()
        } catch (error) {
            console.error("Error toggling reaction:", error)
            showError("Error toggling reaction: " + error.message)
        }
    }
    
    const toggleComments = async (postId) => {
        const isExpanded = expandedPostComments[postId]
        
        // Update expanded state
        setExpandedPostComments({
            ...expandedPostComments,
            [postId]: !isExpanded
        })
        
        // If expanding and comments not loaded yet, load them
        if (!isExpanded && (!postComments[postId] || postComments[postId].length === 0)) {
            await loadCommentsForPost(postId)
        }
    }
    
    const loadCommentsForPost = async (postId) => {
        setLoadingComments({
            ...loadingComments,
            [postId]: true
        })
        
        try {
            const results = await contract.getComments(postId)
            
            const comments = await Promise.all(results.map(async i => {
                try {
                    // use hash to fetch the comment's metadata stored on ipfs 
                    let response = await fetch(`https://gateway.pinata.cloud/ipfs/${i.hash}`)
                    const metadataComment = await response.json()
                    
                    // get author nft profile
                    const nftId = await contract.profiles(i.author)
                    // get uri url of nft profile
                    const uri = await contract.tokenURI(nftId)
                    // fetch nft profile metadata
                    response = await fetch(uri)
                    const metadataProfile = await response.json()
                    
                    // define author object
                    const author = {
                        address: i.author,
                        username: metadataProfile.username,
                        avatar: metadataProfile.avatar
                    }
                    
                    // define comment object
                    let comment = {
                        id: i.id.toNumber(),
                        content: metadataComment.comment,
                        author,
                        timestamp: new Date(i.timestamp.toNumber() * 1000).toLocaleString()
                    }
                    return comment
                } catch (e) {
                    console.error("Error processing comment:", e)
                    return null
                }
            }))
            
            // Filter out any null values (failed to process)
            const validComments = comments.filter(comment => comment !== null)
            
            // Sort comments by newest first
            validComments.sort((a, b) => b.id - a.id)
            
            setPostComments({
                ...postComments,
                [postId]: validComments
            })
        } catch (error) {
            console.error("Error loading comments:", error)
        }
        
        setLoadingComments({
            ...loadingComments,
            [postId]: false
        })
    }
    
    const handleCommentContentChange = (postId, value) => {
        setCommentContents({
            ...commentContents,
            [postId]: value
        })
    }
    
    const addComment = async (postId) => {
        const content = commentContents[postId]
        if (!content) return
        
        let hash
        // Upload comment to IPFS
        try {
            const data = JSON.stringify({ comment: content });
            const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'pinata_api_key': projectId,
                    'pinata_secret_api_key': projectSecret,
                },
                body: data
            });

            const result = await response.json();
            setLoadingComments({
                ...loadingComments,
                [postId]: true
            })
            hash = result.IpfsHash
        } catch (error) {
            showError("IPFS URI upload error: " + error.message)
            return
        }
        
        try {
            // Add comment on blockchain
            await (await contract.addComment(postId, hash)).wait()
            
            // Clear comment content
            handleCommentContentChange(postId, '')
            
            // Reload comments and posts
            await loadCommentsForPost(postId)
            loadPosts()
        } catch (error) {
            console.error("Error adding comment:", error)
            showError("Error adding comment: " + error.message)
        }
    }
    
    const openEditCommentModal = (postId, comment) => {
        setCurrentPostIdForComment(postId)
        setEditingComment(comment)
        setEditCommentContent(comment.content)
        setShowEditCommentModal(true)
    }
    
    const closeEditCommentModal = () => {
        setShowEditCommentModal(false)
        setEditingComment(null)
        setEditCommentContent('')
        setCurrentPostIdForComment(null)
    }
    
    const editComment = async () => {
        if (!editingComment || !editCommentContent || !currentPostIdForComment) return
        
        let hash
        // Upload updated comment to IPFS
        try {
            const data = JSON.stringify({ comment: editCommentContent });
            const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'pinata_api_key': projectId,
                    'pinata_secret_api_key': projectSecret,
                },
                body: data
            });

            const result = await response.json();
            setLoadingComments({
                ...loadingComments,
                [currentPostIdForComment]: true
            })
            hash = result.IpfsHash
        } catch (error) {
            showError("IPFS URI upload error: " + error.message)
            return
        }
        
        try {
            // Update comment on blockchain
            await (await contract.editComment(currentPostIdForComment, editingComment.id, hash)).wait()
            closeEditCommentModal()
            await loadCommentsForPost(currentPostIdForComment)
        } catch (error) {
            console.error("Error editing comment:", error)
            showError("Error editing comment: " + error.message)
        }
    }
    
    const openDeleteCommentModal = (postId, comment) => {
        setCurrentPostIdForComment(postId)
        setCommentToDelete(comment)
        setShowDeleteCommentModal(true)
    }
    
    const closeDeleteCommentModal = () => {
        setShowDeleteCommentModal(false)
        setCommentToDelete(null)
        setCurrentPostIdForComment(null)
        setIsProcessingDelete(false)
    }
    
    const deleteComment = async () => {
        if (!commentToDelete || !currentPostIdForComment || isProcessingDelete) return
        
        setIsProcessingDelete(true)
        
        try {
            console.log(`Deleting comment - Post ID: ${currentPostIdForComment}, Comment ID: ${commentToDelete.id}`);
            
            // Delete comment on blockchain - with explicit error handling
            const tx = await contract.deleteComment(currentPostIdForComment, commentToDelete.id);
            console.log("Transaction hash:", tx.hash);
            
            // Wait for confirmation with specific error handling
            await tx.wait();
            console.log("Transaction confirmed");
            
            // Remove the deleted comment from state immediately
            if (postComments[currentPostIdForComment]) {
                const updatedComments = postComments[currentPostIdForComment].filter(
                    c => c.id !== commentToDelete.id
                );
                
                setPostComments({
                    ...postComments,
                    [currentPostIdForComment]: updatedComments
                });
            }
            
            closeDeleteCommentModal();
            
            // Reload data to ensure consistency
            setTimeout(() => {
                loadPosts();
                loadCommentsForPost(currentPostIdForComment);
            }, 1000);
            
        } catch (error) {
            console.error("Error deleting comment:", error);
            
            // Extract meaningful error message
            let errorMsg = "Error deleting comment";
            if (error.reason) {
                errorMsg += ": " + error.reason;
            } else if (error.message) {
                errorMsg += ": " + error.message;
            }
            
            showError(errorMsg);
            setIsProcessingDelete(false);
        }
    }
    
    const handleTipAmountChange = (postId, value) => {
        // Only allow valid numbers
        if (value === '' || (!isNaN(value) && parseFloat(value) >= 0)) {
            setTipAmounts({
                ...tipAmounts,
                [postId]: value
            })
        }
    }
    
    const tip = async (post) => {
        const amount = tipAmounts[post.id] || "0.1"
        if (isNaN(amount) || parseFloat(amount) <= 0) {
            showError("Please enter a valid tip amount")
            return
        }
        
        try {
            // Tip post owner with custom amount
            await (await contract.tipPostOwner(post.id, { 
                value: ethers.utils.parseEther(amount)
            })).wait()
            loadPosts()
        } catch (error) {
            console.error("Error tipping post:", error)
            showError("Error tipping post: " + error.message)
        }
    }
    
    if (loading) return (
        <div className='text-center'>
            <main style={{ padding: "1rem 0" }}>
                <h2>Loading...</h2>
            </main>
        </div>
    )
    
    return (
        <div className="container-fluid mt-5">
            {hasProfile ?
                (<div className="row">
                    <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
                        <div className="content mx-auto">
                            <Row className="g-4">
                                <Form.Control onChange={(e) => setPost(e.target.value)} size="lg" required as="textarea" />
                                <div className="d-grid px-0">
                                    <Button onClick={uploadPost} variant="primary" size="lg">
                                        Post!
                                    </Button>
                                </div>
                            </Row>
                        </div>
                    </main>
                </div>)
                :
                (<div className="text-center">
                    <main style={{ padding: "1rem 0" }}>
                        <h2>Must own an NFT to post</h2>
                    </main>
                </div>)
            }

            <p>&nbsp;</p>
            <hr />
            <p className="my-auto">&nbsp;</p>
            {posts.length > 0 ?
                posts.map((post, key) => {
                    return (
                        <div key={key} className="col-lg-12 my-3 mx-auto" style={{ width: '1000px' }}>
                            <Card border="primary">
                                <Card.Header>
                                    <img
                                        className='mr-2'
                                        width='30'
                                        height='30'
                                        src={post.author.avatar}
                                    />
                                    <small className="ms-2 me-auto d-inline">
                                        {post.author.username}
                                    </small>
                                    <small className="mt-1 float-end d-inline">
                                        {post.author.address}
                                    </small>
                                </Card.Header>
                                <Card.Body color="secondary">
                                    <Card.Title>
                                        {post.content}
                                    </Card.Title>
                                </Card.Body>
                                <Card.Footer className="list-group-item">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <span className="me-2">
                                                {post.hasReacted ? 
                                                    <FaHeart 
                                                        className="text-danger" 
                                                        style={{ cursor: hasProfile ? 'pointer' : 'default' }} 
                                                        onClick={() => hasProfile && toggleReaction(post.id)} 
                                                    /> : 
                                                    <FaRegHeart 
                                                        style={{ cursor: hasProfile ? 'pointer' : 'default' }} 
                                                        onClick={() => hasProfile && toggleReaction(post.id)} 
                                                    />
                                                } {post.reactionCount}
                                            </span>
                                            <span className="me-2">
                                                <FaComment 
                                                    style={{ cursor: 'pointer' }} 
                                                    onClick={() => toggleComments(post.id)} 
                                                /> {post.commentCount}
                                            </span>
                                            <span>
                                                Tip: {ethers.utils.formatEther(post.tipAmount)} ETH
                                            </span>
                                        </div>
                                        <div>
                                            {address === post.author.address && hasProfile ? (
                                                <>
                                                    <Button onClick={() => openEditModal(post)} className="mx-2" variant="outline-primary" size="sm">
                                                        <FaEdit /> Edit
                                                    </Button>
                                                    <Button onClick={() => openDeleteModal(post)} variant="outline-danger" size="sm">
                                                        <FaTrash /> Delete
                                                    </Button>
                                                </>
                                            ) : address !== post.author.address && hasProfile ? (
                                                <InputGroup className="mt-1" style={{ width: '220px', display: 'inline-flex' }}>
                                                    <Form.Control
                                                        size="sm"
                                                        type="text"
                                                        placeholder="0.1"
                                                        value={tipAmounts[post.id] || "0.1"}
                                                        onChange={(e) => handleTipAmountChange(post.id, e.target.value)}
                                                    />
                                                    <InputGroup.Text>ETH</InputGroup.Text>
                                                    <Button variant="outline-success" size="sm" onClick={() => tip(post)}>
                                                        Tip
                                                    </Button>
                                                </InputGroup>
                                            ) : null}
                                        </div>
                                    </div>
                                </Card.Footer>
                                
                                {expandedPostComments[post.id] && (
                                    <div className="comment-section px-3 py-2 bg-light">
                                        {/* Comment Form */}
                                        {hasProfile && (
                                            <div className="comment-form mb-3">
                                                <InputGroup>
                                                    <Form.Control
                                                        placeholder="Write a comment..."
                                                        value={commentContents[post.id] || ''}
                                                        onChange={(e) => handleCommentContentChange(post.id, e.target.value)}
                                                    />
                                                    <Button 
                                                        variant="primary"
                                                        onClick={() => addComment(post.id)}
                                                    >
                                                        <FaReply /> Post
                                                    </Button>
                                                </InputGroup>
                                            </div>
                                        )}
                                        
                                        {/* Comments List */}
                                        {loadingComments[post.id] ? (
                                            <div className="text-center py-3">
                                                <p>Loading comments...</p>
                                            </div>
                                        ) : postComments[post.id] && postComments[post.id].length > 0 ? (
                                            <ListGroup variant="flush">
                                                {postComments[post.id].map((comment, idx) => (
                                                    <ListGroup.Item key={idx} className="border-bottom bg-light">
                                                        <div className="d-flex mb-2">
                                                            <img
                                                                className='me-2'
                                                                width='30'
                                                                height='30'
                                                                src={comment.author.avatar}
                                                            />
                                                            <div>
                                                                <div className="fw-bold">{comment.author.username}</div>
                                                                <small className="text-muted">{comment.timestamp}</small>
                                                            </div>
                                                            {address === comment.author.address && (
                                                                <div className="ms-auto">
                                                                    <Button 
                                                                        variant="link" 
                                                                        size="sm" 
                                                                        className="text-primary p-0 me-2"
                                                                        onClick={() => openEditCommentModal(post.id, comment)}
                                                                    >
                                                                        <FaEdit />
                                                                    </Button>
                                                                    <Button 
                                                                        variant="link" 
                                                                        size="sm" 
                                                                        className="text-danger p-0"
                                                                        onClick={() => openDeleteCommentModal(post.id, comment)}
                                                                    >
                                                                        <FaTrash />
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p>{comment.content}</p>
                                                    </ListGroup.Item>
                                                ))}
                                            </ListGroup>
                                        ) : (
                                            <div className="text-center py-3">
                                                <p>No comments yet</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Card>
                        </div>)
                })
                : (
                    <div className="text-center">
                        <main style={{ padding: "1rem 0" }}>
                            <h2>No posts yet</h2>
                        </main>
                    </div>
                )}
                
            {/* Edit Post Modal */}
            <Modal show={showEditModal} onHide={closeEditModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Post</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Control 
                                as="textarea" 
                                rows={3} 
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={closeEditModal}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={editPost}>
                        Save Changes
                    </Button>
                </Modal.Footer>
            </Modal>
            
            {/* Delete Post Modal */}
            <Modal show={showDeleteModal} onHide={closeDeleteModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Delete Post</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to delete this post? This action cannot be undone.
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={closeDeleteModal}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={deletePost}>
                        Delete
                    </Button>
                </Modal.Footer>
            </Modal>
            
            {/* Edit Comment Modal */}
            <Modal show={showEditCommentModal} onHide={closeEditCommentModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Comment</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Control 
                                as="textarea" 
                                rows={3} 
                                value={editCommentContent}
                                onChange={(e) => setEditCommentContent(e.target.value)}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={closeEditCommentModal}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={editComment}>
                        Save Changes
                    </Button>
                </Modal.Footer>
            </Modal>
            
            {/* Delete Comment Modal */}
            <Modal show={showDeleteCommentModal} onHide={closeDeleteCommentModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Delete Comment</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to delete this comment? This action cannot be undone.
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={closeDeleteCommentModal}>
                        Cancel
                    </Button>
                    <Button 
                        variant="danger" 
                        onClick={deleteComment}
                        disabled={isProcessingDelete}
                    >
                        {isProcessingDelete ? 'Processing...' : 'Delete'}
                    </Button>
                </Modal.Footer>
            </Modal>
            
            {/* Error Modal */}
            <Modal show={showErrorModal} onHide={closeErrorModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Error</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {errorMessage}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={closeErrorModal}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div >
    );
}

export default Home