import { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  Row,
  Form,
  Button,
  Card,
  Spinner,
  Col,
  Modal,
  InputGroup,
  Alert,
  Tabs,
  Tab,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Countdown from "react-countdown";

const Auctions = ({ contract }) => {
  const [posts, setPosts] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [unpaidAuctions, setUnpaidAuctions] = useState([]);
  const [myUnpaidAuctions, setMyUnpaidAuctions] = useState([]);
  const [hasProfile, setHasProfile] = useState(false);
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [createAuctionData, setCreateAuctionData] = useState({
    postId: "",
    startPrice: "",
    durationInMinutes: "",
  });
  const [currentAuction, setCurrentAuction] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [tabKey, setTabKey] = useState("active");
  const [error, setError] = useState(null);
  const [isContractUpdated, setIsContractUpdated] = useState(false);
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      // Get user's address
      let address = await contract.signer.getAddress();
      setAddress(address);

      // Check if user owns an nft
      const balance = await contract.balanceOf(address);
      setHasProfile(() => balance > 0);

      // Get all posts
      const postsData = await contract.getAllPosts();
      console.log("All posts:", postsData);

      // Filter my posts
      const myPostsData = postsData.filter(
        (post) => post.author.toLowerCase() === address.toLowerCase()
      );
      console.log("My posts:", myPostsData);
      setMyPosts(myPostsData);

      // Check if contract has been updated with auction functions
      try {
        const auctionCount = await contract.auctionCount();
        setIsContractUpdated(true);

        // Get all active auctions
        const auctionsData = await contract.getActiveAuctions();
        console.log("Active auctions:", auctionsData);

        // Get unpaid auctions for current user
        const unpaidAuctionsData = await contract.getUnpaidAuctions(address);
        console.log("Unpaid auctions:", unpaidAuctionsData);

        // Get my unpaid auctions (where I'm the seller)
        const myUnpaidAuctionsData = await contract.getMyUnpaidAuctions();
        console.log("My unpaid auctions:", myUnpaidAuctionsData);

        // Fetch full auction details with post content
        let auctionsWithDetails = await Promise.all(
          auctionsData.map(async (auction) => {
            return await getAuctionWithDetails(auction, postsData, address);
          })
        );

        // Fetch unpaid auctions with details
        let unpaidAuctionsWithDetails = await Promise.all(
          unpaidAuctionsData.map(async (auction) => {
            return await getAuctionWithDetails(auction, postsData, address);
          })
        );

        // Fetch my unpaid auctions with details
        let myUnpaidAuctionsWithDetails = await Promise.all(
          myUnpaidAuctionsData.map(async (auction) => {
            return await getAuctionWithDetails(auction, postsData, address);
          })
        );

        // Remove null values (if any)
        auctionsWithDetails = auctionsWithDetails.filter((a) => a !== null);
        unpaidAuctionsWithDetails = unpaidAuctionsWithDetails.filter(
          (a) => a !== null
        );
        myUnpaidAuctionsWithDetails = myUnpaidAuctionsWithDetails.filter(
          (a) => a !== null
        );

        // Sort by end time (soonest first)
        auctionsWithDetails.sort((a, b) => a.remainingTime - b.remainingTime);

        setAuctions(auctionsWithDetails);
        setUnpaidAuctions(unpaidAuctionsWithDetails);
        setMyUnpaidAuctions(myUnpaidAuctionsWithDetails);
      } catch (err) {
        console.warn("Contract not updated with auction functionality:", err);
        setIsContractUpdated(false);
        setError(
          "Hợp đồng thông minh chưa được cập nhật với chức năng đấu giá. Cần triển khai lại hợp đồng."
        );
        // Set empty auctions array
        setAuctions([]);
        setUnpaidAuctions([]);
        setMyUnpaidAuctions([]);
      }

      setPosts(postsData);
      setLoading(false);
    } catch (error) {
      console.error("Error loading auctions data:", error);
      setError("Có lỗi khi tải dữ liệu. Vui lòng thử lại sau.");
      setLoading(false);
    }
  };

  // Helper function to get auction details
  const getAuctionWithDetails = async (auction, postsData, userAddress) => {
    const post = postsData.find(
      (p) => p.id.toString() === auction.postId.toString()
    );

    if (!post) return null;

    // Fetch post metadata from IPFS
    let response = await fetch(
      `https://gateway.pinata.cloud/ipfs/${post.hash}`
    );
    const metadataPost = await response.json();

    // Get author's profile
    const nftId = await contract.profiles(post.author);
    const uri = await contract.tokenURI(nftId);
    response = await fetch(uri);
    const metadataProfile = await response.json();

    // Get highest bidder profile if exists
    let highestBidderProfile = null;
    if (auction.highestBidder !== ethers.constants.AddressZero) {
      try {
        const bidderNftId = await contract.profiles(auction.highestBidder);
        const bidderUri = await contract.tokenURI(bidderNftId);
        const bidderResponse = await fetch(bidderUri);
        highestBidderProfile = await bidderResponse.json();
      } catch (error) {
        console.error("Error fetching highest bidder profile:", error);
      }
    }

    return {
      ...auction,
      post: {
        ...post,
        content: metadataPost.post,
        image: metadataPost.image,
      },
      owner: {
        address: post.author,
        username: metadataProfile.username,
        avatar: metadataProfile.avatar,
      },
      highestBidderProfile: highestBidderProfile
        ? {
            username: highestBidderProfile.username,
            avatar: highestBidderProfile.avatar,
          }
        : null,
      isOwner: post.author.toLowerCase() === userAddress.toLowerCase(),
      isHighestBidder:
        auction.highestBidder.toLowerCase() === userAddress.toLowerCase(),
      remainingTime: Number(auction.endTime) * 1000 - Date.now(),
    };
  };

  useEffect(() => {
    if (contract) {
      loadData();

      // Set up interval to refresh auction data every 5 seconds if contract is updated
      const interval = setInterval(() => {
        if (contract && isContractUpdated) loadData();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [contract, isContractUpdated]);

  const handleCreateAuction = async () => {
    try {
      if (!isContractUpdated) {
        setError("Chức năng đấu giá chưa được kích hoạt trên blockchain");
        return;
      }

      setLoading(true);

      const { postId, startPrice, durationInMinutes } = createAuctionData;

      if (!postId || !startPrice || !durationInMinutes) {
        alert("Vui lòng điền đầy đủ thông tin");
        setLoading(false);
        return;
      }

      // Convert values
      const postIdBN = ethers.BigNumber.from(postId);
      const startPriceWei = ethers.utils.parseEther(startPrice);
      const durationBN = ethers.BigNumber.from(durationInMinutes);

      console.log("Creating auction with:", {
        postId: postIdBN.toString(),
        startPrice: startPriceWei.toString(),
        duration: durationBN.toString(),
      });

      // Call contract to create auction
      const tx = await contract.createAuction(
        postIdBN,
        startPriceWei,
        durationBN
      );
      await tx.wait();

      // Reset form data
      setCreateAuctionData({
        postId: "",
        startPrice: "",
        durationInMinutes: "",
      });

      // Close modal and reload data
      setShowCreateModal(false);
      await loadData();
    } catch (error) {
      console.error("Error creating auction:", error);
      setError(`Lỗi tạo đấu giá: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceBid = async () => {
    try {
      if (!currentAuction || !bidAmount) return;

      setLoading(true);

      // Convert bid amount to wei
      const bidAmountWei = ethers.utils.parseEther(bidAmount);

      // Call contract to place bid
      const tx = await contract.placeBid(currentAuction.id);
      await tx.wait();

      // Reset form and close modal
      setBidAmount("");
      setShowBidModal(false);

      // Reload data
      await loadData();
    } catch (error) {
      console.error("Error placing bid:", error);
      setError(`Lỗi đặt giá: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePayForAuction = async () => {
    try {
      if (!currentAuction) return;

      setLoading(true);

      // Call contract to pay for auction
      const tx = await contract.payForAuction(currentAuction.id, {
        value: currentAuction.highestBid,
      });
      await tx.wait();

      // Close modal and reload data
      setShowPayModal(false);
      await loadData();
    } catch (error) {
      console.error("Error paying for auction:", error);
      setError(`Lỗi thanh toán đấu giá: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeAuction = async (auctionId) => {
    try {
      if (!window.confirm("Bạn có chắc muốn kết thúc đấu giá này?")) return;

      setLoading(true);

      // Call contract to finalize auction
      const tx = await contract.finalizeAuction(auctionId);
      await tx.wait();

      // Reload data
      await loadData();
    } catch (error) {
      console.error("Error finalizing auction:", error);
      setError(`Lỗi kết thúc đấu giá: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAuctionPayment = async (auctionId) => {
    try {
      if (
        !window.confirm(
          "Bạn có chắc muốn hủy đấu giá này vì chưa nhận được thanh toán?"
        )
      )
        return;

      setLoading(true);

      // Call contract to cancel auction payment
      const tx = await contract.cancelAuctionPayment(auctionId);
      await tx.wait();

      // Reload data
      await loadData();
    } catch (error) {
      console.error("Error cancelling auction payment:", error);
      setError(`Lỗi hủy đấu giá: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const openBidModal = (auction) => {
    setCurrentAuction(auction);
    setShowBidModal(true);

    // Set minimum bid
    const currentBid = auction.highestBid;
    const minBid = ethers.utils.formatEther(
      ethers.utils
        .parseEther(
          currentBid.eq(0)
            ? auction.startPrice.toString()
            : currentBid.toString()
        )
        .add(ethers.utils.parseEther("0.01"))
    );
    setBidAmount(minBid);
  };

  const openPayModal = (auction) => {
    setCurrentAuction(auction);
    setShowPayModal(true);
  };

  // CountdownRenderer for auction timer
  const countdownRenderer = ({
    days,
    hours,
    minutes,
    seconds,
    completed,
    auction,
  }) => {
    if (completed) {
      return <span className="text-danger">Đã kết thúc</span>;
    } else {
      return (
        <span>
          {days > 0 && `${days}d `}
          {hours}h {minutes}m {seconds}s
        </span>
      );
    }
  };

  if (loading)
    return (
      <div className="text-center">
        <main style={{ padding: "1rem 0" }}>
          <div class="loader"></div>
        </main>
      </div>
    );

  return (
    <div className="container-fluid mt-5">
      <h2 className="text-center mb-4">Đấu giá bài viết</h2>

      {error && (
        <Alert variant="warning" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      {!isContractUpdated && (
        <Alert variant="info">
          <Alert.Heading>Chức năng đấu giá chưa được kích hoạt</Alert.Heading>
          <p>
            Smart contract cần được cập nhật và triển khai lại để sử dụng tính
            năng đấu giá. Vui lòng liên hệ quản trị viên để cập nhật.
          </p>
        </Alert>
      )}

      {!hasProfile ? (
        <div className="text-center">
          <main style={{ padding: "1rem 0" }}>
            <h3>Bạn cần có NFT profile để tham gia đấu giá</h3>
            <Button
              variant="primary"
              onClick={() => navigate("/profile")}
              className="mt-2"
            >
              Tạo Profile
            </Button>
          </main>
        </div>
      ) : (
        <>
          <div className="d-flex justify-content-end mb-4">
            <Button
              variant="success"
              onClick={() => setShowCreateModal(true)}
              disabled={!isContractUpdated}
            >
              Tạo đấu giá mới
            </Button>
          </div>

          <Tabs
            activeKey={tabKey}
            onSelect={(k) => setTabKey(k)}
            className="mb-4"
          >
            <Tab eventKey="active" title="Đấu giá đang diễn ra">
              {auctions.length > 0 ? (
                <Row>
                  {auctions.map((auction, index) => (
                    <Col key={index} lg={4} md={6} className="mb-4">
                      <Card>
                        <Card.Header className="d-flex justify-content-between align-items-center">
                          <div>
                            <img
                              className="mr-2"
                              width="30"
                              height="30"
                              src={auction.owner.avatar}
                              alt="Owner Avatar"
                            />
                            <small className="ms-2 me-auto d-inline">
                              {auction.owner.username}
                            </small>
                          </div>
                          <small className="text-muted">
                            #{auction.id.toString()}
                          </small>
                        </Card.Header>

                        <Card.Body>
                          <Card.Title>{auction.post.content}</Card.Title>
                          {auction.post.image && (
                            <div className="mt-3 text-center">
                              <img
                                src={auction.post.image}
                                style={{ maxWidth: "100%", maxHeight: "200px" }}
                                alt="Post image"
                              />
                            </div>
                          )}

                          <div className="mt-3">
                            <div className="d-flex justify-content-between">
                              <span>Giá khởi điểm:</span>
                              <strong>
                                {ethers.utils.formatEther(auction.startPrice)}{" "}
                                ETH
                              </strong>
                            </div>
                            <div className="d-flex justify-content-between mt-2">
                              <span>Giá cao nhất:</span>
                              <strong className="text-success">
                                {auction.highestBid.eq(0)
                                  ? "Chưa có lượt đấu giá"
                                  : `${ethers.utils.formatEther(
                                      auction.highestBid
                                    )} ETH`}
                              </strong>
                            </div>

                            {auction.highestBidderProfile && (
                              <div className="d-flex align-items-center mt-2">
                                <span>Người đặt giá: </span>
                                <div className="ms-auto d-flex align-items-center">
                                  <img
                                    className="ms-2 me-1"
                                    width="20"
                                    height="20"
                                    src={auction.highestBidderProfile.avatar}
                                    alt="Bidder Avatar"
                                  />
                                  <span>
                                    {auction.highestBidderProfile.username}
                                  </span>
                                </div>
                              </div>
                            )}

                            <div className="d-flex justify-content-between mt-2">
                              <span>Thời gian còn lại:</span>
                              <strong
                                className={
                                  auction.remainingTime < 300000
                                    ? "text-danger"
                                    : ""
                                }
                              >
                                <Countdown
                                  date={Date.now() + auction.remainingTime}
                                  renderer={(props) =>
                                    countdownRenderer({ ...props, auction })
                                  }
                                />
                              </strong>
                            </div>
                          </div>
                        </Card.Body>

                        <Card.Footer>
                          {auction.isOwner ? (
                            <Button
                              variant="warning"
                              className="w-100"
                              onClick={() => handleFinalizeAuction(auction.id)}
                              disabled={auction.highestBid.eq(0)}
                            >
                              Kết thúc đấu giá
                            </Button>
                          ) : (
                            <Button
                              variant="primary"
                              className="w-100"
                              onClick={() => openBidModal(auction)}
                              disabled={auction.isHighestBidder}
                            >
                              {auction.isHighestBidder
                                ? "Bạn đang là người đặt giá cao nhất"
                                : "Đặt giá"}
                            </Button>
                          )}
                        </Card.Footer>
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                <div className="text-center">
                  <h3>Không có phiên đấu giá nào đang diễn ra</h3>
                  <p>Tạo phiên đấu giá đầu tiên ngay bây giờ</p>
                </div>
              )}
            </Tab>

            <Tab
              eventKey="unpaid"
              title={`Đấu giá cần thanh toán (${unpaidAuctions.length})`}
            >
              {unpaidAuctions.length > 0 ? (
                <Row>
                  {unpaidAuctions.map((auction, index) => (
                    <Col key={index} lg={4} md={6} className="mb-4">
                      <Card border="warning">
                        <Card.Header className="d-flex justify-content-between align-items-center bg-warning text-white">
                          <div>
                            <img
                              className="mr-2"
                              width="30"
                              height="30"
                              src={auction.owner.avatar}
                              alt="Owner Avatar"
                            />
                            <small className="ms-2 me-auto d-inline">
                              {auction.owner.username}
                            </small>
                          </div>
                          <small>
                            #{auction.id.toString()} - Cần thanh toán
                          </small>
                        </Card.Header>

                        <Card.Body>
                          <Card.Title>{auction.post.content}</Card.Title>
                          {auction.post.image && (
                            <div className="mt-3 text-center">
                              <img
                                src={auction.post.image}
                                style={{ maxWidth: "100%", maxHeight: "200px" }}
                                alt="Post image"
                              />
                            </div>
                          )}

                          <div className="mt-3">
                            <div className="d-flex justify-content-between">
                              <span>Giá thắng thầu:</span>
                              <strong className="text-success">
                                {ethers.utils.formatEther(auction.highestBid)}{" "}
                                ETH
                              </strong>
                            </div>

                            <Alert variant="warning" className="mt-3">
                              <Alert.Heading className="h6">
                                Thanh toán ngay
                              </Alert.Heading>
                              <p className="mb-0">
                                Bạn đã thắng đấu giá này. Vui lòng thanh toán để
                                nhận bài viết.
                              </p>
                            </Alert>
                          </div>
                        </Card.Body>

                        <Card.Footer>
                          <Button
                            variant="success"
                            className="w-100"
                            onClick={() => openPayModal(auction)}
                          >
                            Thanh toán ngay
                          </Button>
                        </Card.Footer>
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                <div className="text-center">
                  <h3>Không có đấu giá nào cần thanh toán</h3>
                </div>
              )}
            </Tab>

            <Tab
              eventKey="myunpaid"
              title={`Chờ thanh toán (${myUnpaidAuctions.length})`}
            >
              {myUnpaidAuctions.length > 0 ? (
                <Row>
                  {myUnpaidAuctions.map((auction, index) => (
                    <Col key={index} lg={4} md={6} className="mb-4">
                      <Card border="info">
                        <Card.Header className="d-flex justify-content-between align-items-center bg-info text-white">
                          <div>
                            <small className="ms-2 me-auto d-inline">
                              Đấu giá của bạn
                            </small>
                          </div>
                          <small>
                            #{auction.id.toString()} - Chờ thanh toán
                          </small>
                        </Card.Header>

                        <Card.Body>
                          <Card.Title>{auction.post.content}</Card.Title>
                          {auction.post.image && (
                            <div className="mt-3 text-center">
                              <img
                                src={auction.post.image}
                                style={{ maxWidth: "100%", maxHeight: "200px" }}
                                alt="Post image"
                              />
                            </div>
                          )}

                          <div className="mt-3">
                            <div className="d-flex justify-content-between">
                              <span>Giá thắng thầu:</span>
                              <strong className="text-success">
                                {ethers.utils.formatEther(auction.highestBid)}{" "}
                                ETH
                              </strong>
                            </div>

                            {auction.highestBidderProfile && (
                              <div className="d-flex align-items-center mt-2">
                                <span>Người thắng: </span>
                                <div className="ms-auto d-flex align-items-center">
                                  <img
                                    className="ms-2 me-1"
                                    width="20"
                                    height="20"
                                    src={auction.highestBidderProfile.avatar}
                                    alt="Bidder Avatar"
                                  />
                                  <span>
                                    {auction.highestBidderProfile.username}
                                  </span>
                                </div>
                              </div>
                            )}

                            <Alert variant="info" className="mt-3">
                              <Alert.Heading className="h6">
                                Đang chờ thanh toán
                              </Alert.Heading>
                              <p className="mb-0">
                                Người thắng đấu giá chưa thanh toán. Bạn có thể
                                hủy đấu giá sau 1 giờ.
                              </p>
                            </Alert>
                          </div>
                        </Card.Body>

                        <Card.Footer>
                          <Button
                            variant="danger"
                            className="w-100"
                            onClick={() =>
                              handleCancelAuctionPayment(auction.id)
                            }
                          >
                            Hủy đấu giá
                          </Button>
                        </Card.Footer>
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                <div className="text-center">
                  <h3>Không có đấu giá nào đang chờ thanh toán</h3>
                </div>
              )}
            </Tab>
          </Tabs>
        </>
      )}

      {/* Create Auction Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Tạo đấu giá mới</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Chọn bài viết</Form.Label>
              <Form.Select
                value={createAuctionData.postId}
                onChange={(e) =>
                  setCreateAuctionData({
                    ...createAuctionData,
                    postId: e.target.value,
                  })
                }
              >
                <option value="">-- Chọn bài viết --</option>
                {myPosts.map((post) => (
                  <option key={post.id.toString()} value={post.id.toString()}>
                    Post #{post.id.toString()}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Giá khởi điểm (ETH)</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                min="0.01"
                value={createAuctionData.startPrice}
                onChange={(e) =>
                  setCreateAuctionData({
                    ...createAuctionData,
                    startPrice: e.target.value,
                  })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Thời gian đấu giá (phút)</Form.Label>
              <Form.Control
                type="number"
                step="1"
                min="1"
                value={createAuctionData.durationInMinutes}
                onChange={(e) =>
                  setCreateAuctionData({
                    ...createAuctionData,
                    durationInMinutes: e.target.value,
                  })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleCreateAuction}>
            Tạo đấu giá
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Bid Modal */}
      <Modal show={showBidModal} onHide={() => setShowBidModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Đặt giá</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentAuction && (
            <>
              <p>
                <strong>Bài viết:</strong> {currentAuction.post.content}
              </p>
              <p>
                <strong>Giá cao nhất hiện tại:</strong>{" "}
                {currentAuction.highestBid.eq(0)
                  ? ethers.utils.formatEther(currentAuction.startPrice)
                  : ethers.utils.formatEther(currentAuction.highestBid)}{" "}
                ETH
              </p>

              <Alert variant="info">
                <strong>Lưu ý:</strong> Khi đặt giá cao hơn, bạn đang cam kết
                mức giá này. Nếu bạn thắng đấu giá, bạn sẽ cần thanh toán số
                tiền này để nhận được bài viết.
              </Alert>

              <Form.Group className="mb-3">
                <Form.Label>Số tiền đặt (ETH)</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                  />
                  <InputGroup.Text>ETH</InputGroup.Text>
                </InputGroup>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBidModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handlePlaceBid}>
            Đặt giá
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Payment Modal */}
      <Modal show={showPayModal} onHide={() => setShowPayModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Thanh toán đấu giá</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentAuction && (
            <>
              <p>
                <strong>Bài viết:</strong> {currentAuction.post.content}
              </p>
              <p>
                <strong>Chủ sở hữu:</strong> {currentAuction.owner.username}
              </p>
              <p>
                <strong>Số tiền cần thanh toán:</strong>{" "}
                {ethers.utils.formatEther(currentAuction.highestBid)} ETH
              </p>

              <Alert variant="warning">
                <strong>Lưu ý:</strong> Khi bạn thanh toán, số tiền sẽ được
                chuyển ngay cho chủ sở hữu bài viết và bài viết sẽ thuộc về bạn.
              </Alert>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPayModal(false)}>
            Hủy
          </Button>
          <Button variant="success" onClick={handlePayForAuction}>
            Thanh toán ngay
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Auctions;
