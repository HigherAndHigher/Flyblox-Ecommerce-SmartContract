import {
  time,
  loadFixture,
} from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs';
import { expect } from 'chai';
import hre, { ethers } from 'hardhat';

describe('MarketplacePayments', function () {
  let owner: any;
  let otherAccount: any;
  let marketplacePayments: any;
  let testerc20: any;
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  beforeEach('Deploy', async function deployOneYearLockFixture() {
    // Contracts are deployed using the first signer/account by default
    [owner, otherAccount] = await hre.ethers.getSigners();

    const MarketplacePayments = await hre.ethers.getContractFactory(
      'MarketplacePayments'
    );
    const TestERC20 = await hre.ethers.getContractFactory('TestERC20');
    marketplacePayments = await MarketplacePayments.deploy();
    testerc20 = await TestERC20.deploy('TestERC20', 'TEST', 18, 100000000);
  });

  it('Deploy Test', async function () {
    console.log(
      'MarketplacePayments deployed to:',
      await marketplacePayments.getAddress()
    );
    console.log('TestERC20 deployed to:', await testerc20.getAddress());
  });

  it('isTokenAllowed Test', async function () {
    const token1Allowed = await marketplacePayments.isTokenAllowed(
      '0x0000000000000000000000000000000000000000'
    );
    expect(token1Allowed).to.be.false;
  });

  it('updateTokensList Test', async function () {
    await marketplacePayments.updateTokensList(
      await testerc20.getAddress(),
      true
    );
    const tokenAllowed = await marketplacePayments.isTokenAllowed(
      await testerc20.getAddress()
    );
    expect(tokenAllowed).to.be.true;
  });

  it('createAndDeposit Test', async function () {
    await testerc20.mint(ethers.parseEther('10'));

    await testerc20.approve(
      await marketplacePayments.getAddress(),
      ethers.parseEther('1')
    );

    await marketplacePayments.updateTokensList(
      await testerc20.getAddress(),
      true
    );
    await marketplacePayments.createAndDeposit(
      '0x48C281DB38eAD8050bBd821d195FaE85A235d8fc',
      1715544901,
      5000,
      await testerc20.getAddress(),
      ethers.parseEther('1')
    );
  });

  it('markCompleteAndreleaseFundsToSeller Test', async function () {
    function delay(ms: number): Promise<void> {
      return new Promise<void>((resolve) => setTimeout(resolve, ms));
    }
    await testerc20.mint(ethers.parseEther('10'));

    await testerc20.approve(
      await marketplacePayments.getAddress(),
      ethers.parseEther('1')
    );

    await marketplacePayments.updateTokensList(
      await testerc20.getAddress(),
      true
    );
    await marketplacePayments.createAndDeposit(
      '0x48C281DB38eAD8050bBd821d195FaE85A235d8fc',
      Math.floor(Date.now() / 1000) + 50000,
      5000,
      await testerc20.getAddress(),
      ethers.parseEther('1')
    );
    await delay(1000);
    await marketplacePayments.markCompleteAndReleaseFundsToSeller(1);
  });

    it('claimFundsFromContract Test', async function () {
      function delay(ms: number): Promise<void> {
        return new Promise<void>((resolve) => setTimeout(resolve, ms));
      }
      await testerc20.mint(ethers.parseEther('10'));

      await testerc20.approve(
        await marketplacePayments.getAddress(),
        ethers.parseEther('1')
      );
  
      await marketplacePayments.updateTokensList(
        await testerc20.getAddress(),
        true
      );
      await marketplacePayments.createAndDeposit(
        '0x48C281DB38eAD8050bBd821d195FaE85A235d8fc',
        Math.floor(Date.now()/1000) + 30,
        1,
        await testerc20.getAddress(),
        ethers.parseEther('1')
      );
      // await marketplacePayments.disputeOrder(1)
      await delay(1000);
      await marketplacePayments.claimFundsFromContract(1);
  });

  it('refund Test', async function () {
    function delay(ms: number): Promise<void> {
      return new Promise<void>((resolve) => setTimeout(resolve, ms));
    }
    await testerc20.mint(ethers.parseEther('10'));
    await testerc20.approve(
      await marketplacePayments.getAddress(),
      ethers.parseEther('1')
    );

    await marketplacePayments.updateTokensList(
      await testerc20.getAddress(),
      true
    );
    await marketplacePayments.createAndDeposit(
      '0x48C281DB38eAD8050bBd821d195FaE85A235d8fc',
      Math.floor(Date.now()/1000) + 5000,
      5000,
      await testerc20.getAddress(),
      ethers.parseEther('1')
    );
    await delay(1000);
    await marketplacePayments.acceptRefund(1);
    await delay(1000);
    await marketplacePayments.refund(1);
  });

  it('sellerAcceptIncHoldingTime Test', async function () {
    function delay(ms: number): Promise<void> {
      return new Promise<void>((resolve) => setTimeout(resolve, ms));
    }
    await testerc20.mint(ethers.parseEther('10'));

    await testerc20.approve(
      await marketplacePayments.getAddress(),
      ethers.parseEther('1')
    );

    await marketplacePayments.updateTokensList(
      await testerc20.getAddress(),
      true
    );
    await marketplacePayments.createAndDeposit(
      '0x48C281DB38eAD8050bBd821d195FaE85A235d8fc',
      Math.floor(Date.now()/1000) + 5000,
      5000,
      await testerc20.getAddress(),
      ethers.parseEther('1')
    );
    await delay(1000);
    // await marketplacePayments.disputeOrder(1)
    await marketplacePayments.sellerAcceptIncHoldingTime(1);
});

  it('buyerIncHoldingTime Test', async function () {
    function delay(ms: number): Promise<void> {
      return new Promise<void>((resolve) => setTimeout(resolve, ms));
    }
    await testerc20.mint(ethers.parseEther('10'));

    await testerc20.approve(
      await marketplacePayments.getAddress(),
      ethers.parseEther('1')
    );

    await marketplacePayments.updateTokensList(
      await testerc20.getAddress(),
      true
    );
    await marketplacePayments.createAndDeposit(
      '0x48C281DB38eAD8050bBd821d195FaE85A235d8fc',
      Math.floor(Date.now()/1000) + 5000,
      5000,
      await testerc20.getAddress(),
      ethers.parseEther('1')
    );
    await delay(1000);
    // await marketplacePayments.disputeOrder(1)
    await marketplacePayments.sellerAcceptIncHoldingTime(1);
    await delay(1000);
    await marketplacePayments.buyerIncHoldingTime(1, 8000);
});

  // it('releaseFundsToBuyer function Test', async function () {
  //   await testerc20.mint(ethers.parseEther('10'));

  //   await testerc20.approve(
  //     await marketplacePayments.getAddress(),
  //     ethers.parseEther('1')
  //   );

  //   await marketplacePayments.updateTokensList(
  //     await testerc20.getAddress(),
  //     true
  //   );
  //   await marketplacePayments.createAndDeposit(
  //     '0x48C281DB38eAD8050bBd821d195FaE85A235d8fc',
  //     Math.floor(Date.now() / 1000) + 5000,
  //     await testerc20.getAddress(),
  //     ethers.parseEther('1')
  //   );
  //   setTimeout(async () => {
  //     await marketplacePayments.releaseFundsToBuyer(1);
  //   }, 10000);
  // });
  // describe("Deployment", function () {
  //   it("Should set the right unlockTime", async function () {
  //     const { lock, unlockTime } = await loadFixture(deployOneYearLockFixture);

  //     expect(await lock.unlockTime()).to.equal(unlockTime);
  //   });

  //   it("Should set the right owner", async function () {
  //     const { lock, owner } = await loadFixture(deployOneYearLockFixture);

  //     expect(await lock.owner()).to.equal(owner.address);
  //   });

  //   it("Should receive and store the funds to lock", async function () {
  //     const { lock, lockedAmount } = await loadFixture(
  //       deployOneYearLockFixture
  //     );

  //     expect(await hre.ethers.provider.getBalance(lock.target)).to.equal(
  //       lockedAmount
  //     );
  //   });

  //   it("Should fail if the unlockTime is not in the future", async function () {
  //     // We don't use the fixture here because we want a different deployment
  //     const latestTime = await time.latest();
  //     const Lock = await hre.ethers.getContractFactory("Lock");
  //     await expect(Lock.deploy(latestTime, { value: 1 })).to.be.revertedWith(
  //       "Unlock time should be in the future"
  //     );
  //   });
  // });

  // describe("Withdrawals", function () {
  //   describe("Validations", function () {
  //     it("Should revert with the right error if called too soon", async function () {
  //       const { lock } = await loadFixture(deployOneYearLockFixture);

  //       await expect(lock.withdraw()).to.be.revertedWith(
  //         "You can't withdraw yet"
  //       );
  //     });

  //     it("Should revert with the right error if called from another account", async function () {
  //       const { lock, unlockTime, otherAccount } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       // We can increase the time in Hardhat Network
  //       await time.increaseTo(unlockTime);

  //       // We use lock.connect() to send a transaction from another account
  //       await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith(
  //         "You aren't the owner"
  //       );
  //     });

  //     it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
  //       const { lock, unlockTime } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       // Transactions are sent using the first signer by default
  //       await time.increaseTo(unlockTime);

  //       await expect(lock.withdraw()).not.to.be.reverted;
  //     });
  //   });

  //   describe("Events", function () {
  //     it("Should emit an event on withdrawals", async function () {
  //       const { lock, unlockTime, lockedAmount } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       await time.increaseTo(unlockTime);

  //       await expect(lock.withdraw())
  //         .to.emit(lock, "Withdrawal")
  //         .withArgs(lockedAmount, anyValue); // We accept any value as `when` arg
  //     });
  //   });

  //   describe("Transfers", function () {
  //     it("Should transfer the funds to the owner", async function () {
  //       const { lock, unlockTime, lockedAmount, owner } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       await time.increaseTo(unlockTime);

  //       await expect(lock.withdraw()).to.changeEtherBalances(
  //         [owner, lock],
  //         [lockedAmount, -lockedAmount]
  //       );
  //     });
  //   });
  // });
});
