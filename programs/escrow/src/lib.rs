use anchor_lang::prelude::*;
use anchor_spl::token::{close_account, transfer};

use account::*;

mod account;

// declare_id!("9YpTMBz1LpZvsURZJgBGVXsDP5sTvbkohue8FprXoPMq");
declare_id!("477diHYmbhJsuaLanLaYpiSCqfc89k2UCW9cMTvhv8Ho");

#[program]
pub mod escrow {
    use super::*;

    pub fn start_escrow(
        ctx: Context<StartEscrow>,
        token1_amount: u64,
        token2_amount: u64,
    ) -> Result<()> {
        let escrow_account = &mut ctx.accounts.escrow_account;
        escrow_account.user1_kp = *ctx.accounts.payer.key;
        escrow_account.token1_mint = ctx.accounts.token1_mint.key();
        escrow_account.token2_mint = ctx.accounts.token2_mint.key();
        escrow_account.user1_token1 = ctx.accounts.user1_token1.key();
        escrow_account.user1_token2 = ctx.accounts.user1_token1.key();
        escrow_account.token1_amount = token1_amount;
        escrow_account.token2_amount = token2_amount;
        // transfer user 1's token1 to vault
        transfer(ctx.accounts.transfer_user1_to_vault(), token1_amount)?;
        Ok(())
    }

    pub fn cancel_escrow(ctx: Context<CancelEscrow>, bump: u8) -> Result<()> {
        let escrow_account = &ctx.accounts.escrow_account;
        let signer_seeds: &[&[&[u8]]] = &[&[b"vault_owner", &[bump]]];
        // transfer tokens back from vault to user
        transfer(
            ctx.accounts
                .transfer_vault_to_user1()
                .with_signer(signer_seeds),
            escrow_account.token1_amount,
        )?;
        // close vault account
        close_account(ctx.accounts.close_vault_account().with_signer(signer_seeds))?;
        Ok(())
    }

    pub fn exchange(ctx: Context<Exchange>, bump: u8) -> Result<()> {
        let escrow_account = &ctx.accounts.escrow_account;
        let signer_seeds: &[&[&[u8]]] = &[&[b"vault_owner", &[bump]]];
        // transfer token2 from user2 to user 1 token2
        transfer(
            ctx.accounts.transfer_token(
                *ctx.accounts.user2_token2.clone(),
                *ctx.accounts.user1_token2.clone(),
                ctx.accounts.payer.to_account_info(),
            ),
            escrow_account.token2_amount,
        )?;
        // transfer token1 from vault to user 2 token1
        transfer(
            ctx.accounts
                .transfer_token(
                    *ctx.accounts.token1_vault.clone(),
                    *ctx.accounts.user2_token1.clone(),
                    ctx.accounts.vault_owner.to_account_info(),
                )
                .with_signer(signer_seeds),
            escrow_account.token1_amount,
        )?;
        // close vault account
        close_account(ctx.accounts.close_vault_account().with_signer(signer_seeds))?;
        Ok(())
    }
}