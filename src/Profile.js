import { useState, useEffect } from 'react'
import { ethers } from "ethers"
import { Row, Form, Button, Card, ListGroup, Col } from 'react-bootstrap'
import { create as ipfsHttpClient } from 'ipfs-http-client'
import axios from 'axios'
// const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')

// Pinata configuration
const projectId = "cfd7e7f302bfd3a4cf16"
const projectSecret = "6ac9eb30800c1640ffb97bb0ab99e0f39c21544668c37eecf2c035ef91b7a8df"

const client = ipfsHttpClient({
    host: 'api.pinata.cloud',
    port: 443,
    protocol: 'https',
    headers: {
        pinata_api_key: projectId,
        pinata_secret_api_key: projectSecret
    }
})



const App = ({ contract }) => {
    const [profile, setProfile] = useState('')
    const [nfts, setNfts] = useState('')
    const [avatar, setAvatar] = useState(null)
    const [username, setUsername] = useState('')
    const [loading, setLoading] = useState(true)
    const [useAIGeneration, setUseAIGeneration] = useState(false)
    const [imagePrompt, setImagePrompt] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [tempImg, setTempImg] = useState(null)
    
    const loadMyNFTs = async () => {
        // Get users nft ids
        const results = await contract.getMyNfts();
        // Fetch metadata of each nft and add that to nft object.
        let nfts = await Promise.all(results.map(async i => {
            // get uri url of nft
            const uri = await contract.tokenURI(i)
            // fetch nft metadata
            const response = await fetch(uri)
            const metadata = await response.json()
            return ({
                id: i,
                username: metadata.username,
                avatar: metadata.avatar
            })
        }))
        setNfts(nfts)
        getProfile(nfts)
    }
    const getProfile = async (nfts) => {
        const address = await contract.signer.getAddress()
        const id = await contract.profiles(address)
        const profile = nfts.find((i) => i.id.toString() === id.toString())
        setProfile(profile)
        setLoading(false)
    }
    const uploadToIPFS = async (event) => {
        event.preventDefault()
        const file = event.target.files[0]
        if (typeof file !== 'undefined') {
            try {
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
                    method: 'POST',
                    headers: {
                        'pinata_api_key': projectId,
                        'pinata_secret_api_key': projectSecret,
                    },
                    body: formData
                });

                const result = await response.json();
                setAvatar(`https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`)
            } catch (error) {
                console.log("ipfs image upload error: ", error)
            }
        }
    }
    
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
            formData.append('file', tempImg);

            const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
                method: 'POST',
                headers: {
                    'pinata_api_key': projectId,
                    'pinata_secret_api_key': projectSecret,
                },
                body: formData
            });

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
            setLoading(true);
            await (await contract.mint(`https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`)).wait();
            loadMyNFTs();
        } catch (error) {
            window.alert("ipfs uri upload error: " + error);
        }
    }
    const switchProfile = async (nft) => {
        setLoading(true)
        await (await contract.setProfile(nft.id)).wait()
        getProfile(nfts)
    }
    useEffect(() => {
        if (!nfts) {
            loadMyNFTs()
        }
    })
    if (loading) return (
        <div className='text-center'>
            <main style={{ padding: "1rem 0" }}>
                <h2>Loading...</h2>
            </main>
        </div>
    )
    return (
        <div className="mt-4 text-center">
            {profile ? (<div className="mb-3"><h3 className="mb-3">{profile.username}</h3>
                <img className="mb-3" style={{ width: '400px' }} src={profile.avatar} /></div>)
                :
                <h4 className="mb-4">No NFT profile, please create one...</h4>}

            <div className="row">
                <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
                    <div className="content mx-auto">
                        <Row className="g-4">
                            <div className="mb-3 d-flex justify-content-center">
                                <Button 
                                    onClick={() => setUseAIGeneration(false)} 
                                    variant={useAIGeneration ? "outline-primary" : "primary"}
                                    className="me-2"
                                >
                                    Upload Image
                                </Button>
                                <Button 
                                    onClick={() => setUseAIGeneration(true)} 
                                    variant={useAIGeneration ? "primary" : "outline-primary"}
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
                                    />
                                    <div className="d-grid px-0">
                                        <Button 
                                            onClick={generateAIImage} 
                                            variant="success" 
                                            size="lg"
                                            disabled={!imagePrompt || isGenerating}
                                        >
                                            {isGenerating ? 'Generating...' : 'Generate Image'}
                                        </Button>
                                    </div>
                                    {avatar && (
                                        <div className="mt-3">
                                            <img src={avatar} alt="Generated" style={{ maxWidth: '100%', maxHeight: '300px' }} />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <Form.Control
                                    type="file"
                                    required
                                    name="file"
                                    onChange={uploadToIPFS}
                                />
                            )}
                            
                            <Form.Control onChange={(e) => setUsername(e.target.value)} size="lg" required type="text" placeholder="Username" />
                            <div className="d-grid px-0">
                                <Button onClick={mintProfile} variant="primary" size="lg">
                                    Mint NFT Profile
                                </Button>
                            </div>
                        </Row>
                    </div>
                </main>
            </div>
            <div className="px-5 container">
                <Row xs={1} md={2} lg={4} className="g-4 py-5">
                    {nfts.map((nft, idx) => {
                        if (nft.id === profile.id) return
                        return (
                            <Col key={idx} className="overflow-hidden">
                                <Card>
                                    <Card.Img variant="top" src={nft.avatar} />
                                    <Card.Body color="secondary">
                                        <Card.Title>{nft.username}</Card.Title>
                                    </Card.Body>
                                    <Card.Footer>
                                        <div className='d-grid'>
                                            <Button onClick={() => switchProfile(nft)} variant="primary" size="lg">
                                                Set as Profile
                                            </Button>
                                        </div>
                                    </Card.Footer>
                                </Card>
                            </Col>
                        )
                    })}
                </Row>
            </div>
        </div>
    );
}

export default App;