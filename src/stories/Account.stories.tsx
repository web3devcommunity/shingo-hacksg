
import type { Meta, StoryObj } from '@storybook/react';
import { createWalletModalProviderConfig } from '@/components/wallet-config';

import {
    ModalProvider as ParticleNetworkModalProvider, useParticleProvider
} from '@particle-network/connect-react-ui';
import { Account } from '../components/Account';
import { ConnectButton, connectorsForWallets, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import {
    argentWallet,
    coinbaseWallet,
    imTokenWallet,
    injectedWallet,
    ledgerWallet,
    metaMaskWallet,
    omniWallet,
    rainbowWallet,
    trustWallet,
    walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';

import { configureChains, createClient, WagmiConfig, useAccount, useConnect, useSigner } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import '../rainbowkit.css';
import { particleWallet } from '@particle-network/rainbowkit-ext';
import { useEffect, useMemo } from 'react';
import { ParticleNetwork } from '@particle-network/auth';

import { LensProvider, useActiveProfile, useActiveWallet, useCreateProfile, useWalletLogin } from '@lens-protocol/react-web';
import { getWagmiClient } from '@/libs/wagmi';
import { ReactNode } from 'react';
import { PN_PROJECT_ID, PN_CLIENT_KEY, PN_APP_ID } from "@/env";
import { useParticleNetworkWagmi } from '@/components/hooks/pn-wagmi';
import { AccountProvider } from '@/components/AccountProvider';
import { saveAccount } from '@/app/api.service';
import { useWalletLogout } from '@lens-protocol/react-web';
import { loadClient } from '@/libs/lens/client';
import { generateHandle } from '@/libs/lens/utils';
import { LensClient } from '@lens-protocol/client';
import React from 'react';

const WagmiStateWrapper = ({ children }) => {
    const { address } = useAccount();
    // const { isLoading, isSuccess } = useConnect();

    return (
        <div>
            <div>
                PN_PROJECT_ID: ${PN_PROJECT_ID} <br />
                PN_APP_ID: ${PN_APP_ID} <br />
                wagmi address: {address}
            </div>
            {children}
        </div>
    )
}

const SignUpWithActiveProfile = () => {

    const { address, isConnected } = useAccount();

    const { execute: create } = useCreateProfile();
    const { data: signer, isError, isLoading } = useSigner();
    const activeProfileResults = useActiveProfile();
    const { execute: login, error, isPending } = useWalletLogin();
    const { execute: logout } = useWalletLogout();
    const profile = activeProfileResults?.data!;
    return (
        <div>
            Lens {profile?.id} {profile?.handle} <br />
            <button onClick={() => {
                // after login, use sdk to load client will not be able the track the authenticated lens client
                if (address) {
                    login(signer!).then(
                        async (loginResult) => {


                            // check if exists

                            console.log('loaded', profile)
                            if (profile?.handle) {
                                console.log('user profile already exists', address, profile?.id, profile?.handle);
                                return;
                            }
                            console.log('user profile not found', address, profile)
                            const handle = generateHandle();
                            const createResults = await create({ handle });
                            // createdResults do not return profile id and profile is not refreshed either
                            // should query explicitly
                            // await saveAccount({
                            //     walletAddress: address,
                            //     lensProfileId: profile.id,
                            //     lensHandle: profile.handle
                            // });

                            console.log('generated account with handle', handle, createResults)

                        }
                    );


                }



            }}>Force Sign up</button>
        </div >
    )
}

const SignUpWidget = () => {

    const { address, isConnected } = useAccount();
    const { data: signer, isError, isLoading } = useSigner()

    const { execute: login, error, isPending } = useWalletLogin();
    const { execute: logout } = useWalletLogout();

    const { data: activeWallet } = useActiveWallet();

    const [isReady, setIsReady] = React.useState(false);

    useEffect(() => {
        console.log('isConnected', isConnected, address, activeWallet?.address)
        if (isConnected) {
            if (address !== activeWallet?.address) {
                // now always refresh profile
                // TODO we cant tell from the lens.development.activeProfiles alone
                // should check against lens.development.wallets in localstorage
                // find profile from cache and reset if not matching, (via e.g. restart) if there is error  "Pofile not owned by the active wallet"
                // happens when re-connecting wallet with different address
                logout().then(() => {

                    setIsReady(true);
                });
            } else {

                setIsReady(true);
            }


        }

    }, [address, activeWallet?.address, isConnected]);

    if (!isReady) {
        return <div></div>
    }

    // seems lens load from cache even wallet not collected / using another wallet
    return <SignUpWithActiveProfile />

}



// TODO extract config type
const modalConfig: any = createWalletModalProviderConfig()



// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction
const meta: Meta<typeof Account> = {
    title: 'Example/Account',
    component: Account,
    tags: ['autodocs'],
    argTypes: {
        backgroundColor: {
            control: 'color',
        },
    },
    decorators: [
        (Story) => (

            <AccountProvider>
                <div>
                    <WagmiStateWrapper>
                        <div style={{ minHeight: '200px' }} >
                            <Story />
                        </div>
                    </WagmiStateWrapper>
                    <SignUpWidget />
                </div>
            </AccountProvider>
        ),
    ]
};

export default meta;
type Story = StoryObj<typeof Account>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args
export const Primary: Story = {
    args: {
        primary: true,
        label: 'Account',
    },
};
