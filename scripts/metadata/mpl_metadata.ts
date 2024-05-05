import {
  Collection,
  CreateMetadataAccountV3InstructionAccounts,
  CreateMetadataAccountV3InstructionDataArgs,
  Creator,
  MPL_TOKEN_METADATA_PROGRAM_ID,
  UpdateMetadataAccountV2InstructionAccounts,
  UpdateMetadataAccountV2InstructionData,
  Uses,
  createMetadataAccountV3,
  updateMetadataAccountV2,
  findMetadataPda,
} from '@metaplex-foundation/mpl-token-metadata';
import * as web3 from '@solana/web3.js';
import {
  PublicKey,
  createSignerFromKeypair,
  none,
  signerIdentity,
  some,
} from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
  fromWeb3JsKeypair,
  fromWeb3JsPublicKey,
} from '@metaplex-foundation/umi-web3js-adapters';

export function loadWalletKey(keypairFile: string): web3.Keypair {
  const fs = require('fs');
  const loaded = web3.Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(keypairFile).toString())),
  );
  return loaded;
}

const INITIALIZE = true;

async function main() {
  console.log("let's name some tokens in 2024!");
  const myKeypair = loadWalletKey('/Users/rvnadela/.config/solana/id.json');
  // const mint = new web3.PublicKey(
  //   'SDTHBG48VGNoGS1U2ArnvMUZ3dxyGr1F4TT1ojD4QDB',
  // );
  const mintKeypair = web3.Keypair.fromSecretKey(
    Uint8Array.from([
      225, 18, 205, 91, 83, 240, 164, 204, 102, 179, 127, 38, 207, 200, 184,
      151, 147, 69, 76, 19, 74, 255, 155, 138, 172, 4, 132, 118, 104, 232, 12,
      133, 6, 169, 70, 189, 47, 82, 47, 107, 36, 33, 222, 122, 116, 37, 123,
      235, 237, 197, 80, 47, 14, 116, 39, 184, 24, 32, 250, 75, 7, 108, 238, 98,
    ]),
  );
  const mint = mintKeypair.publicKey;

  console.log('mint.publicKey =', mint.toBase58());
  console.log('myKeypair.publicKey =', myKeypair.publicKey.toBase58());

  // const umi = createUmi('http://127.0.0.1:8899');
  const umi = createUmi('https://api.devnet.solana.com');
  const signer = createSignerFromKeypair(umi, fromWeb3JsKeypair(myKeypair));
  umi.use(signerIdentity(signer, true));

  const ourMetadata = {
    // TODO change those values!
    name: '8chain Token',
    symbol: '8CHAIN',
    uri: 'https://raw.githubusercontent.com/loopcreativeandy/video-tutorial-resources/main/metadataUpdate/metadata.json',
  };
  const onChainData = {
    ...ourMetadata,
    // we don't need that
    sellerFeeBasisPoints: 0,
    creators: none<Creator[]>(),
    collection: none<Collection>(),
    uses: none<Uses>(),
  };
  // if (INITIALIZE) {
  const accounts: CreateMetadataAccountV3InstructionAccounts = {
    mint: fromWeb3JsPublicKey(mint),
    mintAuthority: signer,
    updateAuthority: signer,
  };
  const data: CreateMetadataAccountV3InstructionDataArgs = {
    isMutable: true,
    collectionDetails: null,
    data: onChainData,
  };
  console.log('accounts =', accounts);
  console.log('data =', data);
  const txid = await createMetadataAccountV3(umi, {
    ...accounts,
    ...data,
  }).sendAndConfirm(umi);
  console.log(txid);
  console.log('SULOD');
  // } else {
  //   const data: UpdateMetadataAccountV2InstructionData = {
  //     data: some(onChainData),
  //     discriminator: 0,
  //     isMutable: some(true),
  //     newUpdateAuthority: none<PublicKey>(),
  //     primarySaleHappened: none<boolean>(),
  //   };
  //   const accounts: UpdateMetadataAccountV2InstructionAccounts = {
  //     metadata: findMetadataPda(umi, { mint: fromWeb3JsPublicKey(mint) }),
  //     updateAuthority: signer,
  //   };
  //   const txid = await updateMetadataAccountV2(umi, {
  //     ...accounts,
  //     ...data,
  //   }).sendAndConfirm(umi);
  //   console.log(txid);
  // }
}

main();
