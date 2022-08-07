var chai = require('chai');
const BN = require('bn.js');
chai.use(require('chai-bn')(BN));
const expect = chai.expect;
const web3 = require('web3');
const { ethers } = require('hardhat');

describe("Kindly Coin on Mumbai", function () {
  let erc20Token
    , owner
    , account1
    , account2;

  beforeEach(async function () {
    [owner, account1, account2] = await ethers.getSigners();
  });

  before(async function () {
    const ERC20Token = await ethers.getContractFactory("contracts/Kindlycoin-mumbai.sol:Kindly");
    erc20Token = await ERC20Token.deploy("Kindly Coin", "KIND", "0xb5505a6d998549090530911180f38aC5130101c6");
  });

  describe("Deployment", function () {
    it("Should assign the total supply of tokens to the owner", async function () {
      const ownerBalance = await erc20Token.balanceOf(owner.address);
      expect(await erc20Token.totalSupply()).to.equal(ownerBalance);
    });

    it("Should have Kindly Coin as name", async () => {
      expect(await erc20Token.name()).to.be.equal("Kindly Coin");
    });

    it("Should have KIND as symbol", async () => {
      expect(await erc20Token.symbol()).to.be.equal("KIND");
    });
    
    it("Should have 18 decimals", async () => {
      const totalDecimals = new BN(await erc20Token.decimals())
      expect(totalDecimals.toString()).to.be.bignumber.equal("18");
    });

    it("Should have total supply 108,000,000 amount", async () => {
      const totalSupply = await erc20Token.totalSupply();
      expect(totalSupply.toString()).to.be.bignumber.that.is.equal(web3.utils.toWei("108000000"));
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      await erc20Token.transfer(account1.address, 100);
      const addr1Balance = await erc20Token.balanceOf(account1.address);

      expect(addr1Balance).to.equal(100);
    });

    it("Should approve 10,000 amount to spender", async function () {
      const tokenAmount = web3.utils.toWei("10000");
      await erc20Token.approve(account1.address, tokenAmount);

      const allowedBalance = await erc20Token.allowance(owner.address, account1.address);
      expect(allowedBalance).to.equal(tokenAmount);
    });

    it("Should burn 1,000,000 KINDS", async function () {
      await erc20Token.withdraw(web3.utils.toWei("1000000"));

      const totalSupply = await erc20Token.totalSupply();
      expect(totalSupply.toString()).to.be.bignumber.that.is.equal(web3.utils.toWei("107000000"));
    });
  });
});
