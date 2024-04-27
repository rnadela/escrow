use anchor_lang::prelude::*;
use anchor_spl::token::{CloseAccount, Mint, Token, TokenAccount, Transfer};
use anchor_lang::solana_program::{program::invoke_signed, system_instruction};

#[account]
pub struct EscrowInfo {
    // Seller is the initializer, only they can cancel the escrow, this would be used in constraints later
    pub seller_pk: Pubkey,
    // To receive transaction fee.  This will be used in the constraints later when cancelling the escrow
    pub management_pk: Pubkey,
    // To check if user sending correct token account (in constrains)
    pub token_mint_pk: Pubkey,
    // The account where to do cpi transfer when buyer completes swap
    pub seller_token_account: Pubkey,
    // The account that would receive tokens when swap is cancelled
    pub buyer_token_account: Pubkey,
    // amount of token the seller wants to swap
    pub token_amount: u64,
    // amount of sol asked by seller to complete the escrow
    pub lamport_amount: u64,
    // Fee amount
    pub tx_fee: u8,
}

#[derive(Accounts)]
pub struct StartEscrow<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,

    #[account(mut)]
    pub management: Signer<'info>,

    // https://stackoverflow.com/a/70747730/18511546
    #[account(init, payer=seller, space=8+8+8+32+32+32+32+32+32)]
    pub escrow_account: Box<Account<'info, EscrowInfo>>,

    #[account(mut)]
    pub token_mint_pk: Box<Account<'info, Mint>>,

    #[account(mut, constraint=seller_token_account.mint == token_mint_pk.key())]
    pub seller_token_account: Box<Account<'info, TokenAccount>>,

    #[account(init,payer=seller,
        seeds=[
            b"token_vault".as_ref(),
            &seller.to_account_info().key.clone().to_bytes(),
            &token_mint_pk.to_account_info().key().clone().to_bytes()
        ],
        bump,token::mint=token_mint_pk,token::authority=vault_owner)]
    pub token_vault: Box<Account<'info, TokenAccount>>,

    /// CHECK: none
    #[account(seeds=[b"vault_owner".as_ref()],bump)]
    pub vault_owner: AccountInfo<'info>,

    pub system_program: Program<'info, System>,

    pub token_program: Program<'info, Token>,

    pub rent: Sysvar<'info, Rent>,
}

impl<'info> StartEscrow<'info> {
    pub fn transfer_seller_to_vault(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.seller_token_account.to_account_info().clone(),
                to: self.token_vault.to_account_info().clone(),
                authority: self.seller.to_account_info().clone(),
            },
        )
    }
}

#[derive(Accounts)]
pub struct CancelEscrow<'info> {
    #[account(mut, constraint=escrow_account.seller_pk == *payer.key || escrow_account.management_pk == *payer.key)]
    pub payer: Signer<'info>,

    // https://stackoverflow.com/a/70747730/18511546
    pub escrow_account: Box<Account<'info, EscrowInfo>>,

    #[account(mut)]
    pub buyer_token_account: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub token_vault: Box<Account<'info, TokenAccount>>,

    /// CHECK: none
    #[account(mut)]
    pub vault_owner: AccountInfo<'info>,

    pub system_program: Program<'info, System>,

    pub token_program: Program<'info, Token>,

    pub rent: Sysvar<'info, Rent>,
}

impl<'info> CancelEscrow<'info> {
    pub fn transfer_vault_to_user1(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.token_vault.to_account_info().clone(),
                to: self.buyer_token_account.to_account_info().clone(),
                authority: self.vault_owner.to_account_info(),
            },
        )
    }

    pub fn close_vault_account(&self) -> CpiContext<'_, '_, '_, 'info, CloseAccount<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            CloseAccount {
                account: self.token_vault.to_account_info().clone(),
                destination: self.payer.to_account_info().clone(),
                authority: self.vault_owner.to_account_info().clone(),
            },
        )
    }
}

#[derive(Accounts)]
pub struct Exchange<'info> {
    #[account(mut, constraint=escrow_account.seller_pk == *seller.key)]
    pub seller: Signer<'info>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(mut, constraint=escrow_account.management_pk == *management.key)]
    pub management: Signer<'info>,

    // https://stackoverflow.com/a/70747730/18511546
    #[account(mut, constraint=escrow_account.lamport_amount <= buyer.to_account_info().lamports())]
    pub escrow_account: Box<Account<'info, EscrowInfo>>,

    #[account(mut, constraint=buyer_token_account.mint == escrow_account.token_mint_pk.key())]
    pub buyer_token_account: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub token_vault: Box<Account<'info, TokenAccount>>,

    /// CHECK: none
    #[account(mut)]
    pub vault_owner: AccountInfo<'info>,

    pub system_program: Program<'info, System>,

    pub token_program: Program<'info, Token>,

    pub rent: Sysvar<'info, Rent>,
}

impl<'info> Exchange<'info> {
    pub fn transfer_token(
        &self,
        from: Account<'info, TokenAccount>,
        to: Account<'info, TokenAccount>,
        authority: AccountInfo<'info>,
    ) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: from.to_account_info().clone(),
                to: to.to_account_info().clone(),
                authority: authority.clone(),
            },
        )
    }

    pub fn transfer_lamports(
        &self,
        from: AccountInfo<'info>,
        to: AccountInfo<'info>,
        amount: u64,
        system_program: Program<'info, System>,
    ) -> Result<()> {
        // Invoke the transfer instruction
        invoke_signed(
            &system_instruction::transfer(from.key, to.key, amount),
            &[
                from.to_account_info(),
                to.clone(),
                system_program.to_account_info(),
            ],
            &[],
        )?;

        Ok(())
    }

    pub fn close_vault_account(&self) -> CpiContext<'_, '_, '_, 'info, CloseAccount<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            CloseAccount {
                account: self.token_vault.to_account_info().clone(),
                destination: self.seller.to_account_info().clone(),
                authority: self.vault_owner.clone(),
            },
        )
    }
}