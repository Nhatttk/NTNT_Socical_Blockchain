// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract Decentratwitter is ERC721URIStorage {
    uint256 public tokenCount;
    uint256 public postCount;
    mapping(uint256 => Post) public posts;
    mapping(address => uint256) public profiles;
    // Mapping for comments: postId => commentId => Comment
    mapping(uint256 => mapping(uint256 => Comment)) public comments;
    // Mapping for comment counts per post
    mapping(uint256 => uint256) public commentCounts;
    // Mapping for comment existence tracking
    mapping(uint256 => mapping(uint256 => bool)) public commentExists;
    // Mapping for reactions: postId => address => bool
    mapping(uint256 => mapping(address => bool)) public postReactions;
    // Mapping for reaction counts per post
    mapping(uint256 => uint256) public reactionCounts;

    struct Post {
        uint256 id;
        string hash;
        uint256 tipAmount;
        address payable author;
        bool exists; // Add a flag to check if post exists
    }

    struct Comment {
        uint256 id;
        string hash;
        address payable author;
        uint256 timestamp;
    }

    event PostCreated(
        uint256 id,
        string hash,
        uint256 tipAmount,
        address payable author
    );

    event PostTipped(
        uint256 id,
        string hash,
        uint256 tipAmount,
        address payable author
    );

    event PostUpdated(
        uint256 id,
        string hash,
        address payable author
    );

    event PostDeleted(
        uint256 id,
        address payable author
    );

    event CommentCreated(
        uint256 postId,
        uint256 commentId,
        string hash,
        address payable author,
        uint256 timestamp
    );

    event CommentUpdated(
        uint256 postId,
        uint256 commentId,
        string hash,
        address payable author,
        uint256 timestamp
    );

    event CommentDeleted(
        uint256 postId,
        uint256 commentId,
        address payable author
    );
    
    event ReactionAdded(
        uint256 postId,
        address user,
        uint256 reactionCount
    );
    
    event ReactionRemoved(
        uint256 postId,
        address user,
        uint256 reactionCount
    );

    constructor() ERC721("Decentratwitter", "DAPP") {}

    function mint(string memory _tokenURI) external returns (uint256) {
        tokenCount++;
        _safeMint(msg.sender, tokenCount);
        _setTokenURI(tokenCount, _tokenURI);
        setProfile(tokenCount);
        return (tokenCount);
    }

    function setProfile(uint256 _id) public {
        require(
            ownerOf(_id) == msg.sender,
            "Must own the nft you want to select as your profile"
        );
        profiles[msg.sender] = _id;
    }

    function uploadPost(string memory _postHash) external {
        require(
            balanceOf(msg.sender) > 0,
            "Must own a decentratwitter nft to post"
        );
        require(bytes(_postHash).length > 0, "Cannot pass an empty hash");
        postCount++;
        posts[postCount] = Post(postCount, _postHash, 0, payable(msg.sender), true);
        emit PostCreated(postCount, _postHash, 0, payable(msg.sender));
    }

    function editPost(uint256 _id, string memory _postHash) external {
        require(_id > 0 && _id <= postCount, "Invalid post id");
        require(bytes(_postHash).length > 0, "Cannot pass an empty hash");
        Post memory _post = posts[_id];
        require(_post.exists, "Post does not exist");
        require(_post.author == msg.sender, "Only post author can edit");
        
        _post.hash = _postHash;
        posts[_id] = _post;
        emit PostUpdated(_id, _postHash, payable(msg.sender));
    }

    function deletePost(uint256 _id) external {
        require(_id > 0 && _id <= postCount, "Invalid post id");
        Post memory _post = posts[_id];
        require(_post.exists, "Post does not exist");
        require(_post.author == msg.sender, "Only post author can delete");
        
        _post.exists = false;
        posts[_id] = _post;
        emit PostDeleted(_id, payable(msg.sender));
    }
    
    function toggleReaction(uint256 _id) external {
        require(_id > 0 && _id <= postCount, "Invalid post id");
        require(
            balanceOf(msg.sender) > 0,
            "Must own a decentratwitter nft to react"
        );
        Post memory _post = posts[_id];
        require(_post.exists, "Post does not exist");
        
        // Toggle reaction state
        if (postReactions[_id][msg.sender]) {
            // Remove reaction
            postReactions[_id][msg.sender] = false;
            reactionCounts[_id]--;
            emit ReactionRemoved(_id, msg.sender, reactionCounts[_id]);
        } else {
            // Add reaction
            postReactions[_id][msg.sender] = true;
            reactionCounts[_id]++;
            emit ReactionAdded(_id, msg.sender, reactionCounts[_id]);
        }
    }
    
    function hasReacted(uint256 _id, address _user) public view returns (bool) {
        require(_id > 0 && _id <= postCount, "Invalid post id");
        Post memory _post = posts[_id];
        require(_post.exists, "Post does not exist");
        
        return postReactions[_id][_user];
    }

    function tipPostOwner(uint256 _id) external payable {
        require(_id > 0 && _id <= postCount, "Invalid post id");
        Post memory _post = posts[_id];
        require(_post.exists, "Post does not exist");
        require(_post.author != msg.sender, "Cannot tip your own post");
        _post.author.transfer(msg.value);
        _post.tipAmount += msg.value;
        posts[_id] = _post;
        emit PostTipped(_id, _post.hash, _post.tipAmount, _post.author);
    }

    function addComment(uint256 _postId, string memory _commentHash) external {
        require(_postId > 0 && _postId <= postCount, "Invalid post id");
        require(
            balanceOf(msg.sender) > 0,
            "Must own a decentratwitter nft to comment"
        );
        require(bytes(_commentHash).length > 0, "Cannot pass an empty hash");
        Post memory _post = posts[_postId];
        require(_post.exists, "Post does not exist");
        
        commentCounts[_postId]++;
        uint256 commentId = commentCounts[_postId];
        comments[_postId][commentId] = Comment(
            commentId,
            _commentHash,
            payable(msg.sender),
            block.timestamp
        );
        // Mark comment as existing
        commentExists[_postId][commentId] = true;
        
        emit CommentCreated(
            _postId,
            commentId,
            _commentHash,
            payable(msg.sender),
            block.timestamp
        );
    }

    function editComment(
        uint256 _postId,
        uint256 _commentId,
        string memory _commentHash
    ) external {
        require(_postId > 0 && _postId <= postCount, "Invalid post id");
        require(
            _commentId > 0 && _commentId <= commentCounts[_postId],
            "Invalid comment id"
        );
        Post memory _post = posts[_postId];
        require(_post.exists, "Post does not exist");
        require(commentExists[_postId][_commentId], "Comment does not exist");
        
        Comment memory _comment = comments[_postId][_commentId];
        require(
            _comment.author == msg.sender,
            "Only the comment author can edit"
        );
        require(bytes(_commentHash).length > 0, "Cannot pass an empty hash");
        _comment.hash = _commentHash;
        _comment.timestamp = block.timestamp;
        comments[_postId][_commentId] = _comment;
        emit CommentUpdated(
            _postId,
            _commentId,
            _commentHash,
            payable(msg.sender),
            block.timestamp
        );
    }

    function deleteComment(uint256 _postId, uint256 _commentId) external {
        require(_postId > 0 && _postId <= postCount, "Invalid post id");
        require(
            _commentId > 0 && _commentId <= commentCounts[_postId],
            "Invalid comment id"
        );
        Post memory _post = posts[_postId];
        require(_post.exists, "Post does not exist");
        require(commentExists[_postId][_commentId], "Comment does not exist or already deleted");
        
        Comment memory _comment = comments[_postId][_commentId];
        require(
            _comment.author == msg.sender,
            "Only the comment author can delete"
        );
        
        // Instead of using delete, mark as not existing but keep the data
        commentExists[_postId][_commentId] = false;
        emit CommentDeleted(_postId, _commentId, payable(msg.sender));
    }

    function getAllPosts() external view returns (Post[] memory _posts) {
        uint256 activePosts = 0;
        
        // First, count active posts
        for (uint256 i = 1; i <= postCount; i++) {
            if (posts[i].exists) {
                activePosts++;
            }
        }
        
        _posts = new Post[](activePosts);
        uint256 currentIndex = 0;
        
        // Then add all active posts to the array
        for (uint256 i = 1; i <= postCount; i++) {
            if (posts[i].exists) {
                _posts[currentIndex] = posts[i];
                currentIndex++;
            }
        }
    }

    function getComments(
        uint256 _postId
    ) external view returns (Comment[] memory _comments) {
        require(_postId > 0 && _postId <= postCount, "Invalid post id");
        Post memory _post = posts[_postId];
        require(_post.exists, "Post does not exist");
        
        // Count existing comments first
        uint256 existingCommentCount = 0;
        for (uint256 i = 1; i <= commentCounts[_postId]; i++) {
            if (commentExists[_postId][i]) {
                existingCommentCount++;
            }
        }
        
        _comments = new Comment[](existingCommentCount);
        uint256 currentIndex = 0;
        
        // Only include existing comments
        for (uint256 i = 1; i <= commentCounts[_postId]; i++) {
            if (commentExists[_postId][i]) {
                _comments[currentIndex] = comments[_postId][i];
                currentIndex++;
            }
        }
    }

    function getMyNfts() external view returns (uint256[] memory _ids) {
        _ids = new uint256[](balanceOf(msg.sender));
        uint256 currentIndex;
        uint256 _tokenCount = tokenCount;
        for (uint256 i = 0; i < _tokenCount; i++) {
            if (ownerOf(i + 1) == msg.sender) {
                _ids[currentIndex] = i + 1;
                currentIndex++;
            }
        }
    }
}