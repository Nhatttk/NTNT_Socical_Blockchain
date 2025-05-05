import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Row, Form, Button, Card, ListGroup, Col } from "react-bootstrap";
import { create as ipfsHttpClient } from "ipfs-http-client";
import axios from "axios";
// const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')

// Pinata configuration
const projectId = "cfd7e7f302bfd3a4cf16";
const projectSecret =
  "6ac9eb30800c1640ffb97bb0ab99e0f39c21544668c37eecf2c035ef91b7a8df";

const client = ipfsHttpClient({
  host: "api.pinata.cloud",
  port: 443,
  protocol: "https",
  headers: {
    pinata_api_key: projectId,
    pinata_secret_api_key: projectSecret,
  },
});

const App = ({ contract }) => {
  const [profile, setProfile] = useState("");
  const [nfts, setNfts] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [useAIGeneration, setUseAIGeneration] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [tempImg, setTempImg] = useState(null);
  const [activeTab, setActiveTab] = useState("Activity");
  const [isEditing, setIsEditing] = useState(false);

  const loadMyNFTs = async () => {
    // Get users nft ids
    const results = await contract.getMyNfts();
    // Fetch metadata of each nft and add that to nft object.
    let nfts = await Promise.all(
      results.map(async (i) => {
        // get uri url of nft
        const uri = await contract.tokenURI(i);
        // fetch nft metadata
        const response = await fetch(uri);
        const metadata = await response.json();
        return {
          id: i,
          username: metadata.username,
          avatar: metadata.avatar,
        };
      })
    );
    setNfts(nfts);
    getProfile(nfts);
  };
  const getProfile = async (nfts) => {
    const address = await contract.signer.getAddress();
    const id = await contract.profiles(address);
    const profile = nfts.find((i) => i.id.toString() === id.toString());
    setProfile(profile);
    setLoading(false);
  };
  const uploadToIPFS = async (event) => {
    event.preventDefault();
    const file = event.target.files[0];
    if (typeof file !== "undefined") {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(
          "https://api.pinata.cloud/pinning/pinFileToIPFS",
          {
            method: "POST",
            headers: {
              pinata_api_key: projectId,
              pinata_secret_api_key: projectSecret,
            },
            body: formData,
          }
        );

        const result = await response.json();
        setAvatar(`https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`);
      } catch (error) {
        console.log("ipfs image upload error: ", error);
      }
    }
  };

  const generateAIImage = async () => {
    if (!imagePrompt) return;

    setIsGenerating(true);
    try {
      const response = await axios.get(
        `https://honoimagegenerator.yashj8858.workers.dev/`,
        {
          params: { prompt: imagePrompt },
          responseType: "blob",
        }
      );

      const imageBlob = response.data;
      const newImageUrl = URL.createObjectURL(imageBlob);
      setAvatar(newImageUrl);
      setTempImg(imageBlob); // Set the generated image as the tempImg for minting
    } catch (error) {
      console.error("Error generating image:", error);
      window.alert("Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  };

  const uploadGeneratedImageToIPFS = async () => {
    if (!tempImg) return null;

    try {
      const formData = new FormData();
      formData.append("file", tempImg);

      const response = await fetch(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        {
          method: "POST",
          headers: {
            pinata_api_key: projectId,
            pinata_secret_api_key: projectSecret,
          },
          body: formData,
        }
      );

      const result = await response.json();
      return `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
    } catch (error) {
      console.log("Error uploading generated image to IPFS: ", error);
      return null;
    }
  };

  const mintProfile = async (event) => {
    if (!username) return;

    let finalAvatar = avatar;

    // If we used AI generation, we need to upload the generated image to IPFS first
    if (useAIGeneration && tempImg) {
      const ipfsUrl = await uploadGeneratedImageToIPFS();
      if (!ipfsUrl) {
        window.alert("Failed to upload generated image to IPFS");
        return;
      }
      finalAvatar = ipfsUrl;
    } else if (!avatar) {
      window.alert("Please upload or generate an image");
      return;
    }

    try {
      const data = JSON.stringify({ avatar: finalAvatar, username });
      const response = await fetch(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            pinata_api_key: projectId,
            pinata_secret_api_key: projectSecret,
          },
          body: data,
        }
      );

      const result = await response.json();
      setLoading(true);
      await (
        await contract.mint(
          `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`
        )
      ).wait();
      loadMyNFTs();
    } catch (error) {
      window.alert("ipfs uri upload error: " + error);
    }
  };
  const switchProfile = async (nft) => {
    setLoading(true);
    await (await contract.setProfile(nft.id)).wait();
    getProfile(nfts);
  };
  useEffect(() => {
    if (!nfts) {
      loadMyNFTs();
    }
  });

  const ActivityTab = () => (
    <div className="bg-[#1a1a1a] rounded-lg">
      <h3 className="text-white text-xl mb-4">Recent Activity</h3>
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-[#2a2a2a] rounded-lg">
          <div className="w-2 h-2 rounded-full bg-[#FFFD02]"></div>
          <p className="text-white">You minted a new NFT</p>
          <span className="text-gray-400 text-sm ml-auto">2h ago</span>
        </div>
        <div className="flex items-center gap-3 p-3 bg-[#2a2a2a] rounded-lg">
          <div className="w-2 h-2 rounded-full bg-[#FFFD02]"></div>
          <p className="text-white">You updated your profile</p>
          <span className="text-gray-400 text-sm ml-auto">1d ago</span>
        </div>
      </div>
    </div>
  );

  const NotificationTab = () => (
    <div className="bg-[#1a1a1a] rounded-lg">
      <h3 className="text-white text-xl mb-4">Notifications</h3>
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-[#2a2a2a] rounded-lg">
          <div className="w-2 h-2 rounded-full bg-[#FFFD02]"></div>
          <p className="text-white">New message from @user123</p>
          <span className="text-gray-400 text-sm ml-auto">5m ago</span>
        </div>
        <div className="flex items-center gap-3 p-3 bg-[#2a2a2a] rounded-lg">
          <div className="w-2 h-2 rounded-full bg-[#FFFD02]"></div>
          <p className="text-white">Your NFT was liked by @user456</p>
          <span className="text-gray-400 text-sm ml-auto">1h ago</span>
        </div>
      </div>
    </div>
  );

  const DisplayTab = () => (
    <div className="bg-[#1a1a1a] rounded-lg">
      <h3 className="text-white text-xl mb-4">Display Settings</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-[#2a2a2a] rounded-lg">
          <p className="text-white">Dark Mode</p>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FFFD02]"></div>
          </label>
        </div>
        <div className="flex items-center justify-between p-3 bg-[#2a2a2a] rounded-lg">
          <p className="text-white">Notifications</p>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FFFD02]"></div>
          </label>
        </div>
      </div>
    </div>
  );

  const AppsTab = () => (
    <div className="bg-[#1a1a1a] rounded-lg">
      <h3 className="text-white text-xl mb-4">Connected Apps</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-[#2a2a2a] rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#FFFD02] rounded-full"></div>
            <p className="text-white">MetaMask</p>
          </div>
          <span className="text-[#FFFD02]">Connected</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-[#2a2a2a] rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-600 rounded-full"></div>
            <p className="text-white">OpenSea</p>
          </div>
          <span className="text-gray-400">Not Connected</span>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "Activity":
        return <ActivityTab />;
      case "Notification":
        return <NotificationTab />;
      case "Display":
        return <DisplayTab />;
      case "Apps":
        return <AppsTab />;
      default:
        return null;
    }
  };

  if (loading)
    return (
      <div className="text-center">
        <main style={{ padding: "1rem 0" }}>
          <h2>Loading...</h2>
        </main>
      </div>
    );
  return (
    <div className="x-container">
      <div className="flex justify-center py-4 px-8 ">
        <div className="flex-[0.5] flex flex-col items-center">
          {profile && !isEditing && (
            <div className="flex flex-col justify-center items-center gap-3">
              <img
                className="rounded-full"
                style={{ width: "400px" }}
                src={profile.avatar}
              />
              <h3 className="text-white">{profile.username}</h3>

              <div className="text-gray-500 w-[300px]">
                <p className="uppercase text-center">Blockchain Developer</p>
                <p className="text-left">
                  We're a small team of idiots who aimed bring you the best ui
                  materials on the web
                </p>
              </div>

              <button
                onClick={() => setIsEditing(true)}
                className="flex bg-[#FFFD02] rounded-xl justify-center items-center gap-3 h-[60px] w-[237px] text-2xl font-semibold transition-all duration-300 hover:bg-[#FFFD02]/80 hover:scale-105 active:scale-95"
              >
                <img src="/icons/profile/edit-profile.svg" />
                Edit Profile
              </button>
            </div>
          )}

          {!profile && !isEditing && (
            <h4 className="mb-4 text-white">
              No NFT profile, please create one...
            </h4>
          )}

          {(isEditing || !profile) && (
            <div className="row">
              <main
                role="main"
                className="col-lg-10 mx-auto bg-[#2a2a2a] p-6 rounded-lg"
                style={{ maxWidth: "1000px" }}
              >
                {profile && (
                  <div className="flex justify-between items-center mb-4 px-2.5">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex items-center gap-2 text-white hover:text-[#FFFD02] transition-colors hover:scale-95"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Back to Profile
                    </button>
                    <h3 className="text-white text-xl">Edit Profile</h3>
                  </div>
                )}

                <div className="p-4">
                  <Row className="g-4">
                    <div className="mb-3 d-flex justify-content-center">
                      <Button
                        onClick={() => setUseAIGeneration(false)}
                        variant={
                          useAIGeneration ? "outline-primary" : "primary"
                        }
                        className={`me-2 ${
                          useAIGeneration
                            ? "bg-transparent text-[#FFFD02] border-[#FFFD02] hover:bg-[#FFFD02] hover:text-black"
                            : "bg-[#FFFD02] text-black border-[#FFFD02] hover:bg-[#FFFD02]/80"
                        }`}
                      >
                        Upload Image
                      </Button>
                      <Button
                        onClick={() => setUseAIGeneration(true)}
                        variant={
                          useAIGeneration ? "primary" : "outline-primary"
                        }
                        className={`${
                          useAIGeneration
                            ? "bg-[#FFFD02] text-black border-[#FFFD02] hover:bg-[#FFFD02]/80"
                            : "bg-transparent text-[#FFFD02] border-[#FFFD02] hover:bg-[#FFFD02] hover:text-black"
                        }`}
                      >
                        Generate AI Image
                      </Button>
                    </div>

                    {useAIGeneration ? (
                      <>
                        <Form.Control
                          onChange={(e) => setImagePrompt(e.target.value)}
                          size="lg"
                          required
                          type="text"
                          placeholder="Describe your image..."
                          value={imagePrompt}
                          disabled={isGenerating}
                          className="bg-[#1a1a1a] text-black border-[#2a2a2a] focus:border-[#FFFD02] focus:ring-[#FFFD02]"
                        />
                        <div className="d-grid px-0">
                          <Button
                            onClick={generateAIImage}
                            variant="success"
                            size="lg"
                            disabled={!imagePrompt || isGenerating}
                            className="bg-[#FFFD02] text-white border-[#FFFD02] hover:bg-[#FFFD02]/80"
                          >
                            {isGenerating ? "Generating..." : "Generate Image"}
                          </Button>
                        </div>
                        {avatar && (
                          <div className="mt-3 relative">
                            <img
                              src={avatar}
                              alt="Generated"
                              className="w-full h-auto max-h-[300px] object-contain rounded-lg"
                            />
                            <button
                              onClick={() => {
                                setAvatar(null);
                                setTempImg(null);
                              }}
                              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <Form.Control
                          type="file"
                          required
                          name="file"
                          onChange={(e) => {
                            uploadToIPFS(e);
                            // Preview image
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setAvatar(reader.result);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="bg-[#1a1a1a] text-white border-[#2a2a2a] focus:border-[#FFFD02] focus:ring-[#FFFD02]"
                        />
                        {avatar && (
                          <div className="mt-3 relative">
                            <img
                              src={avatar}
                              alt="Preview"
                              className="w-full h-auto max-h-[300px] object-contain rounded-lg"
                            />
                            <button
                              onClick={() => {
                                setAvatar(null);
                                setTempImg(null);
                              }}
                              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          </div>
                        )}
                      </>
                    )}

                    <Form.Control
                      onChange={(e) => setUsername(e.target.value)}
                      size="lg"
                      required
                      type="text"
                      placeholder="Username"
                      className="bg-[#1a1a1a] text-white border-[#2a2a2a] focus:border-[#FFFD02] focus:ring-[#FFFD02]"
                    />
                    <div className="d-grid px-0">
                      <Button
                        onClick={mintProfile}
                        variant="primary"
                        size="lg"
                        className="bg-[#FFFD02] text-white border-[#FFFD02] hover:bg-[#FFFD02]/80"
                      >
                        Mint NFT Profile
                      </Button>
                    </div>
                  </Row>
                </div>
              </main>
            </div>
          )}
          {(isEditing || !profile) && (
            <div className="list-profiles px-5 container">
              <Row xs={1} md={2} lg={3} className="py-5">
                {nfts.map((nft, idx) => {
                  if (nft.id === profile?.id) return;
                  return (
                    <Col key={idx} className="overflow-hidden">
                      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                        <Card.Img variant="top" src={nft.avatar} />
                        <Card.Body>
                          <Card.Title className="text-black text-center">
                            {nft.username}
                          </Card.Title>
                        </Card.Body>
                        <Card.Footer className="bg-[#2a2a2a] border-t-[#2a2a2a]">
                          <div className="d-grid">
                            <button
                              onClick={() => switchProfile(nft)}
                              variant="primary"
                              size="lg"
                              className="bg-[#FFB200] py-2 rounded-md shadow-md text-black font-medium border-[#000] hover:bg-[#FFB200]/60"
                            >
                              Set as Profile
                            </button>
                          </div>
                        </Card.Footer>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </div>
          )}
        </div>
        <div className="tabs flex-[0.7]">
          <div className="">
            <div className="flex space-x-1 mb-4">
              {["Activity", "Notification", "Display", "Apps"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab
                      ? "bg-[#FFFD02] text-black"
                      : "bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
