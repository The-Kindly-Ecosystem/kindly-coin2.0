const chai = require("chai");
const BN = require("bn.js");
chai.use(require("chai-bn")(BN));
const expect = chai.expect;

const Web3 = require("web3");
const { use, setProofApi, POSClient } = require("@maticnetwork/maticjs");
const { Web3ClientPlugin } = require("@maticnetwork/maticjs-web3");
const HDWalletProvider = require("@truffle/hdwallet-provider");
const config = require("../config.json");

// install web3 plugin
use(Web3ClientPlugin);
setProofApi(config.proofApi)

const {
  MUMBAI_PRIVATE_KEY,
} = process.env;

const userAddress = "0xe9A23c32c15F1d4095a3494fF4EF4501b922Ec8f";
const tokenAmount = Web3.utils.toWei('100', "ether");

describe("Goerli-Mumbai ERC20 Bridge", function () {
  let posClient
    , erc20Token
    , erc20RootToken;

  const getPOSClient = (network = "testnet", version = "mumbai") => {
    const posClient = new POSClient();
    return posClient.init({
      log: false,
      network: network,
      version: version,
      parent: {
        provider: new HDWalletProvider(MUMBAI_PRIVATE_KEY, config.ETHEREUM_RPC),
        defaultConfig: {
          from: userAddress,
        },
      },
      child: {
        provider: new HDWalletProvider(MUMBAI_PRIVATE_KEY, config.MATIC_RPC),
        defaultConfig: {
          from: userAddress,
        },
      },
    });
  };

  beforeEach(async function () {
    posClient = await getPOSClient();
    erc20Token = posClient.erc20(config.posChildERC20);
    erc20RootToken = posClient.erc20(config.posRootERC20, true);
  });

  describe("Common", function () {
    it("Deployer's KIND balance should be greater than 0 on Mumbai testnet", async function () {
      const walletBalance = await erc20Token.getBalance(userAddress);
      expect(walletBalance).to.be.a.bignumber.that.is.greaterThan(new BN('0'));
    });
  });

  describe("Deposit [Goerli -> Mumbai]", function () {
    it("Should approve token 100 amount", async function () {
      // Approve
      const result = await erc20RootToken.approve(tokenApproveAmount);
      const txHash = await result.getTransactionHash();
      console.log(txHash)
      const receipt = await result.getReceipt();

      // Get allowance
      const allowedBalance = await erc20RootToken.getAllowance(userAddress);

      expect(allowedBalance).to.be.a.bignumber.that.is.equal(tokenApproveAmount);
    });

    it("Depositing 100 KINDs from Goerli to Mumbai should work", async function () {
      const result = await erc20RootToken.deposit(tokenApproveAmount, userAddress);
      const txHash = await result.getTransactionHash();
      console.log("txHash", txHash);
      const receipt = await result.getReceipt();

      /*
        Should wait for a long-time to see Mumbai deposit(transfer transaction from 0x000...000),
        So just expect if deposit transaction is submitted correctly 
      */

      expect(receipt.status).to.equal(true);
    });
  });

  describe("Withdraw [Mumbai -> Goerli]", function () {
    let burnTxHash;

    /**
     * txHash - transaction hash on Polygon
     * rootChainAddress - root chain proxy address on Ethereum
     */
    async function checkInclusion(txHash, rootChainAddress) {
      const web3 = new Web3(Web3.providers.HttpProvider(config.MATIC_RPC));
      let txDetails = await web3.eth.getTransactionReceipt(txHash);
      let block = txDetails.blockNumber;

      console.log("txDetails", txDetails);

      return new Promise(async (resolve, reject) => {
        web3.eth.subscribe(
          "logs",
          {
            address: rootChainAddress,
          },
          async (error, result) => {
            if (error) {
              reject(error);
            }

            console.log(result);
            if (result.data) {
              let transaction = web3.eth.abi.decodeParameters(
                ["uint256", "uint256", "bytes32"],
                result.data
              );
              if (block <= transaction["1"]) {
                resolve(result);
              }
            }
          }
        );
      });
    }

    it("Should burn withdraw amount on Mumbai", async function () {
      const result = await erc20Token.withdrawStart(tokenAmount);
      burnTxHash = await result.getTransactionHash();
      console.log("burnTxHash", burnTxHash);
      const receipt = await result.getReceipt();

      expect(receipt.status).to.equal(true);
    });

    it("Should wait while evidencing checkpoint", async function () {
      const checkResult = await checkInclusion(burnTxHash, config.rootChainProxy);
      const isCheckPointed = await posClient.isCheckPointed(burnTxHash);

      expect(isCheckPointed).to.equal(true);
    });

    it("Should mint the withdrawed amount on Goerli", async function () {
      const result = await erc20RootToken.withdrawExit(burnTxHash);
      const txHash = await result.getTransactionHash();
      console.log("txHash", txHash);
      const receipt = await result.getReceipt();

      expect(receipt.status).to.equal(true);
    });
  });
});
