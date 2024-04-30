use anchor_lang::prelude::*;
use anchor_spl::token::{close_account, transfer};

use account::*;

mod account;

declare_id!("3BJ7Lxq6ayB6P5JrBkNDWDL9EpWv7TYXn8qQjkyV995k");

#[program]
pub mod escrow {
    use super::*;

    pub fn start_escrow(
        ctx: Context<StartEscrow>,
        token_amount: u64,
        lamport_amount: u64,
        tx_fee: u8,
    ) -> Result<()> {
        let escrow_account = &mut ctx.accounts.escrow_account;
        escrow_account.seller_pk = *ctx.accounts.seller.key;
        escrow_account.management_pk = *ctx.accounts.management.key;
        escrow_account.token_mint_pk = ctx.accounts.token_mint_pk.key();
        escrow_account.seller_token_account = ctx.accounts.seller_token_account.key();
        escrow_account.token_amount = token_amount;
        escrow_account.lamport_amount = lamport_amount;
        escrow_account.tx_fee = tx_fee;

        // transfer buyer's token to vault
        transfer(ctx.accounts.transfer_seller_to_vault(), token_amount)?;

        Ok(())
    }

    pub fn cancel_escrow(ctx: Context<CancelEscrow>, bump: u8) -> Result<()> {
        let escrow_account = &ctx.accounts.escrow_account;
        let signer_seeds: &[&[&[u8]]] = &[&[b"vault_owner", &[bump]]];
        // transfer tokens back from vault to user
        transfer(
            ctx.accounts
                .transfer_vault_to_seller()
                .with_signer(signer_seeds),
            escrow_account.token_amount,
        )?;
        // close vault account
        close_account(ctx.accounts.close_vault_account().with_signer(signer_seeds))?;
        Ok(())
    }

    pub fn exchange(ctx: Context<Exchange>, bump: u8) -> Result<()> {
        let escrow_account = &ctx.accounts.escrow_account;
        let signer_seeds: &[&[&[u8]]] = &[&[b"vault_owner", &[bump]]];

        // Calculate transaction fee
        let fee_amount = (escrow_account.lamport_amount as f64 * escrow_account.tx_fee as f64 / 100.0) as u64;

        // Deduct transaction fee from the amount
        let amount_after_fee = escrow_account.lamport_amount - fee_amount;

        // transfer sol from buyer to seller
        match ctx.accounts.transfer_lamports(
            ctx.accounts.buyer.to_account_info().clone(),
            ctx.accounts.seller.to_account_info().clone(),
            amount_after_fee,
            ctx.accounts.system_program.clone(),
        ) {
            Ok(_) => (),
            Err(err) => return Err(err.into()),
        };

        // transfer token from vault to buyer token account
        transfer(
            ctx.accounts
                .transfer_token(
                    *ctx.accounts.token_vault.clone(),
                    *ctx.accounts.buyer_token_account.clone(),
                    ctx.accounts.vault_owner.to_account_info(),
                )
                .with_signer(signer_seeds),
                escrow_account.token_amount,
        )?;

        // transfer sol from buyer to management
        match ctx.accounts.transfer_lamports(
            ctx.accounts.buyer.to_account_info().clone(),
            ctx.accounts.management.to_account_info().clone(),
            fee_amount,
            ctx.accounts.system_program.clone(),
        ) {
            Ok(_) => (),
            Err(err) => return Err(err.into()),
        };

        // close vault account
        close_account(ctx.accounts.close_vault_account().with_signer(signer_seeds))?;
        Ok(())
    }
}