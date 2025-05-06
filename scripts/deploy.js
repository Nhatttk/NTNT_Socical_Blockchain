const fs = require('fs');
const { ethers } = require('hardhat');
async function main() {
  const [deployer, user1] = await ethers.getSigners();
  
  // We get the contract factories to deploy
  const DecentratwitterFactory = await ethers.getContractFactory("Decentratwitter");
  const CrowdFundingFactory = await ethers.getContractFactory("CrowdFunding");
  
  // Deploy contracts
  const decentratwitter = await DecentratwitterFactory.deploy();
  const crowdFunding = await CrowdFundingFactory.deploy();
  
  // Save contract addresses file in project
  const contractsDir = __dirname + "/../src/contractsData";
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  // Save Decentratwitter contract data
  fs.writeFileSync(
    contractsDir + `/decentratwitter-address.json`,
    JSON.stringify({ address: decentratwitter.address }, undefined, 2)
  );

  const decentratwitterArtifact = artifacts.readArtifactSync("Decentratwitter");

  fs.writeFileSync(
    contractsDir + `/decentratwitter.json`,
    JSON.stringify(decentratwitterArtifact, null, 2)
  );
  
  // Save CrowdFunding contract data
  fs.writeFileSync(
    contractsDir + `/crowdfunding-address.json`,
    JSON.stringify({ address: crowdFunding.address }, undefined, 2)
  );

  const crowdFundingArtifact = artifacts.readArtifactSync("CrowdFunding");

  fs.writeFileSync(
    contractsDir + `/crowdfunding.json`,
    JSON.stringify(crowdFundingArtifact, null, 2)
  );
  
  console.log("Decentratwitter deployed to:", decentratwitter.address);
  console.log("CrowdFunding deployed to:", crowdFunding.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
