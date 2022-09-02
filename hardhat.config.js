require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-web3");
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();
const config = require("./config.json");

const { MUMBAI_PRIVATE_KEY, POLYGONSCAN_API_KEY, GOERLI_PRIVATE_KEY, ETHERSCAN_API_KEY } = process.env;

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const getApiKey = (network = 'goerli') => {
  switch (network) {
    case "mainnet" || "rinkeby" || "goerli" || "ropsten":
      return ETHERSCAN_API_KEY;
    case "polygon" || "mumbai":
      return POLYGONSCAN_API_KEY;
    default:
      return "";
  }
};

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    hardhat: {
      chainId: 1337,
    },
    ropsten: {
      url: process.env.ROPSTEN_URL || "",
      accounts:
        process.env.MUMBAI_PRIVATE_KEY !== undefined ? [process.env.MUMBAI_PRIVATE_KEY] : [],
    },
    matic: {
      url: config.MATIC_URL,
      accounts: [process.env.MATIC_PRIVATE_KEY]
    },
    mumbai: {
      url: config.MATIC_RPC,
      accounts: [`0x${MUMBAI_PRIVATE_KEY}`],
    },
    goerli: {
      url: config.ETHEREUM_RPC,
      accounts: [`0x${GOERLI_PRIVATE_KEY}`]
    }
  },
  etherscan: {
    apiKey: POLYGONSCAN_API_KEY
  },
  solidity: {
    compilers: [
      {
        version: "0.8.2",
        settings: {
          optimizer: {
            enabled: true,
            runs: 2000,
          },
        }
      },
      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 2000,
          },
        }
      },
      {
        version: "0.6.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 2000,
          },
        }
      },
      {
        version: "0.6.2",
        settings: {
          optimizer: {
            enabled: true,
            runs: 2000,
          },
        }
      },
      {
        version: "0.6.0",
        settings: {
          optimizer: {
            enabled: true,
            runs: 2000,
          },
        }
      },
      {
        version: "0.5.16",
        settings: {
          optimizer: {
            enabled: true,
            runs: 2000,
          },
        }
      }
    ]
  },
  mocha: {
    timeout: 100000000
  }
};
