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
      1719544901,
      await testerc20.getAddress(),
      ethers.parseEther('1')
    );
  });

  it('markComplete Test', async function () {
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
      await testerc20.getAddress(),
      ethers.parseEther('1')
    );
    await delay(1000);
    await marketplacePayments.markComplete(1);
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
      Math.floor(Date.now()/1000) + 31,
      await testerc20.getAddress(),
      ethers.parseEther('1')
    );
    await delay(3800);
    await marketplacePayments.markCompleteAndreleaseFundsToSeller(1);
  });


  it('releaseFundsToBuyer Test', async function () {
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
      Math.floor(Date.now()/1000) + 31,
      await testerc20.getAddress(),
      ethers.parseEther('1')
    );
    console.log(await marketplacePayments.orderDetails(1))
    await marketplacePayments.releaseFundsToBuyer(1);
    console.log(await marketplacePayments.orderDetails(1))
  });

  it('claimFundsFromBuyer Test', async function () {
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
      Math.floor(Date.now()) + 20000,
      await testerc20.getAddress(),
      ethers.parseEther('1')
    );
    await delay(35000);
    console.log(await marketplacePayments.orderDetails(1));
    await marketplacePayments.claimFundsFromBuyer(1);
  });

  it('incHoldingTime Test', async function () {
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
      Math.floor(Date.now()/1000) + 2000,
      await testerc20.getAddress(),
      ethers.parseEther('1')
    );
    await delay(1000);
    console.log(await marketplacePayments.orderDetails(1));
    await marketplacePayments.incHoldingTime(1, 30000000);
    console.log(await marketplacePayments.orderDetails(1));
  });
});

// Add extra testscripts here