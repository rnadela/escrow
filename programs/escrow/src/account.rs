use anchor_lang::prelude::*;
use anchor_spl::token::{CloseAccount, Mint, Token, TokenAccount, Transfer};

#[account]
pub struct EscrowInfo {
    // why not user2_kp? because user1 is the initializer, only they can cancel the escrow, this would be used in constraints later
    pub user1_kp: Pubkey,
    // to check if user sending correct token account (in constrains)
    pub token1_mint: Pubkey,
    // to know what token to expect from user2
    pub token2_mint: Pubkey,
    // the account that would receive tokens when swap is cancelled
    pub user1_token1: Pubkey,
    // where to do cpi transfer when user2 completes swap
    pub user1_token2: Pubkey,
    // why nothing for user2?
    // no need of their info
    pub token1_amount: u64,
    // amount of token2 asked by user1 to complete the escrow
    pub token2_amount: u64,
}

#[derive(Accounts)]
pub struct StartEscrow<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    // https://stackoverflow.com/a/70747730/18511546
    #[account(init, payer=payer, space=8+8+8+32+32+32+32+32+32)]
    pub escrow_account: Box<Account<'info, EscrowInfo>>,

    pub token1_mint: Box<Account<'info, Mint>>,

    pub token2_mint: Box<Account<'info, Mint>>,

    #[account(mut, constraint=user1_token1.mint == token1_mint.key())]
    pub user1_token1: Box<Account<'info, TokenAccount>>,

    #[account(mut, constraint=user1_token2.mint == token2_mint.key())]
    pub user1_token2: Box<Account<'info, TokenAccount>>,

    #[account(init,payer=payer,
        seeds=[b"token1_vault".as_ref(),&payer.to_account_info().key.clone().to_bytes(),&token1_mint.to_account_info().key().clone().to_bytes()],
        bump,token::mint=token1_mint,token::authority=vault_owner)]
    pub token1_vault: Box<Account<'info, TokenAccount>>,

    // Why no token2 vault?
    // well, because we don't need one,
    // look, if we store token1 in the vault and when the "other user/user2" does exchange directly transfer tokens to user1 using CPI
    // and transfer vault tokens to "other user/user2"
    /// CHECK: none
    #[account(seeds=[b"vault_owner".as_ref()],bump)]
    pub vault_owner: AccountInfo<'info>,

    pub system_program: Program<'info, System>,

    pub token_program: Program<'info, Token>,

    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct CancelEscrow<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    // https://stackoverflow.com/a/70747730/18511546
    pub escrow_account: Box<Account<'info, EscrowInfo>>,

    #[account(mut)]
    pub user1_token1: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub token1_vault: Box<Account<'info, TokenAccount>>,

    /// CHECK: none
    #[account(mut)]
    pub vault_owner: AccountInfo<'info>,

    pub system_program: Program<'info, System>,

    pub token_program: Program<'info, Token>,

    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Exchange<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    // https://stackoverflow.com/a/70747730/18511546
    #[account(mut, constraint=escrow_account.token2_amount <= user2_token2.amount)]
    pub escrow_account: Box<Account<'info, EscrowInfo>>,

    #[account(mut)]
    pub user1_token1: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub user1_token2: Box<Account<'info, TokenAccount>>,

    #[account(mut,constraint=user2_token1.mint == escrow_account.token1_mint.key())]
    pub user2_token1: Box<Account<'info, TokenAccount>>,

    #[account(mut,constraint=user2_token2.mint == escrow_account.token2_mint.key())]
    pub user2_token2: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub token1_vault: Box<Account<'info, TokenAccount>>,

    /// CHECK: none
    #[account(mut)]
    pub vault_owner: AccountInfo<'info>,

    pub system_program: Program<'info, System>,

    pub token_program: Program<'info, Token>,

    pub rent: Sysvar<'info, Rent>,
}

impl<'info> StartEscrow<'info> {
    pub fn transfer_user1_to_vault(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.user1_token1.to_account_info().clone(),
                to: self.token1_vault.to_account_info().clone(),
                authority: self.payer.to_account_info().clone(),
            },
        )
    }
}

impl<'info> CancelEscrow<'info> {
    pub fn transfer_vault_to_user1(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.token1_vault.to_account_info().clone(),
                to: self.user1_token1.to_account_info().clone(),
                authority: self.vault_owner.to_account_info(),
            },
        )
    }

    pub fn close_vault_account(&self) -> CpiContext<'_, '_, '_, 'info, CloseAccount<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            CloseAccount {
                account: self.token1_vault.to_account_info().clone(),
                destination: self.payer.to_account_info().clone(),
                authority: self.vault_owner.to_account_info().clone(),
            },
        )
    }
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

    pub fn close_vault_account(&self) -> CpiContext<'_, '_, '_, 'info, CloseAccount<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            CloseAccount {
                account: self.token1_vault.to_account_info().clone(),
                destination: self.payer.to_account_info().clone(),
                authority: self.vault_owner.clone(),
            },
        )
    }
}