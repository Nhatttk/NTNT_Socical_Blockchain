import { useState, useEffect } from 'react'
import { ethers } from "ethers"
import { Row, Form, Button, Card, ListGroup } from 'react-bootstrap'

// Pinata configuration
const projectId = "cfd7e7f302bfd3a4cf16"
const projectSecret = "6ac9eb30800c1640ffb97bb0ab99e0f39c21544668c37eecf2c035ef91b7a8df"

const Home = ({ contract }) => {
    const [posts, setPosts] = useState('')
    const [hasProfile, setHasProfile] = useState(false)
    const [post, setPost] = useState('')
    const [address, setAddress] = useState('')
    const [loading, setLoading] = useState(true)
    const [imagePost, setImagePost] = useState('')

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
                image: metadataPost.image,
                tipAmount: i.tipAmount,
                author
            }
            return post
        }))
        posts = posts.sort((a, b) => {
            const tipA = a.tipAmount.toNumber();
            const tipB = b.tipAmount.toNumber();
            const idA = a.id.toNumber();
            const idB = b.id.toNumber();
          
            if (tipB === tipA) {
              return idB - idA; // id descending order if tips are equal
            }
            return tipB - tipA; // tip descending order
          });       
         // Sort posts from most tipped to least tipped. 
        setPosts(posts)
        setLoading(false)
    }
    useEffect(() => {
        if (!posts) {
            loadPosts()
        }
    })
    const uploadPost = async () => {
        if (!post) return
        let hash
        // Upload post to IPFS
        try {
            const data = JSON.stringify({ post, image: imagePost });
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
            setImagePost('')
            console.log("ipfs hash", result)
        } catch (error) {
            window.alert("ipfs uri upload error: ", error)
        }
        // upload post to blockchain
        await (await contract.uploadPost(hash)).wait()
        loadPosts()
    }
    const tip = async (post) => {
        // tip post owner
        await (await contract.tipPostOwner(post.id, { value: ethers.utils.parseEther("0.1") })).wait()
        loadPosts()
    }
    if (loading) return (
        <div className='text-center'>
            <main style={{ padding: "1rem 0" }}>
                <h2>Loading...</h2>
            </main>
        </div>
    )

    const updateImagePost = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        
        // create unique file name
        const timestamp = new Date().getTime()
        const randomNum = Math.floor(Math.random() * 1000000)
        
        // get file extension
        const fileExt = file.name.split('.').pop()
        
        // create unique file name
        const uniqueFileName = `post_img_${timestamp}_${randomNum}.${fileExt}`
        
        // create unique file
        const uniqueFile = new File([file], uniqueFileName, { type: file.type })
        
        const formData = new FormData()
        formData.append('file', uniqueFile)
        
        // add metadata to pinata
        const metadata = JSON.stringify({
            name: uniqueFileName,
            keyvalues: {
                timestamp: timestamp.toString(),
                source: 'social_blockchain_app'
            }
        })
        formData.append('pinataMetadata', metadata)
        
        // Upload image to IPFS
        try {
            const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
                method: 'POST',
                headers: {
                    'pinata_api_key': projectId,
                    'pinata_secret_api_key': projectSecret,
                },
                body: formData
            });
            const result = await response.json();
            setImagePost(`https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`)
            console.log("ipfs hash", result)
        } catch (error) {
            window.alert("ipfs uri upload error: ", error)
        }
    }
    return (
        <div className="container-fluid mt-5">
            {hasProfile ?
                (<div className="row">
                    <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
                        <div className="content mx-auto">
                            <Row className="g-4">
                                <Form.Control
                                    type="file"
                                    required
                                    name="file"
                                    onChange={updateImagePost}
                                />
                                {imagePost && (
                                    <div className="mt-2 mb-2">
                                        <img src={imagePost} style={{ maxWidth: '100%', maxHeight: '200px' }} alt="Post preview" />
                                    </div>
                                )}
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
                                    {post.image && (
                                        <div className="mt-3">
                                            <img src={post.image} style={{ maxWidth: '100%', maxHeight: '300px' }} alt="Post image" />
                                        </div>
                                    )}
                                </Card.Body>
                                <Card.Footer className="list-group-item">
                                    <div className="d-inline mt-auto float-start">Tip Amount: {ethers.utils.formatEther(post.tipAmount)} ETH</div>
                                    {address === post.author.address || !hasProfile ?
                                        null : <div className="d-inline float-end">
                                            <Button onClick={() => tip(post)} className="px-0 py-0 font-size-16" variant="link" size="md">
                                                Tip for 0.1 ETH
                                            </Button>
                                        </div>}
                                </Card.Footer>
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

        </div >
    );
}

export default Home