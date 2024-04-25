import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Escrow } from '../target/types/escrow';
import { Connection, PublicKey } from '@solana/web3.js';
import {
  createMint,
  createAccount,
  getAssociatedTokenAddress,
  mintTo,
} from '@solana/spl-token';

describe('escrow', () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Escrow as Program<Escrow>;

  const connection = new Connection('http://localhost:8899');

  // AbcDbAtTHiYuaHstpFYxhLh5Uaro6dWns9qWEFxSL3pp
  const payer = anchor.web3.Keypair.fromSecretKey(
    Uint8Array.from([
      244, 226, 83, 156, 243, 47, 93, 223, 1, 170, 155, 138, 214, 56, 77, 199,
      86, 129, 78, 64, 225, 205, 6, 212, 208, 9, 118, 35, 149, 179, 230, 146,
      142, 150, 191, 249, 45, 133, 152, 129, 131, 153, 155, 104, 145, 77, 121,
      234, 6, 24, 205, 238, 36, 80, 149, 70, 48, 147, 19, 132, 144, 101, 95, 5,
    ]),
  );

  // 38MWzLvaxmmyePpSHpD2TzxfEyYQNcfsJHjLF9yda1JT
  const escrow_account = anchor.web3.Keypair.fromSecretKey(
    Uint8Array.from([
      37, 171, 117, 64, 240, 87, 193, 71, 196, 107, 14, 217, 246, 48, 23, 147,
      134, 188, 153, 39, 100, 207, 250, 3, 5, 200, 102, 249, 106, 225, 71, 8,
      31, 153, 163, 98, 4, 44, 178, 175, 117, 179, 105, 235, 168, 95, 237, 86,
      195, 25, 90, 88, 163, 35, 225, 94, 234, 221, 44, 91, 75, 61, 216, 92,
    ]),
  );

  // T19zWQLv1pRRfd5rvHdSL1svxg6pHtZSX7PEn6CHkZ7
  const token1_mint = anchor.web3.Keypair.fromSecretKey(
    Uint8Array.from([
      225, 18, 205, 91, 83, 240, 164, 204, 102, 179, 127, 38, 207, 200, 184,
      151, 147, 69, 76, 19, 74, 255, 155, 138, 172, 4, 132, 118, 104, 232, 12,
      133, 6, 169, 70, 189, 47, 82, 47, 107, 36, 33, 222, 122, 116, 37, 123,
      235, 237, 197, 80, 47, 14, 116, 39, 184, 24, 32, 250, 75, 7, 108, 238, 98,
    ]),
  );

  // T2FN676mk3DVohfKSmxrWGa8us9F83n8c55MgodrB8o
  const token2_mint = anchor.web3.Keypair.fromSecretKey(
    Uint8Array.from([
      225, 100, 248, 153, 24, 79, 45, 221, 253, 141, 119, 17, 77, 77, 147, 124,
      170, 254, 38, 117, 78, 108, 35, 177, 55, 142, 193, 23, 231, 228, 202, 245,
      6, 170, 131, 2, 114, 126, 42, 32, 131, 200, 98, 205, 200, 109, 46, 14,
      130, 80, 82, 106, 200, 234, 54, 92, 72, 145, 92, 86, 137, 221, 69, 148,
    ]),
  );

  // A1c9rbFZbTdDLykG9bvmRFGDQFa8vpqfxiA6o11ZzCxX
  const user1 = anchor.web3.Keypair.fromSecretKey(
    Uint8Array.from([
      1, 139, 208, 25, 121, 0, 213, 22, 42, 154, 137, 145, 102, 201, 39, 153,
      66, 243, 252, 7, 64, 35, 241, 7, 191, 152, 63, 19, 38, 163, 254, 20, 133,
      224, 237, 249, 169, 18, 187, 149, 47, 192, 147, 23, 58, 118, 91, 168, 131,
      184, 23, 185, 227, 45, 100, 78, 54, 129, 64, 243, 189, 52, 128, 8,
    ]),
  );

  // BobbPz2zxsSPYV2u9FswCRxNXKk27StJ5gudKTeK9LkW
  const user2 = anchor.web3.Keypair.fromSecretKey(
    Uint8Array.from([
      83, 164, 161, 125, 16, 46, 120, 205, 69, 44, 33, 241, 178, 56, 173, 16,
      171, 247, 223, 37, 111, 101, 137, 61, 234, 249, 63, 8, 163, 43, 237, 24,
      160, 132, 179, 113, 200, 45, 126, 117, 81, 191, 37, 59, 120, 253, 235,
      166, 65, 162, 136, 73, 76, 98, 226, 97, 100, 234, 73, 188, 155, 50, 215,
      135,
    ]),
  );

  // it('logging', async () => {
  //   console.log(
  //     'escrow_account.publicKey =',
  //     escrow_account.publicKey.toBase58(),
  //   );
  //   console.log('token1_mint.publicKey =', token1_mint.publicKey.toBase58());
  //   console.log('token2_mint.publicKey =', token2_mint.publicKey.toBase58());
  // });

  // it('request airdrops', async () => {
  //   await connection.requestAirdrop(payer.publicKey, 20 * 1e9);
  //   await connection.requestAirdrop(user1.publicKey, 10 * 1e9);
  //   await connection.requestAirdrop(user2.publicKey, 10 * 1e9);
  // });

  // it('create token mint', async () => {
  //   console.log('user1.publicKey =', user1.publicKey.toBase58());
  //   console.log('user2.publicKey =', user2.publicKey.toBase58());
  //   const mint_pk1 = await createMint(
  //     connection,
  //     payer,
  //     payer.publicKey,
  //     payer.publicKey,
  //     0,
  //     token1_mint,
  //   );
  //   console.log(`Mint - ${mint_pk1}`);
  //   //
  //   const mint_pk2 = await createMint(
  //     connection,
  //     payer,
  //     payer.publicKey,
  //     payer.publicKey,
  //     0,
  //     token2_mint,
  //   );
  //   console.log(`Mint - ${mint_pk2}`);
  // });

  // it('create token accounts', async () => {
  //   const token_user1_t1_pk = await createAccount(
  //     connection,
  //     payer,
  //     token1_mint.publicKey,
  //     user1.publicKey,
  //   );
  //   console.log(
  //     `Newly created ata for user1 - ${token_user1_t1_pk} for mint - ${token1_mint.publicKey}`,
  //   );
  //   //
  //   const token_user1_t2_pk = await createAccount(
  //     connection,
  //     payer,
  //     token2_mint.publicKey,
  //     user1.publicKey,
  //   );
  //   console.log(
  //     `Newly created ata for user1 - ${token_user1_t2_pk} for mint - ${token2_mint.publicKey}`,
  //   );
  //   //
  //   const token_user2_t1_pk = await createAccount(
  //     connection,
  //     payer,
  //     token1_mint.publicKey,
  //     user2.publicKey,
  //   );
  //   console.log(
  //     `Newly created ata for user2 - ${token_user2_t1_pk} for mint - ${token1_mint.publicKey}`,
  //   );
  //   //
  //   const token_user2_t2_pk = await createAccount(
  //     connection,
  //     payer,
  //     token2_mint.publicKey,
  //     user2.publicKey,
  //   );
  //   console.log(
  //     `Newly created ata for user2 - ${token_user2_t2_pk} for mint - ${token2_mint.publicKey}`,
  //   );
  // });

  // it('mint tokens', async () => {
  //   const amount = 1;
  //   //
  //   const ata_user1_t1_pk = await getAssociatedTokenAddress(
  //     token1_mint.publicKey,
  //     user1.publicKey,
  //   );
  //   const tx1 = await mintTo(
  //     connection,
  //     payer,
  //     token1_mint.publicKey,
  //     ata_user1_t1_pk,
  //     payer,
  //     amount,
  //   );
  //   console.log(
  //     `MintTo - ${amount} tokens of mint - ${token1_mint.publicKey} were minted to - ${ata_user1_t1_pk}\ntx hash - ${tx1}`,
  //   );
  //   //
  //   const ata_user2_t2_pk = await getAssociatedTokenAddress(
  //     token2_mint.publicKey,
  //     user2.publicKey,
  //   );
  //   const tx2 = await mintTo(
  //     connection,
  //     payer,
  //     token2_mint.publicKey,
  //     ata_user2_t2_pk,
  //     payer,
  //     amount,
  //   );
  //   console.log(
  //     `MintTo - ${amount} tokens of mint - ${token2_mint.publicKey} were minted to - ${ata_user2_t2_pk}\ntx hash - ${tx2}`,
  //   );
  // });

  // it('create new escrow', async () => {
  //   try {
  //     const user1_token1 = await getAssociatedTokenAddress(
  //       token1_mint.publicKey,
  //       user1.publicKey,
  //     );
  //     const user1_token2 = await getAssociatedTokenAddress(
  //       token2_mint.publicKey,
  //       user1.publicKey,
  //     );
  //     const tx = await program.methods
  //       .startEscrow(new anchor.BN(1), new anchor.BN(1))
  //       .accounts({
  //         payer: user1.publicKey,
  //         escrowAccount: escrow_account.publicKey,
  //         token1Mint: token1_mint.publicKey,
  //         token2Mint: token2_mint.publicKey,
  //         user1Token1: user1_token1,
  //         user1Token2: user1_token2,
  //         token1Vault: PublicKey.findProgramAddressSync(
  //           [
  //             Uint8Array.from(get_seeds('token1_vault')),
  //             user1.publicKey.toBytes(),
  //             token1_mint.publicKey.toBytes(),
  //           ],
  //           program.programId,
  //         )[0],
  //         vaultOwner: PublicKey.findProgramAddressSync(
  //           [Uint8Array.from(get_seeds('vault_owner'))],
  //           program.programId,
  //         )[0],
  //       })
  //       .signers([user1, escrow_account])
  //       .rpc();
  //     console.log('Your transaction signature', tx);
  //   } catch (e) {
  //     console.log(e);
  //   }
  // });

  // it('cancel escrow', async () => {
  //   try {
  //     const [vault_owner, bump] = PublicKey.findProgramAddressSync(
  //       [Uint8Array.from(get_seeds('vault_owner'))],
  //       program.programId,
  //     );
  //     const user1_token1 = await getAssociatedTokenAddress(
  //       token1_mint.publicKey,
  //       user1.publicKey,
  //     );
  //     const tx = await program.methods
  //       .cancelEscrow(bump)
  //       .accounts({
  //         payer: user1.publicKey,
  //         escrowAccount: escrow_account.publicKey,
  //         user1Token1: user1_token1,
  //         token1Vault: PublicKey.findProgramAddressSync(
  //           [
  //             Uint8Array.from(get_seeds('token1_vault')),
  //             user1.publicKey.toBytes(),
  //             token1_mint.publicKey.toBytes(),
  //           ],
  //           program.programId,
  //         )[0],
  //         vaultOwner: vault_owner,
  //       })
  //       .signers([user1])
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
  //     const user1_token1 = await getAssociatedTokenAddress(
  //       token1_mint.publicKey,
  //       user1.publicKey,
  //     );
  //     const user1_token2 = await getAssociatedTokenAddress(
  //       token2_mint.publicKey,
  //       user1.publicKey,
  //     );
  //     const user2_token1 = await getAssociatedTokenAddress(
  //       token1_mint.publicKey,
  //       user2.publicKey,
  //     );
  //     const user2_token2 = await getAssociatedTokenAddress(
  //       token2_mint.publicKey,
  //       user2.publicKey,
  //     );
  //     console.log('user1_token1 =', user1_token1);
  //     console.log('user1_token2 =', user1_token2);
  //     console.log('user2_token1 =', user2_token1);
  //     console.log('user2_token2 =', user2_token2);
  //     const tx = await program.methods
  //       .exchange(bump)
  //       .accounts({
  //         payer: user2.publicKey,
  //         escrowAccount: escrow_account.publicKey,
  //         user1Token1: user1_token1,
  //         user1Token2: user1_token2,
  //         user2Token1: user2_token1,
  //         user2Token2: user2_token2,
  //         token1Vault: PublicKey.findProgramAddressSync(
  //           [
  //             Uint8Array.from(get_seeds('token1_vault')),
  //             user1.publicKey.toBytes(),
  //             token1_mint.publicKey.toBytes(),
  //           ],
  //           program.programId,
  //         )[0],
  //         vaultOwner: vault_owner,
  //       })
  //       .signers([user2])
  //       .rpc();
  //     console.log('Your transaction signature', tx);
  //   } catch (e) {
  //     console.log(e);
  //   }
  // });
});

function get_seeds(seed_str: any) {
  return [...seed_str].map((char) => char.codePointAt());
}
