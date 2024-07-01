/* eslint-disable @typescript-eslint/no-explicit-any */
import { ethers, providers } from 'ethers';
import { useEffect, useState } from 'react';

const App = () => {
  const [passportInstance, setPassportInstance] = useState<any>();

  useEffect(() => {
    if (!passportInstance) return;

    (async () => {
      const provider = passportInstance.connectEvm();
      const [walletAddress] = await provider.request({
        method: 'eth_requestAccounts',
      });
      console.log('Wallet address:', walletAddress);

      const zkEvmProvider = new providers.Web3Provider(provider);
      const signer = zkEvmProvider.getSigner();
      const message = "Testing personal sign message.";
      let signature: string;
      try {
        signature = await signer.signMessage(message);

        const digest = ethers.utils.hashMessage(message);
        const contract = new ethers.Contract(
          walletAddress,
          ['function isValidSignature(bytes32, bytes) public view returns (bytes4)'],
          zkEvmProvider,
        );
      
        const isValidSignatureHex = await contract.isValidSignature(digest, signature);
        const ERC_1271_MAGIC_VALUE = '0x1626ba7e';

        console.log('isValidSignatureHex', isValidSignatureHex === ERC_1271_MAGIC_VALUE);
      } catch (error: any) {
        console.log(error);
      }
    })()

  }, [passportInstance]);

  useEffect(() => {
    const initialisePassport = async () => {
      if (window.immutable) {
        const config = window.immutable.config;
        const passport = window.immutable.passport;

        const instance = new passport.Passport({
          baseConfig: new config.ImmutableConfiguration({
            environment: config.Environment.SANDBOX,
          }),
          clientId: "CLIENT_ID_HERE",
          scope: "openid offline_access profile email transact",
          audience: "platform_api",
          redirectUri: "http://localhost:3000/login/callback",
          logoutMode: "redirect",
          logoutRedirectUri: "http://localhost:3000",
        });

        setPassportInstance(instance);
        console.log('Passport initialized:', instance);
      } else {
        console.error('Immutable SDK is not loaded.');
      }
    };

    const checkImmutableLoaded = setInterval(() => {
      if (window.immutable) {
        clearInterval(checkImmutableLoaded);
        initialisePassport();
      } else {
        console.log('Loading Immutable SDK');
      }
    }, 100);

    return () => clearInterval(checkImmutableLoaded);
  }, []);

  return (
    <div>
      <h1>Passport & Browser Bundle SDK</h1>
      {passportInstance ? (
        <p>Passport initialised.</p>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default App;
