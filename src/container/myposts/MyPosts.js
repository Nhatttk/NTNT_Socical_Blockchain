import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Row, Form, Button, Card, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const MyPosts = ({ contract }) => {
  const [posts, setPosts] = useState([]);
  const [hasProfile, setHasProfile] = useState(false);
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadMyPosts = async () => {
    // Get user's address
    let address = await contract.signer.getAddress();
    setAddress(address);
    console.log("User address: ", address);
    // Check if user owns an nft
    const balance = await contract.balanceOf(address);
    setHasProfile(() => balance > 0);

    if (balance <= 0) {
      setLoading(false);
      return;
    }

    // Get all posts
    let results = await contract.getAllPosts();

    // Filter only my posts
    results = results.filter(
      (post) => post.author.toLowerCase() === address.toLowerCase()
    );

    // Fetch metadata of each post and add that to post object
    let posts = await Promise.all(
      results.map(async (i) => {
        // use hash to fetch the post's metadata stored on ipfs
        let response = await fetch(
          `https://gateway.pinata.cloud/ipfs/${i.hash}`
        );
        const metadataPost = await response.json();

        // get authors nft profile
        const nftId = await contract.profiles(i.author);
        // get uri url of nft profile
        const uri = await contract.tokenURI(nftId);
        // fetch nft profile metadata
        response = await fetch(uri);
        const metadataProfile = await response.json();

        // define author object
        const author = {
          address: i.author,
          username: metadataProfile.username,
          avatar: metadataProfile.avatar,
        };

        // define post object
        let post = {
          id: i.id,
          content: metadataPost.post,
          image: metadataPost.image,
          tipAmount: i.tipAmount,
          author,
        };
        return post;
      })
    );

    // Sort posts from newest to oldest
    posts = posts.sort((a, b) => {
      const idA = a.id.toNumber();
      const idB = b.id.toNumber();
      return idB - idA; // newest first
    });

    setPosts(posts);
    setLoading(false);
  };

  useEffect(() => {
    console.log(contract);
    if (contract) {
      loadMyPosts();
    }
  }, [contract]);

  const deletePost = async (postId) => {
    try {
      if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này không?")) {
        return;
      }

      setLoading(true);
      console.log("Deleting post with ID:", postId);

      // Call contract method to delete post
      const tx = await contract.deletePost(postId);
      await tx.wait();

      console.log("Post deleted successfully");

      // Reload the posts
      await loadMyPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      let errorMessage = "Không thể xóa bài viết";

      if (error.reason) {
        errorMessage += `: ${error.reason}`;
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      }

      window.alert(errorMessage);
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="text-center">
        <main style={{ padding: "1rem 0" }}>
          <Spinner animation="border" role="status">
            <span className="visually-hidden">
              <div class="loader"></div>
            </span>
          </Spinner>
          <h2 className="mt-3">Loading your posts...</h2>
        </main>
      </div>
    );

  return (
    <div className="container-fluid mt-5">
      <h2 className="text-center mb-4">My Posts</h2>

      {!hasProfile ? (
        <div className="text-center">
          <main style={{ padding: "1rem 0" }}>
            <h3>You need an NFT profile to post content</h3>
            <Button
              variant="primary"
              onClick={() => navigate("/profile")}
              className="mt-2"
            >
              Create Profile
            </Button>
          </main>
        </div>
      ) : posts.length > 0 ? (
        <div className="row">
          {posts.map((post, key) => (
            <div
              key={key}
              className="col-lg-12 my-3 mx-auto"
              style={{ maxWidth: "1000px" }}
            >
              <Card border="primary">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <div>
                    <img
                      className="mr-2"
                      width="30"
                      height="30"
                      src={post.author.avatar}
                      alt="Avatar"
                    />
                    <small className="ms-2 me-auto d-inline">
                      {post.author.username}
                    </small>
                  </div>
                  <small className="text-muted">
                    Post #{post.id.toString()}
                  </small>
                </Card.Header>
                <Card.Body>
                  <Card.Title>{post.content}</Card.Title>
                  {post.image && (
                    <div className="mt-3 text-center">
                      <img
                        src={post.image}
                        style={{ maxWidth: "100%", maxHeight: "300px" }}
                        alt="Post image"
                      />
                    </div>
                  )}
                </Card.Body>
                <Card.Footer className="d-flex justify-content-between align-items-center">
                  <div>
                    Tip Amount: {ethers.utils.formatEther(post.tipAmount)} ETH
                  </div>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => deletePost(post.id)}
                  >
                    Delete
                  </Button>
                </Card.Footer>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center">
          <main style={{ padding: "1rem 0" }}>
            <h3>You haven't created any posts yet</h3>
            <Button
              variant="primary"
              onClick={() => (window.location.href = "/")}
              className="mt-2"
            >
              Create New Post
            </Button>
          </main>
        </div>
      )}
    </div>
  );
};

export default MyPosts;
