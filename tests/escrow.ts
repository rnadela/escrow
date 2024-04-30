import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Escrow } from '../target/types/escrow';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
  createMint,
  createAccount,
  getAssociatedTokenAddress,
  mintTo,
  getAccount,
} from '@solana/spl-token';

describe('escrow', () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Escrow as Program<Escrow>;

  const connection = new Connection('http://localhost:8899');

  // AbcDbAtTHiYuaHstpFYxhLh5Uaro6dWns9qWEFxSL3pp
  const management = anchor.web3.Keypair.fromSecretKey(
    Uint8Array.from([
      244, 226, 83, 156, 243, 47, 93, 223, 1, 170, 155, 138, 214, 56, 77, 199,
      86, 129, 78, 64, 225, 205, 6, 212, 208, 9, 118, 35, 149, 179, 230, 146,
      142, 150, 191, 249, 45, 133, 152, 129, 131, 153, 155, 104, 145, 77, 121,
      234, 6, 24, 205, 238, 36, 80, 149, 70, 48, 147, 19, 132, 144, 101, 95, 5,
    ]),
  );

  // A1c9rbFZbTdDLykG9bvmRFGDQFa8vpqfxiA6o11ZzCxX
  const seller = anchor.web3.Keypair.fromSecretKey(
    Uint8Array.from([
      1, 139, 208, 25, 121, 0, 213, 22, 42, 154, 137, 145, 102, 201, 39, 153,
      66, 243, 252, 7, 64, 35, 241, 7, 191, 152, 63, 19, 38, 163, 254, 20, 133,
      224, 237, 249, 169, 18, 187, 149, 47, 192, 147, 23, 58, 118, 91, 168, 131,
      184, 23, 185, 227, 45, 100, 78, 54, 129, 64, 243, 189, 52, 128, 8,
    ]),
  );
  // Token Account
  // H5o13aehvCPdbDTURFcC1y5PXaPwvtaURbRwLNH9jMAY

  // BobbPz2zxsSPYV2u9FswCRxNXKk27StJ5gudKTeK9LkW
  const buyer = anchor.web3.Keypair.fromSecretKey(
    Uint8Array.from([
      83, 164, 161, 125, 16, 46, 120, 205, 69, 44, 33, 241, 178, 56, 173, 16,
      171, 247, 223, 37, 111, 101, 137, 61, 234, 249, 63, 8, 163, 43, 237, 24,
      160, 132, 179, 113, 200, 45, 126, 117, 81, 191, 37, 59, 120, 253, 235,
      166, 65, 162, 136, 73, 76, 98, 226, 97, 100, 234, 73, 188, 155, 50, 215,
      135,
    ]),
  );
  // Token Account
  // 4VHEo5gkgLZeo2soRnkWGiHnRhLhCzcN3AUJjEpJqos5

  const ESCROW_ACCOUNT_KP = [
    // 38MWzLvaxmmyePpSHpD2TzxfEyYQNcfsJHjLF9yda1JT
    Uint8Array.from([
      37, 171, 117, 64, 240, 87, 193, 71, 196, 107, 14, 217, 246, 48, 23, 147,
      134, 188, 153, 39, 100, 207, 250, 3, 5, 200, 102, 249, 106, 225, 71, 8,
      31, 153, 163, 98, 4, 44, 178, 175, 117, 179, 105, 235, 168, 95, 237, 86,
      195, 25, 90, 88, 163, 35, 225, 94, 234, 221, 44, 91, 75, 61, 216, 92,
    ]),
    // 38MWzLvaxmmyePpSHpD2TzxfEyYQNcfsJHjLF9yda1JT
    Uint8Array.from([
      96, 31, 211, 116, 9, 23, 206, 64, 230, 25, 59, 5, 36, 219, 105, 177, 23,
      204, 94, 202, 191, 139, 215, 75, 177, 107, 215, 126, 107, 134, 110, 158,
      184, 189, 55, 248, 196, 179, 212, 119, 64, 201, 183, 1, 158, 210, 42, 106,
      20, 206, 45, 240, 58, 173, 166, 51, 209, 105, 212, 91, 149, 179, 148, 201,
    ]),
  ];
  const escrow_account = anchor.web3.Keypair.fromSecretKey(
    ESCROW_ACCOUNT_KP[0],
  );

  // T19zWQLv1pRRfd5rvHdSL1svxg6pHtZSX7PEn6CHkZ7
  const token_mint_kp = anchor.web3.Keypair.fromSecretKey(
    Uint8Array.from([
      225, 18, 205, 91, 83, 240, 164, 204, 102, 179, 127, 38, 207, 200, 184,
      151, 147, 69, 76, 19, 74, 255, 155, 138, 172, 4, 132, 118, 104, 232, 12,
      133, 6, 169, 70, 189, 47, 82, 47, 107, 36, 33, 222, 122, 116, 37, 123,
      235, 237, 197, 80, 47, 14, 116, 39, 184, 24, 32, 250, 75, 7, 108, 238, 98,
    ]),
  );

  // it('generate escrow account keypair', async () => {
  //   console.log('keypair =', anchor.web3.Keypair.generate().secretKey);
  // });

  afterEach(async () => {
    console.log('Sleeping for 5 seconds');
    return new Promise<void>((resolve) =>
      setTimeout(() => {
        console.log('Awake!');
        resolve();
      }, 5000),
    );
  });

  // it('request airdrops', async () => {
  //   console.log(
  //     'escrow_account.publicKey =',
  //     escrow_account.publicKey.toBase58(),
  //   );
  //   await connection.requestAirdrop(management.publicKey, 2 * LAMPORTS_PER_SOL);
  //   await connection.requestAirdrop(seller.publicKey, 1 * LAMPORTS_PER_SOL);
  //   await connection.requestAirdrop(buyer.publicKey, 1000 * LAMPORTS_PER_SOL);

  //   console.log('Sleeping for 20 seconds');
  //   return new Promise<void>((resolve) =>
  //     setTimeout(() => {
  //       console.log('Awake!');
  //       resolve();
  //     }, 20000),
  //   );
  // });

  // it('create token mint', async () => {
  //   const mint_pk = await createMint(
  //     connection,
  //     management,
  //     management.publicKey,
  //     management.publicKey,
  //     0,
  //     token_mint_kp,
  //   );
  //   console.log(`Mint - ${mint_pk}`);
  // });

  // // it('check if seller has token account existing', async () => {
  // //   const seller_token_acccount_pk = await getAssociatedTokenAddress(
  // //     token_mint_kp.publicKey,
  // //     seller.publicKey,
  // //   );
  // //   console.log(
  // //     'seller_token_acccount_kp =',
  // //     seller_token_acccount_pk.toBase58(),
  // //   );

  // //   try {
  // //     const account = await getAccount(connection, seller_token_acccount_pk);
  // //     console.log('seller_account =', account);
  // //   } catch (error) {
  // //     console.log('error =', error);
  // //   }
  // // });

  // // it('check if buyer has token account existing', async () => {
  // //   const buyer_token_acccount_pk = await getAssociatedTokenAddress(
  // //     token_mint_kp.publicKey,
  // //     buyer.publicKey,
  // //   );
  // //   console.log(
  // //     'buyer_token_acccount_kp =',
  // //     buyer_token_acccount_pk.toBase58(),
  // //   );

  // //   try {
  // //     const account = await getAccount(connection, buyer_token_acccount_pk);
  // //     console.log('buyer_account =', account);
  // //   } catch (error) {
  // //     console.log('error =', error);
  // //   }
  // // });

  // it('create token account for seller', async () => {
  //   const seller_token_account_kp = await createAccount(
  //     connection,
  //     seller,
  //     token_mint_kp.publicKey,
  //     seller.publicKey,
  //   );
  //   console.log(
  //     `Newly created ata for seller - ${seller_token_account_kp} for mint - ${token_mint_kp.publicKey}`,
  //   );
  // });

  // it('create token account for buyer', async () => {
  //   const buyer_token_account_kp = await createAccount(
  //     connection,
  //     buyer,
  //     token_mint_kp.publicKey,
  //     buyer.publicKey,
  //   );
  //   console.log(
  //     `Newly created ata for buyer - ${buyer_token_account_kp} for mint - ${token_mint_kp.publicKey}`,
  //   );
  // });

  // it('mint tokens for seller', async () => {
  //   const token_amount = 10_000;

  //   const seller_token_acccount_pk = await getAssociatedTokenAddress(
  //     token_mint_kp.publicKey,
  //     seller.publicKey,
  //   );
  //   console.log(
  //     'seller_token_acccount_pk =',
  //     seller_token_acccount_pk.toBase58(),
  //   );
  //   const tx1 = await mintTo(
  //     connection,
  //     seller,
  //     token_mint_kp.publicKey,
  //     seller_token_acccount_pk,
  //     management,
  //     token_amount,
  //   );
  //   console.log(
  //     `MintTo - ${token_amount} tokens of mint - ${token_mint_kp.publicKey} were minted to - ${seller_token_acccount_pk}\ntx hash - ${tx1}`,
  //   );
  // });

  // it('create new escrow', async () => {
  //   const token_amount_to_sell = 5000;
  //   const lamport_amount = 100 * LAMPORTS_PER_SOL; // 20 SOL

  //   try {
  //     const seller_token_account = await getAssociatedTokenAddress(
  //       token_mint_kp.publicKey,
  //       seller.publicKey,
  //     );
  //     const tx = await program.methods
  //       .startEscrow(
  //         new anchor.BN(token_amount_to_sell),
  //         new anchor.BN(lamport_amount),
  //         1, // 1% transaction fee
  //       )
  //       .accounts({
  //         seller: seller.publicKey,
  //         management: management.publicKey,
  //         escrowAccount: escrow_account.publicKey,
  //         tokenMintPk: token_mint_kp.publicKey,
  //         sellerTokenAccount: seller_token_account,
  //         tokenVault: PublicKey.findProgramAddressSync(
  //           [
  //             Uint8Array.from(get_seeds('token_vault')),
  //             seller.publicKey.toBytes(),
  //             token_mint_kp.publicKey.toBytes(),
  //           ],
  //           program.programId,
  //         )[0],
  //         vaultOwner: PublicKey.findProgramAddressSync(
  //           [Uint8Array.from(get_seeds('vault_owner'))],
  //           program.programId,
  //         )[0],
  //       })
  //       .signers([seller, management, escrow_account])
  //       .rpc();
  //     console.log('Your transaction signature', tx);
  //   } catch (e) {
  //     console.log(e);
  //   }
  // });

  // it('cancel escrow by buyer', async () => {
  //   try {
  //     const [vault_owner, bump] = PublicKey.findProgramAddressSync(
  //       [Uint8Array.from(get_seeds('vault_owner'))],
  //       program.programId,
  //     );
  //     const seller_token_account = await getAssociatedTokenAddress(
  //       token_mint_kp.publicKey,
  //       seller.publicKey,
  //     );
  //     const tx = await program.methods
  //       .cancelEscrow(bump)
  //       .accounts({
  //         payer: buyer.publicKey,
  //         escrowAccount: escrow_account.publicKey,
  //         sellerTokenAccount: seller_token_account,
  //         tokenVault: PublicKey.findProgramAddressSync(
  //           [
  //             Uint8Array.from(get_seeds('token_vault')),
  //             seller.publicKey.toBytes(),
  //             token_mint_kp.publicKey.toBytes(),
  //           ],
  //           program.programId,
  //         )[0],
  //         vaultOwner: vault_owner,
  //       })
  //       .signers([buyer])
  //       .rpc();
  //     console.log('Your transaction signature', tx);
  //   } catch (e) {
  //     console.log(e);
  //   }
  // });

  // it('cancel escrow by management', async () => {
  //   try {
  //     const [vault_owner, bump] = PublicKey.findProgramAddressSync(
  //       [Uint8Array.from(get_seeds('vault_owner'))],
  //       program.programId,
  //     );
  //     const seller_token_account = await getAssociatedTokenAddress(
  //       token_mint_kp.publicKey,
  //       seller.publicKey,
  //     );
  //     const tx = await program.methods
  //       .cancelEscrow(bump)
  //       .accounts({
  //         payer: management.publicKey,
  //         escrowAccount: escrow_account.publicKey,
  //         sellerTokenAccount: seller_token_account,
  //         tokenVault: PublicKey.findProgramAddressSync(
  //           [
  //             Uint8Array.from(get_seeds('token_vault')),
  //             seller.publicKey.toBytes(),
  //             token_mint_kp.publicKey.toBytes(),
  //           ],
  //           program.programId,
  //         )[0],
  //         vaultOwner: vault_owner,
  //       })
  //       .signers([management])
  //       .rpc();
  //     console.log('Your transaction signature', tx);
  //   } catch (e) {
  //     console.log(e);
  //   }
  // });

  // it('cancel escrow by seller', async () => {
  //   try {
  //     const [vault_owner, bump] = PublicKey.findProgramAddressSync(
  //       [Uint8Array.from(get_seeds('vault_owner'))],
  //       program.programId,
  //     );
  //     const seller_token_account = await getAssociatedTokenAddress(
  //       token_mint_kp.publicKey,
  //       seller.publicKey,
  //     );
  //     const tx = await program.methods
  //       .cancelEscrow(bump)
  //       .accounts({
  //         payer: seller.publicKey,
  //         escrowAccount: escrow_account.publicKey,
  //         sellerTokenAccount: seller_token_account,
  //         tokenVault: PublicKey.findProgramAddressSync(
  //           [
  //             Uint8Array.from(get_seeds('token_vault')),
  //             seller.publicKey.toBytes(),
  //             token_mint_kp.publicKey.toBytes(),
  //           ],
  //           program.programId,
  //         )[0],
  //         vaultOwner: vault_owner,
  //       })
  //       .signers([seller])
  //       .rpc();
  //     console.log('Your transaction signature', tx);
  //   } catch (e) {
  //     console.log(e);
  //   }
  // });

  // it('exchange', async () => {
  //   try {
  //     const [vault_owner, bump] = PublicKey.findProgramAddressSync(
  //       [Uint8Array.from(get_seeds('vault_owner'))],
  //       program.programId,
  //     );
  //     const buyer_token_account = await getAssociatedTokenAddress(
  //       token_mint_kp.publicKey,
  //       buyer.publicKey,
  //     );
  //     const tx = await program.methods
  //       .exchange(bump)
  //       .accounts({
  //         seller: seller.publicKey,
  //         buyer: buyer.publicKey,
  //         management: management.publicKey,
  //         escrowAccount: escrow_account.publicKey,
  //         tokenMintPk: token_mint_kp.publicKey,
  //         buyerTokenAccount: buyer_token_account,
  //         tokenVault: PublicKey.findProgramAddressSync(
  //           [
  //             Uint8Array.from(get_seeds('token_vault')),
  //             seller.publicKey.toBytes(),
  //             token_mint_kp.publicKey.toBytes(),
  //           ],
  //           program.programId,
  //         )[0],
  //         vaultOwner: vault_owner,
  //       })
  //       .signers([seller, buyer, management])
  //       .rpc();
  //     console.log('Your transaction signature', tx);
  //   } catch (e) {
  //     console.log(e);
  //   }
  // });

  // it('test', async () => {
  //   try {
  //     const tokenVault = PublicKey.findProgramAddressSync(
  //       [
  //         Uint8Array.from(get_seeds('token_vault')),
  //         seller.publicKey.toBytes(),
  //         token_mint_kp.publicKey.toBytes(),
  //       ],
  //       program.programId,
  //     )[0];
  //     console.log('tokenVault', tokenVault.toBase58());

  //     const [vault_owner, bump] = PublicKey.findProgramAddressSync(
  //       [Uint8Array.from(get_seeds('vault_owner'))],
  //       program.programId,
  //     );
  //     console.log('vault_owner', vault_owner.toBase58());
  //   } catch (e) {
  //     console.log(e);
  //   }
  // });
});

function get_seeds(seed_str: any) {
  return [...seed_str].map((char) => char.codePointAt());
}
